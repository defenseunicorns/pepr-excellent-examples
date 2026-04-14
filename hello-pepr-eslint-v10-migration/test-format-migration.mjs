#!/usr/bin/env node
// One-time pre-release validation for the eslint v9 -> v10 migration in pepr.
// Run this locally before cutting the release to confirm that the old (v9-era, FlatCompat)
// eslint.config.mjs — which existing user modules will still have after upgrading pepr —
// continues to pass `pepr format` under the new pepr version that ships eslint v10.
// Once the release is validated and shipped, this branch can be deleted.
//
// Requires PEPR_CANDIDATE to be set. To test, from hello-pepr-eslint-v10-migration directory, run:
//   local:  PEPR_CANDIDATE=file:../../pepr node test-format-migration.mjs
//           (requires `npm run build` in the pepr repo first)
//   tagged: PEPR_CANDIDATE=1.2.0 node test-format-migration.mjs

import { execSync } from "node:child_process";
import { existsSync, mkdtempSync, rmSync } from "node:fs";
import os from "node:os";
import path from "node:path";
import { fileURLToPath } from "node:url";

const moduleDir = path.dirname(fileURLToPath(import.meta.url));

function run(cmd) {
  console.log(`\n$ ${cmd}`);
  execSync(cmd, { cwd: moduleDir, stdio: "inherit" });
}

function peprCli(installRoot) {
  return path.join(installRoot, "node_modules", "pepr", "dist", "cli.js");
}

const candidate = process.env.PEPR_CANDIDATE;
if (!candidate) {
  console.error(`
PEPR_CANDIDATE is required.
  local:  PEPR_CANDIDATE=file:../../pepr node test-format-migration.mjs
  tagged: PEPR_CANDIDATE=1.2.0 node test-format-migration.mjs
`);
  process.exit(1);
}

let tmpDir = null;
let cli;

if (candidate.startsWith("file:")) {
  const localPath = path.resolve(moduleDir, candidate.slice("file:".length));
  cli = path.join(localPath, "dist", "cli.js");
  if (!existsSync(cli)) {
    console.error(`candidate CLI not found at ${cli} — run npm run build in the pepr repo first`);
    process.exit(1);
  }
} else {
  tmpDir = mkdtempSync(path.join(os.tmpdir(), "pepr-migration-candidate-"));
  try {
    execSync(`npm install --prefix "${tmpDir}" pepr@${candidate}`, { stdio: "inherit" });
  } catch (e) {
    rmSync(tmpDir, { recursive: true, force: true });
    console.error(`Failed to install pepr@${candidate}: ${e.message}`);
    process.exit(1);
  }
  cli = peprCli(tmpDir);
}

try {
  run(`node "${cli}" format`);
  console.log("\n✓ pepr format passed with eslint v10 candidate");
} finally {
  if (tmpDir) rmSync(tmpDir, { recursive: true, force: true });
}
