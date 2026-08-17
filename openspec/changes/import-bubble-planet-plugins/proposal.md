## Why

The three validated Bubble Planet media-workflow plugins are currently available only through local Codex plugin caches, so they are not part of the `jurislm-tools` marketplace or its canonical Claude/Codex installation path. Importing the three independent packages now makes the requested audio download, audio analysis, and MiniMax Design workflows installable from the repository while preserving their evidence and safety contracts.

## What Changes

- Add the independent `ai-audio-analysis`, `suno-audio-download`, and `minimax-design` plugins to the marketplace.
- Convert each cache manifest to the repository's canonical `.claude-plugin/plugin.json` shape and preserve the three Skills, MiniMax references, and static pressure-test assets.
- Add plugin READMEs and root installation documentation using `plugin@jurislm-tools` identifiers.
- Register the new plugin manifests with Release Please's version synchronization and update the current marketplace inventory documentation.
- Add OpenSpec coverage for the new media-workflow plugins and the changed marketplace-documentation requirement.

## Capabilities

### New Capabilities

- `media-workflow-plugins`: Canonical marketplace packaging for the three Bubble Planet audio and MiniMax Design Skills.

### Modified Capabilities

- `plugin-packaging-integrity`: Current documentation and release-version synchronization cover every published plugin, including the three imported entries.

## Impact

Affected areas are `.claude-plugin/marketplace.json`, three new `plugins/<name>/` trees, `release-please-config.json`, root and contributor documentation, and OpenSpec artifacts. No runtime service, API, credential, or third-party dependency is added; the MiniMax workflow retains its existing Computer Use dependency.
