'use client'

import { useState } from 'react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Link } from 'lucide-react'
import { toast } from 'sonner'

interface ExternalUrlTabProps {
  onUrlSubmit: (url: string) => void
}

export function ExternalUrlTab({ onUrlSubmit }: ExternalUrlTabProps) {
  const [url, setUrl] = useState('')
  const [loading, setLoading] = useState(false)

  const handleSubmit = async () => {
    if (!url.trim()) {
      toast.error('Please enter a URL')
      return
    }

    // Validate URL format
    try {
      new URL(url)
    } catch {
      toast.error('Invalid URL format')
      return
    }

    // Check if URL is an image
    if (!url.match(/\.(jpg|jpeg|png|gif|webp|svg)$/i)) {
      toast.error('URL must point to an image file (jpg, png, gif, webp, svg)')
      return
    }

    setLoading(true)

    // Test if image loads
    const img = new Image()
    img.onload = () => {
      setLoading(false)
      onUrlSubmit(url)
      toast.success('External image loaded successfully')
    }
    img.onerror = () => {
      setLoading(false)
      toast.error('Failed to load image from URL. Please check the URL and try again.')
    }
    img.src = url
  }

  return (
    <div className="space-y-4">
      <div className="space-y-2">
        <Label htmlFor="external-url">Image URL</Label>
        <Input
          id="external-url"
          type="url"
          placeholder="https://example.com/image.jpg"
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => {
            if (e.key === 'Enter') {
              handleSubmit()
            }
          }}
        />
        <p className="text-xs text-muted-foreground">
          Enter a direct link to an image (jpg, jpeg, png, gif, webp, svg)
        </p>
      </div>

      <Button
        onClick={handleSubmit}
        disabled={loading || !url.trim()}
        className="w-full"
      >
        {loading ? 'Loading...' : 'Use This URL'}
      </Button>
    </div>
  )
}

