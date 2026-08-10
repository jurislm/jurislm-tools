---
name: spectra-archive
description: "Archive a completed change"
effort: low
license: MIT
compatibility: Requires spectra CLI.
metadata:
  author: spectra
  version: "1.0"
  generatedBy: "Spectra"
---

Archive a completed change.

**Input**: Optionally specify a change name after `/spectra-archive` (e.g., `/spectra-archive add-auth`). If omitted, infer it from conversation context when exactly one active change is clearly identified. Only prompt for available changes when no name can be inferred or multiple candidates remain.

**Prerequisites**: This skill requires the `spectra` CLI. If any `spectra` command fails with "command not found" or similar, report the error and STOP.

**Steps**

1. **Select the change**

   If the name is clear from the input or conversation context, use it directly.
   Otherwise, run `spectra list --json` to get active changes and use the
   **AskUserQuestion tool** to let the user select. Show only active changes and
   include the schema used for each change when available. Do not guess when
   multiple candidates remain.

   Before reading status or constructing any path, run `spectra list --json` and
   require the selected value to be an exact active change name returned by the
   CLI. Reject names containing path separators, `..`, or any value that does
   not match `^[a-z0-9]+(?:-[a-z0-9]+)*$`; never use an unvalidated argument as a
   filesystem path.

2. **Check artifact completion status**

   Run `spectra status --change "<name>" --json` to check artifact completion.

   Parse the JSON to understand:
   - `schemaName`: The workflow being used
   - `artifacts`: List of artifacts with their status (`done` or other)

   **If any artifacts are not `done`:**
   - Display warning listing incomplete artifacts
   - Prompt user for confirmation to continue
   - Proceed if user confirms

3. **Check task completion status**

   Read the tasks file (typically `tasks.md`) to check for incomplete tasks.

   Count tasks marked with `- [ ]` (incomplete) vs `- [x]` (complete).

   **If incomplete tasks found:**
   - Display warning showing count of incomplete tasks
   - Prompt user for confirmation to continue
   - Proceed if user confirms

   **If no tasks file exists:** Proceed without task-related warning.

4. **Assess delta spec sync state**

   Check for delta specs at `openspec/changes/<name>/specs/`. If none exist, proceed without sync prompt.

   **If delta specs exist:**
   - Compare each delta spec with its corresponding main spec at `openspec/specs/<capability>/spec.md`
   - Determine what changes would be applied (adds, modifications, removals, renames)
   - Show a combined summary before prompting

   **Prompt options:**
   - If changes needed: "Sync now (recommended)", "Archive without syncing"
   - If already synced: "Archive now", "Sync anyway", "Cancel"

   - **Sync now**: invoke the repository's `openspec-sync-specs` Skill for
     `<name>`, wait for successful synchronization, then archive with
     `--skip-specs`.
   - **Archive without syncing**: archive with `--skip-specs`.
   - **Cancel**: stop the workflow immediately; do not archive.

   If synchronization fails, report the failure and stop without archiving.

5. **Perform the archive**

   Use the `spectra archive` CLI command which handles the full archive workflow
   (spec snapshot, delta application, @trace injection, identity recording, vector indexing):

   ```bash
   spectra archive <name> --skip-specs
   ```

   **Optional flags:**
   - `--mark-tasks-complete` — mark all incomplete tasks as complete before archiving

   **If archive fails** for any reason, preserve `.spectra/touched/<change-name>.json`
   and report the error. If it fails with "already exists", suggest renaming the
   existing archive.

   After archive succeeds, remove the tracking file if it exists. Use only the
   validated change name; resolve `.spectra/touched/<name>.json` and require its
   canonical parent to equal the canonical `.spectra/touched` directory before
   deleting it with `rm --`. Preserve the file when archive fails.

   ```bash
   rm -- .spectra/touched/<validated-change-name>.json
   ```

6. **Display summary**

   Show archive completion summary including:
   - Change name
   - Schema that was used
   - Archive location
   - Spec sync status (synced / sync skipped / no delta specs)
   - Note about any warnings (incomplete artifacts/tasks)

**Output On Success**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** ✓ Synced to main specs

All artifacts complete. All tasks complete.
```

**Output On Success (No Delta Specs)**

```
## Archive Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** No delta specs

All artifacts complete. All tasks complete.
```

**Output On Success With Warnings**

```
## Archive Complete (with warnings)

**Change:** <change-name>
**Schema:** <schema-name>
**Archived to:** openspec/changes/archive/YYYY-MM-DD-<name>/
**Specs:** Sync skipped (user chose to skip)

**Warnings:**
- Archived with 2 incomplete artifacts
- Archived with 3 incomplete tasks
- Delta spec sync was skipped (user chose to skip)

Review the archive if this was not intentional.
```

**Output On Error (Archive Exists)**

```
## Archive Failed

**Change:** <change-name>
**Target:** openspec/changes/archive/YYYY-MM-DD-<name>/

Target archive directory already exists.

**Options:**
1. Rename the existing archive
2. Delete the existing archive if it's a duplicate
3. Wait until a different date to archive
```

**Guardrails**

- Infer a clearly identified change before prompting; prompt only when selection is ambiguous
- Use artifact graph (spectra status --json) for completion checking
- Don't block archive on warnings - just inform and confirm
- Preserve .openspec.yaml when moving to archive (it moves with the directory)
- Show clear summary of what happened
- If sync is requested, use the repository's `openspec-sync-specs` Skill and archive with `--skip-specs`
- If delta specs exist, always run the sync assessment and show the combined summary before prompting
- If **AskUserQuestion tool** is not available, ask the same questions as plain text and wait for the user's response
