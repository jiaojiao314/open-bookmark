/**
 * Feedback command - manage user feedback
 */

import type { FeedbackEntry } from '../ai/feedback.js'
import {
  loadFeedback,
  addFeedback,
  getPendingFeedback,
  markFeedbackApplied,
  generateFeedbackReport
} from '../ai/feedback.js'

/** Feedback command options */
export interface FeedbackOptions {
  add?: string
  list?: boolean
  apply?: string
  report?: boolean
}

/** Run feedback command */
export async function feedbackCommand(options: FeedbackOptions): Promise<void> {
  const stateDir = process.cwd() + '/open-bookmark'

  // Add feedback
  if (options.add) {
    const parts = options.add.split(':')
    if (parts.length < 4) {
      console.error('❌ 格式错误: bookmarkId:bookmarkName:currentCategory:suggestedCategory:reason')
      process.exit(1)
    }

    await addFeedback(stateDir, {
      bookmarkId: parts[0],
      bookmarkName: parts[1],
      currentCategory: parts[2],
      suggestedCategory: parts[3],
      reason: parts[4] || '用户反馈'
    })

    console.log('✅ 反馈已添加')
    return
  }

  // List pending feedback
  if (options.list) {
    const pending = await getPendingFeedback(stateDir)
    
    if (pending.length === 0) {
      console.log('✅ 没有待处理的反馈')
      return
    }

    console.log(`📋 待处理反馈 (${pending.length}):`)
    for (const entry of pending) {
      console.log(`\n  ${entry.bookmarkName}`)
      console.log(`    当前: ${entry.currentCategory} → 建议: ${entry.suggestedCategory}`)
      console.log(`    原因: ${entry.reason}`)
    }
    return
  }

  // Mark feedback as applied
  if (options.apply) {
    await markFeedbackApplied(stateDir, options.apply)
    console.log(`✅ 反馈 ${options.apply} 已标记为已应用`)
    return
  }

  // Generate report
  if (options.report) {
    const feedback = await loadFeedback(stateDir)
    console.log(generateFeedbackReport(feedback))
    return
  }

  // Default: show help
  console.log('用法:')
  console.log('  open-bookmark feedback --add "id:name:from:to:reason"  # 添加反馈')
  console.log('  open-bookmark feedback --list                         # 列出待处理反馈')
  console.log('  open-bookmark feedback --apply <id>                   # 标记反馈为已应用')
  console.log('  open-bookmark feedback --report                       # 生成反馈报告')
}
