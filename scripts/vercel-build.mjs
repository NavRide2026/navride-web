import { spawnSync } from "node:child_process";
import path from "node:path";
import { fileURLToPath } from "node:url";

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));

function run(file, args) {
  const result = spawnSync(process.execPath, [file, ...args], {
    cwd: root,
    stdio: "inherit",
    env: process.env,
    windowsHide: true,
  });
  if (result.error) throw result.error;
  if (result.status !== 0) process.exit(result.status ?? 1);
}

run(path.join(root, "scripts", "generate-legal-html.mjs"), []);
run(path.join(root, "node_modules", "next", "dist", "bin", "next"), ["build"]);
