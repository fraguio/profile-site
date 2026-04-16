---
description: Run one scoped OpenSpec implementation step with mandatory review gate
---

Run one scoped implementation step, keeping execution atomic and commit-ready.

This command orchestrates `/opsx-apply` with strict defaults so the session stops after the declared scope.

**Command arguments received**

- Raw arguments: `$ARGUMENTS`
- Positional mapping:
  - `$1` -> change name
  - `$2` -> scope (`<major>.<minor>` or `<major>.x`)
  - `$3` -> `review_gate` (`true|false`, optional)
  - `$4` -> `commit_prep` (`true|false`, optional)
  - `$5` -> `forbid_next_blocks` (`true|false`, optional)
  - Remaining tokens -> optional named flags (`review_gate=...`, `commit_prep=...`, `forbid_next_blocks=...`)

Resolution precedence:
1. Named flags from remaining tokens (`key=value`)
2. Positional booleans (`$3`, `$4`, `$5`)
3. Defaults

**Input**: Provide change and scope after `/flow-run-step`.

Examples:
- `/flow-run-step bootstrap-profile-site-pipeline-and-contract-validation 1.2`
- `/flow-run-step bootstrap-profile-site-pipeline-and-contract-validation 1.x`
- `/flow-run-step bootstrap-profile-site-pipeline-and-contract-validation 1.x true true true`
- `/flow-run-step bootstrap-profile-site-pipeline-and-contract-validation 1.x review_gate=true commit_prep=true forbid_next_blocks=true`

Optional flags (plain text):
- `review_gate=true|false` (default: `true`)
- `commit_prep=true|false` (default: `true`)
- `forbid_next_blocks=true|false` (default: `true`)

Recommended style: use named flags (`key=value`) for readability.

If change or scope is missing, ask for the missing value before proceeding.

---

## Steps

1. **Parse and validate input**

   - Parse `<change>` from `$1` and `<scope>` from `$2`.
   - Parse optional positional booleans from `$3`, `$4`, `$5`.
   - Parse optional named flags from remaining argument tokens in `$ARGUMENTS`.
   - Apply precedence: named flags > positional booleans > defaults.
   - Scope format must be either `<major>.<minor>` or `<major>.x`.
   - If scope is invalid, explain expected format with one example and stop.
   - Defaults:
     - `review_gate=true`
     - `commit_prep=true`
     - `forbid_next_blocks=true`

2. **Announce execution contract**

   Show a short plan:
   - Change in use
   - Scope in use
   - Guardrails enabled (`stop_after_scope`, `forbid_next_blocks`, `review_gate`, `commit_prep`)

3. **Invoke scoped apply**

   Execute `/opsx-apply` using this canonical hint set:

   ```text
   /opsx-apply <change>
   scope=<scope> stop_after_scope=true review_gate=<review_gate> commit_prep=<commit_prep> forbid_next_blocks=<forbid_next_blocks>
   ```

   Keep scope strict:
   - `<major>.<minor>` -> only that task
   - `<major>.x` -> only tasks under that major block

4. **Require review gate output**

   If `review_gate=true`, require these commands to be shown and interpreted:

   ```bash
   openspec status --change "<change>"
   git status
   git diff
   ```

   Then provide explicit verdict:
   - `MERECE COMMIT`
   - `FALTA ALGO`

5. **Prepare commit details**

   If `commit_prep=true` and verdict is `MERECE COMMIT`:
   - Propose short commit title (ideal <=72 chars)
   - Add optional body only if it adds useful intent
   - Provide exact commit command(s)
   - Stop session after commit prep

6. **Stop conditions**

   Stop immediately and report if any of these happen:
   - Work attempts to move outside declared scope
   - Next major block would start while `forbid_next_blocks=true`
   - Blocker or ambiguity that prevents safe scoped execution

---

## Output Contract

Always include:
- Active change and scope
- What was completed in this step
- Review gate evidence (or explicit reason if disabled)
- Final verdict (`MERECE COMMIT` / `FALTA ALGO`)
- If applicable, proposed commit message and exact command

---

## Guardrails

- This command orchestrates; it must not silently broaden scope.
- Never continue to the next task/block after scope completion unless user explicitly asks.
- Keep OpenSpec artifacts in English and repository context docs in Spanish.
- Prefer small, atomic progress that can be committed safely.
