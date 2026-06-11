/**
 * Tests for AI prepare module
 */

import { describe, it, expect } from 'vitest'
import { prepareBookmarksForAI } from '../src/ai/prepare.js'
import type { Bookmark } from '../src/chrome/types.js'

const sampleBookmarks: Bookmark[] = [
  { id: '1', name: 'Kubernetes Docs', url: 'https://kubernetes.io/docs', folder: 'DevOps', parentId: '', dateAdded: new Date(), dateModified: new Date() },
  { id: '2', name: 'Docker Hub', url: 'https://hub.docker.com', folder: 'DevOps', parentId: '', dateAdded: new Date(), dateModified: new Date() },
  { id: '3', name: 'GitHub', url: 'https://github.com', folder: 'Code', parentId: '', dateAdded: new Date(), dateModified: new Date() },
  { id: '4', name: 'ChatGPT', url: 'https://chat.openai.com', folder: 'AI', parentId: '', dateAdded: new Date(), dateModified: new Date() },
  { id: '5', name: 'CSDN Blog', url: 'https://blog.csdn.net/article/123', folder: 'Blog', parentId: '', dateAdded: new Date(), dateModified: new Date() },
]

describe('prepareBookmarksForAI', () => {
  it('should return ai-ready format by default', () => {
    const result = prepareBookmarksForAI(sampleBookmarks)
    expect(result).toHaveProperty('summary')
    expect(result).toHaveProperty('domains')
    expect(result).toHaveProperty('keywords')
    expect(result).toHaveProperty('samples')
  })

  it('should return correct summary', () => {
    const result = prepareBookmarksForAI(sampleBookmarks) as any
    expect(result.summary.total).toBe(5)
    expect(result.summary.uniqueDomains).toBeGreaterThan(0)
  })

  it('should return domains format', () => {
    const result = prepareBookmarksForAI(sampleBookmarks, { format: 'domains' })
    expect(result).toHaveProperty('domains')
    expect(Array.isArray((result as any).domains)).toBe(true)
  })

  it('should return keywords format', () => {
    const result = prepareBookmarksForAI(sampleBookmarks, { format: 'keywords' })
    expect(result).toHaveProperty('keywords')
    expect(Array.isArray((result as any).keywords)).toBe(true)
  })

  it('should limit samples with --sample option', () => {
    const result = prepareBookmarksForAI(sampleBookmarks, { sample: 2 }) as any
    expect(result.samples.length).toBe(2)
  })

  it('should include all samples when no sample limit', () => {
    const result = prepareBookmarksForAI(sampleBookmarks) as any
    expect(result.samples.length).toBe(5)
  })

  it('should include domain in samples', () => {
    const result = prepareBookmarksForAI(sampleBookmarks) as any
    expect(result.samples[0]).toHaveProperty('domain')
    expect(result.samples[0].domain).toBe('kubernetes.io')
  })
})
