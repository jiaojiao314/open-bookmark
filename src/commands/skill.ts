/**
 * Skill command - generate and install SKILL.md for AI platforms
 */

import type { PlatformConfig } from '../platforms/config.js'
import { getPlatformNames } from '../platforms/config.js'
import { detectPlatforms } from '../platforms/detect.js'
import { saveSkillForPlatform } from '../platforms/skill.js'

/** Skill command options */
export interface SkillOptions {
  install?: boolean
  show?: boolean
  generate?: boolean
  project?: boolean
}

/** Run skill command */
export async function skillCommand(options: SkillOptions): Promise<void> {
  const rootDir = process.cwd()
  const project = options.project ?? false

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
    const scope = project ? '项目级' : '用户全局'
    console.log(`🔍 检测已安装的平台 (${scope})...`)
    const platforms = await detectPlatforms(rootDir, project)

    if (platforms.length === 0) {
      console.log('⚠️  未检测到已安装的平台')
      console.log(`支持的平台: ${getPlatformNames().join(', ')}`)
      return
    }

    console.log(`   检测到 ${platforms.length} 个平台:`)
    for (const platform of platforms) {
      console.log(`   - ${platform.config.name}`)
    }

    console.log('\n📝 安装 SKILL.md...')
    const installed: string[] = []
    const failed: string[] = []

    for (const platform of platforms) {
      try {
        const path = await saveSkillForPlatform(platform.config, rootDir, project)
        installed.push(platform.config.name)
        console.log(`   ✅ ${platform.config.name}: ${path}`)
      } catch (error) {
        failed.push(platform.config.name)
        console.error(`   ❌ ${platform.config.name}: ${error}`)
      }
    }

    const skipped = getPlatformNames().filter(
      name => !platforms.some(p => p.config.name === name)
    )

    console.log('\n✅ SKILL.md 安装完成!')
    console.log(`   已安装: ${installed.length ? installed.join(', ') : '无'}`)
    if (failed.length) console.log(`   失败: ${failed.join(', ')}`)
    if (skipped.length) console.log(`   跳过 (未检测到): ${skipped.join(', ')}`)
    console.log('\n下一步:')
    console.log('  1. 重启 AI 平台')
    console.log('  2. 在 AI 平台中调用 open-bookmark 命令')
    return
  }

  // Default: show help
  console.log('用法:')
  console.log('  open-bookmark skill install            # 安装到各平台 (用户全局)')
  console.log('  open-bookmark skill install --project  # 安装到当前项目')
  console.log('  open-bookmark skill show               # 显示 SKILL.md 内容')
  console.log('  open-bookmark skill generate           # 生成 SKILL.md 到本地目录')
}
