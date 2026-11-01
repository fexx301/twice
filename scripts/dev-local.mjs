import { spawn } from "node:child_process";
import { existsSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join, resolve } from "node:path";

const require = createRequire(import.meta.url);
const core = dirname(require.resolve("@agent-native/core/action"));
const cli = join(core, "../bin/agent-native.js");
const keyEnv = resolve(".env");
const hasEnv = existsSync(keyEnv);
const unavailable = process.argv.includes("--model-unavailable");
const environment = { ...process.env };
if (unavailable) {
  for (const name of [
    "OPENROUTER_API_KEY",
    "OPENAI_API_KEY",
    "ANTHROPIC_API_KEY",
    "ANTHROPIC_AUTH_TOKEN",
    "GEMINI_API_KEY",
    "GOOGLE_GENERATIVE_AI_API_KEY",
    "BUILDER_PRIVATE_KEY",
    "BUILDER_API_KEY",
  ])
    environment[name] = "";
  console.log(
    "[twice] Model-unavailable verification: model credentials explicitly blank; project .env loads database/auth configuration only.",
  );
}
const child = spawn(
  process.execPath,
  [
    ...(hasEnv ? [`--env-file=${keyEnv}`] : []),
    cli,
    "dev",
    "--host",
    "127.0.0.1",
    "--port",
    "8851",
  ],
  { stdio: "inherit", env: environment },
);
for (const signal of ["SIGINT", "SIGTERM"]) process.on(signal, () => child.kill(signal));
child.on("exit", (code) => process.exit(code ?? 0));
