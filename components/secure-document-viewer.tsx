'use client'

import { useEffect, useRef, useState } from 'react'
import { Button } from '@/components/ui/button'
import { Download, ZoomIn, ZoomOut, ChevronLeft, ChevronRight } from 'lucide-react'

interface SecureDocumentViewerProps {
  documentUrl: string
  fileName: string
  allowDownload?: boolean
  watermarkText?: string // e.g., "Student Name - STU-2025-001 - 2025-01-22 14:30"
}

export function SecureDocumentViewer({
  documentUrl,
  fileName,
  allowDownload = false,
  watermarkText,
}: SecureDocumentViewerProps) {
  const [zoom, setZoom] = useState(100)
  const containerRef = useRef<HTMLDivElement>(null)

  // Disable right-click context menu
  useEffect(() => {
    const handleContextMenu = (e: MouseEvent) => {
      e.preventDefault()
      return false
    }

    const container = containerRef.current
    if (container) {
      container.addEventListener('contextmenu', handleContextMenu)
    }

    return () => {
      if (container) {
        container.removeEventListener('contextmenu', handleContextMenu)
      }
    }
  }, [])

  // Disable print (override Ctrl+P / Cmd+P)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'p') {
        e.preventDefault()
        alert('Printing is disabled for protected documents.')
        return false
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [])

  const handleDownload = () => {
    if (!allowDownload) return

    const link = document.createElement('a')
    link.href = documentUrl
    link.download = fileName
    link.click()
  }

  const handleZoomIn = () => {
    setZoom((prev) => Math.min(prev + 25, 200))
  }

  const handleZoomOut = () => {
    setZoom((prev) => Math.max(prev - 25, 50))
  }

  return (
    <div className="space-y-4">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-3 bg-slate-100 dark:bg-slate-800 rounded-lg border border-slate-200 dark:border-slate-700">
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomOut}
            disabled={zoom <= 50}
          >
            <ZoomOut className="h-4 w-4" />
          </Button>
          <span className="text-sm font-medium min-w-[60px] text-center">
            {zoom}%
          </span>
          <Button
            variant="outline"
            size="sm"
            onClick={handleZoomIn}
            disabled={zoom >= 200}
          >
            <ZoomIn className="h-4 w-4" />
          </Button>
        </div>

        {allowDownload && (
          <Button
            variant="outline"
            size="sm"
            onClick={handleDownload}
            className="gap-2"
          >
            <Download className="h-4 w-4" />
            Download
          </Button>
        )}
      </div>

      {/* Document Viewer with Watermark */}
      <div
        ref={containerRef}
        className="relative border border-slate-200 dark:border-slate-700 rounded-lg overflow-hidden bg-slate-50 dark:bg-slate-900"
        style={{
          userSelect: 'none',
          WebkitUserSelect: 'none',
          MozUserSelect: 'none',
          msUserSelect: 'none',
        }}
      >
        {/* Watermark Overlay */}
        {watermarkText && (
          <div
            className="absolute inset-0 pointer-events-none z-10 flex items-center justify-center"
            style={{
              background: `repeating-linear-gradient(
                45deg,
                transparent,
                transparent 200px,
                rgba(0, 0, 0, 0.03) 200px,
                rgba(0, 0, 0, 0.03) 400px
              )`,
            }}
          >
            <div
              className="text-slate-400/30 dark:text-slate-500/30 font-bold text-2xl transform -rotate-45 whitespace-nowrap select-none"
              style={{
                textShadow: '0 0 10px rgba(0,0,0,0.1)',
              }}
            >
              {watermarkText}
            </div>
          </div>
        )}

        {/* PDF Embed */}
        <iframe
          src={documentUrl}
          className="w-full"
          style={{
            height: '600px',
            transform: `scale(${zoom / 100})`,
            transformOrigin: 'top left',
            width: `${(100 / zoom) * 100}%`,
          }}
          title={fileName}
        />
      </div>
    </div>
  )
}

