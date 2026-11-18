# Launch submission notes

The npm 0.1.0 release has been verified with a fresh-cache `npx` run. These notes cover the remaining list submissions and a possible manual Show HN submission.

## Engineering story

[How we split a 5,000-line Express server.js with zero behavioral diffs](engineering-story.md) is saved in this repository for the maintainer to post to DEV.to. It has not been posted externally.

## awesome-codemods

[PR #8](https://github.com/rajasegar/awesome-codemods/pull/8) adds one entry at the end of the JavaScript section. The contribution guide and code of conduct were read, duplicate searches covered the old name, new name, and CLI alias, and the npm package was verified before submission. The pull request is awaiting the list maintainer's review.

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

## awesome-nodejs when eligible

The repository must reach at least 100 stars before submission under the current [contributing guide](https://github.com/sindresorhus/awesome-nodejs/blob/main/contributing.md). It already satisfies the age requirement. No PR has been opened.

Proposed entry for the bottom of the appropriate development-tools category:

`- [js-modularization-gold-standard](https://github.com/drrx-ai/JS-Modularization-Gold-Standard) - Extract CommonJS monoliths into modules with AST dependency analysis and shared-state wiring.`

Recheck the guidelines, category, and duplicate submissions when the threshold is met.
