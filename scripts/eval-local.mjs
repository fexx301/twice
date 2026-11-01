import { spawn } from "node:child_process";
import { mkdtempSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
// The marker contains a path only. Node loads the external owner-only key file.
const keyEnv = readFileSync(".local/provider-env.path", "utf8").trim();
const data = mkdtempSync(resolve(".local/eval-"));
const child = spawn(
  process.execPath,
  [`--env-file=${keyEnv}`, "--import", "tsx", "scripts/eval-local.ts"],
  { stdio: "inherit", env: { ...process.env, DATABASE_URL: `pglite:${data}/data` } },
);
child.on("exit", (code) => process.exit(code ?? 1));
