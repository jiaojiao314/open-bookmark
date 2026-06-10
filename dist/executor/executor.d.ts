/**
 * Executor - handles preview, apply, verify, and rollback operations
 */
import type { Bookmark } from '../chrome/types.js';
import type { Rule } from '../rules/types.js';
/** Preview result */
export interface PreviewResult {
    totalBookmarks: number;
    matchedBookmarks: number;
    unmatchedBookmarks: number;
    conflicts: ConflictInfo[];
    moves: MoveInfo[];
    skips: number;
}
/** Move info */
export interface MoveInfo {
    bookmarkId: string;
    bookmarkName: string;
    bookmarkUrl: string;
    currentFolder: string;
    targetFolder: string;
    ruleName: string;
}
/** Conflict info */
export interface ConflictInfo {
    bookmarkId: string;
    bookmarkName: string;
    ruleNames: string[];
}
/** Apply result */
export interface ApplyResult {
    success: boolean;
    moved: number;
    skipped: number;
    errors: ApplyError[];
    backupPath?: string;
}
/** Apply error */
export interface ApplyError {
    bookmarkId: string;
    bookmarkName: string;
    error: string;
}
/** Verify result */
export interface VerifyResult {
    valid: boolean;
    issues: VerifyIssue[];
    stats: VerifyStats;
}
/** Verify issue */
export interface VerifyIssue {
    type: 'count_mismatch' | 'protected_moved' | 'bookmark_missing';
    message: string;
    bookmarkId?: string;
}
/** Verify stats */
export interface VerifyStats {
    expectedCount: number;
    actualCount: number;
    movedCount: number;
    protectedCount: number;
}
/** Preview rule execution */
export declare function preview(bookmarks: Bookmark[], rules: Rule[]): PreviewResult;
/** Apply rules to bookmarks (returns modified bookmarks) */
export declare function apply(bookmarks: Bookmark[], rules: Rule[]): {
    bookmarks: Bookmark[];
    result: ApplyResult;
};
/** Verify bookmarks after apply */
export declare function verify(originalBookmarks: Bookmark[], modifiedBookmarks: Bookmark[], protectedPaths: string[]): VerifyResult;
/** Create backup of bookmarks */
export declare function createBackup(bookmarks: Bookmark[], backupDir: string): Promise<string>;
/** Load backup bookmarks */
export declare function loadBackup(backupPath: string): Promise<Bookmark[]>;
//# sourceMappingURL=executor.d.ts.map