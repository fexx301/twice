# Temporary EC2 demo deployment

Selected by the owner: EC2 + stable public IP + owner-managed DuckDNS + HTTPS. Live at https://twice-agent.duckdns.org on November 1. Review teardown on November 15 after judging; back up before removal.

## Proposed resources and cost

One ARM64 t4g.small (2 vCPU/2 GiB), standard CPU credits to avoid unlimited-credit charges, encrypted gp3 storage, one Elastic IP, SSM administration, no public SSH. Only Caddy's 80/443 become public after identity setup. PostgreSQL and Node have no public listeners. Single-host downtime is an accepted demo limitation, not high availability.

AWS Pricing API verified Stockholm Linux t4g.small at $0.0172/hour: $12.56/730h or $5.78/336h. Public IPv4 adds $3.65/$1.68; 30GiB gp3, private artifacts/backups and transfer are additional. Estimated list-price total around $19–22/month or $9–12 for two weeks; account credits may cover eligible usage, not assumed. No NAT gateway, load balancer or RDS is used.

## Packaging and identity

- Build on Linux ARM64 with the lockfile; never copy macOS node_modules. Cloud ARM64 migrations, real preparation and native replay passed. Build locally in Docker; do not rebuild on the small EC2 host.
- Root Dockerfile follows the installed framework's Docker guide. Runtime runs unprivileged and contains the built output plus pruned Linux production dependencies required by SSR. The migration target retains source/tools; run the existing pnpm migrate:production once against the fresh production database before starting app.
- Compose stores Postgres and Caddy state in host directories on encrypted EBS, outside containers. Root/private app.env and db_password are 0600. Never upload local .env, data, MCP configuration or eval outputs. Deploy only a clean private source archive; no public repository or git remote is needed.
- Bootstrap owner through the normal password UI over a private SSM port-forward to 127.0.0.1:8852, while public ingress remains closed. The owner enters their own password. Create the owner workspace privately, then stop bootstrap mode.
- Public mode uses AUTH_SIGNUP=invited with no public invitation/bootstrap admission, ORG_CREATION=closed and no automatic organization creation. Test that new signup is refused and existing owner login works. No email allowlist is treated as verification.
- No global model key: configure the owner's Personal OpenRouter key through the native settings UI. Pin openai/gpt-5.4-mini. Scope isolation and keyless refusal must be tested before publication.
- The owner points DuckDNS to the allocated IP and supplies only the hostname. No DuckDNS token is needed by deployment. Set canonical APP_URL/BETTER_AUTH_URL; Caddy obtains HTTPS only after DNS resolves to this server.

## Validation before publication

Fresh login; public signup refusal; unauthenticated action refusal; private model-key scope; native CRM setup and migrations; real model preparation; immutable approval and deterministic execution; signed MCP approval/deep links against final HTTPS origin; restart persistence; backup and tested restore. Keep a production-only encryption-key recovery copy separately protected from DB backups. EBS persistence is not a backup. A frozen fresh-start rehearsal and earlier generic cold-submit recurrence gate remain required before Clips.

## AWS access resolved

The organization restriction was regional. Existing default CLI credentials work in eu-north-1, matching the owner's AWS console. No organization policy was altered. Use an explicit --region eu-north-1 on every project command; leave the default configuration and other project profiles untouched.

Private provisioning uses Ubuntu 24.04 ARM64 from the regional Canonical public SSM parameter, verified as ami-0335270b14f48b820. t4g.small is explicitly listed as Free Tier eligible. The previous t4g.medium attempt was rejected by the account Free Tier plan and rolled back. Public ingress stays closed until bootstrap and refusal checks pass. The owner handles DuckDNS and will receive the Elastic IP first.

Local production rehearsal passed: ARM64 image, PostgreSQL17 migrations, unauthenticated401, private signup/sample rows, closed signup403, existing-owner login200 and five rows afterrestart. Measured idle memory app156MiB +DB48MiB. Selected small runtime limits app1200MiB/Nodeheap768MiB,DB512MiB,2GiB encrypted swap.

Runtime packaging correction: `.output` alone omitted React required by authenticated SSR in this framework build. Dockerfile now copies pruned production dependencies and package metadata, verified with preserved-owner login plus authenticated `/batches` HTTP200, then deployed without changing the database.

## Live operations

`prepare-host.sh` records initial private bootstrap, not an upgrade command. Its original runtime artifact was later replaced by `artifacts/twice-runtime-fixed.tar.gz`; do not rerun bootstrap over the live service.

Stack `twice-demo-small-2026`, instance `i-0c3ab7ec7050236ea`, Elastic IP `13.50.127.119`, region `eu-north-1`. SSM only, no SSH. Host release: `/srv/twice/release`. Canonical public startup (never include bootstrap/inspect overrides):

```sh
TWICE_IMAGE=twice:ec2-queue-fix TWICE_HOST=twice-agent.duckdns.org docker compose -f deploy/ec2/compose.yaml --profile public up -d --no-build app caddy
```

Public checks passed: trusted HTTPS, HTTP308 redirect, anonymous401, signup403, public owner sign-in, Personal pinned provider, real preparation and native/MCP execution. App/DB have no host port mappings. Current image includes the authorized Toolkit queue correction (`evidence/cold-deferred-2026-11-02.md`). App306MiB after bounded real turns, zero OOM/restarts; not a load test.

Daily root cron at 01:15 UTC runs `/srv/twice/backup.sh`; private encrypted S3 bucket `twice-demo-small-2026-artifacts-uouv3jytpvzc`, prefix `backups/`. The first custom-format dump restored into a scratch database with all five sample rows, then the scratch database was removed. This verifies the local dump, not an S3-download recovery drill. Preserve the separate production encryption-key recovery copy: DB backups alone cannot decrypt saved keys.

Before Nov15 teardown: take and verify a final backup, preserve required evidence and recovery keys, then remove the stack and explicitly review its retained encrypted EBS volume and S3 bucket plus Elastic IP. Retained storage continues to cost money. No teardown has been executed.
