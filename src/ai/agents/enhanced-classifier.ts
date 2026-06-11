/**
 * Enhanced Classifier Agent - Generate hierarchical classification rules
 */

import type { Agent, AgentConfig, AgentResult, ClassificationResult, ScanResult, AnalysisResult } from './types.js'

/** Classifier Agent configuration */
const CLASSIFIER_CONFIG: AgentConfig = {
  name: 'Enhanced Classifier Agent',
  description: 'Generate hierarchical classification rules from analysis',
  maxRetries: 3,
  timeout: 30000
}

/** Infer user role from topics */
function inferUserRole(topics: Map<string, string[]>): string {
  const topicCounts: Record<string, number> = {}

  for (const [topic, bookmarkIds] of topics.entries()) {
    // Only count specific topics (not parent categories)
    if (!topic.includes('/')) {
      topicCounts[topic] = bookmarkIds.length
    }
  }

  const sorted = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])

  if (sorted.length === 0) return 'Unknown'

  const topTopic = sorted[0][0]

  const roleMap: Record<string, string> = {
    'DevOps': 'DevOps Engineer',
    'Frontend': 'Frontend Developer',
    'Backend': 'Backend Developer',
    'AI': 'AI/ML Engineer',
    'Data': 'Data Engineer/Scientist',
    'Security': 'Security Engineer',
    'Cloud': 'Cloud Engineer'
  }

  return roleMap[topTopic] || 'Software Engineer'
}

/** Infer tech stack from topics */
function inferTechStack(topics: Map<string, string[]>): string[] {
  const techStack: string[] = []

  for (const topic of topics.keys()) {
    // Extract technology names from hierarchical topics
    const parts = topic.split('/')
    if (parts.length > 1) {
      techStack.push(parts[1])
    } else {
      techStack.push(topic)
    }
  }

  return [...new Set(techStack)].slice(0, 15)
}

/** Generate hierarchical categories */
function generateCategories(
  scanResult: ScanResult,
  analysis: AnalysisResult
): ClassificationResult['categories'] {
  const categories: ClassificationResult['categories'] = []
  const processedBookmarks = new Set<string>()

  // Sort topics by specificity (more specific first)
  const sortedTopics = Array.from(analysis.topics.entries())
    .filter(([topic]) => topic !== 'General')
    .sort((a, b) => {
      // More specific (more slashes) first
      const aDepth = a[0].split('/').length
      const bDepth = b[0].split('/').length
      if (aDepth !== bDepth) return bDepth - aDepth
      // Then by bookmark count
      return b[1].length - a[1].length
    })

  // Generate categories from topics
  for (const [topic, bookmarkIds] of sortedTopics) {
    // Skip if too few bookmarks
    if (bookmarkIds.length < 2) continue

    // Skip if already processed
    const newBookmarkIds = bookmarkIds.filter(id => !processedBookmarks.has(id))
    if (newBookmarkIds.length < 2) continue

    // Mark as processed
    newBookmarkIds.forEach(id => processedBookmarks.add(id))

    // Find domains for this topic
    const domains: string[] = []
    for (const id of newBookmarkIds) {
      const bookmark = scanResult.bookmarks.find(b => b.id === id)
      if (bookmark && !domains.includes(bookmark.domain)) {
        domains.push(bookmark.domain)
      }
    }

    // Generate target path from topic
    const target = topic.replace(/\//g, '/')

    categories.push({
      name: topic,
      description: `${topic} related bookmarks`,
      domains: domains.slice(0, 10),
      keywords: [],
      urlPatterns: [],
      target,
      confidence: 0.8,
      priority: categories.length + 1,
      bookmarkIds: newBookmarkIds
    })
  }

  // Handle remaining unclassified bookmarks
  const unclassifiedIds = scanResult.bookmarks
    .map(b => b.id)
    .filter(id => !processedBookmarks.has(id))

  if (unclassifiedIds.length > 0) {
    categories.push({
      name: 'Other',
      description: 'Unclassified bookmarks',
      domains: [],
      keywords: [],
      urlPatterns: [],
      target: 'Other',
      confidence: 0.5,
      priority: categories.length + 1,
      bookmarkIds: unclassifiedIds
    })
  }

  return categories
}

/** Classifier Agent implementation */
export class EnhancedClassifierAgent implements Agent<{ scan: ScanResult; analysis: AnalysisResult }, ClassificationResult> {
  config = CLASSIFIER_CONFIG

  async execute(input: { scan: ScanResult; analysis: AnalysisResult }): Promise<AgentResult<ClassificationResult>> {
    const startTime = Date.now()

    try {
      const { scan, analysis } = input

      const categories = generateCategories(scan, analysis)
      const userRole = inferUserRole(analysis.topics)
      const techStack = inferTechStack(analysis.topics)

      // Calculate statistics
      const classifiedIds = new Set<string>()
      for (const cat of categories) {
        for (const id of cat.bookmarkIds) {
          classifiedIds.add(id)
        }
      }

      const totalClassified = classifiedIds.size
      const totalUnclassified = scan.statistics.total - totalClassified
      const averageConfidence = categories.length > 0
        ? categories.reduce((sum, c) => sum + c.confidence, 0) / categories.length
        : 0

      return {
        status: 'completed',
        data: {
          categories,
          conflictResolution: [],
          insights: {
            userRole,
            techStack,
            interests: techStack.slice(0, 5),
            suggestedStructure: `Based on your ${scan.statistics.total} bookmarks, I suggest organizing by: ${categories.slice(0, 10).map(c => c.name).join(', ')}`
          },
          statistics: {
            totalClassified,
            totalUnclassified,
            categoryCount: categories.length,
            averageConfidence
          }
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
