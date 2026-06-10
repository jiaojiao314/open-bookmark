/**
 * Rule serializer - handles YAML serialization with comments
 */
import type { Rule } from './types.js';
import type { GeneratedRules } from './generator.js';
/** Serialize rules to YAML with comments */
export declare function serializeRules(generated: GeneratedRules): string;
/** Serialize rules to plain YAML (without comments) */
export declare function serializeRulesPlain(rules: Rule[]): string;
/** Save rules to YAML file */
export declare function saveRules(generated: GeneratedRules, filePath: string): Promise<void>;
/** Load rules from YAML file */
export declare function loadRules(filePath: string): Promise<Rule[]>;
//# sourceMappingURL=serializer.d.ts.map