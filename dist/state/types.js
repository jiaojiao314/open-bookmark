/**
 * Workflow state type definitions for open-bookmark
 */
/** Create new workflow state with defaults */
export function newWorkflowState() {
    const now = new Date();
    return {
        version: '1',
        phase: 'scan',
        workflow: 'full',
        autoTransition: false,
        profile: {
            role: '',
            techStack: [],
            interests: [],
            language: 'mixed',
            preferences: {
                blogStrategy: '集中',
                protectedPaths: [],
                catchAllTarget: '99-人工待确认'
            },
            confirmed: false
        },
        bookmarks: {
            snapshot: '',
            count: 0,
            lastScan: now
        },
        rules: {
            file: '',
            count: 0,
            lastGenerated: now
        },
        backups: [],
        createdAt: now,
        updatedAt: now
    };
}
//# sourceMappingURL=types.js.map