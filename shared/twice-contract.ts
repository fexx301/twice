import { z } from "zod";

export const TWICE_COMPILER_VERSION = 1;
export const PARAMETER_PATHS = [
  "create-crm-record.input.displayName",
  "add-crm-record-to-list.input.values.stage",
] as const;
export const PARAMETER_NAMES = ["clientName", "stage"] as const;
export const ROW_STATES = ["Draft", "Ready", "Blocked", "Done"] as const;
const id = z.string().trim().min(1).max(128);
const text = z.string().trim().min(1).max(500);

export const createStepSchema = z.object({
  name: z.literal("create-crm-record"),
  input: z.object({ kind: z.literal("account"), displayName: text, connectionId: id }).strict(),
  result: z.object({ recordId: id, connectionId: id, displayName: text, provider: z.literal("native"), kind: z.literal("account"), revision: z.string().optional() }),
});
export const addStepSchema = z.object({
  name: z.literal("add-crm-record-to-list"),
  input: z.object({ listId: id, recordId: id, values: z.object({ stage: text }).strict() }).strict(),
  result: z.object({ entryId: id, listId: id, recordId: id }),
});
export const taskStepSchema = z.object({
  name: z.literal("manage-crm-task"),
  input: z.object({ recordId: id, title: text, status: z.literal("open") }).strict(),
  result: z.object({ id, recordId: id, title: text, status: z.literal("open") }),
});
export const captureStepSchema = z.discriminatedUnion("name", [createStepSchema, addStepSchema, taskStepSchema]);
export const traceSchema = z.tuple([createStepSchema, addStepSchema, taskStepSchema]);
export type CapturedStep = z.infer<typeof captureStepSchema>;
export type DemonstrationTrace = z.infer<typeof traceSchema>;

export const parameterSchema = z.object({
  path: z.enum(PARAMETER_PATHS).describe("Only the captured client-name or list-entry-stage literal path; never an ID or fixed configuration."),
  name: z.string().trim().regex(/^[a-z][A-Za-z0-9_]{0,39}$/).describe("A short business name such as clientName or stage; never an identifier name."),
  label: z.string().trim().min(1).max(80),
  explanation: z.string().trim().min(1).max(500),
  uncertain: z.boolean().default(false),
}).strict();
export type LiteralParameter = z.infer<typeof parameterSchema>;
export type ParameterExclusion = { path: string; reason: "fixed-or-identifier" | "unsupported" | "duplicate" | "invalid" };

const RESERVED_NAMES = /^(?:id|recordid|entryid|taskid|listid|connectionid|recipeid|batchid|kind|status|title)$/i;

/** Defense for captured/imported or older model output. Only sanitized values reach proposal UI. */
export function classifyParameters(raw: readonly unknown[]): {
  parameters: LiteralParameter[];
  exclusions: ParameterExclusion[];
} {
  const parameters: LiteralParameter[] = [];
  const exclusions: ParameterExclusion[] = [];
  const paths = new Set<string>();
  const names = new Set<string>();
  for (const value of raw.slice(0, 32)) {
    const candidate = value && typeof value === "object" ? value as Record<string, unknown> : {};
    const path = typeof candidate.path === "string" ? candidate.path : typeof candidate.inputPath === "string" ? candidate.inputPath : "";
    const name = typeof candidate.name === "string" ? candidate.name : "";
    if (!PARAMETER_PATHS.includes(path as typeof PARAMETER_PATHS[number]) || RESERVED_NAMES.test(name)) {
      const fixed = /(?:Id|\.id|\.kind|\.status|\.title|\.result\.)\b/i.test(path) || RESERVED_NAMES.test(name);
      exclusions.push({ path: path.slice(0, 160), reason: fixed ? "fixed-or-identifier" : "unsupported" });
      continue;
    }
    const parsed = parameterSchema.safeParse({
      path, name,
      label: candidate.label ?? name,
      explanation: candidate.explanation ?? candidate.reason,
      uncertain: candidate.uncertain ?? false,
    });
    if (!parsed.success) { exclusions.push({ path, reason: "invalid" }); continue; }
    if (paths.has(path) || names.has(name.toLowerCase())) {
      exclusions.push({ path, reason: "duplicate" }); continue;
    }
    paths.add(path); names.add(name.toLowerCase()); parameters.push(parsed.data);
  }
  return { parameters, exclusions };
}

