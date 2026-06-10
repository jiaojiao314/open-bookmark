/**
 * Rule generator - generates classification rules from analysis and profile
 */
import type { AnalysisResult } from '../analyzer/analyzer.js';
import type { UserProfile } from '../profile/types.js';
import type { Rule } from './types.js';
/** Generated rule collection with metadata */
export interface GeneratedRules {
    rules: Rule[];
    summary: RuleSummary;
}
/** Summary of generated rules */
export interface RuleSummary {
    totalRules: number;
    protectRules: number;
    domainRules: number;
    keywordRules: number;
    catchAllRules: number;
}
/** Generate all rules from analysis and profile */
export declare function generateRules(analysis: AnalysisResult, profile: UserProfile): GeneratedRules;
/** Validate rules */
export declare function validateRules(rules: Rule[]): ValidationResult;
/** Validation result */
export interface ValidationResult {
    valid: boolean;
    errors: string[];
    warnings: string[];
}
//# sourceMappingURL=generator.d.ts.map