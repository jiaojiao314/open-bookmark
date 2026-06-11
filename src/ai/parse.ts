/**
 * AI tag parser - parse AI-generated classification tags and convert to rules
 */

import type { Rule } from '../rules/types.js'

/** AI category tag */
export interface AICategory {
  name: string
  description?: string
  domains?: string[]
  keywords?: string[]
  urlPatterns?: string[]
  target: string
  confidence?: number
  priority?: number
}

/** Conflict resolution entry */
export interface ConflictResolution {
  bookmarkId: string
  categories: string[]
  resolution: string
  reason: string
}

/** AI insights */
export interface AIInsights {
  userRole?: string
  techStack?: string[]
  interests?: string[]
  suggestedStructure?: string
}

/** AI tags file format */
export interface AITags {
  categories: AICategory[]
  conflictResolution?: ConflictResolution[]
  insights?: AIInsights
}

/** Validate AI tags JSON */
export function validateAITags(data: unknown): { valid: boolean; errors: string[] } {
  const errors: string[] = []

  if (!data || typeof data !== 'object') {
    return { valid: false, errors: ['Invalid JSON: must be an object'] }
  }

  const obj = data as Record<string, unknown>

  if (!Array.isArray(obj.categories)) {
    errors.push('Missing or invalid "categories" field: must be an array')
    return { valid: false, errors }
  }

  for (let i = 0; i < obj.categories.length; i++) {
    const cat = obj.categories[i] as Record<string, unknown>
    if (!cat.name || typeof cat.name !== 'string') {
      errors.push(`categories[${i}]: missing or invalid "name"`)
    }
    if (!cat.target || typeof cat.target !== 'string') {
      errors.push(`categories[${i}]: missing or invalid "target"`)
    }
    if (cat.domains && !Array.isArray(cat.domains)) {
      errors.push(`categories[${i}]: "domains" must be an array`)
    }
    if (cat.keywords && !Array.isArray(cat.keywords)) {
      errors.push(`categories[${i}]: "keywords" must be an array`)
    }
    if (cat.urlPatterns && !Array.isArray(cat.urlPatterns)) {
      errors.push(`categories[${i}]: "urlPatterns" must be an array`)
    }
  }

  // Validate conflictResolution if present
  if (obj.conflictResolution && !Array.isArray(obj.conflictResolution)) {
    errors.push('"conflictResolution" must be an array')
  }

  return { valid: errors.length === 0, errors }
}

/** Parse AI tags from JSON data */
export function parseAITags(data: unknown): AITags | null {
  const validation = validateAITags(data)
  if (!validation.valid) {
    return null
  }
  return data as AITags
}

/** Convert AI tags to rules */
export function tagsToRules(tags: AITags): Rule[] {
  const rules: Rule[] = []

  // Sort categories by priority (lower number = higher priority)
  const sortedCategories = [...tags.categories].sort((a, b) => 
    (a.priority ?? 999) - (b.priority ?? 999)
  )

  for (const category of sortedCategories) {
    const hasDomains = category.domains && category.domains.length > 0
    const hasKeywords = category.keywords && category.keywords.length > 0
    const hasUrlPatterns = category.urlPatterns && category.urlPatterns.length > 0

    // Skip categories with no match conditions
    if (!hasDomains && !hasKeywords && !hasUrlPatterns) {
      continue
    }

    const rule: Rule = {
      name: `ai-${category.name.toLowerCase().replace(/[\s\/]+/g, '-')}`,
      match: {},
      action: 'move',
      target: category.target,
      reason: category.description || `AI 分类: ${category.name}`,
      source: 'generated'
    }

    // Build match conditions
    const match: Record<string, unknown> = {}
    
    if (hasDomains) {
      match.domain = category.domains
    }
    
    if (hasKeywords) {
      match.titleContains = category.keywords
    }
    
    if (hasUrlPatterns && category.urlPatterns) {
      match.urlRegex = category.urlPatterns.join('|')
    }

    rule.match = match
    rules.push(rule)
  }

  // Add catch-all rule at the end if not already present
  const hasCatchAll = rules.some(r => r.match.matchAll)
  if (!hasCatchAll) {
    rules.push({
      name: 'ai-unclassified',
      match: { matchAll: true },
      action: 'move',
      target: '未分类',
      reason: 'AI 未分类的书签',
      source: 'generated'
    })
  }

  return rules
}

/** Merge AI-generated rules with existing rules */
export function mergeRules(existing: Rule[], newRules: Rule[]): Rule[] {
  const existingNames = new Set(existing.map(r => r.name))
  const merged = [...existing]

  for (const rule of newRules) {
    if (!existingNames.has(rule.name)) {
      merged.push(rule)
    }
  }

  // Reorder: specific rules first, catch-all last
  const catchAll = merged.filter(r => r.match.matchAll)
  const specific = merged.filter(r => !r.match.matchAll)

  return [...specific, ...catchAll]
}
