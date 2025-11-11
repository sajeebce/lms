'use client'

import { useState, useCallback } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Textarea } from '@/components/ui/textarea'
import { Upload, X } from 'lucide-react'
import { toast } from 'sonner'

interface FileUploadTabProps {
  category: string
  entityType?: string
  entityId?: string
  accept?: string
  maxSize?: number
  onFileSelect: (file: {
    url: string
    fileName: string
    fileSize: number
    mimeType: string
    id?: string
  }) => void
}

export function FileUploadTab({
  category,
  entityType,
  entityId,
  accept = 'image/*',
  maxSize = 5 * 1024 * 1024, // 5MB default for images
  onFileSelect,
}: FileUploadTabProps) {
  const [uploading, setUploading] = useState(false)
  const [dragActive, setDragActive] = useState(false)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)

  const handleDrag = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }, [])

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      e.stopPropagation()
      setDragActive(false)

      if (e.dataTransfer.files && e.dataTransfer.files[0]) {
        const file = e.dataTransfer.files[0]
        
        // Validate file type
        if (accept !== '*/*' && !file.type.match(accept.replace('*', '.*'))) {
          toast.error(`Invalid file type. Expected: ${accept}`)
          return
        }

        // Validate file size
        if (file.size > maxSize) {
          toast.error(`File too large. Max size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`)
          return
        }

        setSelectedFile(file)
      }
    },
    [accept, maxSize]
  )

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0]

      // Validate file size
      if (file.size > maxSize) {
        toast.error(`File too large. Max size: ${(maxSize / 1024 / 1024).toFixed(1)}MB`)
        return
      }

      setSelectedFile(file)
    }
  }

  const handleUpload = async () => {
    if (!selectedFile) {
      toast.error('Please select a file first')
      return
    }

    setUploading(true)
    try {
      const formData = new FormData()
      formData.append('file', selectedFile)
      formData.append('category', category)
      if (entityType) formData.append('entityType', entityType)
      if (entityId) formData.append('entityId', entityId)

      const response = await fetch('/api/files/upload', {
        method: 'POST',
        body: formData,
      })

      if (!response.ok) {
        const error = await response.json()
        throw new Error(error.error || 'Upload failed')
      }

      const data = await response.json()

      // Call parent callback
      onFileSelect({
        url: data.url,
        fileName: data.fileName,
        fileSize: data.size,
        mimeType: data.mimeType,
        id: data.id,
      })

      // Reset form
      setSelectedFile(null)
      toast.success('File uploaded successfully!')
    } catch (error: any) {
      console.error('Upload error:', error)
      toast.error(error.message || 'Failed to upload file')
    } finally {
      setUploading(false)
    }
  }

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes'
    const k = 1024
    const sizes = ['Bytes', 'KB', 'MB', 'GB']
    const i = Math.floor(Math.log(bytes) / Math.log(k))
    return Math.round(bytes / Math.pow(k, i) * 100) / 100 + ' ' + sizes[i]
  }

  return (
    <div className="space-y-4">
      {/* Drag & Drop Zone */}
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
        <Upload className="w-12 h-12 mx-auto mb-4 text-gray-400" />
        <p className="text-sm text-gray-600 dark:text-gray-400 mb-2">
          Drag and drop files here
        </p>
        <p className="text-xs text-gray-500 mb-4">
          Max size: {(maxSize / 1024 / 1024).toFixed(1)}MB
        </p>
        <Label htmlFor="file-input" className="cursor-pointer">
          <Button type="button" variant="outline" asChild>
            <span>Choose File</span>
          </Button>
        </Label>
        <Input
          id="file-input"
          type="file"
          accept={accept}
          onChange={handleFileChange}
          className="hidden"
        />
      </div>

      {/* Selected File Preview */}
      {selectedFile && (
        <div className="border rounded-lg p-4 bg-gray-50 dark:bg-gray-900">
          <div className="flex items-start justify-between mb-3">
            <div className="flex-1">
              <p className="text-sm font-medium">{selectedFile.name}</p>
              <p className="text-xs text-gray-500">
                {formatFileSize(selectedFile.size)} • {selectedFile.type}
              </p>
            </div>
            <Button
              type="button"
              variant="ghost"
              size="sm"
              onClick={() => setSelectedFile(null)}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>

          {/* Image Preview */}
          {selectedFile.type.startsWith('image/') && (
            <img
              src={URL.createObjectURL(selectedFile)}
              alt="Preview"
              className="max-w-full max-h-48 mx-auto rounded"
            />
          )}

          {/* Upload Button */}
          <Button
            onClick={handleUpload}
            disabled={uploading}
            className="w-full mt-4 bg-gradient-to-r from-violet-600 to-orange-500 hover:from-violet-700 hover:to-orange-600 text-white"
          >
            {uploading ? 'Uploading...' : 'Upload File'}
          </Button>
        </div>
      )}
    </div>
  )
}

