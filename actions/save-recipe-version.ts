import { defineAction } from "@agent-native/core/action";
import { saveRecipeVersionSchema } from "../shared/twice-actions.js";
import { saveRecipeVersion } from "../server/twice/authoring.js";
export default defineAction({ description: "Accept an immutable, History-backed recipe version with the exact reviewed literal parameters. Agent-requested acceptance requires human approval; old unstarted execution previews become stale.", schema: saveRecipeVersionSchema, needsApproval: true, run: saveRecipeVersion,
  link: ({ args }) => ({ url: `/recipes/${args.recipeId}`, label: "Open accepted recipe" }),
});
