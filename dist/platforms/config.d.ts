/**
 * Platform configuration for SKILL.md generation
 */
/** Platform configuration */
export interface PlatformConfig {
    name: string;
    description: string;
    skillDir: string;
    skillFileName: string;
    detectPaths: string[];
}
/** Supported platforms */
export declare const PLATFORMS: PlatformConfig[];
/** Get platform by name */
export declare function getPlatform(name: string): PlatformConfig | undefined;
/** Get all platform names */
export declare function getPlatformNames(): string[];
//# sourceMappingURL=config.d.ts.map