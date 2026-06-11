/**
 * Tests for executor: preview / apply / verify
 */

import { describe, it, expect } from 'vitest'
import { preview, apply, verify } from '../src/executor/executor.js'
import type { Bookmark } from '../src/chrome/types.js'
import type { Rule } from '../src/rules/types.js'

function bm(id: string, name: string, url: string, folder: string): Bookmark {
  return { id, name, url, folder, parentId: '', dateAdded: new Date(), dateModified: new Date() }
}

const bookmarks: Bookmark[] = [
  bm('1', 'Kubernetes Docs', 'https://kubernetes.io/docs', 'Inbox'),
  bm('2', 'GitHub', 'https://github.com', 'Inbox'),
  bm('3', 'Personal Bank', 'https://bank.example.com', 'Private')
]

const rules: Rule[] = [
  { name: 'protect-private', match: { folderPrefix: 'Private' }, action: 'skip', source: 'user-defined' },
  { name: 'k8s', match: { domain: ['kubernetes.io'] }, action: 'move', target: 'DevOps/Kubernetes', source: 'generated' },
  { name: 'code', match: { domain: ['github.com'] }, action: 'move', target: 'Code', source: 'generated' }
]

describe('preview', () => {
  it('reports moves for matched bookmarks', () => {
    const result = preview(bookmarks, rules)
    expect(result.totalBookmarks).toBe(3)
    expect(result.moves).toHaveLength(2)
    const k8s = result.moves.find(m => m.bookmarkId === '1')
    expect(k8s?.targetFolder).toBe('DevOps/Kubernetes')
    expect(k8s?.ruleName).toBe('k8s')
  })

  it('does not move skip-action bookmarks', () => {
    const result = preview(bookmarks, rules)
    expect(result.moves.some(m => m.bookmarkId === '3')).toBe(false)
  })

  it('applies subfolder to target path', () => {
    const subRule: Rule[] = [
      { name: 'sub', match: { domain: ['github.com'] }, action: 'move', target: 'Code', subfolder: 'Git', source: 'generated' }
    ]
    const result = preview([bm('2', 'GitHub', 'https://github.com', 'Inbox')], subRule)
    expect(result.moves[0].targetFolder).toBe('Code/Git')
  })
})

describe('apply', () => {
  it('moves bookmarks to target folders', () => {
    const { bookmarks: out, result } = apply(bookmarks, rules)
    expect(result.moved).toBe(2)
    expect(out.find(b => b.id === '1')?.folder).toBe('DevOps/Kubernetes')
    expect(out.find(b => b.id === '2')?.folder).toBe('Code')
  })

  it('leaves skipped bookmarks untouched', () => {
    const { bookmarks: out, result } = apply(bookmarks, rules)
    expect(result.skipped).toBe(1)
    expect(out.find(b => b.id === '3')?.folder).toBe('Private')
  })

  it('preserves bookmark count', () => {
    const { bookmarks: out } = apply(bookmarks, rules)
    expect(out).toHaveLength(bookmarks.length)
  })

  it('reports success with no errors', () => {
    const { result } = apply(bookmarks, rules)
    expect(result.success).toBe(true)
    expect(result.errors).toHaveLength(0)
  })
})

describe('verify', () => {
  it('is valid when counts match and nothing protected moved', () => {
    const { bookmarks: modified } = apply(bookmarks, rules)
    const result = verify(bookmarks, modified, [])
    expect(result.valid).toBe(true)
    expect(result.stats.expectedCount).toBe(3)
    expect(result.stats.actualCount).toBe(3)
  })

  it('flags count mismatch', () => {
    const { bookmarks: modified } = apply(bookmarks, rules)
    const result = verify(bookmarks, modified.slice(0, 2), [])
    expect(result.valid).toBe(false)
    expect(result.issues.some(i => i.type === 'count_mismatch')).toBe(true)
  })

  it('counts moved bookmarks', () => {
    const { bookmarks: modified } = apply(bookmarks, rules)
    const result = verify(bookmarks, modified, [])
    expect(result.stats.movedCount).toBe(2)
  })
})
