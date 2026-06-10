/**
 * Chrome bookmark reading and writing
 */
import type { Bookmark } from './types.js';
/** Chrome profile */
export interface ChromeProfile {
    name: string;
    path: string;
    bookmarks: Bookmark[];
}
/** Detect Chrome profiles with bookmarks */
export declare function detectProfiles(): ChromeProfile[];
/** Read bookmarks from Chrome Bookmarks file */
export declare function readBookmarks(bookmarksPath: string): Bookmark[];
/** Save bookmarks to JSON snapshot */
export declare function saveSnapshot(bookmarks: Bookmark[], path: string): void;
/** Load bookmarks from JSON snapshot */
export declare function loadSnapshot(path: string): Bookmark[];
/** Check if Chrome is running */
export declare function isChromeRunning(): boolean;
/** Backup Chrome bookmarks file */
export declare function backupBookmarks(backupDir: string): string;
/** Restore bookmarks from backup */
export declare function restoreBackup(backupPath: string): void;
//# sourceMappingURL=chrome.d.ts.map