/**
 * Graph command - knowledge graph operations
 */

import type { Bookmark } from '../chrome/types.js'
import type { BookmarkKnowledgeGraph } from './types.js'
import type { LLMConfig } from './llm.js'
import { createLLM } from './llm.js'
import { analyzeBookmarksBatch } from './analyzer.js'
import { buildKnowledgeGraph, saveKnowledgeGraph, loadKnowledgeGraph } from './builder.js'
import { queryGraph, getGraphStats, exportGraph, searchNodes, getNodesByType, getTopNodesByEdgeCount } from './query.js'
import { classifyBookmarks, generateClassificationRules, getClassificationSummary } from './classifier.js'

/** Graph command options */
export interface GraphOptions {
  stateDir?: string
  llmConfig?: LLMConfig
}

/** Initialize knowledge graph */
export async function graphInit(bookmarks: Bookmark[], options: GraphOptions = {}): Promise<BookmarkKnowledgeGraph> {
  const stateDir = options.stateDir || process.cwd() + '/open-bookmark'
  const graphPath = stateDir + '/bookmark-graph.json'

  console.log('📊 初始化知识图谱...')

  // Create LLM instance
  const llmConfig = options.llmConfig || {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY
  }
  const llm = createLLM(llmConfig)

  // Analyze bookmarks
  console.log('🔍 分析书签...')
  const analysis = await analyzeBookmarksBatch(bookmarks, llm)
  console.log(`   分析了 ${analysis.bookmarks.length} 个书签`)
  console.log(`   发现了 ${analysis.topics.length} 个主题`)
  console.log(`   发现了 ${analysis.relationships.length} 个关系`)

  // Build knowledge graph
  console.log('🔨 构建知识图谱...')
  const graph = buildKnowledgeGraph(bookmarks, analysis)
  console.log(`   生成了 ${graph.nodes.length} 个节点`)
  console.log(`   生成了 ${graph.edges.length} 条边`)

  // Save knowledge graph
  console.log('💾 保存知识图谱...')
  await saveKnowledgeGraph(graph, graphPath)
  console.log(`   保存到: ${graphPath}`)

  return graph
}

/** Update knowledge graph */
export async function graphUpdate(
  bookmarks: Bookmark[],
  options: GraphOptions = {}
): Promise<BookmarkKnowledgeGraph> {
  const stateDir = options.stateDir || process.cwd() + '/open-bookmark'
  const graphPath = stateDir + '/bookmark-graph.json'

  console.log('📊 更新知识图谱...')

  // Load existing graph
  const existingGraph = await loadKnowledgeGraph(graphPath)
  if (!existingGraph) {
    console.log('   未找到现有知识图谱，将创建新的')
    return graphInit(bookmarks, options)
  }

  // Create LLM instance
  const llmConfig = options.llmConfig || {
    provider: 'openai',
    apiKey: process.env.OPENAI_API_KEY
  }
  const llm = createLLM(llmConfig)

  // Find new bookmarks
  const existingIds = new Set(
    existingGraph.nodes
      .filter(n => n.type === 'bookmark')
      .map(n => n.id.replace('bookmark:', ''))
  )
  const newBookmarks = bookmarks.filter(b => !existingIds.has(b.id))

  if (newBookmarks.length === 0) {
    console.log('   没有新增书签，无需更新')
    return existingGraph
  }

  console.log(`   发现 ${newBookmarks.length} 个新增书签`)

  // Analyze new bookmarks
  console.log('🔍 分析新增书签...')
  const analysis = await analyzeBookmarksBatch(newBookmarks, llm)

  // Build updated graph
  console.log('🔨 更新知识图谱...')
  const graph = buildKnowledgeGraph(bookmarks, analysis)
  console.log(`   更新后: ${graph.nodes.length} 个节点, ${graph.edges.length} 条边`)

  // Save updated graph
  console.log('💾 保存知识图谱...')
  await saveKnowledgeGraph(graph, graphPath)

  return graph
}

