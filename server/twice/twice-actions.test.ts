import { mkdtempSync, rmSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { closeDbExec } from "@agent-native/core/db";
import { runWithRequestContext } from "@agent-native/core/server/request-context";
import type { ActionRunContext } from "@agent-native/core/action";
import { and, eq } from "drizzle-orm";
import { resolveAccess } from "@agent-native/core/sharing";
import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";
import { PARAMETER_PATHS } from "../../shared/twice-contract.js";

const folder = mkdtempSync(join(tmpdir(), "twice-actions-"));
const OWNER = "owner@example.invalid";
const OTHER = "viewer@example.invalid";
let dbModule: typeof import("../db/index.js");
let init: typeof import("../../actions/initialize-twice.js").default;
let getWorkspace: typeof import("../../actions/get-twice-workspace.js").default;
let saveDemo: typeof import("../../actions/save-demonstration.js").default;
let saveProposal: typeof import("../../actions/save-parameter-proposal.js").default;
let saveVersion: typeof import("../../actions/save-recipe-version.js").default;
let saveRows: typeof import("../../actions/save-batch-rows.js").default;
let preview: typeof import("../../actions/preview-batch.js").default;
let execute: typeof import("../../actions/run-batch.js").default;
let nativeConnection: typeof import("../../actions/configure-native-crm.js").default;
let nativeList: typeof import("../../actions/create-crm-list.js").default;
let nativeCreate: typeof import("../../actions/create-crm-record.js").default;
let nativeAdd: typeof import("../../actions/add-crm-record-to-list.js").default;
let nativeTask: typeof import("../../actions/manage-crm-task.js").default;
let createHistory: typeof import("@agent-native/core/history/actions/create-resource-version").default;
let canonicalHash: typeof import("./store.js").hash;
let counter = 0;
const context = (
  name: string,
  email = OWNER,
  caller: ActionRunContext["caller"] = "frontend",
): ActionRunContext => ({ caller, userEmail: email, orgId: null, actionName: name });
function call<T>(
  action: { run: (args: any, ctx?: ActionRunContext) => Promise<T> | T },
  args: unknown,
  name: string,
  email = OWNER,
  caller: ActionRunContext["caller"] = "frontend",
): Promise<T> {
  return runWithRequestContext({ userEmail: email, orgId: null }, async () =>
    action.run(args, context(name, email, caller)),
  );
}
const parameters = [
  {
    path: PARAMETER_PATHS[0],
    name: "clientName",
    label: "Client name",
    explanation: "Each client has a different name.",
    uncertain: false,
  },
  {
    path: PARAMETER_PATHS[1],
    name: "stage",
    label: "Stage",
    explanation: "The user chooses the stage for each client.",
    uncertain: false,
  },
];

beforeAll(async () => {
  vi.stubEnv("DATABASE_URL", `pglite:${join(folder, "data")}`);
  dbModule = await import("../db/index.js");
  await (await import("../plugins/db.js")).default(undefined);
  init = (await import("../../actions/initialize-twice.js")).default;
  getWorkspace = (await import("../../actions/get-twice-workspace.js")).default;
  saveDemo = (await import("../../actions/save-demonstration.js")).default;
  saveProposal = (await import("../../actions/save-parameter-proposal.js")).default;
  saveVersion = (await import("../../actions/save-recipe-version.js")).default;
  saveRows = (await import("../../actions/save-batch-rows.js")).default;
  preview = (await import("../../actions/preview-batch.js")).default;
  execute = (await import("../../actions/run-batch.js")).default;
  nativeConnection = (await import("../../actions/configure-native-crm.js")).default;
  nativeList = (await import("../../actions/create-crm-list.js")).default;
  nativeCreate = (await import("../../actions/create-crm-record.js")).default;
  nativeAdd = (await import("../../actions/add-crm-record-to-list.js")).default;
  nativeTask = (await import("../../actions/manage-crm-task.js")).default;
  createHistory = (await import("@agent-native/core/history/actions/create-resource-version"))
    .default;
  canonicalHash = (await import("./store.js")).hash;
}, 60000);

afterAll(async () => {
  vi.restoreAllMocks();
  await closeDbExec();
  vi.unstubAllEnvs();
  rmSync(folder, { recursive: true, force: true });
});

async function fixture(count = 2, unclear = false) {
  const suffix = ++counter;
  const initial = await call(init, {}, "initialize-twice");
  const connection = await call(
    nativeConnection,
    { label: `Twice fixture ${suffix}` },
    "configure-native-crm",
  );
  const list = await call(
    nativeList,
    {
      connectionId: connection.id,
      name: `Onboarding ${suffix}`,
      parentObjectType: "accounts",
      seedAttributes: true,
    },
    "create-crm-list",
  );
  const createInput = {
    kind: "account" as const,
    displayName: `Original labelled fixture ${suffix}`,
    connectionId: connection.id,
  };
  const record = await call(nativeCreate, createInput, "create-crm-record");
  const addInput = { listId: list.id, recordId: record.recordId, values: { stage: "new" } };
  const entry = await call(nativeAdd, addInput, "add-crm-record-to-list");
  const taskInput = {
    recordId: record.recordId,
    title: "Send onboarding pack",
    status: "open" as const,
  };
  const task = await call(nativeTask, taskInput, "manage-crm-task");
  let ws = await call(
    saveDemo,
    {
      recipeId: initial.recipe!.id,
      expectedRecipeRevision: initial.recipe!.revision,
      trace: [
        { name: "create-crm-record", input: createInput, result: record },
        { name: "add-crm-record-to-list", input: addInput, result: entry },
        { name: "manage-crm-task", input: taskInput, result: task },
      ],
    },
    "save-demonstration",
  );
  await call(
    saveProposal,
    {
      recipeId: ws.recipe!.id,
      expectedRevision: ws.recipe!.revision,
      parameters,
      summary: "Only client name and stage vary.",
    },
    "save-parameter-proposal",
    OWNER,
    "tool",
  );
  ws = await call(getWorkspace, { recipeId: ws.recipe!.id }, "get-twice-workspace");
  const accepted = await call(
    saveVersion,
    {
      recipeId: ws.recipe!.id,
      expectedRevision: ws.recipe!.revision,
      title: "Client onboarding",
      parameters,
    },
    "save-recipe-version",
  );
  const rows = Array.from({ length: count }, (_, index) => ({
    clientName: `Next labelled fixture ${suffix}-${index}`,
    stage: unclear && index === count - 1 ? null : index % 2 ? "in-progress" : "new",
    uncertain: unclear && index === count - 1,
    uncertainty: unclear && index === count - 1 ? "The email does not specify a stage." : "",
    sourceText: "Synthetic test note",
  }));
  const draft = await call(
    saveRows,
    {
      recipeId: ws.recipe!.id,
      title: "Fixture batch",
      sourceText: "Synthetic test note",
      rows,
      confirm: false,
    },
    "save-batch-rows",
  );
  const batchId = String(draft.summary!.batchId);
  const draftState = await call(getWorkspace, { batchId }, "get-twice-workspace");
  const inputRows = draftState.rows.map((row) => ({
    id: row.id,
    clientName: row.clientName,
    stage: row.stage,
    uncertain: row.uncertain,
    uncertainty: row.uncertainty,
    sourceText: row.sourceText,
  }));
  await call(
    saveRows,
    {
      recipeId: ws.recipe!.id,
      batchId,
      expectedRevision: draftState.batch!.revision,
      title: "Fixture batch",
      sourceText: "Synthetic test note",
      rows: inputRows,
      confirm: true,
    },
    "save-batch-rows",
  );
  const ready = await call(preview, { batchId }, "preview-batch");
  return { recipeId: ws.recipe!.id, accepted, batchId, record, list, ready };
}

async function recordCount(connectionId: string) {
  const rows = await call(
    {
      run: async () =>
        dbModule
          .getDb()
          .select()
          .from(dbModule.schema.crmRecords)
          .where(
            and(
              eq(dbModule.schema.crmRecords.connectionId, connectionId),
              eq(dbModule.schema.crmRecords.ownerEmail, OWNER),
            ),
          ),
    },
    {},
    "test-read",
  );
  return rows.length;
}

describe("Twice native action workflow and execution boundaries", () => {
  it("onboards ready clients and leaves the uncertain row untouched", async () => {
    const f = await fixture(5, true);
    const result = await call(
      execute,
      { payload: f.ready.payload, payloadHash: f.ready.payloadHash },
      "run-batch",
    );
    expect(result).toMatchObject({ done: 4, blocked: 1, partial: 0 });
    const ws = await call(getWorkspace, { batchId: f.batchId }, "get-twice-workspace");
    expect(ws.rows.filter((row) => row.state === "Done")).toHaveLength(4);
    expect(ws.rows[4]).toMatchObject({ state: "Blocked", startedAt: null, recordId: null });
    expect(await recordCount(f.record.connectionId)).toBe(5);
    for (const row of ws.rows.filter((row) => row.state === "Done")) {
      const [task] = await dbModule
        .getDb()
        .select()
        .from(dbModule.schema.crmTasks)
        .where(
          and(
            eq(dbModule.schema.crmTasks.id, row.taskId!),
            eq(dbModule.schema.crmTasks.ownerEmail, OWNER),
          ),
        );
      const [entry] = await dbModule
        .getDb()
        .select()
        .from(dbModule.schema.crmListEntries)
        .where(
          and(
            eq(dbModule.schema.crmListEntries.id, row.entryId!),
            eq(dbModule.schema.crmListEntries.ownerEmail, OWNER),
          ),
        );
      expect(task.recordId).toBe(row.recordId);
      expect(entry.recordId).toBe(row.recordId);
      expect(row.recordId).not.toBe(f.record.recordId);
    }
  }, 30000);

  it("concurrent double-run and subsequent repeat cannot duplicate CRM writes", async () => {
    const f = await fixture();
    const args = { payload: f.ready.payload, payloadHash: f.ready.payloadHash };
    const settled = await Promise.allSettled([
      call(execute, args, "run-batch"),
      call(execute, args, "run-batch"),
    ]);
    expect(
      settled
        .flatMap((value) => (value.status === "fulfilled" ? [value.value.done] : []))
        .reduce((a, b) => a + b, 0),
    ).toBe(2);
    // Each run, including the loser, reports one outcome per previewed row.
    for (const value of settled)
      if (value.status === "fulfilled")
        expect(value.value.outcomes).toHaveLength(f.ready.payload.rows.length);
    expect(await recordCount(f.record.connectionId)).toBe(3);
    await expect(call(execute, args, "run-batch")).rejects.toThrow(/STALE_PREVIEW|No confirmed/);
    expect(await recordCount(f.record.connectionId)).toBe(3);
  }, 30000);

  it("starts a fresh demonstration and refuses a captured stage the stored entry does not have", async () => {
    const f = await fixture(1);
    let ws = await call(getWorkspace, { recipeId: f.recipeId }, "get-twice-workspace");
    const trace = ws.demonstration!.trace as any[];
    ws = await call(
      saveDemo,
      { recipeId: f.recipeId, expectedRecipeRevision: ws.recipe!.revision, trace: [] },
      "save-demonstration",
    );
    expect(ws.demonstration!.trace).toEqual([]);
    expect(ws.recipe!.activeVersionId).toBe(f.accepted.recipeVersionId);
    const forged = [trace[0], { ...trace[1], input: { ...trace[1].input, values: { stage: "in-progress" } } }];
    await expect(
      call(
        saveDemo,
        {
          recipeId: f.recipeId,
          demonstrationId: ws.demonstration!.id,
          expectedRecipeRevision: ws.recipe!.revision,
          expectedDemonstrationRevision: ws.demonstration!.revision,
          trace: forged,
        },
        "save-demonstration",
      ),
    ).rejects.toThrow(/stage cannot be verified/);
  }, 30000);

  it("an edit cannot reset a row after its durable claim", async () => {
    const f = await fixture(1);
    const before = await call(getWorkspace, { batchId: f.batchId }, "get-twice-workspace");
    let announce!: () => void;
    let release!: () => void;
    const claimed = new Promise<void>((resolve) => {
      announce = resolve;
    });
    const gate = new Promise<void>((resolve) => {
      release = resolve;
    });
    const original = nativeCreate.run.bind(nativeCreate);
    const spy = vi.spyOn(nativeCreate, "run").mockImplementationOnce(async (args, ctx) => {
      announce();
      await gate;
      return original(args, ctx);
    });
    const running = call(
      execute,
      { payload: f.ready.payload, payloadHash: f.ready.payloadHash },
      "run-batch",
    );
    try {
      await claimed;
      await expect(
        call(
          saveRows,
          {
            recipeId: f.recipeId,
            batchId: f.batchId,
            expectedRevision: before.batch!.revision,
            title: "Cannot reset",
            sourceText: "",
            rows: [],
            confirm: false,
          },
          "save-batch-rows",
        ),
      ).rejects.toThrow(/started/);
    } finally {
      release();
    }
    expect((await running).done).toBe(1);
    spy.mockRestore();
  }, 30000);

  it("rejects stale confirmation before any new CRM creation", async () => {
    const f = await fixture(1);
    const ws = await call(getWorkspace, { batchId: f.batchId }, "get-twice-workspace");
    await call(
      saveRows,
      {
        recipeId: f.recipeId,
        batchId: f.batchId,
        expectedRevision: ws.batch!.revision,
        title: "Edited",
        sourceText: "",
        rows: [
          {
            id: ws.rows[0].id,
            clientName: "Edited labelled client",
            stage: "new",
            uncertain: false,
          },
        ],
        confirm: false,
      },
      "save-batch-rows",
    );
    await expect(
      call(execute, { payload: f.ready.payload, payloadHash: f.ready.payloadHash }, "run-batch"),
    ).rejects.toThrow("STALE_PREVIEW");
    expect(await recordCount(f.record.connectionId)).toBe(1);
  });

  it("denies another user and a viewer without treating a content hash as authorization", async () => {
    const f = await fixture(1);
    await expect(
      call(getWorkspace, { batchId: f.batchId }, "get-twice-workspace", OTHER),
    ).rejects.toThrow();
    // Explicit user shares are restricted to the resource's current organization.
    const orgId = crypto.randomUUID();
    await dbModule
      .getDb()
      .update(dbModule.schema.twiceBatches)
      .set({ orgId })
      .where(eq(dbModule.schema.twiceBatches.id, f.batchId));
    await dbModule
      .getDb()
      .insert(dbModule.schema.twiceBatchShares)
      .values({
        id: crypto.randomUUID(),
        resourceId: f.batchId,
        principalType: "user",
        principalId: OTHER,
        role: "viewer",
        createdBy: OWNER,
      });
    expect(
      await resolveAccess("twice-batch", f.batchId, { userEmail: OTHER, orgId }),
    ).toMatchObject({ role: "viewer" });
    await expect(
      runWithRequestContext({ userEmail: OTHER, orgId }, () =>
        execute.run(
          { payload: f.ready.payload, payloadHash: f.ready.payloadHash },
          { ...context("run-batch", OTHER), orgId },
        ),
      ),
    ).rejects.toThrow();
    expect(await recordCount(f.record.connectionId)).toBe(1);
  });

  it("does not execute arbitrary or newly-created generic History snapshots", async () => {
    const f = await fixture(1);
    const generic = await call(
      createHistory,
      {
        resourceType: "twice-recipe-version",
        resourceId: f.accepted.recipeVersionId,
        snapshot: { injected: true },
        summary: "Generic history entry",
      },
      "create-resource-version",
    );
    expect((generic.snapshot as any).injected).toBeUndefined();
    expect((generic.snapshot as any).contentHash).toBe(f.ready.payload.recipeContentHash);
    const forged = { ...f.ready.payload, historyVersionId: generic.id };
    await expect(
      call(execute, { payload: forged, payloadHash: canonicalHash(forged) }, "run-batch"),
    ).rejects.toThrow("STALE_PREVIEW");
    const wrong = { ...f.ready.payload, recipeVersionId: "another-resource-version" };
    await expect(
      call(execute, { payload: wrong, payloadHash: canonicalHash(wrong) }, "run-batch"),
    ).rejects.toThrow("STALE_PREVIEW");
    expect(await recordCount(f.record.connectionId)).toBe(1);
  });

  it("does not report Done when final row persistence fails after task creation", async () => {
    const f = await fixture(1);
    const db = dbModule.getDb();
    const update = db.update.bind(db);
    let injected = false;
    const spy = vi.spyOn(db, "update").mockImplementation(((table: unknown) => {
      const builder = update(table as never);
      const set = builder.set.bind(builder);
      builder.set = ((values: any) => {
        if (table === dbModule.schema.twiceRows && values.state === "Done" && !injected) {
          injected = true;
          throw new Error("Injected final persistence failure");
        }
        return set(values);
      }) as typeof builder.set;
      return builder;
    }) as typeof db.update);
    try {
      const result = await call(
        execute,
        { payload: f.ready.payload, payloadHash: f.ready.payloadHash },
        "run-batch",
      );
      expect(result).toMatchObject({ done: 0, partial: 1 });
      expect(result.outcomes[0].taskId).toBeTruthy();
      const ws = await call(getWorkspace, { batchId: f.batchId }, "get-twice-workspace");
      expect(ws.rows[0]).toMatchObject({
        state: "Blocked",
        executionState: "failed",
        taskId: result.outcomes[0].taskId,
      });
    } finally {
      spy.mockRestore();
    }
  });

  it("keeps the active accepted version available when newer unaccepted snapshots fill history", async () => {
    const f = await fixture(1);
    const ws = await call(getWorkspace, { batchId: f.batchId }, "get-twice-workspace");
    const active = ws.versions.find((v) => v.id === ws.recipe!.activeVersionId)!;
    await dbModule
      .getDb()
      .insert(dbModule.schema.twiceRecipeVersions)
      .values(
        Array.from({ length: 21 }, (_, i) => ({
          id: crypto.randomUUID(),
          recipeId: f.recipeId,
          title: "Unaccepted race snapshot",
          definitionJson: JSON.stringify(active.definition),
          contentHash: active.contentHash,
          provenanceJson: JSON.stringify(active.authoredBy),
          ownerEmail: OWNER,
          orgId: null,
          visibility: "private" as const,
          createdAt: new Date(Date.now() + i + 1000).toISOString(),
        })),
      );
    const refreshed = await call(getWorkspace, { batchId: f.batchId }, "get-twice-workspace");
    expect(refreshed.inputContract!.stageOptions).toContain("in-progress");
    expect(refreshed.versions.some((v) => v.id === active.id)).toBe(true);
    expect(refreshed.versions).toHaveLength(20);
  });

  it("rejects agent preparation that changes source notes or cites stale excerpts", async () => {
    const f = await fixture(1);
    const ws = await call(getWorkspace, { batchId: f.batchId }, "get-twice-workspace");
    const args = {
      recipeId: f.recipeId,
      batchId: f.batchId,
      expectedRevision: ws.batch!.revision,
      title: "Fixture batch",
      sourceText: ws.batch!.sourceText,
      rows: [
        { clientName: "Old client", stage: "new", uncertain: false, sourceText: "Stale excerpt" },
      ],
      confirm: false,
    };
    await expect(
      call(saveRows, { ...args, sourceText: "Replaced notes" }, "save-batch-rows", OWNER, "tool"),
    ).rejects.toThrow(/Notes changed/);
    await expect(call(saveRows, args, "save-batch-rows", OWNER, "tool")).rejects.toThrow(
      /exact excerpt/,
    );
  });

  it.each([0, 1, 2])(
    "failure at CRM step %s permanently consumes the row and retains partial IDs",
    async (step) => {
      const f = await fixture(1);
      const actions = [nativeCreate, nativeAdd, nativeTask];
      const spy = vi
        .spyOn(actions[step] as any, "run")
        .mockRejectedValueOnce(new Error("Injected action failure"));
      const result = await call(
        execute,
        { payload: f.ready.payload, payloadHash: f.ready.payloadHash },
        "run-batch",
      );
      spy.mockRestore();
      expect(result).toMatchObject({ done: 0, partial: 1 });
      const ws = await call(getWorkspace, { batchId: f.batchId }, "get-twice-workspace");
      expect(ws.rows[0].startedAt).not.toBeNull();
      expect(ws.rows[0].executionState).toBe("failed");
      expect(Boolean(ws.rows[0].recordId)).toBe(step > 0);
      expect(Boolean(ws.rows[0].entryId)).toBe(step > 1);
      await expect(
        call(execute, { payload: f.ready.payload, payloadHash: f.ready.payloadHash }, "run-batch"),
      ).rejects.toThrow("STALE_PREVIEW");
    },
  );
});
