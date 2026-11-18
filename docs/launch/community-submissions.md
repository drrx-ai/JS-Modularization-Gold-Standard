# Community submission drafts

These are prepared submissions, not records of publication. Use the repository link below; npm 0.1.0 has been verified with a fresh-cache `npx` run.

## Show HN

[HN's current guidelines](https://news.ycombinator.com/newsguidelines.html) prohibit generated text and automated posting. The maintainer should write and submit this personally. The following are factual reference notes, not copy to paste into HN.

- Link the runnable repository: https://github.com/drrx-ai/JS-Modularization-Gold-Standard
- Use the required “Show HN” title prefix and describe what users can try.
- Explain the DrRx connection and the six gates in your own words.
- Production case reported in the repository: 5,121 → 1,402 lines; public reproduction: a smaller synthetic Express fixture, nine matching HTTP requests.
- Shared-state example: billing resets a cache that session routes read through closures over the original binding.
- Install command: `npx js-modularization-gold-standard --help`.
- Include the CommonJS scope and limitations; be available to discuss the work.

Submission page: https://news.ycombinator.com/submit

[Show HN guidelines](https://news.ycombinator.com/showhn.html) require a usable project. Submit the runnable repository, not the article, and do not request votes.

## r/node

Title: **Six gates for splitting an Express monolith while checking behavior**

Body:

We used a six-gate process at DrRx to reduce a production Express server.js from 5,121 lines to 1,402. We've released a clean-room CommonJS CLI and a synthetic example so other Node developers can try the method.

The checks are: syntax, registration-count parity, register(app, kernel) export shape, residual free-variable audit, old-vs-new HTTP probes, and one extraction per PR. The CLI handles static checks; your application tests still need to cover startup, authentication, middleware order, and side effects.

The part I found useful is the shared-state boundary. Two extracted modules can keep seeing a reassigned cache because they receive getter/setter closures over the original binding. The demo checks a billing reset followed by a session read, as part of nine matching HTTP probes.

Try: `npx js-modularization-gold-standard --help`

Code and reproducible test: https://github.com/drrx-ai/JS-Modularization-Gold-Standard

Disclosure: this is our project. The production result describes the original work; the public test is a smaller synthetic fixture. What additional checks have helped you catch behavior changes when splitting a large Express app?

Submission page: https://www.reddit.com/r/node/submit

## r/javascript

Title: **Extracting CommonJS modules while preserving shared mutable bindings**

Body:

I work on this open-source tool at DrRx: https://github.com/drrx-ai/JS-Modularization-Gold-Standard

It extracts top-level regions of a CommonJS monolith into register(app, kernel) modules. ts-morph identifies dependencies; the generated boundary passes helpers directly and mutable bindings through getter/setter closures.

The JavaScript pitfall behind the approach is simple: passing an object to another module preserves that object reference, but not the parent's binding when it is later reassigned. A getSessionCache()/setSessionCache() boundary keeps that reassignment visible to both modules.

The workflow uses six gates: syntax, registration counts, module export shape, free-variable auditing, HTTP probe diffs, and incremental PRs. The public Express fixture compares nine requests, including a reset followed by a read from another module. It is a test of that fixture, not a guarantee for arbitrary programs.

Try `npx js-modularization-gold-standard --help`, or clone the repo and run `npm ci && npm test` to reproduce the demo.

I'd welcome feedback on the AST analysis and tricky binding cases, especially shadowing and complex assignments.

Submission page: https://www.reddit.com/r/javascript/submit

Check the live [r/javascript rules](https://www.reddit.com/r/javascript/about/rules/) and posting requirements before using the title. The rules reviewed for this draft allow self-promotion when it is not most of the account's contributions, require JavaScript code, and prohibit advertising paid services. Use an established participating account and the currently required title format or thread.

## awesome-nodejs when eligible

The repository must reach at least 100 stars before submission under the current [contributing guide](https://github.com/sindresorhus/awesome-nodejs/blob/main/contributing.md). It already satisfies the age requirement. No PR has been opened.

Proposed entry for the bottom of the appropriate development-tools category:

`- [js-modularization-gold-standard](https://github.com/drrx-ai/JS-Modularization-Gold-Standard) - Extract CommonJS monoliths into modules with AST dependency analysis and shared-state wiring.`

Recheck the guidelines, category, and duplicate submissions when the threshold is met.
