import { defineAction } from "@agent-native/core/action";
import { saveBatchRowsSchema } from "../shared/twice-actions.js";
import { saveBatchRows } from "../server/twice/authoring.js";
export default defineAction({ description: "Finish a messy-client-notes agent turn by saving up to five draft client rows, flagging ambiguous or missing stages. Returns a native data-table widget. Use confirm=false for preparation; confirm=true requires a person's exact-table approval. Started rows cannot be replaced.", schema: saveBatchRowsSchema, needsApproval: args => args.confirm, run: saveBatchRows,
  link: ({ result }) => ({ url: `/batches/${result.summary?.batchId}`, label: "Review client rows" }),
});
