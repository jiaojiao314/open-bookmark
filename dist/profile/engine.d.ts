/**
 * Profile inference engine - rule-based user profiling
 */
import type { AnalysisResult } from '../analyzer/analyzer.js';
import type { UserProfile } from './types.js';
/** Inferred profile with confidence scores */
export interface ProfileDraft {
    profile: UserProfile;
    inferences: ProfileInference[];
}
/** Single inference result */
export interface ProfileInference {
    field: string;
    value: string | string[];
    confidence: 'high' | 'medium' | 'low';
    reason: string;
}
/** Infer user profile from analysis results */
export declare function inferProfile(analysis: AnalysisResult): ProfileDraft;
/** Get protected paths suggestion based on folder analysis */
export declare function suggestProtectedPaths(analysis: AnalysisResult): string[];
/** Get catch-all target suggestion */
export declare function suggestCatchAllTarget(analysis: AnalysisResult): string;
/** Save profile to JSON file */
export declare function saveProfile(profile: UserProfile, filePath: string): Promise<void>;
/** Load profile from JSON file */
export declare function loadProfile(filePath: string): Promise<UserProfile | null>;
//# sourceMappingURL=engine.d.ts.map