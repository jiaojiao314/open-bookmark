/**
 * CLI entry point - main command and subcommand registration
 */

import { Command } from 'commander'
import { createRequire } from 'node:module'
import { resolve, join } from 'node:path'
import { homedir } from 'node:os'

import { detectProfiles, readBookmarks } from '../chrome/chrome.js'
import { analyze } from '../analyzer/analyzer.js'
import { inferProfile, suggestProtectedPaths, saveProfile } from '../profile/engine.js'
import { runDialogue } from '../profile/dialogue.js'
import { generateRules, validateRules } from '../rules/generator.js'
import { saveRules, loadRules } from '../rules/serializer.js'
import { preview, apply, verify, createBackup, loadBackup } from '../executor/executor.js'
import { StateManager, stateFileExists } from '../state/manager.js'
import { configCommand } from '../commands/config.js'
import { proposeCommand } from '../commands/propose.js'
import { skillCommand } from '../commands/skill.js'

const require = createRequire(import.meta.url)
const { version } = require('../../package.json')

const program = new Command()

/** Default state directory */
const DEFAULT_STATE_DIR = resolve(process.cwd(), 'open-bookmark')

program
  .name('open-bookmark')
  .description('Spec-driven browser bookmark management. Define your rules first, then execute.')
  .version(version)
  .option('-d, --dir <dir>', 'State directory', DEFAULT_STATE_DIR)

/** Helper: get state directory from options */
function getStateDir(options: { dir: string }): string {
  return resolve(options.dir)
}

/** Helper: create state manager */
function createStateManager(options: { dir: string }): StateManager {
  return new StateManager(getStateDir(options))
}

// ============================================
// init command
// ============================================
program
  .command('init')
  .description('Initialize open-bookmark: scan bookmarks, analyze, generate rules')
  .option('--yes', 'Skip dialogue, use defaults')
  .option('--profile <name>', 'Chrome profile to use')
  .action(async (options) => {
    try {
      const stateDir = getStateDir(program.opts())
      const manager = createStateManager(program.opts())

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
        // Use first profile for now (could add interactive selection)
        profilePath = profiles[0].path
        console.log(`📁 使用默认 profile: ${profiles[0].name}`)
      }

      // Step 1: Scan bookmarks
      console.log('📖 扫描书签...')
      const bookmarks = await readBookmarks(profilePath)
      console.log(`   找到 ${bookmarks.length} 个书签`)

      // Save snapshot
      const snapshotPath = join(stateDir, 'bookmarks-snapshot.json')
      const { writeFile, mkdir } = await import('node:fs/promises')
      await mkdir(stateDir, { recursive: true })
      await writeFile(snapshotPath, JSON.stringify(bookmarks, null, 2), 'utf-8')
      console.log(`   快照已保存: ${snapshotPath}`)

      // Load or create state
      let state = await manager.load()

      // Update bookmarks info
      await manager.updateBookmarks({
        snapshot: snapshotPath,
        count: bookmarks.length,
        lastScan: new Date()
      })

      // Step 2: Analyze
      console.log('\n📊 分析书签...')
      const analysis = analyze(bookmarks)
      console.log(`   域名数: ${analysis.summary.uniqueDomains}`)
      console.log(`   文件夹数: ${analysis.summary.topFolders}`)
      console.log(`   博客书签: ${analysis.patterns.blogCount}`)
      console.log(`   AI 书签: ${analysis.patterns.aiCount}`)
      console.log(`   DevOps 书签: ${analysis.patterns.devopsCount}`)

      // Save analysis
      const analysisPath = join(stateDir, 'analysis.json')
      await writeFile(analysisPath, JSON.stringify(analysis, null, 2), 'utf-8')

      // Step 3: Infer profile
      console.log('\n👤 推测用户画像...')
      const draft = inferProfile(analysis)
      console.log(`   职业: ${draft.profile.role || '未知'}`)
      console.log(`   技术栈: ${draft.profile.techStack.join(', ') || '未知'}`)
      console.log(`   兴趣: ${draft.profile.interests.join(', ') || '未知'}`)
      console.log(`   语言: ${draft.profile.language}`)

      // Step 4: Dialogue (if not skipped)
      let profile = draft.profile
      if (!options.yes) {
        console.log('\n💬 开始对话...')
        profile = await runDialogue(draft, analysis)
        console.log('   画像已确认')
      } else {
        console.log('\n⏭️  跳过对话，使用默认值')
        profile.confirmed = true
        profile.confirmedAt = new Date()
      }

      // Save profile
      const profilePath2 = join(stateDir, 'profile.json')
      await saveProfile(profile, profilePath2)

      // Update state with profile
      await manager.updateProfile(profile)

      // Step 5: Generate rules
      console.log('\n📝 生成规则...')
      const generated = generateRules(analysis, profile)
      console.log(`   生成 ${generated.summary.totalRules} 条规则`)
      console.log(`   - 保护规则: ${generated.summary.protectRules}`)
      console.log(`   - 域名规则: ${generated.summary.domainRules}`)
      console.log(`   - 关键词规则: ${generated.summary.keywordRules}`)
      console.log(`   - Catch-all: ${generated.summary.catchAllRules}`)

      // Validate rules
      const validation = validateRules(generated.rules)
      if (!validation.valid) {
        console.error('\n❌ 规则校验失败:')
        for (const error of validation.errors) {
          console.error(`   - ${error}`)
        }
        process.exit(1)
      }

      if (validation.warnings.length > 0) {
        console.log('\n⚠️  规则警告:')
        for (const warning of validation.warnings) {
          console.log(`   - ${warning}`)
        }
      }

      // Save rules
      const rulesPath = join(stateDir, 'classification-rules.yaml')
      await saveRules(generated, rulesPath)
      console.log(`   规则已保存: ${rulesPath}`)

      // Update rules info
      await manager.updateRules({
        file: rulesPath,
        count: generated.summary.totalRules,
        lastGenerated: new Date()
      })

      // Transition to preview phase
      await manager.transitionTo('preview')

      console.log('\n✅ 初始化完成!')
      console.log('\n下一步:')
      console.log('  1. 检查规则文件: ' + rulesPath)
      console.log('  2. 运行 preview 预览效果')
      console.log('  3. 运行 apply 执行规则')

    } catch (error) {
      console.error('\n❌ 初始化失败:', error)
      process.exit(1)
    }
  })

