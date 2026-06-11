/**
 * Analyzer Agent - Semantic analysis of bookmarks
 */

import type { Agent, AgentConfig, AgentResult, AnalysisResult, ScanResult } from './types.js'

/** Analyzer Agent configuration */
const ANALYZER_CONFIG: AgentConfig = {
  name: 'Analyzer Agent',
  description: 'Perform semantic analysis on scanned bookmarks',
  maxRetries: 3,
  timeout: 60000
}

/** Known topic patterns */
const TOPIC_PATTERNS: Record<string, string[]> = {
  'DevOps': ['docker', 'kubernetes', 'k8s', 'jenkins', 'ci/cd', 'terraform', 'ansible', 'prometheus', 'grafana'],
  'Frontend': ['react', 'vue', 'angular', 'css', 'javascript', 'typescript', 'webpack', 'vite'],
  'Backend': ['api', 'rest', 'graphql', 'database', 'sql', 'mongodb', 'redis', 'node', 'express', 'django', 'flask'],
  'Data': ['python', 'pandas', 'numpy', 'machine learning', 'ml', 'ai', 'data', 'analytics'],
  'Security': ['auth', 'oauth', 'jwt', 'encryption', 'security', 'ssl', 'https'],
  'Cloud': ['aws', 'azure', 'gcp', 'cloud', 'serverless', 'lambda'],
  'Documentation': ['docs', 'documentation', 'reference', 'api', 'guide', 'tutorial'],
  'Blog': ['blog', 'article', 'post', 'medium', 'dev.to', 'csdn', 'cnblogs', 'juejin']
}

/** Detect content type from URL and name */
function detectContentType(url: string, name: string): string {
  const lowerUrl = url.toLowerCase()
  const lowerName = name.toLowerCase()

  if (lowerUrl.includes('/docs/') || lowerUrl.includes('/documentation/') || lowerName.includes('文档')) {
    return 'documentation'
  }
  if (lowerUrl.includes('/blog/') || lowerUrl.includes('/article/') || lowerName.includes('博客')) {
    return 'blog'
  }
  if (lowerUrl.includes('/api/') || lowerUrl.includes('/reference/')) {
    return 'api-reference'
  }
  if (lowerUrl.includes('/tutorial/') || lowerUrl.includes('/guide/') || lowerName.includes('教程')) {
    return 'tutorial'
  }
  if (lowerUrl.includes('github.com') || lowerUrl.includes('gitlab.com')) {
    return 'repository'
  }
  if (lowerName.includes('工具') || lowerName.includes('tool')) {
    return 'tool'
  }

  return 'general'
}

/** Detect topic from bookmark */
function detectTopic(url: string, name: string): string[] {
  const lowerUrl = url.toLowerCase()
  const lowerName = name.toLowerCase()
  const topics: string[] = []

  for (const [topic, keywords] of Object.entries(TOPIC_PATTERNS)) {
    if (keywords.some(kw => lowerUrl.includes(kw) || lowerName.includes(kw))) {
      topics.push(topic)
    }
  }

  return topics.length > 0 ? topics : ['General']
}

/** Analyzer Agent implementation */
export class AnalyzerAgent implements Agent<ScanResult, AnalysisResult> {
  config = ANALYZER_CONFIG

  async execute(scanResult: ScanResult): Promise<AgentResult<AnalysisResult>> {
    const startTime = Date.now()

    try {
      const contentTypes = new Map<string, string[]>()
      const topics = new Map<string, string[]>()
      const complexity = new Map<string, 'simple' | 'moderate' | 'complex'>()
      const semanticGroups: AnalysisResult['semanticGroups'] = []

      // Analyze each bookmark
      for (const bookmark of scanResult.bookmarks) {
        // Content type
        const contentType = detectContentType(bookmark.url, bookmark.name)
        const typeList = contentTypes.get(contentType) || []
        typeList.push(bookmark.id)
        contentTypes.set(contentType, typeList)

        // Topics
        const bookmarkTopics = detectTopic(bookmark.url, bookmark.name)
        for (const topic of bookmarkTopics) {
          const topicList = topics.get(topic) || []
          topicList.push(bookmark.id)
          topics.set(topic, topicList)
        }

        // Complexity based on path depth
        const pathDepth = bookmark.pathSegments.length
        if (pathDepth <= 2) {
          complexity.set(bookmark.id, 'simple')
        } else if (pathDepth <= 4) {
          complexity.set(bookmark.id, 'moderate')
        } else {
          complexity.set(bookmark.id, 'complex')
        }
      }

      // Build semantic groups from domain clusters
      for (const [domain, bookmarkIds] of scanResult.domainClusters.entries()) {
        if (bookmarkIds.length >= 3) {
          semanticGroups.push({
            name: `Domain: ${domain}`,
            description: `Bookmarks from ${domain}`,
            bookmarkIds,
            confidence: 0.9
          })
        }
      }

      return {
        status: 'completed',
        data: {
          contentTypes,
          topics,
          complexity,
          semanticGroups
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
