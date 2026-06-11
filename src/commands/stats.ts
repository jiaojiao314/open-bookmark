/**
 * Stats command - output bookmark statistics for AI
 */

import type { Bookmark } from '../chrome/types.js'
import { printDomainStats, printKeywordStats, printPatternStats } from '../ai/stats.js'

/** Stats command options */
export interface StatsOptions {
  domains?: boolean
  keywords?: boolean
  patterns?: boolean
}

/** Run stats command */
export async function statsCommand(options: StatsOptions): Promise<void> {
  const stateDir = process.cwd() + '/open-bookmark'
  const snapshotPath = stateDir + '/bookmarks-snapshot.json'

  // Load bookmarks
  let bookmarks: Bookmark[]
  try {
    const { readFile } = await import('node:fs/promises')
    const data = await readFile(snapshotPath, 'utf-8')
    bookmarks = JSON.parse(data).map((b: Record<string, unknown>) => ({
      ...b,
      dateAdded: new Date(b.dateAdded as string),
      dateModified: new Date(b.dateModified as string)
    }))
  } catch {
    console.error('❌ 未找到快照文件，请先运行 init 命令')
    process.exit(1)
  }

  if (options.domains) {
    printDomainStats(bookmarks)
  } else if (options.keywords) {
    printKeywordStats(bookmarks)
  } else if (options.patterns) {
    printPatternStats(bookmarks)
  } else {
    // Default: show all
    console.log('=== Domains ===')
    printDomainStats(bookmarks)
    console.log('\n=== Keywords ===')
    printKeywordStats(bookmarks)
    console.log('\n=== Patterns ===')
    printPatternStats(bookmarks)
  }
}
