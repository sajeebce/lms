'use client'

import { useState, useMemo } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Wand2, Eye, Sparkles, AlertCircle, Plus } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Textarea } from '@/components/ui/textarea'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Badge } from '@/components/ui/badge'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import { toast } from 'sonner'
import { previewYearWizard, executeYearWizard } from './actions'
import { MultiSelectDropdown } from '@/components/ui/multi-select-dropdown'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'
import { Switch } from '@/components/ui/switch'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'

type Branch = { id: string; name: string }
type AcademicYear = { id: string; name: string }
type Class = { id: string; name: string }
type Stream = { id: string; name: string }
type Section = { id: string; name: string }

type PreviewItem = {
  classId: string
  className: string
  cohortName: string
  sections: { name: string; capacity: number }[]
  exists: boolean
}

const formSchema = z.object({
  yearId: z.string().min(1, 'Academic year is required'),
  branchId: z.string().min(1, 'Branch is required'),
  classIds: z.array(z.string()).min(1, 'At least one class is required'),
  streamIds: z.array(z.string()).optional().default([]),
  sectionIds: z.array(z.string()).optional().default([]),
  status: z.enum(['PLANNED', 'RUNNING', 'FINISHED', 'ARCHIVED']),
  enrollmentOpen: z.boolean(),
})

type FormValues = z.infer<typeof formSchema>

