'use client'

import { useState, useEffect } from 'react'
import { Button } from '@/components/ui/button'
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
import { Clock, Trash2, Image as ImageIcon, File } from 'lucide-react'
import { toast } from 'sonner'
import { getRecentFiles, clearRecentFiles, formatFileSize, type RecentFile } from '@/lib/storage/recent-files'

interface RecentFilesTabProps {
  onFileSelect: (file: {
    url: string
    fileName: string
    fileSize: number
    mimeType: string
    id?: string
  }) => void
}

export function RecentFilesTab({ onFileSelect }: RecentFilesTabProps) {
  const [recentFiles, setRecentFiles] = useState<RecentFile[]>([])
  const [clearDialogOpen, setClearDialogOpen] = useState(false)

  useEffect(() => {
    setRecentFiles(getRecentFiles())
  }, [])

  const handleClearRecent = () => {
    clearRecentFiles()
    setRecentFiles([])
    toast.success('Recent files cleared')
    setClearDialogOpen(false)
  }

  const handleFileClick = (file: RecentFile) => {
    onFileSelect({
      url: file.url,
      fileName: file.fileName,
      fileSize: file.fileSize,
      mimeType: file.mimeType,
      id: file.id,
    })
  }

  return (
    <div className="space-y-4">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
          <Clock className="w-4 h-4" />
          <span>Recently Used Files</span>
        </div>
        {recentFiles.length > 0 && (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={() => setClearDialogOpen(true)}
            className="text-red-600 hover:text-red-700 hover:bg-red-50"
          >
            <Trash2 className="w-4 h-4 mr-2" />
            Clear All
          </Button>
        )}
      </div>

      {/* Recent Files List */}
      {recentFiles.length === 0 ? (
        <div className="text-center py-8 text-gray-500">
          <Clock className="w-12 h-12 mx-auto mb-2 text-gray-300" />
          <p>No recent files</p>
        </div>
      ) : (
        <div className="space-y-2 max-h-96 overflow-y-auto">
          {recentFiles.map((file, index) => (
            <div
              key={`${file.url}-${index}`}
              className="border rounded-lg p-3 cursor-pointer hover:border-violet-500 transition-colors flex items-center gap-3"
              onClick={() => handleFileClick(file)}
            >
              {file.mimeType.startsWith('image/') ? (
                <img
                  src={file.url}
                  alt={file.fileName}
                  className="w-12 h-12 object-cover rounded"
                  onError={(e) => {
                    // Fallback to file icon if image fails to load
                    e.currentTarget.style.display = 'none'
                    e.currentTarget.nextElementSibling?.classList.remove('hidden')
                  }}
                />
              ) : null}
              <div
                className={`w-12 h-12 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded ${
                  file.mimeType.startsWith('image/') ? 'hidden' : ''
                }`}
              >
                <File className="w-6 h-6 text-gray-400" />
              </div>
              <div className="flex-1">
                <p className="text-sm font-medium">{file.fileName}</p>
                <p className="text-xs text-gray-500">
                  {formatFileSize(file.fileSize)} • {new Date(file.timestamp).toLocaleDateString()}
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Clear Confirmation Dialog */}
      <AlertDialog open={clearDialogOpen} onOpenChange={setClearDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Clear Recent Files</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to clear all recent files? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleClearRecent}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Clear All
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

