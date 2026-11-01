import { createScorer, defineEval, type AgentRunOutput } from "@agent-native/core/eval";
import { saveBatchRowsSchema } from "../shared/twice-actions.js";

export const MESSY_EMAIL = `Fictional eval email. Hi! Could you onboard Cedar Studio as New, please? Birch Workshop's kickoff has started — In Progress. Northstar Design is joining but I still don't know its stage. Delta Labs: New. Moss Collective: In Progress. Thanks!`;
export default defineEval({
  name: "messy email saves five exact draft clients and flags the ambiguous stage",
  input: {
    prompt:
      "Read get-twice-workspace with batchId={{batchId}} and recipeId={{recipeId}}, then prepare that batch from its sourceText using the current accepted recipe and managed list stages. Save draft rows through save-batch-rows with confirm:false. Do not execute onboarding.",
  },
  actionAllowlist: ["get-twice-workspace", "list-crm-attributes", "save-batch-rows"],
  threshold: 1,
  scorers: [
    createScorer({
      name: "completed typed save contains exact rows; uncertainty stays blocked",
      generateScore(run: AgentRunOutput) {
        const saved = run.toolCallDetails
          ?.filter((t) => t.name === "save-batch-rows" && t.completed && !t.isError)
          .slice(-1)[0];
        const parsed = saveBatchRowsSchema.safeParse(saved?.input);
        if (!run.ok || !parsed.success || parsed.data.confirm || parsed.data.rows.length !== 5)
          return 0;
        const expected = new Map<string, string | null>([
          ["Cedar Studio", "new"],
          ["Birch Workshop", "in-progress"],
          ["Northstar Design", null],
          ["Delta Labs", "new"],
          ["Moss Collective", "in-progress"],
        ]);
        const rows = parsed.data.rows;
        if (new Set(rows.map((r) => r.clientName)).size !== 5) return 0;
        return rows.every(
          (row) =>
            expected.has(row.clientName) &&
            row.stage === expected.get(row.clientName) &&
            row.uncertain === (row.clientName === "Northstar Design") &&
            row.sourceText.length > 0 &&
            (row.clientName !== "Northstar Design" || row.uncertainty.length > 0),
        )
          ? 1
          : 0;
      },
      generateReason: ({ score }) =>
        score === 1
          ? "A real model turn completed the typed draft save with five expected rows, source excerpts and the missing stage flagged."
          : "The completed save did not satisfy the exact row/uncertainty contract.",
    }),
  ],
});
