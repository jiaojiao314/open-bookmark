/**
 * Prepare command - prepare bookmark data for AI analysis
 */

import type { Bookmark } from '../chrome/types.js'
import type { PrepareOptions } from '../ai/prepare.js'
import { prepareBookmarksForAI } from '../ai/prepare.js'

/** Run prepare command */
export async function prepareCommand(options: PrepareOptions): Promise<void> {
  const stateDir = process.cwd() + '/open-bookmark'
  const snapshotPath = stateDir + '/bookmarks-snapshot.json'
  const aiDir = stateDir + '/ai'

  // Load bookmarks from snapshot
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

  // Prepare data
  const result = prepareBookmarksForAI(bookmarks, options)

  // Write output
  const { writeFile, mkdir } = await import('node:fs/promises')
  await mkdir(aiDir, { recursive: true })

  const format = options.format || 'ai-ready'
  const outputFile = format === 'domains' ? 'domains.json' : format === 'keywords' ? 'keywords.json' : 'bookmarks-for-ai.json'
  const outputPath = aiDir + '/' + outputFile

  await writeFile(outputPath, JSON.stringify(result, null, 2), 'utf-8')

  console.log(`✅ 数据已导出: ${outputPath}`)

  if (format === 'ai-ready') {
    const data = result as { summary: { total: number }; samples: unknown[] }
    console.log(`   书签数: ${data.summary.total}`)
    console.log(`   采样数: ${data.samples.length}`)
  }
}
