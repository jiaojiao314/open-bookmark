/**
 * Knowledge graph type definitions for open-bookmark
 */

/** Node types */
export type NodeType = 'bookmark' | 'domain' | 'topic' | 'folder'

/** Edge types */
export type EdgeType = 'belongs_to' | 'related_to' | 'grouped_in' | 'interested_in'

/** Complexity levels */
export type Complexity = 'simple' | 'moderate' | 'complex'

/** Bookmark node */
export interface BookmarkNode {
  id: string
  type: 'bookmark'
  name: string
  url: string
  summary: string
  tags: string[]
  complexity: Complexity
  folder?: string
  dateAdded?: Date
}

/** Domain node */
export interface DomainNode {
  id: string
  type: 'domain'
  name: string
  summary: string
  tags: string[]
  complexity: Complexity
  bookmarkCount: number
}

/** Topic node */
export interface TopicNode {
  id: string
  type: 'topic'
  name: string
  summary: string
  tags: string[]
  complexity: Complexity
  relatedDomains: string[]
}

/** Folder node */
export interface FolderNode {
  id: string
  type: 'folder'
  name: string
  path: string
  bookmarkCount: number
  complexity: Complexity
  summary?: string
  tags?: string[]
}

/** Union type for all nodes */
export type GraphNode = BookmarkNode | DomainNode | TopicNode | FolderNode

/** Graph edge */
export interface GraphEdge {
  source: string
  target: string
  type: EdgeType
  weight: number
  description?: string
}

/** Layer */
export interface Layer {
  id: string
  name: string
  description: string
  nodeIds: string[]
}

/** Tour step */
export interface TourStep {
  order: number
  title: string
  description: string
  nodeIds: string[]
}

/** Project metadata */
export interface ProjectMeta {
  name: string
  description: string
  analyzedAt: string
  bookmarkCount: number
  domainCount: number
  topicCount: number
}

/** Knowledge graph */
export interface BookmarkKnowledgeGraph {
  version: string
  project: ProjectMeta
  nodes: GraphNode[]
  edges: GraphEdge[]
  layers: Layer[]
  tour: TourStep[]
}

/** Analysis result for a single bookmark */
export interface BookmarkAnalysis {
  bookmarkId: string
  summary: string
  tags: string[]
  topic: string
  category: string
  confidence: number
}

/** Batch analysis result */
export interface BatchAnalysis {
  bookmarks: BookmarkAnalysis[]
  topics: TopicCluster[]
  relationships: BookmarkRelationship[]
}

/** Topic cluster */
export interface TopicCluster {
  topic: string
  bookmarks: string[]
  domains: string[]
  confidence: number
}

/** Bookmark relationship */
export interface BookmarkRelationship {
  source: string
  target: string
  type: 'same_topic' | 'same_domain' | 'related_content'
  weight: number
}
