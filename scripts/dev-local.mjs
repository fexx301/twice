import { spawn } from "node:child_process";
import { existsSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const core = dirname(require.resolve("@agent-native/core/action"));
const cli = join(core, "../bin/agent-native.js");
const marker = resolve(".local/provider-env.path");
const keyEnv = existsSync(marker) ? readFileSync(marker, "utf8").trim() : "";
if (keyEnv && !existsSync(keyEnv)) {
  console.error("The external provider env file is missing. Update .local/provider-env.path; no credential is stored in this repository.");
  process.exit(1);
}
const child = spawn(process.execPath, [
  ...(keyEnv ? [`--env-file=${keyEnv}`] : []),
  cli, "dev", "--host", "127.0.0.1", "--port", "8851",
], { stdio: "inherit" });
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", code => process.exit(code ?? 0));
