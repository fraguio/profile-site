## ADDED Requirements

### Requirement: Empty sections are hidden in rendered output
The system MUST omit sections from rendered output when the corresponding data is missing or empty.

#### Scenario: Section data is absent
- **WHEN** a section has no corresponding data in the validated resume input
- **THEN** that section is not rendered in the output HTML

#### Scenario: Section collection is present but empty
- **WHEN** a section exists in input but contains an empty list/object with no meaningful display entries
- **THEN** that section is not rendered in the output HTML

### Requirement: Omission behavior is silent
The system MUST hide empty sections without fallback placeholders or warning copy in the public page.

#### Scenario: Candidate section has no displayable content
- **WHEN** rendering evaluates a section and finds no displayable content
- **THEN** no placeholder text, empty heading, or "not available" message is shown

### Requirement: SEO minimum baseline is always present
The system MUST include minimum SEO metadata in rendered output.

#### Scenario: Required SEO tags are rendered
- **WHEN** HTML output is generated successfully
- **THEN** the document includes a non-empty `title`, a non-empty `meta description`, and a canonical URL tag

#### Scenario: SEO metadata values derive from available profile data
- **WHEN** rendering computes SEO metadata values
- **THEN** values are deterministically derived from validated resume data and configured site base URL
