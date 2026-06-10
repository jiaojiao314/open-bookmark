/**
 * Executor - handles preview, apply, verify, and rollback operations
 */

import type { Bookmark } from '../chrome/types.js'
import type { Rule } from '../rules/types.js'
import { findMatchingRule, findConflicts } from '../rules/types.js'
import { extractDomain } from '../chrome/types.js'

/** Preview result */
export interface PreviewResult {
  totalBookmarks: number
  matchedBookmarks: number
  unmatchedBookmarks: number
  conflicts: ConflictInfo[]
  moves: MoveInfo[]
  skips: number
}

/** Move info */
export interface MoveInfo {
  bookmarkId: string
  bookmarkName: string
  bookmarkUrl: string
  currentFolder: string
  targetFolder: string
  ruleName: string
}

/** Conflict info */
export interface ConflictInfo {
  bookmarkId: string
  bookmarkName: string
  ruleNames: string[]
}

/** Apply result */
export interface ApplyResult {
  success: boolean
  moved: number
  skipped: number
  errors: ApplyError[]
  backupPath?: string
}

/** Apply error */
export interface ApplyError {
  bookmarkId: string
  bookmarkName: string
  error: string
}

/** Verify result */
export interface VerifyResult {
  valid: boolean
  issues: VerifyIssue[]
  stats: VerifyStats
}

/** Verify issue */
export interface VerifyIssue {
  type: 'count_mismatch' | 'protected_moved' | 'bookmark_missing'
  message: string
  bookmarkId?: string
}

/** Verify stats */
export interface VerifyStats {
  expectedCount: number
  actualCount: number
  movedCount: number
  protectedCount: number
}

/** Preview rule execution */
export function preview(bookmarks: Bookmark[], rules: Rule[]): PreviewResult {
  const moves: MoveInfo[] = []
  const conflictMap = findConflicts(bookmarks, rules)

  for (const bookmark of bookmarks) {
    const rule = findMatchingRule(bookmark, rules)
    if (!rule) continue

    if (rule.action === 'skip') {
      // Protected, skip
      continue
    }

    if (rule.action === 'move' && rule.target) {
      const targetFolder = rule.subfolder
        ? `${rule.target}/${rule.subfolder}`
        : rule.target

      moves.push({
        bookmarkId: bookmark.id,
        bookmarkName: bookmark.name,
        bookmarkUrl: bookmark.url,
        currentFolder: bookmark.folder,
        targetFolder,
        ruleName: rule.name
      })
    }
  }

  // Build conflict info
  const conflicts: ConflictInfo[] = []
  for (const [bookmarkId, ruleNames] of conflictMap.entries()) {
    const bookmark = bookmarks.find(b => b.id === bookmarkId)
    if (bookmark) {
      conflicts.push({
        bookmarkId,
        bookmarkName: bookmark.name,
        ruleNames
      })
    }
  }

  return {
    totalBookmarks: bookmarks.length,
    matchedBookmarks: moves.length,
    unmatchedBookmarks: bookmarks.length - moves.length,
    conflicts,
    moves,
    skips: bookmarks.length - moves.length
  }
}

/** Apply rules to bookmarks (returns modified bookmarks) */
export function apply(bookmarks: Bookmark[], rules: Rule[]): {
  bookmarks: Bookmark[]
  result: ApplyResult
} {
  const errors: ApplyError[] = []
  let moved = 0
  let skipped = 0

  const modifiedBookmarks = bookmarks.map(bookmark => {
    const rule = findMatchingRule(bookmark, rules)
    if (!rule) {
      return bookmark
    }

    if (rule.action === 'skip') {
      skipped++
      return bookmark
    }

    if (rule.action === 'move' && rule.target) {
      const targetFolder = rule.subfolder
        ? `${rule.target}/${rule.subfolder}`
        : rule.target

      moved++
      return {
        ...bookmark,
        folder: targetFolder,
        dateModified: new Date()
      }
    }

    return bookmark
  })

  return {
    bookmarks: modifiedBookmarks,
    result: {
      success: errors.length === 0,
      moved,
      skipped,
      errors
    }
  }
}

/** Verify bookmarks after apply */
export function verify(
  originalBookmarks: Bookmark[],
  modifiedBookmarks: Bookmark[],
  protectedPaths: string[]
): VerifyResult {
  const issues: VerifyIssue[] = []

  // Check count consistency
  if (originalBookmarks.length !== modifiedBookmarks.length) {
    issues.push({
      type: 'count_mismatch',
      message: `书签数量不一致: 原始 ${originalBookmarks.length}, 修改后 ${modifiedBookmarks.length}`
    })
  }

  // Check protected paths
  for (const bookmark of modifiedBookmarks) {
    const isProtected = protectedPaths.some(path =>
      bookmark.folder.startsWith(path)
    )
    if (isProtected) {
      // Check if it was in protected path originally
      const original = originalBookmarks.find(b => b.id === bookmark.id)
      if (original && !original.folder.startsWith(bookmark.folder.split('/')[0])) {
        issues.push({
          type: 'protected_moved',
          message: `受保护书签被移动: ${bookmark.name}`,
          bookmarkId: bookmark.id
        })
      }
    }
  }

  // Count stats
  const movedCount = modifiedBookmarks.filter((b, i) =>
    b.folder !== originalBookmarks[i]?.folder
  ).length

  return {
    valid: issues.length === 0,
    issues,
    stats: {
      expectedCount: originalBookmarks.length,
      actualCount: modifiedBookmarks.length,
      movedCount,
      protectedCount: protectedPaths.length
    }
  }
}

/** Create backup of bookmarks */
export async function createBackup(
  bookmarks: Bookmark[],
  backupDir: string
): Promise<string> {
  const { writeFile, mkdir } = await import('node:fs/promises')
  const { join } = await import('node:path')

  // Ensure backup directory exists
  await mkdir(backupDir, { recursive: true })

  // Generate backup filename with timestamp
  const timestamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19)
  const backupPath = join(backupDir, `${timestamp}.json`)

  // Write backup
  await writeFile(backupPath, JSON.stringify(bookmarks, null, 2), 'utf-8')

  return backupPath
}

/** Load backup bookmarks */
export async function loadBackup(backupPath: string): Promise<Bookmark[]> {
  const { readFile } = await import('node:fs/promises')

  try {
    const content = await readFile(backupPath, 'utf-8')
    const data = JSON.parse(content)

    // Convert date strings back to Date objects
    return data.map((b: Record<string, unknown>) => ({
      ...b,
      dateAdded: new Date(b.dateAdded as string),
      dateModified: new Date(b.dateModified as string)
    })) as Bookmark[]
  } catch {
    return []
  }
}
