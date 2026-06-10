/**
 * Workflow state type definitions for open-bookmark
 */

import type { UserProfile } from '../profile/types.js'

/** Bookmarks info */
export interface BookmarksInfo {
  snapshot: string
  count: number
  lastScan: Date
}

/** Rules info */
export interface RulesInfo {
  file: string
  count: number
  lastGenerated: Date
}

/** Backup info */
export interface BackupInfo {
  path: string
  created: Date
  bookmarksCount: number
}

/** Workflow state */
export interface WorkflowState {
  version: string
  phase: 'scan' | 'dialogue' | 'generate' | 'preview' | 'apply' | 'verify'
  workflow: 'full' | 'quick' | 'fix'
  autoTransition: boolean
  profile: UserProfile
  bookmarks: BookmarksInfo
  rules: RulesInfo
  backups: BackupInfo[]
  createdAt: Date
  updatedAt: Date
}

/** Create new workflow state with defaults */
export function newWorkflowState(): WorkflowState {
  const now = new Date()
  return {
    version: '1',
    phase: 'scan',
    workflow: 'full',
    autoTransition: false,
    profile: {
      role: '',
      techStack: [],
      interests: [],
      language: 'mixed',
      preferences: {
        blogStrategy: '集中',
        protectedPaths: [],
        catchAllTarget: '99-人工待确认'
      },
      confirmed: false
    },
    bookmarks: {
      snapshot: '',
      count: 0,
      lastScan: now
    },
    rules: {
      file: '',
      count: 0,
      lastGenerated: now
    },
    backups: [],
    createdAt: now,
    updatedAt: now
  }
}
