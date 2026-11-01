import { createHash } from "node:crypto";
import { fail, type ActionRunContext } from "@agent-native/core/action";
import { getRequestOrgId, getRequestUserEmail } from "@agent-native/core/server/request-context";
import { accessFilter, assertAccess } from "@agent-native/core/sharing";
import { and, asc, desc, eq, sql } from "drizzle-orm";
import { getDb, schema } from "../db/index.js";
import { recipeDefinitionSchema, type RecipeDefinition } from "../../shared/twice-contract.js";

export function identity(ctx?: ActionRunContext) {
  const ownerEmail = ctx?.userEmail ?? getRequestUserEmail();
  if (!ownerEmail) fail("Sign in to use Twice.", { statusCode: 401 });
  return {
    ownerEmail,
    orgId: (ctx?.orgId !== undefined ? ctx.orgId : getRequestOrgId()) ?? null,
    visibility: "private" as const,
  };
}
export function provenance(ctx?: ActionRunContext) {
  const actor = identity(ctx);
  const surface = ctx?.caller ?? "system";
  const kind: "agent" | "human" | "system" = ["tool", "agent", "mcp", "a2a", "webmcp"].includes(
    surface,
  )
    ? "agent"
    : ["frontend", "cli"].includes(surface)
      ? "human"
      : "system";
  return {
    kind,
    surface,
    userEmail: actor.ownerEmail,
    threadId: ctx?.threadId ?? null,
    at: new Date().toISOString(),
  };
}
export const childContext = (
  ctx: ActionRunContext | undefined,
  actionName: string,
): ActionRunContext => {
  if (!ctx) fail("An authenticated action context is required.", { statusCode: 401 });
  return { ...ctx, actionName };
};
export function canonical(value: unknown): string {
  if (Array.isArray(value)) return `[${value.map(canonical).join(",")}]`;
  if (value && typeof value === "object")
    return `{${Object.entries(value)
      .sort(([a], [b]) => a.localeCompare(b))
      .map(([k, v]) => `${JSON.stringify(k)}:${canonical(v)}`)
      .join(",")}}`;
  return JSON.stringify(value) ?? "null";
}
export const hash = (value: unknown) => createHash("sha256").update(canonical(value)).digest("hex");
export const sameOrg = (column: any, orgId: string | null) =>
  orgId === null ? sql`${column} IS NULL` : eq(column, orgId);

