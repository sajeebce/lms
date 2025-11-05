'use client'

import { UseFormReturn } from 'react-hook-form'
import { FormField, FormItem, FormLabel, FormControl, FormMessage, FormDescription } from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { Camera, Upload, AlertTriangle, RefreshCw, Eye, EyeOff, Loader2 } from 'lucide-react'
import { useState, useRef, useEffect } from 'react'
import { Button } from '@/components/ui/button'
import { Alert, AlertDescription } from '@/components/ui/alert'
import { checkDuplicateContact, generateUsername, uploadStudentPhotoTemp } from '../new-actions'
import { toast } from 'sonner'

export function StudentIdentityStep({
  form,
  phonePrefix = '+1',
  mode = 'create'
}: {
  form: UseFormReturn<any>
  phonePrefix?: string
  mode?: 'create' | 'edit'
}) {
  const [photoPreview, setPhotoPreview] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [duplicateWarning, setDuplicateWarning] = useState<any>(null)
  const [checkingDuplicate, setCheckingDuplicate] = useState(false)
  const [showPassword, setShowPassword] = useState(false)
  const [generatingUsername, setGeneratingUsername] = useState(false)
  const [uploadingPhoto, setUploadingPhoto] = useState(false)

  // Initialize photo preview from existing photoUrl in edit mode
  useEffect(() => {
    const existingPhotoUrl = form.getValues('photoUrl')
    if (existingPhotoUrl && existingPhotoUrl !== '') {
      setPhotoPreview(existingPhotoUrl)
    }
  }, [form])

  // Watch for photoUrl changes to update preview
  useEffect(() => {
    const subscription = form.watch((value, { name }) => {
      if (name === 'photoUrl' && value.photoUrl && value.photoUrl !== photoPreview) {
        setPhotoPreview(value.photoUrl)
      }
    })
    return () => subscription.unsubscribe()
  }, [form, photoPreview])

  const handlePhotoChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      toast.error('Invalid file type. Only JPG, PNG, and WebP are allowed.')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      toast.error('File size must be less than 5MB')
      return
    }

    try {
      setUploadingPhoto(true)

      // Create FormData
      const formData = new FormData()
      formData.append('photo', file)

      // Upload to temp storage
      const result = await uploadStudentPhotoTemp(formData)

      if (result.success && result.url) {
        // Set preview (use temp URL)
        setPhotoPreview(result.url)
        // Set form value (temp URL will be converted to permanent after student creation)
        form.setValue('photoUrl', result.url)
        toast.success('Photo uploaded successfully')
      } else {
        toast.error(result.error || 'Failed to upload photo')
      }
    } catch (error) {
      console.error('Photo upload error:', error)
      toast.error('Failed to upload photo')
    } finally {
      setUploadingPhoto(false)
    }
  }

  const handleRemovePhoto = () => {
    setPhotoPreview('')
    form.setValue('photoUrl', '')
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
    toast.success('Photo removed')
  }

  const checkDuplicate = async () => {
    const phone = form.getValues('phone')
    const email = form.getValues('email')
    const username = form.getValues('username')

    if (!phone && !email && !username) {
      setDuplicateWarning(null)
      return
    }

    setCheckingDuplicate(true)
    const result = await checkDuplicateContact(phone, email, username)
    setCheckingDuplicate(false)

    if (result.exists && result.student) {
      setDuplicateWarning({ ...result.student, matchedFields: result.matchedFields })
    } else {
      setDuplicateWarning(null)
    }
  }

  const handleGenerateUsername = async () => {
    const name = form.getValues('name')
    if (!name) {
      return
    }

    setGeneratingUsername(true)
    const result = await generateUsername(name)
    setGeneratingUsername(false)

    if (result.success && result.username) {
      form.setValue('username', result.username)
    }
  }

  // Auto-generate username when name changes
  useEffect(() => {
    const subscription = form.watch((value, { name: fieldName }) => {
      if (fieldName === 'name' && value.name && !form.getValues('username')) {
        handleGenerateUsername()
      }
    })
    return () => subscription.unsubscribe()
  }, [form])

  // Get duplicate message based on matched fields
  const getDuplicateMessage = () => {
    if (!duplicateWarning || !duplicateWarning.matchedFields) return ''

    const fields = duplicateWarning.matchedFields
    const fieldNames: string[] = []

    if (fields.includes('phone')) fieldNames.push('phone number')
    if (fields.includes('email')) fieldNames.push('email')
    if (fields.includes('username')) fieldNames.push('username')

    if (fieldNames.length === 0) return ''
    if (fieldNames.length === 1) return fieldNames[0]
    if (fieldNames.length === 2) return `${fieldNames[0]} and ${fieldNames[1]}`
    return `${fieldNames[0]}, ${fieldNames[1]}, and ${fieldNames[2]}`
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-3 pb-4 border-b">
        <div className="p-2 bg-blue-100 dark:bg-blue-900/30 rounded-lg">
          <Camera className="h-5 w-5 text-blue-600 dark:text-blue-400" />
        </div>
        <div>
          <h3 className="text-lg font-semibold">Student Identity</h3>
          <p className="text-sm text-muted-foreground">Basic information about the student</p>
        </div>
      </div>

      {/* Photo Upload */}
      <div className="flex justify-center">
        <div className="flex flex-col items-center">
          <div className="relative">
            <div className="w-32 h-32 rounded-full border-4 border-dashed border-blue-300 dark:border-blue-700 flex items-center justify-center overflow-hidden bg-blue-50 dark:bg-blue-950/30">
              {uploadingPhoto ? (
                <Loader2 className="w-12 h-12 text-blue-400 animate-spin" />
              ) : photoPreview ? (
                <img src={photoPreview} alt="Student" className="w-full h-full object-cover" />
              ) : (
                <Camera className="w-12 h-12 text-blue-400" />
              )}
            </div>
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              disabled={uploadingPhoto}
              className="absolute bottom-0 right-0 bg-blue-600 text-white p-2 rounded-full hover:bg-blue-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {uploadingPhoto ? (
                <Loader2 className="w-4 h-4 animate-spin" />
              ) : (
                <Upload className="w-4 h-4" />
              )}
            </button>
            {photoPreview && (
              <button
                type="button"
                onClick={handleRemovePhoto}
                disabled={uploadingPhoto}
                className="absolute bottom-0 left-0 bg-red-600 text-white p-2 rounded-full hover:bg-red-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                title="Remove photo"
              >
                <svg xmlns="http://www.w3.org/2000/svg" className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                  <line x1="18" y1="6" x2="6" y2="18"></line>
                  <line x1="6" y1="6" x2="18" y2="18"></line>
                </svg>
              </button>
            )}
            <input
              ref={fileInputRef}
              type="file"
              accept="image/jpeg,image/jpg,image/png,image/webp"
              onChange={handlePhotoChange}
              className="hidden"
              disabled={uploadingPhoto}
            />
          </div>
          <p className="mt-2 text-sm text-muted-foreground">
            {uploadingPhoto ? 'Uploading...' : photoPreview ? 'Click upload to change • Click X to remove' : 'Max 5MB • JPG/PNG/WebP'}
          </p>
        </div>
      </div>

      {/* Duplicate Warning */}
      {duplicateWarning && (
        <Alert variant="destructive" className="border-amber-500 bg-amber-50 dark:bg-amber-950/20">
          <AlertTriangle className="h-4 w-4 text-amber-600" />
          <AlertDescription className="text-amber-800 dark:text-amber-200">
            <strong>Duplicate Contact Found!</strong>
            <br />
            A student with this {getDuplicateMessage()} already exists:
            <br />
            <span className="font-semibold">
              {duplicateWarning.name} ({duplicateWarning.studentId || 'No ID'}) - Status: {duplicateWarning.status}
            </span>
            <br />
            <span className="text-xs">Please use a different {getDuplicateMessage()}.</span>
          </AlertDescription>
        </Alert>
      )}

      {/* Personal Information */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <FormField
          control={form.control}
          name="name"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Full Name *</FormLabel>
              <FormControl>
                <Input placeholder="Enter full name" maxLength={100} autoFocus {...field} />
              </FormControl>
              <FormDescription>Enter the student's full name</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="email"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Email *</FormLabel>
              <FormControl>
                <Input
                  type="email"
                  placeholder="student@example.com"
                  maxLength={100}
                  {...field}
                  onBlur={(e) => {
                    field.onBlur()
                    checkDuplicate()
                  }}
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="phone"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Mobile Number *</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <div className="w-20 flex items-center justify-center border rounded-md bg-neutral-50 dark:bg-neutral-900 text-sm font-medium text-neutral-700 dark:text-neutral-300">
                    {phonePrefix}
                  </div>
                  <Input
                    placeholder="Enter mobile number"
                    maxLength={20}
                    inputMode="numeric"
                    pattern="[0-9]*"
                    value={field.value || ''}
                    name={field.name}
                    ref={field.ref}
                    className="flex-1"
                    onChange={(e) => {
                      // Only allow numeric input
                      const numericValue = e.target.value.replace(/[^0-9]/g, '')
                      field.onChange(numericValue)
                    }}
                    onBlur={(e) => {
                      field.onBlur()
                      checkDuplicate()
                    }}
                  />
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Country code: {phonePrefix} (configured in Settings) • Numbers only
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="dateOfBirth"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Date of Birth *</FormLabel>
              <FormControl>
                <Input type="date" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="gender"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Gender *</FormLabel>
              <FormControl>
                <SearchableDropdown
                  options={[
                    { value: 'MALE', label: 'Male' },
                    { value: 'FEMALE', label: 'Female' },
                    { value: 'OTHER', label: 'Other' },
                  ]}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Select gender"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="bloodGroup"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Blood Group</FormLabel>
              <FormControl>
                <SearchableDropdown
                  options={[
                    { value: 'A+', label: 'A+' },
                    { value: 'A-', label: 'A-' },
                    { value: 'B+', label: 'B+' },
                    { value: 'B-', label: 'B-' },
                    { value: 'O+', label: 'O+' },
                    { value: 'O-', label: 'O-' },
                    { value: 'AB+', label: 'AB+' },
                    { value: 'AB-', label: 'AB-' },
                  ]}
                  value={field.value || ''}
                  onChange={field.onChange}
                  placeholder="Select blood group"
                />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Username Field */}
        <FormField
          control={form.control}
          name="username"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Username *</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    placeholder="Auto-generated from name"
                    maxLength={50}
                    {...field}
                    className="flex-1"
                    onBlur={(e) => {
                      field.onBlur()
                      checkDuplicate()
                    }}
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={handleGenerateUsername}
                    disabled={generatingUsername || !form.getValues('name')}
                    title="Regenerate username"
                  >
                    <RefreshCw className={`h-4 w-4 ${generatingUsername ? 'animate-spin' : ''}`} />
                  </Button>
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Username is auto-generated from name. Click refresh to regenerate.
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        {/* Password Field */}
        <FormField
          control={form.control}
          name="password"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Password *</FormLabel>
              <FormControl>
                <div className="flex gap-2">
                  <Input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="Enter password (min 6 characters)"
                    maxLength={100}
                    {...field}
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => setShowPassword(!showPassword)}
                    title={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
                  </Button>
                </div>
              </FormControl>
              <FormDescription className="text-xs">
                Student will use this password to login
              </FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="presentAddress"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Present Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter present address" maxLength={200} {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />

        <FormField
          control={form.control}
          name="permanentAddress"
          render={({ field }) => (
            <FormItem className="md:col-span-2">
              <FormLabel>Permanent Address</FormLabel>
              <FormControl>
                <Input placeholder="Enter permanent address (leave blank if same as present)" maxLength={200} {...field} />
              </FormControl>
              <FormDescription>Leave blank if same as present address</FormDescription>
              <FormMessage />
            </FormItem>
          )}
        />
      </div>
    </div>
  )
}


