import { defineAction } from "@agent-native/core/action";
import { saveDemonstrationSchema } from "../shared/twice-actions.js";
import { saveDemonstration } from "../server/twice/authoring.js";
export default defineAction({ description: "Save or append an owned, verified native CRM demonstration. Captured steps are append-only; start a new demonstration to change them.", schema: saveDemonstrationSchema, run: saveDemonstration,
  link: ({ args }) => ({ url: `/recipes/${args.recipeId}`, label: "Open recipe" }),
});
