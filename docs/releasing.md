# Publishing a release

The npm package is `js-modularization-gold-standard`. Both that executable name and `jsmod` point to `bin/cli.mjs`.

1. Update the version in `package.json` and `package-lock.json` together when preparing a new release.
2. Run `npm ci`, `npm test`, and `npm run test:package`. Inspect `npm pack --dry-run` and `npm audit`; review any advisory before release.
3. Commit and push the release changes to `drrx-ai/JS-Modularization-Gold-Standard`. Confirm CI passes for the release commit.
4. Authenticate with an npm account authorized to publish this package, then run `npm publish --access public`. Its `prepublishOnly` hook reruns the integration and tarball checks.
5. From an empty directory with a fresh npm cache, run `npx --yes js-modularization-gold-standard --help` and `npx --yes js-modularization-gold-standard --version`. Compare the registry version and tarball integrity with the release artifact.
6. Tag the published commit and create a GitHub release with the validation results. Submit launch links only after the registry checks pass.

Store publishing credentials in the organization's secret manager. Never commit credentials or print them in CI output. Prefer [npm trusted publishing](https://docs.npmjs.com/trusted-publishers/) for future automation once configured for this package and repository.

## Dependency review for 0.1.0

As of November 18, 2026, `npm audit` reports five high-severity entries along the ts-morph → tinyglobby → picomatch dependency chain. They derive from [GHSA-fc5q-39xc-vjpf](https://github.com/advisories/GHSA-fc5q-39xc-vjpf), a denial-of-service issue with crafted extglob patterns; the advisory lists no patched picomatch version. Downgrading ts-morph to 26 also introduces a minimatch advisory, so this release retains ts-morph 28.

The CLI takes explicit source paths and line ranges, not user-supplied glob patterns. Run it on trusted local projects; do not expose its programmatic project object as an untrusted glob-processing service. The advisory remains open and should be revisited when upstream publishes a fix.
