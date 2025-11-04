'use client'

import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Image, Video } from 'lucide-react'
import type { CourseFormData } from '../single-course-form'

type Props = {
  data: CourseFormData
  onChange: (data: Partial<CourseFormData>) => void
}

export default function MediaTab({ data, onChange }: Props) {
  return (
    <div className="space-y-6">
      {/* Featured Image */}
      <div className="space-y-2">
        <Label htmlFor="featuredImage">Featured Image URL</Label>
        <div className="flex gap-2">
          <div className="flex-1">
            <Input
              id="featuredImage"
              placeholder="https://example.com/image.jpg"
              value={data.featuredImage || ''}
              onChange={(e) => onChange({ featuredImage: e.target.value })}
            />
          </div>
        </div>
        <p className="text-xs text-neutral-500">
          Recommended size: 1200x630px (16:9 ratio)
        </p>
        
        {/* Image Preview */}
        {data.featuredImage && (
          <div className="mt-4 border rounded-lg p-4">
            <p className="text-sm font-medium mb-2">Preview:</p>
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
      <div className="space-y-2">
        <Label htmlFor="introVideoUrl">Intro Video URL</Label>
        <Input
          id="introVideoUrl"
          placeholder="https://www.youtube.com/watch?v=..."
          value={data.introVideoUrl || ''}
          onChange={(e) => onChange({ introVideoUrl: e.target.value })}
        />
        <p className="text-xs text-neutral-500">
          Supports YouTube, Vimeo, or direct video URLs
        </p>
      </div>

      {/* Info Cards */}
      <div className="grid md:grid-cols-2 gap-4 mt-6">
        <div className="border rounded-lg p-4 space-y-2">
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

        <div className="border rounded-lg p-4 space-y-2">
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

