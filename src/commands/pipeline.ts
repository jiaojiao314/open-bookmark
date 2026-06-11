/**
 * Pipeline command - run multi-agent analysis pipeline
 */

import type { Bookmark } from '../chrome/types.js'
import { runPipeline, runPipelineJson } from '../ai/agents/pipeline.js'
import { runEnhancedPipeline, runEnhancedPipelineJson } from '../ai/agents/enhanced-pipeline.js'

/** Pipeline command options */
export interface PipelineOptions {
  json?: boolean
  output?: string
  enhanced?: boolean
}

/** Run pipeline command */
export async function pipelineCommand(options: PipelineOptions): Promise<void> {
  const stateDir = process.cwd() + '/open-bookmark'
  const snapshotPath = stateDir + '/bookmarks-snapshot.json'

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
  console.log(`🤖 启动${options.enhanced ? '增强' : ''}多 Agent 分析流水线...\n`)

  try {
    if (options.json) {
      // Output as JSON
      const json = options.enhanced
        ? await runEnhancedPipelineJson(bookmarks)
        : await runPipelineJson(bookmarks)

      if (options.output) {
        const { writeFile, mkdir } = await import('node:fs/promises')
        const { dirname } = await import('node:path')
        await mkdir(dirname(options.output), { recursive: true })
        await writeFile(options.output, json, 'utf-8')
        console.log(`✅ 结果已保存到: ${options.output}`)
      } else {
        console.log(json)
      }
    } else {
      // Output as readable text
      const result = options.enhanced
        ? await runEnhancedPipeline(bookmarks)
        : await runPipeline(bookmarks)

      console.log('\n📊 分析结果:')
      console.log('=' .repeat(50))

      console.log('\n🔍 Scanner Agent:')
      console.log(`   总书签: ${result.scan.statistics.total}`)
      console.log(`   唯一域名: ${result.scan.statistics.uniqueDomains}`)
      console.log(`   HTTPS: ${result.scan.statistics.httpsCount}`)

      console.log('\n📈 Analyzer Agent:')
      console.log(`   内容类型: ${result.analysis.contentTypes.size} 种`)
      console.log(`   主题: ${result.analysis.topics.size} 个`)
      console.log(`   语义组: ${result.analysis.semanticGroups.length} 个`)

      console.log('\n🏷️  Classifier Agent:')
      console.log(`   分类数: ${result.classification.statistics.categoryCount}`)
      console.log(`   已分类: ${result.classification.statistics.totalClassified}`)
      console.log(`   未分类: ${result.classification.statistics.totalUnclassified}`)
      console.log(`   平均置信度: ${(result.classification.statistics.averageConfidence * 100).toFixed(1)}%`)

      console.log('\n👤 用户洞察:')
      console.log(`   角色: ${result.classification.insights.userRole}`)
      console.log(`   技术栈: ${result.classification.insights.techStack.join(', ')}`)

      console.log('\n⏱️  耗时:')
      console.log(`   Scanner: ${result.timing.scan}ms`)
      console.log(`   Analyzer: ${result.timing.analysis}ms`)
      console.log(`   Classifier: ${result.timing.classification}ms`)
      console.log(`   总计: ${result.timing.total}ms`)
    }

    console.log('\n✅ 分析完成!')

  } catch (error) {
    console.error('❌ 分析失败:', error)
    process.exit(1)
  }
}
