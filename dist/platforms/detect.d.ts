/**
 * Platform detection - detect which AI platforms are installed
 */
import type { PlatformConfig } from './config.js';
/** Detected platform */
export interface DetectedPlatform {
    config: PlatformConfig;
    path: string;
}
/** Detect installed platforms */
export declare function detectPlatforms(rootDir?: string): Promise<DetectedPlatform[]>;
/** Check if a specific platform is installed */
export declare function isPlatformInstalled(platformName: string, rootDir?: string): Promise<boolean>;
//# sourceMappingURL=detect.d.ts.map