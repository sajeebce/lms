'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import { Card, CardContent } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { ArrowLeft, Save, Package, X } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import { createBundleCourse } from './actions'

type Category = {
  id: string
  name: string
  icon: string | null
}

type AvailableCourse = {
  id: string
  title: string
  slug: string
  regularPrice: number | null
  offerPrice: number | null
  currency: string
}

type Props = {
  categories: Category[]
  availableCourses: AvailableCourse[]
}

export default function BundleCourseForm({ categories, availableCourses }: Props) {
  const router = useRouter()
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState({
    title: '',
    slug: '',
    categoryId: '',
    description: '',
    shortDescription: '',
    selectedCourseIds: [] as string[],
    regularPrice: 0,
    offerPrice: 0,
    currency: 'BDT',
    status: 'DRAFT' as 'DRAFT' | 'PUBLISHED',
  })

  // Auto-generate slug from title
  useEffect(() => {
    if (formData.title && !formData.slug) {
      const slug = formData.title
        .toLowerCase()
        .replace(/[^a-z0-9]+/g, '-')
        .replace(/^-+|-+$/g, '')
      setFormData((prev) => ({ ...prev, slug }))
    }
  }, [formData.title, formData.slug])

  // Calculate suggested bundle price
  const selectedCourses = availableCourses.filter((c) =>
    formData.selectedCourseIds.includes(c.id)
  )
  const totalRegularPrice = selectedCourses.reduce(
    (sum, c) => sum + (c.regularPrice || 0),
    0
  )
  const suggestedBundlePrice = Math.round(totalRegularPrice * 0.8) // 20% discount

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    if (!formData.title || !formData.slug) {
      toast.error('Title and slug are required')
      return
    }

    if (formData.selectedCourseIds.length === 0) {
      toast.error('Please select at least one course for the bundle')
      return
    }

    setSaving(true)
    
    const result = await createBundleCourse({
      ...formData,
      status,
    })

    if (result.success) {
      toast.success(`Bundle ${status === 'DRAFT' ? 'saved as draft' : 'published'} successfully! 🎉`)
      router.push('/course-management/courses')
    } else {
      toast.error(result.error || 'Failed to create bundle')
    }
    
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-4">
          <Link href="/course-management/courses/new">
            <Button variant="ghost" size="sm">
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          </Link>
          <div>
            <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--theme-active-from)] to-[var(--theme-active-to)] bg-clip-text text-transparent">
              Create Bundle Course
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Combine multiple courses into a discounted bundle
            </p>
          </div>
        </div>

        <div className="flex gap-2">
          <Button
            variant="outline"
            onClick={() => handleSave('DRAFT')}
            disabled={saving}
          >
            <Save className="h-4 w-4 mr-2" />
            Save as Draft
          </Button>
          <Button
            onClick={() => handleSave('PUBLISHED')}
            disabled={saving}
            className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] hover:opacity-90 text-white"
          >
            <Save className="h-4 w-4 mr-2" />
            Publish Bundle
          </Button>
        </div>
      </div>

      {/* Form */}
      <Card>
        <CardContent className="pt-6 space-y-6">
          {/* Basic Info */}
          <div className="grid md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <Label htmlFor="title">Bundle Title *</Label>
              <Input
                id="title"
                placeholder="e.g., Complete Web Development Bundle"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                maxLength={200}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="slug">URL Slug *</Label>
              <Input
                id="slug"
                placeholder="e.g., complete-web-dev-bundle"
                value={formData.slug}
                onChange={(e) => setFormData({ ...formData, slug: e.target.value })}
                maxLength={200}
              />
            </div>
          </div>

          {/* Category */}
          <div className="space-y-2">
            <Label>Category</Label>
            <SearchableDropdown
              options={categories.map((cat) => ({
                value: cat.id,
                label: `${cat.icon || '📚'} ${cat.name}`,
              }))}
              value={formData.categoryId}
              onChange={(value) => setFormData({ ...formData, categoryId: value })}
              placeholder="Select category (optional)"
            />
          </div>

          {/* Short Description */}
          <div className="space-y-2">
            <Label htmlFor="shortDescription">Short Description</Label>
            <Textarea
              id="shortDescription"
              placeholder="Brief overview of the bundle"
              value={formData.shortDescription}
              onChange={(e) => setFormData({ ...formData, shortDescription: e.target.value })}
              maxLength={500}
              rows={3}
            />
          </div>

          {/* Full Description */}
          <div className="space-y-2">
            <Label htmlFor="description">Full Description</Label>
            <Textarea
              id="description"
              placeholder="Detailed bundle description"
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={6}
            />
          </div>

          {/* Course Selection */}
          <div className="space-y-2">
            <Label>Select Courses *</Label>
            <MultiSelectDropdown
              options={availableCourses.map((course) => ({
                value: course.id,
                label: `${course.title} (${course.currency} ${course.offerPrice || course.regularPrice || 0})`,
              }))}
              value={formData.selectedCourseIds}
              onChange={(value) => setFormData({ ...formData, selectedCourseIds: value })}
              placeholder="Select courses to include in bundle"
            />
            <p className="text-xs text-neutral-500">
              {formData.selectedCourseIds.length} course(s) selected
            </p>
          </div>

          {/* Selected Courses Preview */}
          {selectedCourses.length > 0 && (
            <div className="border rounded-lg p-4 space-y-2 bg-orange-50 dark:bg-orange-950/20">
              <h3 className="font-medium text-orange-600 dark:text-orange-400 flex items-center gap-2">
                <Package className="h-5 w-5" />
                Bundle Contents ({selectedCourses.length} courses)
              </h3>
              <div className="space-y-2">
                {selectedCourses.map((course) => (
                  <div
                    key={course.id}
                    className="flex items-center justify-between text-sm bg-white dark:bg-neutral-900 p-2 rounded"
                  >
                    <span>{course.title}</span>
                    <span className="text-neutral-600 dark:text-neutral-400">
                      {course.currency} {course.offerPrice || course.regularPrice || 0}
                    </span>
                  </div>
                ))}
                <div className="border-t pt-2 flex items-center justify-between font-medium">
                  <span>Total Individual Price:</span>
                  <span>{formData.currency} {totalRegularPrice}</span>
                </div>
                <div className="text-xs text-neutral-600 dark:text-neutral-400">
                  Suggested bundle price (20% off): {formData.currency} {suggestedBundlePrice}
                </div>
              </div>
            </div>
          )}

          {/* Pricing */}
          <div className="grid md:grid-cols-3 gap-6">
            <div className="space-y-2">
              <Label>Currency</Label>
              <SearchableDropdown
                options={[
                  { value: 'BDT', label: '🇧🇩 BDT' },
                  { value: 'USD', label: '🇺🇸 USD' },
                  { value: 'EUR', label: '🇪🇺 EUR' },
                ]}
                value={formData.currency}
                onChange={(value) => setFormData({ ...formData, currency: value })}
                placeholder="Select currency"
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="regularPrice">Bundle Price *</Label>
              <Input
                id="regularPrice"
                type="number"
                placeholder={`Suggested: ${suggestedBundlePrice}`}
                value={formData.regularPrice || ''}
                onChange={(e) =>
                  setFormData({ ...formData, regularPrice: parseFloat(e.target.value) || 0 })
                }
                min={0}
              />
            </div>

            <div className="space-y-2">
              <Label htmlFor="offerPrice">Offer Price (Optional)</Label>
              <Input
                id="offerPrice"
                type="number"
                placeholder="Discounted price"
                value={formData.offerPrice || ''}
                onChange={(e) =>
                  setFormData({ ...formData, offerPrice: parseFloat(e.target.value) || 0 })
                }
                min={0}
              />
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  )
}

