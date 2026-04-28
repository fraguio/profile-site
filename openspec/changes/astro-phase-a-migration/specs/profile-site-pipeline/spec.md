## ADDED Requirements

### Requirement: Pipeline validates full contract on pull requests without deployment
The system MUST execute full source resolution, validation, render, and contract checks on `pull_request` events and MUST NOT deploy artifacts in that event path.

#### Scenario: Pull request from same repository
- **WHEN** a pull request targets `main`
- **THEN** the pipeline runs contract validation and build checks
- **AND** deployment steps are skipped

#### Scenario: Pull request from fork without required secrets
- **WHEN** required private-source credentials are unavailable in pull request context
- **THEN** the pipeline fails early with explicit diagnostics naming the missing secret or variable and local reproduction guidance
- **AND** no deploy is attempted

### Requirement: Static build output contract includes root and read routes
The system MUST generate route outputs for both `/` and `/read/` in every successful build path.

#### Scenario: Successful build output contract
- **WHEN** the build completes successfully
- **THEN** `dist/index.html` exists and is non-empty
- **AND** `dist/read/index.html` exists and is non-empty

#### Scenario: Missing route artifact
- **WHEN** either required output file is missing or empty
- **THEN** the pipeline fails before deployment

### Requirement: Node and package runtime is deterministic in CI
The system MUST execute validation and build with pinned Node runtime and deterministic package installation.

#### Scenario: Runtime and install mode in CI
- **WHEN** Node-based jobs execute in CI
- **THEN** Node `20.19.x` is used
- **AND** dependencies are installed with `npm ci`
- **AND** lockfile-pinned versions are respected

### Requirement: Deploy behavior is event-gated and explicit
The system MUST deploy only on publish events while preserving supported ingestion triggers and dispatch contract.

#### Scenario: Publish event path
- **WHEN** event is `push` on `main` or `repository_dispatch` with `profile-data-updated`
- **THEN** pipeline runs full contract checks
- **AND** deploy runs on success

#### Scenario: Non-publish event path
- **WHEN** event is `pull_request`
- **THEN** pipeline runs full contract checks
- **AND** deploy does not run
