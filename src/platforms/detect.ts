/**
 * Platform detection - detect which AI platforms are installed
 */

import { access } from 'node:fs/promises'
import { homedir } from 'node:os'
import { resolve, join } from 'node:path'
import { PLATFORMS } from './config.js'
import type { PlatformConfig } from './config.js'

/** Detected platform */
export interface DetectedPlatform {
  config: PlatformConfig
  path: string
}

async function exists(path: string): Promise<boolean> {
  try {
    await access(path)
    return true
  } catch {
    return false
  }
}

/**
 * Detect installed platforms.
 *
 * When `project` is true, look for platform markers relative to `rootDir`
 * (project-level). Otherwise look for platform markers under the user's home
 * directory (global), which is the correct scope for a user-level tool like
 * bookmark management.
 */
export async function detectPlatforms(
  rootDir: string = process.cwd(),
  project = false
): Promise<DetectedPlatform[]> {
  const detected: DetectedPlatform[] = []
  const base = project ? rootDir : homedir()

  for (const platform of PLATFORMS) {
    for (const detectPath of platform.detectPaths) {
      const fullPath = project ? resolve(base, detectPath) : join(base, detectPath)
      if (await exists(fullPath)) {
        detected.push({ config: platform, path: fullPath })
        break // Found this platform, move to next
      }
    }
  }

  return detected
}

/** Check if a specific platform is installed */
export async function isPlatformInstalled(
  platformName: string,
  rootDir: string = process.cwd(),
  project = false
): Promise<boolean> {
  const platform = PLATFORMS.find(p => p.name === platformName)
  if (!platform) return false

  const base = project ? rootDir : homedir()
  for (const detectPath of platform.detectPaths) {
    const fullPath = project ? resolve(base, detectPath) : join(base, detectPath)
    if (await exists(fullPath)) return true
  }

  return false
}
