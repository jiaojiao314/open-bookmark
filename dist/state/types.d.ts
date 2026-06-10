/**
 * Workflow state type definitions for open-bookmark
 */
import type { UserProfile } from '../profile/types.js';
/** Bookmarks info */
export interface BookmarksInfo {
    snapshot: string;
    count: number;
    lastScan: Date;
}
/** Rules info */
export interface RulesInfo {
    file: string;
    count: number;
    lastGenerated: Date;
}
/** Backup info */
export interface BackupInfo {
    path: string;
    created: Date;
    bookmarksCount: number;
}
/** Workflow state */
export interface WorkflowState {
    version: string;
    phase: 'scan' | 'dialogue' | 'generate' | 'preview' | 'apply' | 'verify';
    workflow: 'full' | 'quick' | 'fix';
    autoTransition: boolean;
    profile: UserProfile;
    bookmarks: BookmarksInfo;
    rules: RulesInfo;
    backups: BackupInfo[];
    createdAt: Date;
    updatedAt: Date;
}
/** Create new workflow state with defaults */
export declare function newWorkflowState(): WorkflowState;
//# sourceMappingURL=types.d.ts.map