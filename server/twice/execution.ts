import { fail, type ActionRunContext } from "@agent-native/core/action";
import getResourceVersion from "@agent-native/core/history/actions/get-resource-version";
import { completeRun, startRun, updateRunProgress } from "@agent-native/core/progress";
import { accessFilter } from "@agent-native/core/sharing";
import { and, eq, exists, isNull } from "drizzle-orm";
import type { z } from "zod";
import createRecord from "../../actions/create-crm-record.js";
import addToList from "../../actions/add-crm-record-to-list.js";
import manageTask from "../../actions/manage-crm-task.js";
import { getDb, schema } from "../db/index.js";
import { executionPayloadSchema, runBatchSchema } from "../../shared/twice-actions.js";
import { PARAMETER_PATHS, previewOperations, rowVerdict } from "../../shared/twice-contract.js";
import { currentStageOptions } from "./authoring.js";
import { batchById, childContext, hash, identity, recipeById, rowsForBatch, sameOrg, versionForRecipe } from "./store.js";

export async function previewBatch(batchId: string, ctx?: ActionRunContext) {
  const batch = await batchById(batchId);
  const recipe = await recipeById(batch.recipeId);
  if (!recipe.activeVersionId) fail("Accept a recipe version first.", { statusCode: 409 });
  const version = await versionForRecipe(recipe, recipe.activeVersionId);
  const historical = (await getResourceVersion.run({ id: version.historyId! }, childContext(ctx, "get-resource-version"))).version;
  const snapshot = historical.snapshot as { appVersionId?: string; recipeId?: string; contentHash?: string; definition?: unknown } | undefined;
  if (historical.resourceType !== "twice-recipe-version" || historical.resourceId !== version.id || snapshot?.appVersionId !== version.id || snapshot.recipeId !== recipe.id || snapshot.contentHash !== version.contentHash || hash(snapshot.definition) !== version.contentHash) fail("History snapshot does not match the accepted version.", { statusCode: 409 });
  const stageOptions = await currentStageOptions(version.definition, ctx);
  const rows = await rowsForBatch(batch);
  if (!rows.length) fail("Prepare at least one client row first.", { statusCode: 409 });
  const frozen = rows.map(row => {
    const verdict = rowVerdict(version.definition, { clientName: row.clientName, stage: row.stage, uncertain: row.uncertain === 1, uncertainty: row.uncertainty, sourceText: row.sourceText }, stageOptions);
    let reason = verdict.reason;
    if (row.startedAt) reason = row.state === "Done" ? "Already done. This row cannot run again." : "Execution already started. This row cannot run again.";
    else if (row.state !== "Ready") reason = row.error || row.uncertainty || "Review and accept this row first.";
    else if (row.confirmedRevision !== row.revision || row.recipeVersionId !== version.id) reason = "The recipe or row changed. Confirm against the current version.";
    const ready = !reason && verdict.ready;
    return { id: row.id, revision: row.revision, clientName: row.clientName, stage: row.stage, uncertain: row.uncertain === 1, state: row.state, ready, reason: reason || "" };
  });
  const payload = executionPayloadSchema.parse({
    compilerVersion: 1, recipeId: recipe.id, recipeVersionId: version.id, historyVersionId: version.historyId,
    recipeContentHash: version.contentHash, batchId: batch.id, batchRevision: batch.revision,
    fixed: { connectionId: version.definition.connectionId, listId: version.definition.listId, taskTitle: version.definition.taskTitle, fixedStage: version.definition.fixedStage, stageVariable: version.definition.parameters.some(p => p.path === PARAMETER_PATHS[1]) },
    rows: frozen,
  });
  return { batchId, payload, payloadHash: hash(payload), readyCount: frozen.filter(r => r.ready).length, blockedCount: frozen.filter(r => !r.ready).length, stageOptions,
    previews: frozen.map(row => ({ rowId: row.id, ready: row.ready, reason: row.reason, operations: previewOperations(version.definition, { clientName: row.clientName, stage: row.stage, uncertain: row.uncertain, uncertainty: row.reason, sourceText: "" }) })) };
}

export type RowOutcome = { rowId: string; clientName: string; outcome: "Done" | "Blocked" | "Partial"; reason?: string; recordId?: string; entryId?: string; taskId?: string };

