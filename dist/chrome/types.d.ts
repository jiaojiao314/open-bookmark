/**
 * Bookmark type definitions for open-bookmark
 */
/** Represents a single browser bookmark */
export interface Bookmark {
    id: string;
    name: string;
    url: string;
    folder: string;
    parentId: string;
    dateAdded: Date;
    dateModified: Date;
}
/** Bookmark collection with helper methods */
export interface BookmarkCollection {
    bookmarks: Bookmark[];
}
/** Extract domain from URL */
export declare function extractDomain(url: string): string;
/** Get top-level folder name */
export declare function getTopFolder(folder: string): string;
/** Check if URL is internal network */
export declare function isInternalURL(url: string): boolean;
/** Convert Chrome WebKit timestamp to Date */
export declare function webKitToDate(timestamp: string): Date;
//# sourceMappingURL=types.d.ts.map