import { fail, type ActionRunContext } from "@agent-native/core/action";
import { createDataTableWidgetResult } from "@agent-native/core/data-widgets";
import createResourceVersion from "@agent-native/core/history/actions/create-resource-version";
import { accessFilter, assertAccess } from "@agent-native/core/sharing";
import { and, eq, isNull, sql } from "drizzle-orm";
import { z } from "zod";
import { getDb, schema } from "../db/index.js";
import {
  classifyParameters,
  compileRecipe,
  deriveBindings,
  rowVerdict,
  traceSchema,
} from "../../shared/twice-contract.js";
import {
  saveBatchRowsSchema,
  saveDemonstrationSchema,
  saveParameterProposalSchema,
  saveRecipeVersionSchema,
} from "../../shared/twice-actions.js";
import listAttributes from "../../actions/list-crm-attributes.js";
import {
  indexAttributes,
  loadCrmEntryValues,
  loadCrmListAttributes,
} from "../../actions/_crm-list-utils.js";
import {
  batchById,
  childContext,
  demoForRecipe,
  hash,
  identity,
  provenance,
  recipeById,
  rowsForBatch,
  sameOrg,
  versionForRecipe,
  workspace,
} from "./store.js";

export async function saveDemonstration(
  args: z.infer<typeof saveDemonstrationSchema>,
  ctx?: ActionRunContext,
) {
  const recipe = await recipeById(args.recipeId, "editor");
  if (recipe.revision !== args.expectedRecipeRevision)
    fail("The recipe changed. Refresh before saving capture.", { statusCode: 409 });
  const old = args.demonstrationId ? await demoForRecipe(recipe, args.demonstrationId) : null;
  if (old && old.revision !== args.expectedDemonstrationRevision)
    fail("The demonstration changed.", { statusCode: 409 });
  const prior = old ? (JSON.parse(old.traceJson) as unknown[]) : [];
  if (
    args.trace.length < prior.length ||
    prior.some((step, i) => hash(step) !== hash(args.trace[i]))
  )
    fail("Captured steps are append-only. Start a new demonstration to change them.", {
      statusCode: 409,
    });
  const first = args.trace[0];
  if (first && first.name !== "create-crm-record")
    fail("Capture must start by creating a native account.", { statusCode: 400 });
  if (first?.name === "create-crm-record") {
    await assertAccess("crm-record", first.result.recordId, "editor");
    await assertAccess("crm-connection", first.input.connectionId, "editor");
    const [record] = await getDb()
      .select()
      .from(schema.crmRecords)
      .where(
        and(
          eq(schema.crmRecords.id, first.result.recordId),
          accessFilter(schema.crmRecords, schema.crmRecordShares, undefined, "editor"),
        ),
      )
      .limit(1);
    if (
      !record ||
      record.provider !== "native" ||
      record.kind !== "account" ||
      record.connectionId !== first.input.connectionId ||
      record.displayName !== first.input.displayName ||
      first.result.connectionId !== first.input.connectionId
    )
      fail("The captured account cannot be verified.", { statusCode: 409 });
  }
  const second = args.trace[1];
  if (second) {
    if (second.name !== "add-crm-record-to-list" || first?.name !== "create-crm-record")
      fail("The second step must add the created account to a list.", { statusCode: 400 });
    await assertAccess("crm-list", second.input.listId, "editor");
    const [entry] = await getDb()
      .select()
      .from(schema.crmListEntries)
      .where(
        and(
          eq(schema.crmListEntries.id, second.result.entryId),
          eq(schema.crmListEntries.recordId, first.result.recordId),
          eq(schema.crmListEntries.listId, second.input.listId),
          accessFilter(schema.crmListEntries, schema.crmListEntryShares),
        ),
      )
      .limit(1);
    if (
      !entry ||
      second.input.recordId !== first.result.recordId ||
      second.result.recordId !== first.result.recordId
    )
      fail("The captured list entry does not refer to the created account.", { statusCode: 409 });
    const attributes = indexAttributes(await loadCrmListAttributes(getDb(), second.input.listId));
    const stored = (await loadCrmEntryValues(getDb(), [entry.id], attributes)).get(entry.id);
    if (stored?.values.stage !== second.input.values.stage)
      fail("The captured list entry stage cannot be verified.", { statusCode: 409 });
  }
  const third = args.trace[2];
  if (third) {
    if (third.name !== "manage-crm-task" || first?.name !== "create-crm-record")
      fail("The third step must create a linked follow-up task.", { statusCode: 400 });
    const [task] = await getDb()
      .select()
      .from(schema.crmTasks)
      .where(
        and(
          eq(schema.crmTasks.id, third.result.id),
          eq(schema.crmTasks.recordId, first.result.recordId),
          accessFilter(schema.crmTasks, schema.crmTaskShares),
        ),
      )
      .limit(1);
    if (
      !task ||
      task.authority !== "local" ||
      task.title !== third.input.title ||
      task.status !== "open"
    )
      fail("The captured task cannot be verified.", { statusCode: 409 });
    deriveBindings(traceSchema.parse(args.trace));
  }
  const id = old?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  await getDb().transaction(async (tx) => {
    const updated = await tx
      .update(schema.twiceRecipes)
      .set({
        demonstrationId: id,
        proposalJson: "[]",
        exclusionsJson: "[]",
        proposalSummary: "",
        revision: recipe.revision + 1,
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.twiceRecipes.id, recipe.id),
          eq(schema.twiceRecipes.revision, recipe.revision),
          eq(schema.twiceRecipes.ownerEmail, recipe.ownerEmail),
        ),
      )
      .returning({ id: schema.twiceRecipes.id });
    if (!updated.length) fail("Recipe changed while saving capture.", { statusCode: 409 });
    if (old) {
      const saved = await tx
        .update(schema.twiceDemonstrations)
        .set({ traceJson: JSON.stringify(args.trace), revision: old.revision + 1, updatedAt: now })
        .where(
          and(
            eq(schema.twiceDemonstrations.id, old.id),
            eq(schema.twiceDemonstrations.revision, old.revision),
            eq(schema.twiceDemonstrations.ownerEmail, recipe.ownerEmail),
          ),
        )
        .returning({ id: schema.twiceDemonstrations.id });
      if (!saved.length) fail("Capture changed during save.", { statusCode: 409 });
    } else
      await tx
        .insert(schema.twiceDemonstrations)
        .values({
          id,
          recipeId: recipe.id,
          title: `${recipe.title} demonstration`,
          traceJson: JSON.stringify(args.trace),
          ownerEmail: recipe.ownerEmail,
          orgId: recipe.orgId,
          visibility: "private",
        });
  });
  return workspace({ recipeId: recipe.id }, ctx);
}

