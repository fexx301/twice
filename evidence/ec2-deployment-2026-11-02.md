# Owner-only EC2 deployment — Nov 1–2, 2026

Verified by 00:00 WAT Nov2. Deployment was separately authorized; no public repository, recording, posting or submission.

## Resources and packaging

- AWS default session, explicit eu-north-1; no organization policy modification. Stack `twice-demo-small-2026`, instance `i-0c3ab7ec7050236ea`, t4g.small ARM64, encrypted30GiB gp3, standard CPU credits. The t4g.medium attempt was rejected by the account Free Tier plan and rolled back.
- Elastic IP `13.50.127.119`; owner-controlled `twice-agent.duckdns.org` A record verified, no AAAA. Only80/443 published by Caddy; no SSH/app/database public listeners.
- Linux ARM64 migration image applied the framework and CRM/Twice schema before app startup. Production secrets are fresh, encrypted/private, separate from local development; no global model key.
- Initial runtime failed authenticated SSR with `Cannot find module 'react'`. Dockerfile now copies pruned Linux production dependencies plus package metadata. Local preserved-owner login and authenticated `/batches` HTTP200 passed. Replacement runtime `sha256:86d246750549bc5e6ad38c1c5923cd13779066426d6787040b2a2f9ea1411c5b` was loaded without changing the database. Actual owner dashboard rendered all five labelled sample clients privately.

## Public acceptance checks

- SSM command `f25a2e8c-5ddb-42b0-8d8c-63261c27ff37`: base Compose only, explicit `TWICE_HOST=twice-agent.duckdns.org`; no bootstrap or inspect override. APP_URL/BETTER_AUTH_URL are canonical HTTPS, AUTH_SIGNUP=invited, ORG_CREATION=closed, AUTO_CREATE_DEFAULT_ORG=0. CloudFormation UPDATE_COMPLETE.
- HTTPS `/batches` HTTP200, TLS verification0; HTTP308 redirect to HTTPS. Browser shows branded sign-in without local-development shortcut.
- Public anonymous `get-twice-workspace`401; uninvited email signup403. No disposable signup account was created.
- Owner reported initial credential rejection/loading, then successful sign-in. Browser at HTTPS `/batches` reached authenticated optional onboarding and model settings; private account preserved. No password read, printed, changed or reset.
- Remaining private-origin configuration warning disappeared with canonical HTTPS.
- Health command `9a4fdf6f-4935-45d2-a9f7-78c35bba13e4`: all containers running, zero restarts/OOM; app200.5MiB, DB80.94MiB, Caddy24.2MiB idle. Model-load headroom remains unverified.

## Backup and review

- `c0799a49-4e53-4cf7-a885-6f3df34af91c`: custom-format pg_dump uploaded to private S3 with SSE AES256. Same local dump restored into scratch database; five Twice rows read, scratch removed. This is not an S3-download recovery drill.
- Daily root cron01:15UTC installed with correct final newline; cron service active. Production encryption-key recovery copy is separately protected; database dump alone is insufficient for encrypted credentials.
- Astra/medium independent review: PROCEED for public step after private auth/restore checks; explicit hostname/base-only Compose and public verification required. Applied. Personal-key setup, real model preparation, memory under model load and signed MCP against final origin remain pending.
- Owner is at native OpenRouter Add provider form, Personal selected. User must enter/save key; model remains `openai/gpt-5.4-mini`. No new provider configured yet at this checkpoint.

Estimated list price $19–22/month, $9–12/two weeks; credits not assumed. Nov15 teardown review must include retained EBS/S3 resources. `prepare-host.sh` records the initial private bootstrap, whose original runtime artifact was subsequently replaced; do not rerun bootstrap over the live service.

Next: verify saved Personal provider and real preparation; inspect memory/restarts, deterministic replay and final-origin signed MCP; then frozen rehearsal and saved-skill/helper comparison. Cold generic-submit recurrence still blocks recording. No recording/submission authorization yet.
