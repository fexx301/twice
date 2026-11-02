# Deferred native-chat restore race — November 2

The first deployed cold proposal and first email preparation each completed in6s. A later collapsed-sidebar → new batch → single Prepare saved notes but produced no agent message or rows. No retry was sent.

## Causal evidence

- Batch `2efebf53-4675-4ab8-98a0-34045a7e846d` remained revision1 with saved fictional source notes and human provenance.
- Server inbox contained only the two earlier runs; chat thread `23fa97af-c5b2-4c68-bc14-225c21f43460` had four messages.
- Application state held deferred submission `08064e53-b4df-4a86-a0d6-b7883b19df5d`: unclaimed, not failed, no attempts/expiry, `deferredFromApp:true`. The framework had acknowledged it as delivered before server submission.
- In Toolkit0.222.2 `AgentKitAssistantChat`, a restoring send awaits deferred persistence, assigns a ref, then sets an already-loaded thread ID. If restoration finished during the await, the drain effect already observed an empty ref. Same-value state does not wake it. The version counter that the drain depends on was not incremented.

## Authorized correction and proof

The owner explicitly approved an exception to `.agents/skills/customizing-agent-native/SKILL.md`'s no-patch rule. Official npm latest was still0.222.2. Astra/medium reviewed the source, evidence and patch: PROCEED to gated rebuild/deployment.

`patches/@agent-native__toolkit@0.222.2.patch` adds the missing version notification in source and consumed compiled JS. The compiled module's source-map reference is removed to avoid misleading mappings after insertion. Toolkit is exact-pinned, pnpm records the patch hash, and Docker copies patches before frozen installation. Core auth/agent execution and native queue claims/deduplication are unchanged.

The patch also carries an actual-component regression: pause the deferred-state CAS, finish restoration and let the drain observe an empty queue, then resolve persistence without another unrelated state change. Baseline sends zero times and fails; corrected component sends once, removes the queue item and remains at one after rerender. Five existing expiry/failure/live-claim checks also pass. `scripts/test-toolkit-deferred.mjs` runs these from an isolated temporary copy of the installed package; `--baseline` removes only this notification in that copy. It does not change installed dependencies.

Verified before ARM rebuild: 631 app tests, typecheck, 14-guard doctor with zero findings, six installed-package component checks. Baseline: one intended failure/five passes. Extracted upstream fixtures were moved outside the app so doctor scans the product rather than a second copy of the framework; no guard was disabled. HappyDOM21.0.4 is a new test-only dependency.

## Deployment and acceptance — Nov2 08:32 WAT

- Repair commit `2b9212f`; frozen ARM64 build/doctor passed. Runtime inspection confirms the compiled notification and React19.3.1. Archive SHA256 `2e4c9d4a2d96cdbb75c5009648675c23aed99448bd9dfe4ca8c2afeb329e7671`; private upload and host hash verification passed.
- Pre-update encrypted backup succeeded (`cbbb6a15-9d50-4cb1-9a1b-c55a3f87c2e2`). Deployment `c8d94288-c066-4204-b8ac-e99320090da5` found one original queued request and zero prepared rows before replacing only the app with `twice:ec2-queue-fix`. DB/keys/account preserved. Host verifies ARM64/compiledQueueFix:true; HTTPS200/trusted certificate.
- Opened the saved native chat after reload; did not click Prepare again. Original request recovered in7s, saving Poppy/Spruce drafts and Harbor blocked. Revision1→2 and agent provenance establish one typed save; deferred entry disappeared.
- Searching the inbox payload for the deferred ID was the wrong linkage: that ID is not retained there. Corrected verification uses persisted recovered user-message `message-12366ffa-8489-43d4-bb88-059489af84a1`, with exactly one submitted inbox entry.
- **Fresh test:** collapsed sidebar → new batch `1fc3d2ba-a4a6-47ef-9342-dbdc297f5e20` → one Prepare, without prewarm/delay/retry. Agent saved Marigold/Oak drafts and Reed blocked. Human confirmation then made two Ready. Assertions (`003ba29f-ddef-49ea-b055-69613d2ecf15`): zero deferred entries, four inbox entries/eight chat messages total (initial two turns + recovery + fresh turn), agent provenance and one save per preparation. App306MiB, zero OOM/restarts.
- [Signed cloud MCP](cloud-mcp-2026-11-02.md) then produced **2Done/1Blocked/0Partial**. Independent readback matches approved version/hash; Reed remains unstarted/no record.390px dark mode has document width390, readable cards/outcome links; viewport restored.

The demonstrated restore race is repaired and these recurrence checks pass. This does not rule out every possible generic submit failure; a distinct recurrence still blocks recording. Frozen rehearsal and saved-skill/helper comparison remain scheduled. No recording, posting or submission performed.
