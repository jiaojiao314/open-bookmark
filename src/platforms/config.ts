/**
 * Platform configuration for SKILL.md generation
 */

import { homedir } from 'node:os'
import { join } from 'node:path'

/** Install style for a platform's skill directory */
export type SkillStyle = 'per-skill' | 'folder'

/** Platform configuration */
export interface PlatformConfig {
  name: string
  description: string
  /** Global skill target directory, relative to the user's home directory */
  globalDir: string
  /** Project-level skill directory, relative to the project root */
  projectDir: string
  skillFileName: string
  /** Install style: per-skill drops the skill file in; folder treats the skill as a named folder */
  style: SkillStyle
  /** Paths (relative to a root) that indicate the platform is present */
  detectPaths: string[]
}

/** Skill folder name used when installing as a folder */
export const SKILL_NAME = 'open-bookmark'

/** Supported platforms (see design.md platform table) */
export const PLATFORMS: PlatformConfig[] = [
  {
    name: 'claude',
    description: 'Claude Desktop / Claude Code',
    globalDir: '.claude/skills',
    projectDir: '.claude/skills',
    skillFileName: 'open-bookmark.md',
    style: 'per-skill',
    detectPaths: ['.claude', '.claude.json', 'CLAUDE.md']
  },
  {
    name: 'cursor',
    description: 'Cursor IDE',
    globalDir: '.cursor/skills',
    projectDir: '.cursor/skills',
    skillFileName: 'open-bookmark.md',
    style: 'per-skill',
    detectPaths: ['.cursor', '.cursorrules', 'cursor.json']
  },
  {
    name: 'opencode',
    description: 'OpenCode CLI',
    globalDir: '.agents/skills',
    projectDir: '.opencode/skills',
    skillFileName: 'open-bookmark.md',
    style: 'per-skill',
    detectPaths: ['.opencode', '.opencode.json', 'opencode.json']
  },
  {
    name: 'codex',
    description: 'Codex CLI',
    globalDir: '.agents/skills',
    projectDir: '.agents/skills',
    skillFileName: 'open-bookmark.md',
    style: 'per-skill',
    detectPaths: ['.codex', 'codex.json']
  },
  {
    name: 'gemini',
    description: 'Gemini CLI',
    globalDir: '.agents/skills',
    projectDir: '.agents/skills',
    skillFileName: 'open-bookmark.md',
    style: 'per-skill',
    detectPaths: ['.gemini', 'GEMINI.md']
  },
  {
    name: 'copilot',
    description: 'GitHub Copilot (VS Code)',
    globalDir: '.copilot/skills',
    projectDir: '.copilot/skills',
    skillFileName: 'open-bookmark.md',
    style: 'per-skill',
    detectPaths: ['.copilot', '.github/copilot-instructions.md']
  },
  {
    name: 'cline',
    description: 'Cline',
    globalDir: '.cline/skills',
    projectDir: '.cline/skills',
    skillFileName: 'open-bookmark.md',
    style: 'folder',
    detectPaths: ['.cline', '.clinerules']
  },
  {
    name: 'kimi',
    description: 'Kimi',
    globalDir: '.kimi/skills',
    projectDir: '.kimi/skills',
    skillFileName: 'open-bookmark.md',
    style: 'folder',
    detectPaths: ['.kimi']
  }
]

/** Get platform by name */
export function getPlatform(name: string): PlatformConfig | undefined {
  return PLATFORMS.find(p => p.name === name)
}

/** Get all platform names */
export function getPlatformNames(): string[] {
  return PLATFORMS.map(p => p.name)
}

/** Resolve the skill target directory for a platform (global or project) */
export function resolveSkillDir(platform: PlatformConfig, project: boolean, rootDir: string): string {
  if (project) {
    return join(rootDir, platform.projectDir)
  }
  return join(homedir(), platform.globalDir)
}
