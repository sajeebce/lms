'use client'

import { useState, useMemo, useEffect } from 'react'
import { Plus, Pencil, Trash2, Lock, ShieldAlert } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table'
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Switch } from '@/components/ui/switch'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import {
  createCohort,
  updateCohort,
  deleteCohort,
  toggleEnrollmentOpen,
} from './actions'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'

// Form validation schema with character limits
const formSchema = z.object({
  name: z.string()
    .min(1, 'Cohort name is required')
    .max(100, 'Cohort name must be 100 characters or less'),
  yearId: z.string().min(1, 'Academic year is required'),
  classId: z.string().min(1, 'Class is required'),
  streamId: z.string().optional(),
  branchId: z.string().min(1, 'Branch is required'),
  sectionId: z.string().optional(), // Optional section
  status: z.enum(['PLANNED', 'ACTIVE', 'COMPLETED', 'ARCHIVED']),
  enrollmentOpen: z.boolean(),
  startDate: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>

type Cohort = {
  id: string
  name: string
  status: 'PLANNED' | 'ACTIVE' | 'COMPLETED' | 'ARCHIVED'
  enrollmentOpen: boolean
  startDate: Date | null
  year: { id: string; name: string }
  class: { id: string; name: string }
  stream: { id: string; name: string } | null
  branch: { id: string; name: string }
  cohortSections: Array<{
    id: string
    section: { id: string; name: string }
  }>
  _count: { cohortSections: number }
}

type Branch = { id: string; name: string }
type AcademicYear = { id: string; name: string }
type Class = { id: string; name: string }
type Stream = { id: string; name: string }
type Section = { id: string; name: string }

export function CohortsClient({
  cohorts,
  branches,
  academicYears,
  classes,
  streams,
  sections,
}: {
  cohorts: Cohort[]
  branches: Branch[]
  academicYears: AcademicYear[]
  classes: Class[]
  streams: Stream[]
  sections: Section[]
}) {
  const [open, setOpen] = useState(false)
  const [editingCohort, setEditingCohort] = useState<Cohort | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [cohortToDelete, setCohortToDelete] = useState<Cohort | null>(null)

  // Section creation state
  const [localSections, setLocalSections] = useState<Section[]>(sections)
  const [sectionDialogOpen, setSectionDialogOpen] = useState(false)
  const [newSectionName, setNewSectionName] = useState('')
  const [newSectionCapacity, setNewSectionCapacity] = useState(0)
  const [newSectionNote, setNewSectionNote] = useState('')
  const [creatingSection, setCreatingSection] = useState(false)

  // React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      yearId: '',
      classId: '',
      streamId: '',
      branchId: '',
      sectionId: '',
      status: 'PLANNED',
      enrollmentOpen: false,
      startDate: '',
    },
  })

  // Auto-fill cohort name based on selections
  const watchedFields = form.watch(['yearId', 'classId', 'streamId', 'sectionId', 'branchId'])
  const [userEditedName, setUserEditedName] = useState(false)

  useEffect(() => {
    const [yearId, classId, streamId, sectionId, branchId] = watchedFields

    // Only auto-fill if editing is not active and user hasn't manually edited
    if (editingCohort || userEditedName) return

    if (yearId && classId && branchId) {
      const year = academicYears.find(y => y.id === yearId)
      const cls = classes.find(c => c.id === classId)
      const stream = streamId && streamId !== '__none__' ? streams.find(s => s.id === streamId) : null
      const section = sectionId ? sections.find(s => s.id === sectionId) : null
      const branch = branches.find(b => b.id === branchId)

      // Format: "Class-Stream-Section Year (Branch)"
      // Example: "Class 10-Science-Section A 2025 (Main Campus)"
      let autoName = cls?.name || ''
      if (stream) autoName += `-${stream.name}`
      if (section) autoName += `-${section.name}`
      if (year) autoName += ` ${year.name}`
      if (branch && branches.length > 1) autoName += ` (${branch.name})`

      // Auto-fill name
      if (autoName) {
        form.setValue('name', autoName, { shouldValidate: false })
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [watchedFields])

  // Filters
  const [filters, setFilters] = useState({
    branchId: '',
    yearId: '',
    classId: '',
    status: '',
    enrollmentOpen: '',
  })

  const filteredCohorts = useMemo(() => {
    return cohorts.filter((cohort) => {
      if (filters.branchId && filters.branchId !== 'all' && cohort.branch.id !== filters.branchId) return false
      if (filters.yearId && filters.yearId !== 'all' && cohort.year.id !== filters.yearId) return false
      if (filters.classId && filters.classId !== 'all' && cohort.class.id !== filters.classId) return false
      if (filters.status && filters.status !== 'all' && cohort.status !== filters.status) return false
      if (filters.enrollmentOpen === 'true' && !cohort.enrollmentOpen) return false
      if (filters.enrollmentOpen === 'false' && cohort.enrollmentOpen) return false
      return true
    })
  }, [cohorts, filters])

  const onSubmit = async (values: FormValues) => {
    // Convert __none__ to empty string for streamId
    const submissionData = {
      ...values,
      streamId: values.streamId === '__none__' ? '' : values.streamId,
    }

    const result = editingCohort
      ? await updateCohort(editingCohort.id, submissionData)
      : await createCohort(submissionData)

    if (result.success) {
      toast.success(
        editingCohort ? 'Cohort updated successfully' : 'Cohort created successfully'
      )
      setOpen(false)
      resetForm()
    } else {
      toast.error(result.error || 'An error occurred')
    }
  }

  const handleToggleEnrollment = async (id: string, currentValue: boolean) => {
    const result = await toggleEnrollmentOpen(id, !currentValue)
    if (result.success) {
      toast.success(
        !currentValue ? 'Enrollment opened' : 'Enrollment closed',
        { description: !currentValue ? 'Students can now enroll' : 'Enrollment is now closed' }
      )
    } else {
      toast.error(result.error || 'Failed to toggle enrollment')
    }
  }

  const confirmDelete = async () => {
    if (!cohortToDelete) return

    const result = await deleteCohort(cohortToDelete.id)
    if (result.success) {
      toast.success('Cohort deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete cohort')
    }
    setDeleteDialogOpen(false)
    setCohortToDelete(null)
  }

  const handleEdit = (cohort: Cohort) => {
    setEditingCohort(cohort)
    form.reset({
      name: cohort.name,
      yearId: cohort.year.id,
      classId: cohort.class.id,
      streamId: cohort.stream?.id || '__none__',
      branchId: cohort.branch.id,
      status: cohort.status,
      enrollmentOpen: cohort.enrollmentOpen,
      startDate: cohort.startDate ? new Date(cohort.startDate).toISOString().split('T')[0] : '',
    })
    setOpen(true)
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
      setLocalSections([...localSections, result.section])

      // Add to form selection
      form.setValue('sectionId', result.section.id)

      toast.success('Section created successfully')
      setSectionDialogOpen(false)
      setNewSectionName('')
      setNewSectionCapacity(0)
      setNewSectionNote('')
    } else {
      toast.error(result.error || 'Failed to create section')
    }
  }

  const resetForm = () => {
    setEditingCohort(null)
    setUserEditedName(false)
    form.reset({
      name: '',
      yearId: '',
      classId: '',
      streamId: '__none__',
      branchId: '',
      status: 'PLANNED',
      enrollmentOpen: false,
      startDate: '',
    })
  }

  const getStatusBadge = (status: Cohort['status']) => {
    const config = {
      PLANNED: {
        style: 'bg-neutral-100 text-neutral-600 dark:bg-neutral-800/30 dark:text-neutral-400',
        icon: '📋',
        label: 'Planned'
      },
      ACTIVE: {
        style: 'bg-emerald-50 text-emerald-700 dark:bg-emerald-900/30 dark:text-emerald-300',
        icon: '🎓',
        label: 'Active'
      },
      COMPLETED: {
        style: 'bg-violet-50 text-violet-600 dark:bg-violet-900/30 dark:text-violet-300',
        icon: '✅',
        label: 'Completed'
      },
      ARCHIVED: {
        style: 'bg-neutral-200 text-neutral-500 dark:bg-neutral-800/30 dark:text-neutral-400',
        icon: '📦',
        label: 'Archived'
      },
    }
    const { style, icon, label } = config[status]
    return (
      <Badge className={`${style} hover:${style}`}>
        {icon} {label}
      </Badge>
    )
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div>
            <Label className="text-xs">Branch</Label>
            <SearchableDropdown
              options={[
                { value: 'all', label: 'All' },
                ...branches.map((branch) => ({
                  value: branch.id,
                  label: branch.name,
                })),
              ]}
              value={filters.branchId}
              onChange={(value) => setFilters({ ...filters, branchId: value })}
              placeholder="All"
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs">Academic Year</Label>
            <SearchableDropdown
              options={[
                { value: 'all', label: 'All' },
                ...academicYears.map((year) => ({
                  value: year.id,
                  label: year.name,
                })),
              ]}
              value={filters.yearId}
              onChange={(value) => setFilters({ ...filters, yearId: value })}
              placeholder="All"
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs">Class</Label>
            <SearchableDropdown
              options={[
                { value: 'all', label: 'All' },
                ...classes.map((cls) => ({
                  value: cls.id,
                  label: cls.name,
                })),
              ]}
              value={filters.classId}
              onChange={(value) => setFilters({ ...filters, classId: value })}
              placeholder="All"
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs">Status</Label>
            <SearchableDropdown
              options={[
                { value: 'all', label: 'All' },
                { value: 'PLANNED', label: '📋 Planned' },
                { value: 'ACTIVE', label: '🎓 Active' },
                { value: 'COMPLETED', label: '✅ Completed' },
                { value: 'ARCHIVED', label: '📦 Archived' },
              ]}
              value={filters.status}
              onChange={(value) => setFilters({ ...filters, status: value })}
              placeholder="All"
              className="h-9"
            />
          </div>
          <div>
            <Label className="text-xs">Enrollment</Label>
            <SearchableDropdown
              options={[
                { value: 'all', label: 'All' },
                { value: 'true', label: 'Open' },
                { value: 'false', label: 'Closed' },
              ]}
              value={filters.enrollmentOpen}
              onChange={(value) => setFilters({ ...filters, enrollmentOpen: value })}
              placeholder="All"
              className="h-9"
            />
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">
            All Cohorts ({filteredCohorts.length})
          </h2>
          <Dialog
            open={open}
            onOpenChange={(o) => {
              setOpen(o)
              if (!o) resetForm()
            }}
          >
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Add Cohort
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingCohort ? 'Edit Cohort' : 'Add New Cohort'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Cohort Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cohort Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="Leave empty to auto-generate"
                            maxLength={100}
                            {...field}
                            onChange={(e) => {
                              field.onChange(e)
                              // Mark as user-edited if user types something
                              if (e.target.value.trim() !== '') {
                                setUserEditedName(true)
                              } else {
                                setUserEditedName(false)
                              }
                            }}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          <span className="text-violet-600 dark:text-violet-400 font-medium">
                            💡 Tip:
                          </span>{' '}
                          Leave empty to auto-generate name based on Year, Class, Stream, and Section selections
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Academic Year + Class (Side by Side) */}
                  <div className="grid grid-cols-2 gap-4">
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
                              onChange={field.onChange}
                              placeholder="Select year"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

                    <FormField
                      control={form.control}
                      name="classId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Class *</FormLabel>
                          <FormControl>
                            <SearchableDropdown
                              options={classes.map((cls) => ({
                                value: cls.id,
                                label: cls.name,
                              }))}
                              value={field.value}
                              onChange={field.onChange}
                              placeholder="Select class"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Stream + Branch (Side by Side) */}
                  <div className="grid grid-cols-2 gap-4">
                    <FormField
                      control={form.control}
                      name="streamId"
                      render={({ field }) => (
                        <FormItem>
                          <FormLabel>Stream (Optional)</FormLabel>
                          <FormControl>
                            <SearchableDropdown
                              options={[
                                { value: '__none__', label: 'No Stream' },
                                ...streams.map((stream) => ({
                                  value: stream.id,
                                  label: stream.name,
                                })),
                              ]}
                              value={field.value || '__none__'}
                              onChange={field.onChange}
                              placeholder="No stream"
                            />
                          </FormControl>
                          <FormDescription className="text-xs">
                            For Class 9-12 (Science/Commerce/Arts)
                          </FormDescription>
                          <FormMessage />
                        </FormItem>
                      )}
                    />

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
                              onChange={field.onChange}
                              placeholder="Select branch"
                            />
                          </FormControl>
                          <FormMessage />
                        </FormItem>
                      )}
                    />
                  </div>

                  {/* Section (Optional) */}
                  <FormField
                    control={form.control}
                    name="sectionId"
                    render={({ field }) => (
                      <FormItem>
                        <div className="flex items-center justify-between">
                          <FormLabel>Section (Optional)</FormLabel>
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
                          <SearchableDropdown
                            options={[
                              { value: '__none__', label: 'No Section' },
                              ...localSections.map((section) => ({
                                value: section.id,
                                label: section.name,
                              })),
                            ]}
                            value={field.value || '__none__'}
                            onChange={field.onChange}
                            placeholder="No section (create later)"
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Link an independent section to this cohort
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Start Date (Optional) */}
                  <FormField
                    control={form.control}
                    name="startDate"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Start Date (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            type="date"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          When did this cohort start?
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

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
                              { value: 'PLANNED', label: '📋 Planned' },
                              { value: 'ACTIVE', label: '🎓 Active' },
                              { value: 'COMPLETED', label: '✅ Completed' },
                              { value: 'ARCHIVED', label: '📦 Archived' },
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
                      <FormItem className="flex items-center justify-between">
                        <FormLabel>Enrollment Open</FormLabel>
                        <FormControl>
                          <Switch
                            checked={field.value}
                            onCheckedChange={field.onChange}
                          />
                        </FormControl>
                      </FormItem>
                    )}
                  />

                  {/* Submit Button Only */}
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? 'Saving...' : editingCohort ? 'Update' : 'Create'}
                    </Button>
                  </div>
                </form>
              </Form>
            </DialogContent>
          </Dialog>
        </div>

        <Table>
          <TableHeader>
            <TableRow className="bg-violet-50/50 dark:bg-slate-800/50">
              <TableHead>Cohort Name</TableHead>
              <TableHead>Academic Year</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Stream</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Enrollment</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredCohorts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={8} className="text-center text-muted-foreground py-8">
                  No cohorts found. Create your first cohort to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredCohorts.map((cohort) => (
                <TableRow key={cohort.id}>
                  <TableCell className="font-medium">{cohort.name}</TableCell>
                  <TableCell>{cohort.year.name}</TableCell>
                  <TableCell>{cohort.class.name}</TableCell>
                  <TableCell>
                    {cohort.stream ? (
                      <Badge variant="outline" className="bg-blue-50 text-blue-700 border-blue-200 dark:bg-blue-900/30 dark:text-blue-300">
                        {cohort.stream.name}
                      </Badge>
                    ) : (
                      <span className="text-muted-foreground text-sm">-</span>
                    )}
                  </TableCell>
                  <TableCell>{cohort.branch.name}</TableCell>
                  <TableCell>{getStatusBadge(cohort.status)}</TableCell>
                  <TableCell>
                    <div className="flex items-center gap-2">
                      <Switch
                        checked={cohort.enrollmentOpen}
                        onCheckedChange={() =>
                          handleToggleEnrollment(cohort.id, cohort.enrollmentOpen)
                        }
                      />
                      <Badge
                        className={
                          cohort.enrollmentOpen
                            ? 'bg-emerald-50 text-emerald-700 hover:bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300'
                            : 'bg-amber-50 text-amber-700 hover:bg-amber-50 dark:bg-amber-900/30 dark:text-amber-300'
                        }
                      >
                        {cohort.enrollmentOpen ? 'Open' : 'Closed'}
                      </Badge>
                    </div>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(cohort)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setCohortToDelete(cohort)
                          setDeleteDialogOpen(true)
                        }}
                        title="Delete cohort"
                      >
                        <Trash2 className="h-4 w-4 text-red-600" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl">Delete Cohort</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">{cohortToDelete?.name}</span>? This action cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="gap-2 sm:gap-2">
            <AlertDialogCancel className="mt-0">Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-red-600 hover:bg-red-700 text-white"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

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
              <Label htmlFor="cohort-section-name">Section Name *</Label>
              <Input
                id="cohort-section-name"
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
              <Label htmlFor="cohort-section-capacity">Capacity *</Label>
              <Input
                id="cohort-section-capacity"
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
              <Label htmlFor="cohort-section-note">Note (Optional)</Label>
              <Textarea
                id="cohort-section-note"
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
