/** Lower-level real-agent/action integration eval, isolated from the operator's DB.
 * This is deliberately not represented as the framework's read-only production-chat CI gate. */
import { writeFileSync } from "node:fs";
import { closeDbExec } from "@agent-native/core/db";
import { createAgentRunner, runEvals } from "@agent-native/core/eval";
import { resolveEngine } from "@agent-native/core/agent/engine";
import { loadActionsFromStaticRegistry } from "@agent-native/core/server";
import { runWithRequestContext } from "@agent-native/core/server/request-context";
import type { ActionRunContext } from "@agent-native/core/action";
import init from "../actions/initialize-twice.js";
import native from "../actions/configure-native-crm.js";
import list from "../actions/create-crm-list.js";
import create from "../actions/create-crm-record.js";
import add from "../actions/add-crm-record-to-list.js";
import task from "../actions/manage-crm-task.js";
import demo from "../actions/save-demonstration.js";
import accept from "../actions/save-recipe-version.js";
import save from "../actions/save-batch-rows.js";
import * as workspaceModule from "../actions/get-twice-workspace.js";
import * as attributesModule from "../actions/list-crm-attributes.js";
import * as saveModule from "../actions/save-batch-rows.js";
import migrations from "../server/plugins/db.js";
import { TWICE_AGENT_INSTRUCTIONS } from "../server/twice/agent-instructions.js";
import { PARAMETER_PATHS, traceSchema } from "../shared/twice-contract.js";
import testCase, { MESSY_EMAIL } from "../evals/messy-email.eval.js";

const email = "twice-eval@example.invalid";
const context = (actionName: string): ActionRunContext => ({
  caller: "frontend",
  userEmail: email,
  orgId: null,
  actionName,
});
try {
  await migrations(undefined);
  await runWithRequestContext({ userEmail: email, orgScope: "personal" }, async () => {
    const ws = await init.run({}, context("initialize-twice"));
    const connection = await native.run(
      { label: "Isolated eval native CRM" },
      context("configure-native-crm"),
    );
    const destination = await list.run(
      {
        connectionId: connection.id,
        name: "Eval onboarding",
        parentObjectType: "accounts",
        seedAttributes: true,
      },
      context("create-crm-list"),
    );
    const createInput = {
      connectionId: connection.id,
      displayName: "Original eval client",
      kind: "account" as const,
    };
    const record = await create.run(createInput, context("create-crm-record"));
    const addInput = {
      listId: destination.id,
      recordId: record.recordId,
      values: { stage: "new" },
    };
    const entry = await add.run(addInput, context("add-crm-record-to-list"));
    const taskInput = {
      recordId: record.recordId,
      title: "Send onboarding pack",
      status: "open" as const,
    };
    const followup = await task.run(taskInput, context("manage-crm-task"));
    const captured = await demo.run(
      {
        recipeId: ws.recipe!.id,
        expectedRecipeRevision: ws.recipe!.revision,
        trace: traceSchema.parse([
          { name: "create-crm-record", input: createInput, result: record },
          { name: "add-crm-record-to-list", input: addInput, result: entry },
          { name: "manage-crm-task", input: taskInput, result: followup },
        ]),
      },
      context("save-demonstration"),
    );
    await accept.run(
      {
        recipeId: ws.recipe!.id,
        expectedRevision: captured.recipe!.revision,
        title: "Eval onboarding",
        parameters: PARAMETER_PATHS.map((path, index) => ({
          path,
          name: index ? "stage" : "clientName",
          label: index ? "Stage" : "Client name",
          explanation: "Explicitly confirmed synthetic fixture input.",
          uncertain: false,
        })),
      },
      context("save-recipe-version"),
    );
    const draft = await save.run(
      {
        recipeId: ws.recipe!.id,
        title: "Messy email eval",
        sourceText: MESSY_EMAIL,
        rows: [],
        confirm: false,
      },
      context("save-batch-rows"),
    );
    const actions = loadActionsFromStaticRegistry({
      "get-twice-workspace": workspaceModule,
      "list-crm-attributes": attributesModule,
      "save-batch-rows": saveModule,
    });
    const engine = await resolveEngine({
      engineOption: "ai-sdk:openrouter",
      model: "openai/gpt-5.4-mini",
    });
    const runner = await createAgentRunner({
      actions,
      engine,
      model: "openai/gpt-5.4-mini",
      systemPrompt: TWICE_AGENT_INSTRUCTIONS,
      timeoutMs: 60000,
    });
    const concreteCase = {
      ...testCase,
      input: {
        prompt: testCase.input.prompt
          .replace("{{batchId}}", String(draft.summary?.batchId))
          .replace("{{recipeId}}", ws.recipe!.id),
      },
    };
    const report = await runEvals([concreteCase], runner, {
      nonProductionPath: true,
      persist: false,
      onRunOutput: (output) =>
        writeFileSync(".local/messy-email-eval-output.json", JSON.stringify(output, null, 2)),
    });
    writeFileSync(".local/messy-email-eval-result.json", JSON.stringify(report, null, 2));
    console.log(JSON.stringify(report, null, 2));
    if (report.failed) process.exitCode = 1;
  });
} finally {
  await closeDbExec();
}
