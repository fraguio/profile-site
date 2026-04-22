## Context

`profile-site` is a standalone consumer of the `profile-data` contract (`data/resume.json`) and must remain decoupled from any specific implementation of other consumers.
The initial baseline needs to support two ingestion entry points: local repository triggers (push to `main` and manual execution) and remote updates signaled through `repository_dispatch`.
The system behavior is constrained by strict JSON Resume compatibility (`v1.2.1`), fail-hard quality gates, and deterministic rendering rules that hide empty sections.
`profile-data` is private, so pipeline execution requires authenticated repository access for checkout and dispatch integration.

## Goals / Non-Goals

**Goals:**
- Define a reproducible CI/CD flow for `profile-site`: trigger -> fetch `profile-data` -> validate -> render -> deploy.
- Standardize dispatch payload inputs (`event_type`, `profile_data_ref`, `profile_data_path`) so builds are traceable and reproducible.
- Enforce strict contract validation against JSON Resume `v1.2.1` with fail-hard behavior.
- Produce detailed validation diagnostics in CI logs for fast troubleshooting.
- Keep `profile-site` independent from concrete peer consumer implementations.
- Set a concrete v1 deployment target (GitHub Pages) to avoid implementation ambiguity.
- Ensure minimum SEO baseline is present in rendered output (`title`, `meta description`, `canonical`).

**Non-Goals:**
- Choosing the final rendering framework (React/Astro/other).
- Defining advanced SEO strategy beyond v1 baseline.
- Introducing contract extensions beyond JSON Resume standard fields.
- Implementing final long-term hosting strategy beyond the v1 GitHub Pages baseline.

## Decisions

1. **Dual-trigger workflow model**
   - Decision: support `push` on `main`, `workflow_dispatch`, and `repository_dispatch` in `profile-site`.
   - Rationale: enables independent operation for local testing and coordinated operation from `profile-data` updates.
   - Alternatives considered:
     - Dispatch-only: rejected because it blocks independent testability in consumer repositories.
     - Push-only: rejected because it does not synchronize automatically with source-of-truth updates.

2. **Dispatch payload contract for reproducibility**
   - Decision: require/accept payload keys `event_type=profile-data-updated`, `profile_data_ref` (default `main`), and `profile_data_path` (default `data/resume.json`).
   - Rationale: allows deterministic rebuilds from exact source references and supports controlled testing on alternate refs.
   - Alternatives considered:
     - Single fixed `main` ref: rejected due to poor reproducibility for debugging.
     - Consumer-specific payload shapes: rejected due to avoidable operational drift.

3. **Strict schema pinning with fail-hard enforcement**
   - Decision: validate against JSON Resume `v1.2.1` and abort pipeline on any validation failure.
   - Rationale: prevents publishing inconsistent or broken profile output and protects contract integrity.
   - Alternatives considered:
     - Best-effort publish with warnings: rejected because silent degradation harms trust.
     - Accept any compatible minor schema at runtime: rejected for now to avoid untracked behavioral drift.

4. **Detailed observability for validation failures**
   - Decision: expose field-level/schema-level diagnostics in CI logs while keeping deployment blocked.
   - Rationale: fail-hard without diagnostics slows recovery; detailed logs make failures actionable.
   - Alternatives considered:
     - Generic error-only logging: rejected due to poor debuggability.

5. **Rendering rule for sparse data**
   - Decision: sections with missing or empty data are hidden silently.
   - Rationale: preserves readability and avoids visual noise in public output.
   - Alternatives considered:
     - Placeholder/fallback copy: rejected because it weakens presentation quality for this use case.

6. **Consumer independence as an architectural constraint**
   - Decision: `profile-site` requirements and implementation MUST not reference concrete peer consumers.
   - Rationale: keeps consumers independently evolvable while sharing the same data contract.
   - Alternatives considered:
     - Implicit coupling to peer consumer behavior: rejected due to long-term maintenance drift.

7. **Deployment target for v1**
   - Decision: use GitHub Pages for v1 deployment.
   - Rationale: low operational overhead and sufficient capability for static v1 baseline.
   - Alternatives considered:
     - Immediate migration to server-capable hosting: rejected as premature for current scope.

8. **SEO minimum baseline for v1**
   - Decision: require `title`, `meta description`, and canonical URL in rendered output.
   - Rationale: guarantees minimum discoverability and document identity without over-scoping SEO.
   - Alternatives considered:
     - Deferring SEO entirely: rejected because low-cost baseline provides immediate value.

## Risks / Trade-offs

- **[Risk] Schema evolution beyond v1.2.1 causes failures** -> **Mitigation:** keep explicit version pin and update through controlled change proposals.
- **[Risk] Cross-repo dispatch auth/token issues** -> **Mitigation:** document required secrets and provide manual trigger fallback.
- **[Risk] Private repository access failures (`profile-data`)** -> **Mitigation:** validate token scopes and fail early with explicit diagnostics.
- **[Risk] Dispatch payload drift between producer and consumer** -> **Mitigation:** define stable payload keys and defaults in specs.
- **[Risk] Fail-hard blocks deployments too aggressively during experimentation** -> **Mitigation:** use manual runs with alternate refs/branches for tests before merging to `main`.

## Migration Plan

1. Introduce workflow scaffolding and trigger support in `profile-site`.
2. Add data acquisition from `profile-data` using ref/path parameters.
3. Add strict validation stage against JSON Resume `v1.2.1`.
4. Wire logging so validation errors are explicit and actionable.
5. Gate render/deploy on validation success only.
6. Validate end-to-end behavior through manual and dispatch-triggered test runs.
7. Verify v1 SEO baseline tags are present in published HTML.

Rollback strategy:
- Revert workflow and validation changes in a single rollback commit.
- Temporarily disable dispatch trigger path while preserving manual execution.

## Open Questions

- Which rendering framework is selected for v1 implementation (React/Astro/other)?
- What migration trigger/criteria should move v2+ away from GitHub Pages to server-capable hosting (Node.js/Python)?
