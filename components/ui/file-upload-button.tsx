'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { FilePickerModal, SelectedFile } from './file-picker-modal'
import { ImagePropertiesDialog, ImageProperties } from './image-properties-dialog'
import { Upload, Image as ImageIcon } from 'lucide-react'
import { toast } from 'sonner'

interface FileUploadButtonProps {
  category: string
  entityType?: string
  entityId?: string
  onUploadComplete: (url: string, properties?: ImageProperties) => void
  accept?: string
  maxSize?: number
  buttonText?: string
  buttonVariant?: 'default' | 'outline' | 'ghost' | 'secondary'
  showImageProperties?: boolean
  icon?: React.ReactNode
  className?: string
}

export function FileUploadButton({
  category,
  entityType,
  entityId,
  onUploadComplete,
  accept = '*/*',
  maxSize = 10 * 1024 * 1024,
  buttonText,
  buttonVariant = 'outline',
  showImageProperties = false,
  icon,
  className,
}: FileUploadButtonProps) {
  const [showFilePicker, setShowFilePicker] = useState(false)
  const [showImageDialog, setShowImageDialog] = useState(false)
  const [selectedFile, setSelectedFile] = useState<SelectedFile | null>(null)

  // Determine if this is an image upload
  const isImageUpload = accept.includes('image') || category.includes('image') || category.includes('photo')

  // Default button text
  const defaultButtonText = isImageUpload ? 'Upload Image' : 'Upload File'

  // Default icon
  const defaultIcon = isImageUpload ? <ImageIcon className="w-4 h-4" /> : <Upload className="w-4 h-4" />

  const handleFileSelect = (file: SelectedFile) => {
    setSelectedFile(file)
    setShowFilePicker(false)

    // If it's an image and showImageProperties is true, show the image properties dialog
    if (isImageUpload && showImageProperties) {
      setShowImageDialog(true)
    } else {
      // Otherwise, directly complete the upload
      onUploadComplete(file.url)
      toast.success('File uploaded successfully')
    }
  }

  const handleImageInsert = (properties: ImageProperties) => {
    if (selectedFile) {
      onUploadComplete(properties.url, properties)
      toast.success('Image inserted successfully')
    }
    setShowImageDialog(false)
    setSelectedFile(null)
  }

  return (
    <>
      <Button
        type="button"
        variant={buttonVariant}
        onClick={() => setShowFilePicker(true)}
        className={className}
      >
        {icon || defaultIcon}
        <span className="ml-2">{buttonText || defaultButtonText}</span>
      </Button>

      {/* File Picker Modal */}
      <FilePickerModal
        open={showFilePicker}
        onClose={() => setShowFilePicker(false)}
        onSelect={handleFileSelect}
        category={category}
        entityType={entityType}
        entityId={entityId}
        accept={accept}
        maxSize={maxSize}
      />

      {/* Image Properties Dialog (only for images) */}
      {isImageUpload && showImageProperties && (
        <ImagePropertiesDialog
          open={showImageDialog}
          onClose={() => {
            setShowImageDialog(false)
            setSelectedFile(null)
          }}
          onInsert={handleImageInsert}
          initialUrl={selectedFile?.url || ''}
          category={category}
          entityType={entityType}
          entityId={entityId}
        />
      )}
    </>
  )
}

