import { fileURLToPath } from "node:url";
import baseConfig from "@agent-native/core/vitest-config";
import { defineConfig, mergeConfig } from "vitest/config";

export default mergeConfig(
  baseConfig,
  defineConfig({
    // Mirrors the tsconfig "@/*" path so app components can be rendered in tests.
    resolve: { alias: { "@": fileURLToPath(new URL("./app", import.meta.url)) } },
    test: { include: ["**/*.test.ts"], environment: "node" },
  }),
);
