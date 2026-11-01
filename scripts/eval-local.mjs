import { spawn } from "node:child_process";
import { mkdtempSync } from "node:fs";
import { resolve } from "node:path";
// Node loads the ignored owner-only project .env; app code never reads keys.
const keyEnv = resolve(".env");
const data = mkdtempSync(resolve(".local/eval-"));
const child = spawn(
  process.execPath,
  [`--env-file=${keyEnv}`, "--import", "tsx", "scripts/eval-local.ts"],
  { stdio: "inherit", env: { ...process.env, DATABASE_URL: `pglite:${data}/data` } },
);
child.on("exit", (code) => process.exit(code ?? 1));
