# open-bookmark

## 0.3.0

### Minor Changes

- [`7aa5608`](https://github.com/jiaojiao314/open-bookmark/commit/7aa5608893668d4c15c659f8bd672ceaec1256d4) Thanks [@jiaojiao314](https://github.com/jiaojiao314)! - v0.3: cross-platform distribution & multi-tool skills

  - CI rebuilt on tsc + vitest with a Windows/macOS/Linux matrix; added
    `prepublishOnly` (build + test) and `publishConfig` for safe npm publishing.
  - Skills now install to user-global directories by default (with `--project`
    opt-in) and cover major AI code tools: Claude, Cursor, OpenCode, Codex,
    Gemini, Copilot, Cline, Kimi. Per-skill and folder install styles supported.
  - New `graph dashboard` command renders the bookmark knowledge graph as a
    self-contained, offline HTML visualization.
  - Added a Simplified Chinese README and language navigation.
  - Expanded test coverage for the executor and rules modules.