/** Query knowledge graph */
export async function graphQuery(
  keyword: string,
  options: GraphOptions = {}
): Promise<void> {
  const stateDir = options.stateDir || process.cwd() + '/open-bookmark'
  const graphPath = stateDir + '/bookmark-graph.json'

  console.log(`🔍 查询知识图谱: "${keyword}"`)

  // Load graph
  const graph = await loadKnowledgeGraph(graphPath)
  if (!graph) {
    console.error('❌ 未找到知识图谱，请先运行 graph init')
    return
  }

  // Query
  const result = queryGraph(graph, keyword)

  console.log('\n📊 查询结果:')
  console.log(`   找到 ${result.nodes.length} 个节点`)
  console.log(`   找到 ${result.edges.length} 条边`)

  if (result.nodes.length > 0) {
    console.log('\n📋 节点:')
    for (const node of result.nodes.slice(0, 10)) {
      console.log(`   - ${node.name} (${node.type}): ${node.summary}`)
    }
    if (result.nodes.length > 10) {
      console.log(`   ... 还有 ${result.nodes.length - 10} 个节点`)
    }
  }

  console.log('\n📈 统计:')
  console.log(`   总节点数: ${result.stats.totalNodes}`)
  console.log(`   总边数: ${result.stats.totalEdges}`)
  console.log(`   节点类型: ${JSON.stringify(result.stats.nodesByType)}`)
  console.log(`   边类型: ${JSON.stringify(result.stats.edgesByType)}`)
}

/** Show graph statistics */
export async function graphStats(options: GraphOptions = {}): Promise<void> {
  const stateDir = options.stateDir || process.cwd() + '/open-bookmark'
  const graphPath = stateDir + '/bookmark-graph.json'

  console.log('📊 知识图谱统计')

  // Load graph
  const graph = await loadKnowledgeGraph(graphPath)
  if (!graph) {
    console.error('❌ 未找到知识图谱，请先运行 graph init')
    return
  }

  const stats = getGraphStats(graph)

  console.log('\n📈 节点统计:')
  console.log(`   总节点数: ${stats.totalNodes}`)
  for (const [type, count] of Object.entries(stats.nodesByType)) {
    console.log(`   - ${type}: ${count}`)
  }

  console.log('\n📈 边统计:')
  console.log(`   总边数: ${stats.totalEdges}`)
  for (const [type, count] of Object.entries(stats.edgesByType)) {
    console.log(`   - ${type}: ${count}`)
  }

  console.log('\n📋 层:')
  for (const layer of graph.layers) {
    console.log(`   - ${layer.name}: ${layer.nodeIds.length} 个节点`)
  }

  console.log('\n🎯 学习路径:')
  for (const step of graph.tour) {
    console.log(`   ${step.order}. ${step.title}: ${step.description}`)
  }
}

/** Export knowledge graph */
export async function graphExport(options: GraphOptions = {}): Promise<void> {
  const stateDir = options.stateDir || process.cwd() + '/open-bookmark'
  const graphPath = stateDir + '/bookmark-graph.json'

  console.log('📤 导出知识图谱')

  // Load graph
  const graph = await loadKnowledgeGraph(graphPath)
  if (!graph) {
    console.error('❌ 未找到知识图谱，请先运行 graph init')
    return
  }

  const json = exportGraph(graph)
  console.log(json)
}

/** Export the knowledge graph as a self-contained HTML dashboard */
export async function graphDashboard(
  options: GraphOptions & { output?: string } = {}
): Promise<void> {
  const { writeFile } = await import('node:fs/promises')
  const { buildDashboardData, renderDashboardHtml } = await import('./dashboard.js')

  const stateDir = options.stateDir || process.cwd() + '/open-bookmark'
  const graphPath = stateDir + '/bookmark-graph.json'
  const outPath = options.output || stateDir + '/dashboard.html'

  console.log('📊 生成知识图谱 Dashboard')

  const graph = await loadKnowledgeGraph(graphPath)
  if (!graph) {
    console.error('❌ 未找到知识图谱，请先运行 graph init')
    return
  }

  const data = buildDashboardData(graph)
  const html = renderDashboardHtml(data)
  await writeFile(outPath, html, 'utf-8')

  console.log(`   ✅ ${data.meta.nodeCount} 节点 · ${data.meta.edgeCount} 边`)
  console.log(`   📄 ${outPath}`)
  console.log('   在浏览器中打开即可查看（离线可用，无需服务器）')
}

