import { z } from "zod";
import {
  captureStepSchema,
  parameterSchema,
  recipeDefinitionSchema,
  ROW_STATES,
} from "./twice-contract.js";
import { executionPayloadSchema } from "./twice-actions.js";
const id = z.string().min(1).max(128);
const actor = z.looseObject({
  kind: z.enum(["human", "agent", "system"]),
  surface: z.string(),
  userEmail: z.string(),
  at: z.string(),
  threadId: z.string().nullable(),
});
const owned = {
  id,
  ownerEmail: z.string(),
  orgId: z.string().nullable(),
  visibility: z.enum(["private", "org", "public"]),
};
const recipe = z.looseObject({
  ...owned,
  title: z.string(),
  revision: z.number().int(),
  demonstrationId: id.nullable(),
  activeVersionId: id.nullable(),
});
const batch = z.looseObject({
  ...owned,
  recipeId: id,
  title: z.string(),
  sourceText: z.string(),
  revision: z.number().int(),
  isSample: z.number().int(),
});
const exclusion = z.object({
  path: z.string(),
  reason: z.enum(["fixed-or-identifier", "unsupported", "duplicate", "invalid"]),
});
const version = z.looseObject({
  ...owned,
  recipeId: id,
  title: z.string(),
  definition: recipeDefinitionSchema,
  contentHash: z.string().length(64),
  historyId: id.nullable(),
  acceptedAt: z.string().nullable(),
  authoredBy: actor,
});
export const workspaceOutputSchema = z.looseObject({
  inputContract: z
    .object({
      stageOptions: z.array(z.string()),
      stageVariable: z.boolean(),
      fixedStage: z.string(),
      listId: id,
      connectionId: id,
    })
    .nullable(),
  recipes: z.array(recipe).max(30),
  batches: z.array(batch).max(30),
  recipe: recipe
    .extend({
      parameters: z.array(parameterSchema),
      exclusions: z.array(exclusion),
      proposalActor: z.union([actor, z.object({}).strict()]),
    })
    .nullable(),
  batch: batch.extend({ preparationActor: z.union([actor, z.object({}).strict()]) }).nullable(),
  demonstration: z
    .looseObject({
      ...owned,
      recipeId: id,
      revision: z.number().int(),
      trace: z.array(captureStepSchema).max(3),
    })
    .nullable(),
  rows: z
    .array(
      z.looseObject({
        ...owned,
        batchId: id,
        clientName: z.string(),
        stage: z.string().nullable(),
        uncertain: z.boolean(),
        uncertainty: z.string(),
        sourceText: z.string(),
        state: z.enum(ROW_STATES),
        revision: z.number().int(),
        startedAt: z.string().nullable(),
        finishedAt: z.string().nullable(),
        recordId: id.nullable(),
        entryId: id.nullable(),
        taskId: id.nullable(),
        error: z.string().nullable(),
      }),
    )
    .max(5),
  versions: z.array(version).max(20),
  runs: z
    .array(
      z.looseObject({ ...owned, batchId: id, state: z.string(), results: z.array(z.unknown()) }),
    )
    .max(10),
  allowedParameterPaths: z.array(z.string()).max(2),
});
export const proposalOutputSchema = z.object({
  recipeId: id,
  parameters: z.array(parameterSchema).max(2),
  exclusions: z.array(exclusion),
  summary: z.string(),
  nextStep: z.string(),
});
export const acceptedVersionOutputSchema = workspaceOutputSchema.extend({
  recipeId: id,
  recipeVersionId: id,
  historyVersionId: id,
  contentHash: z.string().length(64),
  authoredBy: actor,
});
const operation = z.object({
  action: z.enum(["create-crm-record", "add-crm-record-to-list", "manage-crm-task"]),
  input: z.record(z.string(), z.unknown()),
});
export const previewOutputSchema = z.object({
  batchId: id,
  payload: executionPayloadSchema,
  payloadHash: z.string().length(64),
  readyCount: z.number().int(),
  blockedCount: z.number().int(),
  stageOptions: z.array(z.string()),
  previews: z
    .array(
      z.object({
        rowId: id,
        ready: z.boolean(),
        reason: z.string(),
        operations: z.array(operation).length(3),
      }),
    )
    .max(5),
});
export const runOutputSchema = z.object({
  runId: id,
  batchId: id,
  recipeVersionId: id,
  message: z.string(),
  warnings: z.array(z.string()),
  done: z.number().int(),
  blocked: z.number().int(),
  partial: z.number().int(),
  outcomes: z
    .array(
      z.object({
        rowId: id,
        clientName: z.string(),
        outcome: z.enum(["Done", "Blocked", "Partial"]),
        reason: z.string().optional(),
        recordId: id.optional(),
        entryId: id.optional(),
        taskId: id.optional(),
      }),
    )
    .max(5),
});
