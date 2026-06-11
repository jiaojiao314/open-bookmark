/**
 * Rule optimizer - dynamically adjust rules based on feedback
 */

import type { Rule } from '../rules/types.js'
import type { FeedbackData } from './feedback.js'
import { loadRules, saveRules } from '../rules/serializer.js'

/** Optimization suggestion */
export interface OptimizationSuggestion {
  type: 'add' | 'modify' | 'remove' | 'reorder'
  ruleName: string
  description: string
  priority: number
  action: string
}

/** Analyze feedback and generate optimization suggestions */
export function analyzeFeedback(feedback: FeedbackData): OptimizationSuggestion[] {
  const suggestions: OptimizationSuggestion[] = []

  // Count category adjustments
  const adjustmentCounts = new Map<string, number>()
  for (const entry of feedback.entries) {
    const key = `${entry.currentCategory}|${entry.suggestedCategory}`
    adjustmentCounts.set(key, (adjustmentCounts.get(key) || 0) + 1)
  }

  // Generate suggestions based on patterns
  for (const [key, count] of adjustmentCounts.entries()) {
    const [from, to] = key.split('|')

    // Suggest adding new category if multiple feedbacks suggest the same
    if (count >= 2 && !from.includes('/')) {
      suggestions.push({
        type: 'add',
        ruleName: `ai-${to.toLowerCase().replace(/\//g, '-')}`,
        description: `${count} 个书签从 "${from}" 移到 "${to}"，建议添加新规则`,
        priority: count,
        action: `添加规则: ${to}`
      })
    }

    // Suggest modifying existing rule
    if (count >= 1) {
      suggestions.push({
        type: 'modify',
        ruleName: `ai-${from.toLowerCase().replace(/\//g, '-')}`,
        description: `${count} 个书签从 "${from}" 移到 "${to}"，建议调整规则`,
        priority: count,
        action: `调整规则: ${from} → ${to}`
      })
    }
  }

  return suggestions.sort((a, b) => b.priority - a.priority)
}

/** Apply optimization suggestions to rules */
export function applyOptimizations(
  rules: Rule[],
  suggestions: OptimizationSuggestion[],
  feedback: FeedbackData
): Rule[] {
  const optimized = [...rules]

  for (const suggestion of suggestions) {
    if (suggestion.type === 'add') {
      // Find related feedback entries
      const relatedFeedback = feedback.entries.filter(e =>
        e.suggestedCategory === suggestion.ruleName.replace('ai-', '').replace(/-/g, '/')
      )

      if (relatedFeedback.length > 0) {
        // Create new rule based on feedback
        const newRule: Rule = {
          name: suggestion.ruleName,
          match: {
            titleContains: relatedFeedback.map(f => f.bookmarkName.split(/\s+/)).flat().filter(kw => kw.length > 2).slice(0, 5)
          },
          action: 'move',
          target: suggestion.ruleName.replace('ai-', '').replace(/-/g, '/'),
          reason: `基于用户反馈添加: ${suggestion.description}`,
          source: 'generated'
        }

        // Check if rule already exists
        if (!optimized.some(r => r.name === newRule.name)) {
          optimized.push(newRule)
        }
      }
    }

    if (suggestion.type === 'modify') {
      // Find the rule to modify
      const ruleIndex = optimized.findIndex(r => r.name === suggestion.ruleName)

      if (ruleIndex >= 0) {
        // Find related feedback
        const relatedFeedback = feedback.entries.filter(e =>
          `ai-${e.currentCategory.toLowerCase().replace(/\//g, '-')}` === suggestion.ruleName
        )

        if (relatedFeedback.length > 0) {
          // Add suggested category keywords
          const existingKeywords = (optimized[ruleIndex].match.titleContains as string[]) || []
          const newKeywords = relatedFeedback
            .map(f => f.bookmarkName.split(/\s+/))
            .flat()
            .filter(kw => kw.length > 3)
            .slice(0, 3)

          optimized[ruleIndex].match.titleContains = [...new Set([...existingKeywords, ...newKeywords])]
          optimized[ruleIndex].reason = `基于用户反馈调整: ${suggestion.description}`
        }
      }
    }
  }

  // Reorder: specific rules first, catch-all last
  const catchAll = optimized.filter(r => r.match.matchAll)
  const specific = optimized.filter(r => !r.match.matchAll)

  return [...specific, ...catchAll]
}

/** Generate optimization report */
export function generateOptimizationReport(suggestions: OptimizationSuggestion[]): string {
  const lines: string[] = []

  lines.push('🔧 优化建议')
  lines.push('=' .repeat(50))

  if (suggestions.length === 0) {
    lines.push('暂无优化建议')
    return lines.join('\n')
  }

  lines.push(`共 ${suggestions.length} 条建议:`)

  for (const suggestion of suggestions) {
    lines.push(`\n[${suggestion.type.toUpperCase()}] ${suggestion.ruleName}`)
    lines.push(`  ${suggestion.description}`)
    lines.push(`  操作: ${suggestion.action}`)
    lines.push(`  优先级: ${suggestion.priority}`)
  }

  return lines.join('\n')
}

/** Run optimization cycle */
export async function runOptimization(stateDir: string): Promise<{
  suggestions: OptimizationSuggestion[]
  optimizedRules: Rule[]
  report: string
}> {
  // Load feedback
  const { loadFeedback } = await import('./feedback.js')
  const feedback = await loadFeedback(stateDir)

  // Load current rules
  const rulesPath = stateDir + '/classification-rules.yaml'
  const rules = await loadRules(rulesPath)

  // Analyze feedback
  const suggestions = analyzeFeedback(feedback)

  // Apply optimizations
  const optimizedRules = applyOptimizations(rules, suggestions, feedback)

  // Generate report
  const report = generateOptimizationReport(suggestions)

  return {
    suggestions,
    optimizedRules,
    report
  }
}
