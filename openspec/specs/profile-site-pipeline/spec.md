# profile-site-pipeline Specification

## Purpose
Define the baseline CI/CD contract for `profile-site`: trigger model, source coordinate resolution, and authenticated private-source ingestion.

This spec was promoted from archived change `2026-04-22-bootstrap-pipeline` (shortened name due to Windows path-length constraints).
## Requirements
### Requirement: Consumer pipeline supports dual ingestion triggers
The system MUST execute the `profile-site` build pipeline from both local repository triggers and external source-of-truth dispatch events.

#### Scenario: Local repository trigger on main
- **WHEN** a commit is pushed to `main` in `profile-site`
- **THEN** the pipeline fetches `profile-data` using default source parameters and starts validation before render/deploy

#### Scenario: Manual trigger with explicit source reference
- **WHEN** an operator runs `workflow_dispatch` and provides `profile_data_ref` and `profile_data_path`
- **THEN** the pipeline fetches the requested source revision/path and uses it as the build input

#### Scenario: Dispatch trigger from source-of-truth repository
- **WHEN** `repository_dispatch` is received with event type `profile-data-updated`
- **THEN** the pipeline uses payload values for `profile_data_ref` and `profile_data_path`, applying defaults when absent

### Requirement: Dispatch payload is stable and reproducible
The system MUST support a stable dispatch payload contract so builds can be reproduced from specific source references.

#### Scenario: Payload includes full source coordinates
- **WHEN** `repository_dispatch` payload contains `profile_data_ref` and `profile_data_path`
- **THEN** those values are used exactly for data checkout and load

#### Scenario: Payload omits optional source coordinates
- **WHEN** `repository_dispatch` payload does not include `profile_data_ref` or `profile_data_path`
- **THEN** the pipeline defaults to `profile_data_ref=main` and `profile_data_path=data/resume.json`

### Requirement: Consumer implementation remains independent
The system MUST remain independent from concrete implementations of other consumers and MUST rely only on the shared data contract.

#### Scenario: Pipeline definition references peer consumers
- **WHEN** reviewing pipeline and integration configuration
- **THEN** no step depends on or references a specific peer consumer repository implementation

#### Scenario: Contract-oriented integration
- **WHEN** `profile-site` processes incoming profile data
- **THEN** behavior is defined exclusively by the shared JSON Resume contract and dispatch payload contract

### Requirement: Private source repository access is explicit and authenticated
The system MUST treat `profile-data` as a private repository and MUST require authenticated access in CI.

#### Scenario: Authenticated checkout succeeds
- **WHEN** CI runs with valid credentials for private repository access
- **THEN** the pipeline checks out `profile-data` at the resolved ref/path and continues

#### Scenario: Credentials are missing or invalid
- **WHEN** CI cannot authenticate to private `profile-data`
- **THEN** the pipeline fails before validation/render with explicit access diagnostics in logs
