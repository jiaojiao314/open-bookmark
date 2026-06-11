/**
 * Propose command - scan new bookmarks and generate incremental rules
 */

import type { Bookmark } from '../chrome/types.js'
import type { Rule } from '../rules/types.js'
import type { AnalysisResult } from '../analyzer/analyzer.js'
import { detectProfiles, readBookmarks } from '../chrome/chrome.js'
import { analyze } from '../analyzer/analyzer.js'
import { generateRules, validateRules } from '../rules/generator.js'
import { loadRules, saveRules } from '../rules/serializer.js'
import { loadProfile } from '../profile/engine.js'
import { extractDomain } from '../chrome/types.js'

/** Propose command options */
export interface ProposeOptions {
  dryRun?: boolean
  profile?: string
}

/** Compare two snapshots and find new bookmarks */
function findNewBookmarks(
  oldBookmarks: Bookmark[],
  newBookmarks: Bookmark[]
): Bookmark[] {
  const oldIds = new Set(oldBookmarks.map(b => b.id))
  return newBookmarks.filter(b => !oldIds.has(b.id))
}

/** Generate incremental rules for new bookmarks */
function generateIncrementalRules(
  newBookmarks: Bookmark[],
  existingRules: Rule[]
): Rule[] {
  const rules: Rule[] = []
  
  // Analyze new bookmarks
  const analysis = analyze(newBookmarks)
  
  // Get existing rule names to avoid duplicates
  const existingNames = new Set(existingRules.map(r => r.name))
  
  // Generate domain rules for new bookmarks
  for (const domain of analysis.domains.slice(0, 5)) {
    if (domain.count >= 3) {
      const ruleName = `new-domain-${domain.domain.replace(/\./g, '-')}`
      if (!existingNames.has(ruleName)) {
        rules.push({
          name: ruleName,
          match: {
            domain: [domain.domain]
          },
          action: 'move',
          target: '新增书签',
          reason: `新增书签域名: ${domain.domain} (${domain.count} 个)`,
          source: 'generated'
        })
      }
    }
  }
  
  // Generate keyword rules for new bookmarks
  for (const kw of analysis.keywords.slice(0, 5)) {
    if (kw.count >= 2) {
      const ruleName = `new-keyword-${kw.keyword}`
      if (!existingNames.has(ruleName)) {
        rules.push({
          name: ruleName,
          match: {
            titleContains: [kw.keyword]
          },
          action: 'move',
          target: '新增书签',
          reason: `新增书签关键词: ${kw.keyword} (${kw.count} 次)`,
          source: 'generated'
        })
      }
    }
  }
  
  return rules
}

/** Run propose command */
export async function proposeCommand(options: ProposeOptions): Promise<void> {
  const stateDir = process.cwd() + '/open-bookmark'
  const snapshotPath = stateDir + '/bookmarks-snapshot.json'
  const rulesPath = stateDir + '/classification-rules.yaml'
  
  // Load existing snapshot
  let oldBookmarks: Bookmark[] = []
  try {
    const { readFile } = await import('node:fs/promises')
    const data = await readFile(snapshotPath, 'utf-8')
    oldBookmarks = JSON.parse(data).map((b: Record<string, unknown>) => ({
      ...b,
      dateAdded: new Date(b.dateAdded as string),
      dateModified: new Date(b.dateModified as string)
    }))
  } catch {
    console.error('❌ 未找到快照文件，请先运行 init 命令')
    process.exit(1)
  }
  
  // Detect Chrome profiles
  console.log('🔍 检测 Chrome profiles...')
  const profiles = detectProfiles()
  
  if (profiles.length === 0) {
    console.error('❌ 未找到 Chrome 书签文件')
    process.exit(1)
  }
  
  // Select profile
  let profilePath: string
  if (options.profile) {
    const found = profiles.find(p => p.name === options.profile)
    if (!found) {
      console.error(`❌ 未找到 Chrome profile: ${options.profile}`)
      process.exit(1)
    }
    profilePath = found.path
  } else if (profiles.length === 1) {
    profilePath = profiles[0].path
    console.log(`📁 使用唯一 profile: ${profiles[0].name}`)
  } else {
    profilePath = profiles[0].path
    console.log(`📁 使用默认 profile: ${profiles[0].name}`)
  }
  
  // Scan new bookmarks
  console.log('📖 扫描书签...')
  const newBookmarks = await readBookmarks(profilePath)
  console.log(`   找到 ${newBookmarks.length} 个书签`)
  
  // Find new bookmarks
  console.log('\n🔍 对比差异...')
  const addedBookmarks = findNewBookmarks(oldBookmarks, newBookmarks)
  console.log(`   新增 ${addedBookmarks.length} 个书签`)
  
  if (addedBookmarks.length === 0) {
    console.log('\n✅ 没有新增书签，无需生成规则')
    return
  }
  
  // Load existing rules
  let existingRules: Rule[] = []
  try {
    existingRules = await loadRules(rulesPath)
  } catch {
    // No existing rules
  }
  
  // Generate incremental rules
  console.log('\n📝 生成增量规则...')
  const incrementalRules = generateIncrementalRules(addedBookmarks, existingRules)
  console.log(`   生成 ${incrementalRules.length} 条规则`)
  
  if (incrementalRules.length === 0) {
    console.log('\n✅ 没有需要生成的规则')
    return
  }
  
  // Show rules
  console.log('\n📋 新增规则:')
  for (const rule of incrementalRules) {
    console.log(`   - ${rule.name}: ${rule.reason}`)
  }
  
  // Dry run mode
  if (options.dryRun) {
    console.log('\n🔍 Dry run 模式，不实际保存')
    return
  }
  
  // Merge rules
  console.log('\n💾 合并规则...')
  const mergedRules = [...existingRules, ...incrementalRules]
  
  // Save merged rules
  const { writeFile } = await import('node:fs/promises')
  const yamlContent = mergedRules.map(rule => 
    `- name: ${rule.name}\n  match:\n    ${rule.match.matchAll ? 'match_all: true' : 
      rule.match.domain ? `domain:\n${rule.match.domain.map(d => `      - ${d}`).join('\n')}` :
      rule.match.titleContains ? `title_contains:\n${rule.match.titleContains.map(k => `      - ${k}`).join('\n')}` :
      ''
    }\n  action: ${rule.action}\n  target: ${rule.target || ''}\n  reason: ${rule.reason || ''}`
  ).join('\n\n')
  
  await writeFile(rulesPath, yamlContent, 'utf-8')
  console.log(`   规则已保存: ${rulesPath}`)
  
  // Update snapshot
  await writeFile(snapshotPath, JSON.stringify(newBookmarks, null, 2), 'utf-8')
  console.log(`   快照已更新: ${snapshotPath}`)
  
  console.log('\n✅ 增量规则生成完成!')
  console.log('\n下一步:')
  console.log('  1. 运行 preview 预览效果')
  console.log('  2. 运行 apply 执行规则')
}
