/**
 * Smart classifier based on knowledge graph
 */

import type { Bookmark } from '../chrome/types.js'
import type { BookmarkKnowledgeGraph, GraphNode, DomainNode, TopicNode } from './types.js'
import type { Rule } from '../rules/types.js'
import { extractDomain } from '../chrome/types.js'

/** Classification result */
export interface ClassificationResult {
  bookmarkId: string
  bookmarkName: string
  targetFolder: string
  reason: string
  confidence: number
  source: 'domain' | 'topic' | 'keyword' | 'catch-all'
}

/** Classification conflict */
export interface ClassificationConflict {
  bookmarkId: string
  bookmarkName: string
  candidates: ClassificationResult[]
}

/** Classify bookmarks using knowledge graph */
export function classifyBookmarks(
  bookmarks: Bookmark[],
  graph: BookmarkKnowledgeGraph,
  options: {
    catchAllTarget?: string
    minConfidence?: number
  } = {}
): {
  results: ClassificationResult[]
  conflicts: ClassificationConflict[]
} {
  const { catchAllTarget = '99-人工待确认', minConfidence = 0.5 } = options
  const results: ClassificationResult[] = []
  const conflicts: ClassificationConflict[] = []

  for (const bookmark of bookmarks) {
    const candidates = classifyBookmark(bookmark, graph, catchAllTarget)

    if (candidates.length === 0) {
      // No classification found, use catch-all
      results.push({
        bookmarkId: bookmark.id,
        bookmarkName: bookmark.name,
        targetFolder: catchAllTarget,
        reason: 'No matching rule found',
        confidence: 0,
        source: 'catch-all'
      })
    } else if (candidates.length === 1) {
      // Single classification
      results.push(candidates[0])
    } else {
      // Multiple classifications - conflict
      const highConfidence = candidates.filter(c => c.confidence >= minConfidence)

      if (highConfidence.length === 1) {
        // Only one high confidence
        results.push(highConfidence[0])
      } else if (highConfidence.length > 1) {
        // Multiple high confidence - conflict
        conflicts.push({
          bookmarkId: bookmark.id,
          bookmarkName: bookmark.name,
          candidates: highConfidence
        })
      } else {
        // No high confidence, use highest
        results.push(candidates[0])
      }
    }
  }

  return { results, conflicts }
}

/** Classify a single bookmark */
function classifyBookmark(
  bookmark: Bookmark,
  graph: BookmarkKnowledgeGraph,
  catchAllTarget: string
): ClassificationResult[] {
  const candidates: ClassificationResult[] = []

  // 1. Domain-based classification
  const domain = extractDomain(bookmark.url)
  if (domain) {
    const domainNode = graph.nodes.find(
      n => n.type === 'domain' && n.name === domain
    ) as DomainNode | undefined

    if (domainNode) {
      // Find topic associated with this domain
      const topicEdge = graph.edges.find(
        e => e.source === domainNode.id && e.type === 'belongs_to' && e.target.startsWith('topic:')
      )

      if (topicEdge) {
        const topicNode = graph.nodes.find(
          n => n.id === topicEdge.target
        ) as TopicNode | undefined

        if (topicNode) {
          candidates.push({
            bookmarkId: bookmark.id,
            bookmarkName: bookmark.name,
            targetFolder: topicNode.name,
            reason: `Domain ${domain} belongs to topic ${topicNode.name}`,
            confidence: 0.8,
            source: 'domain'
          })
        }
      }
    }
  }

  // 2. Topic-based classification
  const bookmarkNode = graph.nodes.find(
    n => n.type === 'bookmark' && n.id === `bookmark:${bookmark.id}`
  )

  if (bookmarkNode) {
    const topicEdges = graph.edges.filter(
      e => e.source === bookmarkNode.id && e.type === 'belongs_to' && e.target.startsWith('topic:')
    )

    for (const edge of topicEdges) {
      const topicNode = graph.nodes.find(
        n => n.id === edge.target
      ) as TopicNode | undefined

      if (topicNode) {
        candidates.push({
          bookmarkId: bookmark.id,
          bookmarkName: bookmark.name,
          targetFolder: topicNode.name,
          reason: `Bookmark belongs to topic ${topicNode.name}`,
          confidence: edge.weight,
          source: 'topic'
        })
      }
    }
  }

  // 3. Keyword-based classification
  const keywordRules = extractKeywordRules(graph)
  for (const rule of keywordRules) {
    if (matchesKeyword(bookmark, rule.keywords)) {
      candidates.push({
        bookmarkId: bookmark.id,
        bookmarkName: bookmark.name,
        targetFolder: rule.target,
        reason: `Matches keywords: ${rule.keywords.join(', ')}`,
        confidence: 0.6,
        source: 'keyword'
      })
    }
  }

  return candidates
}

