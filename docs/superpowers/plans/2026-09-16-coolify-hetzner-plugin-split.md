# Coolify and Hetzner Plugin Split

## Scope

Modify only:

- `/Users/terrychen/Documents/Github/jurislm/coolify-plugin`
- `/Users/terrychen/Documents/Github/jurislm/hetzner-plugin`
- `/Users/terrychen/.codex/worktrees/58f3/jurislm-tools`

Use `/Users/terrychen/Documents/Github/jurislm/woodpecker-ci-plugin` and commit
`553ac28` as read-only architectural reference. Do not modify it.

## Global contract

- Both targets are complete local/private Codex Plugin packages with a
  package-first stdio MCP runtime.
- Use root `plugin.json`, root `mcp.json`, `.codex-plugin/plugin.json`,
  `.mcp.json.example`, `.app.json.example`, `skills/<service>/SKILL.md`,
  `package.json`, `src/`, `api/`, `openapi/`, `scripts/`, `tests/`, and
  `.woodpecker/` with the same responsibilities as the reference.
- Use Bun >=1.1, the pinned MCP/Zod/codegen dependencies from the reference,
  native `fetch`, `registerTool`, generated operations, structured output,
  annotations, timeout, redaction, and no mutation retry.
- Use official snapshots: Coolify `https://raw.githubusercontent.com/coollabsio/coolify/main/openapi.json`; Hetzner Cloud `https://docs.hetzner.cloud/cloud.spec.json`; Hetzner unified API `https://docs.hetzner.cloud/hetzner.spec.json`.
- Local stdio is the only enabled transport. Do not add HTTP, OAuth, vault,
  hosting, or public Plugin Directory submission.
- Release topology matches the latest Woodpecker readback: main push runs
  Release Please (`release.yml`) and serialized release-PR auto-merge
  (`release-pr-auto-merge.yml`); tag events run verify/publish only through
  `npm-release.yml`. No production deploy pipeline is added.
- New packages are `@jurislm/coolify-plugin` and
  `@jurislm/hetzner-plugin`, starting at `0.1.0`; no old package/tool/env
  compatibility.

### Task 1: Coolify plugin

- Import the latest `coolify-mcp` history at `v3.6.0` into the target repo.
- Add the common Plugin/package/config/example/skill/CI structure.
- Capture and pin the authoritative Coolify OpenAPI snapshot, manifest, hash,
  and generated request/response/operation artifacts.
- Replace the hand-written legacy MCP registration with focused generated
  `coolify_*` tools while preserving current capabilities.
- Use `COOLIFY_URL` and `COOLIFY_TOKEN` only.
- Add tests for config, client, generated contract, stdio protocol, metadata,
  annotations, output, redaction, and package contents.
- Add Release Please metadata and the local release automation tests/scripts.

### Task 2: Hetzner plugin

- Import the latest `hetzner-mcp` history at `v1.5.0` into the target repo.
- Add the same common Plugin/package/config/example/skill/CI structure.
- Obtain an authoritative machine-readable Hetzner OpenAPI source using the
  same snapshot/manifest/codegen process; fail closed if it cannot be
  verified, with no Markdown/manual-client fallback.
- Remove axios and implement the same native-fetch generated-operation client.
- Preserve current `hetzner_*` capabilities and add generated focused tools.
- Use `HETZNER_API_TOKEN` and `HETZNER_API_TOKEN_UNIFIED`; no Storage Box token
  fallback.
- Add the same test categories as Task 1.
- Add Release Please metadata and the local release automation tests/scripts.

### Task 3: jurislm-tools extraction

- Remove active Coolify and Hetzner plugin folders and marketplace entries.
- Update active README, CLAUDE, specs, Release Please index, and validator
  expectations for the remaining marketplace.
- Keep historical archives unchanged.

### Task 4: publish and legacy closeout

- Validate both targets locally and with Codex local marketplace readback.
- Create/read back public GitHub repos and publish/read back new npm packages.
- Only after new package readback, archive the old GitHub repos and deprecate
  the old npm packages. Never delete them or create aliases.

## Acceptance

- Both targets have the same outer tree and local stdio MCP contract.
- Portable/fallback manifests, OpenAPI snapshots, generated artifacts, tools,
  schemas, annotations, tests, package dry-runs, and all four Woodpecker
  pipeline files validate.
- `jurislm-tools` validation passes after extraction.
- Public GitHub/npm and old-repo deprecation/archive claims require fresh
  readback; missing npm authentication or live provider credentials is a
  blocker for only the affected evidence layer.
