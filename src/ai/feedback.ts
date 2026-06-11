/**
 * Feedback system - collect and apply user feedback
 */

import { readFile, writeFile, mkdir } from 'node:fs/promises'
import { dirname, join } from 'node:path'

/** Feedback entry */
export interface FeedbackEntry {
  bookmarkId: string
  bookmarkName: string
  currentCategory: string
  suggestedCategory: string
  reason: string
  timestamp: string
  applied: boolean
}

/** Feedback file structure */
export interface FeedbackData {
  entries: FeedbackEntry[]
  statistics: {
    total: number
    applied: number
    pending: number
  }
}

/** Load feedback from file */
export async function loadFeedback(stateDir: string): Promise<FeedbackData> {
  const feedbackPath = join(stateDir, 'ai', 'feedback.json')
  
  try {
    const content = await readFile(feedbackPath, 'utf-8')
    return JSON.parse(content)
  } catch {
    return {
      entries: [],
      statistics: { total: 0, applied: 0, pending: 0 }
    }
  }
}

/** Save feedback to file */
export async function saveFeedback(stateDir: string, feedback: FeedbackData): Promise<void> {
  const feedbackPath = join(stateDir, 'ai', 'feedback.json')
  
  // Update statistics
  feedback.statistics = {
    total: feedback.entries.length,
    applied: feedback.entries.filter(e => e.applied).length,
    pending: feedback.entries.filter(e => !e.applied).length
  }

  await mkdir(dirname(feedbackPath), { recursive: true })
  await writeFile(feedbackPath, JSON.stringify(feedback, null, 2), 'utf-8')
}

/** Add feedback entry */
export async function addFeedback(
  stateDir: string,
  entry: Omit<FeedbackEntry, 'timestamp' | 'applied'>
): Promise<void> {
  const feedback = await loadFeedback(stateDir)
  
  feedback.entries.push({
    ...entry,
    timestamp: new Date().toISOString(),
    applied: false
  })

  await saveFeedback(stateDir, feedback)
}

/** Get pending feedback entries */
export async function getPendingFeedback(stateDir: string): Promise<FeedbackEntry[]> {
  const feedback = await loadFeedback(stateDir)
  return feedback.entries.filter(e => !e.applied)
}

/** Mark feedback as applied */
export async function markFeedbackApplied(stateDir: string, bookmarkId: string): Promise<void> {
  const feedback = await loadFeedback(stateDir)
  
  const entry = feedback.entries.find(e => e.bookmarkId === bookmarkId)
  if (entry) {
    entry.applied = true
    await saveFeedback(stateDir, feedback)
  }
}

/** Generate feedback report */
export function generateFeedbackReport(feedback: FeedbackData): string {
  const lines: string[] = []
  
  lines.push('📊 反馈报告')
  lines.push('=' .repeat(50))
  lines.push(`总反馈数: ${feedback.statistics.total}`)
  lines.push(`已应用: ${feedback.statistics.applied}`)
  lines.push(`待处理: ${feedback.statistics.pending}`)
  
  if (feedback.statistics.pending > 0) {
    lines.push('\n📋 待处理反馈:')
    for (const entry of feedback.entries.filter(e => !e.applied)) {
      lines.push(`  - ${entry.bookmarkName}`)
      lines.push(`    当前: ${entry.currentCategory} → 建议: ${entry.suggestedCategory}`)
      lines.push(`    原因: ${entry.reason}`)
    }
  }

  // Category adjustment suggestions
  const categoryAdjustments = new Map<string, number>()
  for (const entry of feedback.entries) {
    const key = `${entry.currentCategory} → ${entry.suggestedCategory}`
    categoryAdjustments.set(key, (categoryAdjustments.get(key) || 0) + 1)
  }

  if (categoryAdjustments.size > 0) {
    lines.push('\n🔄 常见调整:')
    const sorted = Array.from(categoryAdjustments.entries()).sort((a, b) => b[1] - a[1])
    for (const [adjustment, count] of sorted.slice(0, 5)) {
      lines.push(`  - ${adjustment} (${count} 次)`)
    }
  }

  return lines.join('\n')
}
