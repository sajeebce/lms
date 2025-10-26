# Academic Setup Module - Implementation Status

## ✅ Completed

### 1. Project Setup
- ✅ Next.js 16 with App Router, TypeScript, Tailwind CSS
- ✅ shadcn/ui components installed (button, dialog, input, label, table, select, textarea, badge, card, dropdown-menu, switch, sonner, form)
- ✅ Prisma ORM with SQLite database
- ✅ lucide-react for icons
- ✅ date-fns for date formatting
- ✅ Zod for validation
- ✅ React Hook Form integration

### 2. Database Schema (Prisma)
- ✅ Tenant model
- ✅ User model with RBAC (ADMIN, TEACHER, STUDENT)
- ✅ Branch model with status (ACTIVE/INACTIVE)
- ✅ AcademicYear model with state (PLANNED/IN_SESSION/COMPLETED/ARCHIVED)
- ✅ Stream model
- ✅ Class model with order and stream relation
- ✅ Cohort model with status and enrollmentOpen flag
- ✅ SectionTemplate model
- ✅ Section model
- ✅ Teacher model
- ✅ Room model with status
- ✅ Routine model with conflict validation fields

### 3. Infrastructure
- ✅ Prisma client setup (`lib/prisma.ts`)
- ✅ Auth helpers (`lib/auth.ts`) - Mock implementation for now
- ✅ Database seeded with tenant and admin user
- ✅ Dashboard layout with sidebar navigation
- ✅ Toaster component for notifications

### 4. Implemented Pages

#### ✅ /academic-setup/branches
- Full CRUD operations
- Status pills (ACTIVE=green, INACTIVE=gray)
- Delete guard (prevents deletion if cohorts exist)
- Themed UI with violet accent
- Modal form for create/edit
- Server actions with Zod validation
- Tenant-scoped queries

#### ✅ /academic-setup/academic-years
- Full CRUD operations
- "Current" badge (⭐ violet pill) for active year
- State pills (PLANNED=blue, IN_SESSION=green, COMPLETED=gray, ARCHIVED=amber)
- Archive action
- Delete guard (prevents deletion if cohorts exist)
- Date range display
- Themed UI with violet accent
- Modal form for create/edit
- Server actions with Zod validation
- Tenant-scoped queries

#### 🟡 /academic-setup/streams (Partially Complete)
- Server actions created
- Delete guard implemented
- Page and client components needed

## 📋 Remaining Pages to Implement

### Pattern to Follow

Each page follows this structure:

```
/academic-setup/{page-name}/
  ├── actions.ts          # Server actions with Zod validation
  ├── page.tsx            # Server component for data fetching
  └── {page-name}-client.tsx  # Client component for UI
```

### 3. /academic-setup/streams
**Status:** Actions created, needs page + client

**Requirements:**
- Simple CRUD list
- Delete guard: show lock icon if stream has classes
- Use emerald chips for status messaging
- Columns: Name, Note, Actions

### 4. /academic-setup/classes
**Requirements:**
- Columns: Name, Alias, Stream, Order (sorted ASC)
- Stream select in form
- Delete guard: block if cohorts or section templates exist
- Order field must be unique per tenant
- Show "In Use" warning chip if delete blocked
- Optional: Show "Promotion path = order+1" badge

### 5. /academic-setup/cohorts
**Requirements:**
- Columns: Name, Academic Year, Class, Branch, Status pill, Enrollment Open pill
- Toggle enrollmentOpen with switch → green/amber chip
- Filter bar: Branch, Academic Year, Class, Status, EnrollmentOpen
- Delete guard: block if sections exist
- Status pills: PLANNED/RUNNING/FINISHED/ARCHIVED
- "Live admin dashboard vibe"

### 6. /academic-setup/section-templates
**Requirements:**
- Columns: Class, Template Name, Capacity
- Capacity must be >= 1
- Delete allowed (show soft info chip: "Safe to delete, future only")
- Used by Year Wizard to clone sections

### 7. /academic-setup/sections
**Requirements:**
- Columns: Section Name, Cohort (with badge), Capacity
- Filter by: Branch, Academic Year, Class, Cohort
- Delete guard: block if students assigned (placeholder for now)
- Cohort relation required

### 8. /academic-setup/routine
**Requirements:**
- Top filters: Branch, Section, DayOfWeek
- Table/grid view of schedule slots
- Columns: Day, Time Range, Course Title chip, Teacher chip, Room chip
- Colorful chips: teacher=purple, room=blue, course=green
- Add Session modal with fields:
  - Section (select)
  - Teacher (select)
  - Room (select)
  - Course (select - can be optional for now)
  - DayOfWeek (0-6)
  - Start/End time (HH:MM format)