export type IdBinding = { step: 1 | 2; inputPath: "recordId"; fromStep: 0; outputPath: "recordId" };

/** The bounded CRM adapter owns identifier semantics; no inference or fuzzy matching. */
export function deriveBindings(raw: unknown): IdBinding[] {
  const trace = traceSchema.parse(raw);
  const created = trace[0].result.recordId;
  if (trace[0].input.connectionId !== trace[0].result.connectionId) throw new Error("The native connection changed during capture.");
  if (trace[1].input.listId !== trace[1].result.listId) throw new Error("The list changed during capture.");
  for (const index of [1, 2] as const) {
    if (trace[index].input.recordId !== created || trace[index].result.recordId !== created) {
      throw new Error("INVALID_REFERENCE: the list entry and task must reference the captured created account.");
    }
  }
  return [
    { step: 1, inputPath: "recordId", fromStep: 0, outputPath: "recordId" },
    { step: 2, inputPath: "recordId", fromStep: 0, outputPath: "recordId" },
  ];
}

export const recipeDefinitionSchema = z.object({
  compilerVersion: z.literal(TWICE_COMPILER_VERSION),
  demonstrationId: id,
  title: z.string().trim().min(1).max(120),
  parameters: z.array(parameterSchema).min(1).max(2),
  connectionId: id,
  listId: id,
  fixedStage: text,
  taskTitle: text,
}).strict();
export type RecipeDefinition = z.infer<typeof recipeDefinitionSchema>;

export function compileRecipe(input: {
  demonstrationId: string;
  title: string;
  trace: unknown;
  parameters: readonly unknown[];
}): RecipeDefinition {
  const trace = traceSchema.parse(input.trace);
  deriveBindings(trace);
  const classified = classifyParameters(input.parameters);
  if (classified.exclusions.length) throw new Error("Remove invalid, fixed or identifier parameters before accepting this version.");
  if (!classified.parameters.some(p => p.path === PARAMETER_PATHS[0])) throw new Error("A new client name must be a per-run input.");
  return recipeDefinitionSchema.parse({
    compilerVersion: TWICE_COMPILER_VERSION,
    demonstrationId: input.demonstrationId,
    title: input.title,
    parameters: classified.parameters,
    connectionId: trace[0].input.connectionId,
    listId: trace[1].input.listId,
    fixedStage: trace[1].input.values.stage,
    taskTitle: trace[2].input.title,
  });
}

export const preparedRowSchema = z.object({
  id: id.optional(),
  clientName: z.string().trim().max(500),
  stage: z.string().trim().max(120).nullable(),
  uncertain: z.boolean(),
  uncertainty: z.string().trim().max(500).default(""),
  sourceText: z.string().max(1000).default(""),
}).strict();
export type PreparedRow = z.infer<typeof preparedRowSchema>;

export function rowVerdict(recipe: RecipeDefinition, row: PreparedRow, stageOptions: readonly string[]): { ready: boolean; reason: string } {
  if (!row.clientName) return { ready: false, reason: "Add the client's name." };
  if (row.uncertain || row.stage === null) return { ready: false, reason: row.uncertainty || "Confirm the stage before running this client." };
  if (!stageOptions.includes(row.stage)) return { ready: false, reason: "Choose one of this list's current stages." };
  if (!recipe.parameters.some(p => p.path === PARAMETER_PATHS[1]) && row.stage !== recipe.fixedStage) {
    return { ready: false, reason: `This recipe keeps the stage fixed at ${recipe.fixedStage}. Edit the recipe or the row.` };
  }
  return { ready: true, reason: "" };
}

export function previewOperations(recipe: RecipeDefinition, row: PreparedRow) {
  return [
    { action: "create-crm-record" as const, input: { kind: "account", displayName: row.clientName, connectionId: recipe.connectionId } },
    { action: "add-crm-record-to-list" as const, input: { listId: recipe.listId, recordId: { fromStep: 0, outputPath: "recordId" }, values: { stage: row.stage } } },
    { action: "manage-crm-task" as const, input: { recordId: { fromStep: 0, outputPath: "recordId" }, title: recipe.taskTitle, status: "open" } },
  ];
}
