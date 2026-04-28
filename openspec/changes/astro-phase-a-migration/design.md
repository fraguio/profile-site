## Context

`profile-site` already implements a contract-first static publish baseline: private source acquisition, strict JSON Resume `v1.2.1` validation, fail-hard quality gates, and GitHub Pages deployment.
The target roadmap requires two route outputs (`/` and `/read/`) and a migration to Astro, while keeping reproducibility, observability, and explicit trigger behavior.

## Goals / Non-Goals

**Goals:**

- Migrate renderer/toolchain to Astro + Node in repository root.
- Preserve baseline source-resolution and fail-hard validation guarantees.
- Produce deterministic static outputs for both `/` and `/read/`.
- Enforce route-level SEO minimum checks in both outputs.
- Add a `pull_request` contract-validation path without deployment.
- Keep the workflow operationally simple with explicit event gates.

**Non-Goals:**

- Implement advanced premium interactions (including GSAP-heavy features).
- Implement stable PDF generation/publication contract.
- Redefine section taxonomy beyond approved Phase A parity constraints.
- Change hosting target away from GitHub Pages in this phase.

## Decisions

1. **Single workflow with event gates**
   - Keep one publish workflow and gate deploy by event type.
   - `pull_request` runs full contract checks without deploy.
   - `push/main` and `repository_dispatch` run full checks and deploy on success.
   - Alternative considered: split workflows for validate/publish; rejected due to duplicated logic and lower traceability.

2. **Astro static architecture in repository root**
   - Use root-level Astro structure with `src/pages/index.astro` and `src/pages/read/index.astro`.
   - Keep static output model compatible with Pages.
   - Alternative considered: Astro in subfolder/monorepo; rejected as unnecessary complexity for this scope.

3. **Deterministic Node runtime and install path**
   - Pin CI to Node `20.19.x`.
   - Require `engines.node` as `>=20.19 <21` and lockfile-based install via `npm ci`.
   - Alternative considered: floating Node minor and `npm install`; rejected due to reproducibility drift.

4. **Validation before build with local schema artifact**
   - Keep strict JSON Resume `v1.2.1` validation as a hard gate before Astro build.
   - Use repository-versioned schema to avoid runtime network dependency.
   - Alternative considered: downloading schema each run; rejected due to external dependency and nondeterminism.

5. **Shared data layer with route-specific presentation**
   - Use shared load/normalize helpers in `src/lib` for both routes.
   - Keep route differences in presentation and JS policy only.
   - Alternative considered: separate data logic per route; rejected due to duplication risk.

6. **Route-level SEO contract**
   - Require non-empty `title`, non-empty `meta description`, and canonical URL per route.
   - Canonical values are self-referential and derived from `PROFILE_SITE_BASE_URL`.
   - Alternative considered: root-only SEO checks; rejected because `/read/` is contractual output.

7. **Progressive JS boundaries for Phase A**
   - `/read/` includes no application JavaScript.
   - `/` may include non-critical JS with graceful degradation.
   - Alternative considered: same JS policy on both routes; rejected to protect ATS-friendly behavior.

## Risks / Trade-offs

- **[Risk] Multi-layer migration causes temporary contract failures** -> **Mitigation:** enforce atomic tasks and scope-limited apply cycles.
- **[Risk] New output/SEO checks fail early while templates are incomplete** -> **Mitigation:** sequence tasks so checks land after baseline route rendering is in place.
- **[Risk] Fork PRs fail from missing secrets/vars and confuse contributors** -> **Mitigation:** add explicit early diagnostics and local reproduction guidance.
- **[Trade-off] Phase A intentionally defers PDF and advanced interactions** -> **Mitigation:** keep explicit follow-up scope in Phase B roadmap artifacts.

## Migration Plan

1. Introduce Astro/Node scaffolding and deterministic runtime/package constraints.
2. Implement Node-based contract validation using repository-local JSON Resume schema.
3. Implement shared data/SEO helpers and route pages for `/` and `/read/`.
4. Enforce parity and silent-omission rendering behavior in Astro templates.
5. Add workflow gates for PR validation vs publish events.
6. Add route-level output and SEO contract checks.
7. Remove Python-specific workflow dependencies after Node/Astro path is green.

Rollback strategy:

- Revert migration change set as one rollback commit.
- Keep prior pipeline behavior as fallback while migration branch is not merged.

## Open Questions

- No blocker for Phase A execution.
- Phase B follow-ups remain open by design:
  - stable PDF publication implementation,
  - advanced premium interaction and performance budget contract,
  - potential future move to SHA as effective source ref.
