/**
 * Knowledge graph builder
 */

import type { Bookmark } from '../chrome/types.js'
import type { BookmarkKnowledgeGraph, GraphNode, GraphEdge, Layer, TourStep, BookmarkNode, DomainNode, TopicNode, FolderNode } from './types.js'
import type { BatchAnalysis } from './types.js'
import { extractDomain } from '../chrome/types.js'

/** Build knowledge graph from bookmarks and analysis */
export function buildKnowledgeGraph(
  bookmarks: Bookmark[],
  analysis: BatchAnalysis,
  projectName: string = 'open-bookmark'
): BookmarkKnowledgeGraph {
  const nodes: GraphNode[] = []
  const edges: GraphEdge[] = []

  // Generate nodes
  const bookmarkNodes = generateBookmarkNodes(bookmarks, analysis)
  const domainNodes = generateDomainNodes(bookmarks)
  const topicNodes = generateTopicNodes(analysis)
  const folderNodes = generateFolderNodes(bookmarks)

  nodes.push(...bookmarkNodes, ...domainNodes, ...topicNodes, ...folderNodes)

  // Generate edges
  const belongsToEdges = generateBelongsToEdges(bookmarks, analysis)
  const relatedToEdges = generateRelatedToEdges(analysis)
  const groupedInEdges = generateGroupedInEdges(bookmarks)

  edges.push(...belongsToEdges, ...relatedToEdges, ...groupedInEdges)

  // Generate layers
  const layers = generateLayers(nodes)

  // Generate tour
  const tour = generateTour(nodes, edges)

  return {
    version: '1.0.0',
    project: {
      name: projectName,
      description: 'Bookmark knowledge graph',
      analyzedAt: new Date().toISOString(),
      bookmarkCount: bookmarks.length,
      domainCount: domainNodes.length,
      topicCount: topicNodes.length
    },
    nodes,
    edges,
    layers,
    tour
  }
}

/** Generate bookmark nodes */
function generateBookmarkNodes(
  bookmarks: Bookmark[],
  analysis: BatchAnalysis
): BookmarkNode[] {
  return bookmarks.map(bookmark => {
    const bookmarkAnalysis = analysis.bookmarks.find(a => a.bookmarkId === bookmark.id)

    return {
      id: `bookmark:${bookmark.id}`,
      type: 'bookmark',
      name: bookmark.name,
      url: bookmark.url,
      summary: bookmarkAnalysis?.summary || bookmark.name,
      tags: bookmarkAnalysis?.tags || [],
      complexity: 'simple',
      folder: bookmark.folder,
      dateAdded: bookmark.dateAdded
    }
  })
}

/** Generate domain nodes */
function generateDomainNodes(bookmarks: Bookmark[]): DomainNode[] {
  const domainCounts = new Map<string, number>()

  for (const bookmark of bookmarks) {
    const domain = extractDomain(bookmark.url)
    if (domain) {
      domainCounts.set(domain, (domainCounts.get(domain) || 0) + 1)
    }
  }

  return Array.from(domainCounts.entries())
    .filter(([_, count]) => count >= 3) // Only domains with 3+ bookmarks
    .map(([domain, count]) => ({
      id: `domain:${domain}`,
      type: 'domain' as const,
      name: domain,
      summary: `Domain with ${count} bookmarks`,
      tags: [domain.split('.').pop() || ''],
      complexity: count > 20 ? 'complex' as const : count > 10 ? 'moderate' as const : 'simple' as const,
      bookmarkCount: count
    }))
}

/** Generate topic nodes */
function generateTopicNodes(analysis: BatchAnalysis): TopicNode[] {
  return analysis.topics
    .filter(topic => topic.bookmarks.length >= 2) // Only topics with 2+ bookmarks
    .map(topic => ({
      id: `topic:${topic.topic.toLowerCase().replace(/\s+/g, '-')}`,
      type: 'topic' as const,
      name: topic.topic,
      summary: `Topic with ${topic.bookmarks.length} bookmarks`,
      tags: [topic.topic.toLowerCase()],
      complexity: topic.bookmarks.length > 10 ? 'complex' as const : topic.bookmarks.length > 5 ? 'moderate' as const : 'simple' as const,
      relatedDomains: topic.domains
    }))
}

/** Generate folder nodes */
function generateFolderNodes(bookmarks: Bookmark[]): FolderNode[] {
  const folderCounts = new Map<string, number>()

  for (const bookmark of bookmarks) {
    const folder = bookmark.folder || '(root)'
    folderCounts.set(folder, (folderCounts.get(folder) || 0) + 1)
  }

  return Array.from(folderCounts.entries())
    .filter(([_, count]) => count >= 2) // Only folders with 2+ bookmarks
    .map(([folder, count]) => ({
      id: `folder:${folder}`,
      type: 'folder' as const,
      name: folder.split('/').pop() || folder,
      path: folder,
      bookmarkCount: count,
      complexity: count > 20 ? 'complex' as const : count > 10 ? 'moderate' as const : 'simple' as const
    }))
}

