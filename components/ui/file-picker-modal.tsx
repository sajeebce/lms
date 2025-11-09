'use client'

import { useState, useCallback, useEffect } from 'react'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
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
import { Upload, Link, Clock, Server, Search, Trash2, Image as ImageIcon, Grid3x3, List, Folder, File, X } from 'lucide-react'
import { toast } from 'sonner'
import { addRecentFile, getRecentFiles, clearRecentFiles, formatFileSize, getFileIcon, type RecentFile } from '@/lib/storage/recent-files'

interface FilePickerModalProps {
  open: boolean
  onClose: () => void
  onSelect: (file: SelectedFile) => void
  category: string
  entityType?: string
  entityId?: string
  accept?: string
  maxSize?: number
  allowMultiple?: boolean
  allowUpload?: boolean
  allowBrowse?: boolean
  allowUrl?: boolean
  allowRecent?: boolean
}

export interface SelectedFile {
  url: string
  fileName: string
  fileSize: number
  mimeType: string
  source: 'upload' | 'server' | 'url' | 'recent'
  // Optional metadata for images
  altText?: string
  width?: number
  height?: number
  id?: string // File ID for server-side deletion
}

export function FilePickerModal({
  open,
  onClose,
  onSelect,
  category,
  entityType,
  entityId,
  accept = '*/*',
  maxSize = 10 * 1024 * 1024, // 10MB default
  allowMultiple = false,
  allowUpload = true,
  allowBrowse = true,
  allowUrl = true,
  allowRecent = true,
}: FilePickerModalProps) {
  const [activeTab, setActiveTab] = useState('upload')
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [urlInput, setUrlInput] = useState('')
  const [serverFiles, setServerFiles] = useState<any[]>([])
  const [loading, setLoading] = useState(false)
  const [searchQuery, setSearchQuery] = useState('')
  const [viewMode, setViewMode] = useState<'grid' | 'list'>('grid')
  const [currentFolder, setCurrentFolder] = useState<string>('')
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])

  // File metadata fields (Moodle-style)
  const [author, setAuthor] = useState('')
  const [description, setDescription] = useState('')
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  // Bulk operations
  const [selectedFileIds, setSelectedFileIds] = useState<Set<string>>(new Set())
  const [bulkDeleteDialogOpen, setBulkDeleteDialogOpen] = useState(false)

  // Load server files
  const loadServerFiles = useCallback(async () => {
    if (!allowBrowse) return
    
    setLoading(true)
    try {
      const params = new URLSearchParams()
      if (category) params.append('category', category)
      if (entityType) params.append('entityType', entityType)
      if (entityId) params.append('entityId', entityId)
      
      const response = await fetch(`/api/files?${params.toString()}`)
      const data = await response.json()
      
      if (data.success) {
        setServerFiles(data.files)
      }
    } catch (error) {
      console.error('Failed to load server files:', error)
    } finally {
      setLoading(false)
    }
  }, [category, entityType, entityId, allowBrowse])

  useEffect(() => {
    if (open && activeTab === 'server') {
      loadServerFiles()
    }
  }, [open, activeTab, loadServerFiles])

  // Load recent files
  useEffect(() => {
    if (open && activeTab === 'recent') {
      setRecentFiles(getRecentFiles())
    }
  }, [open, activeTab])

  // Handle file upload
  const handleFileUpload = async (file: File) => {
    if (file.size > maxSize) {
      toast.error(`File size exceeds ${(maxSize / 1024 / 1024).toFixed(0)}MB limit`)
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', file)
      formData.append('category', category)
      formData.append('entityType', entityType || category.split('_')[0])
      formData.append('entityId', entityId || 'temp')
      formData.append('isPublic', category.includes('photo') ? 'true' : 'false')

      // Add metadata if provided
      if (author.trim()) formData.append('author', author.trim())
      if (description.trim()) formData.append('description', description.trim())

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      const data = await response.json()

      if (data.success) {
        // Show optimization info if available
        if (data.optimization) {
          const saved = data.optimization.savedPercentage
          toast.success(
            `File uploaded successfully! Optimized: ${saved}% smaller (saved ${formatFileSize(data.optimization.savedBytes)})`,
            { duration: 5000 }
          )
        } else {
          toast.success('File uploaded successfully')
        }

        // Add to recent files
        addRecentFile({
          id: data.id || '',
          url: data.url,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          category: category,
        })

        onSelect({
          url: data.url,
          fileName: data.fileName,
          fileSize: data.fileSize,
          mimeType: data.mimeType,
          source: 'upload',
          // Pass metadata back to parent (ImagePropertiesDialog)
          altText: data.altText,
          width: data.width,
          height: data.height,
          id: data.id, // File ID for deletion
        })

        // Reset form
        setAuthor('')
        setDescription('')
        setSelectedFile(null)

        onClose()
      } else {
        toast.error(data.error || 'Upload failed')
      }
    } catch (error) {
      console.error('Upload error:', error)
      toast.error('Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  // Handle drag and drop
  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)

    if (e.dataTransfer.files && e.dataTransfer.files[0]) {
      handleFileUpload(e.dataTransfer.files[0])
    }
  }

  // Handle URL input
  const handleUrlSubmit = () => {
    if (!urlInput.trim()) {
      toast.error('Please enter a URL')
      return
    }

    onSelect({
      url: urlInput,
      fileName: urlInput.split('/').pop() || 'file',
      fileSize: 0,
      mimeType: 'unknown',
      source: 'url',
    })
    onClose()
  }

  // Handle server file selection
  const handleServerFileSelect = (file: any) => {
    onSelect({
      url: file.url,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      source: 'server',
      // Pass metadata if available
      altText: file.altText,
      width: file.width,
      height: file.height,
      id: file.id, // File ID for deletion
    })
    onClose()
  }

  // Bulk operations
  const toggleFileSelection = (fileId: string) => {
    setSelectedFileIds(prev => {
      const newSet = new Set(prev)
      if (newSet.has(fileId)) {
        newSet.delete(fileId)
      } else {
        newSet.add(fileId)
      }
      return newSet
    })
  }

  const toggleSelectAll = () => {
    if (selectedFileIds.size === filteredServerFiles.length) {
      setSelectedFileIds(new Set())
    } else {
      setSelectedFileIds(new Set(filteredServerFiles.map(f => f.id)))
    }
  }

  const handleBulkDelete = async () => {
    try {
      const deletePromises = Array.from(selectedFileIds).map(fileId =>
        fetch(`/api/files/${fileId}`, { method: 'DELETE' })
      )

      await Promise.all(deletePromises)

      toast.success(`Deleted ${selectedFileIds.size} file(s) successfully`)
      setSelectedFileIds(new Set())
      setBulkDeleteDialogOpen(false)
      loadServerFiles()
    } catch (error) {
      toast.error('Failed to delete files')
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
  const filteredServerFiles = searchQuery
    ? serverFiles.filter(file =>
        file.fileName.toLowerCase().includes(searchQuery.toLowerCase())
      )
    : filesInFolder

  return (
    <>
    <Dialog open={open} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Select File</DialogTitle>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab}>
          <TabsList className={`grid w-full ${
            [allowUpload, allowBrowse, allowUrl, allowRecent].filter(Boolean).length === 4
              ? 'grid-cols-4'
              : [allowUpload, allowBrowse, allowUrl, allowRecent].filter(Boolean).length === 3
              ? 'grid-cols-3'
              : 'grid-cols-2'
          }`}>
            {allowUpload && (
              <TabsTrigger value="upload">
                <Upload className="w-4 h-4 mr-2" />
                Upload
              </TabsTrigger>
            )}
            {allowBrowse && (
              <TabsTrigger value="server">
                <Server className="w-4 h-4 mr-2" />
                Server Files
              </TabsTrigger>
            )}
            {allowUrl && (
              <TabsTrigger value="url">
                <Link className="w-4 h-4 mr-2" />
                URL
              </TabsTrigger>
            )}
            {allowRecent && (
              <TabsTrigger value="recent">
                <Clock className="w-4 h-4 mr-2" />
                Recent
              </TabsTrigger>
            )}
          </TabsList>

          {/* Upload Tab - Moodle Style */}
          {allowUpload && (
            <TabsContent value="upload" className="space-y-6">
              {/* File Selection Area */}
              <div className="space-y-4">
                <div className="flex items-center gap-2">
                  <Label htmlFor="file-input" className="font-medium">
                    Attachment
                  </Label>
                </div>

                <div className="flex items-center gap-2">
                  <Input
                    type="file"
                    accept={accept}
                    onChange={(e) => {
                      if (e.target.files?.[0]) {
                        setSelectedFile(e.target.files[0])
                      }
                    }}
                    className="hidden"
                    id="file-input"
                    disabled={uploading}
                  />
                  <Label htmlFor="file-input">
                    <Button variant="outline" asChild disabled={uploading}>
                      <span className="cursor-pointer">
                        Choose File
                      </span>
                    </Button>
                  </Label>
                  <span className="text-sm text-muted-foreground">
                    {selectedFile ? selectedFile.name : 'No file chosen'}
                  </span>
                </div>

                {/* Drag and Drop Area */}
                <div
                  className={`border-2 border-dashed rounded-lg p-8 text-center transition-colors ${
                    dragActive
                      ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20'
                      : 'border-gray-300 dark:border-gray-700'
                  }`}
                  onDragEnter={handleDrag}
                  onDragLeave={handleDrag}
                  onDragOver={handleDrag}
                  onDrop={handleDrop}
                >
                  <Upload className="w-10 h-10 mx-auto mb-3 text-gray-400" />
                  <p className="text-sm font-medium mb-1">
                    Drag and drop files here
                  </p>
                  <p className="text-xs text-muted-foreground">
                    Max size: {(maxSize / 1024 / 1024).toFixed(0)}MB
                  </p>
                </div>
              </div>

              {/* Metadata Fields - Moodle Style */}
              <div className="space-y-4 border-t pt-4">
                <div className="space-y-2">
                  <Label htmlFor="author">Author (Optional)</Label>
                  <Input
                    id="author"
                    placeholder="Enter author name"
                    value={author}
                    onChange={(e) => setAuthor(e.target.value)}
                    maxLength={100}
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="description">Description (Optional)</Label>
                  <Textarea
                    id="description"
                    placeholder="Enter file description"
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    maxLength={500}
                    rows={3}
                    className="resize-none"
                  />
                  <p className="text-xs text-muted-foreground">
                    {description.length}/500 characters
                  </p>
                </div>
              </div>

              {/* Upload Button */}
              <div className="flex justify-end pt-4 border-t">
                <Button
                  onClick={() => {
                    if (selectedFile) {
                      handleFileUpload(selectedFile)
                    } else {
                      toast.error('Please select a file first')
                    }
                  }}
                  disabled={uploading || !selectedFile}
                  className="bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white"
                >
                  {uploading ? 'Uploading...' : 'Upload this file'}
                </Button>
              </div>
            </TabsContent>
          )}

          {/* Server Files Tab - Enhanced with Folder Navigation */}
          {allowBrowse && (
            <TabsContent value="server" className="space-y-4">
              {/* Toolbar */}
              <div className="flex items-center justify-between gap-2">
                <div className="flex items-center gap-2 flex-1">
                  <Search className="w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Search files..."
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    className="flex-1"
                  />
                </div>

                {/* Bulk Operations */}
                {selectedFileIds.size > 0 && (
                  <div className="flex items-center gap-2">
                    <span className="text-sm text-muted-foreground">
                      {selectedFileIds.size} selected
                    </span>
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => setBulkDeleteDialogOpen(true)}
                    >
                      <Trash2 className="h-4 w-4 mr-1" />
                      Delete
                    </Button>
                  </div>
                )}

                {/* Select All / View Mode Toggle */}
                <div className="flex items-center gap-2">
                  {filteredServerFiles.length > 0 && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={toggleSelectAll}
                    >
                      {selectedFileIds.size === filteredServerFiles.length ? 'Deselect All' : 'Select All'}
                    </Button>
                  )}

                  <div className="flex items-center gap-1 border rounded-md p-1">
                    <Button
                      variant={viewMode === 'grid' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('grid')}
                      className="h-8 w-8 p-0"
                    >
                      <Grid3x3 className="h-4 w-4" />
                    </Button>
                    <Button
                      variant={viewMode === 'list' ? 'default' : 'ghost'}
                      size="sm"
                      onClick={() => setViewMode('list')}
                      className="h-8 w-8 p-0"
                    >
                      <List className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Breadcrumb Navigation */}
              {currentFolder && (
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Button
                    variant="link"
                    size="sm"
                    onClick={() => setCurrentFolder('')}
                    className="h-auto p-0"
                  >
                    Home
                  </Button>
                  {currentFolder.split('/').map((folder, index, arr) => (
                    <div key={index} className="flex items-center gap-2">
                      <span>/</span>
                      <Button
                        variant="link"
                        size="sm"
                        onClick={() => {
                          const path = arr.slice(0, index + 1).join('/')
                          setCurrentFolder(path)
                        }}
                        className="h-auto p-0"
                      >
                        {folder}
                      </Button>
                    </div>
                  ))}
                </div>
              )}

              {loading ? (
                <div className="text-center py-8 text-muted-foreground">
                  Loading files...
                </div>
              ) : (folders.length === 0 && filteredServerFiles.length === 0) ? (
                <div className="text-center py-8 text-muted-foreground">
                  No files found
                </div>
              ) : (
                <div className={`max-h-96 overflow-y-auto ${
                  viewMode === 'grid'
                    ? 'grid grid-cols-4 gap-4'
                    : 'space-y-2'
                }`}>
                  {/* Show folders first (only when not searching) */}
                  {!searchQuery && folders.map((folder) => (
                    viewMode === 'grid' ? (
                      <button
                        key={folder}
                        onClick={() => {
                          const newPath = currentFolder ? `${currentFolder}/${folder}` : folder
                          setCurrentFolder(newPath)
                        }}
                        className="border rounded-lg p-4 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors text-left"
                      >
                        <div className="w-full h-24 flex items-center justify-center bg-blue-100 dark:bg-blue-900/20 rounded mb-2">
                          <Folder className="w-12 h-12 text-blue-600 dark:text-blue-400" />
                        </div>
                        <p className="text-sm font-medium truncate">
                          {folder}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          Folder
                        </p>
                      </button>
                    ) : (
                      <button
                        key={folder}
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
                          <p className="text-sm font-medium truncate">
                            {folder}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            Folder
                          </p>
                        </div>
                      </button>
                    )
                  ))}

                  {/* Show files */}
                  {filteredServerFiles.map((file) => (
                    viewMode === 'grid' ? (
                      <div
                        key={file.id}
                        className={`border rounded-lg p-4 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors relative ${
                          selectedFileIds.has(file.id) ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <div className="absolute top-2 left-2 z-10">
                          <Checkbox
                            checked={selectedFileIds.has(file.id)}
                            onCheckedChange={() => toggleFileSelection(file.id)}
                            onClick={(e) => e.stopPropagation()}
                          />
                        </div>

                        <button
                          onClick={() => handleServerFileSelect(file)}
                          className="w-full text-left"
                        >
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
                          <p className="text-sm font-medium truncate">
                            {file.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.fileSize)}
                        </p>
                        </button>
                      </div>
                    ) : (
                      <div
                        key={file.id}
                        className={`w-full border rounded-lg p-3 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors flex items-center gap-3 ${
                          selectedFileIds.has(file.id) ? 'border-violet-500 bg-violet-50 dark:bg-violet-950/20' : ''
                        }`}
                      >
                        {/* Checkbox */}
                        <Checkbox
                          checked={selectedFileIds.has(file.id)}
                          onCheckedChange={() => toggleFileSelection(file.id)}
                          onClick={(e) => e.stopPropagation()}
                        />

                        <button
                          onClick={() => handleServerFileSelect(file)}
                          className="flex items-center gap-3 flex-1"
                        >
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
                          <div className="flex-1 text-left">
                            <p className="text-sm font-medium truncate">
                              {file.fileName}
                            </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.fileSize)} • {file.mimeType}
                          </p>
                        </div>
                        </button>
                      </div>
                    )
                  ))}
                </div>
              )}
            </TabsContent>
          )}

          {/* URL Tab */}
          {allowUrl && (
            <TabsContent value="url" className="space-y-4">
              <div className="space-y-4">
                <div>
                  <Label htmlFor="url-input">File URL</Label>
                  <Input
                    id="url-input"
                    type="url"
                    placeholder="https://example.com/file.jpg"
                    value={urlInput}
                    onChange={(e) => setUrlInput(e.target.value)}
                  />
                </div>
                <Button
                  onClick={handleUrlSubmit}
                  className="w-full bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white font-medium"
                >
                  Insert URL
                </Button>
              </div>
            </TabsContent>
          )}

          {/* Recent Tab - Fully Implemented */}
          {allowRecent && (
            <TabsContent value="recent" className="space-y-4">
              {/* Header with Clear Button */}
              <div className="flex items-center justify-between">
                <p className="text-sm text-muted-foreground">
                  Last {recentFiles.length} uploaded files
                </p>
                {recentFiles.length > 0 && (
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      clearRecentFiles()
                      setRecentFiles([])
                      toast.success('Recent files cleared')
                    }}
                  >
                    <Trash2 className="w-4 h-4 mr-2" />
                    Clear All
                  </Button>
                )}
              </div>

              {recentFiles.length === 0 ? (
                <div className="text-center py-12 text-muted-foreground">
                  <Clock className="w-12 h-12 mx-auto mb-3 opacity-50" />
                  <p className="font-medium">No recent files</p>
                  <p className="text-sm">Files you upload will appear here</p>
                </div>
              ) : (
                <div className={`max-h-96 overflow-y-auto ${
                  viewMode === 'grid'
                    ? 'grid grid-cols-4 gap-4'
                    : 'space-y-2'
                }`}>
                  {recentFiles.map((file) => (
                    viewMode === 'grid' ? (
                      <button
                        key={file.id}
                        onClick={() => {
                          onSelect({
                            url: file.url,
                            fileName: file.fileName,
                            fileSize: file.fileSize,
                            mimeType: file.mimeType,
                            source: 'recent',
                          })
                          onClose()
                        }}
                        className="border rounded-lg p-4 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors text-left"
                      >
                        {file.mimeType.startsWith('image/') ? (
                          <img
                            src={file.url}
                            alt={file.fileName}
                            className="w-full h-24 object-cover rounded mb-2"
                          />
                        ) : (
                          <div className="w-full h-24 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded mb-2">
                            <span className="text-3xl">{getFileIcon(file.mimeType)}</span>
                          </div>
                        )}
                        <p className="text-sm font-medium truncate">
                          {file.fileName}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {formatFileSize(file.fileSize)}
                        </p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(file.uploadedAt).toLocaleDateString()}
                        </p>
                      </button>
                    ) : (
                      <button
                        key={file.id}
                        onClick={() => {
                          onSelect({
                            url: file.url,
                            fileName: file.fileName,
                            fileSize: file.fileSize,
                            mimeType: file.mimeType,
                            source: 'recent',
                          })
                          onClose()
                        }}
                        className="w-full border rounded-lg p-3 hover:border-violet-500 hover:bg-violet-50 dark:hover:bg-violet-950/20 transition-colors flex items-center gap-3"
                      >
                        {file.mimeType.startsWith('image/') ? (
                          <img
                            src={file.url}
                            alt={file.fileName}
                            className="w-12 h-12 object-cover rounded"
                          />
                        ) : (
                          <div className="w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded">
                            <span className="text-2xl">{getFileIcon(file.mimeType)}</span>
                          </div>
                        )}
                        <div className="flex-1 text-left">
                          <p className="text-sm font-medium truncate">
                            {file.fileName}
                          </p>
                          <p className="text-xs text-muted-foreground">
                            {formatFileSize(file.fileSize)} • {new Date(file.uploadedAt).toLocaleDateString()}
                          </p>
                        </div>
                      </button>
                    )
                  ))}
                </div>
              )}
            </TabsContent>
          )}
        </Tabs>
      </DialogContent>
    </Dialog>

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
    </>
  )
}

