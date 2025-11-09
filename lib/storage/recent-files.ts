'use client'

/**
 * Recent Files Manager
 * Tracks recently uploaded files in localStorage (per tenant)
 */

export interface RecentFile {
  id: string
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  category: string
  uploadedAt: string
  thumbnailUrl?: string
}

const STORAGE_KEY = 'lms_recent_files'
const MAX_RECENT_FILES = 20

/**
 * Get tenant ID from current context
 * For now, we use a default tenant. In production, this would come from auth context.
 */
function getTenantKey(): string {
  // TODO: Get from auth context when implemented
  return `${STORAGE_KEY}_tenant_1`
}

/**
 * Add a file to recent files list
 */
export function addRecentFile(file: Omit<RecentFile, 'uploadedAt'>): void {
  if (typeof window === 'undefined') return

  try {
    const recent = getRecentFiles()
    
    // Check if file already exists (by URL)
    const existingIndex = recent.findIndex(f => f.url === file.url)
    if (existingIndex !== -1) {
      // Remove existing entry (we'll add it to the top)
      recent.splice(existingIndex, 1)
    }

    // Add to beginning of array
    const newFile: RecentFile = {
      ...file,
      uploadedAt: new Date().toISOString(),
    }
    recent.unshift(newFile)

    // Keep only last 20 files
    const trimmed = recent.slice(0, MAX_RECENT_FILES)

    // Save to localStorage
    localStorage.setItem(getTenantKey(), JSON.stringify(trimmed))
  } catch (error) {
    console.error('Failed to add recent file:', error)
  }
}

/**
 * Get all recent files
 */
export function getRecentFiles(): RecentFile[] {
  if (typeof window === 'undefined') return []

  try {
    const data = localStorage.getItem(getTenantKey())
    if (!data) return []

    const files = JSON.parse(data) as RecentFile[]
    return files
  } catch (error) {
    console.error('Failed to get recent files:', error)
    return []
  }
}

/**
 * Clear all recent files
 */
export function clearRecentFiles(): void {
  if (typeof window === 'undefined') return

  try {
    localStorage.removeItem(getTenantKey())
  } catch (error) {
    console.error('Failed to clear recent files:', error)
  }
}

/**
 * Remove a specific file from recent files
 */
export function removeRecentFile(url: string): void {
  if (typeof window === 'undefined') return

  try {
    const recent = getRecentFiles()
    const filtered = recent.filter(f => f.url !== url)
    localStorage.setItem(getTenantKey(), JSON.stringify(filtered))
  } catch (error) {
    console.error('Failed to remove recent file:', error)
  }
}

/**
 * Get recent files by category
 */
export function getRecentFilesByCategory(category: string): RecentFile[] {
  const recent = getRecentFiles()
  return recent.filter(f => f.category === category)
}

/**
 * Format file size for display
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes'

  const k = 1024
  const sizes = ['Bytes', 'KB', 'MB', 'GB']
  const i = Math.floor(Math.log(bytes) / Math.log(k))

  return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i]
}

/**
 * Get file icon based on mime type
 */
export function getFileIcon(mimeType: string): string {
  if (mimeType.startsWith('image/')) return '🖼️'
  if (mimeType.startsWith('video/')) return '🎥'
  if (mimeType.startsWith('audio/')) return '🎵'
  if (mimeType.includes('pdf')) return '📄'
  if (mimeType.includes('word') || mimeType.includes('document')) return '📝'
  if (mimeType.includes('excel') || mimeType.includes('spreadsheet')) return '📊'
  if (mimeType.includes('powerpoint') || mimeType.includes('presentation')) return '📽️'
  if (mimeType.includes('zip') || mimeType.includes('rar') || mimeType.includes('archive')) return '📦'
  return '📎'
}

