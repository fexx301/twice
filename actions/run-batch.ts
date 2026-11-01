import { runOutputSchema } from "../shared/twice-outputs.js";
import { defineAction } from "@agent-native/core/action";
import { runBatchSchema } from "../shared/twice-actions.js";
import { runBatch } from "../server/twice/execution.js";
export default defineAction({
  outputSchema: runOutputSchema,
  description:
    "Execute the exact confirmed client batch returned by preview-batch, without model calls. Human approval binds the immutable recipe version and frozen rows. Each row is atomically consumed before CRM writes and can never run again; blocked rows stay blocked. Shows native Progress and durable per-row outcomes.",
  schema: runBatchSchema,
  needsApproval: true,
  mcpTool: true,
  run: runBatch,
  link: ({ args }) => ({
    url: `/batches/${args.payload.batchId}`,
    label: "Open Twice batch results",
    view: "batch",
  }),
});
