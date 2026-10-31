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

## Event work completed

- October 30–31: disposable selection probe around native create-record, add-to-list and create-task; opt-in input/result capture, exact ID fan-out derivation and a model-free single-client replay. One OpenRouter parameter proposal was captured; its fixed-ID classification defect motivated the first product fix.
- October 31: moved the repository and non-secret probe evidence into the durable local project; preserved the baseline commit, no remote or push. The provider key remains in its original owner-only external `.env`, never added to this repository.
- October 31: code now limits parameter paths to client display name and list-entry stage, excludes identifiers/fixed configuration, canonicalizes the record-ID fan-out, and tests the observed model error and invalid references. This compiler is bounded to the three CRM actions, not a general automation engine.

## Still planned; update as implemented

Shared actions/storage, History-backed accepted versions, guarded server-side batch execution, agent preparation, review workbench, MCP demonstration and the messy-email eval. Do not describe these as completed until implementation and evidence are recorded here and in the event note.

No deployment, public repository, Clips recording, publication or submission has been made.
