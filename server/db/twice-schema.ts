import { createSharesTable, integer, now, ownableColumns, table, text } from "@agent-native/core/db/schema";

export const twiceRecipes = table("twice_recipes", {
  id: text("id").primaryKey(),
  title: text("title").notNull(),
  demonstrationId: text("demonstration_id"),
  proposalJson: text("proposal_json").notNull().default("[]"),
  exclusionsJson: text("exclusions_json").notNull().default("[]"),
  proposalSummary: text("proposal_summary").notNull().default(""),
  proposalActorJson: text("proposal_actor_json").notNull().default("{}"),
  activeVersionId: text("active_version_id"),
  revision: integer("revision").notNull().default(0),
  createdAt: text("created_at").notNull().default(now()),
  updatedAt: text("updated_at").notNull().default(now()),
  ...ownableColumns(),
});
export const twiceRecipeShares = createSharesTable("twice_recipe_shares");

export const twiceDemonstrations = table("twice_demonstrations", {
  id: text("id").primaryKey(), recipeId: text("recipe_id").notNull(),
  title: text("title").notNull(), traceJson: text("trace_json").notNull().default("[]"),
  revision: integer("revision").notNull().default(0),
  createdAt: text("created_at").notNull().default(now()), updatedAt: text("updated_at").notNull().default(now()),
  ...ownableColumns(),
});
export const twiceDemonstrationShares = createSharesTable("twice_demonstration_shares");

export const twiceRecipeVersions = table("twice_recipe_versions", {
  id: text("id").primaryKey(), recipeId: text("recipe_id").notNull(),
  title: text("title").notNull(), definitionJson: text("definition_json").notNull(),
  contentHash: text("content_hash").notNull(), historyId: text("history_id"),
  provenanceJson: text("provenance_json").notNull(), acceptedAt: text("accepted_at"),
  createdAt: text("created_at").notNull().default(now()),
  ...ownableColumns(),
});
export const twiceVersionShares = createSharesTable("twice_version_shares");

export const twiceBatches = table("twice_batches", {
  id: text("id").primaryKey(), recipeId: text("recipe_id").notNull(),
  title: text("title").notNull(), sourceText: text("source_text").notNull().default(""),
  isSample: integer("is_sample").notNull().default(0),
  revision: integer("revision").notNull().default(0),
  preparationActorJson: text("preparation_actor_json").notNull().default("{}"),
  createdAt: text("created_at").notNull().default(now()), updatedAt: text("updated_at").notNull().default(now()),
  ...ownableColumns(),
});
export const twiceBatchShares = createSharesTable("twice_batch_shares");

export const twiceRows = table("twice_rows", {
  id: text("id").primaryKey(), batchId: text("batch_id").notNull(),
  clientName: text("client_name").notNull(), stage: text("stage"),
  uncertain: integer("uncertain").notNull().default(1),
  uncertainty: text("uncertainty").notNull().default(""), sourceText: text("source_text").notNull().default(""),
  state: text("state", { enum: ["Draft", "Ready", "Blocked", "Done"] }).notNull().default("Draft"),
  position: integer("position").notNull().default(0), revision: integer("revision").notNull().default(0),
  confirmedRevision: integer("confirmed_revision"), recipeVersionId: text("recipe_version_id"),
  startedAt: text("started_at"), finishedAt: text("finished_at"),
  executionState: text("execution_state").notNull().default("unstarted"),
  runId: text("run_id"), recordId: text("record_id"), entryId: text("entry_id"), taskId: text("task_id"), error: text("error"),
  createdAt: text("created_at").notNull().default(now()), updatedAt: text("updated_at").notNull().default(now()),
  ...ownableColumns(),
});
export const twiceRowShares = createSharesTable("twice_row_shares");

export const twiceRuns = table("twice_runs", {
  id: text("id").primaryKey(), batchId: text("batch_id").notNull(),
  recipeVersionId: text("recipe_version_id").notNull(), payloadHash: text("payload_hash").notNull(),
  state: text("state").notNull().default("running"), resultJson: text("result_json").notNull().default("[]"),
  createdAt: text("created_at").notNull().default(now()), updatedAt: text("updated_at").notNull().default(now()),
  ...ownableColumns(),
});
export const twiceRunShares = createSharesTable("twice_run_shares");
