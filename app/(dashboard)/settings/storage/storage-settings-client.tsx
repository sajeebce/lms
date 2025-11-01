'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group'
import { Label } from '@/components/ui/label'
import { toast } from 'sonner'
import { updateStorageSettings, testStorageConnection } from './actions'
import { HardDrive, Cloud, Send, CheckCircle2 } from 'lucide-react'
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
  storageType: z.enum(['LOCAL', 'R2']),
  storageLocalPath: z.string().optional(),
  storageR2AccountId: z.string().optional(),
  storageR2AccessKeyId: z.string().optional(),
  storageR2SecretAccessKey: z.string().optional(),
  storageR2Bucket: z.string().optional(),
  storageR2PublicUrl: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

interface StorageSettingsClientProps {
  settings: {
    id: string
    tenantId: string
    storageType: string | null
    storageLocalPath: string | null
    storageR2AccountId: string | null
    storageR2AccessKeyId: string | null
    storageR2SecretAccessKey: string | null
    storageR2Bucket: string | null
    storageR2PublicUrl: string | null
  }
}

export function StorageSettingsClient({ settings }: StorageSettingsClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [testResult, setTestResult] = useState<{ success: boolean; error?: string } | null>(null)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      storageType: (settings.storageType as 'LOCAL' | 'R2') || 'LOCAL',
      storageLocalPath: settings.storageLocalPath || './storage',
      storageR2AccountId: settings.storageR2AccountId || '',
      storageR2AccessKeyId: settings.storageR2AccessKeyId || '',
      storageR2SecretAccessKey: settings.storageR2SecretAccessKey || '',
      storageR2Bucket: settings.storageR2Bucket || '',
      storageR2PublicUrl: settings.storageR2PublicUrl || '',
    },
  })

  const onSubmit = async (data: FormValues) => {
    setIsSubmitting(true)
    try {
      const result = await updateStorageSettings(data)
      if (result.success) {
        toast.success('Storage settings updated successfully')
      } else {
        toast.error(result.error || 'Failed to update settings')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleTestConnection = async () => {
    setIsTesting(true)
    setTestResult(null)
    try {
      const data = form.getValues()
      const result = await testStorageConnection(data.storageType, data)
      setTestResult(result)
      if (result.success) {
        toast.success('✅ Connection test successful!')
      } else {
        toast.error(result.error || 'Connection test failed')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
      setTestResult({ success: false, error: 'An unexpected error occurred' })
    } finally {
      setIsTesting(false)
    }
  }

  const storageType = form.watch('storageType')

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Provider</CardTitle>
        <CardDescription>
          Choose where to store uploaded files (logos, signatures, student documents, etc.)
        </CardDescription>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Storage Provider Selection */}
            <FormField
              control={form.control}
              name="storageType"
              render={({ field }) => (
                <FormItem className="space-y-3">
                  <FormLabel>Select Storage Provider</FormLabel>
                  <FormControl>
                    <RadioGroup
                      onValueChange={field.onChange}
                      value={field.value}
                      className="grid grid-cols-1 md:grid-cols-2 gap-4"
                    >
                      {/* Local Storage */}
                      <div className="relative">
                        <RadioGroupItem value="LOCAL" id="LOCAL" className="peer sr-only" />
                        <Label
                          htmlFor="LOCAL"
                          className="flex flex-col items-center justify-between rounded-lg border-2 border-neutral-200 bg-white p-6 hover:bg-neutral-50 peer-data-[state=checked]:border-emerald-600 peer-data-[state=checked]:bg-emerald-50 cursor-pointer transition-all"
                        >
                          <div className="relative">
                            <HardDrive className="h-12 w-12 mb-3 text-neutral-600 peer-data-[state=checked]:text-emerald-600" />
                            {storageType === 'LOCAL' && (
                              <CheckCircle2 className="absolute -top-1 -right-1 h-6 w-6 text-emerald-600 fill-emerald-100" />
                            )}
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-neutral-900">Local Storage</div>
                            <div className="text-sm text-neutral-600 mt-1">
                              Store files on your server
                            </div>
                          </div>
                        </Label>
                      </div>

                      {/* Cloudflare R2 */}
                      <div className="relative">
                        <RadioGroupItem value="R2" id="R2" className="peer sr-only" />
                        <Label
                          htmlFor="R2"
                          className="flex flex-col items-center justify-between rounded-lg border-2 border-neutral-200 bg-white p-6 hover:bg-neutral-50 peer-data-[state=checked]:border-emerald-600 peer-data-[state=checked]:bg-emerald-50 cursor-pointer transition-all"
                        >
                          <div className="relative">
                            <Cloud className="h-12 w-12 mb-3 text-neutral-600 peer-data-[state=checked]:text-emerald-600" />
                            {storageType === 'R2' && (
                              <CheckCircle2 className="absolute -top-1 -right-1 h-6 w-6 text-emerald-600 fill-emerald-100" />
                            )}
                          </div>
                          <div className="text-center">
                            <div className="font-semibold text-neutral-900">Cloudflare R2</div>
                            <div className="text-sm text-neutral-600 mt-1">
                              Cloud storage with CDN
                            </div>
                          </div>
                        </Label>
                      </div>
                    </RadioGroup>
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            {/* Local Storage Configuration */}
            {storageType === 'LOCAL' && (
              <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-6">
                <h3 className="font-semibold text-emerald-900 mb-4">Local Storage Configuration</h3>

                <FormField
                  control={form.control}
                  name="storageLocalPath"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Storage Path</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="./storage"
                          maxLength={200}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Local directory path for file storage (relative to project root)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>
            )}

            {/* R2 Configuration (shown only when R2 is selected) */}
            {storageType === 'R2' && (
              <div className="space-y-4 rounded-lg border border-emerald-200 bg-emerald-50/50 p-6">
                <h3 className="font-semibold text-emerald-900 mb-4">Cloudflare R2 Configuration</h3>

                {/* R2 Account ID */}
                <FormField
                  control={form.control}
                  name="storageR2AccountId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Account ID *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your Cloudflare Account ID"
                          maxLength={200}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Found in Cloudflare dashboard
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* R2 Access Key ID */}
                <FormField
                  control={form.control}
                  name="storageR2AccessKeyId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Access Key ID *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="R2 Access Key ID"
                          maxLength={200}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        R2 API token access key
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* R2 Secret Key */}
                <FormField
                  control={form.control}
                  name="storageR2SecretAccessKey"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Secret Access Key *</FormLabel>
                      <FormControl>
                        <Input
                          type="password"
                          placeholder="••••••••"
                          maxLength={200}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        R2 API token secret key
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* R2 Bucket Name */}
                <FormField
                  control={form.control}
                  name="storageR2Bucket"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Bucket Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="my-lms-bucket"
                          maxLength={200}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Name of your R2 bucket
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* R2 Public URL */}
                <FormField
                  control={form.control}
                  name="storageR2PublicUrl"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Public URL (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="https://your-bucket.r2.dev"
                          maxLength={500}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Custom domain or R2.dev URL for public access
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Test Connection Button */}
                <div className="space-y-2">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                    className="w-full"
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isTesting ? 'Testing Connection...' : 'Test R2 Connection'}
                  </Button>

                  {/* Test Result */}
                  {testResult && (
                    <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                      testResult.success
                        ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                        : 'bg-red-50 text-red-700 border border-red-200'
                    }`}>
                      {testResult.success ? (
                        <>
                          <CheckCircle2 className="h-4 w-4" />
                          <span>✅ Connection successful!</span>
                        </>
                      ) : (
                        <>
                          <span className="font-medium">❌ Connection failed:</span>
                          <span>{testResult.error}</span>
                        </>
                      )}
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Test Connection for Local Storage */}
            {storageType === 'LOCAL' && (
              <div className="space-y-2">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTestConnection}
                  disabled={isTesting}
                  className="w-full"
                >
                  <Send className="h-4 w-4 mr-2" />
                  {isTesting ? 'Testing...' : 'Test Local Storage'}
                </Button>

                {/* Test Result */}
                {testResult && (
                  <div className={`flex items-center gap-2 p-3 rounded-lg text-sm ${
                    testResult.success
                      ? 'bg-emerald-50 text-emerald-700 border border-emerald-200'
                      : 'bg-red-50 text-red-700 border border-red-200'
                  }`}>
                    {testResult.success ? (
                      <>
                        <CheckCircle2 className="h-4 w-4" />
                        <span>✅ Local storage is working!</span>
                      </>
                    ) : (
                      <>
                        <span className="font-medium">❌ Test failed:</span>
                        <span>{testResult.error}</span>
                      </>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* Submit Button */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={isSubmitting}
                className="w-full sm:w-auto bg-gradient-to-r from-emerald-600 to-cyan-600 hover:from-emerald-700 hover:to-cyan-700 text-white font-medium"
              >
                {isSubmitting ? 'Saving...' : 'Save Storage Settings'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  )
}

