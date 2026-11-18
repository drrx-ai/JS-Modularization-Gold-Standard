// test/selftest.mjs — jsmod proves itself.
//
// Copies the bundled example monolith, extracts two modules, runs the gates,
// then boots the original vs. the patched server and diffs every route. CI
// runs this on every push: if behavior ever changes, the build goes red.

import { spawn, execFileSync } from "node:child_process";
import fs from "node:fs";
import path from "node:path";
import { once } from "node:events";
import assert from "node:assert/strict";
import { fileURLToPath } from "node:url";

const here = path.dirname(fileURLToPath(import.meta.url));
const repo = path.resolve(here, "..");
const work = fs.mkdtempSync(path.join(repo, ".tmp-selftest-"));
fs.writeFileSync(path.join(work, "package.json"), '{"type":"commonjs"}');

function sh(cmd, args, cwd = work) {
  return execFileSync(cmd, args, { cwd, stdio: "pipe" }).toString();
}

fs.copyFileSync(path.join(repo, "examples/server.js"), path.join(work, "server.js"));
fs.copyFileSync(path.join(repo, "examples/server.js"), path.join(work, "orig.js"));
fs.writeFileSync(path.join(work, "jsmod.config.json"), JSON.stringify({
  source: path.join(work, "server.js"),
  app: "app",
  expectedRoutes: 6,
  modules: [
    { name: "billing", ranges: [[26, 33]] },
    { name: "session", ranges: [[36, 44]] },
  ],
}, null, 2));

try {
console.log("· extract…");
console.log(sh("node", [path.join(repo, "bin/cli.mjs"), "extract", "--config", path.join(work, "jsmod.config.json")]));

console.log("· verify (gates)…");
console.log(sh("node", [path.join(repo, "bin/cli.mjs"), "verify", "--config", path.join(work, "jsmod.config.json")]));

console.log("· probe-diff (behavioral)…");
const SEQ = [
  ["GET", "/health"], ["GET", "/billing/price/pro"],
  ["GET", "/session/abc"], ["GET", "/session/abc"], ["GET", "/health"],
  ["POST", "/billing/reset"], ["GET", "/session/abc"],
  ["DELETE", "/session/abc"], ["GET", "/billing/price/nope"],
];
function boot(file) {
  return new Promise((resolve, reject) => {
    const p = spawn(process.execPath, [file], { cwd: work, env: { ...process.env, PORT: "0" } });
    let output = "", errors = "";
    const timer = setTimeout(() => { p.kill(); reject(new Error(`Server boot timed out: ${errors}`)); }, 10000);
    p.stderr.on("data", (d) => { errors += d; });
    p.once("error", (err) => { clearTimeout(timer); reject(err); });
    p.once("exit", (code) => { clearTimeout(timer); reject(new Error(`Server exited (${code}): ${errors}`)); });
    p.stdout.on("data", (d) => {
      output += d;
      const match = output.match(/up on (\d+)/);
      if (match) { clearTimeout(timer); resolve({ p, port: Number(match[1]) }); }
    });
  });
}
async function probe(file) {
  const { p, port } = await boot(file);
  const out = [];
  try {
  for (const [m, u] of SEQ) {
    const r = await fetch(`http://127.0.0.1:${port}` + u, { method: m, signal: AbortSignal.timeout(5000) });
    out.push(`${m} ${u} ${r.status} ${await r.text()}`);
  }
  return out;
  } finally {
    const exited = once(p, "exit");
    p.kill();
    await exited;
  }
}
const before = await probe("orig.js");
const after = await probe("server.js");
let diffs = 0;
for (let i = 0; i < before.length; i++) if (before[i] !== after[i]) {
  diffs++; console.log(`  ✗ DIFF\n    orig: ${before[i]}\n    new:  ${after[i]}`);
}
assert.equal(diffs, 0, `${diffs} behavioral differences`);
console.log("\nselftest: PASS — 9/9 HTTP probes identical ✓");
} finally {
  fs.rmSync(work, { recursive: true, force: true });
}
