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
- **AI-Enhanced**: Multi-agent pipeline for intelligent classification

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

## AI-Enhanced Features

### Multi-Agent Pipeline

Run the enhanced multi-agent pipeline for intelligent bookmark classification:

```bash
# Run enhanced pipeline
open-bookmark pipeline --enhanced

# Save results to JSON
open-bookmark pipeline --enhanced --json --output results.json
```

The pipeline uses three agents:
1. **Scanner Agent**: Extracts features from bookmarks (domains, URLs, paths)
2. **Analyzer Agent**: Performs semantic analysis with hierarchical classification
3. **Classifier Agent**: Generates classification rules with dynamic priority

### Hierarchical Classification

The system supports hierarchical classification with:
- **Domain-based rules**: Highest priority (0.95 confidence)
- **Keyword-based rules**: Medium priority (0.5-0.9 confidence)
- **URL path patterns**: Lower priority (0.7-0.8 confidence)
- **Folder structure**: Lowest priority (0.6 confidence)

Example hierarchy:
```
DevOps
├── DevOps/Containers (Docker, Podman)
├── DevOps/Orchestration (Kubernetes, Helm)
├── DevOps/CI-CD (Jenkins, GitLab CI)
├── DevOps/Monitoring (Prometheus, Grafana)
└── DevOps/IaC (Terraform, Ansible)
```

### Quality Evaluation

Evaluate classification quality:

```bash
# Evaluate with enhanced evaluator
open-bookmark evaluate --enhanced

# Output as JSON
open-bookmark evaluate --enhanced --json
```

The evaluator reports:
- Coverage percentage
- Category distribution
- Hierarchy depth
- Quality score (0-100)

### User Feedback

Collect and manage user feedback:

```bash
# Add feedback
open-bookmark feedback --add "id:name:from:to:reason"

# List pending feedback
open-bookmark feedback --list

# Generate feedback report
open-bookmark feedback --report
```

### Rule Optimization

Optimize rules based on feedback:

```bash
# Run optimization analysis
open-bookmark optimize

# Apply optimizations
open-bookmark optimize --apply
```

## AI-Enhanced Workflow

For best results, use the complete AI-enhanced workflow:

```bash
# Step 1: Initialize and scan bookmarks
open-bookmark init

# Step 2: Run enhanced pipeline
open-bookmark pipeline --enhanced

# Step 3: Evaluate classification quality
open-bookmark evaluate --enhanced

# Step 4: Provide feedback on misclassified bookmarks
open-bookmark feedback --add "id:name:from:to:reason"

# Step 5: Optimize rules based on feedback
open-bookmark optimize --apply

# Step 6: Preview and apply
open-bookmark preview
open-bookmark apply
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
| `prepare` | Prepare bookmark data for AI analysis |
| `rules` | Convert AI-generated tags to rules |
| `stats` | Output bookmark statistics for AI |
| `pipeline` | Run multi-agent analysis pipeline |
| `evaluate` | Evaluate classification quality |
| `feedback` | Manage user feedback |
| `optimize` | Run optimization cycle |

## Rule Format

Rules are stored in YAML format with match conditions:

```yaml
- name: kubernetes-生态
  match:
    domain:
      - kubernetes.io
      - "*.kubernetes.io"
      - helm.sh
    title_contains:
      - k8s
      - kubectl
  action: move
  target: DevOps/Kubernetes
  reason: "Kubernetes and cloud-native tools"
  source: generated
```

### Match Conditions

- `domain` — Domain matching (supports wildcards)
- `url_regex` — URL regex matching
- `title_contains` — Title keyword matching
- `title_exclude` — Title exclusion
- `folder_path` — Exact folder path
- `folder_prefix` — Folder prefix matching
- `match_all` — Catch-all rule

### Actions

- `move` — Move bookmark to target folder
- `skip` — Skip bookmark (protected)
- `analyze` — Mark for analysis

## AI Platform Integration

open-bookmark supports SKILL.md generation for AI platforms:

- Claude Code
- Cursor
- OpenCode

Install SKILL.md:

```bash
open-bookmark skill install
```

Generate SKILL.md locally:

```bash
open-bookmark skill generate
```

## Documentation

- [User Guide](docs/user-guide.md) — Complete user guide
- [API Reference](docs/api-reference.md) — API documentation
- [Developer Guide](docs/developer-guide.md) — Contributing guide

## License

MIT
