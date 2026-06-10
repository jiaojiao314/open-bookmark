/**
 * SKILL.md generation for AI platforms
 */
import { writeFile, mkdir } from 'node:fs/promises';
import { join } from 'node:path';
/** Generate SKILL.md content */
export function generateSkillContent() {
    return `# open-bookmark Skill

You are helping with browser bookmark management using the open-bookmark tool.

## Capabilities

- **Scan**: Read Chrome bookmarks and analyze patterns
- **Analyze**: Identify domains, folders, keywords, and URL patterns
- **Profile**: Infer user role, tech stack, interests, and language
- **Rules**: Generate classification rules based on analysis
- **Preview**: Show what rules will do before applying
- **Apply**: Execute rules to reorganize bookmarks
- **Verify**: Check results after applying rules
- **Rollback**: Restore from backup if needed

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
\`\`\`

## Workflow

1. **First time**: Run \`open-bookmark init\`
   - Scans Chrome bookmarks
   - Analyzes patterns (domains, folders, keywords)
   - Infers user profile (role, tech stack, interests)
   - Asks for confirmation via interactive dialogue
   - Generates classification rules

2. **Preview**: Run \`open-bookmark preview\`
   - Shows what rules will do
   - Identifies conflicts
   - No changes made

3. **Apply**: Run \`open-bookmark apply\`
   - Creates backup first
   - Executes rules
   - Modifies Chrome bookmarks

4. **Verify**: Run \`open-bookmark verify\`
   - Checks bookmark counts
   - Verifies protected paths
   - Reports issues

5. **Rollback**: Run \`open-bookmark rollback\` if needed
   - Restores from backup

## Rule Format

Rules are stored in \`open-bookmark/classification-rules.yaml\`:

\`\`\`yaml
# Example rule
- name: github
  match:
    domain:
      - github.com
      - "*.github.com"
  action: move
  target: GitHub
  reason: GitHub 项目书签
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

## State Management

State is stored in \`open-bookmark/.open-bookmark.yaml\`:

- Phase: scan → dialogue → generate → preview → apply → verify
- Profile: User preferences and settings
- Bookmarks: Snapshot info
- Rules: Generated rules info
- Backups: Backup history

## Tips

- Always preview before applying
- Check protected paths before applying
- Use rollback if something goes wrong
- Rules are first-match (order matters)
- Catch-all rule should be last
`;
}
/** Save SKILL.md for a platform */
export async function saveSkillForPlatform(platform, rootDir) {
    const skillDir = join(rootDir, platform.skillDir);
    const skillPath = join(skillDir, platform.skillFileName);
    // Ensure directory exists
    await mkdir(skillDir, { recursive: true });
    // Generate and save content
    const content = generateSkillContent();
    await writeFile(skillPath, content, 'utf-8');
    return skillPath;
}
/** Save SKILL.md for all detected platforms */
export async function saveSkillForAllPlatforms(platforms, rootDir) {
    const savedPaths = [];
    for (const platform of platforms) {
        const path = await saveSkillForPlatform(platform.config, rootDir);
        savedPaths.push(path);
    }
    return savedPaths;
}
//# sourceMappingURL=skill.js.map