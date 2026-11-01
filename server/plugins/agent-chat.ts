import { TWICE_AGENT_INSTRUCTIONS } from "../twice/agent-instructions.js";
import { getOrgContext } from "@agent-native/core/org";
import {
  createAgentChatPlugin,
  loadActionsFromStaticRegistry,
  getRequestOrgId,
  getRequestUserEmail,
} from "@agent-native/core/server";

import actionsRegistry from "../../.generated/actions-registry.js";
import { CRM_CONNECTOR_CATALOG } from "../lib/crm-connector-catalog.js";

const INITIAL_TOOL_NAMES = [
  "get-twice-workspace",
  "initialize-twice",
  "save-demonstration",
  "save-parameter-proposal",
  "save-recipe-version",
  "save-batch-rows",
  "preview-batch",
  "run-batch",
  "navigate",
  "view-screen",
  "list-crm-attributes",
];

const CRM_DASHBOARD_EDIT_TOOLS = new Set(["restore-crm-dashboard-revision", "save-crm-dashboard"]);

function eventRecord(entry: unknown): Record<string, unknown> | undefined {
  if (!entry || typeof entry !== "object") return undefined;
  const event = (entry as { event?: unknown }).event;
  return event && typeof event === "object" ? (event as Record<string, unknown>) : undefined;
}

function inputForCompletedTool(
  events: readonly unknown[],
  index: number,
  completed: Record<string, unknown>,
): Record<string, unknown> | undefined {
  if (completed.input && typeof completed.input === "object") {
    return completed.input as Record<string, unknown>;
  }
  const id = typeof completed.id === "string" ? completed.id : undefined;
  for (let cursor = index - 1; cursor >= 0; cursor -= 1) {
    const candidate = eventRecord(events[cursor]);
    if (
      candidate?.type !== "tool_start" ||
      candidate.tool !== completed.tool ||
      (id && candidate.id !== id)
    ) {
      continue;
    }
    return candidate.input && typeof candidate.input === "object"
      ? (candidate.input as Record<string, unknown>)
      : undefined;
  }
  return undefined;
}

function hasCrmDashboardEdit(run: { events: readonly unknown[] }, dashboardId: string): boolean {
  return run.events.some((entry, index) => {
    const record = eventRecord(entry);
    const input = record ? inputForCompletedTool(run.events, index, record) : undefined;
    return (
      record?.type === "tool_done" &&
      record.completedSideEffect === true &&
      typeof record.tool === "string" &&
      CRM_DASHBOARD_EDIT_TOOLS.has(record.tool) &&
      input?.id === dashboardId
    );
  });
}

async function autosaveCrmDashboardAfterAgentTurn(
  scope: { type: string; id: string },
  run: {
    events: readonly unknown[];
    threadId?: string;
    runId?: string;
    turnId?: string;
  },
): Promise<void> {
  if (scope.type !== "crm-dashboard" || !hasCrmDashboardEdit(run, scope.id)) return;
  const userEmail = getRequestUserEmail();
  if (!userEmail) return;
  const { crmDashboardStore } = await import("../db/index.js");
  await crmDashboardStore.createRevisionSnapshot(scope.id, {
    userEmail,
    orgId: getRequestOrgId() || undefined,
  });
}

export default createAgentChatPlugin({
  appId: "twice",
  onAgentTurnComplete: autosaveCrmDashboardAfterAgentTurn,
  actions: loadActionsFromStaticRegistry(actionsRegistry),
  initialToolNames: INITIAL_TOOL_NAMES,
  mcp: { connectorCatalog: [...CRM_CONNECTOR_CATALOG], appApprovalPage: true },
  resolveOrgId: async (event) => (await getOrgContext(event)).orgId,
  codeExecution: { production: "off" },
  frameworkTools: {
    preset: "minimal",
    database: "off",
    history: true,
    docs: true,
    resources: true,
  },
  systemPrompt: TWICE_AGENT_INSTRUCTIONS,
});
