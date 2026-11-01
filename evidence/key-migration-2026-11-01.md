# Provider-key migration — November 1, 2026

- Owner explicitly corrected the earlier temporary-location instruction.
- OpenRouter key moved to the project's `.env`; file mode is 0600 and `git check-ignore .env` confirms exclusion. The temporary source key file was removed after the atomic destination write. No secret value was printed.
- Local development and eval launchers now address the project `.env` directly.
- After server restart, the native UI preparation request was accepted without prewarming (submission b353eb7a-f40f-43d7-9a67-bfbe5dbdebb9, delivered:true). The running server resolved `ai-sdk:openrouter` / `openai/gpt-5.4-mini`.
- Persisted readback through signed MCP shows an agent/tool save at **2026-11-01 12:47:37 UTC** in thread `877258fe-f98e-45e5-999b-99e99ae48401`, batch `3cf21a18-2b96-4cf7-a68e-d58904d6f86f`: Maple Books/new/Draft; Tide Studio/in-progress/Draft; Finch Workshop/null/Blocked. This is a real model-backed application turn, not only a provider smoke request.
- This verifies the new credential location. It does not close the separate intermittent cold-sidebar delivery blocker, whose original caught exception still needs capture.

Secret-bearing `.env` and MCP configuration remain ignored and owner-only. The model-unavailable launcher explicitly blanks provider variables, because merely omitting an external env file is insufficient after the key moves into the project's dotenv file. Re-verification of model-off replay follows that change.
