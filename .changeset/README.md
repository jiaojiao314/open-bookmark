# Changesets

This directory tracks pending releases with [changesets](https://github.com/changesets/changesets).

To record a change for the next release:

```bash
npx changeset
```

Pick the bump type (patch / minor / major) and write a short summary. Commit the
generated markdown file. On merge to `main`, the release workflow opens a
"Version Packages" PR; merging that PR publishes to npm.
