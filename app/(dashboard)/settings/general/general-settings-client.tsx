'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { toast } from 'sonner'
import { updateGeneralSettings, uploadFile } from './actions'
import { COUNTRIES, CURRENCIES } from '@/lib/constants/countries'
import { Upload, Image as ImageIcon, FileSignature } from 'lucide-react'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'

const formSchema = z.object({
  instituteName: z.string().max(200, 'Institute name must be 200 characters or less').optional().nullable(),
  logoUrl: z.string().max(500, 'Logo URL must be 500 characters or less').optional().nullable(),
  signatureUrl: z.string().max(500, 'Signature URL must be 500 characters or less').optional().nullable(),
  currencyName: z.string().max(20, 'Currency name must be 20 characters or less').optional().nullable(),
  currencySymbol: z.string().max(10, 'Currency symbol must be 10 characters or less').optional().nullable(),
  countryCode: z.string().max(10, 'Country code must be 10 characters or less').optional().nullable(),
  phonePrefix: z.string().max(10, 'Phone prefix must be 10 characters or less').optional().nullable(),
})

type FormValues = z.infer<typeof formSchema>

interface GeneralSettingsClientProps {
  settings: {
    id: string
    tenantId: string
    instituteName: string | null
    logoUrl: string | null
    signatureUrl: string | null
    currencyName: string | null
    currencySymbol: string | null
    countryCode: string | null
    phonePrefix: string | null
  }
}

export function GeneralSettingsClient({ settings }: GeneralSettingsClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [logoPreview, setLogoPreview] = useState<string | null>(settings.logoUrl)
  const [signaturePreview, setSignaturePreview] = useState<string | null>(settings.signatureUrl)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      instituteName: settings.instituteName || '',
      logoUrl: settings.logoUrl || '',
      signatureUrl: settings.signatureUrl || '',
      currencyName: settings.currencyName || 'USD',
      currencySymbol: settings.currencySymbol || '$',
      countryCode: settings.countryCode || 'US',
      phonePrefix: settings.phonePrefix || '+1',
    },
  })

  const handleFileUpload = async (file: File, fieldName: 'logoUrl' | 'signatureUrl') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('fieldName', fieldName)

    const result = await uploadFile(formData)
    if (result.success && result.url) {
      form.setValue(fieldName, result.url)
      if (fieldName === 'logoUrl') {
        setLogoPreview(result.url)
      } else {
        setSignaturePreview(result.url)
      }
      toast.success('File uploaded successfully')
    } else {
      toast.error(result.error || 'Failed to upload file')
    }
  }

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      const result = await updateGeneralSettings(data)
      if (result.success) {
        toast.success('General settings updated successfully')
      } else {
        toast.error(result.error || 'Failed to update settings')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleCountryChange = (countryCode: string) => {
    const country = COUNTRIES.find((c) => c.code === countryCode)
    if (country) {
      form.setValue('countryCode', country.code)
      form.setValue('phonePrefix', country.phonePrefix)
    }
  }

  const handleCurrencyChange = (currencyCode: string) => {
    const currency = CURRENCIES.find((c) => c.code === currencyCode)
    if (currency) {
      form.setValue('currencyName', currency.code)
      form.setValue('currencySymbol', currency.symbol)
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>General Settings</CardTitle>
        <CardDescription>
          Configure your institution's basic information, branding, and regional settings
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Institute Name */}
            <FormField
              control={form.control}
              name="instituteName"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Institute Name</FormLabel>
                  <FormControl>
                    <Input
                      placeholder="Enter institute name"
                      maxLength={200}
                      {...field}
                      value={field.value || ''}
                    />
                  </FormControl>
                  <FormDescription>
                    The name of your educational institution (max 200 characters)
                  </FormDescription>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Logo Upload */}
            <div className="space-y-2">
              <Label>Institute Logo</Label>
              <div className="flex items-center gap-4">
                {logoPreview && (
                  <div className="w-24 h-24 border rounded-lg overflow-hidden bg-neutral-50">
                    <img src={logoPreview} alt="Logo" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'logoUrl')
                    }}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload your institute logo (PNG, JPG, SVG recommended)
                  </p>
                </div>
              </div>
            </div>

            {/* Signature Upload */}
            <div className="space-y-2">
              <Label>Authorized Signature</Label>
              <div className="flex items-center gap-4">
                {signaturePreview && (
                  <div className="w-24 h-24 border rounded-lg overflow-hidden bg-neutral-50">
                    <img src={signaturePreview} alt="Signature" className="w-full h-full object-contain" />
                  </div>
                )}
                <div className="flex-1">
                  <Input
                    type="file"
                    accept="image/*"
                    onChange={(e) => {
                      const file = e.target.files?.[0]
                      if (file) handleFileUpload(file, 'signatureUrl')
                    }}
                    className="cursor-pointer"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Upload authorized signature for certificates and documents
                  </p>
                </div>
              </div>
            </div>

            {/* Currency Selection */}
            <div className="space-y-2">
              <Label>Currency</Label>
              <SearchableDropdown
                options={CURRENCIES.map((currency) => ({
                  value: currency.code,
                  label: `${currency.symbol} ${currency.name} (${currency.code})`,
                }))}
                value={form.watch('currencyName') || 'USD'}
                onChange={handleCurrencyChange}
                placeholder="Select currency"
              />
              <p className="text-xs text-muted-foreground">
                Selected: {form.watch('currencySymbol')} {form.watch('currencyName')}
              </p>
            </div>

            {/* Country Selection */}
            <div className="space-y-2">
              <Label>Country</Label>
              <SearchableDropdown
                options={COUNTRIES.map((country) => ({
                  value: country.code,
                  label: `${country.flag} ${country.name} (${country.phonePrefix})`,
                }))}
                value={form.watch('countryCode') || 'US'}
                onChange={handleCountryChange}
                placeholder="Select country"
              />
              <p className="text-xs text-muted-foreground">
                Phone prefix: {form.watch('phonePrefix')} (will be used in admission forms)
              </p>
            </div>

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white font-medium"
              >
                {isSubmitting ? 'Saving...' : 'Save General Settings'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