export function YearWizardClient({
  branches,
  academicYears,
  classes,
  streams,
  sections: initialSections,
}: {
  branches: Branch[]
  academicYears: AcademicYear[]
  classes: Class[]
  streams: Stream[]
  sections: Section[]
}) {
  const [preview, setPreview] = useState<PreviewItem[] | null>(null)
  const [previewMeta, setPreviewMeta] = useState<{
    year: string
    branch: string
  } | null>(null)
  const [loading, setLoading] = useState(false)
  const [sections, setSections] = useState<Section[]>(initialSections)
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [newSectionCapacity, setNewSectionCapacity] = useState(0)
  const [newSectionNote, setNewSectionNote] = useState('')
  const [creatingSection, setCreatingSection] = useState(false)

  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      yearId: '',
      branchId: '',
      classIds: [],
      streamIds: [],
      sectionIds: [],
      status: 'PLANNED',
      enrollmentOpen: false,
    },
  })

  const handlePreview = async (values: FormValues) => {
    setLoading(true)

    // Convert sectionIds to sectionNames for backend
    const sectionNames = values.sectionIds?.map(id => {
      const section = sections.find(s => s.id === id)
      return section?.name || ''
    }).filter(Boolean) || []

    const result = await previewYearWizard({
      ...values,
      sectionNames,
    })
    setLoading(false)

    if (result.success && result.preview) {
      setPreview(result.preview)
      setPreviewMeta({ year: result.year!, branch: result.branch! })
      toast.success('Preview generated')
    } else {
      toast.error(result.error || 'Failed to generate preview')
    }
  }

  const handleExecute = async () => {
    if (!preview) return

    if (
      !confirm(
        'Are you sure you want to create these cohorts and sections? This action cannot be undone.'
      )
    )
      return

    setLoading(true)
    const values = form.getValues()

    // Convert sectionIds to sectionNames for backend
    const sectionNames = values.sectionIds?.map(id => {
      const section = sections.find(s => s.id === id)
      return section?.name || ''
    }).filter(Boolean) || []

    const result = await executeYearWizard({
      ...values,
      sectionNames,
    })
    setLoading(false)

    if (result.success && result.stats) {
      const { cohortsCreated, sectionsCreated, skipped } = result.stats
      toast.success('Cohorts & Sections created 🎉', {
        description: `Created ${cohortsCreated} cohort(s) and ${sectionsCreated} section(s). Skipped ${skipped} existing.`,
      })
      setPreview(null)
      setPreviewMeta(null)
      form.reset()
    } else {
      toast.error(result.error || 'Failed to execute wizard')
    }
  }

  const handleCreateSection = async () => {
    if (!newSectionName.trim()) {
      toast.error('Section name is required')
      return
    }

    setCreatingSection(true)

    // Import createSection action dynamically
    const { createSection } = await import('@/app/(dashboard)/academic-setup/sections/actions')

    const result = await createSection({
      name: newSectionName.trim(),
      capacity: newSectionCapacity,
      note: newSectionNote.trim() || undefined,
    })

    setCreatingSection(false)

    if (result.success && result.section) {
      // Add new section to local state
      setSections([...sections, result.section])

      // Add to form selection
      const currentSectionIds = form.getValues('sectionIds')
      form.setValue('sectionIds', [...currentSectionIds, result.section.id])

      toast.success('Section created successfully')
      setSectionDialogOpen(false)
      setNewSectionName('')
      setNewSectionCapacity(0)
      setNewSectionNote('')
    } else {
      toast.error(result.error || 'Failed to create section')
    }
  }

  return (
    <div className="space-y-6">
      {/* Form Card */}
      <Card className="border-violet-200 dark:border-violet-800/30 bg-gradient-to-br from-white to-violet-50/30 dark:from-card dark:to-violet-950/20">
        <CardHeader className="bg-gradient-to-r from-violet-100 to-indigo-100 dark:from-violet-950/30 dark:to-indigo-950/30 rounded-t-lg">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-violet-600 dark:bg-violet-700 rounded-lg">
              <Wand2 className="h-5 w-5 text-white" />
            </div>
            <div>
              <CardTitle className="text-xl">Year Wizard</CardTitle>
              <CardDescription className="text-violet-900 dark:text-violet-300">
                Select academic year, branch, and classes to auto-generate cohorts and
                sections
              </CardDescription>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-6">
          <Form {...form}>
            <form onSubmit={form.handleSubmit(handlePreview)} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Academic Year */}
                <FormField
                  control={form.control}
                  name="yearId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Academic Year *</FormLabel>
                      <FormControl>
                        <SearchableDropdown
                          options={academicYears.map((year) => ({
                            value: year.id,
                            label: year.name,
                          }))}
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value)
                            setPreview(null)
                          }}
                          placeholder="Select academic year"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Branch */}
                <FormField
                  control={form.control}
                  name="branchId"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch *</FormLabel>
                      <FormControl>
                        <SearchableDropdown
                          options={branches.map((branch) => ({
                            value: branch.id,
                            label: branch.name,
                          }))}
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value)
                            setPreview(null)
                          }}
                          placeholder="Select branch"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Classes, Streams, Sections - Side by Side */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Classes */}
                <FormField
                  control={form.control}
                  name="classIds"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Classes *</FormLabel>
                      <FormControl>
                        <MultiSelectDropdown
                          options={classes.map((cls) => ({
                            value: cls.id,
                            label: cls.name,
                          }))}
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value)
                            setPreview(null)
                          }}
                          placeholder="Select classes..."
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Select one or more classes
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Streams */}
                {streams.length > 0 && (
                  <FormField
                    control={form.control}
                    name="streamIds"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Streams (Optional)</FormLabel>
                        <FormControl>
                          <MultiSelectDropdown
                            options={streams.map((stream) => ({
                              value: stream.id,
                              label: stream.name,
                            }))}
                            value={field.value}
                            onChange={(value) => {
                              field.onChange(value)
                              setPreview(null)
                            }}
                            placeholder="Select streams..."
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Select one or more streams
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                )}

                {/* Sections */}
                <FormField
                  control={form.control}
                  name="sectionIds"
                  render={({ field }) => (
                    <FormItem>
                      <div className="flex items-center justify-between">
                        <FormLabel>Sections (Optional)</FormLabel>
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => setSectionDialogOpen(true)}
                          className="h-7 px-2 text-xs text-violet-600 hover:text-violet-700 hover:bg-violet-50 dark:text-violet-400 dark:hover:bg-violet-950/30"
                        >
                          <Plus className="h-3 w-3 mr-1" />
                          Add Section
                        </Button>
                      </div>
                      <FormControl>
                        <MultiSelectDropdown
                          options={sections.map((section) => ({
                            value: section.id,
                            label: section.name,
                          }))}
                          value={field.value}
                          onChange={(value) => {
                            field.onChange(value)
                            setPreview(null)
                          }}
                          placeholder="Select sections..."
                        />
                      </FormControl>
                      <FormDescription className="text-xs">
                        Select one or more independent sections
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              {/* Status and Enrollment Open */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Status */}
                <FormField
                  control={form.control}
                  name="status"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Status *</FormLabel>
                      <FormControl>
                        <SearchableDropdown
                          options={[
                            { value: 'PLANNED', label: 'Planned' },
                            { value: 'RUNNING', label: 'Running' },
                            { value: 'FINISHED', label: 'Finished' },
                            { value: 'ARCHIVED', label: 'Archived' },
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select status"
                        />
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Enrollment Open */}
                <FormField
                  control={form.control}
                  name="enrollmentOpen"
                  render={({ field }) => (
                    <FormItem className="flex flex-col justify-between">
                      <FormLabel>Enrollment Open</FormLabel>
                      <FormControl>
                        <div className="flex items-center gap-2">
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                          <Badge
                            className={
                              field.value
                                ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300'
                                : 'bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300'
                            }
                          >
                            {field.value ? 'Open' : 'Closed'}
                          </Badge>
                        </div>
                      </FormControl>
                      <FormMessage />
                    </FormItem>
                  )}
                />
              </div>

              <div className="flex gap-2 pt-4">
                <Button type="submit" disabled={loading}>
                  <Eye className="h-4 w-4 mr-2" />
                  {loading ? 'Generating...' : 'Preview'}
                </Button>
              </div>
            </form>
          </Form>
        </CardContent>
      </Card>

      {/* Preview Table */}
      {preview && previewMeta && (
        <Card className="border-indigo-200 dark:border-indigo-800/30">
          <CardHeader className="bg-indigo-50 dark:bg-indigo-950/30">
            <div className="flex items-center justify-between">
              <div>
                <CardTitle className="text-lg">Preview</CardTitle>
                <CardDescription className="dark:text-neutral-300">
                  {previewMeta.year} at {previewMeta.branch}
                </CardDescription>
              </div>
              <Button
                onClick={handleExecute}
                disabled={loading}
                className="bg-emerald-600 hover:bg-emerald-700"
              >
                <Sparkles className="h-4 w-4 mr-2" />
                {loading ? 'Creating...' : 'Generate Now'}
              </Button>
            </div>
          </CardHeader>
          <CardContent className="pt-6">
            <Table>
              <TableHeader>
                <TableRow className="bg-violet-50/50 dark:bg-slate-800/50">
                  <TableHead>Class</TableHead>
                  <TableHead>Cohort Name</TableHead>
                  <TableHead>Sections</TableHead>
                  <TableHead>Status</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {preview.map((item) => (
                  <TableRow key={item.cohortName}>
                    <TableCell className="font-medium">{item.className}</TableCell>
                    <TableCell>{item.cohortName}</TableCell>
                    <TableCell>
                      {item.sections.length === 0 ? (
                        <span className="text-muted-foreground text-sm">
                          No templates defined
                        </span>
                      ) : (
                        <div className="flex flex-wrap gap-1">
                          {item.sections.map((section, idx) => (
                            <Badge
                              key={idx}
                              variant="outline"
                              className="text-xs"
                            >
                              {section.name} ({section.capacity})
                            </Badge>
                          ))}
                        </div>
                      )}
                    </TableCell>
                    <TableCell>
                      {item.exists ? (
                        <Badge className="bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300">
                          <AlertCircle className="h-3 w-3 mr-1" />
                          Already Exists
                        </Badge>
                      ) : (
                        <Badge className="bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300">
                          Will Create
                        </Badge>
                      )}
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
      )}

      {/* Section Creation Dialog */}
      <Dialog open={sectionDialogOpen} onOpenChange={setSectionDialogOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Create New Section</DialogTitle>
            <DialogDescription>
              Create a new independent section that can be used across cohorts.
            </DialogDescription>
          </DialogHeader>
          <form
            onSubmit={(e) => {
              e.preventDefault()
              handleCreateSection()
            }}
            className="space-y-4 py-4"
          >
            {/* Section Name */}
            <div className="space-y-2">
              <Label htmlFor="section-name">Section Name *</Label>
              <Input
                id="section-name"
                placeholder="e.g., Section A"
                value={newSectionName}
                onChange={(e) => setNewSectionName(e.target.value)}
                maxLength={100}
                autoFocus
              />
              <p className="text-xs text-muted-foreground">
                Max 100 characters
              </p>
            </div>

            {/* Capacity */}
            <div className="space-y-2">
              <Label htmlFor="section-capacity">Capacity *</Label>
              <Input
                id="section-capacity"
                type="number"
                min="0"
                max="9999999"
                placeholder="0"
                value={newSectionCapacity}
                onChange={(e) => setNewSectionCapacity(parseInt(e.target.value) || 0)}
              />
              <p className="text-xs text-muted-foreground">
                Maximum students (0 = unlimited, max 9999999)
              </p>
            </div>

            {/* Note */}
            <div className="space-y-2">
              <Label htmlFor="section-note">Note (Optional)</Label>
              <Textarea
                id="section-note"
                placeholder="Optional description"
                maxLength={500}
                rows={3}
                className="resize-none"
                value={newSectionNote}
                onChange={(e) => setNewSectionNote(e.target.value)}
              />
              <p className="text-xs text-muted-foreground">
                Additional information about this section (max 500 characters)
              </p>
            </div>

            {/* Submit Button Only */}
            <div className="flex justify-end pt-4">
              <Button
                type="submit"
                disabled={creatingSection || !newSectionName.trim()}
              >
                {creatingSection ? 'Creating...' : 'Create Section'}
              </Button>
            </div>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  )
}

