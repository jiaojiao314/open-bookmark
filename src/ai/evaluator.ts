/**
 * Evaluator - assess classification quality
 */

import type { Rule } from '../rules/types.js'
import type { Bookmark } from '../chrome/types.js'
import { findMatchingRule } from '../rules/types.js'

/** Evaluation result */
export interface EvaluationResult {
  coverage: {
    total: number
    matched: number
    unmatched: number
    percentage: number
  }
  conflicts: {
    total: number
    details: Array<{
      bookmarkId: string
      bookmarkName: string
      ruleNames: string[]
    }>
  }
  distribution: Map<string, number>
  quality: {
    score: number
    issues: string[]
    recommendations: string[]
  }
}

/** Evaluate classification quality */
export function evaluateClassification(
  bookmarks: Bookmark[],
  rules: Rule[]
): EvaluationResult {
  const matchedBookmarks = new Map<string, string[]>()
  const unmatchedBookmarks: string[] = []
  const distribution = new Map<string, number>()

  // Match bookmarks to rules
  for (const bookmark of bookmarks) {
    const matchedRules: string[] = []
    
    for (const rule of rules) {
      if (rule.match.matchAll) continue
      
      if (findMatchingRule(bookmark, [rule])) {
        matchedRules.push(rule.name)
      }
    }

    if (matchedRules.length > 0) {
      matchedBookmarks.set(bookmark.id, matchedRules)
      
      // Update distribution
      const primaryRule = matchedRules[0]
      distribution.set(primaryRule, (distribution.get(primaryRule) || 0) + 1)
    } else {
      unmatchedBookmarks.push(bookmark.id)
    }
  }

  // Find conflicts
  const conflicts: EvaluationResult['conflicts']['details'] = []
  for (const [bookmarkId, ruleNames] of matchedBookmarks.entries()) {
    if (ruleNames.length > 1) {
      const bookmark = bookmarks.find(b => b.id === bookmarkId)
      if (bookmark) {
        conflicts.push({
          bookmarkId,
          bookmarkName: bookmark.name,
          ruleNames
        })
      }
    }
  }

  // Calculate quality score
  const coveragePercentage = (matchedBookmarks.size / bookmarks.length) * 100
  const conflictPercentage = (conflicts.length / bookmarks.length) * 100
  
  // Score: 100 - (unmatched% * 0.5) - (conflict% * 0.3)
  const qualityScore = Math.max(0, 100 - ((100 - coveragePercentage) * 0.5) - (conflictPercentage * 0.3))

  // Generate issues and recommendations
  const issues: string[] = []
  const recommendations: string[] = []

  if (coveragePercentage < 50) {
    issues.push(`覆盖率低: 仅 ${coveragePercentage.toFixed(1)}% 书签被分类`)
    recommendations.push('增加更多规则或调整匹配条件')
  }

  if (conflicts.length > bookmarks.length * 0.1) {
    issues.push(`冲突率高: ${conflicts.length} 个冲突 (${conflictPercentage.toFixed(1)}%)`)
    recommendations.push('检查规则优先级，移除重叠的匹配条件')
  }

  // Check for very large categories
  for (const [rule, count] of distribution.entries()) {
    if (count > bookmarks.length * 0.3) {
      issues.push(`规则 "${rule}" 匹配过多书签: ${count} (${((count / bookmarks.length) * 100).toFixed(1)}%)`)
      recommendations.push(`细化规则 "${rule}" 的匹配条件`)
    }
  }

  // Check for very small categories
  for (const [rule, count] of distribution.entries()) {
    if (count < 3) {
      issues.push(`规则 "${rule}" 匹配过少书签: ${count}`)
      recommendations.push(`考虑合并规则 "${rule}" 或调整匹配条件`)
    }
  }

  return {
    coverage: {
      total: bookmarks.length,
      matched: matchedBookmarks.size,
      unmatched: unmatchedBookmarks.length,
      percentage: coveragePercentage
    },
    conflicts: {
      total: conflicts.length,
      details: conflicts.slice(0, 10) // Limit to 10
    },
    distribution,
    quality: {
      score: qualityScore,
      issues,
      recommendations
    }
  }
}

/** Generate evaluation report */
export function generateEvaluationReport(result: EvaluationResult): string {
  const lines: string[] = []
  
  lines.push('📊 分类质量评估报告')
  lines.push('=' .repeat(50))
  
  lines.push('\n📈 覆盖率:')
  lines.push(`  总书签: ${result.coverage.total}`)
  lines.push(`  已分类: ${result.coverage.matched} (${result.coverage.percentage.toFixed(1)}%)`)
  lines.push(`  未分类: ${result.coverage.unmatched}`)
  
  lines.push('\n⚠️  冲突:')
  lines.push(`  总冲突: ${result.conflicts.total}`)
  if (result.conflicts.details.length > 0) {
    lines.push('  前 5 个冲突:')
    for (const conflict of result.conflicts.details.slice(0, 5)) {
      lines.push(`    - ${conflict.bookmarkName}: ${conflict.ruleNames.join(', ')}`)
    }
  }
  
  lines.push('\n📊 分布:')
  const sorted = Array.from(result.distribution.entries()).sort((a, b) => b[1] - a[1])
  for (const [rule, count] of sorted.slice(0, 10)) {
    const percentage = ((count / result.coverage.total) * 100).toFixed(1)
    lines.push(`  ${rule}: ${count} (${percentage}%)`)
  }
  
  lines.push('\n✅ 质量评分:')
  lines.push(`  得分: ${result.quality.score.toFixed(1)}/100`)
  
  if (result.quality.issues.length > 0) {
    lines.push('\n⚠️  问题:')
    for (const issue of result.quality.issues) {
      lines.push(`  - ${issue}`)
    }
  }
  
  if (result.quality.recommendations.length > 0) {
    lines.push('\n💡 建议:')
    for (const rec of result.quality.recommendations) {
      lines.push(`  - ${rec}`)
    }
  }

  return lines.join('\n')
}