// ============================================
// status command
// ============================================
program
  .command('status')
  .description('Show current status and next steps')
  .action(async () => {
    try {
      const manager = createStateManager(program.opts())
      const state = await manager.load()

      console.log('📊 open-bookmark 状态')
      console.log('='.repeat(40))
      console.log(`阶段: ${manager.getPhaseDescription()}`)
      console.log(`工作流: ${state.workflow}`)
      console.log()

      // Bookmarks info
      if (state.bookmarks.snapshot) {
        console.log('📖 书签信息:')
        console.log(`   数量: ${state.bookmarks.count}`)
        console.log(`   快照: ${state.bookmarks.snapshot}`)
        console.log(`   上次扫描: ${state.bookmarks.lastScan.toLocaleString()}`)
        console.log()
      }

      // Rules info
      if (state.rules.file) {
        console.log('📝 规则信息:')
        console.log(`   文件: ${state.rules.file}`)
        console.log(`   数量: ${state.rules.count}`)
        console.log(`   上次生成: ${state.rules.lastGenerated.toLocaleString()}`)
        console.log()
      }

      // Profile info
      if (state.profile.role) {
        console.log('👤 用户画像:')
        console.log(`   职业: ${state.profile.role}`)
        console.log(`   技术栈: ${state.profile.techStack.join(', ') || '未知'}`)
        console.log(`   语言: ${state.profile.language}`)
        console.log(`   已确认: ${state.profile.confirmed ? '是' : '否'}`)
        console.log()
      }

      // Backups
      if (state.backups.length > 0) {
        console.log('💾 备份:')
        for (const backup of state.backups.slice(-3)) {
          console.log(`   - ${backup.path} (${backup.bookmarksCount} 书签)`)
        }
        console.log()
      }

      // Next steps
      console.log('📋 下一步:')
      const steps = manager.getNextSteps()
      for (const step of steps) {
        console.log(`   • ${step}`)
      }

    } catch (error) {
      console.error('❌ 获取状态失败:', error)
      process.exit(1)
    }
  })

