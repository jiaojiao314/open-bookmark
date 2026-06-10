/**
 * Platform configuration for SKILL.md generation
 */
/** Supported platforms */
export const PLATFORMS = [
    {
        name: 'claude',
        description: 'Claude Desktop / Claude Code',
        skillDir: '.claude/skills',
        skillFileName: 'open-bookmark.md',
        detectPaths: [
            '.claude',
            '.claude.json',
            'CLAUDE.md'
        ]
    },
    {
        name: 'cursor',
        description: 'Cursor IDE',
        skillDir: '.cursor/skills',
        skillFileName: 'open-bookmark.md',
        detectPaths: [
            '.cursor',
            '.cursorrules',
            'cursor.json'
        ]
    },
    {
        name: 'opencode',
        description: 'OpenCode CLI',
        skillDir: '.opencode/skills',
        skillFileName: 'open-bookmark.md',
        detectPaths: [
            '.opencode',
            '.opencode.json',
            'opencode.json'
        ]
    }
];
/** Get platform by name */
export function getPlatform(name) {
    return PLATFORMS.find(p => p.name === name);
}
/** Get all platform names */
export function getPlatformNames() {
    return PLATFORMS.map(p => p.name);
}
//# sourceMappingURL=config.js.map