/**
 * State manager - handles workflow state persistence and phase transitions
 */
import type { WorkflowState, BookmarksInfo, RulesInfo, BackupInfo } from './types.js';
/** State manager class */
export declare class StateManager {
    private stateDir;
    private statePath;
    private state;
    constructor(stateDir: string);
    /** Load state from file */
    load(): Promise<WorkflowState>;
    /** Save state to file */
    save(): Promise<void>;
    /** Get current state */
    getState(): WorkflowState | null;
    /** Update bookmarks info */
    updateBookmarks(info: BookmarksInfo): Promise<void>;
    /** Update rules info */
    updateRules(info: RulesInfo): Promise<void>;
    /** Add backup */
    addBackup(info: BackupInfo): Promise<void>;
    /** Update profile */
    updateProfile(profile: WorkflowState['profile']): Promise<void>;
    /** Transition to next phase */
    transitionTo(nextPhase: WorkflowState['phase']): Promise<boolean>;
    /** Check if transition is valid */
    canTransitionTo(nextPhase: WorkflowState['phase']): boolean;
    /** Get phase description */
    getPhaseDescription(): string;
    /** Get next steps */
    getNextSteps(): string[];
}
/** Check if state file exists */
export declare function stateFileExists(stateDir: string): Promise<boolean>;
//# sourceMappingURL=manager.d.ts.map