---
title: How we split a 5,000-line Express server.js with zero behavioral diffs
published: false
tags: node, javascript, refactoring, opensource
---

Our Express `server.js` went from **5,121 lines to 1,402** across incremental PRs. The result we cared about was zero behavioral differences in the checks we ran after each move.

The useful part of that story is the method: six gates that make a large file smaller while keeping each change narrow enough to review. We've released a clean-room implementation of that approach as [JS Modularization Gold Standard](https://github.com/drrx-ai/JS-Modularization-Gold-Standard), a CommonJS CLI built at DrRx.

The production numbers describe the original project. The public repository contains a synthetic Express example and a reproducible probe test; it does not include the production source or its probe logs. “Zero behavioral diffs” means the observed checks matched, not a mathematical proof over every possible input.

## Move one domain at a time

An Express monolith is more than a list of routes. Handlers share helpers, middleware order, caches, and mutable bindings. Moving a handler can preserve its text while changing what it closes over.

Consider a cache used by both billing and session routes:

```js
let sessionCache = {};

app.post("/billing/reset", (req, res) => {
  sessionCache = {};
  res.json({ reset: true });
});
```

Passing `sessionCache` directly to another module copies the current object reference. If the parent later assigns a new object, the extracted module can keep reading the old one.

Our module boundary passes closures over the original binding:

```js
require("./modules/billing").register(app, {
  hashId,
  PRICE_TABLE,
  getSessionCache: () => sessionCache,
  setSessionCache: (value) => { sessionCache = value; }
});
```

The generated billing handler calls `setSessionCache({})`. The session module uses `getSessionCache()`. The parent still owns the binding, so a billing reset remains visible to the session routes.

That boundary is deliberately small: `register(app, kernel)`. The `kernel` object makes the dependencies visible in the diff. The extraction preserves the selected statements apart from indentation and the wiring needed at the boundary. Cleanup happens in a later commit.

## The six gates

**1. Parse every changed file.** Run `node --check` on the parent and each module. It catches broken syntax quickly, before spending time on behavioral tests.

**2. Compare registration counts.** Record a baseline before the move. After extraction, count registrations in the parent and modules together. A matching count cannot establish correctness, but a changed count immediately deserves an explanation. The CLI's current counter is a textual heuristic and only enforces parity when `expectedRoutes` is configured.

**3. Check the module boundary.** Every extracted module exports `register(app, kernel)`. The CLI checks that export shape. Application tests must also exercise registration and startup; a textual export check cannot tell you whether middleware runs in the right order.

**4. Audit residual free variables.** Parse the generated module and look for references it has not declared or received. This complements live probes: a request that stops at an authentication check cannot tell you whether the code behind that check still has access to its dependencies.

**5. Replay requests against old and new.** Start each version with comparable fixtures, run the same sequence, and compare status and body. Include state transitions. In the public demo, a session gets read twice, billing resets the cache, and the session gets read again. That sequence tests a relationship between two extracted modules that isolated endpoint checks could miss.

**6. Keep the PR small.** Extract one domain, show the wiring, attach the checks, review, and merge. Recalculate the next cut's line ranges afterward. Renaming helpers, redesigning error handling, or changing business logic belongs in a separate change with its own evidence.

The first four gates catch structural problems. The fifth checks observed behavior. The sixth keeps the evidence understandable to the person reviewing the change.

## Reproduce the public example

The package is available on npm:

```bash
npx js-modularization-gold-standard --help
```

To run the full demo:

```bash
git clone https://github.com/drrx-ai/JS-Modularization-Gold-Standard.git
cd JS-Modularization-Gold-Standard
npm ci
npm test
```

The test extracts billing and session modules, runs the static gates, then compares nine HTTP requests against the original and extracted applications. Those requests cover five route handlers; the registration baseline also counts one middleware registration. The reset-then-read sequence is part of the test.

The CLI can also survey routes and shared symbols, analyze a proposed line range, preview an extraction, and audit an individual generated module. Use a clean branch and inspect `extract --dry` before applying a cut.

## Where review still matters

The current tool targets CommonJS and `app.method(...)` registration. It does not convert ESM applications or generate your production test suite. Complex mutable expressions, shadowed identifiers, relative imports, and dependencies between extracted regions still need careful review. Keep assignments simple and do not assume a generated setter preserves the return value of an assignment or increment expression.

For a production application, add authenticated requests, startup checks, middleware-order checks, and assertions for external side effects. Passing the public fixture establishes what works in that fixture.

The method is useful even without this CLI: make dependencies explicit, preserve the original binding, separate moving from cleanup, and require evidence at each step.

[Explore the code, example, and six gates on GitHub](https://github.com/drrx-ai/JS-Modularization-Gold-Standard). If you have a small example of shared-state wiring that breaks during extraction, we'd welcome a reproducible issue.
