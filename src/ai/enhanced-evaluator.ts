/**
 * Enhanced Evaluator - assess classification quality with hierarchical support
 */

import type { Rule } from '../rules/types.js'
import type { Bookmark } from '../chrome/types.js'
import type { ClassificationResult } from './agents/types.js'
import { findMatchingRule } from '../rules/types.js'

/** Evaluation result */
export interface EnhancedEvaluationResult {
  coverage: {
    total: number
    matched: number
    unmatched: number
    percentage: number
  }
  hierarchy: {
    totalCategories: number
    parentCategories: number
    childCategories: number
    averageDepth: number
  }
  distribution: Array<{
    name: string
    count: number
    percentage: number
    isParent: boolean
  }>
  quality: {
    score: number
    issues: string[]
    recommendations: string[]
  }
}

/** Evaluate classification quality from pipeline results */
export function evaluateEnhancedClassification(
  classification: ClassificationResult,
  totalBookmarks: number
): EnhancedEvaluationResult {
  const categories = classification.categories

  // Calculate coverage
  const classifiedIds = new Set<string>()
  for (const cat of categories) {
    for (const id of cat.bookmarkIds) {
      classifiedIds.add(id)
    }
  }

  const coverage = {
    total: totalBookmarks,
    matched: classifiedIds.size,
    unmatched: totalBookmarks - classifiedIds.size,
    percentage: (classifiedIds.size / totalBookmarks) * 100
  }

  // Analyze hierarchy
  let parentCount = 0
  let childCount = 0
  let totalDepth = 0

  for (const cat of categories) {
    const depth = cat.name.split('/').length
    totalDepth += depth

    if (depth === 1) {
      parentCount++
    } else {
      childCount++
    }
  }

  const hierarchy = {
    totalCategories: categories.length,
    parentCategories: parentCount,
    childCategories: childCount,
    averageDepth: totalDepth / categories.length
  }

  // Calculate distribution
  const distribution = categories.map(cat => ({
    name: cat.name,
    count: cat.bookmarkIds.length,
    percentage: (cat.bookmarkIds.length / totalBookmarks) * 100,
    isParent: !cat.name.includes('/')
  })).sort((a, b) => b.count - a.count)

  // Calculate quality score
  let score = 100
  const issues: string[] = []
  const recommendations: string[] = []

  // Penalty for low coverage
  if (coverage.percentage < 90) {
    const penalty = (100 - coverage.percentage) * 0.5
    score -= penalty
    issues.push(`覆盖率低: ${coverage.percentage.toFixed(1)}%`)
    recommendations.push('增加更多分类规则或调整匹配条件')
  }

  // Penalty for too many "Other" category
  const otherCategory = categories.find(c => c.name === 'Other')
  if (otherCategory) {
    const otherPercentage = (otherCategory.bookmarkIds.length / totalBookmarks) * 100
    if (otherPercentage > 20) {
      score -= otherPercentage * 0.3
      issues.push(`"Other" 分类过大: ${otherPercentage.toFixed(1)}%`)
      recommendations.push('细化 "Other" 分类，添加更多具体分类')
    }
  }

  // Penalty for categories that are too large (>30%)
  for (const cat of distribution) {
    if (cat.percentage > 30 && cat.name !== 'Other') {
      score -= (cat.percentage - 30) * 0.2
      issues.push(`分类 "${cat.name}" 过大: ${cat.percentage.toFixed(1)}%`)
      recommendations.push(`细分 "${cat.name}" 分类`)
    }
  }

  // Penalty for categories that are too small (<1%)
  const smallCategories = distribution.filter(c => c.percentage < 1 && c.count < 3)
  if (smallCategories.length > 5) {
    score -= smallCategories.length * 2
    issues.push(`小分类过多: ${smallCategories.length} 个`)
    recommendations.push('合并小分类或调整匹配条件')
  }

  // Bonus for good hierarchy
  if (hierarchy.averageDepth > 1.5 && hierarchy.averageDepth < 3) {
    score += 5
  }

  // Ensure score is between 0 and 100
  score = Math.max(0, Math.min(100, score))

  return {
    coverage,
    hierarchy,
    distribution,
    quality: {
      score,
      issues,
      recommendations
    }
  }
}

/** Generate evaluation report */
export function generateEnhancedEvaluationReport(result: EnhancedEvaluationResult): string {
  const lines: string[] = []

  lines.push('📊 增强分类质量评估报告')
  lines.push('=' .repeat(60))

  lines.push('\n📈 覆盖率:')
  lines.push(`  总书签: ${result.coverage.total}`)
  lines.push(`  已分类: ${result.coverage.matched} (${result.coverage.percentage.toFixed(1)}%)`)
  lines.push(`  未分类: ${result.coverage.unmatched}`)

  lines.push('\n🏗️  层次结构:')
  lines.push(`  总分类数: ${result.hierarchy.totalCategories}`)
  lines.push(`  父分类: ${result.hierarchy.parentCategories}`)
  lines.push(`  子分类: ${result.hierarchy.childCategories}`)
  lines.push(`  平均深度: ${result.hierarchy.averageDepth.toFixed(2)}`)

  lines.push('\n📊 分类分布 (前 15):')
  lines.push('-' .repeat(60))
  for (const cat of result.distribution.slice(0, 15)) {
    const bar = '█'.repeat(Math.min(Math.round(cat.percentage / 2), 30))
    const prefix = cat.isParent ? '📁' : '  └─'
    lines.push(`  ${prefix} ${cat.name}: ${cat.count} (${cat.percentage.toFixed(1)}%) ${bar}`)
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
