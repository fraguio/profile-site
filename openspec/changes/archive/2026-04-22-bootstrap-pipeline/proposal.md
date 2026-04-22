## Why

`profile-site` needs a reproducible, contract-first foundation to consume `profile-data` safely and publish reliably.
Today there is no formalized workflow in this repository that enforces strict JSON Resume compatibility, dual ingestion triggers, and fail-hard quality gates.

## What Changes

- Establish a v1 CI/CD baseline for `profile-site` with dual ingestion paths: repository-native execution and `repository_dispatch` from `profile-data`.
- Enforce strict validation of input data against JSON Resume `v1.2.1` during load/build.
- Define fail-hard behavior: if validation fails, build and deploy are aborted.
- Define observability requirements: validation failures must produce actionable diagnostics in CI logs.
- Define rendering behavior for incomplete data: empty sections are hidden silently.
- Define minimum SEO acceptance for v1 (`title`, `meta description`, `canonical`).
- Standardize dispatch payload expectations for consumer independence and reproducible builds (`event_type`, `profile_data_ref`, `profile_data_path`).
- Set deployment target for v1 to GitHub Pages, documenting migration as future work.

## Capabilities

### New Capabilities
- `profile-site-pipeline`: Build and deploy workflow for `profile-site` with manual/native and dispatch-triggered ingestion of `profile-data`.
- `resume-contract-validation`: Strict JSON Resume `v1.2.1` validation with fail-hard enforcement and detailed diagnostics.
- `profile-site-rendering-rules`: Deterministic rendering rules for missing data (silent section omission).

### Modified Capabilities
- None.

## Impact

- Affects CI/CD workflow definitions in `profile-site`.
- Introduces/affects schema validation dependencies for JSON Resume `v1.2.1`.
- Requires authenticated read access to private `profile-data` repository during pipeline execution.
- Defines cross-repository event contract between `profile-data` and `profile-site` without coupling to any specific peer consumer implementation.
- Establishes baseline behavior for deployment reliability and troubleshooting.
