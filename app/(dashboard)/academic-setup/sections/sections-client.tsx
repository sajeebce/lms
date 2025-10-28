'use client'

import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, ShieldAlert } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import { Badge } from '@/components/ui/badge'
import { Textarea } from '@/components/ui/textarea'
import { toast } from 'sonner'
import { createSection, updateSection, deleteSection } from './actions'

// Form validation schema with character limits
const formSchema = z.object({
  name: z.string()
    .min(1, 'Section name is required')
    .max(100, 'Section name must be 100 characters or less'),
  cohortId: z.string().min(1, 'Cohort is required'),
  capacity: z.number()
    .min(0, 'Capacity must be 0 or greater')
    .max(9999999, 'Capacity must be 9999999 or less'),
  note: z.string()
    .max(500, 'Note must be 500 characters or less')
    .optional(),
})

type FormValues = z.infer<typeof formSchema>

type Section = {
  id: string
  name: string
  capacity: number
  note: string | null
  cohort: {
    id: string
    name: string
    year: { id: string; name: string }
    class: { id: string; name: string }
    branch: { id: string; name: string }
  }
}

type Branch = { id: string; name: string }
type AcademicYear = { id: string; name: string }
type Class = { id: string; name: string }
type Cohort = {
  id: string
  name: string
  year: { id: string; name: string }
  class: { id: string; name: string }
  branch: { id: string; name: string }
}

