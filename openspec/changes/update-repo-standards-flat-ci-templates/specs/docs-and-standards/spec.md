## ADDED Requirements

### Requirement: Flat-repo CI template stays synchronized with its reference repo
`repo-standards`'s Coolify web app CI template ("模板 A") SHALL list every Drone pipeline that its stated rationale requires, and that list SHALL be checked against `jurislm/entire`'s actual `.drone.yml` (the repo that motivated deploy-gating and build-only failure detection) whenever either is known to have changed. The monorepo template ("模板 B") SHALL state the current pipeline count and names for `jurislm/entire`, since it explicitly mirrors that repo rather than defining independent rationale.

#### Scenario: Template A pipeline list matches its own stated rationale
- **WHEN** 模板 A documents a rationale for a pipeline category (e.g. "build-only failures aren't caught by lint/typecheck")
- **THEN** the corresponding pipeline (e.g. `build`) appears in 模板 A's pipeline list and example YAML

#### Scenario: Template B pipeline count matches entire's actual .drone.yml
- **WHEN** someone compares 模板 B's stated pipeline list/count against `jurislm/entire`'s current `.drone.yml`
- **THEN** the names and count match, or any intentional omission (e.g. incident-driven pipelines specific to entire's history) is explicitly called out as such rather than silently missing

#### Scenario: A repo adopting Template A gets deploy-gating and build verification
- **WHEN** a new flat-repo Coolify web app is set up following 模板 A
- **THEN** its `.drone.yml` includes a `build` pipeline catching build-only failures and a `release-pr-auto-merge` pipeline automating release PR merges, matching the same protection level as monorepo repos following 模板 B
