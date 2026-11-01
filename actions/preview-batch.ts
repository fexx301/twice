import { previewOutputSchema } from "../shared/twice-outputs.js";
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { previewBatch } from "../server/twice/execution.js";
export default defineAction({
  mcpTool: true,
  outputSchema: previewOutputSchema,
  description:
    "Build a trusted exact recipe-version/row preview for a client batch. Includes blocked-row reasons, fixed inputs, symbolic future record IDs and the frozen approval payload. Makes no CRM writes or model calls.",
  schema: z.object({ batchId: z.string().min(1).max(128) }).strict(),
  http: { method: "POST" },
  readOnly: true,
  run: (args, ctx) => previewBatch(args.batchId, ctx),
  link: ({ args }) => ({ url: `/batches/${args.batchId}`, label: "Review exact batch inputs" }),
});
