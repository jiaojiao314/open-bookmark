/**
 * Knowledge graph query interface
 */

import type { BookmarkKnowledgeGraph, GraphNode, GraphEdge, NodeType, EdgeType } from './types.js'

/** Query options */
export interface QueryOptions {
  types?: NodeType[]
  tags?: string[]
  keywords?: string[]
  minWeight?: number
  maxWeight?: number
}

/** Query result */
export interface QueryResult {
  nodes: GraphNode[]
  edges: GraphEdge[]
  stats: QueryStats
}

/** Query statistics */
export interface QueryStats {
  totalNodes: number
  totalEdges: number
  nodesByType: Record<NodeType, number>
  edgesByType: Record<EdgeType, number>
}

/** Search nodes by keyword */
export function searchNodes(
  graph: BookmarkKnowledgeGraph,
  keyword: string,
  options: QueryOptions = {}
): GraphNode[] {
  const keywordLower = keyword.toLowerCase()

  return graph.nodes.filter(node => {
    // Filter by type
    if (options.types && !options.types.includes(node.type)) {
      return false
    }

    // Filter by tags
    if (options.tags && options.tags.length > 0) {
      const hasTag = options.tags.some(tag =>
        (node.tags || []).some((t: string) => t.toLowerCase().includes(tag.toLowerCase()))
      )
      if (!hasTag) return false
    }

    // Search in name, summary, tags
    const nameMatch = node.name.toLowerCase().includes(keywordLower)
    const summaryMatch = (node.summary || '').toLowerCase().includes(keywordLower)
    const tagMatch = (node.tags || []).some((tag: string) => tag.toLowerCase().includes(keywordLower))

    return nameMatch || summaryMatch || tagMatch
  })
}

/** Get node by ID */
export function getNodeById(
  graph: BookmarkKnowledgeGraph,
  nodeId: string
): GraphNode | undefined {
  return graph.nodes.find(node => node.id === nodeId)
}

/** Get edges for a node */
export function getEdgesForNode(
  graph: BookmarkKnowledgeGraph,
  nodeId: string,
  options: { direction?: 'incoming' | 'outgoing' | 'both' } = {}
): GraphEdge[] {
  const { direction = 'both' } = options

  return graph.edges.filter(edge => {
    if (direction === 'incoming') {
      return edge.target === nodeId
    }
    if (direction === 'outgoing') {
      return edge.source === nodeId
    }
    return edge.source === nodeId || edge.target === nodeId
  })
}

/** Get connected nodes */
export function getConnectedNodes(
  graph: BookmarkKnowledgeGraph,
  nodeId: string,
  options: { maxDepth?: number } = {}
): GraphNode[] {
  const { maxDepth = 1 } = options
  const visited = new Set<string>()
  const result: GraphNode[] = []

  function dfs(currentId: string, depth: number) {
    if (depth > maxDepth || visited.has(currentId)) return
    visited.add(currentId)

    const edges = getEdgesForNode(graph, currentId)
    for (const edge of edges) {
      const neighborId = edge.source === currentId ? edge.target : edge.source
      if (!visited.has(neighborId)) {
        const neighbor = getNodeById(graph, neighborId)
        if (neighbor) {
          result.push(neighbor)
          dfs(neighborId, depth + 1)
        }
      }
    }
  }

  dfs(nodeId, 0)
  return result
}

/** Find path between two nodes */
export function findPath(
  graph: BookmarkKnowledgeGraph,
  startId: string,
  endId: string
): string[] | null {
  const visited = new Set<string>()
  const queue: Array<{ nodeId: string; path: string[] }> = []

  queue.push({ nodeId: startId, path: [startId] })
  visited.add(startId)

  while (queue.length > 0) {
    const { nodeId, path } = queue.shift()!

    if (nodeId === endId) {
      return path
    }

    const edges = getEdgesForNode(graph, nodeId, { direction: 'outgoing' })
    for (const edge of edges) {
      const neighborId = edge.target
      if (!visited.has(neighborId)) {
        visited.add(neighborId)
        queue.push({ nodeId: neighborId, path: [...path, neighborId] })
      }
    }
  }

  return null
}

/** Get graph statistics */
export function getGraphStats(graph: BookmarkKnowledgeGraph): QueryStats {
  const nodesByType: Record<NodeType, number> = {
    bookmark: 0,
    domain: 0,
    topic: 0,
    folder: 0
  }

  const edgesByType: Record<EdgeType, number> = {
    belongs_to: 0,
    related_to: 0,
    grouped_in: 0,
    interested_in: 0
  }

  for (const node of graph.nodes) {
    nodesByType[node.type]++
  }

  for (const edge of graph.edges) {
    edgesByType[edge.type]++
  }

  return {
    totalNodes: graph.nodes.length,
    totalEdges: graph.edges.length,
    nodesByType,
    edgesByType
  }
}

/** Query graph with options */
export function queryGraph(
  graph: BookmarkKnowledgeGraph,
  keyword: string,
  options: QueryOptions = {}
): QueryResult {
  const nodes = searchNodes(graph, keyword, options)
  const nodeIds = new Set(nodes.map(n => n.id))

  const edges = graph.edges.filter(edge =>
    nodeIds.has(edge.source) || nodeIds.has(edge.target)
  )

  const stats = getGraphStats(graph)

  return {
    nodes,
    edges,
    stats
  }
}

/** Export graph to JSON */
export function exportGraph(graph: BookmarkKnowledgeGraph): string {
  return JSON.stringify(graph, null, 2)
}

/** Get nodes by type */
export function getNodesByType(
  graph: BookmarkKnowledgeGraph,
  type: NodeType
): GraphNode[] {
  return graph.nodes.filter(node => node.type === type)
}

/** Get top nodes by edge count */
export function getTopNodesByEdgeCount(
  graph: BookmarkKnowledgeGraph,
  limit: number = 10
): Array<{ node: GraphNode; edgeCount: number }> {
  const edgeCounts = new Map<string, number>()

  for (const edge of graph.edges) {
    edgeCounts.set(edge.source, (edgeCounts.get(edge.source) || 0) + 1)
    edgeCounts.set(edge.target, (edgeCounts.get(edge.target) || 0) + 1)
  }

  return graph.nodes
    .map(node => ({
      node,
      edgeCount: edgeCounts.get(node.id) || 0
    }))
    .sort((a, b) => b.edgeCount - a.edgeCount)
    .slice(0, limit)
}
