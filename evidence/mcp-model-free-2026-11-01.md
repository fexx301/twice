# Signed MCP and model-free product replay — November 1, 2026

- Claude Code 2.1.316, using OpenRouter `openai/gpt-5.4-mini`, prepared a labelled synthetic batch through the shared actions. This is the Claude Code host, not an Anthropic model.
- The initial local owner-header shortcut correctly failed the verified-identity approval requirement. A normal device authorization with local signing configured issued a revocable signed credential; it remains ignored and owner-only.
- With the app server in model-unavailable mode **after the key moved into project dotenv**, an authenticated CLI model check failed with no OPENROUTER_API_KEY. The launcher explicitly blanks provider variables so dotenv cannot refill them.
- Claude Code called preview-batch and run-batch. Native approval stopped execution and produced review 92661fb1-bbbe-4d77-bbfd-fe796da744da. The browser displayed the exact accepted version, rows, fixed settings and hash; approval was granted once.
- Claude Code then called run-batch with structurally identical JSON to the approved call (asserted against the retained original), followed by get-twice-workspace. **2 Done, 1 Blocked, 0 Partial.** Finch has startedAt:null and no record ID: no execution was attempted for the blocked row. See the adjacent JSON for real linked output IDs.
- Real result link: http://127.0.0.1:8851/batches/3cf21a18-2b96-4cf7-a68e-d58904d6f86f
- The app execution path had no model credentials. The external host still used its model to choose the tool call; this does not imply the whole host interaction was model-free. The recipe itself executed in server code only.
- Earlier native-UI replay separately completed four clients and left one blocked with the model unavailable. The 390px dark-mode check showed document/client width 390, no horizontal overflow. Local bundle compilation passed; deployment configuration is deliberately unset.

No Clips recording, deployment, public repository, posting or submission occurred. Credentials and raw private configuration are excluded from these artifacts.
