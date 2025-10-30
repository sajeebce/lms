'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2, ShieldAlert, Lock } from 'lucide-react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Badge } from '@/components/ui/badge'
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
import { Input } from '@/components/ui/input'
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from '@/components/ui/form'
import { toast } from 'sonner'
import { createBranch, updateBranch, deleteBranch } from './actions'
import { SearchableDropdown } from '@/components/ui/searchable-dropdown'

// Form validation schema with character limits
const formSchema = z.object({
  name: z.string()
    .min(1, 'Branch name is required')
    .max(100, 'Branch name must be 100 characters or less'),
  code: z.string()
    .max(20, 'Code must be 20 characters or less')
    .optional(),
  address: z.string()
    .max(200, 'Address must be 200 characters or less')
    .optional(),
  phone: z.string()
    .max(20, 'Phone must be 20 characters or less')
    .optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

type FormValues = z.infer<typeof formSchema>

type Branch = {
  id: string
  name: string
  code: string | null
  phone: string | null
  status: 'ACTIVE' | 'INACTIVE'
  _count: {
    cohorts: number
  }
}

export function BranchesClient({ branches }: { branches: Branch[] }) {
  const [open, setOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [branchToDelete, setBranchToDelete] = useState<Branch | null>(null)

  // React Hook Form
  const form = useForm<FormValues>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      name: '',
      code: '',
      address: '',
      phone: '',
      status: 'ACTIVE',
    },
  })

  const onSubmit = async (values: FormValues) => {
    const result = editingBranch
      ? await updateBranch(editingBranch.id, values)
      : await createBranch(values)

    if (result.success) {
      toast.success(
        editingBranch ? 'Branch updated successfully' : 'Branch created successfully'
      )
      setOpen(false)
      resetForm()
    } else {
      toast.error(result.error || 'An error occurred')
    }
  }

  const confirmDelete = async () => {
    if (!branchToDelete) return

    const result = await deleteBranch(branchToDelete.id)
    if (result.success) {
      toast.success('Branch deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete branch')
    }
    setDeleteDialogOpen(false)
    setBranchToDelete(null)
  }

  const handleEdit = (branch: Branch) => {
    setEditingBranch(branch)
    form.reset({
      name: branch.name,
      code: branch.code || '',
      address: '',
      phone: branch.phone || '',
      status: branch.status,
    })
    setOpen(true)
  }

  const resetForm = () => {
    setEditingBranch(null)
    form.reset({
      name: '',
      code: '',
      address: '',
      phone: '',
      status: 'ACTIVE',
    })
  }

  return (
    <div className="bg-card rounded-lg border border-border">
      <div className="p-4 border-b border-border flex items-center justify-between">
        <h2 className="text-lg font-semibold text-card-foreground">All Branches</h2>
        <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
          <DialogTrigger asChild>
            <Button>
              <Plus className="h-4 w-4 mr-2" />
              Add Branch
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>
                {editingBranch ? 'Edit Branch' : 'Add New Branch'}
              </DialogTitle>
            </DialogHeader>
            <Form {...form}>
              <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
                {/* Branch Name */}
                <FormField
                  control={form.control}
                  name="name"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Branch Name *</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., Main Campus"
                          maxLength={100}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Enter the branch or campus name (max 100 characters)
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Code + Phone (Side by Side) */}
                <div className="grid grid-cols-2 gap-4">
                  <FormField
                    control={form.control}
                    name="code"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Code (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., MC-01"
                            maxLength={20}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Max 20 chars
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />

                  <FormField
                    control={form.control}
                    name="phone"
                    render={({ field }) => (
                      <FormItem>
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input
                            placeholder="e.g., +880 1234567890"
                            maxLength={20}
                            {...field}
                          />
                        </FormControl>
                        <FormDescription className="text-xs">
                          Max 20 chars
                        </FormDescription>
                        <FormMessage />
                      </FormItem>
                    )}
                  />
                </div>

                {/* Address */}
                <FormField
                  control={form.control}
                  name="address"
                  render={({ field }) => (
                    <FormItem>
                      <FormLabel>Address (Optional)</FormLabel>
                      <FormControl>
                        <Input
                          placeholder="e.g., 123 Main Street, Dhaka"
                          maxLength={200}
                          {...field}
                        />
                      </FormControl>
                      <FormDescription>
                        Full address (max 200 characters)
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
                            { value: 'ACTIVE', label: '✅ Active' },
                            { value: 'INACTIVE', label: '⏸️ Inactive' },
                          ]}
                          value={field.value}
                          onChange={field.onChange}
                          placeholder="Select status"
                        />
                      </FormControl>
                      <FormDescription>
                        Active branches can accept new enrollments
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
                    className="bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-700 hover:to-indigo-700 text-white"
                  >
                    {form.formState.isSubmitting ? 'Saving...' : editingBranch ? 'Update Branch' : 'Create Branch'}
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
            <TableHead>Branch Name</TableHead>
            <TableHead>Code</TableHead>
            <TableHead>Status</TableHead>
            <TableHead>Phone</TableHead>
            <TableHead className="text-right">Actions</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {branches.length === 0 ? (
            <TableRow>
              <TableCell colSpan={5} className="text-center text-muted-foreground py-8">
                No branches found. Create your first branch to get started.
              </TableCell>
            </TableRow>
          ) : (
            branches.map((branch) => (
              <TableRow key={branch.id}>
                <TableCell className="font-medium">{branch.name}</TableCell>
                <TableCell>{branch.code || '-'}</TableCell>
                <TableCell>
                  <Badge
                    className={
                      branch.status === 'ACTIVE'
                        ? 'bg-emerald-50 text-emerald-600 hover:bg-emerald-50 dark:bg-emerald-900/30 dark:text-emerald-300'
                        : 'bg-neutral-100 text-neutral-600 hover:bg-neutral-100 dark:bg-neutral-800/30 dark:text-neutral-400'
                    }
                  >
                    {branch.status}
                  </Badge>
                </TableCell>
                <TableCell>{branch.phone || '-'}</TableCell>
                <TableCell className="text-right">
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleEdit(branch)}
                    >
                      <Pencil className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (branch._count.cohorts > 0) {
                          toast.error('Cannot Delete', {
                            description: `This branch has ${branch._count.cohorts} cohort(s) linked. Please remove them first.`,
                          })
                          return
                        }
                        setBranchToDelete(branch)
                        setDeleteDialogOpen(true)
                      }}
                      disabled={branch._count.cohorts > 0}
                      title={branch._count.cohorts > 0 ? `Locked (${branch._count.cohorts} cohort${branch._count.cohorts > 1 ? 's' : ''})` : 'Delete branch'}
                    >
                      {branch._count.cohorts > 0 ? (
                        <Lock className="h-4 w-4 text-amber-600" />
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

      {/* Delete Confirmation Dialog */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent className="max-w-md">
          <AlertDialogHeader>
            <div className="flex items-center gap-3 mb-2">
              <div className="flex h-12 w-12 items-center justify-center rounded-full bg-red-100 dark:bg-red-900/20">
                <ShieldAlert className="h-6 w-6 text-red-600 dark:text-red-400" />
              </div>
              <AlertDialogTitle className="text-xl">Delete Branch</AlertDialogTitle>
            </div>
            <AlertDialogDescription className="text-base">
              Are you sure you want to delete <span className="font-semibold text-foreground">{branchToDelete?.name}</span>? This action cannot be undone.
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
