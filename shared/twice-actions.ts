import { z } from "zod";
import { captureStepSchema, parameterSchema, preparedRowSchema, TWICE_COMPILER_VERSION } from "./twice-contract.js";

const id = z.string().trim().min(1).max(128);
export const saveDemonstrationSchema = z.object({
  recipeId: id, demonstrationId: id.optional(), expectedRecipeRevision: z.number().int().min(0),
  expectedDemonstrationRevision: z.number().int().min(0).optional(),
  trace: z.array(captureStepSchema).max(3),
}).strict();
export const saveParameterProposalSchema = z.object({
  recipeId: id, expectedRevision: z.number().int().min(0),
  parameters: z.array(parameterSchema).max(2).describe("Only the two allowed literal input paths. Never include connectionId, listId, recordId, entryId, taskId, kind, title or status."),
  summary: z.string().trim().max(1000),
}).strict();
export const saveRecipeVersionSchema = z.object({
  recipeId: id, expectedRevision: z.number().int().min(0),
  title: z.string().trim().min(1).max(120), parameters: z.array(parameterSchema).min(1).max(2),
}).strict();
export const saveBatchRowsSchema = z.object({
  recipeId: id, batchId: id.optional(), expectedRevision: z.number().int().min(0).optional(),
  title: z.string().trim().min(1).max(120).default("Client batch"),
  sourceText: z.string().max(12000),
  rows: z.array(preparedRowSchema).max(5).describe("At most five clients. Missing/ambiguous stages must be null with uncertain=true and an explanation, never guessed. These are drafts until a person confirms."),
  confirm: z.boolean().default(false).describe("False for agent preparation. True confirms the exact table and requires native human approval for an agent caller."),
}).strict();
export const frozenRowSchema = z.object({
  id, revision: z.number().int().min(0), clientName: z.string().max(500), stage: z.string().max(120).nullable(),
  uncertain: z.boolean(), state: z.enum(["Draft", "Ready", "Blocked", "Done"]),
  ready: z.boolean(), reason: z.string().max(1000),
}).strict();
export const executionPayloadSchema = z.object({
  compilerVersion: z.literal(TWICE_COMPILER_VERSION), recipeId: id, recipeVersionId: id, historyVersionId: id,
  recipeContentHash: z.string().length(64), batchId: id, batchRevision: z.number().int().min(0),
  fixed: z.object({ connectionId: id, listId: id, taskTitle: z.string().max(500), fixedStage: z.string().max(500), stageVariable: z.boolean() }).strict(),
  rows: z.array(frozenRowSchema).min(1).max(5),
}).strict().superRefine((value, issue) => {
  if (new Set(value.rows.map(r => r.id)).size !== value.rows.length) issue.addIssue({ code: "custom", message: "Duplicate row IDs are not allowed.", path: ["rows"] });
});
export const runBatchSchema = z.object({ payload: executionPayloadSchema, payloadHash: z.string().length(64) }).strict();
export type ExecutionPayload = z.infer<typeof executionPayloadSchema>;
