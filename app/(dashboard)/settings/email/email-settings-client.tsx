'use client'

import { useState } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs'
import { Switch } from '@/components/ui/switch'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { updateEmailCarrier, updateEmailTemplates, testEmailConnection, sendTestEmail } from './actions'
import { Mail, Send, FileText } from 'lucide-react'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'

const carrierFormSchema = z.object({
  emailEnabled: z.boolean(),
  smtpHost: z.string().max(200).optional().nullable(),
  smtpPort: z.number().min(1).max(65535).optional().nullable(),
  smtpUser: z.string().max(200).optional().nullable(),
  smtpPassword: z.string().max(200).optional().nullable(),
  smtpFromEmail: z.string().email().max(200).optional().nullable(),
  smtpFromName: z.string().max(200).optional().nullable(),
  smtpEncryption: z.enum(['tls', 'ssl', 'none']).optional().nullable(),
})

type CarrierFormValues = z.infer<typeof carrierFormSchema>

interface EmailSettingsClientProps {
  settings: {
    id: string
    tenantId: string
    emailEnabled: boolean
    smtpHost: string | null
    smtpPort: number | null
    smtpUser: string | null
    smtpPassword: string | null
    smtpFromEmail: string | null
    smtpFromName: string | null
    smtpEncryption: string | null
    emailTemplates: string | null
  }
}

