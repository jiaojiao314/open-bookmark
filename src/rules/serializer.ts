/**
 * Rule serializer - handles YAML serialization with comments
 */

import { stringify } from 'yaml'
import type { Rule } from './types.js'
import type { GeneratedRules } from './generator.js'

/** Serialize rules to YAML with comments */
export function serializeRules(generated: GeneratedRules): string {
  const { rules, summary } = generated

  // Build YAML document with comments
  const lines: string[] = []

  // Header comment
  lines.push('# 书签分类规则')
  lines.push('# 由 open-bookmark 自动生成')
  lines.push(`# 共 ${summary.totalRules} 条规则`)
  lines.push('')

  // Rules array
  const rulesData = rules.map(rule => {
    const data: Record<string, unknown> = {
      name: rule.name,
      match: {},
      action: rule.action
    }

    // Add match conditions
    if (rule.match.matchAll) {
      data.match = { match_all: true }
    } else {
      const match: Record<string, unknown> = {}
      if (rule.match.domain && rule.match.domain.length > 0) {
        match.domain = rule.match.domain
      }
      if (rule.match.urlRegex) {
        match.url_regex = rule.match.urlRegex
      }
      if (rule.match.titleContains && rule.match.titleContains.length > 0) {
        match.title_contains = rule.match.titleContains
      }
      if (rule.match.titleExclude && rule.match.titleExclude.length > 0) {
        match.title_exclude = rule.match.titleExclude
      }
      if (rule.match.folderPath) {
        match.folder_path = rule.match.folderPath
      }
      if (rule.match.folderPrefix) {
        match.folder_prefix = rule.match.folderPrefix
      }
      data.match = match
    }

    // Add target if present
    if (rule.target) {
      data.target = rule.target
    }
    if (rule.subfolder) {
      data.subfolder = rule.subfolder
    }

    // Add metadata
    if (rule.reason) {
      data.reason = rule.reason
    }
    if (rule.source) {
      data.source = rule.source
    }

    return data
  })

  // Convert to YAML
  const yamlContent = stringify(rulesData, {
    indent: 2,
    lineWidth: 120,
    minContentWidth: 20
  })

  // Add comments for each rule
  const yamlLines = yamlContent.split('\n')
  let ruleIndex = 0
  const commentedLines: string[] = []

  for (const line of yamlLines) {
    if (line.startsWith('- name:')) {
      if (ruleIndex > 0) {
        commentedLines.push('')
      }
      const rule = rules[ruleIndex]
      commentedLines.push(`# ${ruleIndex + 1}. ${rule.reason || rule.name}`)
      ruleIndex++
    }
    commentedLines.push(line)
  }

  lines.push(...commentedLines)

  return lines.join('\n')
}

/** Serialize rules to plain YAML (without comments) */
export function serializeRulesPlain(rules: Rule[]): string {
  const rulesData = rules.map(rule => ({
    name: rule.name,
    match: rule.match,
    action: rule.action,
    target: rule.target,
    subfolder: rule.subfolder,
    reason: rule.reason,
    source: rule.source
  }))

  return stringify(rulesData, { indent: 2 })
}

/** Save rules to YAML file */
export async function saveRules(generated: GeneratedRules, filePath: string): Promise<void> {
  const { writeFile, mkdir } = await import('node:fs/promises')
  const { dirname } = await import('node:path')

  // Ensure directory exists
  await mkdir(dirname(filePath), { recursive: true })

  // Serialize with comments
  const content = serializeRules(generated)

  // Write to file
  await writeFile(filePath, content, 'utf-8')
}

/** Load rules from YAML file */
export async function loadRules(filePath: string): Promise<Rule[]> {
  const { readFile } = await import('node:fs/promises')
  const { parse } = await import('yaml')

  try {
    const content = await readFile(filePath, 'utf-8')
    const data = parse(content)

    if (!Array.isArray(data)) {
      return []
    }

    return data.map((item: Record<string, unknown>) => ({
      name: item.name as string,
      match: {
        domain: (item.match as Record<string, unknown>)?.domain as string[] | undefined,
        urlRegex: (item.match as Record<string, unknown>)?.url_regex as string | undefined,
        titleContains: (item.match as Record<string, unknown>)?.title_contains as string[] | undefined,
        titleExclude: (item.match as Record<string, unknown>)?.title_exclude as string[] | undefined,
        folderPath: (item.match as Record<string, unknown>)?.folder_path as string | undefined,
        folderPrefix: (item.match as Record<string, unknown>)?.folder_prefix as string | undefined,
        matchAll: (item.match as Record<string, unknown>)?.match_all as boolean | undefined
      },
      action: item.action as 'move' | 'skip' | 'analyze',
      target: item.target as string | undefined,
      subfolder: item.subfolder as string | undefined,
      reason: item.reason as string | undefined,
      source: item.source as 'generated' | 'user-defined' | 'template' | undefined
    }))
  } catch {
    return []
  }
}
