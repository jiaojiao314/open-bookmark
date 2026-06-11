/**
 * Tests for rules: validation and serialize/load round-trip
 */

import { describe, it, expect } from 'vitest'
import { tmpdir } from 'node:os'
import { join } from 'node:path'
import { mkdtemp, rm } from 'node:fs/promises'
import { validateRules } from '../src/rules/generator.js'
import { saveRules, loadRules } from '../src/rules/serializer.js'
import type { Rule } from '../src/rules/types.js'
import type { GeneratedRules } from '../src/rules/generator.js'

const sampleRules: Rule[] = [
  { name: 'protect-private', match: { folderPrefix: 'Private' }, action: 'skip', source: 'user-defined' },
  { name: 'k8s', match: { domain: ['kubernetes.io', '*.kubernetes.io'], titleContains: ['k8s'] }, action: 'move', target: 'DevOps/Kubernetes', reason: 'k8s tools', source: 'generated' },
  { name: 'catch-all', match: { matchAll: true }, action: 'analyze', source: 'generated' }
]

describe('validateRules', () => {
  it('accepts a well-formed rule set', () => {
    const result = validateRules(sampleRules)
    expect(result.valid).toBe(true)
    expect(result.errors).toHaveLength(0)
  })

  it('rejects an empty rule list', () => {
    const result = validateRules([])
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('空'))).toBe(true)
  })

  it('flags duplicate rule names', () => {
    const dup: Rule[] = [
      { name: 'dup', match: { domain: ['a.com'] }, action: 'move', target: 'A', source: 'generated' },
      { name: 'dup', match: { domain: ['b.com'] }, action: 'move', target: 'B', source: 'generated' }
    ]
    const result = validateRules(dup)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('重复'))).toBe(true)
  })

  it('errors on move action without target', () => {
    const bad: Rule[] = [
      { name: 'no-target', match: { domain: ['a.com'] }, action: 'move', source: 'generated' }
    ]
    const result = validateRules(bad)
    expect(result.valid).toBe(false)
    expect(result.errors.some(e => e.includes('目标文件夹'))).toBe(true)
  })

  it('warns when catch-all is missing', () => {
    const noCatch: Rule[] = [
      { name: 'k', match: { domain: ['a.com'] }, action: 'move', target: 'A', source: 'generated' }
    ]
    const result = validateRules(noCatch)
    expect(result.warnings.some(w => w.includes('catch-all'))).toBe(true)
  })
})

describe('serialize / load round-trip', () => {
  it('preserves rules through save and load', async () => {
    const dir = await mkdtemp(join(tmpdir(), 'ob-rules-'))
    const file = join(dir, 'rules.yaml')
    const generated: GeneratedRules = {
      rules: sampleRules,
      summary: { totalRules: 3, protectRules: 1, domainRules: 1, keywordRules: 0, catchAllRules: 1 }
    }

    try {
      await saveRules(generated, file)
      const loaded = await loadRules(file)

      expect(loaded).toHaveLength(3)
      expect(loaded[0].name).toBe('protect-private')
      expect(loaded[0].match.folderPrefix).toBe('Private')
      expect(loaded[0].action).toBe('skip')
      expect(loaded[1].match.domain).toEqual(['kubernetes.io', '*.kubernetes.io'])
      expect(loaded[1].match.titleContains).toEqual(['k8s'])
      expect(loaded[1].target).toBe('DevOps/Kubernetes')
      expect(loaded[2].match.matchAll).toBe(true)
    } finally {
      await rm(dir, { recursive: true, force: true })
    }
  })

  it('returns empty array for a missing file', async () => {
    const loaded = await loadRules(join(tmpdir(), 'does-not-exist-xyz.yaml'))
    expect(loaded).toEqual([])
  })
})
