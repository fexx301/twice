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

Pending: clean ARM runtime build; inspect consumed compiled notification; back up and replace app only; recover the original submission without resending; verify one server submission/typed save and empty deferred queue; repeat one fresh collapsed-sidebar/new-batch preparation; finish signed cloud MCP execution. Recovery of an existing persisted request alone does not prove the new-send race is fixed. Any distinct generic submit failure remains a recording blocker.
