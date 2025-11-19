'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Button } from '@/components/ui/button'
import { ArrowLeft, Save } from 'lucide-react'
import Link from 'next/link'
import { toast } from 'sonner'
import BasicInfoTab from './tabs/basic-info-tab'
import PricingTab from './tabs/pricing-tab'
import MediaTab from './tabs/media-tab'
import SeoTab from './tabs/seo-tab'
import SettingsTab from './tabs/settings-tab'
import FaqTab from './tabs/faq-tab'
import { createSingleCourse } from './actions'

type Category = {
  id: string
  name: string
  slug: string
  icon: string | null
  color: string | null
}

type Subject = {
  id: string
  name: string
  code: string | null
  icon: string | null
}

type Class = {
  id: string
  name: string
  alias: string | null
  order: number
}

type Stream = {
  id: string
  name: string
}

type Props = {
  categories: Category[]
  subjects: Subject[]
  classes: Class[]
  streams: Stream[]
}

export type CourseFormData = {
  // Basic Info
  title: string
  slug: string
  categoryId?: string
  description?: string
  shortDescription?: string

  // Academic Integration (Optional)
  classId?: string
  subjectId?: string
  streamId?: string

  // Pricing
  paymentType: 'FREE' | 'ONE_TIME' | 'SUBSCRIPTION'
  invoiceTitle?: string
  regularPrice?: number
  offerPrice?: number
  currency: string
  subscriptionDuration?: number
  subscriptionType?: 'MONTHLY' | 'QUARTERLY' | 'YEARLY' | 'CUSTOM'
  autoGenerateInvoice: boolean
  
  // Media
  featuredImage?: string
  introVideoUrl?: string
  introVideoAutoplay: boolean

  // SEO
  metaTitle?: string
  metaDescription?: string
  metaKeywords?: string
  fakeEnrollmentCount?: number

  // Settings
  status: 'DRAFT' | 'PUBLISHED' | 'SCHEDULED' | 'PRIVATE'
  publishedAt?: Date
  scheduledAt?: Date
  isFeatured: boolean
  allowComments: boolean
  certificateEnabled: boolean
  
  // FAQ
  faqs: Array<{ id?: string; clientId?: string; question: string; answer: string }>
}

export default function SingleCourseForm({ categories, subjects, classes, streams }: Props) {
  const router = useRouter()
  const [activeTab, setActiveTab] = useState('basic')
  const [saving, setSaving] = useState(false)
  
  const [formData, setFormData] = useState<CourseFormData>({
    title: '',
    slug: '',
    paymentType: 'FREE',
    currency: 'BDT',
    autoGenerateInvoice: true,
    status: 'DRAFT',
    isFeatured: false,
    allowComments: true,
    certificateEnabled: false,
    introVideoAutoplay: false,
    faqs: [],
  })

  const updateFormData = (data: Partial<CourseFormData>) => {
    setFormData((prev) => ({ ...prev, ...data }))
  }

  const handleSave = async (status: 'DRAFT' | 'PUBLISHED') => {
    setSaving(true)
    
    const result = await createSingleCourse({
      ...formData,
      status,
    })

    if (result.success) {
      toast.success(`Course ${status === 'DRAFT' ? 'saved as draft' : 'published'} successfully! 🎉`)
      router.push('/course-management/courses')
    } else {
      toast.error(result.error || 'Failed to create course')
    }
    
    setSaving(false)
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <Link href="/course-management/courses/new">
          <Button variant="ghost" size="sm" className="mb-4">
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back
          </Button>
        </Link>

        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold text-neutral-900 dark:text-neutral-100">
              Create Single Course
            </h1>
            <p className="text-neutral-600 dark:text-neutral-400 mt-1">
              Fill in the course details across different tabs
            </p>
          </div>

          <div className="flex gap-2">
            <Button
              variant="outline"
              onClick={() => handleSave('DRAFT')}
              disabled={saving || !formData.title || !formData.slug}
            >
              <Save className="h-4 w-4 mr-2" />
              Save as Draft
            </Button>
            <Button
              onClick={() => handleSave('PUBLISHED')}
              disabled={saving || !formData.title || !formData.slug}
            >
              <Save className="h-4 w-4 mr-2" />
              Publish Course
            </Button>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <Card>
        <CardContent className="pt-6">
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-6">
              <TabsTrigger value="basic">Basic Info</TabsTrigger>
              <TabsTrigger value="pricing">Pricing</TabsTrigger>
              <TabsTrigger value="media">Media</TabsTrigger>
              <TabsTrigger value="seo">SEO</TabsTrigger>
              <TabsTrigger value="settings">Settings</TabsTrigger>
              <TabsTrigger value="faq">FAQ</TabsTrigger>
            </TabsList>

            <TabsContent value="basic" className="mt-6">
              <BasicInfoTab
                data={formData}
                categories={categories}
                subjects={subjects}
                classes={classes}
                streams={streams}
                onChange={updateFormData}
              />
            </TabsContent>

            <TabsContent value="pricing" className="mt-6">
              <PricingTab data={formData} onChange={updateFormData} />
            </TabsContent>

            <TabsContent value="media" className="mt-6">
              <MediaTab data={formData} onChange={updateFormData} />
            </TabsContent>

            <TabsContent value="seo" className="mt-6">
              <SeoTab data={formData} onChange={updateFormData} />
            </TabsContent>

            <TabsContent value="settings" className="mt-6">
              <SettingsTab data={formData} onChange={updateFormData} />
            </TabsContent>

            <TabsContent value="faq" className="mt-6">
              <FaqTab data={formData} onChange={updateFormData} />
            </TabsContent>
          </Tabs>
        </CardContent>
      </Card>

      {/* Navigation Buttons */}
      <div className="flex justify-between">
        <Button
          variant="outline"
          onClick={() => {
            const tabs = ['basic', 'pricing', 'media', 'seo', 'settings', 'faq']
            const currentIndex = tabs.indexOf(activeTab)
            if (currentIndex > 0) {
              setActiveTab(tabs[currentIndex - 1])
            }
          }}
          disabled={activeTab === 'basic'}
        >
          Previous
        </Button>
        
        <Button
          onClick={() => {
            const tabs = ['basic', 'pricing', 'media', 'seo', 'settings', 'faq']
            const currentIndex = tabs.indexOf(activeTab)
            if (currentIndex < tabs.length - 1) {
              setActiveTab(tabs[currentIndex + 1])
            }
          }}
          disabled={activeTab === 'faq'}
        >
          Next
        </Button>
      </div>
    </div>
  )
}

