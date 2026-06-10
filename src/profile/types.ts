/**
 * User profile type definitions for open-bookmark
 */

/** User preferences */
export interface UserPrefs {
  blogStrategy: '集中' | '按主题分散' | '跳过'
  protectedPaths: string[]
  catchAllTarget: string
}

/** User profile */
export interface UserProfile {
  role: string
  techStack: string[]
  interests: string[]
  language: 'zh' | 'en' | 'mixed'
  preferences: UserPrefs
  confirmed: boolean
  confirmedAt?: Date
}
