/**
 * Rule type definitions for open-bookmark
 */
/** Match condition for rules */
export interface MatchCondition {
    domain?: string[];
    urlRegex?: string;
    titleContains?: string[];
    titleExclude?: string[];
    folderPath?: string;
    folderPrefix?: string;
    matchAll?: boolean;
}
/** Classification rule */
export interface Rule {
    name: string;
    match: MatchCondition;
    action: 'move' | 'skip' | 'analyze';
    target?: string;
    subfolder?: string;
    reason?: string;
    source?: 'generated' | 'user-defined' | 'template';
}
/** Rule collection */
export interface RuleCollection {
    rules: Rule[];
}
/** Check if a bookmark matches a rule */
export declare function matchesRule(bookmark: {
    name: string;
    url: string;
    folder: string;
}, rule: Rule): boolean;
/** Find first matching rule for a bookmark */
export declare function findMatchingRule(bookmark: {
    name: string;
    url: string;
    folder: string;
}, rules: Rule[]): Rule | null;
/** Find conflicts (bookmarks matching multiple rules, excluding catch-all) */
export declare function findConflicts(bookmarks: Array<{
    id: string;
    name: string;
    url: string;
    folder: string;
}>, rules: Rule[]): Map<string, string[]>;
//# sourceMappingURL=types.d.ts.map