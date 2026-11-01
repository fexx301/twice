import { proposalOutputSchema } from "../shared/twice-outputs.js";
import { defineAction } from "@agent-native/core/action";
import { saveParameterProposalSchema } from "../shared/twice-actions.js";
import { saveParameterProposal } from "../server/twice/authoring.js";
export default defineAction({
  outputSchema: proposalOutputSchema,
  description:
    "Finish a parameter-proposal agent turn by saving only allowed client-name and stage literal inputs. IDs and fixed configuration are excluded in code. The user reviews before accepting a version.",
  schema: saveParameterProposalSchema,
  run: saveParameterProposal,
  link: ({ args }) => ({ url: `/recipes/${args.recipeId}`, label: "Review parameters" }),
});
