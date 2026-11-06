# Review fixes, deployment and fresh-start rehearsal — November 6

An end-to-end review found no execution, claim or authoring correctness bug. It found seven smaller issues, all fixed:

- `prepare-host.sh` refuses to run while Caddy is up (its bootstrap override opens signup).
- Owner email cropped from five desktop evidence screenshots (also converted from mislabelled JPEG to PNG); git history rewritten so earlier commits carry the redacted images. Sample recipe/batch IDs are now keyed with the server secret instead of an unsalted email hash.
- `CLAUDE.md` now imports `AGENTS.md`, so Claude Code sessions see the Twice rules.
- `stageLabel` no longer throws on a malformed stored stage (which blanked the batch page).
- A run that loses the race for a batch records every remaining row as "Not attempted" instead of dropping it from the outcomes.
- The recipe view can start a new demonstration (the action already supported it); a capture that fails after account creation names the created record.
- Captured list-entry stage is verified against the stored entry; `@agent-native/otel` pinned to 0.1.29; README uses pnpm.

Additions: HSTS header; 30-day expiry for S3 `backups/`; first workbench component test (`app/components/twice/TwiceWorkbench.test.ts`).

## Checks

- 634 tests (was 631), typecheck, 14-guard doctor clean; Toolkit deferred regression 6/6. The new double-run assertion and the stage-label test were each confirmed to fail on the pre-fix code.
- Image `twice:ec2-review-fixes`, ARM archive SHA256 `3e624069501fecdef2099708d3cf6cb5779e0fb8ac396a328e4ca482f3150e5a`. Encrypted pre-deploy backup; SSM `21cf6293-21aa-4a8f-bf8a-f40cc4666eb7` verified the checksum and replaced only the app: zero restarts/OOM, AUTH_SIGNUP=invited, ORG_CREATION=closed.
- Public: HTTPS 200 with trusted TLS, HTTP 308, anonymous `get-twice-workspace` and `run-batch` 401, uninvited signup 403 (no account created), `Strict-Transport-Security: max-age=31536000`.
- CloudFormation change set `backup-expiry`: only the bucket lifecycle changed directly (policy/role were dynamic re-evaluations of an unchanged ARN); UPDATE_COMPLETE.
- **First S3-download restore drill** (SSM `d7cc8f6d-9f27-4585-9a2b-acdfe9734b7a`): newest backup fetched with a 10-minute presigned URL (the host role stays write-only for backups), SHA256 matched object metadata, restored into a scratch database; recipes 1/1, batches 4/4, rows 14/14, runs 3/3, CRM records 9/9 live vs restored. Scratch database and download removed.

## Fresh-start rehearsal (local, isolated)

Port 8854, fresh PGlite `.cache/rehearsal-2026-11-06`, local development identity, fictional samples, real OpenRouter `openai/gpt-5.4-mini`; headless Chrome via Playwright. Production untouched.

1. Fresh workspace initialized with the five labelled sample rows (new keyed IDs).
2. Captured one client, then **Start a new demonstration** reset capture 1/3 → 0/3; re-captured 3/3.
3. Real agent proposed client name and stage (stage flagged uncertain). Person confirmed both and accepted a version; it remained Current after reload.
4. Real agent prepared the sample email: exact source excerpts, Northstar and Moss blocked. Native question resolved Northstar → New; Moss stayed blocked.
5. Accept table → preview 4 ready · 1 blocked → one approval → **4 Done / 1 Blocked / 0 Partial**, unchanged after reload.
6. Read-back: one complete run on the active version; four distinct fresh record IDs each with entry and task; Moss unstarted with no record; the demonstration record was not reused. [Screenshot](review-fix-rehearsal-2026-11-06.png).

Not covered: the "created but not captured" message (needs an induced capture failure); a live-production UI pass after deploy.
