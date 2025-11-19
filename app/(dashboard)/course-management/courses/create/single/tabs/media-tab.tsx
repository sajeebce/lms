'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Button } from '@/components/ui/button'
import { FileUploadButton } from '@/components/ui/file-upload-button'
import { Switch } from '@/components/ui/switch'
import { Image, Trash2, Video } from 'lucide-react'
import type { CourseFormData } from '../single-course-form'

type Props = {
  data: CourseFormData
  onChange: (data: Partial<CourseFormData>) => void
  courseId?: string
}

export default function MediaTab({ data, onChange, courseId }: Props) {
  const entityId = courseId || 'temp'

  const isInternalStorageUrl = (url?: string | null) =>
    !!url && url.startsWith('/api/storage/')

  const isInternalFeatured = isInternalStorageUrl(data.featuredImage)
  const isInternalVideo = isInternalStorageUrl(data.introVideoUrl)

  return (
    <div className="space-y-6">
      {/* Featured Image */}
      <div className="space-y-3 rounded-xl border bg-neutral-50/60 dark:bg-neutral-900/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <Label htmlFor="featuredImage" className="flex items-center gap-2">
              <Image className="h-4 w-4 text-sky-500" />
              <span>Featured Image</span>
            </Label>
            <p className="text-xs text-neutral-500">
              This image appears on course cards and the course header.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <FileUploadButton
              category="course_featured_image"
              entityType="course"
              entityId={entityId}
              accept="image/*"
              maxSize={5 * 1024 * 1024}
              buttonText={data.featuredImage ? 'Change image' : 'Upload / select image'}
              buttonVariant="outline"
              showImageProperties={false}
              className="whitespace-nowrap text-xs"
              onUploadComplete={(url) => onChange({ featuredImage: url })}
            />

            {data.featuredImage && (
              <Button
                type="button"
                variant="ghost"
                size="icon-sm"
                className="text-destructive hover:text-destructive"
                onClick={() => onChange({ featuredImage: undefined })}
                aria-label="Remove featured image"
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <Input
          id="featuredImage"
          placeholder={
            isInternalFeatured ? 'Image stored securely in LMS storage' : 'https://example.com/image.jpg'
          }
          value={
            isInternalFeatured
              ? 'Image stored in LMS storage'
              : data.featuredImage || ''
          }
          readOnly={isInternalFeatured}
          onChange={
            isInternalFeatured ? undefined : (e) => onChange({ featuredImage: e.target.value })
          }
          className="text-sm"
        />
        <p className="text-[11px] text-neutral-500">
          Recommended size: 1200x630px (16:9). JPG or PNG, under 1MB.
        </p>

        {/* Image Preview */}
        {data.featuredImage && (
          <div className="mt-3 border rounded-lg p-3 bg-neutral-100/70 dark:bg-neutral-900">
            <p className="text-xs font-medium mb-2">Preview</p>
            <div className="relative aspect-video bg-neutral-100 dark:bg-neutral-800 rounded-lg overflow-hidden">
              <img
                src={data.featuredImage}
                alt="Featured"
                className="w-full h-full object-cover"
                onError={(e) => {
                  e.currentTarget.src = ''
                  e.currentTarget.style.display = 'none'
                }}
              />
            </div>
          </div>
        )}
      </div>

      {/* Intro Video */}
      <div className="space-y-3 rounded-xl border bg-neutral-50/60 dark:bg-neutral-900/40 p-4">
        <div className="flex items-center justify-between gap-3">
          <div className="space-y-1">
            <Label htmlFor="introVideoUrl" className="flex items-center gap-2">
              <Video className="h-4 w-4 text-emerald-500" />
              <span>Intro Video</span>
            </Label>
            <p className="text-xs text-neutral-500">
              Short teaser shown on the course landing page. YouTube URL is recommended.
            </p>
          </div>

          <FileUploadButton
            category="course_intro_video"
            entityType="course"
            entityId={entityId}
            accept="video/*"
            maxSize={100 * 1024 * 1024}
            buttonText={data.introVideoUrl ? 'Change video' : 'Upload / select video'}
            buttonVariant="outline"
            icon={<Video className="w-4 h-4" />}
            className="whitespace-nowrap text-xs"
            onUploadComplete={(url) => onChange({ introVideoUrl: url })}
          />
        </div>

        <Input
          id="introVideoUrl"
          placeholder={
            isInternalVideo
              ? 'Video stored securely in LMS storage'
              : 'https://www.youtube.com/watch?v=...'
          }
          value={
            isInternalVideo
              ? 'Video stored in LMS storage (URL hidden)'
              : data.introVideoUrl || ''
          }
          readOnly={isInternalVideo}
          onChange={
            isInternalVideo ? undefined : (e) => onChange({ introVideoUrl: e.target.value })
          }
          className="text-sm"
        />
        <p className="text-[11px] text-neutral-500">
          Supports YouTube, Vimeo or direct video URLs.
        </p>

        <div className="flex items-center justify-between rounded-lg border bg-neutral-50/80 dark:bg-neutral-900 px-3 py-2 mt-2">
          <div className="space-y-0.5">
            <p className="text-xs font-medium text-neutral-800 dark:text-neutral-200">
              Autoplay intro video
            </p>
            <p className="text-[11px] text-neutral-500">
              When enabled, the intro video will auto-play (muted) on supported browsers.
            </p>
          </div>
          <Switch
            id="introVideoAutoplay"
            checked={data.introVideoAutoplay}
            onCheckedChange={(value) => onChange({ introVideoAutoplay: !!value })}
          />
        </div>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4 mt-2">
        <div className="border rounded-lg p-4 space-y-2 bg-neutral-50/80 dark:bg-neutral-900/60">
          <div className="flex items-center gap-2 text-violet-600 dark:text-violet-400">
            <Image className="h-5 w-5" />
            <h3 className="font-medium">Featured Image Tips</h3>
          </div>
          <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
            <li>• Use high-quality images (1200x630px)</li>
            <li>• Keep file size under 500KB</li>
            <li>• Use JPG or PNG format</li>
            <li>• Ensure good contrast for text overlay</li>
          </ul>
        </div>

        <div className="border rounded-lg p-4 space-y-2 bg-neutral-50/80 dark:bg-neutral-900/60">
          <div className="flex items-center gap-2 text-orange-600 dark:text-orange-400">
            <Video className="h-5 w-5" />
            <h3 className="font-medium">Intro Video Tips</h3>
          </div>
          <ul className="text-sm text-neutral-600 dark:text-neutral-400 space-y-1">
            <li>• Keep it short (1-3 minutes)</li>
            <li>• Explain course benefits clearly</li>
            <li>• Use YouTube or Vimeo for hosting</li>
            <li>• Add captions for accessibility</li>
          </ul>
        </div>
      </div>
    </div>
  )
}

