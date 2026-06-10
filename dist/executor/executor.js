/**
 * Executor - handles preview, apply, verify, and rollback operations
 */
import { findMatchingRule, findConflicts } from '../rules/types.js';
/** Preview rule execution */
export function preview(bookmarks, rules) {
    const moves = [];
    const conflictMap = findConflicts(bookmarks, rules);
    for (const bookmark of bookmarks) {
        const rule = findMatchingRule(bookmark, rules);
        if (!rule)
            continue;
        if (rule.action === 'skip') {
            // Protected, skip
            continue;
        }
        if (rule.action === 'move' && rule.target) {
            const targetFolder = rule.subfolder
                ? `${rule.target}/${rule.subfolder}`
                : rule.target;
            moves.push({
                bookmarkId: bookmark.id,
                bookmarkName: bookmark.name,
                bookmarkUrl: bookmark.url,
                currentFolder: bookmark.folder,
                targetFolder,
                ruleName: rule.name
            });
        }
    }
    // Build conflict info
    const conflicts = [];
    for (const [bookmarkId, ruleNames] of conflictMap.entries()) {
        const bookmark = bookmarks.find(b => b.id === bookmarkId);
        if (bookmark) {
            conflicts.push({
                bookmarkId,
                bookmarkName: bookmark.name,
                ruleNames
            });
        }
    }
    return {
        totalBookmarks: bookmarks.length,
        matchedBookmarks: moves.length,
        unmatchedBookmarks: bookmarks.length - moves.length,
        conflicts,
        moves,
        skips: bookmarks.length - moves.length
    };
}
/** Apply rules to bookmarks (returns modified bookmarks) */
export function apply(bookmarks, rules) {
    const errors = [];
    let moved = 0;
    let skipped = 0;
    const modifiedBookmarks = bookmarks.map(bookmark => {
        const rule = findMatchingRule(bookmark, rules);
        if (!rule) {
            return bookmark;
        }
        if (rule.action === 'skip') {
            skipped++;
            return bookmark;
        }
        if (rule.action === 'move' && rule.target) {
            const targetFolder = rule.subfolder
                ? `${rule.target}/${rule.subfolder}`
                : rule.target;
            moved++;
            return {
                ...bookmark,
                folder: targetFolder,
                dateModified: new Date()
            };
        }
        return bookmark;
    });
    return {
        bookmarks: modifiedBookmarks,
        result: {
            success: errors.length === 0,
            moved,
            skipped,
            errors
        }
    };
}
/** Verify bookmarks after apply */
export function verify(originalBookmarks, modifiedBookmarks, protectedPaths) {
    const issues = [];
    // Check count consistency
    if (originalBookmarks.length !== modifiedBookmarks.length) {
        issues.push({
            type: 'count_mismatch',
            message: `书签数量不一致: 原始 ${originalBookmarks.length}, 修改后 ${modifiedBookmarks.length}`
        });
    }
    // Check protected paths
    for (const bookmark of modifiedBookmarks) {
        const isProtected = protectedPaths.some(path => bookmark.folder.startsWith(path));
        if (isProtected) {
            // Check if it was in protected path originally
            const original = originalBookmarks.find(b => b.id === bookmark.id);
            if (original && !original.folder.startsWith(bookmark.folder.split('/')[0])) {
                issues.push({
                    type: 'protected_moved',
                    message: `受保护书签被移动: ${bookmark.name}`,
                    bookmarkId: bookmark.id
                });
            }
        }
    }
    // Count stats
    const movedCount = modifiedBookmarks.filter((b, i) => b.folder !== originalBookmarks[i]?.folder).length;
    return {
        valid: issues.length === 0,
        issues,
        stats: {
            expectedCount: originalBookmarks.length,
            actualCount: modifiedBookmarks.length,
            movedCount,
            protectedCount: protectedPaths.length
        }
    };
}
/** Create backup of bookmarks */
export async function createBackup(bookmarks, backupDir) {
    const { writeFile, mkdir } = await import('node:fs/promises');
    const { join } = await import('node:path');
    // Ensure backup directory exists
    await mkdir(backupDir, { recursive: true });
    // Generate backup filename with timestamp
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = join(backupDir, `${timestamp}.json`);
    // Write backup
    await writeFile(backupPath, JSON.stringify(bookmarks, null, 2), 'utf-8');
    return backupPath;
}
/** Load backup bookmarks */
export async function loadBackup(backupPath) {
    const { readFile } = await import('node:fs/promises');
    try {
        const content = await readFile(backupPath, 'utf-8');
        const data = JSON.parse(content);
        // Convert date strings back to Date objects
        return data.map((b) => ({
            ...b,
            dateAdded: new Date(b.dateAdded),
            dateModified: new Date(b.dateModified)
        }));
    }
    catch {
        return [];
    }
}
//# sourceMappingURL=executor.js.map