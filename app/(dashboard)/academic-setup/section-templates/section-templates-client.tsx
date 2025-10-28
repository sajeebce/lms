'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, Info, ShieldAlert } from 'lucide-react'
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
import {
  createSectionTemplate,
  updateSectionTemplate,
  deleteSectionTemplate,
} from './actions'

// Form validation schema with character limits
const formSchema = z.object({
  name: z.string()
    .min(1, 'Template name is required')
    .max(100, 'Template name must be 100 characters or less'),
  classId: z.string().min(1, 'Class is required'),
  capacity: z.number()
    .min(0, 'Capacity must be 0 or greater')
    .max(9999999, 'Capacity must be 9999999 or less'),
  note: z.string()
    .max(500, 'Note must be 500 characters or less')
    .optional(),
})

type FormValues = z.infer<typeof formSchema>

type Template = {
  id: string
  name: string
  capacity: number
  note: string | null
  class: { id: string; name: string }
}

type Class = { id: string; name: string }

export function SectionTemplatesClient({
  templates,
  classes,
}: {
  templates: Template[]
  classes: Class[]
}) {
  const [open, setOpen] = useState(false)
  const [editingTemplate, setEditingTemplate] = useState<Template | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [templateToDelete, setTemplateToDelete] = useState<Template | null>(null)

  // React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      classId: '',
      capacity: 40,
      note: '',
    },
  })

  const onSubmit = async (values: FormValues) => {
    const result = editingTemplate
      ? await updateSectionTemplate(editingTemplate.id, {
          ...values,
          note: values.note || undefined,
        })
      : await createSectionTemplate({
          ...values,
          note: values.note || undefined,
        })

    if (result.success) {
      toast.success(
        editingTemplate
          ? 'Template updated successfully'
          : 'Template created successfully'
      )
      setOpen(false)
      resetForm()
    } else {
      toast.error(result.error || 'An error occurred')
    }
  }

  const confirmDelete = async () => {
    if (!templateToDelete) return

    const result = await deleteSectionTemplate(templateToDelete.id)
    if (result.success) {
      toast.success('Template deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete template')
    }
    setDeleteDialogOpen(false)
    setTemplateToDelete(null)
  }

  const handleEdit = (template: Template) => {
    setEditingTemplate(template)
    form.reset({
      name: template.name,
      classId: template.class.id,
      capacity: template.capacity,
      note: template.note || '',
    })
    setOpen(true)
  }

  const resetForm = () => {
    setEditingTemplate(null)
    form.reset({
      name: '',
      classId: '',
      capacity: 40,
      note: '',
    })
  }

  return (
    <div className="space-y-4">
      {/* Info Card */}
      <div className="bg-teal-50 border border-teal-200 rounded-lg p-4 flex items-start gap-3">
        <Info className="h-5 w-5 text-teal-600 mt-0.5" />
        <div>
          <p className="text-sm font-medium text-teal-900">
            Safe to delete, future only
          </p>
          <p className="text-xs text-teal-700 mt-1">
            Templates are used by the Year Wizard to auto-generate sections. Deleting
            a template only affects future cohort generation, not existing sections.
          </p>
        </div>
      </div>

      {/* Table */}
      <div className="bg-card rounded-lg border border-border">
        <div className="p-4 border-b border-border flex items-center justify-between">
          <h2 className="text-lg font-semibold text-card-foreground">
            All Templates ({templates.length})
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
                Add Template
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>
                  {editingTemplate ? 'Edit Template' : 'Add New Template'}
                </DialogTitle>
              </DialogHeader>
              <Form {...form}>
                <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                  {/* Class */}
                  <FormField
                    control={form.control}
                    name="classId"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Class *</FormLabel>
                        <Select onValueChange={field.onChange} value={field.value}>
                          <FormControl>
                            <SelectTrigger>
                              <SelectValue placeholder="Select class" />
                            </SelectTrigger>
                          </FormControl>
                          <SelectContent>
                            {classes.map((cls) => (
                              <SelectItem key={cls.id} value={cls.id}>
                                {cls.name}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  {/* Template Name */}
                  <FormField
                    control={form.control}
                    name="name"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Template Name *</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., Section A, Section B"
                            maxLength={100}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription>
                          Enter the template name (max 100 characters)
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
                          Maximum students per section (0 = unlimited, max 9999999)
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
                          Additional information about this template (max 500 characters)
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
                      {form.formState.isSubmitting ? 'Saving...' : editingTemplate ? 'Update' : 'Create'}
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
              <TableHead>Class</TableHead>
              <TableHead>Template Name</TableHead>
              <TableHead>Capacity</TableHead>
              <TableHead>Note</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {templates.length === 0 ? (
              <TableRow>
                <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                  No templates found. Create your first template to get started.
                </TableCell>
              </TableRow>
            ) : (
              templates.map((template) => (
                <TableRow key={template.id}>
                  <TableCell>
                    <Badge className="bg-violet-50 text-violet-700 hover:bg-violet-50 dark:bg-violet-900/30 dark:text-violet-300">
                      {template.class.name}
                    </Badge>
                  </TableCell>
                  <TableCell className="font-medium">{template.name}</TableCell>
                  <TableCell>
                    <Badge variant="outline">
                      {template.capacity === 0 ? '∞ Unlimited' : `${template.capacity} students`}
                    </Badge>
                  </TableCell>
                  <TableCell className="text-neutral-600 text-sm">
                    {template.note || '-'}
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(template)}
                      >
                        <Pencil className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setTemplateToDelete(template)
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
              <AlertDialogTitle className="text-xl">Delete Template</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">{templateToDelete?.name}</span>? This only affects future cohort generation.
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
