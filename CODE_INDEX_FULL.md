# 📚 LMS - Complete Code Index

**Generated:** 2025-11-11  
**Repository:** https://github.com/sajeebce/lms.git  
**Branch:** main

---

## 🏗️ Architecture Overview

### **Tech Stack**
- **Framework:** Next.js 15 (App Router)
- **Database:** Prisma + SQLite (dev) / PostgreSQL (prod)
- **UI:** shadcn/ui + Tailwind CSS
- **Authentication:** Mock Auth (RBAC ready)
- **Storage:** Local Storage + Cloudflare R2 (adapter pattern)
- **Forms:** React Hook Form + Zod
- **Rich Text:** TipTap Editor (with Math support)

### **Multi-Tenant SaaS Architecture**
- ✅ Every model has `tenantId` field
- ✅ All queries filtered by tenant
- ✅ File storage tenant-isolated
- ✅ Theme/branding per tenant
- ✅ Ready for custom domains (abc.com, def.com)

---

## 📁 Directory Structure

```
lms/
├── app/                          # Next.js App Router
│   ├── (dashboard)/              # Dashboard layout group
│   │   ├── academic-setup/       # Academic Setup Module
│   │   ├── students/             # Student Management
│   │   ├── subjects/             # Subject Management
│   │   ├── questions/            # Question Bank
│   │   └── settings/             # Settings
│   ├── api/                      # API Routes
│   │   └── storage/              # File storage API
│   ├── layout.tsx                # Root layout
│   └── page.tsx                  # Home page
│
├── components/                   # React Components
│   ├── ui/                       # shadcn/ui components
│   │   ├── searchable-dropdown.tsx
│   │   ├── multi-select-dropdown.tsx
│   │   ├── tiptap-editor.tsx
│   │   └── ...
│   ├── breadcrumb.tsx
│   ├── sidebar-nav.tsx
│   └── page-header.tsx
│
├── lib/                          # Core Libraries
│   ├── actions/                  # Server Actions
│   │   ├── academic-setup/
│   │   ├── students/
│   │   ├── subjects/
│   │   └── questions/
│   ├── storage/                  # Storage Service
│   │   ├── storage-service.ts
│   │   ├── local-storage-adapter.ts
│   │   └── r2-storage-adapter.ts
│   ├── auth.ts                   # Mock Auth + RBAC
│   ├── prisma.ts                 # Prisma Client
│   └── utils.ts                  # Utilities
│
├── prisma/                       # Database
│   ├── schema.prisma             # Database Schema
│   ├── migrations/               # Migration History
│   └── seed.ts                   # Seed Data
│
├── docs/                         # Documentation
│   ├── QUESTION_FORM_FIXES.md
│   ├── MATH_EDITOR_IMPLEMENTATION.md
│   ├── IMAGE_UPLOAD_IMPLEMENTATION_PLAN.md
│   └── ...
│
├── storage/                      # Local File Storage
│   └── tenants/                  # Tenant-isolated files
│
└── scripts/                      # Utility Scripts
    ├── seed-subjects.ts
    ├── seed-chapters.ts
    └── seed-topics.ts
```

---

## 🗄️ Database Schema (Key Models)

### **Core Tenant & Auth**
- `Tenant` - Multi-tenant root
- `User` - Authentication (future)
- `TenantSettings` - Branding, logo
- `ThemeSettings` - Custom colors per tenant

### **Academic Setup Module**
- `Branch` - School branches
- `AcademicYear` - Academic years (PLANNED, IN_SESSION, COMPLETED, ARCHIVED)
- `Stream` - Departments (Science, Commerce, Arts)
- `Class` - Grade levels (Class 1-12)
- `Cohort` - Year + Class + Branch (e.g., "Class 11 - 2025 Intake")
- `SectionTemplate` - Section templates per class
- `Section` - Actual sections (Section A, B, C)
- `Teacher` - Teacher profiles
- `Room` - Classrooms
- `Routine` - Timetable (with conflict validation)

### **Student Management**
- `Student` - Student profiles
- `StudentEnrollment` - Student → Section assignments
- `StudentDocument` - Birth cert, transfer cert, etc.

### **Subject Management**
- `Subject` - Subjects (Math, Physics, etc.)
- `Chapter` - Chapters within subjects
- `Topic` - Topics within chapters
- `SubjectEnrollment` - Student → Subject assignments

### **Question Bank**
- `Question` - Questions with rich text + images
- `QuestionOption` - MCQ options
- `QuestionTag` - Tags for filtering

---

## 🎨 UI Components (shadcn/ui)

### **Custom Components**
- `SearchableDropdown` - Single-select with search
- `MultiSelectDropdown` - Multi-select with badges
- `TiptapEditor` - Rich text editor with math support
- `Breadcrumb` - Navigation breadcrumbs
- `SidebarNav` - Dashboard sidebar
- `PageHeader` - Page title + actions