// ============================================
// preview command
// ============================================
program
  .command('preview')
  .description('Preview rule execution effects')
  .action(async () => {
    try {
      const stateDir = getStateDir(program.opts())
      const manager = createStateManager(program.opts())

      // Load state
      const state = await manager.load()

      // Load bookmarks
      console.log('📖 加载书签...')
      const { readFile } = await import('node:fs/promises')
      const bookmarksData = await readFile(state.bookmarks.snapshot, 'utf-8')
      const bookmarks = JSON.parse(bookmarksData).map((b: Record<string, unknown>) => ({
        ...b,
        dateAdded: new Date(b.dateAdded as string),
        dateModified: new Date(b.dateModified as string)
      }))

      // Load rules
      console.log('📝 加载规则...')
      const rules = await loadRules(state.rules.file)
      console.log(`   ${rules.length} 条规则`)

      // Preview
      console.log('\n🔍 预览效果...')
      const result = preview(bookmarks, rules)

      console.log('\n📊 预览结果:')
      console.log(`   总书签数: ${result.totalBookmarks}`)
      console.log(`   匹配书签: ${result.matchedBookmarks}`)
      console.log(`   未匹配: ${result.unmatchedBookmarks}`)

      if (result.conflicts.length > 0) {
        console.log(`\n⚠️  冲突 (${result.conflicts.length}):`)
        for (const conflict of result.conflicts.slice(0, 5)) {
          console.log(`   - ${conflict.bookmarkName}: ${conflict.ruleNames.join(', ')}`)
        }
        if (result.conflicts.length > 5) {
          console.log(`   ... 还有 ${result.conflicts.length - 5} 个冲突`)
        }
      }

      console.log('\n📋 移动计划 (前 10 个):')
      for (const move of result.moves.slice(0, 10)) {
        console.log(`   ${move.bookmarkName}`)
        console.log(`     ${move.currentFolder} → ${move.targetFolder}`)
      }
      if (result.moves.length > 10) {
        console.log(`   ... 还有 ${result.moves.length - 10} 个移动`)
      }

    } catch (error) {
      console.error('❌ 预览失败:', error)
      process.exit(1)
    }
  })

// ============================================
// apply command
// ============================================
program
  .command('apply')
  .description('Apply rules to bookmarks')
  .option('--dry-run', 'Dry run, do not actually modify')
  .action(async (options) => {
    try {
      const stateDir = getStateDir(program.opts())
      const manager = createStateManager(program.opts())

      // Load state
      const state = await manager.load()

      // Check phase
      if (!manager.canTransitionTo('apply') && state.phase !== 'preview') {
        console.error('❌ 当前阶段不允许执行 apply')
        console.log('   请先运行 preview 命令')
        process.exit(1)
      }

      // Load bookmarks
      console.log('📖 加载书签...')
      const { readFile } = await import('node:fs/promises')
      const bookmarksData = await readFile(state.bookmarks.snapshot, 'utf-8')
      const bookmarks = JSON.parse(bookmarksData).map((b: Record<string, unknown>) => ({
        ...b,
        dateAdded: new Date(b.dateAdded as string),
        dateModified: new Date(b.dateModified as string)
      }))

      // Load rules
      console.log('📝 加载规则...')
      const rules = await loadRules(state.rules.file)
      console.log(`   ${rules.length} 条规则`)

      // Create backup
      console.log('\n💾 创建备份...')
      const backupDir = join(stateDir, 'backups')
      const backupPath = await createBackup(bookmarks, backupDir)
      console.log(`   备份已保存: ${backupPath}`)

      if (options.dryRun) {
        console.log('\n🔍 Dry run 模式，不实际修改')
        const result = preview(bookmarks, rules)
        console.log(`   将移动 ${result.matchedBookmarks} 个书签`)
        return
      }

      // Apply rules
      console.log('\n⚡ 执行规则...')
      const result = apply(bookmarks, rules)

      console.log('\n📊 执行结果:')
      console.log(`   移动: ${result.result.moved}`)
      console.log(`   跳过: ${result.result.skipped}`)

      if (result.result.errors.length > 0) {
        console.log(`\n❌ 错误 (${result.result.errors.length}):`)
        for (const error of result.result.errors) {
          console.log(`   - ${error.bookmarkName}: ${error.error}`)
        }
      }

      // Add backup to state
      await manager.addBackup({
        path: backupPath,
        created: new Date(),
        bookmarksCount: bookmarks.length
      })

      // Transition to verify phase
      await manager.transitionTo('verify')

      console.log('\n✅ 执行完成!')
      console.log('\n下一步:')
      console.log('  1. 运行 verify 验证结果')
      console.log('  2. 如有问题，运行 rollback 回滚')

    } catch (error) {
      console.error('❌ 执行失败:', error)
      process.exit(1)
    }
  })

