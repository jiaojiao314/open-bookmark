/**
 * Tests for AI parse module
 */

import { describe, it, expect } from 'vitest'
import { validateAITags, parseAITags, tagsToRules, mergeRules } from '../src/ai/parse.js'
import type { AITags, AICategory } from '../src/ai/parse.js'
import type { Rule } from '../src/rules/types.js'

describe('validateAITags', () => {
  it('should validate correct format', () => {
    const data = {
      categories: [
        { name: 'Test', domains: ['example.com'], keywords: ['test'], target: 'Folder', confidence: 0.9 }
      ]
    }
    const result = validateAITags(data)
    expect(result.valid).toBe(true)
    expect(result.errors.length).toBe(0)
  })

  it('should reject non-object input', () => {
    const result = validateAITags('string')
    expect(result.valid).toBe(false)
  })

  it('should reject missing categories', () => {
    const result = validateAITags({})
    expect(result.valid).toBe(false)
  })

  it('should reject non-array categories', () => {
    const result = validateAITags({ categories: 'not-array' })
    expect(result.valid).toBe(false)
  })

  it('should reject missing name', () => {
    const data = {
      categories: [{ domains: ['example.com'], target: 'Folder' }]
    }
    const result = validateAITags(data)
    expect(result.valid).toBe(false)
  })

  it('should reject missing target', () => {
    const data = {
      categories: [{ name: 'Test', domains: ['example.com'] }]
    }
    const result = validateAITags(data)
    expect(result.valid).toBe(false)
  })

  it('should accept optional domains and keywords', () => {
    const data = {
      categories: [{ name: 'Test', target: 'Folder' }]
    }
    const result = validateAITags(data)
    expect(result.valid).toBe(true)
  })
})

describe('parseAITags', () => {
  it('should parse valid data', () => {
    const data = {
      categories: [
        { name: 'Test', domains: ['example.com'], keywords: ['test'], target: 'Folder' }
      ]
    }
    const result = parseAITags(data)
    expect(result).not.toBeNull()
    expect(result!.categories.length).toBe(1)
  })

  it('should return null for invalid data', () => {
    const result = parseAITags({})
    expect(result).toBeNull()
  })
})

describe('tagsToRules', () => {
  it('should convert tags to rules with catch-all', () => {
    const tags: AITags = {
      categories: [
        { name: 'GitHub', domains: ['github.com', '*.github.com'], keywords: [], target: 'Code' },
        { name: 'AI Tools', domains: ['openai.com'], keywords: ['chatgpt'], target: 'AI' }
      ]
    }
    const rules = tagsToRules(tags)
    expect(rules.length).toBe(3) // 2 categories + catch-all
    expect(rules[0].name).toBe('ai-github')
    expect(rules[0].target).toBe('Code')
    expect(rules[2].match.matchAll).toBe(true) // catch-all
  })

  it('should handle categories with only domains', () => {
    const tags: AITags = {
      categories: [
        { name: 'Test', domains: ['example.com'], target: 'Folder' }
      ]
    }
    const rules = tagsToRules(tags)
    expect(rules.length).toBe(2) // 1 category + catch-all
    expect(rules[0].match.domain).toEqual(['example.com'])
  })

  it('should handle categories with only keywords', () => {
    const tags: AITags = {
      categories: [
        { name: 'Test', keywords: ['test', 'demo'], target: 'Folder' }
      ]
    }
    const rules = tagsToRules(tags)
    expect(rules.length).toBe(2) // 1 category + catch-all
    expect(rules[0].match.titleContains).toEqual(['test', 'demo'])
  })

  it('should skip categories with no match conditions but still add catch-all', () => {
    const tags: AITags = {
      categories: [
        { name: 'Empty', target: 'Folder' }
      ]
    }
    const rules = tagsToRules(tags)
    expect(rules.length).toBe(1) // only catch-all
    expect(rules[0].match.matchAll).toBe(true)
  })

  it('should generate correct rule names', () => {
    const tags: AITags = {
      categories: [
        { name: 'Kubernetes 生态', domains: ['k8s.io'], target: 'DevOps' }
      ]
    }
    const rules = tagsToRules(tags)
    expect(rules[0].name).toBe('ai-kubernetes-生态')
  })

  it('should sort by priority', () => {
    const tags: AITags = {
      categories: [
        { name: 'Low', domains: ['low.com'], target: 'Low', priority: 10 },
        { name: 'High', domains: ['high.com'], target: 'High', priority: 1 }
      ]
    }
    const rules = tagsToRules(tags)
    expect(rules[0].name).toBe('ai-high')
    expect(rules[1].name).toBe('ai-low')
  })
})

describe('mergeRules', () => {
  it('should merge new rules with existing', () => {
    const existing: Rule[] = [
      { name: 'existing', match: { domain: ['old.com'] }, action: 'move', target: 'Old' }
    ]
    const newRules: Rule[] = [
      { name: 'new', match: { domain: ['new.com'] }, action: 'move', target: 'New' }
    ]
    const result = mergeRules(existing, newRules)
    expect(result.length).toBe(2)
  })

  it('should not duplicate existing rules', () => {
    const existing: Rule[] = [
      { name: 'same', match: { domain: ['test.com'] }, action: 'move', target: 'Test' }
    ]
    const newRules: Rule[] = [
      { name: 'same', match: { domain: ['test.com'] }, action: 'move', target: 'Test' }
    ]
    const result = mergeRules(existing, newRules)
    expect(result.length).toBe(1)
  })

  it('should preserve existing rules', () => {
    const existing: Rule[] = [
      { name: 'existing', match: { domain: ['old.com'] }, action: 'move', target: 'Old' }
    ]
    const newRules: Rule[] = []
    const result = mergeRules(existing, newRules)
    expect(result.length).toBe(1)
    expect(result[0].name).toBe('existing')
  })
})
