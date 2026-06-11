/**
 * Skill command - generate and install SKILL.md for AI platforms
 */

import type { PlatformConfig } from '../platforms/config.js'
import { detectPlatforms } from '../platforms/detect.js'
import { saveSkillForPlatform } from '../platforms/skill.js'

/** Skill command options */
export interface SkillOptions {
  install?: boolean
  show?: boolean
  generate?: boolean
}

/** Run skill command */
export async function skillCommand(options: SkillOptions): Promise<void> {
  const rootDir = process.cwd()
  
  // Show SKILL.md content
  if (options.show) {
    const { generateSkillContent } = await import('../platforms/skill.js')
    const content = generateSkillContent()
    console.log(content)
    return
  }
  
  // Generate SKILL.md to local directory
  if (options.generate) {
    const { writeFile, mkdir } = await import('node:fs/promises')
    const { join } = await import('node:path')
    const { generateSkillContent } = await import('../platforms/skill.js')
    
    const skillDir = join(rootDir, '.opencode', 'skills', 'bookmark')
    const skillPath = join(skillDir, 'SKILL.md')
    
    await mkdir(skillDir, { recursive: true })
    const content = generateSkillContent()
    await writeFile(skillPath, content, 'utf-8')
    
    console.log(`✅ SKILL.md 已生成: ${skillPath}`)
    return
  }
  
  // Install SKILL.md to platforms
  if (options.install) {
    console.log('🔍 检测已安装的平台...')
    const platforms = await detectPlatforms(rootDir)
    
    if (platforms.length === 0) {
      console.log('⚠️  未检测到已安装的平台')
      console.log('支持的平台: Claude Code, Cursor, OpenCode')
      return
    }
    
    console.log(`   检测到 ${platforms.length} 个平台:`)
    for (const platform of platforms) {
      console.log(`   - ${platform.config.name}`)
    }
    
    console.log('\n📝 生成 SKILL.md...')
    const savedPaths: string[] = []
    
    for (const platform of platforms) {
      try {
        const path = await saveSkillForPlatform(platform.config, rootDir)
        savedPaths.push(path)
        console.log(`   ✅ ${platform.config.name}: ${path}`)
      } catch (error) {
        console.error(`   ❌ ${platform.config.name}: ${error}`)
      }
    }
    
    console.log('\n✅ SKILL.md 安装完成!')
    console.log('\n下一步:')
    console.log('  1. 重启 AI 平台')
    console.log('  2. 在 AI 平台中调用 open-bookmark 命令')
    return
  }
  
  // Default: show help
  console.log('用法:')
  console.log('  open-bookmark skill install   # 安装 SKILL.md 到各平台')
  console.log('  open-bookmark skill show      # 显示 SKILL.md 内容')
  console.log('  open-bookmark skill generate  # 生成 SKILL.md 到本地目录')
}
