# Twice local build contract

One operator; native CRM only; three fixed actions per client; at most five input rows. Teach one real client, let the agent propose literal parameters, correct/accept a version. Each new batch: pasted notes → agent prepares rows → person corrects/confirms → exact preview → approved code replay. No model in replay.

## Scope and cuts

No general recorder, loops/branches in a recipe, extra adapters, scheduling, row retries, provider writeback, inbox integration, external sends or rollback guarantees. No deployment, public repo/push, recording, posting or submission without separate go-ahead. Later recording must use Clips itself. Existing framework/template components remain attributed in DISCLOSURE.md.

## Done evidence

- Six shared UI/agent actions, AGENTS/skill guidance and recipe/batch app-state/view-screen parity.
- Code owns fixed configuration and exact record-ID fan-out; agent output restricted to allowed literal paths.
- Real UI agent parameter proposal and per-batch messy-email extraction, native table widget and ambiguous-stage askUserQuestion; Accept/Edit/Retry.
- Accepted History Kit versions preserve human/agent provenance; corrections survive reload and guide later batches.
- Frozen version/row approval; server-side execution; Progress; atomic permanent row claim; fresh links; original and blocked clients untouched; partial outcomes explicit.
- Real model-unavailable replay; focused negative/concurrency tests; one real messy-email \*.eval.ts; doctor/typecheck/build clean.
- MCP run-batch with deep link, invoked from Claude; no fabricated external-host evidence.
- Populated labelled samples, dark mode, 390px check. No wizard.

## Latest milestones, 21:00 WAT

| Date   | Required evidence                                                                                                             |
| ------ | ----------------------------------------------------------------------------------------------------------------------------- |
| Oct 31 | Durable local project, exact generated first commit, provider/config kept private, classification fix and scaffold disclosure |
| Nov 1  | Capture and one-row replay; typed parameter/row records                                                                       |
| Nov 2  | Thin teach → correction → agent messy-input preparation → human confirmation → replay                                         |
| Nov 3  | Five-row run, immutable approval, uncertainty/invalid-input/old-ID negatives                                                  |
| Nov 4  | Saved correction after reload; later preparation follows it; model-free replay preserves original/blocked rows                |
| Nov 5  | Saved-skill/helper comparison and remaining usability/quality risks                                                           |
| Nov 6  | Freeze, fresh-start rehearsal, attribution/disclosure                                                                         |
| Nov 7  | Description and submission readiness                                                                                          |
| Nov 8  | Separately authorized Clips and signed-out access check                                                                       |
| Nov 9  | 18:00 final check; separately authorized submission/receipt by 21:00                                                          |

These dates are latest dates, not start dates. No scope added for starting Oct 31. Official close: Nov 10 08:59 WAT, 11h59 after the internal close. Objective: prize competitiveness; demand and comparative time savings remain unproven until separately measured.

Pitch supported by installed 0.222.2 docs/content/automations.mdx: native Automations' deterministic mode was removed and never implemented. Twice provides a bounded deterministic native-action executor, with agent preparation on every batch.

## Verified local checkpoint — 2026-11-01 18:24 WAT

631 tests, typecheck and doctor pass; local bundle compiles (production configuration remains unset). Key migration, causal cold-target control, native question correction, model-off replay, signed Claude Code/MCP approval/execution and 390px dark-mode checks are recorded in evidence/. Remaining scheduled work is the comparison, frozen fresh-start rehearsal/review, eligibility and authorized recording/submission work.

## Deployment scope amendment — 2026-11-01 23:32 WAT

Owner selected EC2 + DuckDNS + HTTPS, will manage DNS, requested cost-effective resources and a Nov15 teardown review. Stockholm is the permitted AWS region. Free Tier plan rejected t4g.medium; replacement t4g.small succeeded. Private server i-0c3ab7ec7050236ea, stable IP13.50.127.119, hostname twice-agent.duckdns.org. Public ingress remains gated by owner bootstrap, signup refusal and HTTPS validation. No public Git remote/Clips/submission authorized. Runtime dependency packaging error found after owner signup; database preserved, corrected image passed authenticated SSR locally, cloud update in progress.

## Current feature freeze — November2

Code `ed5d7a4`, ARM image `twice:ec2-demo-polish`, deployed at https://twice-agent.duckdns.org. [Release checks](evidence/frozen-release-2026-11-02.md):631tests/typecheck/14-guard doctor pass; fresh-data full UI rehearsal4Done/1Blocked with independent original/binding/persistence checks; signed cloud MCP2Done/1Blocked with exact approval; final presentation regression and390px check pass. Toolkit repair is pinned, reviewed and disclosed. Native skill also completed the routine; [comparison](evidence/comparison-2026-11-02.md) supports the narrower UI/control contribution, not general superiority.

No scope added. Feature work is frozen. [Entry draft](ENTRY-DRAFT.md) is local only; remaining gates are owner eligibility/creator/contact confirmation, Clips setup/recording/public access check and submission/receipt, with the required separate authorizations. Nov15 remains a teardown review after judging, not automatic deletion.

## Review fixes — November 6

End-to-end review: no execution/claim/authoring correctness bug; seven smaller issues fixed, plus HSTS, 30-day backup expiry and a first workbench component test. 634 tests/typecheck/doctor pass. Deployed as `twice:ec2-review-fixes` (app only, pre-deploy backup); public refusal checks pass. First S3-download restore drill passed. Fresh-start local rehearsal with the real model: 4Done/1Blocked/0Partial, new-demonstration restart verified. Git history rewritten to carry redacted screenshots; pre-rewrite commit hashes in earlier notes are historical. Details: [evidence](evidence/review-fixes-2026-11-06.md). Eligibility, Clips recording/public access check and submission still need the owner.