export function EmailSettingsClient({ settings }: EmailSettingsClientProps) {
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isTesting, setIsTesting] = useState(false)
  const [activeTab, setActiveTab] = useState('carrier')
  const [testEmailDialog, setTestEmailDialog] = useState<{ open: boolean; templateId: string }>({ open: false, templateId: '' })
  const [testEmailAddress, setTestEmailAddress] = useState('')
  const [sendingTestEmail, setSendingTestEmail] = useState(false)

  const carrierForm = useForm<CarrierFormValues>({
    resolver: zodResolver(carrierFormSchema),
    defaultValues: {
      emailEnabled: settings.emailEnabled || false,
      smtpHost: settings.smtpHost || '',
      smtpPort: settings.smtpPort || 587,
      smtpUser: settings.smtpUser || '',
      smtpPassword: settings.smtpPassword || '',
      smtpFromEmail: settings.smtpFromEmail || '',
      smtpFromName: settings.smtpFromName || '',
      smtpEncryption: (settings.smtpEncryption as 'tls' | 'ssl' | 'none') || 'tls',
    },
  })

  const onCarrierSubmit = async (data: CarrierFormValues) => {
    setIsSubmitting(true)
    try {
      const result = await updateEmailCarrier(data)
      if (result.success) {
        toast.success('Email carrier settings updated successfully')
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
    try {
      const data = carrierForm.getValues()
      const result = await testEmailConnection(data)
      if (result.success) {
        toast.success(result.message || 'Connection test successful')
      } else {
        toast.error(result.error || 'Connection test failed')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsTesting(false)
    }
  }

  // Parse email templates
  let parsedTemplates: any = {}
  try {
    parsedTemplates = settings.emailTemplates ? JSON.parse(settings.emailTemplates) : {}
  } catch (e) {
    parsedTemplates = {}
  }

  // Template state (each template has subject, body, enabled)
  const [templates, setTemplates] = useState<Record<string, { subject: string; body: string; enabled: boolean }>>(
    parsedTemplates
  )

  const emailTemplatesList = [
    { id: 'admission', name: 'Student Admission Email', description: 'Sent when a student is admitted' },
    { id: 'invoice', name: 'Invoice Generated Email', description: 'Sent when an invoice is generated' },
    { id: 'feeSubmissionOnline', name: 'Online Fee Submission Email', description: 'Sent after online fee payment' },
    { id: 'feeSubmissionOffline', name: 'Offline Fee Submission Email', description: 'Sent after offline fee payment' },
    { id: 'studentAbsent', name: 'Student Absent Email', description: 'Sent to parents when student is absent' },
    { id: 'inquiryReceived', name: 'Inquiry Received Notification', description: 'Sent to admin when inquiry is received' },
    { id: 'studentRegistration', name: 'Student Registration Email', description: 'Sent when student registers' },
    { id: 'invoiceDueDate', name: 'Invoice Due Date Notification', description: 'Sent before invoice due date' },
  ]

  const templateVariables = [
    { name: '[STUDENT_NAME]', description: 'Student full name' },
    { name: '[CLASS]', description: 'Class name' },
    { name: '[SECTION]', description: 'Section name' },
    { name: '[ROLL_NUMBER]', description: 'Student roll number' },
    { name: '[ENROLLMENT_NUMBER]', description: 'Enrollment number' },
    { name: '[ADMISSION_NUMBER]', description: 'Admission number' },
    { name: '[LOGIN_USERNAME]', description: 'Login username' },
    { name: '[LOGIN_EMAIL]', description: 'Login email' },
    { name: '[LOGIN_PASSWORD]', description: 'Login password' },
    { name: '[SCHOOL_NAME]', description: 'School/Institute name' },
  ]

  const updateTemplate = (templateId: string, field: 'subject' | 'body' | 'enabled', value: string | boolean) => {
    setTemplates((prev) => ({
      ...prev,
      [templateId]: {
        ...prev[templateId],
        [field]: value,
      },
    }))
  }

  const saveTemplate = async (templateId: string) => {
    setIsSubmitting(true)
    try {
      const result = await updateEmailTemplates(templates)
      if (result.success) {
        toast.success('Template saved successfully')
      } else {
        toast.error(result.error || 'Failed to save template')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setIsSubmitting(false)
    }
  }

  const handleSendTestEmail = async () => {
    if (!testEmailAddress) {
      toast.error('Please enter an email address')
      return
    }

    setSendingTestEmail(true)
    try {
      const template = templates[testEmailDialog.templateId]
      const result = await sendTestEmail(testEmailDialog.templateId, testEmailAddress, template?.subject || '', template?.body || '')
      if (result.success) {
        toast.success('Test email sent successfully')
        setTestEmailDialog({ open: false, templateId: '' })
        setTestEmailAddress('')
      } else {
        toast.error(result.error || 'Failed to send test email')
      }
    } catch (error) {
      toast.error('An unexpected error occurred')
    } finally {
      setSendingTestEmail(false)
    }
  }

  return (
    <>
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2">
          <TabsTrigger value="carrier">
            <Mail className="h-4 w-4 mr-2" />
            Email Carrier
          </TabsTrigger>
          <TabsTrigger value="templates">
            <FileText className="h-4 w-4 mr-2" />
            Email Templates
          </TabsTrigger>
        </TabsList>

      {/* Email Carrier Tab */}
      <TabsContent value="carrier">
        <Card>
          <CardHeader>
            <CardTitle>Email Carrier (SMTP) Settings</CardTitle>
            <CardDescription>
              Configure SMTP settings to send automated emails for admissions, invoices, and notifications
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Form {...carrierForm}>
              <form onSubmit={carrierForm.handleSubmit(onCarrierSubmit)} className="space-y-6">
                {/* Enable Email */}
                <FormField
                  control={carrierForm.control}
                  name="emailEnabled"
                  render={({ field }) => (
                    <FormItem className="flex items-center justify-between rounded-lg border p-4">
                      <div className="space-y-0.5">
                        <FormLabel className="text-base">Enable Email Notifications</FormLabel>
                        <FormDescription>
                          Turn on to send automated emails to students and parents
                        </FormDescription>
                      </div>
                      <FormControl>
                        <Switch checked={field.value} onCheckedChange={field.onChange} />
                      </FormControl>
                    </FormItem>
                  )}
                />

                {/* SMTP Host */}
                <FormField
                  control={carrierForm.control}
                  name="smtpHost"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Host *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="smtp.gmail.com"
                          maxLength={200}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        SMTP server hostname (e.g., smtp.gmail.com, smtp.office365.com)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SMTP Port */}
                <FormField
                  control={carrierForm.control}
                  name="smtpPort"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Port *</FormLabel>
                      <FormControl>
                        <Input
                          type="number"
                          placeholder="587"
                          {...field}
                          value={field.value || ''}
                          onChange={(e) => field.onChange(parseInt(e.target.value) || null)}
                        />
                      </FormControl>
                      <FormDescription>
                        Common ports: 587 (TLS), 465 (SSL), 25 (None)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SMTP Encryption */}
                <FormField
                  control={carrierForm.control}
                  name="smtpEncryption"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Encryption *</FormLabel>
                      <FormControl>
                        <SearchableDropdown
                          options={[
                            { value: 'tls', label: 'TLS (Recommended)' },
                            { value: 'ssl', label: 'SSL' },
                            { value: 'none', label: 'None (Not Recommended)' },
                          ]}
                          value={field.value || 'tls'}
                          onChange={field.onChange}
                          placeholder="Select encryption"
                        />
                      </FormControl>
                      <FormDescription>
                        TLS is recommended for most modern email providers
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SMTP User */}
                <FormField
                  control={carrierForm.control}
                  name="smtpUser"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Username *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="your-email@example.com"
                          maxLength={200}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Usually your email address
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* SMTP Password */}
                <FormField
                  control={carrierForm.control}
                  name="smtpPassword"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>SMTP Password *</FormLabel>
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
                        Your email password or app-specific password
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* From Email */}
                <FormField
                  control={carrierForm.control}
                  name="smtpFromEmail"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Email *</FormLabel>
                      <FormControl>
                        <Input
                          type="email"
                          placeholder="noreply@yourschool.com"
                          maxLength={200}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Email address that will appear as sender
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* From Name */}
                <FormField
                  control={carrierForm.control}
                  name="smtpFromName"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>From Name</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="Your School Name"
                          maxLength={200}
                          {...field}
                          value={field.value || ''}
                        />
                      </FormControl>
                      <FormDescription>
                        Name that will appear as sender
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={handleTestConnection}
                    disabled={isTesting}
                  >
                    <Send className="h-4 w-4 mr-2" />
                    {isTesting ? 'Testing...' : 'Test Connection'}
                  </Button>
                  <Button
                    type="submit"
                    disabled={isSubmitting}
                    className="flex-1 bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-700 hover:to-teal-700 text-white font-medium"
                  >
                    {isSubmitting ? 'Saving...' : 'Save Email Carrier Settings'}
                  </Button>
                </div>
              </form>
            </Form>
          </CardContent>
        </Card>
      </TabsContent>

      {/* Email Templates Tab */}
      <TabsContent value="templates">
        <Card>
          <CardHeader>
            <CardTitle>Email Templates</CardTitle>
            <CardDescription>
              Customize email templates for automated notifications. Use variables to personalize emails.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Available Variables */}
            <div className="rounded-lg border border-blue-200 bg-blue-50 p-4">
              <h4 className="font-medium text-blue-900 mb-2">Available Variables</h4>
              <div className="grid grid-cols-2 gap-2 text-sm">
                {templateVariables.map((variable) => (
                  <div key={variable.name} className="flex items-start gap-2">
                    <code className="bg-blue-100 text-blue-800 px-2 py-0.5 rounded text-xs font-mono">
                      {variable.name}
                    </code>
                    <span className="text-blue-700 text-xs">{variable.description}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Template List */}
            <div className="space-y-4">
              {emailTemplatesList.map((template) => {
                const templateData = templates[template.id] || { subject: '', body: '', enabled: false }
                return (
                  <div key={template.id} className="rounded-lg border p-4 space-y-3">
                    <div className="flex items-start justify-between">
                      <div>
                        <h4 className="font-medium text-neutral-900 dark:text-neutral-100">{template.name}</h4>
                        <p className="text-sm text-neutral-600 dark:text-neutral-400">{template.description}</p>
                      </div>
                      <div className="flex items-center gap-2">
                        <Label htmlFor={`enable-${template.id}`} className="text-sm">
                          {templateData.enabled ? 'Enabled' : 'Disabled'}
                        </Label>
                        <Switch
                          id={`enable-${template.id}`}
                          checked={templateData.enabled}
                          onCheckedChange={(checked) => updateTemplate(template.id, 'enabled', checked)}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Email Subject</Label>
                      <Input
                        placeholder="Enter email subject"
                        value={templateData.subject}
                        onChange={(e) => updateTemplate(template.id, 'subject', e.target.value)}
                        maxLength={200}
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Email Body</Label>
                      <Textarea
                        placeholder="Enter email body (use variables like [STUDENT_NAME], [CLASS], etc.)"
                        rows={4}
                        value={templateData.body}
                        onChange={(e) => updateTemplate(template.id, 'body', e.target.value)}
                        maxLength={2000}
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setTestEmailDialog({ open: true, templateId: template.id })}
                      >
                        <Send className="h-3 w-3 mr-1" />
                        Send Test
                      </Button>
                      <Button
                        size="sm"
                        className="bg-emerald-600 hover:bg-emerald-700 text-white"
                        onClick={() => saveTemplate(template.id)}
                        disabled={isSubmitting}
                      >
                        {isSubmitting ? 'Saving...' : 'Save Template'}
                      </Button>
                    </div>
                  </div>
                )
              })}
            </div>
          </CardContent>
        </Card>
      </TabsContent>
      </Tabs>

      {/* Test Email Dialog */}
      <Dialog open={testEmailDialog.open} onOpenChange={(open) => setTestEmailDialog({ open, templateId: testEmailDialog.templateId })}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Send Test Email</DialogTitle>
            <DialogDescription>
              Enter an email address to send a test email with sample data
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="test-email">Email Address</Label>
              <Input
                id="test-email"
                type="email"
                placeholder="test@example.com"
                value={testEmailAddress}
                onChange={(e) => setTestEmailAddress(e.target.value)}
                maxLength={200}
              />
            </div>
          </div>
          <DialogFooter>
            <Button
              variant="outline"
              onClick={() => {
                setTestEmailDialog({ open: false, templateId: '' })
                setTestEmailAddress('')
              }}
            >
              Cancel
            </Button>
            <Button
              onClick={handleSendTestEmail}
              disabled={sendingTestEmail || !testEmailAddress}
              className="bg-blue-600 hover:bg-blue-700 text-white"
            >
              {sendingTestEmail ? 'Sending...' : 'Send Test Email'}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  )
}