// ============================================
// verify command
// ============================================
program
  .command('verify')
  .description('Verify results after apply')
  .action(async () => {
    try {
      const manager = createStateManager(program.opts())

      // Load state
      const state = await manager.load()

      // Load current bookmarks
      console.log('📖 加载当前书签...')
      const { readFile } = await import('node:fs/promises')
      const bookmarksData = await readFile(state.bookmarks.snapshot, 'utf-8')
      const currentBookmarks = JSON.parse(bookmarksData).map((b: Record<string, unknown>) => ({
        ...b,
        dateAdded: new Date(b.dateAdded as string),
        dateModified: new Date(b.dateModified as string)
      }))

      // Load original bookmarks from backup
      const lastBackup = state.backups[state.backups.length - 1]
      if (!lastBackup) {
        console.error('❌ 未找到备份，无法验证')
        process.exit(1)
      }

      console.log('📖 加载备份书签...')
      const originalBookmarks = await loadBackup(lastBackup.path)

      // Get protected paths
      const protectedPaths = state.profile.preferences.protectedPaths

      // Verify
      console.log('\n🔍 验证结果...')
      const result = verify(originalBookmarks, currentBookmarks, protectedPaths)

      console.log('\n📊 验证结果:')
      console.log(`   状态: ${result.valid ? '✅ 通过' : '❌ 失败'}`)
      console.log(`   预期数量: ${result.stats.expectedCount}`)
      console.log(`   实际数量: ${result.stats.actualCount}`)
      console.log(`   移动数量: ${result.stats.movedCount}`)
      console.log(`   受保护路径: ${result.stats.protectedCount}`)

      if (result.issues.length > 0) {
        console.log(`\n⚠️  问题 (${result.issues.length}):`)
        for (const issue of result.issues) {
          console.log(`   - [${issue.type}] ${issue.message}`)
        }
      }

      if (result.valid) {
        console.log('\n✅ 验证通过!')
      } else {
        console.log('\n❌ 验证失败，请检查问题')
        process.exit(1)
      }

    } catch (error) {
      console.error('❌ 验证失败:', error)
      process.exit(1)
    }
  })

// ============================================
// rollback command
// ============================================
program
  .command('rollback')
  .description('Rollback to last backup')
  .action(async () => {
    try {
      const manager = createStateManager(program.opts())

      // Load state
      const state = await manager.load()

      // Check if backup exists
      if (state.backups.length === 0) {
        console.error('❌ 未找到备份，无法回滚')
        process.exit(1)
      }

      const lastBackup = state.backups[state.backups.length - 1]
      console.log(`📖 加载备份: ${lastBackup.path}`)

      // Load backup
      const backupBookmarks = await loadBackup(lastBackup.path)
      if (backupBookmarks.length === 0) {
        console.error('❌ 备份文件为空或损坏')
        process.exit(1)
      }

      console.log(`   ${backupBookmarks.length} 个书签`)

      // Write backup to snapshot
      const { writeFile } = await import('node:fs/promises')
      await writeFile(
        state.bookmarks.snapshot,
        JSON.stringify(backupBookmarks, null, 2),
        'utf-8'
      )

      console.log('\n✅ 回滚完成!')
      console.log(`   已恢复到 ${lastBackup.created.toLocaleString()} 的备份`)

    } catch (error) {
      console.error('❌ 回滚失败:', error)
      process.exit(1)
    }
  })