### **Standard shadcn Components**
- `Button`, `Input`, `Textarea`, `Select`
- `Dialog`, `AlertDialog`, `Popover`
- `Form`, `FormField`, `FormMessage`
- `Table`, `Card`, `Badge`, `Tabs`
- `Toast`, `Tooltip`, `Dropdown Menu`

---

## 🔐 Authentication & Authorization

### **Current (Mock Auth)**
```typescript
// lib/auth.ts
export async function getCurrentUser() {
  return {
    id: 'user_1',
    name: 'Admin User',
    email: 'admin@example.com',
    role: 'ADMIN',
    tenantId: 'tenant_1'
  }
}

export async function requireRole(roles: Role | Role[]) {
  // RBAC guard for server actions
}
```

### **Roles**
- `ADMIN` - Full access
- `TEACHER` - Limited access
- `STUDENT` - Read-only access
- `PARENT` - View child data

---

## 📦 Storage Service

### **Architecture**
```typescript
// lib/storage/storage-service.ts
export function getStorageService(): StorageAdapter {
  // Returns LocalStorageAdapter or R2StorageAdapter
}
```

### **Public Files**
- Student photos
- Teacher photos
- School logos
- Public course materials

### **Private Files**
- Student documents (birth cert, etc.)
- Exam papers
- Grade reports
- Assignment submissions

### **Storage Paths**
```
storage/
└── tenants/
    └── {tenantId}/
        ├── students/
        │   ├── photos/{studentId}/
        │   └── documents/{studentId}/
        ├── teachers/
        │   └── photos/{teacherId}/
        └── questions/
            └── images/{questionId}/
```

---

## 🚀 Key Features Implemented

### **✅ Academic Setup Module**
- Branch management
- Academic year management (with "Current" detection)
- Stream/Class hierarchy
- Cohort management (with enrollment toggle)
- Section templates + sections
- Teacher management
- Room management
- Routine/Timetable (with conflict validation)
- Year Wizard (bulk cohort generation)

### **✅ Student Management**
- Student CRUD
- Photo upload (with preview)
- Document upload (birth cert, transfer cert, etc.)
- Student enrollment to sections
- Subject enrollment

### **✅ Subject Management**
- Subject CRUD
- Chapter management (hierarchical)
- Topic management (hierarchical)
- Subject enrollment

### **✅ Question Bank**
- Question CRUD with rich text editor
- Image upload for questions
- MCQ options management
- Tag system
- Difficulty levels
- Question types (MCQ, True/False, Short Answer, Essay)

### **✅ Theme System**
- Per-tenant color customization
- Light/Dark mode toggle
- Custom logo upload
- Gradient accent colors

---

## 📝 Server Actions Pattern

All server actions follow this pattern:

```typescript
'use server'

import { requireRole } from '@/lib/auth'
import { getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { z } from 'zod'

export async function yourAction(data: YourInput) {
  // 1️⃣ ROLE GUARD
  await requireRole('ADMIN')

  // 2️⃣ TENANT ID
  const tenantId = await getTenantId()

  // 3️⃣ ZOD VALIDATION
  const schema = z.object({
    field: z.string().min(1).max(100),
  })
  const validated = schema.parse(data)

  // 4️⃣ TENANT ISOLATION
  const result = await prisma.yourModel.create({
    data: {
      ...validated,
      tenantId
    }
  })

  // 5️⃣ REVALIDATE
  revalidatePath('/your-path')

  return { success: true, data: result }
}
```

---

## 🧪 Testing

### **Test Files**
- `playwright.config.ts` - Playwright configuration
- `scripts/test-*.ts` - Unit tests for specific features

### **Test Coverage**
- ✅ Academic Setup CRUD operations
- ✅ Student enrollment flows
- ✅ Subject management
- ✅ Question bank operations
- ✅ File upload/delete
- ✅ Theme switching

---

## 📚 Documentation Files

See `docs/` directory for detailed documentation:
- `QUESTION_FORM_FIXES.md` - Question form improvements
- `MATH_EDITOR_IMPLEMENTATION.md` - Math editor setup
- `IMAGE_UPLOAD_IMPLEMENTATION_PLAN.md` - Image upload architecture
- `TIPTAP_EDITOR_ROADMAP.md` - Rich text editor roadmap

---

## 🔄 Recent Updates

### **Latest Changes (2025-11-11)**
- ✅ Question form with TipTap rich text editor
- ✅ Math equation support (MathLive)
- ✅ Image upload for questions
- ✅ Searchable dropdowns for all selects
- ✅ Multi-select dropdown for tags
- ✅ Form validation improvements
- ✅ Delete confirmation modals
- ✅ Character limits on all inputs

---

## 🚧 Future Roadmap

### **Phase: Authentication (Future)**
- NextAuth.js / Clerk integration
- Multi-domain session handling
- Tenant-aware login pages

### **Phase: Domain Routing (Future)**
- Middleware for domain resolution
- Custom domain field in Tenant model
- DNS verification flow

### **Phase: Public APIs (Future)**
- CORS handling
- Rate limiting per tenant
- API key authentication

---

## 📞 Support

For questions or issues, contact the development team.

**Repository:** https://github.com/sajeebce/lms.git

