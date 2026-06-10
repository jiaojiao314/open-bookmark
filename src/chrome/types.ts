/**
 * Bookmark type definitions for open-bookmark
 */

/** Represents a single browser bookmark */
export interface Bookmark {
  id: string
  name: string
  url: string
  folder: string
  parentId: string
  dateAdded: Date
  dateModified: Date
}

/** Bookmark collection with helper methods */
export interface BookmarkCollection {
  bookmarks: Bookmark[]
}

/** Extract domain from URL */
export function extractDomain(url: string): string {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname
    if (!host) return ''
    
    // For IP addresses with ports, keep the port
    if (parsed.port && isIPAddress(host)) {
      return `${host}:${parsed.port}`
    }
    return host
  } catch {
    return ''
  }
}

/** Check if a string is an IP address */
function isIPAddress(host: string): boolean {
  const parts = host.split('.')
  if (parts.length !== 4) return false
  return parts.every(p => {
    if (p.length === 0 || p.length > 3) return false
    return /^\d+$/.test(p)
  })
}

/** Get top-level folder name */
export function getTopFolder(folder: string): string {
  if (!folder) return '(root)'
  const parts = folder.split('/')
  return parts[0]
}

/** Check if URL is internal network */
export function isInternalURL(url: string): boolean {
  try {
    const parsed = new URL(url)
    const host = parsed.hostname
    if (!host) return false
    
    const internalPrefixes = ['172.', '10.', '192.168.', 'localhost', '127.']
    return internalPrefixes.some(prefix => host.startsWith(prefix))
  } catch {
    return false
  }
}

/** Convert Chrome WebKit timestamp to Date */
export function webKitToDate(timestamp: string): Date {
  if (!timestamp || timestamp === '0') return new Date(0)
  
  // WebKit epoch: 1601-01-01, in microseconds
  const webKitEpoch = new Date('1601-01-01T00:00:00Z')
  const microseconds = parseInt(timestamp, 10)
  const milliseconds = microseconds / 1000
  
  return new Date(webKitEpoch.getTime() + milliseconds)
}
