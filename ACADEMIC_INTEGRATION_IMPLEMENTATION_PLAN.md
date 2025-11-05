# 📚 Academic Integration & Question Bank Implementation Plan

**Project:** LMS (Learning Management System)  
**Module:** Academic Integration (Subject + Course + Question Bank)  
**Date:** 2025-11-05  
**Status:** 📋 **PLANNING PHASE**

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Database Schema](#-database-schema)
3. [Left Navigation Structure](#-left-navigation-structure)
4. [Implementation Phases](#-implementation-phases)
5. [Subject Management](#-subject-management)
6. [Course Academic Integration](#-course-academic-integration)
7. [Question Bank System](#-question-bank-system)
8. [Server Actions Reference](#-server-actions-reference)
9. [UI/UX Design Patterns](#-uiux-design-patterns)
10. [Testing Checklist](#-testing-checklist)

---

## 🎯 Overview

### Goal
Integrate Academic Setup (Class, Stream, Section) with Course Management and build a comprehensive Question Bank system.

### Key Features
1. ✅ **Subject Management** - Reusable subjects across classes
2. ✅ **Course Academic Integration** - Link courses to Class + Subject + Stream
3. ✅ **Question Bank** - Subject → Chapter → Topic → Questions
4. ✅ **Question Sources** - Track question origins (Board, Book, Custom)
5. ✅ **Multi-tenant Safe** - All models include tenantId
6. ✅ **RBAC Protected** - Admin/Teacher only for management

### Architecture Alignment
- ✅ Follows existing Academic Setup patterns
- ✅ Uses same UI components (SearchableDropdown, Table, Dialog)
- ✅ Same server action patterns (requireRole + getTenantId)
- ✅ Same dark mode support
- ✅ Same file storage service

---

## 🗄️ Database Schema

### 1. Subject Model (New)

```prisma
model Subject {
  id          String   @id @default(cuid())
  tenantId    String
  
  // Basic Info
  name        String   // "Mathematics", "Physics", "English"
  code        String?  // "MATH", "PHY", "ENG"
  description String?  @db.Text
  
  // Visual
  icon        String?  // Icon name or emoji
  color       String?  // Hex color for UI theming
  
  // Organization
  order       Int      @default(0)
  status      SubjectStatus @default(ACTIVE)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  courses     Course[]
  chapters    Chapter[]
  
  @@unique([tenantId, name])
  @@unique([tenantId, code])
  @@index([tenantId, status])
  @@map("subjects")
}

enum SubjectStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}
```

### 2. Chapter Model (New - for Question Bank)

```prisma
model Chapter {
  id          String   @id @default(cuid())
  tenantId    String
  
  // Links
  subjectId   String
  classId     String   // Chapter belongs to specific class
  
  // Basic Info
  name        String   // "Algebra", "Trigonometry", "Mechanics"
  code        String?  // "CH01", "CH02"
  description String?  @db.Text
  
  // Organization
  order       Int      @default(0)
  status      ChapterStatus @default(ACTIVE)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  subject     Subject  @relation(fields: [subjectId], references: [id], onDelete: Cascade)
  class       Class    @relation(fields: [classId], references: [id], onDelete: Cascade)
  topics      Topic[]
  
  @@unique([tenantId, subjectId, classId, name])
  @@index([tenantId, subjectId, classId])
  @@map("chapters")
}

enum ChapterStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}
```

### 3. Topic Model (New - for Question Bank)

```prisma
model Topic {
  id          String   @id @default(cuid())
  tenantId    String
  
  // Links
  chapterId   String
  
  // Basic Info
  name        String   // "Linear Equations", "Quadratic Equations"
  code        String?  // "T01", "T02"
  description String?  @db.Text
  
  // Organization
  order       Int      @default(0)
  status      TopicStatus @default(ACTIVE)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  chapter     Chapter  @relation(fields: [chapterId], references: [id], onDelete: Cascade)
  questions   Question[]
  
  @@unique([tenantId, chapterId, name])
  @@index([tenantId, chapterId])
  @@map("topics")
}

enum TopicStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}
```

### 4. Question Source Model (New)

```prisma
model QuestionSource {
  id          String   @id @default(cuid())
  tenantId    String
  
  // Basic Info
  name        String   // "SSC Board 2023", "NCTB Book", "Custom"
  type        SourceType @default(CUSTOM)
  year        Int?     // 2023, 2024
  description String?
  
  // Organization
  status      SourceStatus @default(ACTIVE)
  
  // Timestamps
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt
  
  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  questions   Question[]
  
  @@unique([tenantId, name])
  @@index([tenantId, type])
  @@map("question_sources")
}

enum SourceType {
  BOARD_EXAM      // SSC/HSC Board Questions
  TEXTBOOK        // NCTB/Other textbooks
  REFERENCE_BOOK  // Guide books
  CUSTOM          // Teacher created
  PREVIOUS_YEAR   // Previous year exams
  MOCK_TEST       // Mock test questions
}

enum SourceStatus {
  ACTIVE
  INACTIVE
}
```

### 5. Question Model (New)

```prisma
model Question {
  id              String   @id @default(cuid())
  tenantId        String
  
  // Links
  topicId         String
  sourceId        String?  // Optional question source
  
  // Question Content
  questionText    String   @db.Text
  questionType    QuestionType @default(MCQ)
  
  // MCQ Options (JSON array)
  // Format: [{ text: "Option A", isCorrect: true }, ...]
  options         String?  @db.Text
  
  // Answer (for non-MCQ)
  correctAnswer   String?  @db.Text
  explanation     String?  @db.Text
  
  // Metadata
  difficulty      DifficultyLevel @default(MEDIUM)
  marks           Float    @default(1)
  negativeMarks   Float    @default(0)
  
  // Media
  imageUrl        String?
  
  // Organization
  status          QuestionStatus @default(ACTIVE)
  
  // Timestamps
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt
  
  // Relations
  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  topic           Topic    @relation(fields: [topicId], references: [id], onDelete: Cascade)
  source          QuestionSource? @relation(fields: [sourceId], references: [id], onDelete: SetNull)
  
  @@index([tenantId, topicId])
  @@index([tenantId, sourceId])
  @@index([tenantId, difficulty])
  @@map("questions")
}

enum QuestionType {
  MCQ             // Multiple Choice
  TRUE_FALSE      // True/False
  SHORT_ANSWER    // Short answer
  LONG_ANSWER     // Descriptive
  FILL_BLANK      // Fill in the blanks
  MATCHING        // Match the following
}

enum DifficultyLevel {
  EASY
  MEDIUM
  HARD
  EXPERT
}

enum QuestionStatus {
  ACTIVE
  INACTIVE
  ARCHIVED
}
```

### 6. Update Course Model (Existing)

```prisma
model Course {
  id                   String   @id @default(cuid())
  tenantId             String
  
  // Basic Info
  title                String
  slug                 String
  description          String?
  shortDescription     String?
  
  // ✅ NEW: Academic Integration
  classId              String?  // Link to Class
  subjectId            String?  // Link to Subject
  streamId             String?  // Link to Stream
  
  // Category (Optional - for public courses)
  categoryId           String?
  
  // ... rest of existing fields
  
  // Relations
  tenant               Tenant            @relation(...)
  
  // ✅ NEW: Academic Relations
  class                Class?            @relation(fields: [classId], references: [id], onDelete: SetNull)
  subject              Subject?          @relation(fields: [subjectId], references: [id], onDelete: SetNull)
  stream               Stream?           @relation(fields: [streamId], references: [id], onDelete: SetNull)
  
  category             CourseCategory?   @relation(...)
  // ... rest of existing relations
  
  @@unique([tenantId, slug])
  @@index([tenantId, classId, subjectId, streamId])
  @@map("courses")
}
```

---

## 🧭 Left Navigation Structure

### Updated Navigation (app/(dashboard)/layout.tsx)

```typescript
const navigation = [
  {
    name: 'Dashboard',
    href: '/dashboard',
    icon: LayoutDashboard,
  },
  {
    name: 'Academic Setup',
    icon: GraduationCap,
    children: [
      { name: 'Branches', href: '/academic-setup/branches' },
      { name: 'Academic Years', href: '/academic-setup/academic-years' },
      { name: 'Streams', href: '/academic-setup/streams' },
      { name: 'Classes', href: '/academic-setup/classes' },
      { name: 'Subjects', href: '/academic-setup/subjects' },  // ✅ NEW
      { name: 'Cohorts', href: '/academic-setup/cohorts' },
      { name: 'Sections', href: '/academic-setup/sections' },
      { name: 'Routine', href: '/academic-setup/routine' },
    ],
  },
  {
    name: 'Course Management',
    icon: BookOpen,
    children: [
      { name: 'Categories', href: '/course-management/categories' },
      { name: 'Courses', href: '/course-management/courses' },
    ],
  },
  {
    name: 'Question Bank',  // ✅ NEW
    icon: HelpCircle,
    children: [
      { name: 'Subjects', href: '/question-bank/subjects' },        // View only
      { name: 'Chapters', href: '/question-bank/chapters' },        // ✅ NEW
      { name: 'Topics', href: '/question-bank/topics' },            // ✅ NEW
      { name: 'Question Sources', href: '/question-bank/sources' }, // ✅ NEW
      { name: 'Questions', href: '/question-bank/questions' },      // ✅ NEW
    ],
  },
  {
    name: 'Students',
    icon: Users,
    children: [
      { name: 'All Students', href: '/students' },
      { name: 'Add Student', href: '/students/new' },
    ],
  },
]
```

---

## 📅 Implementation Phases

### **Phase 1: Subject Management (Week 1)**
1. ✅ Create Subject model in Prisma schema
2. ✅ Run migration
3. ✅ Create server actions (CRUD)
4. ✅ Build Subject management page under Academic Setup
5. ✅ Add to left navigation
6. ✅ Test RBAC + dark mode

### **Phase 2: Course Academic Integration (Week 2)**
1. ✅ Update Course model (add classId, subjectId, streamId)
2. ✅ Run migration
3. ✅ Update Course form (add Class, Subject, Stream dropdowns)
4. ✅ Update Course list filters
5. ✅ Update server actions
6. ✅ Test isolation (Class 8 Math ≠ Class 9 Math)

### **Phase 3: Question Bank Foundation (Week 3)**
1. ✅ Create Chapter, Topic, QuestionSource models
2. ✅ Run migration
3. ✅ Create server actions for Chapter/Topic/Source
4. ✅ Build Chapter management page
5. ✅ Build Topic management page
6. ✅ Build Question Source management page
7. ✅ Add Question Bank to left navigation

### **Phase 4: Question Management (Week 4)**
1. ✅ Create Question model
2. ✅ Run migration
3. ✅ Create server actions for Questions
4. ✅ Build Question creation form (MCQ, True/False, etc.)
5. ✅ Build Question list page with filters
6. ✅ Add image upload support
7. ✅ Test all question types

### **Phase 5: Integration & Polish (Week 5)**
1. ✅ Connect Question Bank with Exam module (future)
2. ✅ Add bulk import (CSV/Excel)
3. ✅ Add question preview
4. ✅ Performance optimization
5. ✅ Comprehensive testing
6. ✅ Documentation

---

## 📐 Subject Management

### Page: `/academic-setup/subjects`

#### UI Design

**Header Section:**
```tsx
<div className="flex items-center justify-between mb-6">
  <div>
    <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-orange-500 bg-clip-text text-transparent">
      Subject Management
    </h1>
    <p className="text-sm text-slate-600 dark:text-slate-400">
      Manage subjects across all classes
    </p>
  </div>
  <Button onClick={() => setAddDialogOpen(true)}>
    <Plus className="h-4 w-4 mr-2" />
    Add Subject
  </Button>
</div>
```

**Table Columns:**
- Icon (visual)
- Name
- Code
- Status (badge)
- Courses Count (computed)
- Chapters Count (computed)
- Actions (Edit, Delete)

**Form Fields:**
- Name * (max 100 chars)
- Code (max 20 chars)
- Icon (emoji or icon name, max 50 chars)
- Color (color picker)
- Description (max 500 chars)
- Status (Active/Inactive)

#### Server Actions

**File:** `lib/actions/subject.actions.ts`

```typescript
'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

export async function createSubject(data: {
  name: string
  code?: string
  description?: string
  icon?: string
  color?: string
}) {
  await requireRole('ADMIN')
  const tenantId = await getTenantId()

  const schema = z.object({
    name: z.string().min(1).max(100),
    code: z.string().max(20).optional(),
    description: z.string().max(500).optional(),
    icon: z.string().max(50).optional(),
    color: z.string().max(20).optional(),
  })

  const validated = schema.parse(data)

  const subject = await prisma.subject.create({
    data: { ...validated, tenantId, status: 'ACTIVE' },
  })

  revalidatePath('/academic-setup/subjects')
  return { success: true, subjectId: subject.id }
}

// Similar patterns for update, delete, get
```

---

## 🎓 Course Academic Integration

### Updated Course Form

**File:** `app/(dashboard)/course-management/courses/[id]/edit/page.tsx`

#### New Fields in "Basic Info" Tab

```tsx
{/* ✅ NEW: Academic Integration Section */}
<div className="col-span-2 border-t pt-6 mt-6">
  <h3 className="text-lg font-semibold mb-4">
    Academic Integration (Optional)
  </h3>
  <p className="text-sm text-slate-600 dark:text-slate-400 mb-4">
    Link this course to academic structure
  </p>
</div>

<FormField name="classId">
  <FormLabel>Class</FormLabel>
  <FormControl>
    <SearchableDropdown
      options={classes.map(cls => ({
        value: cls.id,
        label: cls.name,
      }))}
      placeholder="Select class (optional)"
    />
  </FormControl>
</FormField>

<FormField name="subjectId">
  <FormLabel>Subject</FormLabel>
  <FormControl>
    <SearchableDropdown
      options={subjects.map(subject => ({
        value: subject.id,
        label: `${subject.icon || ''} ${subject.name}`,
      }))}
      placeholder="Select subject (optional)"
    />
  </FormControl>
</FormField>

<FormField name="streamId">
  <FormLabel>Stream</FormLabel>
  <FormControl>
    <SearchableDropdown
      options={streams.map(stream => ({
        value: stream.id,
        label: stream.name,
      }))}
      placeholder="Select stream (optional)"
    />
  </FormControl>
</FormField>
```

#### Updated Course List Filters

```tsx
<div className="grid grid-cols-1 md:grid-cols-5 gap-4 mb-6">
  <Input placeholder="Search courses..." />

  <SearchableDropdown
    options={classes}
    placeholder="Filter by class"
  />

  <SearchableDropdown
    options={subjects}
    placeholder="Filter by subject"
  />

  <SearchableDropdown
    options={streams}
    placeholder="Filter by stream"
  />

  <SearchableDropdown
    options={[
      { value: 'DRAFT', label: 'Draft' },
      { value: 'PUBLISHED', label: 'Published' },
    ]}
    placeholder="Filter by status"
  />
</div>
```

---

## 🗂️ Question Bank System

### 1. Chapter Management

**Page:** `/question-bank/chapters`

**Hierarchy:** Subject → Class → Chapter

**Form Fields:**
- Subject * (dropdown)
- Class * (dropdown)
- Chapter Name * (max 100 chars)
- Code (max 20 chars)
- Description (max 500 chars)
- Order (number)
- Status (Active/Inactive)

**Table Columns:**
- Subject (badge with icon)
- Class (badge)
- Chapter Name
- Code
- Topics Count
- Questions Count
- Status
- Actions

**Server Action Pattern:**
```typescript
export async function createChapter(data: {
  subjectId: string
  classId: string
  name: string
  code?: string
  description?: string
}) {
  await requireRole(['ADMIN', 'TEACHER'])
  const tenantId = await getTenantId()

  // Validation
  const schema = z.object({
    subjectId: z.string().min(1),
    classId: z.string().min(1),
    name: z.string().min(1).max(100),
    code: z.string().max(20).optional(),
    description: z.string().max(500).optional(),
  })

  const validated = schema.parse(data)

  // Check duplicate
  const existing = await prisma.chapter.findFirst({
    where: {
      tenantId,
      subjectId: validated.subjectId,
      classId: validated.classId,
      name: validated.name,
    },
  })

  if (existing) {
    return { success: false, error: 'Chapter already exists' }
  }

  const chapter = await prisma.chapter.create({
    data: { ...validated, tenantId, status: 'ACTIVE' },
  })

  revalidatePath('/question-bank/chapters')
  return { success: true, chapterId: chapter.id }
}
```

---

### 2. Topic Management

**Page:** `/question-bank/topics`

**Hierarchy:** Subject → Class → Chapter → Topic

**Form Fields:**
- Subject * (dropdown, auto-filter chapters)
- Class * (dropdown, auto-filter chapters)
- Chapter * (dropdown)
- Topic Name * (max 100 chars)
- Code (max 20 chars)
- Description (max 500 chars)
- Order (number)
- Status (Active/Inactive)

**Cascading Dropdowns:**
```tsx
// When subject changes, filter classes
useEffect(() => {
  if (selectedSubject) {
    const filteredClasses = classes.filter(cls =>
      chapters.some(ch => ch.subjectId === selectedSubject && ch.classId === cls.id)
    )
    setAvailableClasses(filteredClasses)
  }
}, [selectedSubject])

// When subject + class changes, filter chapters
useEffect(() => {
  if (selectedSubject && selectedClass) {
    const filteredChapters = chapters.filter(ch =>
      ch.subjectId === selectedSubject && ch.classId === selectedClass
    )
    setAvailableChapters(filteredChapters)
  }
}, [selectedSubject, selectedClass])
```

---

### 3. Question Source Management

**Page:** `/question-bank/sources`

**Form Fields:**
- Source Name * (max 100 chars) - e.g., "SSC Board 2023"
- Source Type * (dropdown)
  - Board Exam
  - Textbook
  - Reference Book
  - Custom
  - Previous Year
  - Mock Test
- Year (number, optional) - e.g., 2023
- Description (max 500 chars)
- Status (Active/Inactive)

**Table Columns:**
- Source Name
- Type (badge)
- Year
- Questions Count
- Status
- Actions

---

### 4. Question Management

**Page:** `/question-bank/questions`

**Form Fields:**

**Step 1: Question Location**
```tsx
<FormField name="subjectId">
  <FormLabel>Subject *</FormLabel>
  <SearchableDropdown options={subjects} />
</FormField>

<FormField name="classId">
  <FormLabel>Class *</FormLabel>
  <SearchableDropdown options={classes} />
</FormField>

<FormField name="chapterId">
  <FormLabel>Chapter *</FormLabel>
  <SearchableDropdown options={filteredChapters} />
</FormField>

<FormField name="topicId">
  <FormLabel>Topic *</FormLabel>
  <SearchableDropdown options={filteredTopics} />
</FormField>
```

**Step 2: Question Details**
```tsx
<FormField name="questionType">
  <FormLabel>Question Type *</FormLabel>
  <SearchableDropdown
    options={[
      { value: 'MCQ', label: 'Multiple Choice' },
      { value: 'TRUE_FALSE', label: 'True/False' },
      { value: 'SHORT_ANSWER', label: 'Short Answer' },
      { value: 'LONG_ANSWER', label: 'Long Answer' },
      { value: 'FILL_BLANK', label: 'Fill in the Blanks' },
      { value: 'MATCHING', label: 'Matching' },
    ]}
  />
</FormField>

<FormField name="questionText">
  <FormLabel>Question *</FormLabel>
  <Textarea maxLength={2000} rows={4} />
</FormField>

<FormField name="imageUrl">
  <FormLabel>Question Image (Optional)</FormLabel>
  <Input type="file" accept="image/*" />
</FormField>
```

**Step 3: Answer (Dynamic based on question type)**

**For MCQ:**
```tsx
<div className="space-y-4">
  <FormLabel>Options *</FormLabel>
  {options.map((option, index) => (
    <div key={index} className="flex gap-2">
      <Input
        placeholder={`Option ${index + 1}`}
        value={option.text}
        onChange={(e) => updateOption(index, 'text', e.target.value)}
      />
      <Checkbox
        checked={option.isCorrect}
        onCheckedChange={(checked) => updateOption(index, 'isCorrect', checked)}
      />
      <Label>Correct</Label>
      <Button
        type="button"
        variant="ghost"
        size="sm"
        onClick={() => removeOption(index)}
      >
        <X className="h-4 w-4" />
      </Button>
    </div>
  ))}
  <Button type="button" onClick={addOption}>
    <Plus className="h-4 w-4 mr-2" />
    Add Option
  </Button>
</div>
```

**For True/False:**
```tsx
<FormField name="correctAnswer">
  <FormLabel>Correct Answer *</FormLabel>
  <SearchableDropdown
    options={[
      { value: 'TRUE', label: 'True' },
      { value: 'FALSE', label: 'False' },
    ]}
  />
</FormField>
```

**For Short/Long Answer:**
```tsx
<FormField name="correctAnswer">
  <FormLabel>Model Answer *</FormLabel>
  <Textarea maxLength={2000} rows={6} />
</FormField>
```

**Step 4: Metadata**
```tsx
<FormField name="difficulty">
  <FormLabel>Difficulty *</FormLabel>
  <SearchableDropdown
    options={[
      { value: 'EASY', label: '⭐ Easy' },
      { value: 'MEDIUM', label: '⭐⭐ Medium' },
      { value: 'HARD', label: '⭐⭐⭐ Hard' },
      { value: 'EXPERT', label: '⭐⭐⭐⭐ Expert' },
    ]}
  />
</FormField>

<FormField name="marks">
  <FormLabel>Marks *</FormLabel>
  <Input type="number" min={0} max={100} step={0.5} />
</FormField>

<FormField name="negativeMarks">
  <FormLabel>Negative Marks</FormLabel>
  <Input type="number" min={0} max={10} step={0.25} />
</FormField>

<FormField name="sourceId">
  <FormLabel>Question Source (Optional)</FormLabel>
  <SearchableDropdown options={sources} />
</FormField>

<FormField name="explanation">
  <FormLabel>Explanation (Optional)</FormLabel>
  <Textarea maxLength={1000} rows={4} />
</FormField>
```

---

## 🔧 Server Actions Reference

### File Structure

```
lib/actions/
├── subject.actions.ts          # Subject CRUD
├── chapter.actions.ts          # Chapter CRUD
├── topic.actions.ts            # Topic CRUD
├── question-source.actions.ts  # Question Source CRUD
├── question.actions.ts         # Question CRUD
└── course.actions.ts           # Update existing (add academic fields)
```

### Question Actions (Complete Example)

**File:** `lib/actions/question.actions.ts`

```typescript
'use server'

import { requireRole, getTenantId } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import { revalidatePath } from 'next/cache'
import { z } from 'zod'

// Create Question
export async function createQuestion(data: {
  topicId: string
  questionText: string
  questionType: 'MCQ' | 'TRUE_FALSE' | 'SHORT_ANSWER' | 'LONG_ANSWER' | 'FILL_BLANK' | 'MATCHING'
  options?: { text: string; isCorrect: boolean }[]
  correctAnswer?: string
  explanation?: string
  difficulty: 'EASY' | 'MEDIUM' | 'HARD' | 'EXPERT'
  marks: number
  negativeMarks?: number
  sourceId?: string
  imageUrl?: string
}) {
  await requireRole(['ADMIN', 'TEACHER'])
  const tenantId = await getTenantId()

  // Validation
  const schema = z.object({
    topicId: z.string().min(1),
    questionText: z.string().min(1).max(2000),
    questionType: z.enum(['MCQ', 'TRUE_FALSE', 'SHORT_ANSWER', 'LONG_ANSWER', 'FILL_BLANK', 'MATCHING']),
    options: z.array(z.object({
      text: z.string().min(1).max(500),
      isCorrect: z.boolean(),
    })).optional(),
    correctAnswer: z.string().max(2000).optional(),
    explanation: z.string().max(1000).optional(),
    difficulty: z.enum(['EASY', 'MEDIUM', 'HARD', 'EXPERT']),
    marks: z.number().min(0).max(100),
    negativeMarks: z.number().min(0).max(10).optional(),
    sourceId: z.string().optional(),
    imageUrl: z.string().optional(),
  })

  const validated = schema.parse(data)

  // Ownership check (topic belongs to tenant)
  const topic = await prisma.topic.findFirst({
    where: { id: validated.topicId, tenantId },
  })

  if (!topic) {
    return { success: false, error: 'Topic not found' }
  }

  // Validate MCQ options
  if (validated.questionType === 'MCQ') {
    if (!validated.options || validated.options.length < 2) {
      return { success: false, error: 'MCQ must have at least 2 options' }
    }

    const correctCount = validated.options.filter(opt => opt.isCorrect).length
    if (correctCount === 0) {
      return { success: false, error: 'MCQ must have at least one correct answer' }
    }
  }

  // Create question
  const question = await prisma.question.create({
    data: {
      tenantId,
      topicId: validated.topicId,
      questionText: validated.questionText,
      questionType: validated.questionType,
      options: validated.options ? JSON.stringify(validated.options) : null,
      correctAnswer: validated.correctAnswer,
      explanation: validated.explanation,
      difficulty: validated.difficulty,
      marks: validated.marks,
      negativeMarks: validated.negativeMarks || 0,
      sourceId: validated.sourceId,
      imageUrl: validated.imageUrl,
      status: 'ACTIVE',
    },
  })

  revalidatePath('/question-bank/questions')
  return { success: true, questionId: question.id }
}

// Get Questions with Filters
export async function getQuestions(filters?: {
  subjectId?: string
  classId?: string
  chapterId?: string
  topicId?: string
  difficulty?: string
  questionType?: string
  sourceId?: string
  search?: string
  page?: number
  pageSize?: number
}) {
  await requireRole(['ADMIN', 'TEACHER'])
  const tenantId = await getTenantId()

  const page = filters?.page || 1
  const pageSize = filters?.pageSize || 20
  const skip = (page - 1) * pageSize

  // Build where clause
  const where: any = { tenantId, status: 'ACTIVE' }

  if (filters?.topicId) {
    where.topicId = filters.topicId
  } else if (filters?.chapterId) {
    where.topic = { chapterId: filters.chapterId }
  } else if (filters?.classId && filters?.subjectId) {
    where.topic = {
      chapter: {
        classId: filters.classId,
        subjectId: filters.subjectId,
      },
    }
  }

  if (filters?.difficulty) {
    where.difficulty = filters.difficulty
  }

  if (filters?.questionType) {
    where.questionType = filters.questionType
  }

  if (filters?.sourceId) {
    where.sourceId = filters.sourceId
  }

  if (filters?.search) {
    where.questionText = {
      contains: filters.search,
      mode: 'insensitive',
    }
  }

  // Get questions with pagination
  const [questions, total] = await Promise.all([
    prisma.question.findMany({
      where,
      include: {
        topic: {
          include: {
            chapter: {
              include: {
                subject: true,
                class: true,
              },
            },
          },
        },
        source: true,
      },
      orderBy: { createdAt: 'desc' },
      skip,
      take: pageSize,
    }),
    prisma.question.count({ where }),
  ])

  return {
    questions,
    pagination: {
      page,
      pageSize,
      total,
      totalPages: Math.ceil(total / pageSize),
    },
  }
}

// Bulk Import Questions (CSV/Excel)
export async function bulkImportQuestions(data: {
  topicId: string
  questions: Array<{
    questionText: string
    questionType: string
    options?: string // JSON string
    correctAnswer?: string
    difficulty: string
    marks: number
  }>
}) {
  await requireRole(['ADMIN', 'TEACHER'])
  const tenantId = await getTenantId()

  // Ownership check
  const topic = await prisma.topic.findFirst({
    where: { id: data.topicId, tenantId },
  })

  if (!topic) {
    return { success: false, error: 'Topic not found' }
  }

  // Bulk create
  const created = await prisma.$transaction(
    data.questions.map(q =>
      prisma.question.create({
        data: {
          tenantId,
          topicId: data.topicId,
          questionText: q.questionText,
          questionType: q.questionType as any,
          options: q.options,
          correctAnswer: q.correctAnswer,
          difficulty: q.difficulty as any,
          marks: q.marks,
          status: 'ACTIVE',
        },
      })
    )
  )

  revalidatePath('/question-bank/questions')
  return { success: true, count: created.length }
}
```

---

## 🎨 UI/UX Design Patterns

### Question List Page

**Layout:**
```tsx
<div className="space-y-6">
  {/* Header */}
  <div className="flex items-center justify-between">
    <div>
      <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-orange-500 bg-clip-text text-transparent">
        Question Bank
      </h1>
      <p className="text-sm text-slate-600 dark:text-slate-400">
        Manage questions for exams and quizzes
      </p>
    </div>
    <div className="flex gap-2">
      <Button variant="outline" onClick={() => setImportDialogOpen(true)}>
        <Upload className="h-4 w-4 mr-2" />
        Import CSV
      </Button>
      <Button onClick={() => setAddDialogOpen(true)}>
        <Plus className="h-4 w-4 mr-2" />
        Add Question
      </Button>
    </div>
  </div>

  {/* Filters */}
  <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
    <SearchableDropdown
      options={subjects}
      placeholder="Filter by subject"
      value={subjectFilter}
      onChange={setSubjectFilter}
    />

    <SearchableDropdown
      options={classes}
      placeholder="Filter by class"
      value={classFilter}
      onChange={setClassFilter}
    />

    <SearchableDropdown
      options={chapters}
      placeholder="Filter by chapter"
      value={chapterFilter}
      onChange={setChapterFilter}
    />

    <SearchableDropdown
      options={topics}
      placeholder="Filter by topic"
      value={topicFilter}
      onChange={setTopicFilter}
    />

    <SearchableDropdown
      options={[
        { value: 'EASY', label: '⭐ Easy' },
        { value: 'MEDIUM', label: '⭐⭐ Medium' },
        { value: 'HARD', label: '⭐⭐⭐ Hard' },
        { value: 'EXPERT', label: '⭐⭐⭐⭐ Expert' },
      ]}
      placeholder="Filter by difficulty"
      value={difficultyFilter}
      onChange={setDifficultyFilter}
    />
  </div>

  {/* Search */}
  <Input
    placeholder="Search questions..."
    value={searchQuery}
    onChange={(e) => setSearchQuery(e.target.value)}
    className="max-w-md"
  />

  {/* Question Cards */}
  <div className="space-y-4">
    {questions.map(question => (
      <Card key={question.id} className="dark:bg-slate-800/50">
        <CardContent className="p-6">
          <div className="flex items-start justify-between">
            <div className="flex-1">
              {/* Question Header */}
              <div className="flex items-center gap-2 mb-3">
                <Badge variant="outline" className="dark:border-slate-600">
                  {question.topic.chapter.subject.icon} {question.topic.chapter.subject.name}
                </Badge>
                <Badge variant="outline" className="dark:border-slate-600">
                  {question.topic.chapter.class.name}
                </Badge>
                <Badge variant="outline" className="dark:border-slate-600">
                  {question.topic.chapter.name}
                </Badge>
                <Badge variant="outline" className="dark:border-slate-600">
                  {question.topic.name}
                </Badge>
                <Badge
                  variant={
                    question.difficulty === 'EASY' ? 'default' :
                    question.difficulty === 'MEDIUM' ? 'secondary' :
                    question.difficulty === 'HARD' ? 'destructive' : 'outline'
                  }
                >
                  {question.difficulty}
                </Badge>
                <Badge variant="outline">
                  {question.questionType}
                </Badge>
              </div>

              {/* Question Text */}
              <p className="text-slate-900 dark:text-slate-100 mb-3">
                {question.questionText}
              </p>

              {/* Question Image */}
              {question.imageUrl && (
                <img
                  src={question.imageUrl}
                  alt="Question"
                  className="max-w-md rounded-lg mb-3"
                />
              )}

              {/* MCQ Options */}
              {question.questionType === 'MCQ' && question.options && (
                <div className="space-y-2 mb-3">
                  {JSON.parse(question.options).map((option: any, index: number) => (
                    <div
                      key={index}
                      className={`flex items-center gap-2 p-2 rounded ${
                        option.isCorrect
                          ? 'bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800'
                          : 'bg-slate-50 dark:bg-slate-800 border border-slate-200 dark:border-slate-700'
                      }`}
                    >
                      <span className="font-medium">{String.fromCharCode(65 + index)}.</span>
                      <span className="dark:text-slate-200">{option.text}</span>
                      {option.isCorrect && (
                        <Check className="h-4 w-4 text-green-600 dark:text-green-400 ml-auto" />
                      )}
                    </div>
                  ))}
                </div>
              )}

              {/* Metadata */}
              <div className="flex items-center gap-4 text-sm text-slate-600 dark:text-slate-400">
                <span>Marks: {question.marks}</span>
                {question.negativeMarks > 0 && (
                  <span>Negative: -{question.negativeMarks}</span>
                )}
                {question.source && (
                  <span>Source: {question.source.name}</span>
                )}
              </div>
            </div>

            {/* Actions */}
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleEdit(question)}
              >
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => handleDelete(question.id)}
              >
                <Trash className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    ))}
  </div>

  {/* Pagination */}
  <div className="flex items-center justify-between">
    <p className="text-sm text-slate-600 dark:text-slate-400">
      Showing {(page - 1) * pageSize + 1} to {Math.min(page * pageSize, total)} of {total} questions
    </p>
    <div className="flex gap-2">
      <Button
        variant="outline"
        size="sm"
        disabled={page === 1}
        onClick={() => setPage(page - 1)}
      >
        Previous
      </Button>
      <Button
        variant="outline"
        size="sm"
        disabled={page === totalPages}
        onClick={() => setPage(page + 1)}
      >
        Next
      </Button>
    </div>
  </div>
</div>
```

---

## ✅ Testing Checklist

### Phase 1: Subject Management
- [ ] Create subject with all fields
- [ ] Create subject with duplicate name (should fail)
- [ ] Update subject name
- [ ] Update subject status to INACTIVE
- [ ] Delete subject (should fail if courses exist)
- [ ] Delete subject (should fail if chapters exist)
- [ ] Delete subject (should succeed if no dependencies)
- [ ] Filter subjects by status
- [ ] Search subjects by name
- [ ] Dark mode rendering
- [ ] RBAC: ADMIN can create/edit/delete
- [ ] RBAC: TEACHER cannot create/edit/delete

### Phase 2: Course Academic Integration
- [ ] Create course with Class + Subject + Stream
- [ ] Create course without academic fields (optional)
- [ ] Filter courses by Class
- [ ] Filter courses by Subject
- [ ] Filter courses by Stream
- [ ] Verify Class 8 Math ≠ Class 9 Math (isolation)
- [ ] Update course academic fields
- [ ] Display academic badges in course list
- [ ] Dark mode rendering

### Phase 3: Question Bank Foundation
- [ ] Create chapter for Subject + Class
- [ ] Create chapter with duplicate name (should fail)
- [ ] Create topic for Chapter
- [ ] Create topic with duplicate name (should fail)
- [ ] Create question source
- [ ] Filter chapters by Subject + Class
- [ ] Filter topics by Chapter
- [ ] Cascading dropdowns work correctly
- [ ] Delete chapter (should fail if topics exist)
- [ ] Delete topic (should fail if questions exist)

### Phase 4: Question Management
- [ ] Create MCQ question with 4 options
- [ ] Create MCQ with no correct answer (should fail)
- [ ] Create True/False question
- [ ] Create Short Answer question
- [ ] Create Long Answer question
- [ ] Upload question image
- [ ] Filter questions by Subject + Class + Chapter + Topic
- [ ] Filter questions by Difficulty
- [ ] Filter questions by Question Type
- [ ] Search questions by text
- [ ] Pagination works correctly
- [ ] Edit question
- [ ] Delete question
- [ ] Bulk import questions (CSV)

### Phase 5: Integration
- [ ] Question Bank → Exam integration (future)
- [ ] Performance: Load 1000+ questions
- [ ] Performance: Filter with multiple criteria
- [ ] Mobile responsiveness
- [ ] Dark mode all pages
- [ ] RBAC all pages

---

## 📋 Quick Reference Checklist

### For Every New Model

```typescript
// ✅ 1. Add to Prisma schema
model YourModel {
  id        String   @id @default(cuid())
  tenantId  String   // ✅ ALWAYS include

  // Your fields

  tenant    Tenant   @relation(...)

  @@unique([tenantId, yourUniqueField])
  @@map("your_table_name")
}

// ✅ 2. Add relation to Tenant model
model Tenant {
  // ...
  yourModels YourModel[]
}

// ✅ 3. Run migration
// npx prisma generate
// npx prisma migrate dev --name add_your_model
```

### For Every Server Action

```typescript
export async function yourAction(data: YourInput) {
  // ✅ 1. ROLE GUARD
  await requireRole(['ADMIN', 'TEACHER'])

  // ✅ 2. TENANT ID
  const tenantId = await getTenantId()

  // ✅ 3. ZOD VALIDATION
  const schema = z.object({
    field: z.string().min(1).max(100),
  })
  const validated = schema.parse(data)

  // ✅ 4. OWNERSHIP CHECK (for update/delete)
  const entity = await prisma.entity.findFirst({
    where: { id: data.id, tenantId }
  })
  if (!entity) {
    return { success: false, error: 'Not found' }
  }

  // ✅ 5. TENANT ISOLATION (all queries)
  await prisma.entity.create({
    data: { ...validated, tenantId }
  })

  // ✅ 6. REVALIDATE PATH
  revalidatePath('/your-page')

  // ✅ 7. RETURN CONSISTENT FORMAT
  return { success: true, data: entity }
}
```

### For Every Page Component

```tsx
// ✅ 1. Server Component for data fetch
export default async function YourPage() {
  const data = await getData()
  return <YourClientComponent data={data} />
}

// ✅ 2. Client Component for interactivity
'use client'

export function YourClientComponent({ data }) {
  // State, handlers, etc.

  return (
    <div>
      {/* ✅ 3. Header with gradient */}
      <h1 className="text-2xl font-bold bg-gradient-to-r from-violet-600 to-orange-500 bg-clip-text text-transparent">
        Your Page
      </h1>

      {/* ✅ 4. Filters with SearchableDropdown */}
      <SearchableDropdown options={...} />

      {/* ✅ 5. Table with dark mode */}
      <Table>
        <TableHeader className="dark:bg-slate-800">
          <TableRow className="dark:border-slate-700">
            <TableHead className="dark:text-slate-200">Name</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          <TableRow className="dark:border-slate-700">
            <TableCell className="dark:text-slate-200">Value</TableCell>
          </TableRow>
        </TableBody>
      </Table>

      {/* ✅ 6. Delete with AlertDialog */}
      <AlertDialog>
        <AlertDialogContent>
          <AlertDialogTitle>Delete Item</AlertDialogTitle>
          <AlertDialogDescription>
            Are you sure? This action cannot be undone.
          </AlertDialogDescription>
          <AlertDialogFooter>
            <AlertDialogCancel>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-red-600 hover:bg-red-700"
            >
              Delete
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
```

---

## 🚀 Implementation Steps (Week by Week)

### Week 1: Subject Management

**Day 1-2: Database**
```bash
# 1. Add Subject model to prisma/schema.prisma
# 2. Add relation to Tenant model
# 3. Run migration
npx prisma generate
npx prisma migrate dev --name add_subject_model
```

**Day 3-4: Server Actions**
```bash
# Create lib/actions/subject.actions.ts
# Implement: createSubject, updateSubject, deleteSubject, getSubjects
```

**Day 5-7: UI**
```bash
# Create app/(dashboard)/academic-setup/subjects/page.tsx
# Create app/(dashboard)/academic-setup/subjects/subjects-client.tsx
# Add to navigation
# Test RBAC + dark mode
```

---

### Week 2: Course Academic Integration

**Day 1-2: Database**
```bash
# 1. Add classId, subjectId, streamId to Course model
# 2. Add relations
# 3. Run migration
npx prisma migrate dev --name add_course_academic_fields
```

**Day 3-4: Update Course Form**
```bash
# Update app/(dashboard)/course-management/courses/[id]/edit/page.tsx
# Add Class, Subject, Stream dropdowns
# Update server actions
```

**Day 5-7: Update Course List**
```bash
# Update app/(dashboard)/course-management/courses/page.tsx
# Add academic filters
# Add academic badges to table
# Test isolation (Class 8 Math ≠ Class 9 Math)
```

---

### Week 3: Question Bank Foundation

**Day 1-2: Database**
```bash
# 1. Add Chapter, Topic, QuestionSource models
# 2. Add relations
# 3. Run migration
npx prisma migrate dev --name add_question_bank_foundation
```

**Day 3-4: Server Actions**
```bash
# Create lib/actions/chapter.actions.ts
# Create lib/actions/topic.actions.ts
# Create lib/actions/question-source.actions.ts
```

**Day 5-7: UI**
```bash
# Create app/(dashboard)/question-bank/chapters/page.tsx
# Create app/(dashboard)/question-bank/topics/page.tsx
# Create app/(dashboard)/question-bank/sources/page.tsx
# Add to navigation
```

---

### Week 4: Question Management

**Day 1-2: Database**
```bash
# 1. Add Question model
# 2. Add relations
# 3. Run migration
npx prisma migrate dev --name add_question_model
```

**Day 3-5: Server Actions**
```bash
# Create lib/actions/question.actions.ts
# Implement: createQuestion, updateQuestion, deleteQuestion, getQuestions
# Implement: bulkImportQuestions
```

**Day 6-7: UI**
```bash
# Create app/(dashboard)/question-bank/questions/page.tsx
# Create question form (MCQ, True/False, etc.)
# Add image upload
# Test all question types
```

---

### Week 5: Polish & Testing

**Day 1-2: Performance**
```bash
# Add pagination to all lists
# Optimize queries (avoid N+1)
# Add loading states
```

**Day 3-4: Bulk Import**
```bash
# Create CSV import dialog
# Implement CSV parser
# Test with sample data
```

**Day 5-7: Testing & Documentation**
```bash
# Run all test cases
# Fix bugs
# Update documentation
# Create demo video
```

---

## 📊 Database Migration Summary

### Migration 1: Add Subject Model
```sql
CREATE TABLE "subjects" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "icon" TEXT,
  "color" TEXT,
  "order" INTEGER DEFAULT 0,
  "status" TEXT DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
);

CREATE UNIQUE INDEX "subjects_tenantId_name_key" ON "subjects"("tenantId", "name");
CREATE UNIQUE INDEX "subjects_tenantId_code_key" ON "subjects"("tenantId", "code");
CREATE INDEX "subjects_tenantId_status_idx" ON "subjects"("tenantId", "status");
```

### Migration 2: Add Course Academic Fields
```sql
ALTER TABLE "courses" ADD COLUMN "classId" TEXT;
ALTER TABLE "courses" ADD COLUMN "subjectId" TEXT;
ALTER TABLE "courses" ADD COLUMN "streamId" TEXT;

CREATE INDEX "courses_tenantId_classId_subjectId_streamId_idx"
  ON "courses"("tenantId", "classId", "subjectId", "streamId");
```

### Migration 3: Add Question Bank Foundation
```sql
CREATE TABLE "chapters" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "subjectId" TEXT NOT NULL,
  "classId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "order" INTEGER DEFAULT 0,
  "status" TEXT DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
  FOREIGN KEY ("subjectId") REFERENCES "subjects"("id") ON DELETE CASCADE,
  FOREIGN KEY ("classId") REFERENCES "classes"("id") ON DELETE CASCADE
);

CREATE TABLE "topics" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "chapterId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "code" TEXT,
  "description" TEXT,
  "order" INTEGER DEFAULT 0,
  "status" TEXT DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
  FOREIGN KEY ("chapterId") REFERENCES "chapters"("id") ON DELETE CASCADE
);

CREATE TABLE "question_sources" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "name" TEXT NOT NULL,
  "type" TEXT DEFAULT 'CUSTOM',
  "year" INTEGER,
  "description" TEXT,
  "status" TEXT DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE
);
```

### Migration 4: Add Question Model
```sql
CREATE TABLE "questions" (
  "id" TEXT PRIMARY KEY,
  "tenantId" TEXT NOT NULL,
  "topicId" TEXT NOT NULL,
  "sourceId" TEXT,
  "questionText" TEXT NOT NULL,
  "questionType" TEXT DEFAULT 'MCQ',
  "options" TEXT,
  "correctAnswer" TEXT,
  "explanation" TEXT,
  "difficulty" TEXT DEFAULT 'MEDIUM',
  "marks" REAL DEFAULT 1,
  "negativeMarks" REAL DEFAULT 0,
  "imageUrl" TEXT,
  "status" TEXT DEFAULT 'ACTIVE',
  "createdAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  "updatedAt" TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  FOREIGN KEY ("tenantId") REFERENCES "tenants"("id") ON DELETE CASCADE,
  FOREIGN KEY ("topicId") REFERENCES "topics"("id") ON DELETE CASCADE,
  FOREIGN KEY ("sourceId") REFERENCES "question_sources"("id") ON DELETE SET NULL
);

CREATE INDEX "questions_tenantId_topicId_idx" ON "questions"("tenantId", "topicId");
CREATE INDEX "questions_tenantId_sourceId_idx" ON "questions"("tenantId", "sourceId");
CREATE INDEX "questions_tenantId_difficulty_idx" ON "questions"("tenantId", "difficulty");
```

---

## 🎯 Key Architectural Decisions

### 1. Subject is Reusable, Course is Specific

**Subject:** "Mathematics" (reusable across all classes)
**Course:** "Class 8 Mathematics" (specific to Class 8)

**Why:**
- ✅ Subject name entered once, used everywhere
- ✅ Question Bank organized by Subject → Chapter → Topic
- ✅ Reporting by Subject across all classes
- ✅ Course still independent (Class 8 Math ≠ Class 9 Math)

### 2. Question Bank Hierarchy

**Structure:** Subject → Class → Chapter → Topic → Question

**Why:**
- ✅ Chapter belongs to specific Class (Class 8 Algebra ≠ Class 9 Algebra)
- ✅ Topic belongs to Chapter (Linear Equations under Algebra)
- ✅ Question belongs to Topic (specific question)
- ✅ Easy filtering and organization

### 3. Question Source is Optional

**Why:**
- ✅ Teachers can create custom questions (no source)
- ✅ Can track board exam questions (SSC 2023)
- ✅ Can track textbook questions (NCTB Book)
- ✅ Useful for copyright and attribution

### 4. Course Academic Fields are Optional

**Why:**
- ✅ Academic courses: Use Class + Subject + Stream
- ✅ Public courses: Use Category only
- ✅ Flexibility for different use cases
- ✅ No breaking changes to existing courses

---

## 📚 Related Documentation

- `COURSE_MANAGEMENT_IMPLEMENTATION_PLAN.md` - Course creation workflow
- `lms_subject_enrollment_plan.md` - ChatGPT plan (reference only)
- `.augment/rules/lms-rule.md` - Global architecture rules
- `PHASE_1_COMPLETE.md` - Academic Setup reference

---

## 🎓 Summary

### What We're Building

1. **Subject Management** - Reusable subjects across classes
2. **Course Academic Integration** - Link courses to Class + Subject + Stream
3. **Question Bank** - Hierarchical question organization
4. **Question Sources** - Track question origins
5. **Question Types** - MCQ, True/False, Short Answer, Long Answer, Fill Blank, Matching

### Key Benefits

1. ✅ **Reusability** - Subject name entered once, used everywhere
2. ✅ **Organization** - Clear hierarchy (Subject → Chapter → Topic → Question)
3. ✅ **Isolation** - Class 8 Math ≠ Class 9 Math (separate courses)
4. ✅ **Flexibility** - Academic fields optional for courses
5. ✅ **Scalability** - Ready for 10,000+ questions
6. ✅ **Future-Proof** - Ready for Exam module integration

### Timeline

- **Week 1:** Subject Management
- **Week 2:** Course Academic Integration
- **Week 3:** Question Bank Foundation
- **Week 4:** Question Management
- **Week 5:** Polish & Testing

**Total:** 5 weeks for complete implementation

---

**Documentation Created:** 2025-11-05
**Last Updated:** 2025-11-05
**Status:** ✅ **PLANNING COMPLETE - READY FOR IMPLEMENTATION**
**Next Step:** Start Week 1 - Subject Management

---

## 📞 Questions or Clarifications?

If you need clarification on any section:
1. Check the **Quick Reference Checklist** above
2. Review existing Academic Setup pages for patterns
3. Follow the week-by-week implementation steps
4. Ask specific questions about implementation details

**Remember:** Follow all Codex guidelines - TenantId + Role Guard + Validation + Dark Mode! 🔒

