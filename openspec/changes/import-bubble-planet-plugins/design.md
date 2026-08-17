# Design

## Source inventory

The three source packages were read from the local Codex cache before editing:

| Plugin | Source package | Included material |
|---|---|---|
| `ai-audio-analysis` | `bubble-planet-audio/ai-audio-analysis/1.0.0` | Plugin manifest and `skills/ai-audio-analysis/SKILL.md` |
| `suno-audio-download` | `bubble-planet-audio/suno-audio-download/1.0.0` | Plugin manifest and `skills/suno-audio-download/SKILL.md` |
| `minimax-design` | `bubble-planet-kids/minimax-design/1.1.0` | Plugin manifest, README, Skill, five references, and two test assets |

The screenshot is inventory evidence only. The source `SKILL.md` files are vendored guidance and do not override the user's requested repository destination.

## Decisions

### Preserve three plugin identities

Each cache item has its own manifest and installable plugin name. The repository therefore adds three marketplace entries rather than merging the Skills into one new umbrella plugin. This preserves the existing display and routing boundaries shown in the inventory and gives each Skill its own `plugin@jurislm-tools` installation identifier.

### Use one canonical marketplace format

The source packages use `.codex-plugin/plugin.json`. The repository's cross-runtime contract uses `.claude-plugin/marketplace.json` and `.claude-plugin/plugin.json`, which Codex discovers through the supported compatibility path. The imported manifests use the repository's established metadata fields and do not create a parallel `.codex-plugin` tree.

### Keep media guidance and provenance intact

The three Skills are copied without rewriting their operational contracts. MiniMax's references and `test_reference_completeness.py` remain under the Skill directory so its existing static completeness test continues to resolve relative paths. Plugin READMEs are adapted only for the new marketplace installation identifier and repository provenance.

### Extend Release Please coverage

The current repository version is `1.38.2`. New manifests start at that existing synchronized version, and their paths are appended to `release-please-config.json` so later release automation owns them together with the existing plugin manifests. No existing release-managed version is bumped manually.

## Verification shape

1. Compare every copied source file with its cache counterpart using SHA-256, allowing only the deliberate `.codex-plugin` to `.claude-plugin` manifest conversion and README installation/provenance adaptation.
2. Run the MiniMax reference completeness test from its imported Skill directory.
3. Run `npm run validate`, which checks JSON, marketplace identity, Release Please synchronization, and Markdown lint.
4. Run `claude plugin validate .` and inspect the marketplace entries and all three manifests directly.
5. Run strict OpenSpec validation and confirm the final worktree and commit contain only this change.
