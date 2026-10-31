import { defineAction } from "@agent-native/core/action";
import { z } from "zod";
import { getDb, schema } from "../server/db/index.js";
import { hash, identity, workspace } from "../server/twice/store.js";

export const SAMPLE_EMAIL = `Labelled sample email — fictional clients only.\nPlease onboard Cedar Studio at New.\nBirch Workshop has already started: In Progress.\nNorthstar Design is joining, but I do not know its stage yet.\nDelta Labs: New.\nMoss Collective: In Progress.`;

export default defineAction({
  description: "Initialize a private Twice workbench with clearly labelled sample client drafts. Does not create or change CRM records.",
  schema: z.object({}).strict(),
  run: async (_args, ctx) => {
    const owner = identity(ctx);
    const suffix = hash({ ownerEmail: owner.ownerEmail, orgId: owner.orgId });
    const recipeId = `recipe-${suffix}`;
    const batchId = `batch-${suffix}`;
    const db = getDb();
    await db.transaction(async tx => {
      await tx.insert(schema.twiceRecipes).values({ id: recipeId, title: "Client onboarding", ...owner }).onConflictDoNothing();
      const inserted = await tx.insert(schema.twiceBatches).values({ id: batchId, recipeId, title: "Sample clients", sourceText: SAMPLE_EMAIL, isSample: 1, ...owner }).onConflictDoNothing().returning({ id: schema.twiceBatches.id });
      if (inserted.length) {
        const examples = [["Cedar Studio", "new"], ["Birch Workshop", "in-progress"], ["Northstar Design", null], ["Delta Labs", "new"], ["Moss Collective", "in-progress"]] as const;
        await tx.insert(schema.twiceRows).values(examples.map(([clientName, stage], position) => ({ id: crypto.randomUUID(), batchId, clientName, stage, uncertain: stage === null ? 1 : 0, uncertainty: stage === null ? "The sample email does not specify a stage." : "", sourceText: "Labelled sample client", state: stage === null ? "Blocked" as const : "Draft" as const, position, ...owner })));
      }
    });
    return workspace({ recipeId, batchId });
  },
});
