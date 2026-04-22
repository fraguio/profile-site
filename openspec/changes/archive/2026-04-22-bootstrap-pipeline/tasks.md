## 1. Pipeline trigger baseline

- [x] 1.1 Create CI workflow scaffold for `profile-site` publish flow
- [x] 1.2 Add trigger support for `push` on `main` and `workflow_dispatch`
- [x] 1.3 Add `repository_dispatch` trigger with `profile-data-updated` event type handling
- [x] 1.4 Implement parameter resolution for `profile_data_ref` and `profile_data_path` with defaults
- [x] 1.5 Ensure workflow and docs reference only shared contract concepts (no concrete peer consumer coupling)

## 2. Source acquisition and contract validation

- [x] 2.1 Add step to fetch `profile-data` source using resolved ref/path inputs
- [x] 2.2 Add strict JSON Resume `v1.2.1` schema validation stage before rendering
- [x] 2.3 Enforce fail-hard behavior so validation failure aborts pipeline
- [x] 2.4 Emit detailed validation diagnostics (field/rule/root-cause) in CI logs
- [x] 2.5 Document and configure authenticated access requirements for private `profile-data` checkout in CI

## 3. Rendering baseline behavior

- [x] 3.1 Implement initial rendering flow consuming validated `data/resume.json`
- [x] 3.2 Implement rule to omit sections with missing or empty data
- [x] 3.3 Ensure no placeholder/fallback copy is emitted for omitted sections
- [x] 3.4 Add output existence check before deployment stage

## 4. Deployment and observability hardening

- [x] 4.1 Wire deployment artifact upload and deploy steps for GitHub Pages (v1 target)
- [x] 4.2 Add logging for trigger type, source ref/path, and build outcome summary
- [x] 4.3 Verify manual run path using non-default `profile_data_ref` for reproducibility
- [x] 4.4 Verify dispatch run path from `profile-data` payload with default and explicit values

## 5. SEO minimum baseline

- [x] 5.1 Add render logic/config to output non-empty `title` and `meta description`
- [x] 5.2 Add canonical URL generation based on configured site base URL
- [x] 5.3 Verify generated HTML includes required SEO tags in successful builds
