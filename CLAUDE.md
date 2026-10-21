# 3d-portfolio

Portfolio site for my 3D modeling and game developer work.

## Tech Stack

- React
- Tailwind CSS
- Three.js

## Spec Driven Development (SDD)

Workflow: `/spec` → human review → `/plan` → human review → `/tasks` → human review → `/build` (one task) → `/verify` → repeat.

- Specs live in `specs/<NNN>-<name>/` with `spec.md`, `plan.md`, `tasks.md`.
- Main agent is an **orchestrator**: it launches subagents and never writes spec/plan/tasks/code itself.
- Subagents (`.claude/agents/`):
  - `sdd-planner`: writes spec.md, plan.md, tasks.md. Only for those.
  - `sdd-builder`: implements ONE task from tasks.md. Only for that.
  - `sdd-reviewer`: read-only check that the code meets the spec requirements. Runs only when the user invokes `/verify`.
  - `sdd-browser`: read-only browser checks (dev server, built-in browser pane, console/network, responsive, screenshots). The orchestrator NEVER runs browser tools or the dev server itself; it delegates to `sdd-browser` and reads only its report. Use it after a build whose "Done when" is visual/runtime, before the user's manual review.
- Review of spec, plan and tasks is **human** review: stop after each and wait for the user. The reviewer subagent is not part of that; it reads those approved files as the requirements.
- If anything fails or is ambiguous: stop and ask the user. Never improvise.
- Task markers in tasks.md: `- [ ]` pending, `- [~]` built (awaiting `/verify`), `- [x]` verified by reviewer (PASS).

## Token budget

- Orchestrator: never read whole spec/plan/tasks files (they run 20-70k chars). Grep `^- \[[ ~x]\] T-` for task state; pass subagents only the spec path + task ID.
- Builder/reviewer read only their task block plus the FR/AC/plan sections it cites.
- Browser: only for tasks with `Browser: yes` or visual/runtime "Done when", with a specific checklist in the prompt (one desktop viewport unless more are asked). Prefer one `javascript_tool` call over screenshots. Not for re-checking what tests/build already prove.
- Keep context under ~150k: auto-compact is set in `.claude/settings.json`; run `/compact` or start a fresh session between SDD steps (spec, plan, tasks, each batch of builds) since state lives in the spec files, not the chat.
- Models: builder/reviewer/browser = sonnet; planner = inherit (planning quality matters most). Use haiku only for trivial one-file edits.
