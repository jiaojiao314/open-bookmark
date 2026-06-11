/**
 * Scanner Agent - Extract features from bookmarks
 */

import type { Agent, AgentConfig, AgentResult, ScanResult } from './types.js'
import type { Bookmark } from '../../chrome/types.js'
import { extractDomain } from '../../chrome/types.js'

/** Scanner Agent configuration */
const SCANNER_CONFIG: AgentConfig = {
  name: 'Scanner Agent',
  description: 'Extract features and patterns from bookmarks',
  maxRetries: 3,
  timeout: 30000
}

/** Extract path segments from URL */
function extractPathSegments(url: string): string[] {
  try {
    const parsed = new URL(url)
    return parsed.pathname.split('/').filter(Boolean)
  } catch {
    return []
  }
}

/** Extract top-level domain */
function extractTLD(domain: string): string {
  const parts = domain.split('.')
  return parts[parts.length - 1] || ''
}

/** Cluster bookmarks by domain */
function clusterByDomain(bookmarks: Bookmark[]): Map<string, string[]> {
  const clusters = new Map<string, string[]>()
  
  for (const b of bookmarks) {
    const domain = extractDomain(b.url)
    if (!domain) continue
    
    const existing = clusters.get(domain) || []
    existing.push(b.id)
    clusters.set(domain, existing)
  }
  
  return clusters
}

/** Scanner Agent implementation */
export class ScannerAgent implements Agent<Bookmark[], ScanResult> {
  config = SCANNER_CONFIG

  async execute(bookmarks: Bookmark[]): Promise<AgentResult<ScanResult>> {
    const startTime = Date.now()
    
    try {
      const processed = bookmarks.map(b => {
        const domain = extractDomain(b.url)
        return {
          id: b.id,
          name: b.name,
          url: b.url,
          domain,
          folder: b.folder,
          pathSegments: extractPathSegments(b.url),
          topLevelDomain: extractTLD(domain),
          isHttps: b.url.startsWith('https://'),
          hasPort: new URL(b.url).port !== '',
        }
      })

      const uniqueDomains = new Set(processed.map(b => b.domain))
      const uniqueTLDs = new Set(processed.map(b => b.topLevelDomain))
      const httpsCount = processed.filter(b => b.isHttps).length
      const httpCount = processed.filter(b => !b.isHttps).length
      const withPortCount = processed.filter(b => b.hasPort).length

      return {
        status: 'completed',
        data: {
          bookmarks: processed,
          statistics: {
            total: bookmarks.length,
            uniqueDomains: uniqueDomains.size,
            uniqueTLDs: uniqueTLDs.size,
            httpsCount,
            httpCount,
            withPortCount
          },
          domainClusters: clusterByDomain(bookmarks)
        },
        duration: Date.now() - startTime
      }
    } catch (error) {
      return {
        status: 'failed',
        error: error instanceof Error ? error.message : 'Unknown error',
        duration: Date.now() - startTime
      }
    }
  }
}
