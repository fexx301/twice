// @vitest-environment happy-dom
import { createElement } from "react";
import { act } from "react";
import { createRoot, type Root } from "react-dom/client";
import { MemoryRouter, Route, Routes } from "react-router";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";

const state = vi.hoisted(() => ({ ws: undefined as any, callAction: vi.fn() }));

vi.mock("@agent-native/core/client/hooks", () => ({
  useActionQuery: (name: string) =>
    name === "get-twice-workspace"
      ? { data: state.ws, isError: false, refetch: vi.fn(async () => {}) }
      : { data: { attributes: [{ apiSlug: "stage", options: [{ value: "new" }, { value: "in-progress" }] }] } },
  callAction: state.callAction,
  actionErrorMessage: (e: unknown) => (e instanceof Error ? e.message : undefined),
}));
vi.mock("@agent-native/core/client/agent-chat", () => ({
  AGENT_CHAT_SUBMIT_TARGET_EVENT: "submit-target",
  sendToAgentChatAndConfirm: vi.fn(),
  useAgentChatGenerating: () => [false],
}));
vi.mock("@agent-native/toolkit/app/chat", () => ({
  AgentToggleButton: () => null,
  askUserQuestion: vi.fn(),
}));
vi.mock("./StageQuestion", () => ({ StageQuestion: () => null }));

const { TwiceWorkbench } = await import("./TwiceWorkbench");

const recipe = {
  id: "recipe-1",
  title: "Client onboarding",
  revision: 4,
  parameters: [],
  proposalSummary: "",
  activeVersionId: null,
};
const createStep = {
  name: "create-crm-record",
  input: { kind: "account", displayName: "Aster", connectionId: "conn-1" },
  result: { recordId: "rec-1", connectionId: "conn-1", displayName: "Aster", provider: "native", kind: "account" },
};
function workspace(overrides: Record<string, unknown> = {}) {
  return {
    recipes: [recipe],
    batches: [],
    recipe,
    batch: null,
    rows: [],
    demonstration: { id: "demo-1", revision: 1, trace: [createStep] },
    versions: [],
    runs: [],
    ...overrides,
  };
}

let root: Root;
let container: HTMLElement;
async function render(mode: "recipe" | "batch", path: string, pattern: string) {
  container = document.createElement("div");
  document.body.append(container);
  root = createRoot(container);
  await act(async () =>
    root.render(
      createElement(
        MemoryRouter,
        { initialEntries: [path] },
        createElement(Routes, null, createElement(Route, { path: pattern, element: createElement(TwiceWorkbench, { mode }) })),
      ),
    ),
  );
}
const button = (text: string) =>
  [...container.querySelectorAll("button")].find((b) => b.textContent?.includes(text));

beforeEach(() => state.callAction.mockReset().mockResolvedValue({}));
afterEach(async () => {
  await act(async () => root.unmount());
  container.remove();
});

describe("TwiceWorkbench", () => {
  it("renders a malformed stored stage instead of blanking the batch page", async () => {
    const batch = { id: "batch-1", title: "Clients", revision: 1, sourceText: "notes", isSample: 0, preparationActor: {} };
    state.ws = workspace({
      batch,
      batches: [batch],
      rows: [{ id: "row-1", clientName: "Odd Stage Co", stage: "new-", uncertain: false, uncertainty: "", sourceText: "notes", state: "Blocked", startedAt: null, error: null }],
    });
    await render("batch", "/batches/batch-1", "/batches/:batchId");
    expect(container.textContent).toContain("Odd Stage Co");
    expect(container.textContent).toContain("New");
  });

  it("starts a fresh demonstration without sending the old demonstration ID", async () => {
    state.ws = workspace();
    await render("recipe", "/recipes/recipe-1", "/recipes/:recipeId");
    await act(async () => button("Start a new demonstration")!.click());
    expect(state.callAction).toHaveBeenCalledWith("save-demonstration", {
      recipeId: "recipe-1",
      expectedRecipeRevision: 4,
      trace: [],
    });
  });
});
