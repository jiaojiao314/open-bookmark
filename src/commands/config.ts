/**
 * Config command - view and modify user profile
 */

import type { UserProfile } from '../profile/types.js'
import type { AnalysisResult } from '../analyzer/analyzer.js'
import { loadProfile, saveProfile } from '../profile/engine.js'
import { runDialogue } from '../profile/dialogue.js'

/** Config command options */
export interface ConfigOptions {
  show?: boolean
  set?: string
  value?: string
  add?: string
  remove?: string
}

/** Display user profile */
function displayProfile(profile: UserProfile): void {
  console.log('\n👤 用户画像:')
  console.log(`   职业: ${profile.role || '未设置'}`)
  console.log(`   技术栈: ${profile.techStack.join(', ') || '未设置'}`)
  console.log(`   兴趣: ${profile.interests.join(', ') || '未设置'}`)
  console.log(`   语言: ${profile.language}`)
  console.log(`   已确认: ${profile.confirmed ? '是' : '否'}`)
  console.log('\n⚙️  偏好设置:')
  console.log(`   博客策略: ${profile.preferences.blogStrategy}`)
  console.log(`   保护路径: ${profile.preferences.protectedPaths.join(', ') || '无'}`)
  console.log(`   Catch-all 目标: ${profile.preferences.catchAllTarget}`)
}

/** Run config command */
export async function configCommand(options: ConfigOptions): Promise<void> {
  const stateDir = process.cwd() + '/open-bookmark'
  const profilePath = stateDir + '/profile.json'
  
  // Load profile
  let profile = await loadProfile(profilePath)
  if (!profile) {
    console.error('❌ 未找到画像文件，请先运行 init 命令')
    process.exit(1)
  }
  
  // Show current profile
  if (options.show) {
    displayProfile(profile)
    return
  }
  
  // Set single field
  if (options.set) {
    const field = options.set
    const value = options.value
    
    switch (field) {
      case 'role':
        profile.role = value || ''
        break
      case 'language':
        if (['zh', 'en', 'mixed'].includes(value || '')) {
          profile.language = value as 'zh' | 'en' | 'mixed'
        } else {
          console.error('❌ 语言必须是 zh、en 或 mixed')
          process.exit(1)
        }
        break
      case 'blogStrategy':
        if (['集中', '按主题分散', '跳过'].includes(value || '')) {
          profile.preferences.blogStrategy = value as '集中' | '按主题分散' | '跳过'
        } else {
          console.error('❌ 博客策略必须是 集中、按主题分散 或 跳过')
          process.exit(1)
        }
        break
      case 'catchAllTarget':
        profile.preferences.catchAllTarget = value || '99-人工待确认'
        break
      default:
        console.error(`❌ 未知字段: ${field}`)
        console.log('可用字段: role, language, blogStrategy, catchAllTarget')
        process.exit(1)
    }
    
    await saveProfile(profile, profilePath)
    console.log(`✅ 已设置 ${field} = ${value}`)
    return
  }
  
  // Add to array field
  if (options.add) {
    const field = options.add
    const value = options.value
    
    if (!value) {
      console.error('❌ 请指定要添加的值')
      process.exit(1)
    }
    
    switch (field) {
      case 'tech':
        if (!profile.techStack.includes(value)) {
          profile.techStack.push(value)
        }
        break
      case 'interests':
        if (!profile.interests.includes(value)) {
          profile.interests.push(value)
        }
        break
      case 'protectedPaths':
        if (!profile.preferences.protectedPaths.includes(value)) {
          profile.preferences.protectedPaths.push(value)
        }
        break
      default:
        console.error(`❌ 未知字段: ${field}`)
        console.log('可用字段: tech, interests, protectedPaths')
        process.exit(1)
    }
    
    await saveProfile(profile, profilePath)
    console.log(`✅ 已添加 ${value} 到 ${field}`)
    return
  }
  
  // Remove from array field
  if (options.remove) {
    const field = options.remove
    const value = options.value
    
    if (!value) {
      console.error('❌ 请指定要移除的值')
      process.exit(1)
    }
    
    switch (field) {
      case 'tech':
        profile.techStack = profile.techStack.filter(t => t !== value)
        break
      case 'interests':
        profile.interests = profile.interests.filter(i => i !== value)
        break
      case 'protectedPaths':
        profile.preferences.protectedPaths = profile.preferences.protectedPaths.filter(p => p !== value)
        break
      default:
        console.error(`❌ 未知字段: ${field}`)
        console.log('可用字段: tech, interests, protectedPaths')
        process.exit(1)
    }
    
    await saveProfile(profile, profilePath)
    console.log(`✅ 已从 ${field} 移除 ${value}`)
    return
  }
  
  // Interactive mode
  console.log('\n💬 交互式修改画像...')
  
  // Load analysis if available
  let analysis: AnalysisResult | undefined
  try {
    const analysisPath = stateDir + '/analysis.json'
    const { readFile } = await import('node:fs/promises')
    const analysisData = await readFile(analysisPath, 'utf-8')
    analysis = JSON.parse(analysisData)
  } catch {
    // Analysis not available, continue without it
  }
  
  if (analysis) {
    profile = await runDialogue({ profile, inferences: [] }, analysis)
  } else {
    console.log('⚠️  未找到分析结果，将使用简化对话')
    profile = await runDialogue({ profile, inferences: [] }, {
      summary: { totalBookmarks: 0, uniqueDomains: 0, topFolders: 0, rootBookmarks: 0 },
      domains: [],
      folders: [],
      keywords: [],
      patterns: { internalCount: 0, githubCount: 0, blogCount: 0, blogDomains: [], aiCount: 0, devopsCount: 0 },
      orphanCount: 0,
      folderDomains: {}
    })
  }
  
  await saveProfile(profile, profilePath)
  console.log('\n✅ 画像已更新')
  displayProfile(profile)
}
