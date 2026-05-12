---
name: "OPSX: Fast Forward"
description: Create a change and generate all artifacts needed for implementation in one go
category: Workflow
tags: [workflow, artifacts, experimental]
---

Fast-forward through artifact creation - generate everything needed to start implementation.

**Input**: The argument after `/opsx:ff` is the change name (kebab-case), OR a description of what the user wants to build.

**Steps**

1. **If no input provided, ask what they want to build**

   Use the **AskUserQuestion tool** (open-ended, no preset options) to ask:
   > "What change do you want to work on? Describe what you want to build or fix."

   From their description, derive a kebab-case name (e.g., "add user authentication" → `add-user-auth`).

   **IMPORTANT**: Do NOT proceed without understanding what the user wants to build.

2. **Pre-proposal evidence inventory (MANDATORY — do NOT skip)**

   Before invoking `openspec new change`, collect direct evidence about the current state of the codebase / DB / external system this change touches. **Do not rely on Explore agent summaries, prior conversation, or your own memory** for any concrete claim that will appear in the artifacts.

   **What counts as a "concrete claim"** (every one needs evidence):
   - File paths AND line numbers
   - Function signatures (parameter names, types, default values, return type)
   - API endpoint HTTP method + actual response shape (e.g. `{ data, total }` vs `{ items, total }`)
   - Type / interface exports already defined in the target module
   - DB column names, types, CHECK / FK / UNIQUE constraints
   - Vector dim / HNSW index location / migration applied state
   - Caller list for every symbol you plan to refactor

   **How to collect evidence** (pick one per claim, NOT Explore summary):
   - **`Read` the source file directly** with the Read tool — for signatures, types, response shapes
   - **`Bash grep`** to enumerate callers / verify a symbol is unique
   - **migration file Read** for DB schema as-of latest applied state; `psql \d <table>` for live state divergence check
   - **`curl` / dev DB sample** when the claim is about runtime behavior (e.g. actual response shape from a running endpoint)

   **Write the inventory to** `openspec/changes/<name>/verification-logs/<YYYY-MM-DD>-pre-proposal-inventory.md` (create the file AFTER step 3 `openspec new change`, but the evidence collection happens before any artifact drafting). The inventory MUST contain:
   - List of files Read (with absolute paths)
   - For each function planned for refactor: actual signature copied **verbatim** from source — not paraphrased
   - For each API endpoint touched: actual response shape from the route file
   - For each DB column referenced: actual definition pasted from migration
   - For each `Decision: X → Y` planned in design.md: an explicit "current behavior is X, proposed behavior is Y, this is a CHANGE not an OBSERVATION" row
   - For each Explore agent finding used: re-verified by Read with link to the file + line range

   **Enforcement when drafting artifacts (step 5):** every concrete claim in proposal / spec / design / tasks MUST trace back to an entry in this inventory. If you write a claim with no inventory backing, rewrite it as `unknown — needs verification` and pause until verified. **No exceptions for "obvious" or "standard" patterns** — your assumption of "standard pagination shape" is exactly the kind of claim that breaks `behavioral equivalence` promises later.

   **Explore agent constraint**: If you spawned Explore agents during scoping, their summaries are **LEADS, not FACTS**. Any line number / signature / shape / count mentioned in Explore output MUST be re-verified by Read before entering an artifact. Treating Explore summaries as ground truth is the most common root cause of artifacts that need full rewrite after review.

3. **Create the change directory**
   ```bash
   openspec new change "<name>"
   ```
   This creates a scaffolded change at `openspec/changes/<name>/`. Now move the inventory file from step 2 into `openspec/changes/<name>/verification-logs/` if you drafted it at a temp path.

4. **Get the artifact build order**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to get:
   - `applyRequires`: array of artifact IDs needed before implementation (e.g., `["tasks"]`)
   - `artifacts`: list of all artifacts with their status and dependencies

5. **Create artifacts in sequence until apply-ready**

   Use the **TodoWrite tool** to track progress through the artifacts.

   Loop through artifacts in dependency order (artifacts with no pending dependencies first):

   a. **For each artifact that is `ready` (dependencies satisfied)**:
      - Get instructions:
        ```bash
        openspec instructions <artifact-id> --change "<name>" --json
        ```
      - The instructions JSON includes:
        - `context`: Project background (constraints for you - do NOT include in output)
        - `rules`: Artifact-specific rules (constraints for you - do NOT include in output)
        - `template`: The structure to use for your output file
        - `instruction`: Schema-specific guidance for this artifact type
        - `outputPath`: Where to write the artifact
        - `dependencies`: Completed artifacts to read for context
      - Read any completed dependency files for context
      - Create the artifact file using `template` as the structure
      - Apply `context` and `rules` as constraints - but do NOT copy them into the file
      - Show brief progress: "✓ Created <artifact-id>"

   b. **Continue until all `applyRequires` artifacts are complete**
      - After creating each artifact, re-run `openspec status --change "<name>" --json`
      - Check if every artifact ID in `applyRequires` has `status: "done"` in the artifacts array
      - Stop when all `applyRequires` artifacts are done

   c. **If an artifact requires user input** (unclear context):
      - Use **AskUserQuestion tool** to clarify
      - Then continue with creation

6. **Show final status**
   ```bash
   openspec status --change "<name>"
   ```

**Output**

After completing all artifacts, summarize:
- Change name and location
- List of artifacts created with brief descriptions
- What's ready: "All artifacts created! Ready for implementation."
- Prompt: "Run `/opsx:apply` to start implementing."

**Artifact Creation Guidelines**

- Follow the `instruction` field from `openspec instructions` for each artifact type
- The schema defines what each artifact should contain - follow it
- Read dependency artifacts for context before creating new ones
- Use `template` as the structure for your output file - fill in its sections
- **IMPORTANT**: `context` and `rules` are constraints for YOU, not content for the file
  - Do NOT copy `<context>`, `<rules>`, `<project_context>` blocks into the artifact
  - These guide what you write, but should never appear in the output

**Guardrails**
- Create ALL artifacts needed for implementation (as defined by schema's `apply.requires`)
- Always read dependency artifacts before creating a new one
- If context is critically unclear, ask the user - but prefer making reasonable decisions to keep momentum
- If a change with that name already exists, ask if user wants to continue it or create a new one
- Verify each artifact file exists after writing before proceeding to next
- **Never skip step 2 evidence inventory** — even for "small" changes. The cost of one bad artifact triplet (proposal/spec/design/tasks built on sand) far exceeds 30 minutes of upfront verification. Skipping inventory is a top root cause of "need full rewrite" feedback.
- **Never treat Explore agent output as a substitute for Read**. Explore returns leads; only Read returns facts.
- **Never invent details to fill gaps** — if a regex / shape / signature isn't in the inventory, write `TBD — needs verification` and stop. Inventing "standard" or "obvious" patterns (e.g. assuming `{ items, total }` because that's the typical pagination shape) is the same failure mode.
- **Decision vs Observation discipline**: any line in design.md that proposes a behavior different from current code is a Decision, not an Observation. Mark it as `Decision: current X → proposed Y, rationale Z`. Do not phrase new design as if it were existing implementation.
