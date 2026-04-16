---
description: Implement tasks from an OpenSpec change (Experimental)
---

Implement tasks from an OpenSpec change.

**Command arguments received**

- Raw arguments: `$ARGUMENTS`
- Positional mapping (when present):
  - `$1` -> change name (optional)
  - Remaining tokens -> optional execution hints (`scope=...`, `review_gate=...`, etc.)

**Input**: Optionally specify a change name (e.g., `/opsx-apply add-auth`). If omitted, check if it can be inferred from conversation context. If vague or ambiguous you MUST prompt for available changes.

Optional execution hints can be included in plain text after the command. Supported hints:
- `scope=<major>.<minor>` (example: `scope=1.2`)
- `scope=<major>.x` (example: `scope=1.x`)
- `stop_after_scope=true|false` (default: `true` when `scope` is provided)
- `review_gate=true|false` (default: `true`)
- `commit_prep=true|false` (default: `true`)
- `forbid_next_blocks=true|false` (default: `true`)

If hints are omitted, continue with normal multi-task apply behavior.

**Steps**

1. **Select the change**

   If a name is provided, use it. Otherwise:
   - Infer from conversation context if the user mentioned a change
   - Auto-select if only one active change exists
   - If ambiguous, run `openspec list --json` to get available changes and use the **AskUserQuestion tool** to let the user select

   Always announce: "Using change: <name>" and how to override (e.g., `/opsx-apply <other>`).

2. **Check status to understand the schema**
   ```bash
   openspec status --change "<name>" --json
   ```
   Parse the JSON to understand:
   - `schemaName`: The workflow being used (e.g., "spec-driven")
   - Which artifact contains the tasks (typically "tasks" for spec-driven, check status for others)

3. **Get apply instructions**

   ```bash
   openspec instructions apply --change "<name>" --json
   ```

   This returns:
   - Context file paths (varies by schema)
   - Progress (total, complete, remaining)
   - Task list with status
   - Dynamic instruction based on current state

   **Handle states:**
   - If `state: "blocked"` (missing artifacts): show message, suggest using `/opsx-continue`
   - If `state: "all_done"`: congratulate, suggest archive
   - Otherwise: proceed to implementation

4. **Read context files**

   Read the files listed in `contextFiles` from the apply instructions output.
   The files depend on the schema being used:
   - **spec-driven**: proposal, specs, design, tasks
   - Other schemas: follow the contextFiles from CLI output

5. **Show current progress**

   Display:
   - Schema being used
   - Progress: "N/M tasks complete"
   - Remaining tasks overview
   - Dynamic instruction from CLI

6. **Implement tasks (loop until done or blocked)**

   If `scope` is provided:
   - Implement only tasks matching that scope.
     - `scope=1.2` -> only task `1.2`
     - `scope=1.x` -> only tasks under `1.*`
   - Do not start tasks outside the scope.
   - If `forbid_next_blocks=true`, stop immediately before any task from a different major block.

   For each pending task:
   - Show which task is being worked on
   - Make the code changes required
   - Keep changes minimal and focused
   - Mark task complete in the tasks file: `- [ ]` → `- [x]`
   - Continue to next task only if it is still inside scope (when scope mode is active)

   If `stop_after_scope=true` in scope mode:
   - Pause immediately after scope completion.
   - Do not continue to next pending task.

   **Pause if:**
   - Task is unclear → ask for clarification
   - Implementation reveals a design issue → suggest updating artifacts
   - Error or blocker encountered → report and wait for guidance
   - User interrupts

7. **Run review gate (if enabled)**

   If `review_gate=true`, run and present:
   ```bash
   openspec status --change "<name>"
   git status
   git diff
   ```

   Then provide an explicit verdict:
   - `MERECE COMMIT`
   - `FALTA ALGO`

8. **Prepare commit details (if enabled)**

   If `commit_prep=true` and verdict is `MERECE COMMIT`:
   - Propose a concise commit message (short title, optional body).
   - Provide exact commit commands.
   - Stop session after preparing commit details.

9. **On completion or pause, show status**

   Display:
   - Tasks completed this session
   - Overall progress: "N/M tasks complete"
   - Active scope and whether scope guardrails were respected (when scope mode is used)
   - Review gate result (when enabled)
   - If all done: suggest archive
   - If paused: explain why and wait for guidance

**Output During Implementation**

```
## Implementing: <change-name> (schema: <schema-name>)

Working on task 3/7: <task description>
[...implementation happening...]
✓ Task complete

Working on task 4/7: <task description>
[...implementation happening...]
✓ Task complete
```

**Output On Completion**

```
## Implementation Complete

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 7/7 tasks complete ✓

### Completed This Session
- [x] Task 1
- [x] Task 2
...

All tasks complete! You can archive this change with `/opsx-archive`.
```

**Output On Pause (Issue Encountered)**

```
## Implementation Paused

**Change:** <change-name>
**Schema:** <schema-name>
**Progress:** 4/7 tasks complete

### Issue Encountered
<description of the issue>

**Options:**
1. <option 1>
2. <option 2>
3. Other approach

What would you like to do?
```

**Guardrails**
- Keep going through tasks until done or blocked
- Always read context files before starting (from the apply instructions output)
- If task is ambiguous, pause and ask before implementing
- If implementation reveals issues, pause and suggest artifact updates
- Keep code changes minimal and scoped to each task
- Update task checkbox immediately after completing each task
- Pause on errors, blockers, or unclear requirements - don't guess
- Use contextFiles from CLI output, don't assume specific file names
- In scope mode, never implement tasks outside the declared scope
- In scope mode with `forbid_next_blocks=true`, stop before entering a different major block (example: stop before `2.x` when scope is `1.x`)

**Fluid Workflow Integration**

This skill supports the "actions on a change" model:

- **Can be invoked anytime**: Before all artifacts are done (if tasks exist), after partial implementation, interleaved with other actions
- **Allows artifact updates**: If implementation reveals design issues, suggest updating artifacts - not phase-locked, work fluidly
