/**
 * Evaluate command - assess classification quality
 */

import type { Bookmark } from '../chrome/types.js'
import type { Rule } from '../rules/types.js'
import { loadRules } from '../rules/serializer.js'
import { evaluateClassification, generateEvaluationReport } from '../ai/evaluator.js'
import { evaluateEnhancedClassification, generateEnhancedEvaluationReport } from '../ai/enhanced-evaluator.js'
import type { ClassificationResult } from '../ai/agents/types.js'

/** Evaluate command options */
export interface EvaluateOptions {
  json?: boolean
  enhanced?: boolean
}

/** Run evaluate command */
export async function evaluateCommand(options: EvaluateOptions): Promise<void> {
  const stateDir = process.cwd() + '/open-bookmark'
  const snapshotPath = stateDir + '/bookmarks-snapshot.json'
  const rulesPath = stateDir + '/classification-rules.yaml'

  // Load bookmarks
  let bookmarks: Bookmark[]
  try {
    const { readFile } = await import('node:fs/promises')
    const data = await readFile(snapshotPath, 'utf-8')
    bookmarks = JSON.parse(data).map((b: Record<string, unknown>) => ({
      ...b,
      dateAdded: new Date(b.dateAdded as string),
      dateModified: new Date(b.dateModified as string)
    }))
  } catch {
    console.error('❌ 未找到快照文件，请先运行 init 命令')
    process.exit(1)
  }

  console.log(`📖 加载 ${bookmarks.length} 个书签...`)

  if (options.enhanced) {
    // Use enhanced evaluation from pipeline results
    // Try v3 first, then v2, then v1
    const pipelineResultPaths = [
      stateDir + '/ai/enhanced-pipeline-result-v3.json',
      stateDir + '/ai/enhanced-pipeline-result-v2.json',
      stateDir + '/ai/enhanced-pipeline-result.json'
    ]

    let pipelineData: any = null
    for (const path of pipelineResultPaths) {
      try {
        const { readFile } = await import('node:fs/promises')
        pipelineData = JSON.parse(await readFile(path, 'utf-8'))
        break
      } catch {
        // Try next path
      }
    }

    if (!pipelineData) {
      console.error('❌ 未找到增强 Pipeline 结果，请先运行: open-bookmark pipeline --enhanced')
      process.exit(1)
    }

    console.log('🔍 使用增强评估器评估分类质量...\n')

    const result = evaluateEnhancedClassification(
      pipelineData.classification,
      bookmarks.length
    )

    if (options.json) {
      console.log(JSON.stringify(result, null, 2))
    } else {
      console.log(generateEnhancedEvaluationReport(result))
    }
  } else {
    // Use original evaluation
    let rules: Rule[]
    try {
      rules = await loadRules(rulesPath)
    } catch {
      console.error('❌ 未找到规则文件，请先生成规则')
      process.exit(1)
    }

    console.log(`📝 加载 ${rules.length} 条规则...`)
    console.log('🔍 评估分类质量...\n')

    const result = evaluateClassification(bookmarks, rules)

    if (options.json) {
      const jsonResult = {
        ...result,
        distribution: Object.fromEntries(result.distribution)
      }
      console.log(JSON.stringify(jsonResult, null, 2))
    } else {
      console.log(generateEvaluationReport(result))
    }
  }
}
