/**
 * Agent types and interfaces for multi-agent bookmark analysis
 */

/** Agent task status */
export type AgentStatus = 'pending' | 'running' | 'completed' | 'failed'

/** Agent task result */
export interface AgentResult<T = unknown> {
  status: AgentStatus
  data?: T
  error?: string
  duration?: number
}

/** Scanner Agent output */
export interface ScanResult {
  bookmarks: Array<{
    id: string
    name: string
    url: string
    domain: string
    folder: string
    pathSegments: string[]
    topLevelDomain: string
    isHttps: boolean
    hasPort: boolean
  }>
  statistics: {
    total: number
    uniqueDomains: number
    uniqueTLDs: number
    httpsCount: number
    httpCount: number
    withPortCount: number
  }
  domainClusters: Map<string, string[]>
}

/** Analyzer Agent output */
export interface AnalysisResult {
  contentTypes: Map<string, string[]>
  topics: Map<string, string[]>
  complexity: Map<string, 'simple' | 'moderate' | 'complex'>
  semanticGroups: Array<{
    name: string
    description: string
    bookmarkIds: string[]
    confidence: number
  }>
}

/** Classifier Agent output */
export interface ClassificationResult {
  categories: Array<{
    name: string
    description: string
    domains: string[]
    keywords: string[]
    urlPatterns: string[]
    target: string
    confidence: number
    priority: number
    bookmarkIds: string[]
  }>
  conflictResolution: Array<{
    bookmarkId: string
    categories: string[]
    resolution: string
    reason: string
  }>
  insights: {
    userRole: string
    techStack: string[]
    interests: string[]
    suggestedStructure: string
  }
  statistics: {
    totalClassified: number
    totalUnclassified: number
    categoryCount: number
    averageConfidence: number
  }
}

/** Agent configuration */
export interface AgentConfig {
  name: string
  description: string
  maxRetries: number
  timeout: number
}

/** Agent interface */
export interface Agent<TInput, TOutput> {
  config: AgentConfig
  execute(input: TInput): Promise<AgentResult<TOutput>>
}
