'use client'

import { useState } from 'react'
import { Plus, Pencil, Trash2 } from 'lucide-react'
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
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { toast } from 'sonner'
import { createBranch, updateBranch, deleteBranch } from './actions'

// Form validation schema
const formSchema = z.object({
  name: z.string().min(1, 'Branch name is required'),
  code: z.string().optional(),
  address: z.string().optional(),
  phone: z.string().optional(),
  status: z.enum(['ACTIVE', 'INACTIVE']),
})

type FormValues = z.infer<typeof formSchema>

type Branch = {
  id: string
  name: string
  code: string | null
  phone: string | null
  status: 'ACTIVE' | 'INACTIVE'
}

export function BranchesClient({ branches }: { branches: Branch[] }) {
  const [open, setOpen] = useState(false)
  const [editingBranch, setEditingBranch] = useState<Branch | null>(null)

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

  const handleDelete = async (id: string) => {
    if (!confirm('Are you sure you want to delete this branch?')) return

    const result = await deleteBranch(id)
    if (result.success) {
      toast.success('Branch deleted successfully')
    } else {
      toast.error(result.error || 'Failed to delete branch')
    }
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
                        <Input placeholder="e.g., Main Campus" {...field} />
                      </FormControl>
                      <FormDescription>
                        Enter the branch or campus name
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
                          <Input placeholder="e.g., MC-01" {...field} />
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
                        <FormLabel>Phone (Optional)</FormLabel>
                        <FormControl>
                          <Input placeholder="e.g., +880 1234567890" {...field} />
                        </FormControl>
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
                        <Input placeholder="e.g., 123 Main Street, Dhaka" {...field} />
                      </FormControl>
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
                      <Select onValueChange={field.onChange} value={field.value}>
                        <FormControl>
                          <SelectTrigger>
                            <SelectValue placeholder="Select status" />
                          </SelectTrigger>
                        </FormControl>
                        <SelectContent>
                          <SelectItem value="ACTIVE">✅ Active</SelectItem>
                          <SelectItem value="INACTIVE">⏸️ Inactive</SelectItem>
                        </SelectContent>
                      </Select>
                      <FormDescription>
                        Active branches can accept new enrollments
                      </FormDescription>
                      <FormMessage />
                    </FormItem>
                  )}
                />

                {/* Buttons */}
                <div className="flex justify-end gap-2 pt-4">
                  <Button
                    type="button"
                    variant="outline"
                    onClick={() => setOpen(false)}
                  >
                    Cancel
                  </Button>
                  <Button
                    type="submit"
                    disabled={form.formState.isSubmitting}
                    className="bg-violet-600 hover:bg-violet-700"
                  >
                    {form.formState.isSubmitting ? 'Saving...' : editingBranch ? 'Update' : 'Create'}
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
                      onClick={() => handleDelete(branch.id)}
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
  )
}

