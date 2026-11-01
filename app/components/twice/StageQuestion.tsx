import { GuidedQuestionFlow, useGuidedQuestionFlow } from "@agent-native/toolkit/app/chat";

/** Native question controller + presentation, bound to this one UI request. */
export function StageQuestion({ stateKey }: { stateKey: string }) {
  const flow = useGuidedQuestionFlow({
    stateKey,
    queryKey: ["twice-stage-question", stateKey],
    refetchInterval: 500,
  });
  if (!flow.questions) return null;
  return (
    <section aria-label="Stage clarification" className="rounded-xl border border-primary/40 p-4">
      <GuidedQuestionFlow
        questions={flow.questions}
        title={flow.title}
        description={flow.description}
        skipLabel={flow.skipLabel}
        submitLabel={flow.submitLabel}
        isSubmitting={flow.isSubmitting}
        isSubmissionBlocked={flow.isSubmissionBlocked}
        showProviderStatusGate={false}
        onSubmit={flow.handleSubmit}
        onSkip={flow.handleSkip}
      />
    </section>
  );
}
