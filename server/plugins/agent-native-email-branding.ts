import { defineAppConfig } from "@agent-native/core/server";

export default defineAppConfig({
  agent: { engine: "ai-sdk:openrouter", model: "openai/gpt-5.4-mini" },
  app: {
    // This name appears in transactional emails. Change it to your product name.
    name: "Twice",
    // The source template keeps a renamed app from inheriting first-party email branding.
    sourceTemplate: "crm",
    // Keep the template's authenticated entry explicit after renaming the app.
    homePath: "/batches",
    // Optional: use your own absolute HTTPS logo URL in transactional emails.
    // logoUrl: "https://example.com/logo.png",
  },
});
