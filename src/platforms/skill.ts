/**
 * SKILL.md generation for AI platforms
 */

import { writeFile, mkdir } from 'node:fs/promises'
import { join } from 'node:path'
import { resolveSkillDir, SKILL_NAME } from './config.js'
import type { PlatformConfig } from './config.js'

/** Generate SKILL.md content */
export function generateSkillContent(): string {
  return `# open-bookmark Skill

You are an expert bookmark organizer helping with browser bookmark management.

## Capabilities

- **Scan**: Read Chrome bookmarks and analyze patterns
- **Analyze**: Identify domains, folders, keywords, and URL patterns
- **Profile**: Infer user role, tech stack, interests, and language
- **Rules**: Generate classification rules based on analysis
- **Preview**: Show what rules will do before applying
- **Apply**: Execute rules to reorganize bookmarks
- **Verify**: Check results after applying rules
- **Rollback**: Restore from backup if needed
- **Pipeline**: Run multi-agent analysis pipeline
- **Evaluate**: Evaluate classification quality
- **Feedback**: Collect user feedback
- **Optimize**: Optimize rules based on feedback

## Commands

\`\`\`bash
# Initialize: scan bookmarks, analyze, generate rules
open-bookmark init

# Show current status and next steps
open-bookmark status

# Preview rule execution effects
open-bookmark preview

# Apply rules to bookmarks
open-bookmark apply

# Verify results after apply
open-bookmark verify

# Rollback to last backup
open-bookmark rollback

# Deep analysis of bookmarks (read-only)
open-bookmark analyze

# AI-enhanced: prepare data for AI analysis
open-bookmark prepare [--format ai-ready|domains|keywords] [--sample N]

# AI-enhanced: view bookmark statistics
open-bookmark stats [--domains|--keywords|--patterns]

# AI-enhanced: convert AI tags to rules
open-bookmark rules --from <ai-tags.json> [--merge]

# Multi-agent pipeline
open-bookmark pipeline [--enhanced] [--json] [--output <file>]

# Evaluate classification quality
open-bookmark evaluate [--enhanced] [--json]

# Manage user feedback
open-bookmark feedback [--add <entry>] [--list] [--apply <id>] [--report]

# Optimize rules
open-bookmark optimize [--apply] [--json]
\`\`\`

## AI-Enhanced Workflow (Recommended)

For better classification quality, use the complete AI-enhanced workflow:

### Step 1: Initialize
\`\`\`bash
open-bookmark init
\`\`\`
Scans Chrome bookmarks and generates initial rules.

### Step 2: Run Enhanced Pipeline
\`\`\`bash
open-bookmark pipeline --enhanced
\`\`\`
Runs multi-agent analysis:
- **Scanner Agent**: Extracts features (domains, URLs, paths)
- **Analyzer Agent**: Semantic analysis with hierarchical classification
- **Classifier Agent**: Generates rules with dynamic priority

### Step 3: Evaluate Quality
\`\`\`bash
open-bookmark evaluate --enhanced
\`\`\`
Reports coverage, distribution, and quality score (0-100).

### Step 4: Provide Feedback
\`\`\`bash
open-bookmark feedback --add "id:name:from:to:reason"
\`\`\`
Records feedback for misclassified bookmarks.

### Step 5: Optimize Rules
\`\`\`bash
open-bookmark optimize --apply
\`\`\`
Analyzes feedback and optimizes rules.

### Step 6: Preview & Apply
\`\`\`bash
open-bookmark preview  # Review changes
open-bookmark apply    # Execute rules
\`\`\`

## Hierarchical Classification

The system supports hierarchical classification:

\`\`\`
DevOps
├── DevOps/Containers (Docker, Podman)
├── DevOps/Orchestration (Kubernetes, Helm)
├── DevOps/CI-CD (Jenkins, GitLab CI)
├── DevOps/Monitoring (Prometheus, Grafana)
└── DevOps/IaC (Terraform, Ansible)
\`\`\`

Classification priority:
1. **Domain rules**: Highest priority (0.95 confidence)
2. **Keyword rules**: Medium priority (0.5-0.9 confidence)
3. **URL path patterns**: Lower priority (0.7-0.8 confidence)
4. **Folder structure**: Lowest priority (0.6 confidence)

## Conflict Resolution

When a bookmark matches multiple categories:

1. **Specificity wins**: "Kubernetes API" → "Kubernetes" (not "Documentation")
2. **Domain priority**: Domain match > keyword match
3. **Existing structure**: Prefer similar target to existing folders
4. **User role alignment**: Categories matching user's profession get priority
5. **Priority ordering**: Lower priority number = higher precedence

## Standard Workflow (Without AI)

1. **First time**: Run \`open-bookmark init\`
2. **Preview**: Run \`open-bookmark preview\`
3. **Apply**: Run \`open-bookmark apply\`
4. **Verify**: Run \`open-bookmark verify\`
5. **Rollback**: Run \`open-bookmark rollback\` if needed

## Rule Format

Rules are stored in \`open-bookmark/classification-rules.yaml\`:

\`\`\`yaml
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
\`\`\`

## Match Conditions

- \`domain\`: Domain matching (supports wildcards)
- \`url_regex\`: URL regex matching
- \`title_contains\`: Title keyword matching
- \`title_exclude\`: Title exclusion
- \`folder_path\`: Exact folder path
- \`folder_prefix\`: Folder prefix matching
- \`match_all\`: Match everything (catch-all)

## Actions

- \`move\`: Move bookmark to target folder
- \`skip\`: Skip bookmark (protected)
- \`analyze\`: Mark for analysis

## Quality Tips

- Always preview before applying
- Check protected paths before applying
- Use rollback if something goes wrong
- Rules are first-match (order matters)
- Catch-all rule should be last
- Aim for 10-20 categories (not too few, not too many)
- Use descriptive category names
- Include both domains AND keywords for better matching
- Use feedback system to improve classification quality
- Run evaluation regularly to monitor quality
`

}

/** Save SKILL.md for a platform.
 *
 * - `project` selects project-level vs user-global install location.
 * - `style: 'folder'` nests the skill inside a folder named after the skill
 *   (`<dir>/open-bookmark/<file>`); `'per-skill'` drops the file directly in.
 */
export async function saveSkillForPlatform(
  platform: PlatformConfig,
  rootDir: string,
  project = false
): Promise<string> {
  const baseDir = resolveSkillDir(platform, project, rootDir)
  const skillDir = platform.style === 'folder' ? join(baseDir, SKILL_NAME) : baseDir
  const skillPath = join(skillDir, platform.skillFileName)

  await mkdir(skillDir, { recursive: true })

  const content = generateSkillContent()
  await writeFile(skillPath, content, 'utf-8')

  return skillPath
}

/** Save SKILL.md for all detected platforms */
export async function saveSkillForAllPlatforms(
  platforms: Array<{ config: PlatformConfig }>,
  rootDir: string,
  project = false
): Promise<string[]> {
  const savedPaths: string[] = []

  for (const platform of platforms) {
    const path = await saveSkillForPlatform(platform.config, rootDir, project)
    savedPaths.push(path)
  }

  return savedPaths
}
