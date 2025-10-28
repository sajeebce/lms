# 📚 Form Migration Guide - React Hook Form + Shadcn

This guide documents the standardized form pattern used across all academic setup pages.

---

## 🎯 Pattern Overview

All forms now follow this consistent structure:

1. **Zod Schema** - Type-safe validation
2. **React Hook Form** - Form state management
3. **Shadcn Form Components** - UI rendering
4. **Theme-Aligned Buttons** - Consistent styling

---

## 📝 Step-by-Step Implementation

### Step 1: Define Zod Schema

```typescript
import { z } from 'zod'

const formSchema = z.object({
  name: z.string().min(1, 'Name is required'),
  email: z.string().email('Invalid email'),
  status: z.enum(['ACTIVE', 'INACTIVE']),
  count: z.number().min(1, 'Must be at least 1'),
  description: z.string().optional(),
})

type FormValues = z.infer<typeof formSchema>
```

### Step 2: Initialize Form Hook

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'

const form = useForm<FormValues>({
  resolver: zodResolver(formSchema),
  defaultValues: {
    name: '',
    email: '',
    status: 'ACTIVE',
    count: 1,
    description: '',
  },
})
```

### Step 3: Create Submit Handler

```typescript
const onSubmit = async (values: FormValues) => {
  try {
    // Call your API/action
    await createItem(values)
    
    // Show success
    toast.success('Item created successfully')
    
    // Reset form
    form.reset()
    setOpen(false)
  } catch (error) {
    toast.error('Failed to create item')
  }
}
```

### Step 4: Render Form with FormField

```typescript
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form'

<Form {...form}>
  <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
    
    {/* Text Input */}
    <FormField
      control={form.control}
      name="name"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Name *</FormLabel>
          <FormControl>
            <Input placeholder="Enter name" {...field} />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* Select Dropdown */}
    <FormField
      control={form.control}
      name="status"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Status *</FormLabel>
          <Select onValueChange={field.onChange} value={field.value}>
            <FormControl>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
            </FormControl>
            <SelectContent>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="INACTIVE">Inactive</SelectItem>
            </SelectContent>
          </Select>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* Number Input */}
    <FormField
      control={form.control}
      name="count"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Count *</FormLabel>
          <FormControl>
            <Input 
              type="number" 
              {...field}
              onChange={(e) => field.onChange(parseInt(e.target.value))}
            />
          </FormControl>
          <FormMessage />
        </FormItem>
      )}
    />

    {/* Textarea */}
    <FormField
      control={form.control}
      name="description"
      render={({ field }) => (
        <FormItem>
          <FormLabel>Description</FormLabel>
          <FormControl>
            <Textarea placeholder="Enter description" {...field} />
          </FormControl>
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
      >
        {form.formState.isSubmitting ? 'Saving...' : 'Create'}
      </Button>
    </div>
  </form>
</Form>
```

---

## 🔄 Edit Mode Implementation

```typescript
// Load existing data
const handleEdit = (item: Item) => {
  form.reset({
    name: item.name,
    email: item.email,
    status: item.status,
    count: item.count,
    description: item.description,
  })
  setEditingItem(item)
  setOpen(true)
}

// Update submit handler
const onSubmit = async (values: FormValues) => {
  try {
    if (editingItem) {
      await updateItem(editingItem.id, values)
      toast.success('Item updated successfully')
    } else {
      await createItem(values)
      toast.success('Item created successfully')
    }
    form.reset()
    setEditingItem(null)
    setOpen(false)
  } catch (error) {
    toast.error('Operation failed')
  }
}

// Update button text
<Button type="submit" disabled={form.formState.isSubmitting}>
  {form.formState.isSubmitting 
    ? 'Saving...' 
    : editingItem ? 'Update' : 'Create'
  }
</Button>
```

---

## 🎨 Theme-Aligned Buttons

All buttons automatically use theme colors:

```typescript
// Primary button (uses theme colors)
<Button type="submit">
  Create
</Button>

// Secondary button (outline variant)
<Button type="button" variant="outline">
  Cancel
</Button>

// With loading state
<Button disabled={form.formState.isSubmitting}>
  {form.formState.isSubmitting ? 'Saving...' : 'Submit'}
</Button>
```

---

## ✅ Validation Examples

```typescript
// Required field
name: z.string().min(1, 'Name is required')

// Email validation
email: z.string().email('Invalid email address')

// Number with range
age: z.number().min(18, 'Must be 18+').max(100, 'Invalid age')

// Enum validation
status: z.enum(['ACTIVE', 'INACTIVE', 'PENDING'])

// Optional field
description: z.string().optional()

// Custom validation
password: z.string().min(8, 'Password must be 8+ characters')
  .regex(/[A-Z]/, 'Must contain uppercase')
  .regex(/[0-9]/, 'Must contain number')
```

---

## 📦 Required Imports

```typescript
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import { Textarea } from '@/components/ui/textarea'
import { Label } from '@/components/ui/label'
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
```

---

## 🚀 Benefits

✅ Type-safe form handling  
✅ Built-in validation  
✅ Consistent error messages  
✅ Automatic form state management  
✅ Theme-aligned styling  
✅ Better accessibility  
✅ Reduced boilerplate code  
✅ Easier to maintain and extend  

---

**Use this pattern for all future forms in the LMS!**