export async function saveParameterProposal(
  args: z.infer<typeof saveParameterProposalSchema>,
  ctx?: ActionRunContext,
) {
  const recipe = await recipeById(args.recipeId, "editor");
  if (!recipe.demonstrationId) fail("Capture the onboarding actions first.", { statusCode: 409 });
  const demo = await demoForRecipe(recipe, recipe.demonstrationId);
  deriveBindings(JSON.parse(demo.traceJson));
  const classified = classifyParameters(args.parameters);
  const updated = await getDb()
    .update(schema.twiceRecipes)
    .set({
      proposalJson: JSON.stringify(classified.parameters),
      exclusionsJson: JSON.stringify(classified.exclusions),
      proposalSummary: args.summary,
      proposalActorJson: JSON.stringify(provenance(ctx)),
      revision: recipe.revision + 1,
      updatedAt: new Date().toISOString(),
    })
    .where(
      and(
        eq(schema.twiceRecipes.id, recipe.id),
        eq(schema.twiceRecipes.revision, args.expectedRevision),
        eq(schema.twiceRecipes.ownerEmail, recipe.ownerEmail),
      ),
    )
    .returning({ id: schema.twiceRecipes.id });
  if (!updated.length)
    fail("Recipe changed. Read its latest revision before saving the proposal.", {
      statusCode: 409,
    });
  return {
    recipeId: recipe.id,
    parameters: classified.parameters,
    exclusions: classified.exclusions,
    summary: args.summary,
    nextStep:
      "Review, edit or accept these literal parameters in the recipe view. Fixed IDs cannot become inputs.",
  };
}

