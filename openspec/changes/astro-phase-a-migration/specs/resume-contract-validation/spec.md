## ADDED Requirements

### Requirement: Validation implementation is Node-based and executes before build
The system MUST perform JSON Resume `v1.2.1` validation in Node before Astro build execution.

#### Scenario: Validation precedes build
- **WHEN** pipeline executes a build-capable event path
- **THEN** JSON Resume validation runs before Astro build
- **AND** build does not start if validation fails

### Requirement: Validation uses repository-local schema source
The system MUST validate against a repository-versioned JSON Resume `v1.2.1` schema artifact.

#### Scenario: Offline schema validation in CI
- **WHEN** validation executes in CI
- **THEN** schema resolution uses a repository-local artifact
- **AND** no external schema download is required during the run

### Requirement: Actionable diagnostics quality is preserved after migration
The system MUST keep fail-hard behavior and actionable diagnostics quality for validation failures.

#### Scenario: Node validation failure diagnostics
- **WHEN** input violates schema constraints
- **THEN** logs include failing field path, violated rule, and root cause
- **AND** pipeline ends as failed with no deployment artifact publish
