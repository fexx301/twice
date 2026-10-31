import { registerVersionedResource } from "@agent-native/core/history";
import { accessFilter, registerShareableResource, resolveAccess } from "@agent-native/core/sharing";
import { and, eq } from "drizzle-orm";
import type { createGetDb } from "@agent-native/core/db";
import type * as Schema from "../db/schema.js";

export function registerTwiceResources(getDb: ReturnType<typeof createGetDb>, schema: typeof Schema) {
  const entries = [
    ["twice-recipe", schema.twiceRecipes, schema.twiceRecipeShares, "title", (row: any) => `/recipes/${row.id}`],
    ["twice-demonstration", schema.twiceDemonstrations, schema.twiceDemonstrationShares, "title", (row: any) => `/recipes/${row.recipeId}`],
    ["twice-recipe-version", schema.twiceRecipeVersions, schema.twiceVersionShares, "title", (row: any) => `/recipes/${row.recipeId}`],
    ["twice-batch", schema.twiceBatches, schema.twiceBatchShares, "title", (row: any) => `/batches/${row.id}`],
    ["twice-row", schema.twiceRows, schema.twiceRowShares, "clientName", (row: any) => `/batches/${row.batchId}`],
    ["twice-run", schema.twiceRuns, schema.twiceRunShares, "state", (row: any) => `/batches/${row.batchId}`],
  ] as const;
  for (const [type, resourceTable, sharesTable, titleColumn, getResourcePath] of entries) {
    registerShareableResource({ type, resourceTable, sharesTable, titleColumn, getResourcePath, displayName: type.replace("twice-", "Twice "), getDb, allowPublic: false, requireOrgMemberForUserShares: true });
  }
  registerVersionedResource({
    type: "twice-recipe-version", displayName: "Twice recipe version",
    async resolveAccess(versionId, ctx) {
      const accessCtx = { userEmail: ctx?.userEmail ?? undefined, orgId: ctx?.orgId ?? undefined };
      const [row] = await getDb().select({ recipeId: schema.twiceRecipeVersions.recipeId, ownerEmail: schema.twiceRecipeVersions.ownerEmail })
        .from(schema.twiceRecipeVersions).innerJoin(schema.twiceRecipes, eq(schema.twiceRecipes.id, schema.twiceRecipeVersions.recipeId))
        .where(and(eq(schema.twiceRecipeVersions.id, versionId), eq(schema.twiceRecipeVersions.ownerEmail, schema.twiceRecipes.ownerEmail), accessFilter(schema.twiceRecipes, schema.twiceRecipeShares, accessCtx))).limit(1);
      if (!row) return null;
      const resolved = await resolveAccess("twice-recipe", row.recipeId, accessCtx);
      if (!resolved) return null;
      return { role: resolved.role, ownerEmail: resolved.resource.ownerEmail, orgId: resolved.resource.orgId, visibility: resolved.resource.visibility };
    },
    async getSnapshot({ resourceId, ctx }) {
      const [row] = await getDb().select({ version: schema.twiceRecipeVersions })
        .from(schema.twiceRecipeVersions).innerJoin(schema.twiceRecipes, eq(schema.twiceRecipes.id, schema.twiceRecipeVersions.recipeId))
        .where(and(eq(schema.twiceRecipeVersions.id, resourceId), eq(schema.twiceRecipeVersions.ownerEmail, schema.twiceRecipes.ownerEmail), accessFilter(schema.twiceRecipes, schema.twiceRecipeShares, { userEmail: ctx?.userEmail ?? undefined, orgId: ctx?.orgId ?? undefined }))).limit(1);
      if (!row) throw new Error("Recipe version is unavailable.");
      return { appVersionId: row.version.id, recipeId: row.version.recipeId, contentHash: row.version.contentHash, definition: JSON.parse(row.version.definitionJson), authoredBy: JSON.parse(row.version.provenanceJson) };
    },
    // Immutable executable versions are never restored in place. A historical edit must be accepted as a new version.
  });
}
