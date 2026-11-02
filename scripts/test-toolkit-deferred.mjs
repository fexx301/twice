// Run the pinned package's real component regression in an isolated copy.
// --baseline removes only Twice's notification in that copy to prove failure.
import fs from "node:fs/promises";
import path from "node:path";
import os from "node:os";
import { fileURLToPath } from "node:url";
import { spawn } from "node:child_process";

const root = path.resolve(import.meta.dirname, "..");
const installed = await fs.realpath(path.join(root, "node_modules/@agent-native/toolkit"));
const scratch = await fs.realpath(await fs.mkdtemp(path.join(os.tmpdir(), "twice-toolkit-regression-")));
let exitCode = 1;
try {
  await fs.cp(installed, scratch, {
    recursive: true,
    filter: (entry) => path.basename(entry) !== "node_modules",
  });
  await fs.symlink(path.dirname(path.dirname(installed)), path.join(scratch, "node_modules"));
  const baseline = process.argv.includes("--baseline");
  for (const relative of [
    "src/app/chat/AgentKitAssistantChat.tsx",
    "dist/app/chat/AgentKitAssistantChat.js",
  ]) {
    const file = path.join(scratch, relative);
    const contents = await fs.readFile(file, "utf8");
    const notification = /(setDeferredSubmissionsLoadedThread\(threadId\);\n)\s*setPendingProviderSubmissionVersion\(\(version\) => version \+ 1\);\n/g;
    if ([...contents.matchAll(notification)].length !== 1) {
      throw new Error(`Expected one reviewed notification in ${relative}`);
    }
    if (baseline) await fs.writeFile(file, contents.replace(notification, "$1"));
  }
  const testFile = path.join(scratch, "src/app/chat/AgentKitAssistantChat.spec.tsx");
  const config = path.join(scratch, "regression.vitest.config.ts");
  await fs.writeFile(config, `import { defineConfig } from ${JSON.stringify(fileURLToPath(import.meta.resolve("vitest/config")))};
export default defineConfig({root:${JSON.stringify(scratch)},test:{include:["src/app/chat/AgentKitAssistantChat.spec.tsx"],environment:"happy-dom",maxWorkers:1,testTimeout:15000}});
`);
  const pattern = "wakes the deferred drain|removes an expired deferred submission|does not report a deferred retry|keeps a failed deferred send visible|releases a deferred-send claim|preserves another tab.s live claim";
  exitCode = await new Promise((resolve, reject) => {
    const child = spawn("pnpm", ["exec", "vitest", "--run", "--config", config, "-t", pattern], {
      cwd: root,
      stdio: "inherit",
    });
    child.on("error", reject);
    child.on("close", (code) => resolve(code ?? 1));
  });
} finally {
  // Only this invocation's freshly created test copy is removed.
  await fs.rm(scratch, { recursive: true, force: true });
}
process.exitCode = exitCode;
