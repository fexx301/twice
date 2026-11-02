# Twice and a saved native skill — bounded capability comparison

**Result:** the saved skill also completed the routine: two correctly linked accounts/list entries/open tasks, with the uncertain client uncreated. [Independent SQL verification](native-skill-control-2026-11-02.json), [saved skill](native-skill-control-SKILL.md), [real native UI](native-skill-control-2026-11-02.png).

## Fair control

Original generated CRM source at `79b8675`, detached local worktree `/Users/femi/Documents/Twice-native-control`; separate PGlite test data. Installed dependencies were copied from Twice, including the same Toolkit queue fix. No Twice instructions or actions were present. Both used OpenRouter `openai/gpt-5.4-mini`, native CRM actions and labelled fictional clients.

The control received a fully specified three-action workflow and binding rules, a favourable setup baseline. Native agent created its connection and saved a personal skill. Initial list discovery failed; an exact single-name `tool-search` succeeded. It created the list, saved the real fixed IDs, and reread the resource. This was a discovery correction, not a missing platform capability.

In a fresh chat, the skill previewed Willow/New, Copper/InProgress and Slate/unknown. The preview loosely called `blocked` a stage; the approval clarified that this was a review status and Slate must remain uncreated. The agent then executed the approved two clients and read back the results. Independent queries after stopping the isolated server verified the two real stage values, fresh-ID fan-out, exact list/task settings, personal saved skill and zero Slate records.

Native UI reported22s preparation and35s execution for this one case. These are not matched stopwatch trials or evidence of general speed/cost/reliability differences. Setup included prompting and correction; it is not a novice-user usability study.

Earlier attempts inside Twice were invalid controls: its domain instructions steered the agent into Twice actions. They are excluded. The temporary production skill was converted to an inert archive, its command disabled, and moved out of `skills/` using the public resource API with content/ownership preserved.

## What the evidence supports

| Capability | Native skill | Twice |
|---|---|---|
| Reuse fixed settings and handle several clients | Demonstrated | Demonstrated |
| Leave an uncertain client untouched | Demonstrated in this trial | Demonstrated and enforced by preview/run validation |
| Persist updated instructions/settings | Demonstrated | Structured parameters and immutable accepted versions demonstrated |
| Generate writes and bind returned IDs | Agent chose correct calls in this trial | Code executes the frozen recipe/rows; local model-off proof is separate |
| Review and correct | Conversation/resource editing | Dedicated parameter/row controls, native question, exact preview and bound approval |
| Prevent a started row from running again | Instruction in this baseline | Persisted per-row consumption guard; no exactly-once, retry or rollback guarantee |

A skill plus a code helper could plausibly reproduce deterministic execution and these guards. That alternative was not implemented or tested; no superiority claim over it is established.

**Defensible pitch:** a native skill already handles this routine through agent-driven actions. Twice adds a dedicated teaching/correction interface, immutable recipe versions, exact-input approval and code-driven execution with persisted row states and guards against rerunning started rows.

This establishes a working composition and control interface, not new automation capability, customer demand or measured time savings. Current app-level rubric judgment: Usefulness/Execution7.5, Creativity/Design7.0, Innovation7.0, Cleverness/Agent-Native8.5. Creativity and Innovation were reduced from the earlier8.0/7.5 forecast after observing the delivered UI and control. Weighted estimate7.5/10 is not a measured score or winning probability. Prize objective, rubric forecast and delivery evidence remain separate.