/** Extract keyword rules from knowledge graph */
function extractKeywordRules(graph: BookmarkKnowledgeGraph): Array<{
  keywords: string[]
  target: string
}> {
  const rules: Array<{ keywords: string[]; target: string }> = []

  // Extract from topic nodes
  for (const node of graph.nodes) {
    if (node.type === 'topic') {
      const topicNode = node as TopicNode
      rules.push({
        keywords: [topicNode.name.toLowerCase(), ...topicNode.tags],
        target: topicNode.name
      })
    }
  }

  return rules
}

/** Check if bookmark matches keywords */
function matchesKeyword(bookmark: Bookmark, keywords: string[]): boolean {
  const nameLower = bookmark.name.toLowerCase()
  const urlLower = bookmark.url.toLowerCase()

  return keywords.some(keyword =>
    nameLower.includes(keyword) || urlLower.includes(keyword)
  )
}

/** Generate classification rules from knowledge graph */
export function generateClassificationRules(
  graph: BookmarkKnowledgeGraph
): Rule[] {
  const rules: Rule[] = []

  // 1. Domain rules
  const domainNodes = graph.nodes.filter(n => n.type === 'domain') as DomainNode[]
  for (const domain of domainNodes) {
    if (domain.bookmarkCount >= 5) {
      // Find associated topic
      const topicEdge = graph.edges.find(
        e => e.source === domain.id && e.type === 'belongs_to' && e.target.startsWith('topic:')
      )

      if (topicEdge) {
        const topicNode = graph.nodes.find(
          n => n.id === topicEdge.target
        ) as TopicNode | undefined

        if (topicNode) {
          rules.push({
            name: `domain-${domain.name.replace(/\./g, '-')}`,
            match: {
              domain: [domain.name]
            },
            action: 'move',
            target: topicNode.name,
            reason: `Domain ${domain.name} belongs to topic ${topicNode.name}`,
            source: 'generated'
          })
        }
      }
    }
  }

  // 2. Topic rules
  const topicNodes = graph.nodes.filter(n => n.type === 'topic') as TopicNode[]
  for (const topic of topicNodes) {
    if (topic.relatedDomains.length > 0) {
      rules.push({
        name: `topic-${topic.name.toLowerCase().replace(/\s+/g, '-')}`,
        match: {
          domain: topic.relatedDomains
        },
        action: 'move',
        target: topic.name,
        reason: `Topic: ${topic.name}`,
        source: 'generated'
      })
    }
  }

  // 3. Catch-all rule
  rules.push({
    name: 'catch-all',
    match: {
      matchAll: true
    },
    action: 'move',
    target: '99-人工待确认',
    reason: 'No matching rule found',
    source: 'generated'
  })

  return rules
}

/** Get classification summary */
export function getClassificationSummary(
  results: ClassificationResult[]
): {
  total: number
  bySource: Record<string, number>
  byTarget: Record<string, number>
} {
  const bySource: Record<string, number> = {}
  const byTarget: Record<string, number> = {}

  for (const result of results) {
    bySource[result.source] = (bySource[result.source] || 0) + 1
    byTarget[result.targetFolder] = (byTarget[result.targetFolder] || 0) + 1
  }

  return {
    total: results.length,
    bySource,
    byTarget
  }
}
