# Cold-sidebar delivery — November 1, 2026

## Reproduced mechanism

Core/Toolkit 0.222.2, native CRM workbench, prewarming disabled. A controlled first send restored the earlier `newTab:true` request option. The native acknowledgement was:

- submission `f6dd019c-60cd-419c-a60c-4d55ae9221ab`
- delivered: **false**
- reason: **reference-target-changed**

The UI opened a blank chat without delivering the request. No automatic retry was used.

Installed `AgentSidebar.js` lines 453–483 bind queued events to the current reference target and cancel mismatches with exactly that reason. `MultiTabAssistantChat.js` lines 1833–1877 create/switch a thread for `newTab`; its default branch at 1881–1894 instead queues a cold send for the bootstrap thread. The forced thread creation can therefore invalidate the cold sidebar's pending target.

The old `useAgentChatGenerating` send optimistically marks generating=true and listens for running events, not failed-submit receipts. A cancelled request never starts a run, so that state can remain stuck.

## App-owned correction

- Do not force `newTab`; preserve the framework's bootstrap destination.
- Use `sendToAgentChatAndConfirm` with `chatTarget:local` and a correlated submission ID. Never auto-resend a failed or ambiguous submission.
- Track the actual reported chat target with `AGENT_CHAT_SUBMIT_TARGET_EVENT` and the scoped `useAgentChatGenerating` hook.
- Keep separate delivery state and clear it on every terminal receipt. Changed notes invalidate old prepared rows before dispatch.
- No prewarming, delay, Core patch, or copied runtime is used as the fix.

## Observed checks

Before restoring the old option as the control, the corrected default path passed cold first sends without prewarming:

| Case | Submission | Result |
| --- | --- | --- |
| Existing conversation | b353eb7a-f40f-43d7-9a67-bfbe5dbdebb9 | delivered:true; real agent save |
| Empty conversation selected, then sidebar closed/reloaded | 4eced994-9782-4b4b-8169-cf1785544369 | delivered:true; real agent save |
| Forced-new-chat control | f6dd019c-60cd-419c-a60c-4d55ae9221ab | cancelled: reference-target-changed |

Final normal-browser recheck after removing the diagnostic option: **2026-11-01 17:10 UTC**, cold sidebar, first send only. Target and successful receipt occurred at 17:10:11.900 / 17:10:12.472 UTC; native agent completed in 8 seconds and saved 3 rows with Finch blocked. No prewarming, retry or open DevTools was used.

## Limits

A separate earlier observation returned generic `submission-failed`; its original exception was not captured. This control establishes reference-target cancellation and the stuck-loading mechanism, not every possible native chat failure. Any recurrence of the generic failure remains a recording blocker and must be captured before the Nov 8 recording. Successful retries and prewarming do not count as a pass.

A browser debugger logpoint observed the error-preserving send catch without modifying installed code. An earlier pause-on-caught attempt stopped on React's normal Suspense promise and distorted the timeout; that run is discarded. Only error/correlation metadata was collected, never credentials or request headers.
