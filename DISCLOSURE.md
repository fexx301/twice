# Twice: pre-existing work and event development

This is a running disclosure, not a claim that the full entry has shipped.

## Baseline

- Generated with `@agent-native/core@0.222.2 create crm-probe --standalone --template crm` on October 30, 2026, after the official October 27 build start.
- The first local commit, `79b86751fcaef0483576942b68a164f8018fa3e9`, is exactly the generated CRM template before probe or Twice edits. Its original message/author were created by the CLI and are preserved.
- Framework: Builder.io Agent-Native Core/Toolkit 0.222.2 and its first-party CRM template, MIT. The source inspected during selection was `BuilderIO/agent-native@344310a9a9e1e71e85ff695f89ce917856687263`; the generated baseline records release tag `@agent-native/core@0.222.2`.
- Native CRM actions, schema, UI primitives, authentication, sharing, history/progress APIs, chat bridge, widgets and evaluation runtime are framework/template work, not inventions of Twice.

## Libraries and assets

- Runtime/library provenance and exact installed versions are retained in `package.json` and `pnpm-lock.yaml`: React/React Router, Drizzle, PGlite/Postgres, Zod, TanStack Query, Vite, Tailwind and the existing CRM dependencies.
- Provider adapters added for the probe: AI SDK 6, `@ai-sdk/openai`, and `@openrouter/ai-sdk-provider@2.10.0`. Twice's selected agent model is pinned to `openai/gpt-5.4-mini` through OpenRouter.
- Initial font, favicon, Agent-Native marks and CRM icons come from the generated template and its dependencies (`@fontsource-variable/inter`, Tabler icons). No stock photos, generated images or external customer data were added.
- Sample clients and messages are synthetic and must be labelled as sample data. They are not evidence of adoption.
- Deployment uses official Node24 Debian slim, PostgreSQL17 Debian and Caddy2 images, Ubuntu24.04 ARM64, Docker Compose and AWS EC2/SSM/S3. These are existing infrastructure; Twice added Docker stages, private bootstrap/public Compose configuration, Caddy routing, CloudFormation and backup scripts. Pruned production dependencies are included to support authenticated SSR. No new visual assets were added for deployment.
- November2: HappyDOM21.0.4 added only for component regression tests. With explicit owner approval, Toolkit0.222.2 is exact-pinned and patched to notify its deferred-chat drain after an asynchronous save. The patch updates source/compiled JS and adds a reproducing component test; the compiled module's stale source-map reference is removed. Core remains unmodified. This framework repair is event work, not an upstream feature or an unmodified-framework claim.

## Event work completed

- October 30–31: disposable selection probe around native create-record, add-to-list and create-task; opt-in input/result capture, exact ID fan-out derivation and a model-free single-client replay. One OpenRouter parameter proposal was captured; its fixed-ID classification defect motivated the first product fix.
- October 31: moved the repository and non-secret probe evidence into the durable local project; preserved the baseline commit, no remote or push. At that checkpoint the key remained in the original external `.env`; the owner corrected that instruction on November 1.
- October 31: code now limits parameter paths to client display name and list-entry stage, excludes identifiers/fixed configuration, canonicalizes the record-ID fan-out, and tests the observed model error and invalid references. This compiler is bounded to the three CRM actions, not a general automation engine.

- October 31: added scoped Twice storage and shared authoring/preview/run actions, immutable History-backed accepted recipe versions, exact preview payloads, per-row durable claims, native Progress, and deterministic composition of the three CRM actions. Added integration coverage for fresh links, concurrency, stale previews, access, History substitution and partial failures. Core remains unmodified.

- October 31–November 1: added the recipe/batch workbench, native agent turns for parameter and email preparation, native table widget and question UI, action output contracts, route/app-state parity, immutable-version history, and dark/narrow layouts. Used existing Toolkit controls; no new art assets. Real parameter and preparation turns were observed locally.
- November 1: independent Astra/medium review found stale-source and persistence-reporting bugs; corrected them and added regressions. 631 tests and typecheck passed. The corrected real-agent messy-email eval passed in an isolated database (manual lower-level agent/action integration, not the framework's read-only production-chat CI gate). No generated template or Core runtime code was patched.

- November 1: at the owner's instruction, moved the OpenRouter key to the ignored project `.env` (0600), removed the temporary source key file, and changed local launchers to load the project file directly. The application then completed a real pinned-model preparation turn; no credential was committed or displayed. Added a private local signing secret so MCP uses verified signed identity instead of the framework's local owner-header shortcut.

## Still planned; update as verified

Cold-target cancellation was reproduced and corrected without a Core patch; the earlier generic failure remains an explicit rehearsal risk. Native model-off replay, 390px dark-mode QA, local compilation and signed Claude Code/MCP approval/execution now have evidence in evidence/. Final fresh-start rehearsal and saved-skill/helper comparison remain scheduled; eligibility, recording and submission remain pending.

November 1: owner-authorized private EC2 provisioning and HTTPS publication at https://twice-agent.duckdns.org; normal owner account preserved through a runtime packaging repair. Public signup is closed; the application requires sign-in. No public repository, push, Clips recording, posting or hackathon submission has been made.

November2: deployed the approved Toolkit repair after a reproducing regression,631app tests/typecheck/doctor and ARM build. Verified original queued-request recovery without resend, fresh cold preparation, signed cloud ClaudeCode/MCP execution and390px dark UI. Cloud clients are fictional. The external host uses GPT5.4Mini through OpenRouter, not an Anthropic model.