export function SectionsClient({
  sections,
  branches,
  academicYears,
  classes,
  cohorts,
}: {
  sections: Section[]
  branches: Branch[]
  academicYears: AcademicYear[]
  classes: Class[]
  cohorts: Cohort[]
}) {
  const [open, setOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null)

  // React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      cohortId: '',
      capacity: 40,
      note: '',
    },
  })

  // Filters
  const [filters, setFilters] = useState({
    branchId: '',
    yearId: '',
    classId: '',
    cohortId: '',
  })

  // Cascading filter logic
  const filteredCohorts = useMemo(() => {
    return cohorts.filter((cohort) => {
      if (filters.branchId && filters.branchId !== 'all' && cohort.branch.id !== filters.branchId) return false
      if (filters.yearId && filters.yearId !== 'all' && cohort.year.id !== filters.yearId) return false
      if (filters.classId && filters.classId !== 'all' && cohort.class.id !== filters.classId) return false
      return true
    })
  }, [cohorts, filters])

  const filteredSections = useMemo(() => {
    return sections.filter((section) => {
      if (filters.branchId && filters.branchId !== 'all' && section.cohort.branch.id !== filters.branchId)
        return false
      if (filters.yearId && filters.yearId !== 'all' && section.cohort.year.id !== filters.yearId) return false
      if (filters.classId && filters.classId !== 'all' && section.cohort.class.id !== filters.classId) return false
      if (filters.cohortId && filters.cohortId !== 'all' && section.cohort.id !== filters.cohortId) return false
      return true
    })
  }, [sections, filters])

  const onSubmit = async (values: FormValues) => {
    const result = editingSection
      ? await updateSection(editingSection.id, {
          ...values,
          note: values.note || undefined,
        })
      : await createSection({
          ...values,
          note: values.note || undefined,
        })

    if (result.success) {
      toast.success(
        editingSection
          ? 'Section updated successfully'
          : 'Section created successfully'
      )
      setOpen(false)
      resetForm()
    } else {
      toast.error(result.error || 'An error occurred')
    }
  }

  const confirmDelete = async () => {
    if (!sectionToDelete) return

    const result = await deleteSection(sectionToDelete.id)
    if (result.success) {
      toast.success('Section deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete section')
    }
    setDeleteDialogOpen(false)
    setSectionToDelete(null)
  }

  const handleEdit = (section: Section) => {
    setEditingSection(section)
    form.reset({
      name: section.name,
      cohortId: section.cohort.id,
      capacity: section.capacity,
      note: section.note || '',
    })
    setOpen(true)
  }

  const resetForm = () => {
    setEditingSection(null)
    form.reset({
      name: '',
      cohortId: '',
      capacity: 40,
      note: '',
    })
  }

  return (
    <div className="space-y-4">
      {/* Filters */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div>
            <Label className="text-xs">Branch</Label>
            <Select
              value={filters.branchId}
              onValueChange={(value) => {
                setFilters({ ...filters, branchId: value, cohortId: '' })
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {branches.map((branch) => (
                  <SelectItem key={branch.id} value={branch.id}>
                    {branch.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Academic Year</Label>
            <Select
              value={filters.yearId}
              onValueChange={(value) => {
                setFilters({ ...filters, yearId: value, cohortId: '' })
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {academicYears.map((year) => (
                  <SelectItem key={year.id} value={year.id}>
                    {year.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Class</Label>
            <Select
              value={filters.classId}
              onValueChange={(value) => {
                setFilters({ ...filters, classId: value, cohortId: '' })
              }}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {classes.map((cls) => (
                  <SelectItem key={cls.id} value={cls.id}>
                    {cls.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label className="text-xs">Cohort</Label>
            <Select
              value={filters.cohortId}
              onValueChange={(value) => setFilters({ ...filters, cohortId: value })}
            >
              <SelectTrigger className="h-9">
                <SelectValue placeholder="All" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All</SelectItem>
                {filteredCohorts.map((cohort) => (
                  <SelectItem key={cohort.id} value={cohort.id}>
                    {cohort.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">
            All Sections ({filteredSections.length})
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
                Add Section
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingSection ? 'Edit Section' : 'Add New Section'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Cohort */}
                  <FormField
                    control={form.control}
                    name="cohortId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Cohort *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select cohort" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {cohorts.map((cohort) => (
                              <SelectItem key={cohort.id} value={cohort.id}>
                                {cohort.name} ({cohort.class.name} - {cohort.branch.name})
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Section Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Section Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Section A, Morning Batch"
                            maxLength={100}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the section name (max 100 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Capacity */}
                  <FormField
                    control={form.control}
                    name="capacity"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Capacity *</FormLabel>
                        <FormControl>
                          <Input
                            type="number"
                            min="0"
                            max="9999999"
                            {...field}
                            onChange={(e) => field.onChange(parseInt(e.target.value) || 0)}
                          />
                        </FormControl>
                        <FormDescription>
                          Maximum students (0 = unlimited, max 9999999)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Note */}
                  <FormField
                    control={form.control}
                    name="note"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Note (Optional)</FormLabel>
                        <FormControl>
                          <Textarea
                            placeholder="Optional description"
                            maxLength={500}
                            rows={3}
                            className="resize-none"
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Additional information about this section (max 500 characters)
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Submit Button Only */}
                  <div className="flex justify-end pt-4">
                    <Button
                      type="submit"
                      disabled={form.formState.isSubmitting}
                    >
                      {form.formState.isSubmitting ? 'Saving...' : editingSection ? 'Update' : 'Create'}
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
              <TableHead>Section Name</TableHead>
              <TableHead>Cohort</TableHead>
              <TableHead>Class</TableHead>
              <TableHead>Branch</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredSections.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center text-muted-foreground py-8">
                  No sections found. Create your first section to get started.
                </TableCell>
              </TableRow>
            ) : (
              filteredSections.map((section) => (
                <TableRow key={section.id}>
                  <TableCell className="font-medium">{section.name}</TableCell>
                  <TableCell>
                    <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300">
                      {section.cohort.name}
                    </Badge>
                  </TableCell>
                  <TableCell>{section.cohort.class.name}</TableCell>
                  <TableCell>{section.cohort.branch.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {section.capacity === 0 ? '∞ Unlimited' : `${section.capacity} students`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(section)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSectionToDelete(section)
                          setDeleteDialogOpen(true)
                        }}
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
              <AlertDialogTitle className="text-xl">Delete Section</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">{sectionToDelete?.name}</span>? This action cannot be undone.
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
    </div>
  )
}
