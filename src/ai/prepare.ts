/**
 * AI data preparation - prepare bookmark data for AI analysis
 */

import type { Bookmark } from '../chrome/types.js'
import type { AnalysisResult } from '../analyzer/analyzer.js'
import { extractDomain } from '../chrome/types.js'
import { analyze } from '../analyzer/analyzer.js'

/** Prepare options */
export interface PrepareOptions {
  format?: 'ai-ready' | 'domains' | 'keywords'
  sample?: number
}

/** AI-ready bookmark sample */
export interface AIBookmarkSample {
  id: string
  name: string
  url: string
  domain: string
  folder: string
}

/** AI-ready output format */
export interface AIDataOutput {
  summary: {
    total: number
    uniqueDomains: number
    topFolders: number
  }
  domains: Array<{ domain: string; count: number }>
  keywords: Array<{ keyword: string; count: number }>
  samples: AIBookmarkSample[]
  existingFolders: string[]
}

/** Extract unique folder paths from bookmarks */
function extractExistingFolders(bookmarks: Bookmark[]): string[] {
  const folders = new Set<string>()
  for (const b of bookmarks) {
    if (b.folder) {
      // Add full path
      folders.add(b.folder)
      // Add parent paths
      const parts = b.folder.split('/')
      for (let i = 1; i <= parts.length; i++) {
        folders.add(parts.slice(0, i).join('/'))
      }
    }
  }
  return Array.from(folders).sort()
}

/** Prepare bookmarks for AI analysis */
export function prepareBookmarksForAI(
  bookmarks: Bookmark[],
  options: PrepareOptions = {}
): AIDataOutput | { domains: Array<{ domain: string; count: number }> } | { keywords: Array<{ keyword: string; count: number }> } {
  const analysis = analyze(bookmarks)

  if (options.format === 'domains') {
    return { domains: analysis.domains }
  }

  if (options.format === 'keywords') {
    return { keywords: analysis.keywords }
  }

  // Default: ai-ready format
  const samples = (options.sample ? bookmarks.slice(0, options.sample) : bookmarks).map(b => ({
    id: b.id,
    name: b.name,
    url: b.url,
    domain: extractDomain(b.url),
    folder: b.folder
  }))

  return {
    summary: {
      total: bookmarks.length,
      uniqueDomains: analysis.summary.uniqueDomains,
      topFolders: analysis.summary.topFolders
    },
    domains: analysis.domains,
    keywords: analysis.keywords,
    samples,
    existingFolders: extractExistingFolders(bookmarks)
  }
}
