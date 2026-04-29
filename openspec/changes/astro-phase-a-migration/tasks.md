## 1. Astro and Node foundation

- [x] 1.1 Add Astro + npm project scaffolding at repository root
- [x] 1.2 Add package scripts for build and contract validation with lockfile-driven dependency resolution
- [x] 1.3 Add static Astro configuration and route skeletons for `/` and `/read/`
- [x] 1.4 Align runtime constraints to Node `20.19.x` in CI and `engines.node >=20.19 <21` in project metadata

## 2. Contract validation migration

- [x] 2.1 Vendor JSON Resume `v1.2.1` schema in-repo for offline validation use
- [ ] 2.2 Implement Node validation command with fail-hard behavior and actionable field/rule/root-cause diagnostics
- [ ] 2.3 Gate build execution so validation runs before Astro build on every supported event path

## 3. Rendering parity in Astro (Phase A)

- [ ] 3.1 Implement shared resume load/normalize helpers in `src/lib` reading local `data/resume.json`
- [ ] 3.2 Implement shared section rendering primitives for Phase A section scope/order parity
- [ ] 3.3 Implement `/` page template using shared rendering primitives
- [ ] 3.4 Implement `/read/` ATS-friendly page template with linear content and no application JS
- [ ] 3.5 Enforce silent omission of empty sections in both routes

## 4. Output and SEO contract hardening

- [ ] 4.1 Implement route-aware SEO metadata helpers using `PROFILE_SITE_BASE_URL`
- [ ] 4.2 Add contract checks for required SEO tags in `dist/index.html`
- [ ] 4.3 Add equivalent SEO checks for `dist/read/index.html`
- [ ] 4.4 Add required output checks so both `dist/index.html` and `dist/read/index.html` exist and are non-empty

## 5. Workflow event gates and observability

- [ ] 5.1 Add `pull_request` trigger path with full contract validation and explicit no-deploy gate
- [ ] 5.2 Preserve publish behavior for `push` on `main` with deploy enabled on success
- [ ] 5.3 Preserve publish behavior for `repository_dispatch` with deploy enabled on success
- [ ] 5.4 Add early-fail diagnostics for missing secrets/variables in non-trusted PR contexts
- [ ] 5.5 Extend run summary reporting with trigger, resolved source coordinates, validation, build, and deploy status

## 6. Decommission Python CI path

- [ ] 6.1 Remove Python-specific validation/render dependency installation and execution from workflow
- [ ] 6.2 Run final trigger-matrix verification for `pull_request`, `push`, `workflow_dispatch`, and `repository_dispatch` under Node/Astro-only execution