/** Generate belongs_to edges */
function generateBelongsToEdges(
  bookmarks: Bookmark[],
  analysis: BatchAnalysis
): GraphEdge[] {
  const edges: GraphEdge[] = []

  for (const bookmark of bookmarks) {
    const domain = extractDomain(bookmark.url)
    if (domain) {
      edges.push({
        source: `bookmark:${bookmark.id}`,
        target: `domain:${domain}`,
        type: 'belongs_to',
        weight: 0.8,
        description: `Bookmark belongs to domain ${domain}`
      })
    }

    const bookmarkAnalysis = analysis.bookmarks.find(a => a.bookmarkId === bookmark.id)
    if (bookmarkAnalysis?.topic && bookmarkAnalysis.topic !== 'unknown') {
      const topicId = `topic:${bookmarkAnalysis.topic.toLowerCase().replace(/\s+/g, '-')}`
      edges.push({
        source: `bookmark:${bookmark.id}`,
        target: topicId,
        type: 'belongs_to',
        weight: 0.7,
        description: `Bookmark belongs to topic ${bookmarkAnalysis.topic}`
      })
    }
  }

  return edges
}

/** Generate related_to edges */
function generateRelatedToEdges(analysis: BatchAnalysis): GraphEdge[] {
  return analysis.relationships.map(rel => ({
    source: `bookmark:${rel.source}`,
    target: `bookmark:${rel.target}`,
    type: 'related_to' as const,
    weight: rel.weight,
    description: `Related by ${rel.type}`
  }))
}

/** Generate grouped_in edges */
function generateGroupedInEdges(bookmarks: Bookmark[]): GraphEdge[] {
  return bookmarks
    .filter(bookmark => bookmark.folder)
    .map(bookmark => ({
      source: `bookmark:${bookmark.id}`,
      target: `folder:${bookmark.folder}`,
      type: 'grouped_in' as const,
      weight: 1.0,
      description: `Bookmark is in folder ${bookmark.folder}`
    }))
}

/** Generate layers */
function generateLayers(nodes: GraphNode[]): Layer[] {
  const layers: Layer[] = []

  // Bookmarks layer
  const bookmarkNodes = nodes.filter(n => n.type === 'bookmark')
  if (bookmarkNodes.length > 0) {
    layers.push({
      id: 'layer:bookmarks',
      name: 'Bookmarks',
      description: 'Individual bookmarks',
      nodeIds: bookmarkNodes.map(n => n.id)
    })
  }

  // Domains layer
  const domainNodes = nodes.filter(n => n.type === 'domain')
  if (domainNodes.length > 0) {
    layers.push({
      id: 'layer:domains',
      name: 'Domains',
      description: 'Website domains',
      nodeIds: domainNodes.map(n => n.id)
    })
  }

  // Topics layer
  const topicNodes = nodes.filter(n => n.type === 'topic')
  if (topicNodes.length > 0) {
    layers.push({
      id: 'layer:topics',
      name: 'Topics',
      description: 'Subject topics',
      nodeIds: topicNodes.map(n => n.id)
    })
  }

  // Folders layer
  const folderNodes = nodes.filter(n => n.type === 'folder')
  if (folderNodes.length > 0) {
    layers.push({
      id: 'layer:folders',
      name: 'Folders',
      description: 'Bookmark folders',
      nodeIds: folderNodes.map(n => n.id)
    })
  }

  return layers
}

/** Generate tour */
function generateTour(nodes: GraphNode[], edges: GraphEdge[]): TourStep[] {
  const tour: TourStep[] = []

  // Step 1: Overview
  tour.push({
    order: 1,
    title: 'Bookmark Overview',
    description: 'Your bookmarks organized by domains and topics',
    nodeIds: nodes.filter(n => n.type === 'domain').slice(0, 5).map(n => n.id)
  })

  // Step 2: Top domains
  const topDomains = nodes
    .filter(n => n.type === 'domain')
    .sort((a, b) => (b as DomainNode).bookmarkCount - (a as DomainNode).bookmarkCount)
    .slice(0, 3)

  if (topDomains.length > 0) {
    tour.push({
      order: 2,
      title: 'Top Domains',
      description: 'Your most visited domains',
      nodeIds: topDomains.map(n => n.id)
    })
  }

  // Step 3: Topics
  const topTopics = nodes
    .filter(n => n.type === 'topic')
    .sort((a, b) => (b as TopicNode).relatedDomains.length - (a as TopicNode).relatedDomains.length)
    .slice(0, 3)

  if (topTopics.length > 0) {
    tour.push({
      order: 3,
      title: 'Main Topics',
      description: 'Your main areas of interest',
      nodeIds: topTopics.map(n => n.id)
    })
  }

  return tour
}

/** Save knowledge graph to file */
export async function saveKnowledgeGraph(
  graph: BookmarkKnowledgeGraph,
  filePath: string
): Promise<void> {
  const { writeFile, mkdir } = await import('node:fs/promises')
  const { dirname } = await import('node:path')

  await mkdir(dirname(filePath), { recursive: true })
  await writeFile(filePath, JSON.stringify(graph, null, 2), 'utf-8')
}

/** Load knowledge graph from file */
export async function loadKnowledgeGraph(
  filePath: string
): Promise<BookmarkKnowledgeGraph | null> {
  const { readFile } = await import('node:fs/promises')

  try {
    const content = await readFile(filePath, 'utf-8')
    const data = JSON.parse(content)

    // Convert date strings back to Date objects
    data.nodes = data.nodes.map((node: Record<string, unknown>) => {
      if (node.type === 'bookmark' && node.dateAdded) {
        return { ...node, dateAdded: new Date(node.dateAdded as string) }
      }
      return node
    })

    return data as BookmarkKnowledgeGraph
  } catch {
    return null
  }
}