export async function recipeById(id: string, role: "viewer" | "editor" = "viewer") {
  await assertAccess("twice-recipe", id, role);
  const [row] = await getDb()
    .select()
    .from(schema.twiceRecipes)
    .where(
      and(
        eq(schema.twiceRecipes.id, id),
        accessFilter(schema.twiceRecipes, schema.twiceRecipeShares, undefined, role),
      ),
    )
    .limit(1);
  if (!row) fail("Recipe unavailable.", { statusCode: 403 });
  return row;
}
export async function batchById(id: string, role: "viewer" | "editor" = "viewer") {
  await assertAccess("twice-batch", id, role);
  const [row] = await getDb()
    .select()
    .from(schema.twiceBatches)
    .where(
      and(
        eq(schema.twiceBatches.id, id),
        accessFilter(schema.twiceBatches, schema.twiceBatchShares, undefined, role),
      ),
    )
    .limit(1);
  if (!row) fail("Batch unavailable.", { statusCode: 403 });
  return row;
}
export async function demoForRecipe(recipe: Awaited<ReturnType<typeof recipeById>>, id: string) {
  const [row] = await getDb()
    .select()
    .from(schema.twiceDemonstrations)
    .where(
      and(
        eq(schema.twiceDemonstrations.id, id),
        eq(schema.twiceDemonstrations.recipeId, recipe.id),
        eq(schema.twiceDemonstrations.ownerEmail, recipe.ownerEmail),
        sameOrg(schema.twiceDemonstrations.orgId, recipe.orgId),
      ),
    )
    .limit(1);
  if (!row) fail("Demonstration unavailable for this recipe.", { statusCode: 403 });
  return row;
}
export async function versionForRecipe(recipe: Awaited<ReturnType<typeof recipeById>>, id: string) {
  const [row] = await getDb()
    .select()
    .from(schema.twiceRecipeVersions)
    .where(
      and(
        eq(schema.twiceRecipeVersions.id, id),
        eq(schema.twiceRecipeVersions.recipeId, recipe.id),
        eq(schema.twiceRecipeVersions.ownerEmail, recipe.ownerEmail),
        sameOrg(schema.twiceRecipeVersions.orgId, recipe.orgId),
      ),
    )
    .limit(1);
  if (!row || !row.acceptedAt || !row.historyId)
    fail("Accepted recipe version unavailable.", { statusCode: 409 });
  const definition = recipeDefinitionSchema.parse(JSON.parse(row.definitionJson));
  if (hash(definition) !== row.contentHash)
    fail("Recipe content integrity check failed.", { statusCode: 409 });
  return { ...row, definition };
}
export async function rowsForBatch(batch: Awaited<ReturnType<typeof batchById>>) {
  return getDb()
    .select()
    .from(schema.twiceRows)
    .where(
      and(
        eq(schema.twiceRows.batchId, batch.id),
        eq(schema.twiceRows.ownerEmail, batch.ownerEmail),
        sameOrg(schema.twiceRows.orgId, batch.orgId),
      ),
    )
    .orderBy(asc(schema.twiceRows.position))
    .limit(5);
}
export async function workspace(
  input: { recipeId?: string; batchId?: string } = {},
  ctx?: ActionRunContext,
) {
  const db = getDb();
  const recipes = await db
    .select()
    .from(schema.twiceRecipes)
    .where(accessFilter(schema.twiceRecipes, schema.twiceRecipeShares))
    .orderBy(desc(schema.twiceRecipes.updatedAt))
    .limit(30);
  const batches = await db
    .select()
    .from(schema.twiceBatches)
    .where(accessFilter(schema.twiceBatches, schema.twiceBatchShares))
    .orderBy(desc(schema.twiceBatches.updatedAt))
    .limit(30);
  const batch = input.batchId
    ? await batchById(input.batchId)
    : ((input.recipeId ? batches.find((b) => b.recipeId === input.recipeId) : batches[0]) ?? null);
  if (batch && input.recipeId && batch.recipeId !== input.recipeId)
    fail("Batch does not belong to this recipe.", { statusCode: 409 });
  const recipe = input.recipeId
    ? await recipeById(input.recipeId)
    : batch
      ? await recipeById(batch.recipeId)
      : (recipes[0] ?? null);
  const rows = batch ? await rowsForBatch(batch) : [];
  const demonstration = recipe?.demonstrationId
    ? await demoForRecipe(recipe, recipe.demonstrationId)
    : null;
  const versions = recipe
    ? await db
        .select()
        .from(schema.twiceRecipeVersions)
        .where(
          and(
            eq(schema.twiceRecipeVersions.recipeId, recipe.id),
            eq(schema.twiceRecipeVersions.ownerEmail, recipe.ownerEmail),
            sameOrg(schema.twiceRecipeVersions.orgId, recipe.orgId),
          ),
        )
        .orderBy(desc(schema.twiceRecipeVersions.createdAt))
        .limit(20)
    : [];
  const runs = batch
    ? await db
        .select()
        .from(schema.twiceRuns)
        .where(
          and(
            eq(schema.twiceRuns.batchId, batch.id),
            eq(schema.twiceRuns.ownerEmail, batch.ownerEmail),
            sameOrg(schema.twiceRuns.orgId, batch.orgId),
          ),
        )
        .orderBy(desc(schema.twiceRuns.createdAt))
        .limit(10)
    : [];
  const active = recipe?.activeVersionId
    ? await versionForRecipe(recipe, recipe.activeVersionId)
    : null;
  if (active && !versions.some((v) => v.id === active.id)) {
    if (versions.length === 20) versions.pop();
    versions.push(active);
  }
  let inputContract: {
    stageOptions: string[];
    stageVariable: boolean;
    fixedStage: string;
    listId: string;
    connectionId: string;
  } | null = null;
  if (active) {
    const definition = active.definition;
    const listAttributes = (await import("../../actions/list-crm-attributes.js")).default;
    const attributes = await listAttributes.run(
      {
        target: "list",
        targetId: definition.listId,
        connectionId: definition.connectionId,
        includeArchived: false,
        limit: 200,
      },
      childContext(ctx, "list-crm-attributes"),
    );
    const stage = attributes.attributes.find(
      (a) => a.apiSlug === "stage" && a.attributeType === "status",
    );
    inputContract = {
      stageOptions: (stage?.options ?? []).filter((o) => !o.archived).map((o) => o.value),
      stageVariable: definition.parameters.some(
        (p) => p.path === "add-crm-record-to-list.input.values.stage",
      ),
      fixedStage: definition.fixedStage,
      listId: definition.listId,
      connectionId: definition.connectionId,
    };
  }
  return {
    inputContract,
    recipes,
    batches,
    recipe: recipe
      ? {
          ...recipe,
          parameters: JSON.parse(recipe.proposalJson),
          exclusions: JSON.parse(recipe.exclusionsJson),
          proposalActor: JSON.parse(recipe.proposalActorJson),
        }
      : null,
    batch: batch ? { ...batch, preparationActor: JSON.parse(batch.preparationActorJson) } : null,
    rows: rows.map((row) => ({ ...row, uncertain: row.uncertain === 1 })),
    demonstration: demonstration
      ? { ...demonstration, trace: JSON.parse(demonstration.traceJson) }
      : null,
    versions: versions.map((v) => ({
      ...v,
      definition: JSON.parse(v.definitionJson) as RecipeDefinition,
      authoredBy: JSON.parse(v.provenanceJson),
    })),
    runs: runs.map((run) => ({ ...run, results: JSON.parse(run.resultJson) })),
    allowedParameterPaths: [
      "create-crm-record.input.displayName",
      "add-crm-record-to-list.input.values.stage",
    ],
  };
}
