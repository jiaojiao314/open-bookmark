/**
 * SKILL.md generation for AI platforms
 */
import type { PlatformConfig } from './config.js';
/** Generate SKILL.md content */
export declare function generateSkillContent(): string;
/** Save SKILL.md for a platform */
export declare function saveSkillForPlatform(platform: PlatformConfig, rootDir: string): Promise<string>;
/** Save SKILL.md for all detected platforms */
export declare function saveSkillForAllPlatforms(platforms: Array<{
    config: PlatformConfig;
}>, rootDir: string): Promise<string[]>;
//# sourceMappingURL=skill.d.ts.map