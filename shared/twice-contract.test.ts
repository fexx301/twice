import { describe, expect, it } from "vitest";
import { classifyParameters, compileRecipe, deriveBindings, PARAMETER_PATHS, rowVerdict, traceSchema } from "./twice-contract.js";

const trace = [
  { name: "create-crm-record", input: { kind: "account", displayName: "Labelled sample A", connectionId: "native-connection" }, result: { recordId: "created-account", connectionId: "native-connection", displayName: "Labelled sample A", provider: "native", kind: "account" } },
  { name: "add-crm-record-to-list", input: { listId: "onboarding-list", recordId: "created-account", values: { stage: "new" } }, result: { entryId: "entry", listId: "onboarding-list", recordId: "created-account" } },
  { name: "manage-crm-task", input: { recordId: "created-account", title: "Send onboarding pack", status: "open" }, result: { id: "task", recordId: "created-account", title: "Send onboarding pack", status: "open" } },
];
const name = { path: PARAMETER_PATHS[0], name: "clientName", label: "Client name", explanation: "Each client has a name.", uncertain: false };
const stage = { path: PARAMETER_PATHS[1], name: "stage", label: "Stage", explanation: "The user chooses a stage for each client.", uncertain: false };

describe("Twice parameter classification", () => {
  it("drops the fixed-ID fields mistakenly classified by the observed model response", () => {
    const result = classifyParameters([name,
      { inputPath: "create-crm-record.input.connectionId", name: "connectionId", reason: "Do not parameterize." },
      { inputPath: "add-crm-record-to-list.input.listId", name: "listId", reason: "Do not parameterize." }, stage]);
    expect(result.parameters).toEqual([name, stage]);
    expect(result.exclusions).toHaveLength(2);
    expect(result.exclusions.every(e => e.reason === "fixed-or-identifier")).toBe(true);
  });
  it("never admits result IDs, returned-record slots, fixed task configuration or misleading names", () => {
    const candidates = [
      { ...name, path: "create-crm-record.result.recordId" },
      { ...name, path: "manage-crm-task.input.recordId" },
      { ...name, path: "manage-crm-task.input.title" },
      { ...name, name: "recordId" },
    ];
    expect(classifyParameters(candidates).parameters).toEqual([]);
  });
  it("rejects duplicate paths or names instead of hiding conflicting substitutions", () => {
    const result = classifyParameters([name, { ...stage, name: "clientName" }, name]);
    expect(result.parameters).toEqual([name]);
    expect(result.exclusions.map(e => e.reason)).toEqual(["duplicate", "duplicate"]);
  });
});

describe("Twice bounded native-action compiler", () => {
  it("canonicalizes the echoed recordId as one producer with two consumers", () => {
    expect(deriveBindings(trace).map(e => [e.fromStep, e.step])).toEqual([[0, 1], [0, 2]]);
  });
  it("refuses a captured task referring to an unrelated client", () => {
    const bad = structuredClone(trace);
    bad[2].input.recordId = "another-account";
    expect(() => deriveBindings(bad)).toThrow("INVALID_REFERENCE");
  });
  it("strips unneeded result metadata but does not accept extra executable inputs", () => {
    const extended = structuredClone(trace) as any[];
    extended[0].result.ownerEmail = "not-trusted-from-client@example.invalid";
    expect((traceSchema.parse(extended)[0].result as any).ownerEmail).toBeUndefined();
    extended[2].input.taskId = "must-not-update-existing-task";
    expect(() => traceSchema.parse(extended)).toThrow();
  });
  it("requires the new client's name and applies a saved stage decision consistently", () => {
    expect(() => compileRecipe({ demonstrationId: "demo", title: "Onboard", trace, parameters: [stage] })).toThrow("new client name");
    const fixed = compileRecipe({ demonstrationId: "demo", title: "Onboard", trace, parameters: [name] });
    const variable = compileRecipe({ demonstrationId: "demo", title: "Onboard", trace, parameters: [name, stage] });
    const row = { clientName: "Next labelled sample", stage: "in-progress", uncertain: false, uncertainty: "", sourceText: "" };
    expect(rowVerdict(fixed, row, ["new", "in-progress"]).ready).toBe(false);
    expect(rowVerdict(variable, row, ["new", "in-progress"]).ready).toBe(true);
    expect(rowVerdict(variable, { ...row, uncertain: true }, ["new", "in-progress"]).ready).toBe(false);
  });
});
