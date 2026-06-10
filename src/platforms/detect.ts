/**
 * Platform detection - detect which AI platforms are installed
 */

import { access } from 'node:fs/promises'
import { resolve } from 'node:path'
import { PLATFORMS } from './config.js'
import type { PlatformConfig } from './config.js'

/** Detected platform */
export interface DetectedPlatform {
  config: PlatformConfig
  path: string
}

/** Detect installed platforms */
export async function detectPlatforms(rootDir: string = process.cwd()): Promise<DetectedPlatform[]> {
  const detected: DetectedPlatform[] = []

  for (const platform of PLATFORMS) {
    for (const detectPath of platform.detectPaths) {
      try {
        const fullPath = resolve(rootDir, detectPath)
        await access(fullPath)
        detected.push({
          config: platform,
          path: fullPath
        })
        break // Found this platform, move to next
      } catch {
        // Path doesn't exist, continue
      }
    }
  }

  return detected
}

/** Check if a specific platform is installed */
export async function isPlatformInstalled(
  platformName: string,
  rootDir: string = process.cwd()
): Promise<boolean> {
  const platform = PLATFORMS.find(p => p.name === platformName)
  if (!platform) return false

  for (const detectPath of platform.detectPaths) {
    try {
      const fullPath = resolve(rootDir, detectPath)
      await access(fullPath)
      return true
    } catch {
      // Continue
    }
  }

  return false
}
