/**
 * User dialogue module - CLI interactive prompts for profile confirmation
 */
import type { UserProfile } from './types.js';
import type { ProfileDraft } from './engine.js';
import type { AnalysisResult } from '../analyzer/analyzer.js';
/** Run the full dialogue flow */
export declare function runDialogue(draft: ProfileDraft, analysis: AnalysisResult): Promise<UserProfile>;
//# sourceMappingURL=dialogue.d.ts.map