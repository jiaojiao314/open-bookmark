/**
 * Deterministic analysis engine for bookmarks
 */

import type { Bookmark } from '../chrome/types.js'
import { extractDomain, getTopFolder, isInternalURL } from '../chrome/types.js'
import { BLOG_DOMAINS, AI_DOMAINS, DEVOPS_DOMAINS, DOC_DOMAINS, CODE_DOMAINS } from '../config/domains.js'

/** Analysis result */
export interface AnalysisResult {
  summary: SummaryInfo
  domains: DomainInfo[]
  folders: FolderInfo[]
  keywords: KeywordInfo[]
  patterns: PatternInfo
  orphanCount: number
  folderDomains: Record<string, DomainInfo[]>
}

/** Summary info */
export interface SummaryInfo {
  totalBookmarks: number
  uniqueDomains: number
  topFolders: number
  rootBookmarks: number
}

/** Domain info */
export interface DomainInfo {
  domain: string
  count: number
}

/** Folder info */
export interface FolderInfo {
  name: string
  count: number
}

/** Keyword info */
export interface KeywordInfo {
  keyword: string
  count: number
}

/** Pattern info */
export interface PatternInfo {
  internalCount: number
  githubCount: number
  blogCount: number
  blogDomains: DomainInfo[]
  aiCount: number
  devopsCount: number
  codeCount: number
  docCount: number
}

/** Analyze bookmarks */
export function analyze(bookmarks: Bookmark[]): AnalysisResult {
  // Domain counts
  const domainCounts = new Map<string, number>()
  for (const b of bookmarks) {
    const domain = extractDomain(b.url)
    if (domain) {
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1)
    }
  }
  
  // Folder counts
  const folderCounts = new Map<string, number>()
  for (const b of bookmarks) {
    const folder = getTopFolder(b.folder)
    folderCounts.set(folder, (folderCounts.get(folder) || 0) + 1)
  }
  
  // Summary
  const summary: SummaryInfo = {
    totalBookmarks: bookmarks.length,
    uniqueDomains: domainCounts.size,
    topFolders: folderCounts.size,
    rootBookmarks: folderCounts.get('(root)') || 0
  }
  
  // Domains (sorted by count, top 30)
  const domains = sortedDomainInfos(domainCounts, 30)
  
  // Folders (sorted by count)
  const folders: FolderInfo[] = Array.from(folderCounts.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count)
  
  // Keywords
  const keywords = extractKeywords(bookmarks)
  
  // Patterns
  const patterns = detectPatterns(bookmarks, domainCounts)
  
  // Folder-domain distribution
  const folderDomains: Record<string, DomainInfo[]> = {}
  for (const b of bookmarks) {
    const folder = getTopFolder(b.folder)
    const domain = extractDomain(b.url)
    if (!domain) continue
    
    if (!folderDomains[folder]) {
      folderDomains[folder] = []
    }
    const existing = folderDomains[folder].find(d => d.domain === domain)
    if (existing) {
      existing.count++
    } else {
      folderDomains[folder].push({ domain, count: 1 })
    }
  }
  
  // Sort folder domains
  for (const folder of Object.keys(folderDomains)) {
    folderDomains[folder].sort((a, b) => b.count - a.count)
  }
  
  return {
    summary,
    domains,
    folders,
    keywords,
    patterns,
    orphanCount: 0,
    folderDomains
  }
}

/** Sort domain infos by count */
function sortedDomainInfos(counts: Map<string, number>, limit: number): DomainInfo[] {
  const infos: DomainInfo[] = Array.from(counts.entries())
    .map(([domain, count]) => ({ domain, count }))
    .sort((a, b) => b.count - a.count)
  
  return limit > 0 ? infos.slice(0, limit) : infos
}

/** Extract keywords from bookmark titles */
function extractKeywords(bookmarks: Bookmark[]): KeywordInfo[] {
  const stopWords = new Set([
    'the', 'a', 'an', 'and', 'or', 'but', 'in', 'on', 'at', 'to', 'for',
    'of', 'with', 'by', 'from', 'is', 'it', 'that', 'this', 'was', 'are',
    'be', 'has', 'had', 'have', 'do', 'does', 'did', 'will', 'would',
    'could', 'should', 'may', 'might',
    '的', '了', '在', '是', '我', '有', '和', '就', '不', '人', '都', '一'
  ])
  
  const wordCounts = new Map<string, number>()
  
  for (const b of bookmarks) {
    const words = tokenize(b.name)
    for (const w of words) {
      const lower = w.toLowerCase()
      if (lower.length < 2 || stopWords.has(lower)) continue
      wordCounts.set(lower, (wordCounts.get(lower) || 0) + 1)
    }
  }
  
  return Array.from(wordCounts.entries())
    .filter(([_, count]) => count >= 3)
    .map(([keyword, count]) => ({ keyword, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 30)
}

/** Tokenize string into words */
function tokenize(s: string): string[] {
  const tokens: string[] = []
  let current = ''
  
  for (const char of s) {
    const code = char.charCodeAt(0)
    if (code >= 0x4e00 && code <= 0x9fff) {
      // Chinese character
      if (current) {
        tokens.push(current)
        current = ''
      }
      tokens.push(char)
    } else if (/[\s\-_/,.\|]/.test(char)) {
      if (current) {
        tokens.push(current)
        current = ''
      }
    } else {
      current += char
    }
  }
  
  if (current) tokens.push(current)
  return tokens
}

/** Detect URL patterns */
function detectPatterns(bookmarks: Bookmark[], domainCounts: Map<string, number>): PatternInfo {
  let internalCount = 0
  let githubCount = 0
  let blogCount = 0
  let aiCount = 0
  let devopsCount = 0
  let codeCount = 0
  let docCount = 0
  
  for (const b of bookmarks) {
    const domain = extractDomain(b.url)
    
    if (isInternalURL(b.url)) internalCount++
    if (domain.includes('github.com') || domain.includes('gitee.com')) githubCount++
    
    if (BLOG_DOMAINS.some(d => domain.includes(d))) blogCount++
    if (AI_DOMAINS.some(d => domain.includes(d))) aiCount++
    if (DEVOPS_DOMAINS.some(d => domain.includes(d))) devopsCount++
    if (CODE_DOMAINS.some(d => domain.includes(d))) codeCount++
    if (DOC_DOMAINS.some(d => domain.includes(d))) docCount++
  }
  
  // Blog domains breakdown
  const blogDomainCounts = new Map<string, number>()
  for (const b of bookmarks) {
    const domain = extractDomain(b.url)
    if (BLOG_DOMAINS.some(d => domain.includes(d))) {
      blogDomainCounts.set(domain, (blogDomainCounts.get(domain) || 0) + 1)
    }
  }
  
  return {
    internalCount,
    githubCount,
    blogCount,
    blogDomains: sortedDomainInfos(blogDomainCounts, 10),
    aiCount,
    devopsCount,
    codeCount,
    docCount
  }
}