export async function saveRecipeVersion(
  args: z.infer<typeof saveRecipeVersionSchema>,
  ctx?: ActionRunContext,
) {
  const recipe = await recipeById(args.recipeId, "editor");
  if (recipe.revision !== args.expectedRevision || !recipe.demonstrationId)
    fail("Recipe changed or capture is missing.", { statusCode: 409 });
  const demo = await demoForRecipe(recipe, recipe.demonstrationId);
  if (args.parameters.some((parameter) => parameter.uncertain))
    fail("Resolve the proposed parameter uncertainties before accepting this version.", {
      statusCode: 409,
    });
  const definition = compileRecipe({
    demonstrationId: demo.id,
    title: args.title,
    trace: JSON.parse(demo.traceJson),
    parameters: args.parameters,
  });
  await assertAccess("crm-connection", definition.connectionId, "editor");
  await assertAccess("crm-list", definition.listId, "editor");
  const id = crypto.randomUUID();
  const authoredBy = { ...provenance(ctx), proposalBy: JSON.parse(recipe.proposalActorJson) };
  const contentHash = hash(definition);
  // The immutable row exists before History captures it. Generic history creation cannot accept it for execution.
  await getDb()
    .insert(schema.twiceRecipeVersions)
    .values({
      id,
      recipeId: recipe.id,
      title: args.title,
      definitionJson: JSON.stringify(definition),
      contentHash,
      provenanceJson: JSON.stringify(authoredBy),
      ownerEmail: recipe.ownerEmail,
      orgId: recipe.orgId,
      visibility: "private",
    });
  const history = await createResourceVersion.run(
    {
      resourceType: "twice-recipe-version",
      resourceId: id,
      title: args.title,
      summary: "Accepted literal parameter version",
      metadata: { authoredBy },
    },
    childContext(ctx, "create-resource-version"),
  );
  const now = new Date().toISOString();
  await getDb().transaction(async (tx) => {
    const accepted = await tx
      .update(schema.twiceRecipes)
      .set({
        title: args.title,
        activeVersionId: id,
        proposalJson: JSON.stringify(definition.parameters),
        revision: recipe.revision + 1,
        updatedAt: now,
      })
      .where(
        and(
          eq(schema.twiceRecipes.id, recipe.id),
          eq(schema.twiceRecipes.revision, recipe.revision),
          eq(schema.twiceRecipes.ownerEmail, recipe.ownerEmail),
        ),
      )
      .returning({ id: schema.twiceRecipes.id });
    if (!accepted.length)
      fail(
        "Recipe changed during acceptance. The new snapshot is retained but is not executable.",
        { statusCode: 409 },
      );
    await tx
      .update(schema.twiceRecipeVersions)
      .set({ historyId: history.id, acceptedAt: now })
      .where(
        and(
          eq(schema.twiceRecipeVersions.id, id),
          eq(schema.twiceRecipeVersions.ownerEmail, recipe.ownerEmail),
        ),
      );
  });
  return {
    recipeId: recipe.id,
    recipeVersionId: id,
    historyVersionId: history.id,
    contentHash,
    authoredBy,
    ...(await workspace({ recipeId: recipe.id }, ctx)),
  };
}

export async function currentStageOptions(
  definition: { connectionId: string; listId: string },
  ctx?: ActionRunContext,
) {
  await assertAccess("crm-connection", definition.connectionId, "editor");
  await assertAccess("crm-list", definition.listId, "editor");
  const [list] = await getDb()
    .select({
      connectionId: schema.crmLists.connectionId,
      parentObjectType: schema.crmLists.parentObjectType,
    })
    .from(schema.crmLists)
    .where(
      and(
        eq(schema.crmLists.id, definition.listId),
        accessFilter(schema.crmLists, schema.crmListShares, undefined, "editor"),
      ),
    )
    .limit(1);
  const [connection] = await getDb()
    .select({ provider: schema.crmConnections.provider })
    .from(schema.crmConnections)
    .where(
      and(
        eq(schema.crmConnections.id, definition.connectionId),
        accessFilter(schema.crmConnections, schema.crmConnectionShares, undefined, "editor"),
      ),
    )
    .limit(1);
  if (
    !list ||
    !connection ||
    list.connectionId !== definition.connectionId ||
    list.parentObjectType !== "accounts" ||
    connection.provider !== "native"
  )
    fail("Twice requires this actor's accessible native account list.", { statusCode: 403 });
  const result = await listAttributes.run(
    {
      target: "list",
      targetId: definition.listId,
      connectionId: definition.connectionId,
      includeArchived: false,
      limit: 200,
    },
    childContext(ctx, "list-crm-attributes"),
  );
  const stage = result.attributes.find(
    (attribute) => attribute.apiSlug === "stage" && attribute.attributeType === "status",
  );
  if (!stage) fail("The onboarding list has no managed stage attribute.", { statusCode: 409 });
  return (stage.options ?? []).filter((option) => !option.archived).map((option) => option.value);
}

