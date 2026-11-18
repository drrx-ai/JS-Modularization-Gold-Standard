# JS Modularization Gold Standard

**5,121 → 1,402 lines in a production Express `server.js`, with zero behavioral diffs reported across incremental PRs.**

The six-gates method behind that result is now a CommonJS modularization CLI: `jsmod`. Move one domain, preserve shared state, check the result, repeat.

```js
// Before: inline in server.js (from the bundled demo)
app.post("/billing/reset", (req, res) => {
  sessionCache = {};
  res.json({ reset: true });
});

// After: server.js wires the original live binding into a module
require("./modules/billing").register(app, {
  hashId, PRICE_TABLE,
  getSessionCache: () => sessionCache,
  setSessionCache: (v) => { sessionCache = v; }
});
// modules/billing.js keeps the handler; assignment becomes setSessionCache({}).
```

**Try the CLI:** `npx js-modularization-gold-standard --help` · **Reproduce the public demo:** `npm ci && npm test` in a clone.

The production numbers describe the methodology's reported origin at [DrRx](https://github.com/drrx-ai). This repository is a clean-room implementation with a synthetic Express fixture, not the production source or its probe logs. Its public test extracts two modules and compares **nine HTTP requests**, including a reset-then-read sequence across a shared cache. Matching probes establish parity for those requests; they are not a proof for every possible input.

## Install

```bash
npx js-modularization-gold-standard --help
# Or install the short command:
npm install -g js-modularization-gold-standard
jsmod --help
```

Requires Node.js 20 or later. Built on [ts-morph](https://ts-morph.com). Both `js-modularization-gold-standard` and `jsmod` run the same CLI.

## The six gates

Keep code movement and cleanup in separate commits. An extraction lands after these checks:

1. **Syntax:** run `node --check` on the parent and extracted modules.
2. **Route-count parity:** compare registration counts with `expectedRoutes` in the config.
3. **Module boundary:** check that each module exports `register(app, kernel)`; exercise registration in your application tests.
4. **Residual free variables:** audit the AST for references the module was not given, including handler bodies that HTTP probes may not reach.
5. **Live probe diff:** boot the old and new versions, replay the same request sequence, and compare status and body. Include authenticated paths and shared-state sequences.
6. **Incremental PRs:** move one module per PR so the diff and its evidence remain reviewable.

`jsmod verify` provides static checks for gates 1–4. Its route count is a textual heuristic, and gate 3 checks the export shape rather than executing the module. Gate 2 only enforces parity when `expectedRoutes` is set. The [self-test](https://github.com/drrx-ai/JS-Modularization-Gold-Standard/blob/main/test/selftest.mjs) demonstrates gate 5 on the bundled fixture. Apply that pattern to your own application; gate 6 is review process.

## Quickstart with the bundled demo

```bash
git clone https://github.com/drrx-ai/JS-Modularization-Gold-Standard.git
cd JS-Modularization-Gold-Standard
npm ci
npm test

# Survey routes and shared symbols, then inspect one cut.
node bin/cli.mjs survey examples/server.js
node bin/cli.mjs analyze examples/server.js --range 26:33

# Preview first. These commands use the repository's local CLI.
cp jsmod.config.example.json jsmod.config.json
node bin/cli.mjs extract --dry
node bin/cli.mjs extract
node bin/cli.mjs verify
node bin/cli.mjs audit examples/modules/billing.js
```

`extract` edits the source file and writes a sibling `modules/` directory. Use a clean branch and inspect the dry run before applying it. Line ranges refer to the original file for that extraction; recalculate them before the next pass.

For your own project, use `jsmod` after a global install or replace `node bin/cli.mjs` with `npx js-modularization-gold-standard`.

## How shared state survives the move

Passing a mutable singleton as a value can leave extracted modules holding an old object after the parent reassigns it. The parent therefore supplies getter/setter closures over the original binding:

```js
getSessionCache: () => sessionCache,
setSessionCache: (v) => { sessionCache = v; }
```

The demo's billing module resets the cache through `setSessionCache({})`; the session module reads through `getSessionCache()`. Both still access the same live binding. Helpers and immutable bindings are passed directly through the `kernel` object.

The extractor preserves the selected statement text apart from indentation and boundary wiring. That includes rewriting references to mutable bindings; it is not literally a byte-for-byte copy of the whole file.

## Config

```json
{
  "source": "src/server.js",
  "app": "app",
  "expectedRoutes": 137,
  "modules": [
    { "name": "billing", "ranges": [[420, 511]] }
  ]
}
```

The default file is `jsmod.config.json`; pass `--config path/to/config.json` to choose another. Source paths are relative to the working directory. Ranges use inclusive line numbers and must contain whole top-level statements. For multiple ranges in one module, the first becomes the registration call site and the others are removed. Preserve registration and initialization order when choosing cuts.

See [jsmod.config.example.json](https://github.com/drrx-ai/JS-Modularization-Gold-Standard/blob/main/jsmod.config.example.json) for the runnable demo config. Its six registrations are five route handlers plus one `app.use` middleware registration; the self-test makes nine requests across those routes.

## Scope and limitations

- Targets CommonJS files using `app.method(...)` registration. It does not convert an ESM application or resolve TypeScript types.
- Review every generated diff and investigate unresolved symbols. Static checks and a finite probe suite do not establish universal behavioral equivalence.
- Complex mutable expressions, shadowed identifiers, relative imports, and dependencies between extracted regions need particular review. Keep assignments simple; do not rely on assignment or increment return values across the generated setter boundary.
- Preserve your production startup, middleware order, authenticated tests, and side-effect checks. The CLI does not generate application-specific live probes.

A small reproducible fixture for a wiring case is a useful contribution.

## Development and releases

```bash
npm ci
npm test              # extract, verify, compare nine HTTP probes
npm run test:package  # install the tarball; exercise both binaries and every command
```

CI runs both checks. The [release guide](https://github.com/drrx-ai/JS-Modularization-Gold-Standard/blob/main/docs/releasing.md) describes npm publication and the fresh-cache `npx` check.

## Credits

Built by [Vineet Parikh](https://github.com/vineetparikh-pharmd), with contributions from [lotusmuds](https://github.com/lotusmuds) and [chrisboyd08043](https://github.com/chrisboyd08043).

Developed at [DrRx Inc.](https://github.com/drrx-ai) and released under the [MIT license](https://github.com/drrx-ai/JS-Modularization-Gold-Standard/blob/main/LICENSE).