export async function runBatch(args: z.infer<typeof runBatchSchema>, ctx?: ActionRunContext) {
  const actor = identity(ctx);
  const batch = await batchById(args.payload.batchId, "editor");
  const trusted = await previewBatch(batch.id, ctx);
  if (hash(args.payload) !== args.payloadHash || trusted.payloadHash !== args.payloadHash) fail("STALE_PREVIEW: recipe, rows or permissions changed. Preview and approve again.", { statusCode: 409 });
  if (!trusted.readyCount) fail("No confirmed, unstarted rows are ready.", { statusCode: 409 });
  const recipe = await recipeById(trusted.payload.recipeId);
  const version = await versionForRecipe(recipe, trusted.payload.recipeVersionId);
  const db = getDb();
  const runId = crypto.randomUUID();
  const outcomes: RowOutcome[] = [];
  await db.insert(schema.twiceRuns).values({ id: runId, batchId: batch.id, recipeVersionId: version.id, payloadHash: args.payloadHash, ownerEmail: batch.ownerEmail, orgId: batch.orgId, visibility: "private" });
  const progress = await startRun({ id: runId, owner: actor.ownerEmail, title: `Onboard ${trusted.readyCount} clients`, step: "Confirmed inputs received", metadata: { batchId: batch.id, recipeVersionId: version.id } });
  let hadFailure = false;
  let claimedAny = false;
  try {
    for (const [position, row] of trusted.payload.rows.entries()) {
      if (!row.ready) { outcomes.push({ rowId: row.id, clientName: row.clientName, outcome: "Blocked", reason: row.reason }); continue; }
      const now = new Date().toISOString();
      const [claimed] = await db.update(schema.twiceRows).set({ startedAt: now, executionState: "started", state: "Blocked", runId, updatedAt: now })
        .where(and(
          eq(schema.twiceRows.id, row.id), eq(schema.twiceRows.batchId, batch.id), eq(schema.twiceRows.ownerEmail, batch.ownerEmail), sameOrg(schema.twiceRows.orgId, batch.orgId),
          eq(schema.twiceRows.revision, row.revision), eq(schema.twiceRows.confirmedRevision, row.revision), eq(schema.twiceRows.recipeVersionId, version.id),
          eq(schema.twiceRows.state, "Ready"), eq(schema.twiceRows.executionState, "unstarted"), isNull(schema.twiceRows.startedAt),
          exists(db.select({ id: schema.twiceBatches.id }).from(schema.twiceBatches).where(and(eq(schema.twiceBatches.id, batch.id), eq(schema.twiceBatches.revision, trusted.payload.batchRevision), accessFilter(schema.twiceBatches, schema.twiceBatchShares, undefined, "editor")))),
          exists(db.select({ id: schema.twiceRecipes.id }).from(schema.twiceRecipes).where(and(eq(schema.twiceRecipes.id, recipe.id), eq(schema.twiceRecipes.activeVersionId, version.id), accessFilter(schema.twiceRecipes, schema.twiceRecipeShares)))),
        )).returning();
      if (!claimed) {
        outcomes.push({ rowId: row.id, clientName: row.clientName, outcome: "Blocked", reason: "The row changed or another run claimed it. No action was attempted for this row." });
        hadFailure = true;
        // A simultaneous second batch request loses its first claim and must not steal later rows.
        if (!claimedAny) break;
        continue;
      }
      claimedAny = true;
      const result: RowOutcome = { rowId: row.id, clientName: row.clientName, outcome: "Partial" };
      const persist = async (values: Partial<typeof schema.twiceRows.$inferInsert>) => {
        const saved = await db.update(schema.twiceRows).set({ ...values, updatedAt: new Date().toISOString() }).where(and(eq(schema.twiceRows.id, claimed.id), eq(schema.twiceRows.runId, runId), eq(schema.twiceRows.ownerEmail, batch.ownerEmail))).returning({ id: schema.twiceRows.id });
        if (!saved.length) throw new Error("The execution result could not be persisted.");
      };
      try {
        await updateRunProgress(progress.id, progress.owner, { percent: Math.round(position / trusted.payload.rows.length * 100), step: `Creating ${row.clientName}` });
        // Compose only these three named native actions. .run retains access/validation/audit;
        // parent run-batch owns the exact-payload approval. Preserve truthful child action names.
        const record = await createRecord.run({ kind: "account", displayName: row.clientName, connectionId: version.definition.connectionId }, childContext(ctx, "create-crm-record"));
        result.recordId = record.recordId;
        await persist({ recordId: record.recordId });
        await updateRunProgress(progress.id, progress.owner, { step: `Adding ${row.clientName} to onboarding` });
        const entry = await addToList.run({ listId: version.definition.listId, recordId: record.recordId, values: { stage: row.stage } }, childContext(ctx, "add-crm-record-to-list"));
        result.entryId = entry.entryId;
        await persist({ entryId: entry.entryId });
        await updateRunProgress(progress.id, progress.owner, { step: `Creating ${row.clientName}'s follow-up` });
        const task = await manageTask.run({ recordId: record.recordId, title: version.definition.taskTitle, status: "open" }, childContext(ctx, "manage-crm-task"));
        result.taskId = task.id;
        result.outcome = "Done";
        await persist({ taskId: task.id, state: "Done", executionState: "succeeded", finishedAt: new Date().toISOString(), error: null });
      } catch (error) {
        hadFailure = true;
        result.reason = error instanceof Error ? error.message : "An action failed. The row remains consumed and cannot be retried.";
        await persist({ state: "Blocked", executionState: "failed", error: result.reason, finishedAt: new Date().toISOString() });
      }
      outcomes.push(result);
      await db.update(schema.twiceRuns).set({ resultJson: JSON.stringify(outcomes), updatedAt: new Date().toISOString() }).where(and(eq(schema.twiceRuns.id, runId), eq(schema.twiceRuns.ownerEmail, batch.ownerEmail)));
    }
    const done = outcomes.filter(row => row.outcome === "Done").length;
    await db.update(schema.twiceRuns).set({ state: hadFailure ? "partial" : "complete", resultJson: JSON.stringify(outcomes), updatedAt: new Date().toISOString() }).where(and(eq(schema.twiceRuns.id, runId), eq(schema.twiceRuns.ownerEmail, batch.ownerEmail)));
    return { batchId: batch.id, runId, recipeVersionId: version.id, done, blocked: outcomes.filter(row => row.outcome === "Blocked").length, partial: outcomes.filter(row => row.outcome === "Partial").length, outcomes, message: `${done} client${done === 1 ? "" : "s"} onboarded. Started rows cannot run again.` };
  } catch (error) {
    hadFailure = true;
    await db.update(schema.twiceRuns).set({ state: "partial", resultJson: JSON.stringify(outcomes), updatedAt: new Date().toISOString() }).where(and(eq(schema.twiceRuns.id, runId), eq(schema.twiceRuns.ownerEmail, batch.ownerEmail)));
    throw error;
  } finally {
    await completeRun(progress.id, progress.owner, hadFailure ? "failed" : "succeeded", { step: hadFailure ? "Stopped with partial or changed rows — inspect results" : "Confirmed client onboarding complete", metadata: { batchId: batch.id, outcomes } });
  }
}
