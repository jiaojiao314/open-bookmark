/**
 * Semantic analysis engine for bookmarks
 */

import type { Bookmark } from '../chrome/types.js'
import type { BookmarkAnalysis, BatchAnalysis, TopicCluster, BookmarkRelationship } from './types.js'
import type { LLMInterface } from './llm.js'
import { buildBookmarkAnalysisPrompt, parseBookmarkAnalysisResponse } from './llm.js'

/** Analyze a single bookmark */
export async function analyzeBookmark(
  bookmark: Bookmark,
  llm: LLMInterface
): Promise<BookmarkAnalysis> {
  const prompt = buildBookmarkAnalysisPrompt({
    name: bookmark.name,
    url: bookmark.url,
    folder: bookmark.folder
  })

  const response = await llm.analyze(prompt)
  const parsed = parseBookmarkAnalysisResponse(response.content)

  if (!parsed) {
    // Fallback if LLM fails
    return {
      bookmarkId: bookmark.id,
      summary: bookmark.name,
      tags: [],
      topic: 'unknown',
      category: 'unknown',
      confidence: 0
    }
  }

  return {
    bookmarkId: bookmark.id,
    summary: parsed.summary,
    tags: parsed.tags,
    topic: parsed.topic,
    category: parsed.category,
    confidence: parsed.confidence
  }
}

/** Analyze bookmarks in batch */
export async function analyzeBookmarksBatch(
  bookmarks: Bookmark[],
  llm: LLMInterface,
  batchSize: number = 10
): Promise<BatchAnalysis> {
  const analyses: BookmarkAnalysis[] = []
  const topics = new Map<string, TopicCluster>()
  const relationships: BookmarkRelationship[] = []

  // Process in batches
  for (let i = 0; i < bookmarks.length; i += batchSize) {
    const batch = bookmarks.slice(i, i + batchSize)
    const batchAnalyses = await Promise.all(
      batch.map(bookmark => analyzeBookmark(bookmark, llm))
    )
    analyses.push(...batchAnalyses)

    // Build topic clusters
    for (const analysis of batchAnalyses) {
      if (analysis.topic && analysis.topic !== 'unknown') {
        let cluster = topics.get(analysis.topic)
        if (!cluster) {
          cluster = {
            topic: analysis.topic,
            bookmarks: [],
            domains: [],
            confidence: analysis.confidence
          }
          topics.set(analysis.topic, cluster)
        }
        cluster.bookmarks.push(analysis.bookmarkId)
      }
    }
  }

  // Build relationships (limit to avoid stack overflow)
  const maxRelationships = 10000
  const topicGroups = new Map<string, BookmarkAnalysis[]>()
  const domainGroups = new Map<string, BookmarkAnalysis[]>()

  // Group by topic
  for (const analysis of analyses) {
    if (analysis.topic && analysis.topic !== 'unknown') {
      const group = topicGroups.get(analysis.topic) || []
      group.push(analysis)
      topicGroups.set(analysis.topic, group)
    }
  }

  // Group by domain
  for (const analysis of analyses) {
    const bookmark = bookmarks.find(bk => bk.id === analysis.bookmarkId)
    if (bookmark) {
      const domain = extractDomain(bookmark.url)
      if (domain) {
        const group = domainGroups.get(domain) || []
        group.push(analysis)
        domainGroups.set(domain, group)
      }
    }
  }

  // Generate topic relationships (limited)
  for (const [topic, group] of topicGroups.entries()) {
    if (relationships.length >= maxRelationships) break
    for (let i = 0; i < group.length && relationships.length < maxRelationships; i++) {
      for (let j = i + 1; j < group.length && relationships.length < maxRelationships; j++) {
        relationships.push({
          source: group[i].bookmarkId,
          target: group[j].bookmarkId,
          type: 'same_topic',
          weight: 0.8
        })
      }
    }
  }

  // Generate domain relationships (limited)
  for (const [domain, group] of domainGroups.entries()) {
    if (relationships.length >= maxRelationships) break
    for (let i = 0; i < group.length && relationships.length < maxRelationships; i++) {
      for (let j = i + 1; j < group.length && relationships.length < maxRelationships; j++) {
        relationships.push({
          source: group[i].bookmarkId,
          target: group[j].bookmarkId,
          type: 'same_domain',
          weight: 0.6
        })
      }
    }
  }

  return {
    bookmarks: analyses,
    topics: Array.from(topics.values()),
    relationships
  }
}

/** Extract domain from URL */
function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    return parsed.hostname
  } catch {
    return ''
  }
}

/** Build analysis prompt for multiple bookmarks */
export function buildBatchAnalysisPrompt(bookmarks: Bookmark[]): string {
  const bookmarkList = bookmarks.map((b, i) => 
    `${i + 1}. ${b.name} (${b.url})`
  ).join('\n')

  return `Analyze these bookmarks and provide structured information for each:

${bookmarkList}

For each bookmark, provide:
1. summary: A 1-2 sentence description
2. tags: 3-5 relevant keyword tags
3. topic: The main topic or subject area
4. category: The category (e.g., "documentation", "tool", "tutorial", "reference")
5. confidence: Your confidence level (0-1)

Also identify:
- topics: Group bookmarks by topic
- relationships: Identify related bookmarks (same topic, same domain, related content)

Respond in JSON format:
{
  "bookmarks": [
    {
      "bookmarkId": "1",
      "summary": "...",
      "tags": ["...", "..."],
      "topic": "...",
      "category": "...",
      "confidence": 0.8
    }
  ],
  "topics": [
    {
      "topic": "...",
      "bookmarkIds": ["1", "2"],
      "domains": ["example.com"],
      "confidence": 0.8
    }
  ],
  "relationships": [
    {
      "source": "1",
      "target": "2",
      "type": "same_topic",
      "weight": 0.8
    }
  ]
}`
}

/** Parse batch analysis response */
export function parseBatchAnalysisResponse(response: string): BatchAnalysis | null {
  try {
    const jsonMatch = response.match(/\{[\s\S]*\}/)
    if (!jsonMatch) return null

    const data = JSON.parse(jsonMatch[0])

    return {
      bookmarks: Array.isArray(data.bookmarks) ? data.bookmarks : [],
      topics: Array.isArray(data.topics) ? data.topics : [],
      relationships: Array.isArray(data.relationships) ? data.relationships : []
    }
  } catch {
    return null
  }
}
