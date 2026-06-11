# open-bookmark

Spec-driven browser bookmark management. Define your rules first, then execute.

## Features

- **Scan**: Read Chrome bookmarks and analyze patterns
- **Analyze**: Identify domains, folders, keywords, and URL patterns
- **Profile**: Infer user role, tech stack, interests, and language
- **Rules**: Generate classification rules based on analysis
- **Preview**: Show what rules will do before applying
- **Apply**: Execute rules to reorganize bookmarks
- **Verify**: Check results after applying rules
- **Rollback**: Restore from backup if needed

## Install

```bash
npm install -g open-bookmark
```

## Quick Start

```bash
# Initialize: scan bookmarks, analyze, generate rules
open-bookmark init

# Preview rule execution effects
open-bookmark preview

# Apply rules to bookmarks
open-bookmark apply

# View and modify user profile
open-bookmark config --show

# Generate incremental rules for new bookmarks
open-bookmark propose

# Install SKILL.md for AI platforms
open-bookmark skill install
```

## Commands

| Command | Description |
|---------|-------------|
| `init` | Initialize open-bookmark: scan bookmarks, analyze, generate rules |
| `status` | Show current status and next steps |
| `preview` | Preview rule execution effects |
| `apply` | Apply rules to bookmarks |
| `verify` | Verify results after apply |
| `rollback` | Rollback to last backup |
| `analyze` | Deep analysis of bookmarks (read-only) |
| `config` | View and modify user profile |
| `propose` | Scan new bookmarks and generate incremental rules |
| `skill` | Generate and install SKILL.md for AI platforms |

## Rule Format

Rules are stored in YAML format with match conditions:

```yaml
- name: github
  match:
    domain:
      - github.com
      - "*.github.com"
  action: move
  target: GitHub
  reason: GitHub project bookmarks
```

### Match Conditions

- `domain` — Domain matching (supports wildcards)
- `url_regex` — URL regex matching
- `title_contains` — Title keyword matching
- `title_exclude` — Title exclusion
- `folder_path` — Exact folder path
- `folder_prefix` — Folder prefix matching
- `match_all` — Catch-all rule

## AI Platform Integration

open-bookmark supports SKILL.md generation for AI platforms:

- Claude Code
- Cursor
- OpenCode

Install SKILL.md:

```bash
open-bookmark skill install
```

## License

MIT