- **Conflict validation:**
  - Same teacher cannot overlap
  - Same room cannot overlap
  - Same section cannot overlap
  - Show amber/red chip: "Conflict: Teacher already booked at this time"

### 9. /academic-setup/year-wizard
**Requirements:**
- Stepper-style card with purple accent header
- Form fields:
  - Academic Year (select)
  - Branch (select)
  - Classes (multiselect)
- Preview table showing:
  - "Will create Cohort 'Class 11 – 2025 Intake' at Branch Mirpur"
  - Auto-generated sections from SectionTemplates
  - Conflict rows get amber "Already Exists" chip
- "Generate Now" button:
  - Creates cohorts + sections transactionally
  - Skips conflicts (not failure)
  - Success toast: "Cohorts & Sections created 🎉"

### 10. /academic-setup/promotions
**Requirements:**
- Info card with lock icon
- Text: "Student Promotion is coming soon 🚧. You'll be able to move Class 10 (2025) → Class 11 (2026), same branch, with one click."
- "Promote Now" button → server action returns 501
- Toast: "Not implemented yet"
- Violet/indigo soft background (not gray)

## 🎨 Theme Guidelines

### Colors
- **Violet/Purple:** Primary accent (buttons, badges, headers)
- **Teal:** Secondary accent
- **Lime:** Tertiary accent
- **Amber:** Warnings, conflicts
- **Emerald:** Success, active states
- **Neutral:** Surfaces, text

### Status Pills
```tsx
// Active/Success
className="bg-emerald-50 text-emerald-600 hover:bg-emerald-50"

// Inactive/Neutral
className="bg-neutral-100 text-neutral-600 hover:bg-neutral-100"

// Warning
className="bg-amber-50 text-amber-700 hover:bg-amber-50"

// Current/Featured
className="bg-violet-50 text-violet-600 hover:bg-violet-50"
```

### Table Headers
```tsx
<TableRow className="bg-violet-50/50">
```

### Page Headers
```tsx
<div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-6 border border-violet-100">
```

### Buttons
```tsx
<Button className="bg-violet-600 hover:bg-violet-700">
```

## 🔒 Delete Guards Summary

| Model | Guard Condition | Error Message |
|-------|----------------|---------------|
| Branch | Has Cohorts | "Cannot delete: Branch has linked Cohorts" |
| AcademicYear | Has Cohorts | "Cannot delete: linked Cohorts exist" |
| Stream | Has Classes | "Used in Classes" |
| Class | Has Cohorts or SectionTemplates | "In Use" |
| Cohort | Has Sections | Block deletion |
| Section | Has Students | Block deletion (placeholder) |

## 🚀 Next Steps

1. Complete streams page (page.tsx + client component)
2. Implement classes page
3. Implement cohorts page with filters
4. Implement section-templates page
5. Implement sections page with filters
6. Implement routine page with conflict validation
7. Implement year-wizard with transaction logic
8. Implement promotions stub page
9. Test all pages
10. Verify RBAC and tenant scoping

## 📝 Code Patterns

### Server Action Template
```typescript
'use server'

import { revalidatePath } from 'next/cache'
import { z } from 'zod'
import { prisma } from '@/lib/prisma'
import { getTenantId, requireRole } from '@/lib/auth'

const schema = z.object({
  // fields
})

export async function createItem(data: z.infer<typeof schema>) {
  try {
    await requireRole('ADMIN')
    const tenantId = await getTenantId()
    const validated = schema.parse(data)

    await prisma.model.create({
      data: { ...validated, tenantId },
    })

    revalidatePath('/path')
    return { success: true }
  } catch (error) {
    if (error instanceof Error) {
      return { success: false, error: error.message }
    }
    return { success: false, error: 'Failed to create item' }
  }
}
```

### Page Template
```typescript
import { prisma } from '@/lib/prisma'
import { getTenantId } from '@/lib/auth'
import { ClientComponent } from './client'

export default async function Page() {
  const tenantId = await getTenantId()
  const items = await prisma.model.findMany({
    where: { tenantId },
    // include relations if needed
  })

  return (
    <div className="space-y-6">
      <div className="bg-gradient-to-r from-violet-50 to-indigo-50 rounded-lg p-6 border border-violet-100">
        <h1 className="text-2xl font-bold text-neutral-900">Title</h1>
        <p className="text-sm text-neutral-600 mt-1">Description</p>
      </div>
      <ClientComponent items={items} />
    </div>
  )
}
```

## 🧪 Testing

Run the dev server:
```bash
npm run dev
```

Visit: http://localhost:3000

The app redirects to `/academic-setup/branches` by default.

## 📦 Dependencies

All required dependencies are installed:
- @prisma/client
- prisma (dev)
- zod
- react-hook-form
- @hookform/resolvers
- date-fns
- lucide-react
- shadcn/ui components
- sonner (toast notifications)

