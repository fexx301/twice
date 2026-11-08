# Twice — local entry draft

Nothing in this file has been posted or submitted. Public Clips recording requires the owner's separate go-ahead.

**Name:** Twice

**Tagline:** Show it once; it does it twice.

## Description

Twice captures one bounded native CRM onboarding routine: create a client, add it to a list and create a follow-up task. The agent proposes changing name/stage parameters and turns each new batch of pasted notes into reviewable rows. You correct uncertainty, inspect exact inputs and approve. Code then repeats the accepted actions, linking each new client to the correct list entry and task. Blocked rows receive no writes; started rows cannot be run again.

Preparation uses OpenRouter `openai/gpt-5.4-mini`. Twice's approved executor makes no model calls. Native actions, shared data, History, approvals, Progress and MCP connect the interface and agent work.

## Scope and disclosure

One operator, Native SQL CRM, three operations, at most five rows. No external sends, provider writeback, scheduling, row retries or rollback/exactly-once guarantee. The workflow shape is fixed; this is not a general task recorder.

Built from Agent-Native Core/Toolkit0.222.2 and its MIT CRM template. Twice added opt-in trace capture, literal-parameter validation, returned-ID binding, owned recipe/batch state, immutable acceptance and guarded execution. One pinned Toolkit queue-notification repair is disclosed. Full templates/libraries/assets and event changes: [DISCLOSURE.md](DISCLOSURE.md).

A native skill already handles the routine through agent-driven actions. Twice's contribution is the dedicated teaching/correction interface, exact-input approval and code-driven execution with persisted row states. No time-saving, customer-adoption or exclusivity claim.

## Short live Clips plan

Use a fresh isolated workspace and labelled fictional clients. Record with Clips itself (desktop or Chrome extension with developer logs), never an edited-video upload. Prepare any scoped MCP connection before capture.

1. Show one client setup: create → list entry → follow-up; capture the actual inputs/results.
2. Agent proposes parameters. The operator corrects/confirms per-client stage variability and saves a version.
3. Paste five messy client notes. Show the native table and uncertainty. Override one prepared stage based on an explicitly stated fictional update; resolve one unknown through the native question and leave another blocked.
4. Preview the exact four-ready/one-blocked work. Approve once; show real linked outcomes. Include a real Claude Code/MCP invocation and its app link when the recording workspace is prepared.
5. Briefly show the saved correction after reload. Model-off execution evidence supports the story; the agent's preparation job stays visible.

No rule sets a duration; aim for about two minutes without hiding material waits or failures.

## Pending before entry

- Creator/display name, contact and eligibility: owner confirmation required.
- Public Clips URL: https://clips.agent-native.com/share/V6Dfg0mECuPs ("Twice demo", silent, trimmed to 7:00 in Clips; signed-out access verified Nov 8).
- Live app: https://twice-agent.duckdns.org (owner sign-in required); public repository https://github.com/fexx301/twice (made public Nov 8 at the owner's instruction).
- Submission form and receipt: pending separate authorization. Internal deadline Nov9 21:00WAT; official close Nov10 08:59WAT.