export async function saveBatchRows(
  args: z.infer<typeof saveBatchRowsSchema>,
  ctx?: ActionRunContext,
) {
  const recipe = await recipeById(args.recipeId);
  const batch = args.batchId ? await batchById(args.batchId, "editor") : null;
  if (batch && batch.recipeId !== recipe.id)
    fail("Batch does not belong to this recipe.", { statusCode: 409 });
  if (!args.confirm && provenance(ctx).kind === "agent") {
    if (batch && args.sourceText !== batch.sourceText)
      fail("Notes changed. Read the current batch; preparation cannot replace its source text.", {
        statusCode: 409,
      });
    if (
      args.rows.some((row) => !row.sourceText.trim() || !args.sourceText.includes(row.sourceText))
    )
      fail(
        "Each prepared row needs an exact excerpt from the current notes. Do not reuse old draft facts.",
        { statusCode: 422 },
      );
  }
  const existing = batch ? await rowsForBatch(batch) : [];
  if (existing.some((row) => row.startedAt !== null))
    fail(
      "This batch has started. Its rows cannot be replaced or retried; create a new batch for new clients.",
      { statusCode: 409 },
    );
  if (batch && batch.revision !== args.expectedRevision)
    fail("Batch changed. Read the current revision before saving.", { statusCode: 409 });
  const ids = args.rows.flatMap((row) => (row.id ? [row.id] : []));
  if (new Set(ids).size !== ids.length || ids.some((id) => !existing.some((row) => row.id === id)))
    fail("Row IDs must be unique members of this batch.", { statusCode: 400 });
  if (args.confirm && !recipe.activeVersionId)
    fail("Accept a recipe version before confirming a batch.", { statusCode: 409 });
  const version = recipe.activeVersionId
    ? await versionForRecipe(recipe, recipe.activeVersionId)
    : null;
  const options = version ? await currentStageOptions(version.definition, ctx) : [];
  const owner = batch
    ? { ownerEmail: batch.ownerEmail, orgId: batch.orgId, visibility: "private" as const }
    : identity(ctx);
  const batchId = batch?.id ?? crypto.randomUUID();
  const now = new Date().toISOString();
  const values = args.rows.map((row, position) => {
    const old = existing.find((item) => item.id === row.id);
    const revision = (old?.revision ?? -1) + 1;
    const verdict = version
      ? rowVerdict(version.definition, row, options)
      : { ready: false, reason: "Accept a recipe version before running clients." };
    const blocked = row.uncertain || !row.clientName || !row.stage || (version && !verdict.ready);
    return {
      id: old?.id ?? crypto.randomUUID(),
      batchId,
      clientName: row.clientName,
      stage: row.stage || null,
      uncertain: row.uncertain ? 1 : 0,
      uncertainty: row.uncertainty,
      sourceText: row.sourceText,
      position,
      revision,
      state: blocked
        ? ("Blocked" as const)
        : args.confirm && verdict.ready
          ? ("Ready" as const)
          : ("Draft" as const),
      confirmedRevision: args.confirm && verdict.ready ? revision : null,
      recipeVersionId: args.confirm && verdict.ready ? version!.id : null,
      error: blocked ? verdict.reason || row.uncertainty : null,
      updatedAt: now,
      ...owner,
    };
  });
  await getDb().transaction(async (tx) => {
    if (batch) {
      const updated = await tx
        .update(schema.twiceBatches)
        .set({
          title: args.title,
          sourceText: args.sourceText,
          revision: batch.revision + 1,
          ...(!args.confirm ? { preparationActorJson: JSON.stringify(provenance(ctx)) } : {}),
          updatedAt: now,
        })
        .where(
          and(
            eq(schema.twiceBatches.id, batch.id),
            eq(schema.twiceBatches.revision, batch.revision),
            eq(schema.twiceBatches.ownerEmail, batch.ownerEmail),
          ),
        )
        .returning({ id: schema.twiceBatches.id });
      if (!updated.length) fail("Batch changed during save.", { statusCode: 409 });
      const removed = await tx
        .delete(schema.twiceRows)
        .where(
          and(
            eq(schema.twiceRows.batchId, batch.id),
            eq(schema.twiceRows.ownerEmail, batch.ownerEmail),
            isNull(schema.twiceRows.startedAt),
          ),
        )
        .returning({ id: schema.twiceRows.id });
      if (removed.length !== existing.length)
        fail("Execution began while saving. No row edits were applied.", { statusCode: 409 });
    } else
      await tx
        .insert(schema.twiceBatches)
        .values({
          id: batchId,
          recipeId: recipe.id,
          title: args.title,
          sourceText: args.sourceText,
          preparationActorJson: JSON.stringify(provenance(ctx)),
          ...owner,
        });
    if (values.length) await tx.insert(schema.twiceRows).values(values);
  });
  return createDataTableWidgetResult({
    title: args.confirm ? "Confirmed clients" : "Prepared clients — review before running",
    summary: { batchId, recipeId: recipe.id, savedRows: values.length, confirmed: args.confirm },
    table: {
      title: args.title,
      columns: [
        { key: "clientName", label: "Client" },
        { key: "stage", label: "Stage" },
        { key: "state", label: "State" },
        { key: "review", label: "Review" },
      ],
      rows: values.map((row) => ({
        clientName: row.clientName,
        stage: row.stage ?? "Not specified",
        state: row.state,
        review: row.uncertainty || row.error || (args.confirm ? "Confirmed" : "Please review"),
      })),
    },
    display: { primaryAction: { label: "Review client batch", href: `/batches/${batchId}` } },
  });
}
