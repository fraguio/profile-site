---
description: Project overlay for OpenSpec apply with scoped execution, TDD loop, and review gate
---

Extend the stock apply workflow with strict scoped execution and commit-readiness checks.

Run the same base execution flow as `/opsx-apply`, then enforce the overlay rules below.

**Inherited base contract (`/opsx-apply`)**

This command keeps the full conceptual behavior of `/opsx-apply`:
- Select change from explicit name, inferred context, or user choice when ambiguous.
- Inspect schema with `openspec status --change "<name>" --json`.
- Get apply instructions using `openspec instructions apply --change "<name>" --json`.
- Handle instruction states (`blocked`, `all_done`, or implement).
- Read `contextFiles` before implementation.
- Show progress, implement pending tasks, and update checkboxes immediately.
- Pause on ambiguity, blockers, or design issues.
- Report completion/pause status and suggest archive when all tasks are done.

If there is any conflict, preserve upstream `/opsx-apply` behavior and apply this overlay as additive guardrails.

**Input**: Optionally specify a change name (e.g., `/ospec-apply add-auth`).

**Command arguments received**

- Raw arguments: `$ARGUMENTS`
- Positional mapping (when present):
  - `$1` -> change name (optional)
  - Remaining tokens -> optional execution hints (`scope=...`, `review_gate=...`, etc.)

**Hints (optional)**

Optional plain-text hints after the command:
- `scope=<major>.<minor>` (example: `scope=1.2`)
- `scope=<major>.x` (example: `scope=1.x`)
- `stop_after_scope=true|false` (default: `true` when `scope` is provided)
- `review_gate=true|false` (default: `true`)
- `commit_prep=true|false` (default: `true`)
- `forbid_next_blocks=true|false` (default: `true`)
- `tdd=true|false` (default: `true`)

If no hints are provided, proceed with normal multi-task apply.

**Overlay Rules (execution quality gate)**

When `scope` is provided:
- Implement only tasks in that scope.
  - `scope=1.2` -> only task `1.2`
  - `scope=1.x` -> only tasks under `1.*`
- Do not begin tasks outside scope.
- If `forbid_next_blocks=true`, stop before entering a different major block.
- If `stop_after_scope=true`, stop immediately after completing in-scope tasks.

When `tdd=true`:
- Execute each in-scope task as a vertical TDD mini-cycle aligned with `/tdd`.
- Per cycle, follow this order:
  1. Define one observable behavior for the current task.
  2. Write one failing test (RED).
  3. Implement the minimum code to pass (GREEN).
  4. Refactor safely while keeping tests green (REFACTOR).
- Do not advance to the next task until the current task reaches GREEN with stable tests.
- Prefer behavior-level tests through public interfaces; avoid implementation-coupled assertions.

For every completed task:
- Mark task checkbox immediately (`- [ ]` -> `- [x]`).

If `review_gate=true`, run and interpret:
```bash
openspec status --change "<name>"
git status
git diff
```

Then output explicit verdict:
- `Ready to commit`
- `Not ready to commit`

If `commit_prep=true` and verdict is `Ready to commit`:
- Propose concise commit message (short title, optional body).
- Provide exact commit command(s).
- Stop after commit preparation.

**Pause conditions**

Stop and ask when:
- Scope is ambiguous or invalid
- Execution would cross scope boundaries unintentionally
- A blocker or design issue prevents safe progress

If implementation repeatedly shows architectural friction (for example: duplication across call sites, modules hard to test, or frequent cross-file ripple effects):
- Pause in place, finish with `Not ready to commit`, and recommend a focused architecture review using `/improve-codebase-architecture`.
- If confirmed, continue through a separate OpenSpec change dedicated to architecture improvements.

**Output**

Always include:
- Active change and scope (if any)
- Tasks completed in this run
- Overall progress
- Review gate evidence or why it was skipped
- Final verdict (`Ready to commit` / `Not ready to commit`)
