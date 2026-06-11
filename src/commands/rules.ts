/**
 * Rules command - convert AI tags to rules
 */

import { readFile } from 'node:fs/promises'
import { parseAITags, tagsToRules, mergeRules } from '../ai/parse.js'
import { loadRules } from '../rules/serializer.js'
import { serializeRulesPlain } from '../rules/serializer.js'

/** Rules command options */
export interface RulesOptions {
  from: string
  merge?: boolean
}

/** Run rules command */
export async function rulesCommand(options: RulesOptions): Promise<void> {
  const stateDir = process.cwd() + '/open-bookmark'
  const rulesPath = stateDir + '/classification-rules.yaml'

  // Read AI tags file
  let tagsData: unknown
  try {
    const content = await readFile(options.from, 'utf-8')
    tagsData = JSON.parse(content)
  } catch {
    console.error(`❌ 无法读取文件: ${options.from}`)
    process.exit(1)
  }

  // Parse and validate
  const tags = parseAITags(tagsData)
  if (!tags) {
    console.error('❌ AI 标签格式无效')
    console.error('期望格式: { "categories": [{ "name": "...", "domains": [...], "keywords": [...], "target": "..." }] }')
    process.exit(1)
  }

  console.log(`📝 解析到 ${tags.categories.length} 个分类`)

  // Convert to rules
  const newRules = tagsToRules(tags)
  console.log(`   生成 ${newRules.length} 条规则`)

  // Merge with existing rules if requested
  let finalRules = newRules
  if (options.merge) {
    const existingRules = await loadRules(rulesPath)
    finalRules = mergeRules(existingRules, newRules)
    console.log(`   合并后共 ${finalRules.length} 条规则`)
  }

  // Write rules
  const { writeFile, mkdir } = await import('node:fs/promises')
  const { dirname } = await import('node:path')
  await mkdir(dirname(rulesPath), { recursive: true })

  const yamlContent = serializeRulesPlain(finalRules)
  await writeFile(rulesPath, yamlContent, 'utf-8')

  console.log(`✅ 规则已保存: ${rulesPath}`)
}
