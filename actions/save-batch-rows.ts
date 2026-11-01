import { defineAction } from "@agent-native/core/action";
import { ACTION_CHAT_UI_DATA_TABLE_RENDERER } from "@agent-native/core/action-ui";
import { dataTableWidgetResultSchema } from "@agent-native/core/data-widgets";
import { saveBatchRowsSchema } from "../shared/twice-actions.js";
import { saveBatchRows } from "../server/twice/authoring.js";
export default defineAction({
  mcpTool: true,
  description:
    "Finish a messy-client-notes agent turn by saving up to five draft client rows, flagging ambiguous or missing stages. Returns a native data-table widget. Use confirm=false for preparation; confirm=true requires a person's exact-table approval. Started rows cannot be replaced.",
  schema: saveBatchRowsSchema,
  needsApproval: (args) => args.confirm,
  run: saveBatchRows,
  outputSchema: dataTableWidgetResultSchema,
  chatUI: { renderer: ACTION_CHAT_UI_DATA_TABLE_RENDERER, title: "Prepared clients" },
  link: ({ result }) => ({
    url: `/batches/${result.summary?.batchId}`,
    label: "Review client rows",
  }),
});
