## Why

`profile-site` has a stable contract-first baseline, but the implementation is still Python-based and only guarantees one rendered route output.
The approved roadmap requires a controlled Phase A migration to Astro/Node that preserves baseline guarantees while adding `/read/` as a required output and keeping CI behavior reproducible.

## What Changes

- Migrate rendering and validation toolchain from Python steps to Astro + Node in repository root.
- Keep strict JSON Resume `v1.2.1` validation as fail-hard before any build/deploy path.
- Require two non-empty outputs in successful builds: `dist/index.html` and `dist/read/index.html`.
- Add event-gated workflow behavior in one pipeline:
  - `pull_request`: full contract validation and build checks, no deploy.
  - `push` on `main` and `repository_dispatch`: full checks plus deploy.
- Enforce route-level SEO minimum checks for `/` and `/read/`, including route-self-referential canonical URLs.
- Preserve baseline rendering parity rules in Phase A (same section scope/order, silent omission of empty sections).
- Keep `/read/` ATS-friendly with no application JavaScript.
- Explicitly defer advanced premium interactions and stable PDF publication to Phase B.

## Capabilities

### New Capabilities

- None.

### Modified Capabilities

- `profile-site-pipeline`: add Node/Astro deterministic runtime rules, PR validation gate, dual-route output contract, and event-gated deploy behavior.
- `profile-site-rendering-rules`: add required route set (`/` and `/read/`), Phase A parity constraints, `/read/` no-app-JS rule, and route canonical contract.
- `resume-contract-validation`: add Node-based pre-build validation and repository-local schema requirement while preserving fail-hard diagnostics quality.

## Impact

- Affects `.github/workflows/profile-site-publish.yml` event gates, validation/build steps, and deploy gating.
- Replaces Python-centric render/validation execution path with Node/Astro equivalents.
- Adds npm runtime constraints and lockfile-driven reproducibility requirements.
- Expands contract checks to include `/read/` output and route-level SEO verification.
