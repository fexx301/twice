import { workspaceOutputSchema } from "../shared/twice-outputs.js";
import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { workspace } from "../server/twice/store.js";
export default defineAction({
  mcpTool: true,
  outputSchema: workspaceOutputSchema,
  description:
    "Read the user's Twice recipes, demonstrations, versions and client batches, including the selected recipe/batch and current row states.",
  schema: z.object({ recipeId: z.string().optional(), batchId: z.string().optional() }).strict(),
  http: { method: "GET" },
  readOnly: true,
  run: workspace,
});
