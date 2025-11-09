'use client'

import { useState } from 'react'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { FileUploadButton } from '@/components/ui/file-upload-button'
import { ImageProperties } from '@/components/ui/image-properties-dialog'
import { Separator } from '@/components/ui/separator'

export default function TestUploadPage() {
  const [studentPhotoUrl, setStudentPhotoUrl] = useState<string>('')
  const [questionImageUrl, setQuestionImageUrl] = useState<string>('')
  const [questionImageProps, setQuestionImageProps] = useState<ImageProperties | null>(null)
  const [documentUrl, setDocumentUrl] = useState<string>('')

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold mb-2">File Upload Test Page</h1>
        <p className="text-gray-600">
          Test the unified file upload system with different file types and categories
        </p>
      </div>

      <Separator />

      {/* Student Photo Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Student Photo Upload</CardTitle>
          <CardDescription>
            Upload a student profile photo (auto-replaces old photo)
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUploadButton
            category="student_photo"
            entityType="student"
            entityId="test_student_123"
            onUploadComplete={(url) => setStudentPhotoUrl(url)}
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            buttonText="Upload Student Photo"
          />

          {studentPhotoUrl && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-sm font-medium mb-2">Uploaded Photo:</p>
              <img
                src={studentPhotoUrl}
                alt="Student"
                className="max-w-xs rounded-lg shadow-md"
              />
              <p className="text-xs text-gray-500 mt-2 break-all">{studentPhotoUrl}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Question Image Upload with Properties */}
      <Card>
        <CardHeader>
          <CardTitle>Question Image Upload (with Properties)</CardTitle>
          <CardDescription>
            Upload a question image with alt text and alignment settings
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUploadButton
            category="question_image"
            entityType="question"
            entityId="test_question_456"
            onUploadComplete={(url, props) => {
              setQuestionImageUrl(url)
              if (props) setQuestionImageProps(props)
            }}
            accept="image/*"
            maxSize={5 * 1024 * 1024}
            buttonText="Upload Question Image"
            showImageProperties={true}
          />

          {questionImageUrl && (
            <div className="border rounded-lg p-4 bg-gray-50 space-y-3">
              <p className="text-sm font-medium">Uploaded Image:</p>
              <img
                src={questionImageUrl}
                alt={questionImageProps?.alt || 'Question image'}
                className={`max-w-md rounded-lg shadow-md ${
                  questionImageProps?.alignment === 'center' ? 'mx-auto' :
                  questionImageProps?.alignment === 'right' ? 'ml-auto' : ''
                }`}
                style={{
                  width: questionImageProps?.width ? `${questionImageProps.width}px` : 'auto',
                  height: questionImageProps?.height ? `${questionImageProps.height}px` : 'auto',
                }}
              />
              
              {questionImageProps && (
                <div className="text-xs text-gray-600 space-y-1">
                  <p><strong>URL:</strong> {questionImageUrl}</p>
                  <p><strong>Alt Text:</strong> {questionImageProps.alt || '(decorative)'}</p>
                  <p><strong>Alignment:</strong> {questionImageProps.alignment}</p>
                  {questionImageProps.width && (
                    <p><strong>Width:</strong> {questionImageProps.width}px</p>
                  )}
                  {questionImageProps.height && (
                    <p><strong>Height:</strong> {questionImageProps.height}px</p>
                  )}
                  <p><strong>Decorative:</strong> {questionImageProps.isDecorative ? 'Yes' : 'No'}</p>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Document Upload */}
      <Card>
        <CardHeader>
          <CardTitle>Document Upload</CardTitle>
          <CardDescription>
            Upload a PDF or document file
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <FileUploadButton
            category="student_document"
            entityType="student"
            entityId="test_student_123"
            onUploadComplete={(url) => setDocumentUrl(url)}
            accept="application/pdf,.doc,.docx"
            maxSize={10 * 1024 * 1024}
            buttonText="Upload Document"
          />

          {documentUrl && (
            <div className="border rounded-lg p-4 bg-gray-50">
              <p className="text-sm font-medium mb-2">Uploaded Document:</p>
              <a
                href={documentUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="text-violet-600 hover:underline break-all"
              >
                {documentUrl}
              </a>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Instructions */}
      <Card className="bg-blue-50 border-blue-200">
        <CardHeader>
          <CardTitle className="text-blue-900">Testing Instructions</CardTitle>
        </CardHeader>
        <CardContent className="text-sm text-blue-800 space-y-2">
          <p><strong>Student Photo:</strong> Upload an image. Try uploading again to see the old file being replaced.</p>
          <p><strong>Question Image:</strong> Upload an image and fill in the alt text, dimensions, and alignment in the dialog.</p>
          <p><strong>Document:</strong> Upload a PDF or document file.</p>
          <p className="mt-4 text-xs text-blue-600">
            Note: Files are stored in <code>./storage/tenants/tenant_1/</code> directory.
            Check the database <code>uploaded_files</code> table to see tracked files.
          </p>
        </CardContent>
      </Card>
    </div>
  )
}

