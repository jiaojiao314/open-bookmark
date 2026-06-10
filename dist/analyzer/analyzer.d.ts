/**
 * Deterministic analysis engine for bookmarks
 */
import type { Bookmark } from '../chrome/types.js';
/** Analysis result */
export interface AnalysisResult {
    summary: SummaryInfo;
    domains: DomainInfo[];
    folders: FolderInfo[];
    keywords: KeywordInfo[];
    patterns: PatternInfo;
    orphanCount: number;
    folderDomains: Record<string, DomainInfo[]>;
}
/** Summary info */
export interface SummaryInfo {
    totalBookmarks: number;
    uniqueDomains: number;
    topFolders: number;
    rootBookmarks: number;
}
/** Domain info */
export interface DomainInfo {
    domain: string;
    count: number;
}
/** Folder info */
export interface FolderInfo {
    name: string;
    count: number;
}
/** Keyword info */
export interface KeywordInfo {
    keyword: string;
    count: number;
}
/** Pattern info */
export interface PatternInfo {
    internalCount: number;
    githubCount: number;
    blogCount: number;
    blogDomains: DomainInfo[];
    aiCount: number;
    devopsCount: number;
}
/** Analyze bookmarks */
export declare function analyze(bookmarks: Bookmark[]): AnalysisResult;
//# sourceMappingURL=analyzer.d.ts.map