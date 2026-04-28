## ADDED Requirements

### Requirement: Phase A route set includes root and read outputs
The system MUST render two route variants from the same validated resume source: `/` and `/read/`.

#### Scenario: Root route is generated
- **WHEN** rendering succeeds
- **THEN** `dist/index.html` is generated for `/`

#### Scenario: Read route is generated
- **WHEN** rendering succeeds
- **THEN** `dist/read/index.html` is generated for `/read/`

### Requirement: Section scope and order parity is preserved in Phase A
The system MUST preserve baseline section scope and order across migration for both routes where applicable.

#### Scenario: Standard sections with displayable content
- **WHEN** resume data includes displayable entries
- **THEN** rendering preserves section scope and order for header, work, education, projects, skills, languages, and certificates

### Requirement: Read route remains ATS-friendly and free of application JS
The `/read/` route MUST prioritize linear readability and MUST NOT require application JavaScript for content rendering.

#### Scenario: Read route script policy
- **WHEN** `dist/read/index.html` is generated
- **THEN** no hydration or application runtime script is required to render the page content

### Requirement: Canonical metadata is route-self-referential
The system MUST emit canonical URLs that match each route identity.

#### Scenario: Canonical for root route
- **WHEN** `/` output is generated
- **THEN** canonical URL equals `${PROFILE_SITE_BASE_URL}/`

#### Scenario: Canonical for read route
- **WHEN** `/read/` output is generated
- **THEN** canonical URL equals `${PROFILE_SITE_BASE_URL}/read/`
