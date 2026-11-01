# Twice

**Show it once; it does it twice.** Teach native CRM onboarding for one client. The agent turns the next email/notes into up to five reviewable client rows. A person corrects and confirms them; code previews and replays the accepted actions without a model.

Native Agent-Native Automations has no deterministic mode: the installed 0.222.2 automations documentation states that mode was removed and never implemented. Twice supplies a bounded deterministic executor with agent preparation on every batch.

## Local use

`npm run dev` opens the app at http://127.0.0.1:8851/batches. Continue as local dev. Start from the labelled fictional clients, then teach onboarding in the recipe view. No HubSpot/Salesforce connection is required.

The OpenRouter key is in the project's gitignored `.env` (mode 0600). Node loads it for development and the manual eval; it is never committed or printed. Agent turns use OpenRouter with `openai/gpt-5.4-mini` pinned in app config and UI requests. Replay does not call a model. `npm run dev -- --model-unavailable` explicitly blanks model credentials while retaining database/auth configuration, so dotenv cannot refill them from `.env`.

- `pnpm test` — deterministic compiler, access, concurrency and failure tests plus the CRM template suite.
- `pnpm typecheck` and `pnpm agent-native:doctor` — framework checks.
- `pnpm eval:local` — one real-model messy-email eval in a fresh ignored local database; uses the owner's configured OpenRouter key. This is a lower-level real-agent/action integration eval, not the separate read-only production-chat CI gate.
- `pnpm build` — local build only.

## Boundaries and provenance

One native adapter, three fixed operations per row and at most five rows. IDs bind in code; only client name and optional stage vary. No loops/branches inside recipes, scheduling, row retries, external sends or provider writeback. A started row stays consumed on failure. Known partial IDs remain visible; crashes can leave unknown outcomes. No rollback or exactly-once guarantee.

Parent recipe/batch access intentionally includes its demonstrations, accepted versions, rows and outcomes. Execution separately checks current CRM access and binds the exact accepted version and confirmed inputs through the native approval gate. Generic History snapshots are not accepted execution versions.

See [BUILD.md](BUILD.md) for the bounded contract and [DISCLOSURE.md](DISCLOSURE.md) for framework/template/library/asset attribution and event changes. The first commit is the exact generated CRM template. Local git only; no remote. Deployment, public repository, Clips recording and submission require separate go-ahead.
