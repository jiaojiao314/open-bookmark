/**
 * Optimize command - run optimization cycle
 */

import { runOptimization, generateOptimizationReport } from '../ai/optimizer.js'
import { saveRules } from '../rules/serializer.js'
import type { GeneratedRules } from '../rules/generator.js'

/** Optimize command options */
export interface OptimizeOptions {
  apply?: boolean
  json?: boolean
}

/** Run optimize command */
export async function optimizeCommand(options: OptimizeOptions): Promise<void> {
  const stateDir = process.cwd() + '/open-bookmark'

  console.log('🔧 运行优化分析...\n')

  const { suggestions, optimizedRules, report } = await runOptimization(stateDir)

  if (options.json) {
    console.log(JSON.stringify({ suggestions, ruleCount: optimizedRules.length }, null, 2))
    return
  }

  console.log(report)

  if (options.apply && suggestions.length > 0) {
    console.log('\n📝 应用优化...')
    
    const rulesPath = stateDir + '/classification-rules.yaml'
    const generated: GeneratedRules = {
      rules: optimizedRules,
      summary: {
        totalRules: optimizedRules.length,
        protectRules: optimizedRules.filter(r => r.action === 'skip').length,
        domainRules: optimizedRules.filter(r => r.match.domain).length,
        keywordRules: optimizedRules.filter(r => r.match.titleContains).length,
        catchAllRules: optimizedRules.filter(r => r.match.matchAll).length
      }
    }

    await saveRules(generated, rulesPath)
    console.log(`✅ 优化已应用，规则已保存到: ${rulesPath}`)
  } else if (suggestions.length > 0) {
    console.log('\n💡 使用 --apply 选项应用优化')
  }
}
