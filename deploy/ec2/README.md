# Temporary EC2 demo deployment

Selected by the owner: EC2 + stable public IP + owner-managed DuckDNS + HTTPS. Review teardown on November 15 after judging; back up before removal. No cloud resource has been created at this checkpoint.

## Proposed resources and cost

One ARM64 t4g.medium (2 vCPU/4 GiB), standard CPU credits to avoid unlimited-credit charges, encrypted gp3 storage, one Elastic IP, SSM administration, no public SSH. Only Caddy's 80/443 become public after identity setup. PostgreSQL and Node have no public listeners. Single-host downtime is an accepted demo limitation, not high availability.

AWS Pricing API verified Stockholm Linux t4g.medium at $0.0344/hour: $25.11/730h or $11.56/336h. IPv4 at $0.005/hour adds $3.65/$1.68. 30 GiB gp3 storage and backups/transfer are additional; estimated total around $30–35/month, to be recalculated for the approved region. No NAT gateway, load balancer or RDS is proposed.

## Packaging and identity

- Build on Linux ARM64 with the lockfile; never copy macOS node_modules. The Linux ARM64 runtime image built successfully; PostgreSQL 17 migrations and private HTTP startup passed locally. Build memory may require encrypted swap; no compatibility claim yet.
- Root Dockerfile follows the installed framework's Docker guide. Runtime runs unprivileged and contains only the built output. The migration target retains source/tools; run the existing pnpm migrate:production once against the fresh production database before starting app.
- Compose stores Postgres and Caddy state in host directories on encrypted EBS, outside containers. Root/private app.env and db_password are 0600. Never upload local .env, data, MCP configuration or eval outputs. Deploy only a clean private source archive; no public repository or git remote is needed.
- Bootstrap owner through the normal password UI over a private SSM port-forward to 127.0.0.1:8852, while public ingress remains closed. The owner enters their own password. Create the owner workspace privately, then stop bootstrap mode.
- Public mode uses AUTH_SIGNUP=invited with no public invitation/bootstrap admission, ORG_CREATION=closed and no automatic organization creation. Test that new signup is refused and existing owner login works. No email allowlist is treated as verification.
- No global model key: configure the owner's Personal OpenRouter key through the native settings UI. Pin openai/gpt-5.4-mini. Scope isolation and keyless refusal must be tested before publication.
- The owner points DuckDNS to the allocated IP and supplies only the hostname. No DuckDNS token is needed by deployment. Set canonical APP_URL/BETTER_AUTH_URL; Caddy obtains HTTPS only after DNS resolves to this server.

## Validation before publication

Fresh login; public signup refusal; unauthenticated action refusal; private model-key scope; native CRM setup and migrations; real model preparation; immutable approval and deterministic execution; signed MCP approval/deep links against final HTTPS origin; restart persistence; backup and tested restore. Keep a production-only encryption-key recovery copy separately protected from DB backups. EBS persistence is not a backup. A frozen fresh-start rehearsal and earlier generic cold-submit recurrence gate remain required before Clips.

## AWS access resolved

The organization restriction was regional. Existing default CLI credentials work in eu-north-1, matching the owner's AWS console. No organization policy was altered. Use an explicit --region eu-north-1 on every project command; leave the default configuration and other project profiles untouched.

Private provisioning uses Ubuntu 24.04 ARM64 from the regional Canonical public SSM parameter, verified as ami-0335270b14f48b820. All three regional availability zones advertise t4g.medium. Public ingress stays closed until bootstrap and refusal checks pass. The owner handles DuckDNS and will receive the Elastic IP first.
