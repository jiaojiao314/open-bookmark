/**
 * Chrome bookmark reading and writing
 */
import { readFileSync, writeFileSync, existsSync, mkdirSync, readdirSync, statSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { homedir } from 'node:os';
import { webKitToDate } from './types.js';
/** Get Chrome user data directory */
function getChromeDir() {
    const platform = process.platform;
    switch (platform) {
        case 'darwin':
            return join(homedir(), 'Library', 'Application Support', 'Google', 'Chrome');
        case 'win32': {
            const localAppData = process.env.LOCALAPPDATA || '';
            return join(localAppData, 'Google', 'Chrome', 'User Data');
        }
        case 'linux':
            return join(homedir(), '.config', 'google-chrome');
        default:
            return '';
    }
}
/** Detect Chrome profiles with bookmarks */
export function detectProfiles() {
    const chromeDir = getChromeDir();
    if (!chromeDir || !existsSync(chromeDir))
        return [];
    const profiles = [];
    try {
        const entries = readdirSync(chromeDir);
        for (const entry of entries) {
            const bookmarksPath = join(chromeDir, entry, 'Bookmarks');
            try {
                if (statSync(join(chromeDir, entry)).isDirectory() && existsSync(bookmarksPath)) {
                    profiles.push({
                        name: entry,
                        path: bookmarksPath,
                        bookmarks: []
                    });
                }
            }
            catch {
                // Skip entries that can't be stat'd
            }
        }
    }
    catch {
        // Can't read Chrome directory
    }
    return profiles;
}
/** Read bookmarks from Chrome Bookmarks file */
export function readBookmarks(bookmarksPath) {
    const data = readFileSync(bookmarksPath, 'utf-8');
    const chromeBookmarks = JSON.parse(data);
    const bookmarks = [];
    extractBookmarks(chromeBookmarks.roots.bookmark_bar, '', bookmarks);
    return bookmarks;
}
/** Recursively extract bookmarks from Chrome tree */
function extractBookmarks(node, parentPath, result) {
    if (node.type === 'url') {
        result.push({
            id: node.id,
            name: node.name,
            url: node.url || '',
            folder: parentPath,
            parentId: '', // Will be set by caller if needed
            dateAdded: webKitToDate(node.date_added || ''),
            dateModified: webKitToDate(node.date_modified || '')
        });
        return;
    }
    // It's a folder
    const currentPath = parentPath ? `${parentPath}/${node.name}` : node.name;
    if (node.children) {
        for (const child of node.children) {
            extractBookmarks(child, currentPath, result);
        }
    }
}
/** Save bookmarks to JSON snapshot */
export function saveSnapshot(bookmarks, path) {
    const dir = dirname(path);
    if (!existsSync(dir)) {
        mkdirSync(dir, { recursive: true });
    }
    writeFileSync(path, JSON.stringify({ bookmarks }, null, 2));
}
/** Load bookmarks from JSON snapshot */
export function loadSnapshot(path) {
    const data = readFileSync(path, 'utf-8');
    const parsed = JSON.parse(data);
    return parsed.bookmarks;
}
/** Check if Chrome is running */
export function isChromeRunning() {
    // Simplified check - in production, use child_process
    return false;
}
/** Backup Chrome bookmarks file */
export function backupBookmarks(backupDir) {
    const chromeDir = getChromeDir();
    if (!chromeDir)
        throw new Error('Unsupported platform');
    const bookmarksPath = join(chromeDir, 'Default', 'Bookmarks');
    if (!existsSync(bookmarksPath)) {
        throw new Error('Bookmarks file not found');
    }
    if (!existsSync(backupDir)) {
        mkdirSync(backupDir, { recursive: true });
    }
    const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
    const backupPath = join(backupDir, `bookmarks-${timestamp}.json`);
    const data = readFileSync(bookmarksPath, 'utf-8');
    writeFileSync(backupPath, data);
    return backupPath;
}
/** Restore bookmarks from backup */
export function restoreBackup(backupPath) {
    const chromeDir = getChromeDir();
    if (!chromeDir)
        throw new Error('Unsupported platform');
    const targetPath = join(chromeDir, 'Default', 'Bookmarks');
    const data = readFileSync(backupPath, 'utf-8');
    // Validate JSON
    JSON.parse(data);
    writeFileSync(targetPath, data);
}
//# sourceMappingURL=chrome.js.map