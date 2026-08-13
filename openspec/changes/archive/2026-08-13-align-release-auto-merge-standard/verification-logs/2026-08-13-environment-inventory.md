# Environment inventory

- Captured at: 2026-08-13T14:20:20+08:00
- Repository baseline: `jurislm/jurislm-tools` at `b79c28b07618bf1ff8f5fcc5d23e9b141002d821`; `main` matched `origin/main` before this change was scaffolded.
- Spectra: 2.3.1 on Apple Silicon. Before scaffolding, `spectra list --json` and `spectra list --parked --json` both returned no changes.
- Local validation runtime: Node.js v22.23.1 and npm 10.9.8; this satisfies the repository's declared Node.js support range.
- Reference implementation: fetched `jurislm/entire` `origin/main` at `b73b34a65ce28d5f9b0948fb0638173328630006`. Its root package uses Bun 1.3.14, Turborepo 2.9.18, and ESLint 10.5.0.
- Current target state: jurislm-tools has trusted-main `validate` and `release` Drone pipelines and pins Release Please to 17.10.4. It has no `release-pr-auto-merge` pipeline or validator. Its release eligibility guard only permits unreleased `feat` or `fix` ranges to create a release PR.
- Current standards state: repository standards contain release auto-merge guidance, but the canonical specification, templates, checklist, and executable policy checks do not yet define a single current, verified contract for the Plugin implementation.
- Tracking issue: Closes #215.