// ============================================
// analyze command
// ============================================
program
  .command('analyze')
  .description('Deep analysis of bookmarks (read-only)')
  .action(async () => {
    try {
      const manager = createStateManager(program.opts())

      // Load state
      const state = await manager.load()

      if (!state.bookmarks.snapshot) {
        console.error('❌ 未找到书签快照，请先运行 init')
        process.exit(1)
      }

      // Load bookmarks
      console.log('📖 加载书签...')
      const { readFile } = await import('node:fs/promises')
      const bookmarksData = await readFile(state.bookmarks.snapshot, 'utf-8')
      const bookmarks = JSON.parse(bookmarksData).map((b: Record<string, unknown>) => ({
        ...b,
        dateAdded: new Date(b.dateAdded as string),
        dateModified: new Date(b.dateModified as string)
      }))

      // Analyze
      console.log('\n📊 分析结果...')
      const analysis = analyze(bookmarks)

      console.log('\n📈 概览:')
      console.log(`   总书签数: ${analysis.summary.totalBookmarks}`)
      console.log(`   域名数: ${analysis.summary.uniqueDomains}`)
      console.log(`   文件夹数: ${analysis.summary.topFolders}`)
      console.log(`   根目录书签: ${analysis.summary.rootBookmarks}`)

      console.log('\n🌐 Top 10 域名:')
      for (const domain of analysis.domains.slice(0, 10)) {
        console.log(`   ${domain.domain}: ${domain.count}`)
      }

      console.log('\n📁 Top 10 文件夹:')
      for (const folder of analysis.folders.slice(0, 10)) {
        console.log(`   ${folder.name}: ${folder.count}`)
      }

      console.log('\n🔗 URL 模式:')
      console.log(`   内网地址: ${analysis.patterns.internalCount}`)
      console.log(`   GitHub: ${analysis.patterns.githubCount}`)
      console.log(`   博客: ${analysis.patterns.blogCount}`)
      console.log(`   AI 平台: ${analysis.patterns.aiCount}`)
      console.log(`   DevOps: ${analysis.patterns.devopsCount}`)

      if (analysis.keywords.length > 0) {
        console.log('\n🔤 Top 10 关键词:')
        for (const kw of analysis.keywords.slice(0, 10)) {
          console.log(`   ${kw.keyword}: ${kw.count}`)
        }
      }

    } catch (error) {
      console.error('❌ 分析失败:', error)
      process.exit(1)
    }
  })

// ============================================
// config command
// ============================================
program
  .command('config')
  .description('View and modify user profile')
  .option('--show', 'Show current profile')
  .option('--set <field>', 'Set a field value')
  .option('--value <value>', 'Value for --set option')
  .option('--add <field>', 'Add value to array field')
  .option('--remove <field>', 'Remove value from array field')
  .action(async (options) => {
    try {
      await configCommand(options)
    } catch (error) {
      console.error('❌ 配置失败:', error)
      process.exit(1)
    }
  })

// ============================================
// propose command
// ============================================
program
  .command('propose')
  .description('Scan new bookmarks and generate incremental rules')
  .option('--dry-run', 'Dry run, do not save')
  .option('--profile <name>', 'Chrome profile to use')
  .action(async (options) => {
    try {
      await proposeCommand(options)
    } catch (error) {
      console.error('❌ 增量规则生成失败:', error)
      process.exit(1)
    }
  })

// ============================================
// skill command
// ============================================
const skillCmd = program
  .command('skill')
  .description('Generate and install SKILL.md for AI platforms')

skillCmd
  .command('install')
  .description('Install SKILL.md to detected platforms')
  .action(async () => {
    try {
      await skillCommand({ install: true })
    } catch (error) {
      console.error('❌ SKILL.md 安装失败:', error)
      process.exit(1)
    }
  })

skillCmd
  .command('show')
  .description('Show SKILL.md content')
  .action(async () => {
    try {
      await skillCommand({ show: true })
    } catch (error) {
      console.error('❌ SKILL.md 显示失败:', error)
      process.exit(1)
    }
  })

// ============================================
// Error handling
// ============================================
program.showHelpAfterError('(使用 --help 查看帮助)')

program.parse()
