'use client'

import { useState, useCallback, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Checkbox } from '@/components/ui/checkbox'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { Search, Trash2, Grid3x3, List, Image as ImageIcon, File, Folder } from 'lucide-react'
import { toast } from 'sonner'
import { formatFileSize } from '@/lib/storage/recent-files'

interface ServerFilesTabProps {
  category: string
  entityType?: string
  entityId?: string
  onFileSelect: (file: {
    url: string
    fileName: string
    fileSize: number
    mimeType: string
    id?: string
  }) => void
  allowMultiple?: boolean
}

export function ServerFilesTab({
  category,
  entityType,
  entityId,
  onFileSelect,
  allowMultiple = false,
}: ServerFilesTabProps) {
  const [serverFiles, setServerFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentFolder, setCurrentFolder] = useState<string>('')
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // Load server files
  const loadServerFiles = useCallback(async () => {
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (entityType) params.append('entityType', entityType)
      if (entityId) params.append('entityId', entityId)

      const response = await fetch(`/api/files?${params.toString()}`)
      if (!response.ok) throw new Error('Failed to load files')

      const data = await response.json()
      setServerFiles(data.files || [])
    } catch (error) {
      console.error('Failed to load server files:', error)
      toast.error('Failed to load server files')
    } finally {
      setLoading(false)
    }
  }, [category, entityType, entityId])

  useEffect(() => {
    loadServerFiles()
  }, [loadServerFiles])

  // Handle file selection
  const handleFileClick = (file: any) => {
    if (allowMultiple) {
      const newSelected = new Set(selectedFileIds)
      if (newSelected.has(file.id)) {
        newSelected.delete(file.id)
      } else {
        newSelected.add(file.id)
      }
      setSelectedFileIds(newSelected)
    } else {
      onFileSelect({
        url: file.url,
        fileName: file.fileName,
        fileSize: file.size,
        mimeType: file.mimeType,
        id: file.id,
      })
    }
  }

  // Handle bulk delete
  const handleBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedFileIds).map((fileId) =>
        fetch(`/api/files/${fileId}`, { method: 'DELETE' })
      )

      await Promise.all(deletePromises)
      toast.success(`${selectedFileIds.size} file(s) deleted successfully`)
      setSelectedFileIds(new Set())
      loadServerFiles()
    } catch (error) {
      console.error('Bulk delete error:', error)
      toast.error('Failed to delete files')
    } finally {
      setBulkDeleteDialogOpen(false)
    }
  }

  // Handle single file delete
  const handleDeleteFile = async (fileId: string, e: React.MouseEvent) => {
    e.stopPropagation()

    try {
      const response = await fetch(`/api/files/${fileId}`, { method: 'DELETE' })
      if (!response.ok) throw new Error('Delete failed')

      toast.success('File deleted successfully')
      loadServerFiles()
    } catch (error) {
      console.error('Delete error:', error)
      toast.error('Failed to delete file')
    }
  }

  // Extract folder structure from file keys
  const getFolderStructure = () => {
    const folders = new Set<string>()
    const filesInCurrentFolder: any[] = []

    serverFiles.forEach(file => {
      // Parse key: tenants/{tenantId}/category/subcategory/file.jpg
      const parts = file.key.split('/')
      // Remove tenants/{tenantId}/ prefix
      const pathParts = parts.slice(2)

      if (currentFolder === '') {
        // Root level - show top-level folders
        if (pathParts.length > 1) {
          folders.add(pathParts[0])
        } else {
          filesInCurrentFolder.push(file)
        }
      } else {
        // Inside a folder
        const currentParts = currentFolder.split('/')
        const relativePath = pathParts.slice(currentParts.length)

        if (relativePath.length > 1) {
          // Has subfolders
          folders.add(relativePath[0])
        } else if (relativePath.length === 1) {
          // File in current folder
          filesInCurrentFolder.push(file)
        }
      }
    })

    return { folders: Array.from(folders), files: filesInCurrentFolder }
  }

  const { folders, files: filesInFolder } = getFolderStructure()

  // Filter by search query
  const filteredFiles = searchQuery
    ? serverFiles.filter(file =>
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filesInFolder

  return (
    <div className="space-y-4">
      {/* Search & View Controls */}
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
          <Input
            placeholder="Search files..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="pl-9"
          />
        </div>
        <Button
          type="button"
          variant="outline"
          size="sm"
          onClick={() => setViewMode(viewMode === 'grid' ? 'list' : 'grid')}
        >
          {viewMode === 'grid' ? <List className="w-4 h-4" /> : <Grid3x3 className="w-4 h-4" />}
        </Button>
        {allowMultiple && selectedFileIds.size > 0 && (
          <Button
            type="button"
            variant="destructive"
            size="sm"
            onClick={() => setBulkDeleteDialogOpen(true)}
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Delete ({selectedFileIds.size})
          </Button>
        )}
      </div>

      {/* Breadcrumb Navigation */}
      {currentFolder && !searchQuery && (
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Button
            type="button"
            variant="link"
            size="sm"
            onClick={() => setCurrentFolder('')}
            className="h-auto p-0 text-violet-600 hover:text-violet-700"
          >
            Home
          </Button>
          {currentFolder.split('/').map((folder, index, arr) => (
            <div key={index} className="flex items-center gap-2">
              <span>/</span>
              <Button
                type="button"
                variant="link"
                size="sm"
                onClick={() => {
                  const path = arr.slice(0, index + 1).join('/')
                  setCurrentFolder(path)
                }}
                className="h-auto p-0 text-violet-600 hover:text-violet-700"
              >
                {folder}
              </Button>
            </div>
          ))}
        </div>
      )}

      {/* Files List/Grid */}
      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading files...</div>
      ) : (folders.length === 0 && filteredFiles.length === 0) ? (
        <div className="text-center py-8 text-gray-500">
          {searchQuery ? 'No files found matching your search' : 'No files uploaded yet'}
        </div>
      ) : viewMode === 'grid' ? (
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4 max-h-96 overflow-y-auto">
          {/* Show folders first (only when not searching) */}
          {!searchQuery && folders.map((folder) => (
            <button
              key={folder}
              type="button"
              onClick={() => {
                const newPath = currentFolder ? `${currentFolder}/${folder}` : folder
                setCurrentFolder(newPath)
              }}
              className="border rounded-lg p-3 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors text-left"
            >
              <div className="w-full h-24 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 rounded mb-2">
                <Folder className="w-12 h-12 text-blue-600 dark:text-blue-400" />
              </div>
              <p className="text-xs font-medium truncate">{folder}</p>
              <p className="text-xs text-gray-500">Folder</p>
            </button>
          ))}

          {/* Show files */}
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={`border rounded-lg p-3 cursor-pointer hover:border-violet-500 transition-colors ${
                selectedFileIds.has(file.id) ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20' : ''
              }`}
              onClick={() => handleFileClick(file)}
            >
              {allowMultiple && (
                <Checkbox
                  checked={selectedFileIds.has(file.id)}
                  className="mb-2"
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              {file.mimeType.startsWith('image/') ? (
                <img
                  src={file.url}
                  alt={file.fileName}
                  className="w-full h-24 object-cover rounded mb-2"
                />
              ) : (
                <div className="w-full h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded mb-2">
                  <File className="w-8 h-8 text-gray-400" />
                </div>
              )}
              <p className="text-xs font-medium truncate">{file.fileName}</p>
              <p className="text-xs text-gray-500">{formatFileSize(file.size)}</p>
              {!allowMultiple && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="w-full mt-2 text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => handleDeleteFile(file.id, e)}
                >
                  <Trash2 className="w-3 h-3 mr-1" />
                  Delete
                </Button>
              )}
            </div>
          ))}
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {/* Show folders first (only when not searching) */}
          {!searchQuery && folders.map((folder) => (
            <button
              key={folder}
              type="button"
              onClick={() => {
                const newPath = currentFolder ? `${currentFolder}/${folder}` : folder
                setCurrentFolder(newPath)
              }}
              className="w-full border rounded-lg p-3 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors flex items-center gap-3"
            >
              <div className="w-12 h-12 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 rounded">
                <Folder className="w-6 h-6 text-blue-600 dark:text-blue-400" />
              </div>
              <div className="flex-1 text-left">
                <p className="text-sm font-medium truncate">{folder}</p>
                <p className="text-xs text-gray-500">Folder</p>
              </div>
            </button>
          ))}

          {/* Show files */}
          {filteredFiles.map((file) => (
            <div
              key={file.id}
              className={`border rounded-lg p-3 cursor-pointer hover:border-violet-500 transition-colors flex items-center gap-3 ${
                selectedFileIds.has(file.id) ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20' : ''
              }`}
              onClick={() => handleFileClick(file)}
            >
              {allowMultiple && (
                <Checkbox
                  checked={selectedFileIds.has(file.id)}
                  onClick={(e) => e.stopPropagation()}
                />
              )}
              {file.mimeType.startsWith('image/') ? (
                <img
                  src={file.url}
                  alt={file.fileName}
                  className="w-12 h-12 object-cover rounded"
                />
              ) : (
                <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
                  <File className="w-6 h-6 text-gray-400" />
                </div>
              )}
              <div className="flex-1">
                <p className="text-sm font-medium">{file.fileName}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.size)} • {new Date(file.createdAt).toLocaleDateString()}
                </p>
              </div>
              {!allowMultiple && (
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="text-red-600 hover:text-red-700 hover:bg-red-50"
                  onClick={(e) => handleDeleteFile(file.id, e)}
                >
                  <Trash2 className="w-4 h-4" />
                </Button>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Bulk Delete Confirmation Dialog */}
      <AlertDialog open={bulkDeleteDialogOpen} onOpenChange={setBulkDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Files</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete {selectedFileIds.size} file(s)? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleBulkDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

