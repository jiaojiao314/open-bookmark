/**
 * Tests for Agent modules
 */

import { describe, it, expect } from 'vitest'
import { ScannerAgent } from '../src/ai/agents/scanner.js'
import { AnalyzerAgent } from '../src/ai/agents/analyzer.js'
import { ClassifierAgent } from '../src/ai/agents/classifier.js'
import type { Bookmark } from '../src/chrome/types.js'

const sampleBookmarks: Bookmark[] = [
  { id: '1', name: 'Kubernetes Docs', url: 'https://kubernetes.io/docs', folder: 'DevOps', parentId: '', dateAdded: new Date(), dateModified: new Date() },
  { id: '2', name: 'Docker Hub', url: 'https://hub.docker.com', folder: 'DevOps', parentId: '', dateAdded: new Date(), dateModified: new Date() },
  { id: '3', name: 'GitHub', url: 'https://github.com', folder: 'Code', parentId: '', dateAdded: new Date(), dateModified: new Date() },
  { id: '4', name: 'ChatGPT', url: 'https://chat.openai.com', folder: 'AI', parentId: '', dateAdded: new Date(), dateModified: new Date() },
  { id: '5', name: 'CSDN Blog', url: 'https://blog.csdn.net/article/123', folder: 'Blog', parentId: '', dateAdded: new Date(), dateModified: new Date() },
  { id: '6', name: 'Docker Compose', url: 'https://docs.docker.com/compose/', folder: 'DevOps', parentId: '', dateAdded: new Date(), dateModified: new Date() },
  { id: '7', name: 'Kubernetes API', url: 'https://kubernetes.io/docs/reference/', folder: 'DevOps', parentId: '', dateAdded: new Date(), dateModified: new Date() },
  { id: '8', name: 'React Docs', url: 'https://react.dev', folder: 'Frontend', parentId: '', dateAdded: new Date(), dateModified: new Date() },
  { id: '9', name: 'Vue.js', url: 'https://vuejs.org', folder: 'Frontend', parentId: '', dateAdded: new Date(), dateModified: new Date() },
  { id: '10', name: 'Python Docs', url: 'https://docs.python.org', folder: 'Programming', parentId: '', dateAdded: new Date(), dateModified: new Date() },
]

describe('ScannerAgent', () => {
  it('should scan bookmarks successfully', async () => {
    const scanner = new ScannerAgent()
    const result = await scanner.execute(sampleBookmarks)
    
    expect(result.status).toBe('completed')
    expect(result.data).toBeDefined()
    expect(result.data!.statistics.total).toBe(10)
    expect(result.data!.bookmarks.length).toBe(10)
  })

  it('should extract domains correctly', async () => {
    const scanner = new ScannerAgent()
    const result = await scanner.execute(sampleBookmarks)
    
    expect(result.data!.statistics.uniqueDomains).toBeGreaterThan(0)
    expect(result.data!.domainClusters.size).toBeGreaterThan(0)
  })

  it('should detect HTTPS', async () => {
    const scanner = new ScannerAgent()
    const result = await scanner.execute(sampleBookmarks)
    
    expect(result.data!.statistics.httpsCount).toBe(10)
    expect(result.data!.statistics.httpCount).toBe(0)
  })
})

describe('AnalyzerAgent', () => {
  it('should analyze scan results', async () => {
    const scanner = new ScannerAgent()
    const scanResult = await scanner.execute(sampleBookmarks)
    
    const analyzer = new AnalyzerAgent()
    const result = await analyzer.execute(scanResult.data!)
    
    expect(result.status).toBe('completed')
    expect(result.data).toBeDefined()
    expect(result.data!.contentTypes.size).toBeGreaterThan(0)
    expect(result.data!.topics.size).toBeGreaterThan(0)
  })

  it('should detect topics', async () => {
    const scanner = new ScannerAgent()
    const scanResult = await scanner.execute(sampleBookmarks)
    
    const analyzer = new AnalyzerAgent()
    const result = await analyzer.execute(scanResult.data!)
    
    // Should detect DevOps, Frontend, etc.
    expect(result.data!.topics.has('DevOps')).toBe(true)
    expect(result.data!.topics.has('Frontend')).toBe(true)
  })
})

describe('ClassifierAgent', () => {
  it('should classify bookmarks', async () => {
    const scanner = new ScannerAgent()
    const scanResult = await scanner.execute(sampleBookmarks)
    
    const analyzer = new AnalyzerAgent()
    const analysisResult = await analyzer.execute(scanResult.data!)
    
    const classifier = new ClassifierAgent()
    const result = await classifier.execute({
      scan: scanResult.data!,
      analysis: analysisResult.data!
    })
    
    expect(result.status).toBe('completed')
    expect(result.data).toBeDefined()
    expect(result.data!.categories.length).toBeGreaterThan(0)
    expect(result.data!.statistics.totalClassified).toBeGreaterThan(0)
  })

  it('should infer user role', async () => {
    const scanner = new ScannerAgent()
    const scanResult = await scanner.execute(sampleBookmarks)
    
    const analyzer = new AnalyzerAgent()
    const analysisResult = await analyzer.execute(scanResult.data!)
    
    const classifier = new ClassifierAgent()
    const result = await classifier.execute({
      scan: scanResult.data!,
      analysis: analysisResult.data!
    })
    
    expect(result.data!.insights.userRole).toBeDefined()
    expect(result.data!.insights.techStack.length).toBeGreaterThan(0)
  })
})
