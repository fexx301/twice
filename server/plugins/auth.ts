import { createToolkitAuthPlugin } from "@agent-native/toolkit/app/auth/server";

export default createToolkitAuthPlugin({
  workspaceAppPublicPaths: ["/"],
  marketing: {
    appName: "Twice",
    tagline: "Show it once; it does it twice.",
    features: [
      "Teach one native CRM onboarding demonstration",
      "Prepare client notes with the agent and correct the table",
      "Run approved inputs through code with fresh, linked IDs",
    ],
  },
});
