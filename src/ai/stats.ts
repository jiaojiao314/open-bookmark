/**
 * AI statistics helper - output stats for AI context
 */

import type { Bookmark } from '../chrome/types.js'
import { analyze } from '../analyzer/analyzer.js'

/** Print domain statistics as JSON */
export function printDomainStats(bookmarks: Bookmark[]): void {
  const analysis = analyze(bookmarks)
  console.log(JSON.stringify(analysis.domains, null, 2))
}

/** Print keyword statistics as JSON */
export function printKeywordStats(bookmarks: Bookmark[]): void {
  const analysis = analyze(bookmarks)
  console.log(JSON.stringify(analysis.keywords, null, 2))
}

/** Print pattern statistics as JSON */
export function printPatternStats(bookmarks: Bookmark[]): void {
  const analysis = analyze(bookmarks)
  console.log(JSON.stringify(analysis.patterns, null, 2))
}
