# resume-contract-validation Specification

## Purpose
Define strict input-validation guarantees for `profile-site`: JSON Resume `v1.2.1` schema enforcement, fail-hard behavior, and actionable diagnostics.

This spec was promoted from archived change `2026-04-22-bootstrap-pipeline` (shortened name due to Windows path-length constraints).
## Requirements
### Requirement: Input data is validated against JSON Resume v1.2.1
The system MUST validate the input resume data against JSON Resume schema version `v1.2.1` before rendering.

#### Scenario: Data matches strict schema version
- **WHEN** the input resume passes JSON Resume `v1.2.1` validation
- **THEN** the pipeline proceeds to render and deploy stages

#### Scenario: Data violates schema constraints
- **WHEN** the input resume fails JSON Resume `v1.2.1` validation
- **THEN** the pipeline is terminated before render and deploy

### Requirement: Validation failures are fail-hard with actionable diagnostics
The system MUST fail hard on validation errors and MUST provide detailed diagnostics in CI logs.

#### Scenario: Validation error is reported in logs
- **WHEN** validation fails due to missing fields, type mismatches, or schema violations
- **THEN** CI logs include enough detail to identify the failing field/rule and root cause

#### Scenario: No partial output is published after validation failure
- **WHEN** validation fails at any point in the pipeline
- **THEN** no deployment artifact is published and the run is marked failed
