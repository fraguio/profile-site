---
description: Project overlay for OpenSpec propose with atomic task planning
---

Extend the stock propose workflow with project-specific planning guardrails.

Run the same artifact generation flow as `/opsx-propose`, then enforce the overlay rules below before finishing.

**Inherited base contract (`/opsx-propose`)**

This command keeps the full conceptual behavior of `/opsx-propose`:
- If input is missing, ask what to build and derive a kebab-case change name.
- Create the change with `openspec new change "<name>"`.
- Resolve artifact order with `openspec status --change "<name>" --json`.
- Iterate artifacts in dependency order using `openspec instructions <artifact-id> --change "<name>" --json`.
- Read dependency artifacts, follow template/instruction, and never copy `context`/`rules` blocks verbatim.
- Continue until every artifact in `apply.requires` is done.
- Ask for clarification only when context is critically unclear.
- End by reporting final status and readiness for implementation.

If there is any conflict, preserve upstream `/opsx-propose` behavior and apply this overlay as an additive quality gate.

**Input**: The argument after `/ospec-propose` is the change name (kebab-case), OR a description of what to build.

**Overlay Rules (tasks quality gate)**

Apply these rules when creating or refining `tasks.md`:
- Default planning mode is atomic: each task has one primary objective.
- Target size per task is small and independently executable.
- Prefer `1 task = 1 coherent commit intent`.
- Do not mix concerns from different major blocks in a single task.
- Use explicit identifiers in major.minor form (`1.1`, `1.2`, `2.1`, etc.).
- Keep wording intent-focused and verifiable from repository evidence.
- Ensure scope boundaries are clear so implementation can stop after one task or one major block.

**Hints (optional)**

Optional plain-text hints after the command:
- `task_granularity=atomic` (default)
- `commit_unit=task` or `commit_unit=block` (default: `task`)
- `task_timebox=15-45m` (default target)

If hints are omitted, keep defaults.

**Completion checks**

Before final output:
- Confirm artifacts required by `apply.requires` are complete.
- Confirm `tasks.md` follows explicit ID structure and atomic boundaries.
- If not, revise `tasks.md` before reporting ready.

**Output**

After completion, summarize:
- Change name and location
- Artifacts created
- A short atomic-task compliance note
- Prompt: "Run `/ospec-apply` to start implementing."