/** Generate rules from knowledge graph */
export async function graphRules(options: GraphOptions = {}): Promise<void> {
  const stateDir = options.stateDir || process.cwd() + '/open-bookmark'
  const graphPath = stateDir + '/bookmark-graph.json'

  console.log('📝 从知识图谱生成规则')

  // Load graph
  const graph = await loadKnowledgeGraph(graphPath)
  if (!graph) {
    console.error('❌ 未找到知识图谱，请先运行 graph init')
    return
  }

  const rules = generateClassificationRules(graph)

  console.log(`\n📋 生成了 ${rules.length} 条规则:`)
  for (const rule of rules) {
    console.log(`   - ${rule.name}: ${rule.reason}`)
  }

  // Save rules
  const { saveRules } = await import('../rules/serializer.js')
  const rulesPath = stateDir + '/classification-rules.yaml'
  await saveRules({ rules, summary: { totalRules: rules.length, protectRules: 0, domainRules: 0, keywordRules: 0, catchAllRules: 1 } }, rulesPath)
  console.log(`\n💾 规则已保存到: ${rulesPath}`)
}

/** Show learning path */
export async function graphTour(options: GraphOptions = {}): Promise<void> {
  const stateDir = options.stateDir || process.cwd() + '/open-bookmark'
  const graphPath = stateDir + '/bookmark-graph.json'

  console.log('🎯 学习路径')

  // Load graph
  const graph = await loadKnowledgeGraph(graphPath)
  if (!graph) {
    console.error('❌ 未找到知识图谱，请先运行 graph init')
    return
  }

  if (graph.tour.length === 0) {
    console.log('   暂无学习路径')
    return
  }

  console.log('\n📋 推荐学习顺序:')
  for (const step of graph.tour) {
    console.log(`\n${step.order}. ${step.title}`)
    console.log(`   ${step.description}`)
    console.log(`   相关节点: ${step.nodeIds.length} 个`)

    // Show related nodes
    for (const nodeId of step.nodeIds.slice(0, 3)) {
      const node = graph.nodes.find(n => n.id === nodeId)
      if (node) {
        console.log(`     - ${node.name} (${node.type})`)
      }
    }
    if (step.nodeIds.length > 3) {
      console.log(`     ... 还有 ${step.nodeIds.length - 3} 个节点`)
    }
  }
}

/** Classify bookmarks using knowledge graph */
export async function graphClassify(
  bookmarks: Bookmark[],
  options: GraphOptions = {}
): Promise<void> {
  const stateDir = options.stateDir || process.cwd() + '/open-bookmark'
  const graphPath = stateDir + '/bookmark-graph.json'

  console.log('🏷️  基于知识图谱分类书签')

  // Load graph
  const graph = await loadKnowledgeGraph(graphPath)
  if (!graph) {
    console.error('❌ 未找到知识图谱，请先运行 graph init')
    return
  }

  // Classify
  const { results, conflicts } = classifyBookmarks(bookmarks, graph)

  console.log('\n📊 分类结果:')
  const summary = getClassificationSummary(results)
  console.log(`   总书签数: ${summary.total}`)
  console.log(`   按来源: ${JSON.stringify(summary.bySource)}`)
  console.log(`   按目标: ${JSON.stringify(summary.byTarget)}`)

  if (conflicts.length > 0) {
    console.log(`\n⚠️  冲突 (${conflicts.length}):`)
    for (const conflict of conflicts.slice(0, 5)) {
      console.log(`   - ${conflict.bookmarkName}: ${conflict.candidates.map(c => c.targetFolder).join(', ')}`)
    }
    if (conflicts.length > 5) {
      console.log(`   ... 还有 ${conflicts.length - 5} 个冲突`)
    }
  }

  console.log('\n📋 分类示例 (前 10 个):')
  for (const result of results.slice(0, 10)) {
    console.log(`   ${result.bookmarkName}`)
    console.log(`     → ${result.targetFolder} (${result.reason})`)
  }
  if (results.length > 10) {
    console.log(`   ... 还有 ${results.length - 10} 个书签`)
  }
}
