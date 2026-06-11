/**
 * Classifier Agent - Generate classification rules from analysis
 */

import type { Agent, AgentConfig, AgentResult, ClassificationResult, ScanResult, AnalysisResult } from './types.js'

/** Classifier Agent configuration */
const CLASSIFIER_CONFIG: AgentConfig = {
  name: 'Classifier Agent',
  description: 'Generate classification rules from analysis results',
  maxRetries: 3,
  timeout: 30000
}

/** Infer user role from topics */
function inferUserRole(topics: Map<string, string[]>): string {
  const topicCounts: Record<string, number> = {}
  
  for (const [topic, bookmarkIds] of topics.entries()) {
    topicCounts[topic] = bookmarkIds.length
  }

  const sorted = Object.entries(topicCounts).sort((a, b) => b[1] - a[1])
  
  if (sorted.length === 0) return 'Unknown'
  
  const topTopic = sorted[0][0]
  
  const roleMap: Record<string, string> = {
    'DevOps': 'DevOps Engineer',
    'Frontend': 'Frontend Developer',
    'Backend': 'Backend Developer',
    'Data': 'Data Engineer/Scientist',
    'Security': 'Security Engineer',
    'Cloud': 'Cloud Engineer'
  }

  return roleMap[topTopic] || 'Software Engineer'
}

/** Infer tech stack from domains and topics */
function inferTechStack(scanResult: ScanResult, analysis: AnalysisResult): string[] {
  const techStack: string[] = []
  
  // From domain clusters
  for (const domain of scanResult.domainClusters.keys()) {
    if (domain.includes('docker')) techStack.push('Docker')
    if (domain.includes('kubernetes') || domain.includes('k8s')) techStack.push('Kubernetes')
    if (domain.includes('react')) techStack.push('React')
    if (domain.includes('vue')) techStack.push('Vue')
    if (domain.includes('angular')) techStack.push('Angular')
    if (domain.includes('python')) techStack.push('Python')
    if (domain.includes('node')) techStack.push('Node.js')
  }

  // From topics
  for (const topic of analysis.topics.keys()) {
    if (!techStack.includes(topic)) {
      techStack.push(topic)
    }
  }

  return [...new Set(techStack)].slice(0, 10)
}

/** Generate categories from analysis */
function generateCategories(
  scanResult: ScanResult,
  analysis: AnalysisResult
): ClassificationResult['categories'] {
  const categories: ClassificationResult['categories'] = []
  const processedDomains = new Set<string>()

  // Group by topic
  for (const [topic, bookmarkIds] of analysis.topics.entries()) {
    if (topic === 'General' || bookmarkIds.length < 3) continue

    // Find domains for this topic
    const domains: string[] = []
    for (const id of bookmarkIds) {
      const bookmark = scanResult.bookmarks.find(b => b.id === id)
      if (bookmark && !processedDomains.has(bookmark.domain)) {
        domains.push(bookmark.domain)
        processedDomains.add(bookmark.domain)
      }
    }

    if (domains.length > 0) {
      categories.push({
        name: topic,
        description: `${topic} related bookmarks`,
        domains: domains.slice(0, 10),
        keywords: [],
        urlPatterns: [],
        target: topic,
        confidence: 0.8,
        priority: categories.length + 1,
        bookmarkIds
      })
    }
  }

  // Group remaining by large domain clusters
  for (const [domain, bookmarkIds] of scanResult.domainClusters.entries()) {
    if (bookmarkIds.length >= 10 && !processedDomains.has(domain)) {
      categories.push({
        name: `Domain: ${domain}`,
        description: `Bookmarks from ${domain}`,
        domains: [domain, `*.${domain}`],
        keywords: [],
        urlPatterns: [],
        target: domain.replace(/\./g, '-'),
        confidence: 0.9,
        priority: categories.length + 1,
        bookmarkIds
      })
    }
  }

  return categories
}

/** Classifier Agent implementation */
export class ClassifierAgent implements Agent<{ scan: ScanResult; analysis: AnalysisResult }, ClassificationResult> {
  config = CLASSIFIER_CONFIG

  async execute(input: { scan: ScanResult; analysis: AnalysisResult }): Promise<AgentResult<ClassificationResult>> {
    const startTime = Date.now()

    try {
      const { scan, analysis } = input

      const categories = generateCategories(scan, analysis)
      const userRole = inferUserRole(analysis.topics)
      const techStack = inferTechStack(scan, analysis)

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
            suggestedStructure: `Based on your ${scan.statistics.total} bookmarks, I suggest organizing by: ${categories.map(c => c.name).join(', ')}`
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
