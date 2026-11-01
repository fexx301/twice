import { createCoreRoutesPlugin } from "@agent-native/core/server";

const VIEW_PATHS: Record<string, string> = {
  recipes: "/recipes",
  recipe: "/recipes",
  batches: "/batches",
  batch: "/batches",
  overview: "/home",
  records: "/records",
  record: "/records",
  tasks: "/tasks",
  proposals: "/proposals",
  settings: "/settings",
};

export default createCoreRoutesPlugin({
  googleOAuthManagedConnection: "not_applicable",
  resolveOpenPath: ({ view, params }) => {
    if (params.batchId) return `/batches/${encodeURIComponent(params.batchId)}`;
    if (params.recipeId) return `/recipes/${encodeURIComponent(params.recipeId)}`;
    if (params.recordId) return `/records/${params.recordId}`;
    return view ? (VIEW_PATHS[view] ?? null) : null;
  },
});
