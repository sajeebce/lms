'use client'

import { useState, useMemo } from 'react'
import { Plus, Pencil, Trash2, ShieldAlert, Lock } from 'lucide-react'
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
  } | null
  _count: {
    enrollments: number
    routines: number
  }
}

export function SectionsClient({
  sections,
}: {
  sections: Section[]
}) {
  const [open, setOpen] = useState(false)
  const [editingSection, setEditingSection] = useState<Section | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [sectionToDelete, setSectionToDelete] = useState<Section | null>(null)
  const [searchQuery, setSearchQuery] = useState('')

  // React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      capacity: 40,
      note: '',
    },
  })

  // Simple search filter
  const filteredSections = useMemo(() => {
    if (!searchQuery) return sections

    const query = searchQuery.toLowerCase()
    return sections.filter((section) =>
      section.name.toLowerCase().includes(query)
    )
  }, [sections, searchQuery])

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
      capacity: section.capacity,
      note: section.note || '',
    })
    setOpen(true)
  }

  const resetForm = () => {
    setEditingSection(null)
    form.reset({
      name: '',
      capacity: 40,
      note: '',
    })
  }

  return (
    <div className="space-y-4">
      {/* Search Bar */}
      <div className="bg-card rounded-lg border border-border p-4">
        <div className="flex items-center gap-4">
          <div className="flex-1">
            <Label className="text-xs">Search Sections</Label>
            <Input
              placeholder="Search by section name..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="h-9"
            />
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
            <TableRow className="bg-cyan-50/50 dark:bg-slate-800/50">
              <TableHead>Section Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Enrollments</TableHead>
              <TableHead>Routines</TableHead>
              <TableHead>Linked Cohort</TableHead>
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
                    <Badge variant="outline">
                      {section.capacity === 0 ? '∞ Unlimited' : `${section.capacity} students`}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-blue-50 text-blue-700 hover:bg-blue-50 dark:bg-blue-900/30 dark:text-blue-300">
                      {section._count.enrollments} student{section._count.enrollments !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    <Badge className="bg-purple-50 text-purple-700 hover:bg-purple-50 dark:bg-purple-900/30 dark:text-purple-300">
                      {section._count.routines} routine{section._count.routines !== 1 ? 's' : ''}
                    </Badge>
                  </TableCell>
                  <TableCell>
                    {section.cohort ? (
                      <Badge className="bg-indigo-50 text-indigo-700 hover:bg-indigo-50 dark:bg-indigo-900/30 dark:text-indigo-300">
                        {section.cohort.name}
                      </Badge>
                    ) : (
                      <span className="text-xs text-muted-foreground">Independent</span>
                    )}
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
                          const totalLinked = section._count.enrollments + section._count.routines
                          if (totalLinked > 0) {
                            const messages = []
                            if (section._count.enrollments > 0) {
                              messages.push(`${section._count.enrollments} student${section._count.enrollments > 1 ? 's' : ''} enrolled`)
                            }
                            if (section._count.routines > 0) {
                              messages.push(`${section._count.routines} routine${section._count.routines > 1 ? 's' : ''} linked`)
                            }
                            toast.error('Cannot Delete', {
                              description: `This section has ${messages.join(' and ')}. Please remove them first.`,
                            })
                            return
                          }
                          setSectionToDelete(section)
                          setDeleteDialogOpen(true)
                        }}
                        disabled={section._count.enrollments > 0 || section._count.routines > 0}
                        className={
                          section._count.enrollments > 0 || section._count.routines > 0
                            ? 'cursor-not-allowed'
                            : ''
                        }
                      >
                        {section._count.enrollments > 0 || section._count.routines > 0 ? (
                          <Lock className="h-4 w-4 text-amber-600 dark:text-amber-400" />
                        ) : (
                          <Trash2 className="h-4 w-4 text-red-600" />
                        )}
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
