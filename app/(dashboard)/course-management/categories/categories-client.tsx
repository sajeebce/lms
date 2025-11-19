'use client'

import { useState } from 'react'
import { Plus, Trash2, Edit, Lock, ChevronRight, ChevronDown } from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
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
import { toast } from 'sonner'
import { createCategory, updateCategory, deleteCategory } from './actions'
import CategoryForm from './category-form'

type Category = {
  id: string
  name: string
  slug: string
  description: string | null
  icon: string | null
  color: string | null
  status: string
  order: number
  parentId: string | null
  _count: {
    courses: number
  }
}

type TreeNode = {
  category: Category
  depth: number
  hasChildren: boolean
}

type Props = {
  initialCategories: Category[]
}

export default function CategoriesClient({ initialCategories }: Props) {
  const [categories, setCategories] = useState<Category[]>(initialCategories)
  const [expandedIds, setExpandedIds] = useState<Set<string>>(() => {
    const initial = new Set<string>()
    initialCategories.forEach((category) => {
      if (initialCategories.some((child) => child.parentId === category.id)) {
        initial.add(category.id)
      }
    })
    return initial
  })

  const hasChildren = (categoryId: string) =>
    categories.some((category) => category.parentId === categoryId)

  const getSortedChildren = (parentId: string | null) =>
    categories
      .filter((category) => category.parentId === parentId)
      .sort((a, b) => {
        if (a.order !== b.order) return a.order - b.order
        return a.name.localeCompare(b.name)
      })

  const buildTreeNodes = (): TreeNode[] => {
    const result: TreeNode[] = []

    const traverse = (parentId: string | null, depth: number) => {
      const children = getSortedChildren(parentId)
      children.forEach((child) => {
        const childHasChildren = hasChildren(child.id)
        result.push({ category: child, depth, hasChildren: childHasChildren })
        if (childHasChildren && expandedIds.has(child.id)) {
          traverse(child.id, depth + 1)
        }
      })
    }

    traverse(null, 0)
    return result
  }

  const toggleExpand = (categoryId: string) => {
    setExpandedIds((prev) => {
      const next = new Set(prev)
      if (next.has(categoryId)) {
        next.delete(categoryId)
      } else {
        next.add(categoryId)
      }
      return next
    })
  }

  const buildCategoryPath = (category: Category, all: Category[]): string => {
    const names: string[] = [category.name]
    let currentParentId = category.parentId

    while (currentParentId) {
      const parent = all.find((cat) => cat.id === currentParentId)
      if (!parent) break
      names.unshift(parent.name)
      currentParentId = parent.parentId
    }

    return names.join(' › ')
  }

  const [formOpen, setFormOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState<Category | null>(null)
  const [deleteDialogOpen, setDeleteDialogOpen] = useState(false)
  const [categoryToDelete, setCategoryToDelete] = useState<Category | null>(null)

  // Handle create/update
  const handleSubmit = async (data: {
    name: string
    slug: string
    description?: string
    icon?: string
    color?: string
    status?: string
    parentId?: string | null
  }) => {
    const newParentId = data.parentId ?? null

    if (editingCategory) {
      const previousParentId = editingCategory.parentId
      const result = await updateCategory(editingCategory.id, { ...data, parentId: newParentId })
      if (result.success) {
        toast.success('Category updated successfully')
        setCategories((prev) =>
          prev.map((cat) =>
            cat.id === editingCategory.id ? { ...cat, ...data, parentId: newParentId } : cat
          )
        )

        if (newParentId && newParentId !== previousParentId) {
          setExpandedIds((prev) => {
            const next = new Set(prev)
            next.add(newParentId)
            return next
          })
        }

        setFormOpen(false)
        setEditingCategory(null)
      } else {
        toast.error(result.error || 'Failed to update category')
      }
    } else {
      const result = await createCategory({ ...data, parentId: newParentId })
      if (result.success && result.data) {
        toast.success('Category created successfully 🎉')
        setCategories((prev) => [...prev, { ...result.data, _count: { courses: 0 } }])

        if (newParentId) {
          setExpandedIds((prev) => {
            const next = new Set(prev)
            next.add(newParentId)
            return next
          })
        }

        setFormOpen(false)
      } else {
        toast.error(result.error || 'Failed to create category')
      }
    }
  }

  // Handle delete
  const confirmDelete = async () => {
    if (!categoryToDelete) return

    const result = await deleteCategory(categoryToDelete.id)
    if (result.success) {
      toast.success('Category deleted successfully')
      setCategories((prev) => prev.filter((cat) => cat.id !== categoryToDelete.id))
    } else {
      toast.error(result.error || 'Failed to delete category')
    }
    setDeleteDialogOpen(false)
    setCategoryToDelete(null)
  }

  const treeNodes = buildTreeNodes()

  const expandableIds = categories.filter((cat) => hasChildren(cat.id)).map((cat) => cat.id)
  const allExpanded = expandableIds.length > 0 && expandableIds.every((id) => expandedIds.has(id))

  const handleToggleAll = () => {
    if (allExpanded) {
      setExpandedIds(new Set())
    } else {
      setExpandedIds(new Set(expandableIds))
    }
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-3xl font-bold bg-gradient-to-r from-[var(--theme-active-from)] to-[var(--theme-active-to)] bg-clip-text text-transparent">
            Course Categories
          </h1>
          <p className="mt-1 text-neutral-600 dark:text-neutral-400">
            Organize your courses into categories
          </p>
        </div>
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {expandableIds.length > 0 && (
            <Button
              type="button"
              variant="outline"
              size="sm"
              onClick={handleToggleAll}
              className="hidden rounded-full border-violet-200 bg-violet-50/60 text-xs font-medium text-violet-700 hover:bg-violet-100 dark:border-violet-900 dark:bg-violet-950/40 dark:text-violet-200 dark:hover:bg-violet-900/60 sm:inline-flex"
            >
              {allExpanded ? 'Collapse all' : 'Expand all'}
            </Button>
          )}
          <Button
            onClick={() => {
              setEditingCategory(null)
              setFormOpen(true)
            }}
            className="bg-gradient-to-r from-[var(--theme-button-from)] to-[var(--theme-button-to)] text-white hover:opacity-90"
          >
            <Plus className="mr-2 h-4 w-4" />
            Add Category
          </Button>
        </div>
      </div>

      {/* Categories List */}
      <div className="bg-white dark:bg-neutral-900 rounded-lg border border-neutral-200 dark:border-neutral-800 overflow-hidden">
        {categories.length === 0 ? (
          <div className="p-12 text-center text-neutral-500 dark:text-neutral-400">
            <p className="text-lg font-medium">No categories yet</p>
            <p className="text-sm mt-1">Create your first category to get started</p>
          </div>
        ) : (
          <div className="divide-y divide-neutral-200 dark:divide-neutral-800">
            {treeNodes.map(({ category, depth, hasChildren }) => (
              <div
                key={category.id}
                className="relative flex items-center gap-3 p-4 transition-colors hover:bg-violet-50/60 dark:hover:bg-violet-950/40"
                style={{ paddingLeft: `${depth * 18 + 14}px` }}
              >
                {/* Depth guide line for children */}
                {depth > 0 && (
                  <span className="pointer-events-none absolute left-6 top-1 bottom-1 w-px bg-gradient-to-b from-violet-200 to-indigo-200 dark:from-violet-800 dark:to-indigo-800" />
                )}

                {/* Tree toggle */}
                {hasChildren ? (
                  <button
                    type="button"
                    onClick={() => toggleExpand(category.id)}
                    className="flex h-7 w-7 items-center justify-center rounded-full border border-neutral-200 bg-white shadow-sm hover:bg-violet-50 dark:border-neutral-700 dark:bg-neutral-900 dark:hover:bg-violet-950/60 transition-colors"
                    aria-label={expandedIds.has(category.id) ? 'Collapse category' : 'Expand category'}
                  >
                    {expandedIds.has(category.id) ? (
                      <ChevronDown className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                    ) : (
                      <ChevronRight className="h-4 w-4 text-violet-600 dark:text-violet-300" />
                    )}
                  </button>
                ) : (
                  <span className="h-7 w-7" />
                )}

                {/* Icon */}
                <div
                  className="flex h-11 w-11 items-center justify-center rounded-xl text-xl shadow-sm ring-1 ring-black/5 dark:ring-white/10"
                  style={{ backgroundColor: category.color || '#6366f1' }}
                >
                  {category.icon || '📚'}
                </div>

                {/* Info */}
                <div className="flex-1">
                  <div className="flex items-center gap-2">
                    <h3 className="font-semibold text-neutral-900 dark:text-neutral-100">
                      {category.name}
                    </h3>
                    <span
                      className={`px-2 py-0.5 rounded-full text-xs font-medium ${
                        category.status === 'ACTIVE'
                          ? 'bg-green-100 text-green-700 dark:bg-green-900/30 dark:text-green-400'
                          : 'bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400'
                      }`}
                    >
                      {category.status}
                    </span>
                  </div>
                  <p className="mt-0.5 flex flex-wrap items-center gap-1 text-xs text-neutral-500 dark:text-neutral-500">
                    {category.parentId ? (
                      <>
                        <span className="rounded-full bg-violet-50 px-2 py-[1px] text-[10px] font-medium uppercase tracking-wide text-violet-700 dark:bg-violet-950/60 dark:text-violet-300">
                          Hierarchy
                        </span>
                        <span className="font-medium">{buildCategoryPath(category, categories)}</span>
                      </>
                    ) : (
                      <span className="rounded-full bg-emerald-50 px-2 py-[1px] text-[10px] font-medium uppercase tracking-wide text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-300">
                        Top-level category
                      </span>
                    )}
                  </p>
                  <p className="mt-1 text-sm text-neutral-600 dark:text-neutral-400">
                    {category.description || 'No description'}
                  </p>
                  <p className="mt-1 text-xs text-neutral-500 dark:text-neutral-500">
                    {category._count.courses} course{category._count.courses !== 1 ? 's' : ''}
                  </p>
                </div>

                {/* Actions */}
                <div className="flex items-center gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => {
                      setEditingCategory(category)
                      setFormOpen(true)
                    }}
                    title="Edit category"
                  >
                    <Edit className="h-4 w-4 text-blue-600" />
                  </Button>

                  {category._count.courses > 0 ? (
                    <Button
                      variant="ghost"
                      size="sm"
                      disabled
                      title={`Cannot delete: ${category._count.courses} course${
                        category._count.courses > 1 ? 's' : ''
                      } in this category`}
                    >
                      <Lock className="h-4 w-4 text-gray-400" />
                    </Button>
                  ) : (
                    <Button
                      variant="destructive"
                      size="sm"
                      onClick={() => {
                        setCategoryToDelete(category)
                        setDeleteDialogOpen(true)
                      }}
                      title="Delete category"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Create/Edit Dialog */}
      <Dialog open={formOpen} onOpenChange={setFormOpen}>
        <DialogContent className="max-w-2xl max-h-[calc(100vh-2rem)] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>{editingCategory ? 'Edit Category' : 'Create Category'}</DialogTitle>
          </DialogHeader>
          <CategoryForm
            initialData={editingCategory}
            parentOptions={categories.map((category) => ({
              value: category.id,
              label: buildCategoryPath(category, categories),
            }))}
            onSubmit={handleSubmit}
            onCancel={() => {
              setFormOpen(false)
              setEditingCategory(null)
            }}
          />
        </DialogContent>
      </Dialog>

      {/* Delete Confirmation */}
      <AlertDialog open={deleteDialogOpen} onOpenChange={setDeleteDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Delete Category</AlertDialogTitle>
            <AlertDialogDescription>
              Are you sure you want to delete &quot;{categoryToDelete?.name}&quot;? This action
              cannot be undone.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmDelete}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}

