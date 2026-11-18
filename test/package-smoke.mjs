// Exercise the shipped tarball and both executable names from a fresh consumer.
import assert from "node:assert/strict";
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { execFileSync, spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const repo = fileURLToPath(new URL("../", import.meta.url));
const { version } = JSON.parse(fs.readFileSync(path.join(repo, "package.json"), "utf8"));
const work = fs.mkdtempSync(path.join(os.tmpdir(), "jsmod-package-"));
const run = (command, args, cwd = work) => execFileSync(command, args, { cwd, encoding: "utf8", timeout: 120000, stdio: "pipe" });
try {
  const [pack] = JSON.parse(run("npm", ["pack", "--json", "--pack-destination", work], repo));
  for (const file of ["bin/cli.mjs", "src/extract.mjs", "examples/server.js", "examples/package.json", "jsmod.config.example.json", "LICENSE"]) {
    assert.ok(pack.files.some((entry) => entry.path === file), `Missing from tarball: ${file}`);
  }
  fs.writeFileSync(path.join(work, "package.json"), '{"private":true,"type":"commonjs"}');
  run("npm", ["install", "--ignore-scripts", "--no-audit", "--no-fund", path.join(work, pack.filename)]);
  const cli = path.join(work, "node_modules/.bin/js-modularization-gold-standard");
  const alias = path.join(work, "node_modules/.bin/jsmod");
  assert.match(run(cli, []), /jsmod survey/);
  assert.match(run(alias, ["--help"]), /jsmod extract/);
  assert.equal(run(cli, ["--version"]).trim(), version);
  assert.equal(spawnSync(cli, ["not-a-command"], { cwd: work }).status, 1);
  const installed = path.join(work, "node_modules/js-modularization-gold-standard");
  fs.cpSync(path.join(installed, "examples"), path.join(work, "examples"), { recursive: true });
  fs.copyFileSync(path.join(installed, "jsmod.config.example.json"), path.join(work, "jsmod.config.json"));
  assert.match(run(cli, ["survey", "examples/server.js"]), /billing\/price/);
  assert.match(run(cli, ["analyze", "examples/server.js", "--range", "26:33"]), /sessionCache/);
  const before = fs.readFileSync(path.join(work, "examples/server.js"), "utf8");
  assert.match(run(cli, ["extract", "--dry"]), /dry run/);
  assert.equal(fs.readFileSync(path.join(work, "examples/server.js"), "utf8"), before);
  run(cli, ["extract"]);
  assert.match(run(cli, ["verify"]), /Automatable gates: PASS/);
  assert.match(run(alias, ["audit", "examples/modules/billing.js"]), /clean/);
  console.log("package smoke: PASS — packed install, both binaries, default config, all five commands");
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
