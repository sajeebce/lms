# 📚 Course Management System - Implementation Plan

**Project:** LMS (Learning Management System)
**Module:** Course Management (Course Category & Course Creation)
**Date:** 2025-11-04
**Status:** 📋 **PLANNING PHASE**

---

## 📋 Table of Contents

1. [Overview](#-overview)
2. [Database Schema](#-database-schema)
3. [File Structure](#-file-structure)
4. [Implementation Journey](#-implementation-journey)
5. [UI/UX Design](#-uiux-design)
6. [Student Experience](#-student-experience)
7. [Advanced Features](#-advanced-features)
8. [Implementation Sprints](#-implementation-sprints)
9. [Testing Checklist](#-testing-checklist)
10. [Deployment Guide](#-deployment-guide)

---

## 🎯 Overview

### Goal

Implement a comprehensive Course Management System that allows:

- ✅ Admins/Instructors to create and manage courses
- ✅ Course categorization and organization
- ✅ Single and Bundle course types
- ✅ Rich content creation (Topics, Lessons, Quizzes)
- ✅ Student enrollment and progress tracking
- ✅ Flexible pricing (One-time, Subscription, Free)

### Key Features

- 🎓 **Course Categories** - Organize courses by subject/department
- 📚 **Single Courses** - Standalone courses with topics and lessons
- 📦 **Bundle Courses** - Package multiple courses together
- 🎬 **Multiple Lesson Types** - YouTube, Vimeo, Local Video, Google Drive, Documents, Text, iFrame
- 📝 **Integrated Quizzes** - Link to existing exam/quiz system
- 💰 **Flexible Pricing** - One-time payment, subscription, or free
- 📊 **Progress Tracking** - Track student completion and performance
- 🎫 **Auto Invoice Generation** - Automatic invoice creation on enrollment

### Architecture Alignment

This implementation follows your existing LMS architecture:

- ✅ **Multi-tenant** - All models include `tenantId`
- ✅ **RBAC** - Role-based access control (ADMIN, TEACHER, STUDENT)
- ✅ **Next.js App Router** - Server components + Client components
- ✅ **Prisma ORM** - Type-safe database access
- ✅ **shadcn/ui** - Consistent UI components
- ✅ **Server Actions** - Form submissions and mutations
- ✅ **Storage Service** - File uploads (local/R2)
- ✅ **Dark Mode** - Full dark mode support

---

## 🗄️ Database Schema

### Migration Command

```bash
npx prisma migrate dev --name course_management_init
```

### Core Models

#### 1. CourseCategory

```prisma
model CourseCategory {
  id        String   @id @default(cuid())
  tenantId  String
  name      String   // "Science", "Mathematics", "Programming"
  slug      String   // "science", "mathematics", "programming"
  description String?
  icon      String?  // Icon name or emoji
  color     String?  // Hex color for UI theming
  order     Int      @default(0) // Display order among siblings
  status    String   @default("ACTIVE") // ACTIVE, INACTIVE

  // Self-relation for unlimited parent-child hierarchy
  parentId  String?
  parent    CourseCategory? @relation("CourseCategoryToParent", fields: [parentId], references: [id], onDelete: SetNull)
  children  CourseCategory[] @relation("CourseCategoryToParent")

  // Relations
  tenant    Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  courses   Course[]

  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId, status])
  @@index([tenantId, parentId])
}
```

**Features:**

- ✅ Tenant isolation
- ✅ Unique slug per tenant
- ✅ Custom color theming
- ✅ Icon support (emoji or icon library)
- ✅ Sortable order
- ✅ Active/Inactive status

**Delete Guard:**

- Cannot delete if courses exist
- Show warning: "This category has X courses. Please reassign or delete them first."

---

#### 2. Course

```prisma
model Course {
  id                String        @id @default(cuid())
  tenantId          String

  // Basic Info
  title             String
  slug              String        // Auto-generated from title
  description       String?       @db.Text
  shortDescription  String?       @db.VarChar(500)

  // Category & Type
  categoryId        String?
  category          CourseCategory? @relation(fields: [categoryId], references: [id])
  courseType        CourseType    @default(SINGLE) // SINGLE, BUNDLE

  // Author/Instructor
  authorName        String?       // "Dr. Nabil Rahman"
  instructorId      String?       // Link to Teacher/User
  instructor        Teacher?      @relation(fields: [instructorId], references: [id])

  // Pricing
  paymentType       PaymentType   @default(ONE_TIME) // ONE_TIME, SUBSCRIPTION, FREE
  invoiceTitle      String?
  regularPrice      Decimal?      @db.Decimal(10, 2)
  offerPrice        Decimal?      @db.Decimal(10, 2)
  currency          String        @default("BDT")

  // Subscription (Phase 2)
  subscriptionDuration Int?       // In months
  subscriptionType     SubscriptionType? // MONTHLY, QUARTERLY, YEARLY, CUSTOM

  // Invoice Settings
  autoGenerateInvoice Boolean     @default(true)

  // Media
  featuredImage     String?       // File path
  introVideoUrl     String?       // YouTube/Vimeo URL

  // Visibility, schedule & access
  status                   CourseStatus           @default(DRAFT)   // lifecycle: draft/live/archive (SCHEDULED used internally for future go-live)
  visibility               CourseVisibility       @default(PUBLIC)  // who can see the course in catalog/search
  publishedAt              DateTime?
  scheduledAt              DateTime?
  showComingSoon           Boolean                @default(false)   // when true and now < scheduledAt, show "Coming soon" pill/thumbnail
  comingSoonImage          String?                                // optional override thumbnail while coming soon
  allowCurriculumPreview   Boolean                @default(false)   // allow non-enrolled users to see curriculum outline

  // SEO & Meta
  metaTitle                String?
  metaDescription          String?
  metaKeywords             String?

  // Settings
  isFeatured               Boolean                @default(false)
  allowComments            Boolean                @default(true)
  certificateEnabled       Boolean                @default(false)

  // Enrollment configuration (course-level defaults)
  maxStudents                     Int?     // null = unlimited; used for self-enrollment capacity
  enrollmentStartAt               DateTime?
  enrollmentEndAt                 DateTime?
  enrollmentStatus                CourseEnrollmentStatus @default(OPEN) // OPEN, PAUSED, CLOSED, INVITE_ONLY
  defaultEnrollmentDurationDays   Int?     // null/0 = lifetime; used to compute CourseEnrollment.expiresAt

  // Stats (computed)
  totalTopics       Int           @default(0)
  totalLessons      Int           @default(0)
  totalDuration     Int           @default(0) // In minutes
  totalEnrollments  Int           @default(0)

  // Relations
  topics            CourseTopic[]
  enrollments       CourseEnrollment[]
  bundleCourses     BundleCourse[] @relation("BundleParent")
  bundleItems       BundleCourse[] @relation("BundleChild")
  faqs              CourseFAQ[]

  createdAt         DateTime      @default(now())
  updatedAt         DateTime      @updatedAt

  @@unique([tenantId, slug])
  @@index([tenantId, status])
  @@index([categoryId])
}
```

**Features:**

- ✅ Single and Bundle course types
- ✅ Flexible pricing (One-time, Subscription, Free)
- ✅ SEO optimization
- ✅ Featured courses
- ✅ Certificate support
- ✅ Auto-computed statistics
- ✅ Rich status & access model (draft/live + visibility + schedule + enrollment settings)

**Character Limits:**

- Title: 200 characters
- Short Description: 500 characters
- Description: Unlimited (Text field)
- Invoice Title: 200 characters
- Meta Title: 60 characters
- Meta Description: 160 characters
- Meta Keywords: 200 characters

---

#### 3. BundleCourse (Junction Table)

```prisma
model BundleCourse {
  id          String   @id @default(cuid())
  tenantId    String

  bundleId    String   // Parent bundle course
  bundle      Course   @relation("BundleParent", fields: [bundleId], references: [id], onDelete: Cascade)

  courseId    String   // Child course
  course      Course   @relation("BundleChild", fields: [courseId], references: [id], onDelete: Cascade)

  order       Int      @default(0)

  createdAt   DateTime @default(now())

  @@unique([bundleId, courseId])
  @@index([tenantId])
}
```

**Features:**

- ✅ Many-to-many relationship between bundle and courses
- ✅ Sortable order
- ✅ Cascade delete protection

---

#### 4. CourseTopic (Hybrid with Academic Setup & Question Bank)

```prisma
model CourseTopic {
  id          String        @id @default(cuid())
  tenantId    String
  courseId    String
  course      Course        @relation(fields: [courseId], references: [id], onDelete: Cascade)

  // Core fields (course-level structure)
  title       String
  description String?       @db.Text
  order       Int           @default(0)

  // Optional mapping to academic/question bank hierarchy
  subjectId   String?       // Link to Subject (from Academic Setup)
  chapterId   String?       // Link to Chapter (from Question Bank)
  topicId     String?       // Link to Topic (from Question Bank)
  sourceType  String        @default("CUSTOM") // "CUSTOM" | "QUESTION_BANK"

  lessons     CourseLesson[]
  activities  CourseActivity[]

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([tenantId, courseId])
  @@index([tenantId, subjectId])
  @@index([tenantId, chapterId])
  @@index([tenantId, topicId])
}
```

**Features (Hybrid model):**

- ✅ `CourseTopic` is the **course-local curriculum structure** (always stored here)
- ✅ Optional mapping to existing `Subject`/`Chapter`/`Topic` from Academic Setup + Question Bank
- ✅ Supports both **linked** topics (reuse existing syllabus) and **custom** topics (course-only)
- ✅ Sortable order
- ✅ Cascade delete (deleting course deletes topics)

**Character Limits:**

- Title: 200 characters
- Description: Unlimited (Text field)

**Behaviour Notes (for implementation):**

- Add Topic (in builder UI):
  - Option 1 – "Use existing Chapter/Topic": set `subjectId`/`chapterId`/`topicId` and `sourceType = "QUESTION_BANK"`, copy current Chapter/Topic name into `title` as snapshot.
  - Option 2 – "Create custom topic": only `title`/`description`; leave mapping fields `null` and keep `sourceType = "CUSTOM"`.
- Changes in Question Bank should **not** auto-edit `CourseTopic.title`; reporting and filters should use the mapping IDs.

---

#### 5. CourseLesson

```prisma
model CourseLesson {
  id              String        @id @default(cuid())
  tenantId        String
  topicId         String
  topic           CourseTopic   @relation(fields: [topicId], references: [id], onDelete: Cascade)

  title           String
  description     String?       @db.Text
  lessonType      LessonType    // VIDEO_YOUTUBE, VIDEO_VIMEO, VIDEO_LOCAL, VIDEO_GDRIVE, DOCUMENT, TEXT, IFRAME

  // Content
  contentUrl      String?       // Video URL, Document URL, etc.
  contentText     String?       @db.Text // For TEXT type
  iframeCode      String?       @db.Text // For IFRAME type

  // Video specific
  duration        Int?          // In seconds
  videoProvider   String?       // "youtube", "vimeo", "local", "gdrive"

  // Files
  attachments     String?       @db.Text // JSON array of file paths

  // Access Control
  accessType      AccessType    @default(PUBLIC) // PUBLIC, PASSWORD, ENROLLED_ONLY
  password        String?

  // Scheduling
  scheduledRelease DateTime?

  // Settings
  allowDownload   Boolean       @default(false)
  isPreview       Boolean       @default(false) // Free preview lesson

  order           Int           @default(0)

  // Progress tracking
  completions     LessonCompletion[]

  createdAt       DateTime      @default(now())
  updatedAt       DateTime      @updatedAt

  @@index([tenantId, topicId])
}
```

**Lesson Types:**

1. **VIDEO_YOUTUBE** - YouTube video embed
2. **VIDEO_VIMEO** - Vimeo video embed
3. **VIDEO_LOCAL** - Uploaded video file
4. **VIDEO_GDRIVE** - Google Drive video link
5. **DOCUMENT** - PDF, DOC, PPT files
6. **TEXT** - Rich text article
7. **IFRAME** - Custom iframe embed

**Access Control:**

- **PUBLIC** - Anyone can view
- **PASSWORD** - Requires password
- **ENROLLED_ONLY** - Only enrolled students

**Features:**

- ✅ 7 lesson types
- ✅ Access control
- ✅ Scheduled release dates
- ✅ Preview lessons (free sample)
- ✅ Downloadable attachments
- ✅ Progress tracking

---

### 🔐 Lesson Content Security & Anti‑Download Strategy (Documents & Video)

**Goal:** Course lesson (PDF/DOC/PPT, local video, YouTube, etc.) jate:

- Direct download easily na kora jae (specially DOCUMENT lessons).
- Sensitive content (exam materials, paid content) browser theke casually save/share na kora jae.
- Kono paid SaaS tool chara **best‑effort protection** deya hoy.

> ⚠️ **Important reality check:** 100% download/screenshot prevent kora **pure web technology diye possible na**.
>
> - Browser/OS level screen recorder or network sniffer stop kora jabe na.
> - YouTube er moto 3rd‑party host theke 100% no‑download guarantee kora jabe na.
>   E section‑er design **copy‑expense high kore**, strong watermark/log diye misuse discourage korar jonno.

---

#### 5.1 DOCUMENT Lessons (PDF / DOC / PPT)

**LessonType: `DOCUMENT`** + `allowDownload` field use kore 2 mode:

1. **Protected View‑Only (default)**

   - `lessonType = DOCUMENT`, `allowDownload = false` (default).
   - Behaviour:
     - Student ke **direct file URL** deya hobe na.
     - Instead, server‑side e PDF/DOC → per‑page image/HTML render kore **SecureDocumentViewer** e show kora hobe.

2. **Allowed Download (non‑sensitive resources)**
   - Teacher jodi chae student file download korte parse, tokhon `allowDownload = true` set korbe.
   - Student UI e explicitly `Download` button dekhano hobe (public resource er moto).

**Storage & serving pattern (align with FILE_UPLOAD_FINAL_PLAN + MEDIA_SECURITY_IMPLEMENTATION_PLAN):**

- All DOCUMENT files **private** folder e save hobe:
  - Path: `tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/documents/...` (via `StorageService`).
- Student side `SecureDocumentViewer` page/page‑image load korbe ei route diye:
  - `/api/media/lessons/{lessonId}/document/page/{pageNo}`
- Ei API route:
  - `getTenantId()` diye tenant verify korbe.
  - Current user + `CourseEnrollment` check korbe (`ENROLLED_ONLY`/`PASSWORD` respect kore).
  - `Content-Disposition` header‑e `inline` use korbe, `attachment` na.
  - `Cache-Control` korte hobe short TTL + `no-store` jate offline cache kom thake.
- Signed URL / token:
  - Per request short‑lived token (e.g., JWT) use kora jabe:
    - `lessonId`, `studentId`, `tenantId`, `expiresAt` embed kore.
    - URL guess/reshare korle o token expire howar por kaj korbe na.

**UI hardening (best‑effort):**

- `SecureDocumentViewer`:
  - Content canvas/image er upor **semi‑transparent watermark** overlay:
    - `Student Name`, `Student Code`, `Tenant`, `timestamp` diagonal repeat.
    - This discourages camera‑screenshot, ar leak hole source traceable.
  - Disable:
    - Browser default context menu (`onContextMenu` prevent).
    - Text selection (`user-select: none`), drag‑and‑drop.
    - `window.print()` trigger (print dialog) ke override kore custom message dibe.
- Screen capture **hard stop** technically possible na:
  - Browser JavaScript diye PrintScreen / OS screen recorder detect reliable na.
  - True "screen goes black while recording" behaviour er jonno **DRM/EME (e.g., Widevine)** integration dorkar, ja later dedicated media security phase e consider kora jabe.

**Student Player (`/my-courses/[id]/learn`) behaviour:**

- Attachments section e 2 type:
  - **Protected lesson docs** (DOCUMENT, `allowDownload = false`):
    - Show `View` button → opens SecureDocumentViewer.
    - `Download` option dekhabe na.
  - **Optional downloadable resources** (attachments or DOCUMENT with `allowDownload = true`):
    - Show `Download` button (same storage rules, but `Content-Disposition: attachment`).

---

#### 5.2 Local Video Lessons (VIDEO_LOCAL / VIDEO_GDRIVE proxy)

**Goal:** Local upload (or future server‑side cached video) jate:

- Single static `.mp4` URL expose na hoy.
- Basic browser `Save video as…` / simple downloader extension diye easily grab kora jabe na.

**Storage & streaming pattern:**

- Video store: `tenants/{tenantId}/courses/{courseId}/lessons/{lessonId}/videos/...` (private, via `StorageService`).
- Transcode to **HLS (HTTP Live Streaming)** segments (e.g., ffmpeg pipeline):
  - Output: `.m3u8` playlist + `.ts`/`.mp4` segments.
  - Optional: AES‑128 encryption with per‑tenant/per‑course key.
- Student player stream URL will be API proxied:
  - Manifest: `/api/media/lessons/{lessonId}/video/manifest.m3u8`.
  - Segments: `/api/media/lessons/{lessonId}/video/segment/{segmentId}`.
- API route responsibilities:
  - `getTenantId()` + enrollment check (`CourseEnrollment` + `AccessType`).
  - Short TTL token validation (similar to document).
  - Response headers: `Cache-Control: private, max-age=0, no-store`.

**Player implementation (no paid tools):**

- Use open‑source player library:
  - `hls.js` or `Shaka Player` → HLS playback, optional EME integration future‑e.
- `<video>` tag e:
  - Custom controls use kora (no native context menu / download attribute).
  - Right‑click disable, picture‑in‑picture optional disable.
- Overlay watermark (same pattern as document):
  - Student info + timestamp subtle overlay, position randomize/animate korte parbo.

**Limitations (must be documented):**

- Network‑level sniffing (DevTools → Network tab, advanced download extensions) completely block kora possible na.
- HLS + tokenization + encryption **download cost baray** and unauthorised share harder kore, but:
  - Technically skilled user still segment moge offline stitch korte parbe.
- OS‑level screen recorder ke web app diye stop kora jabe na.

---

#### 5.3 YouTube Lessons (VIDEO_YOUTUBE) – Safe Embed Strategy

**Requirement (practical view):**

- Student normal UI theke YouTube URL easily na pabe, share button na thake.
- Browser extension jeno directly YouTube URL detect korte na pare – **full guarantee possible na**, but cost barano jabe.

**Data model:**

- `lessonType = VIDEO_YOUTUBE`, `contentUrl` e YouTube watch/embed URL or just `videoId` store kora jabe.
- `videoProvider = "youtube"`.

**Embed strategy:**

- Use YouTube IFrame API with **restricted UI**:
  - `controls=0`, `disablekb=1`, `rel=0`, `modestbranding=1`, `fs=0`, `iv_load_policy=3`.
  - `origin` param set to LMS domain (future multi‑tenant domains handle korte hobe).
- Student UI:
  - No YouTube logo link / title / "Watch on YouTube" button visible.
  - Player container er upor transparent div overlay keep kore right‑click + easy link copy prevent kora.

**YouTube URL exposure & download risk:**

- Browser DevTools → Network tab e technically **video segment/manifest URL show hobe** – eta prevent kora jabe na.
- Third‑party download extension jodi full network access ney, web app er moddheo eta block kora possible na.
- Tai:
  - Highly sensitive / paid content jodi 100% control chai, **YouTube use na kore local HLS pipeline** use korar recommendation.
  - YouTube lessons ke primarily **marketing / low‑sensitivity** content hishebe treat kora uchit.

**Additional mitigations:**

- YouTube side settings (instructor guideline):
  - Videos `Unlisted`/`Private with domain restriction` rakha.
  - Embedding allow but direct listing/search disable.
- LMS side logging:
  - Lesson play events + seek pattern audit log e store kore rakhle suspicious behaviour track kora jabe (e.g., abnormal concurrent sessions).

---

#### 5.4 Summary – What We Can & Cannot Guarantee

- ✅ **We can do:**

  - Direct file download hide for protected DOCUMENT lessons (`allowDownload = false`).
  - Only enrolled students ke short‑lived token diye document/video serve.
  - HLS + per‑tenant path + private storage diye **raw file exposure onekta komano**.
  - Strong per‑student watermarking (document + video) + audit logging diye leak traceable kora.

- ⚠️ **We cannot fully do (browser limitations):**
  - OS/driver‑level screen recording or camera diye screenshot complete block.
  - Advanced browser extensions ke 100% stop (especially YouTube / HLS sniffers).

E limitation gulo explicitly plan e thakbe jate future implementation time expectation right set kora jae, ar truly high‑stakes content er jonne proyojon hole dedicated DRM/EME phase plan kora jae.

## 📁 File Structure

```
app/(dashboard)/
├── course-management/
│   ├── layout.tsx                      // Course management layout
│   │
│   ├── categories/
│   │   ├── page.tsx                    // Category list (server component)
│   │   └── categories-client.tsx       // CRUD operations (client component)
│   │
│   ├── courses/
│   │   ├── page.tsx                    // Course list (server component)
│   │   ├── courses-client.tsx          // Table + filters (client component)
│   │   │
│   │   ├── new/
│   │   │   ├── page.tsx                // Course type selection
│   │   │   └── course-type-selector.tsx
│   │   │
│   │   ├── create/
│   │   │   ├── single/
│   │   │   │   └── page.tsx            // Single course form
│   │   │   └── bundle/
│   │   │       └── page.tsx            // Bundle course form
│   │   │
│   │   └── [id]/
│   │       ├── page.tsx                // Course overview
│   │       ├── edit/
│   │       │   └── page.tsx            // Edit course
│   │       │
│   │       ├── builder/
│   │       │   ├── page.tsx            // Course builder (Topics/Lessons)
│   │       │   └── course-builder-client.tsx
│   │       │
│   │       └── enrollments/
│   │           ├── page.tsx            // Enrolled students
│   │           └── enrollments-client.tsx
```

---

## 🚀 Implementation Sprints

### Sprint 1 (Week 1-2): Foundation

**Goal:** Database + Category Management

**Tasks:**

1. ✅ Create Prisma schema
2. ✅ Run migration
3. ✅ Create server actions for categories
4. ✅ Build category list page
5. ✅ Build category CRUD modals
6. ✅ Implement collapsible tree/outline view for hierarchical categories (no drag-and-drop)
7. ✅ Add color picker
8. ✅ Add icon selector
9. ✅ Test dark mode

**Deliverables:**

- `/course-management/categories` page fully functional

---

### Sprint 2 (Week 3-4): Course Creation

**Goal:** Single & Bundle Course Forms

**Tasks:**

1. ✅ Create course type selection page
2. ✅ Build single course form (6 tabs)
3. ✅ Build bundle course form
4. ✅ Implement slug auto-generation
5. ✅ Integrate file upload (featured image)
6. ✅ Add rich text editor
7. ✅ Create course list page with filters
8. ✅ Test all form validations

**Additional Sprint 2 implementation details (Single Course form):**

- Replace short/full description and FAQ question/answer textareas with the shared **Question Bank rich text editor**, including the full image dialog (tabs: `Upload`, `Server Files`, `Recent`, `URL`).
- Implement Featured Image as a real upload via `StorageService` (tenant-scoped), with the picker mirroring Question Bank options: `Upload`, `Server Files`, `Recent`, `URL`.
- Add Published date/time and Scheduled publish date/time controls to the Settings tab and persist them to `publishedAt` / `scheduledAt` in the Course model.
- Implement Author name + Instructor selector (backed by `Teacher` from Academic Setup) as part of this sprint (no deferral).
- Extend FAQ UX to support **Add / Edit / Delete / Reorder** with helper text that matches the actual interaction (drag-and-drop or move buttons).
- Add optional **fakeEnrollmentCount** integer to the Course model + form + list rendering for social proof.
- Refactor the single course form to use **React Hook Form + Zod + shadcn Form** instead of raw `useState`, following the global form standards (character limits, `FormMessage`, toast errors, etc.).

**Deliverables:**

- `/course-management/courses/new` page
- `/course-management/courses/create/single` page
- `/course-management/courses/create/bundle` page
- `/course-management/courses` list page

---

### Sprint 3 (Week 5-6): Course Builder

**Goal:** Topic & Lesson Management

**Tasks:**

1. ✅ Build course builder UI
2. ✅ Implement topic CRUD
3. ✅ Implement lesson CRUD (all 7 types)
4. ✅ Add drag-and-drop for topics/lessons
5. ✅ Integrate video URL parsing
6. ✅ Add file upload for videos/documents
7. ✅ Test all lesson types

**Deliverables:**

- `/course-management/courses/[id]/builder` page fully functional

---

### Sprint 4 (Week 7-8): Enrollment & Student View

**Goal:** Enrollment Management + Student Course Player

**Tasks:**

1. ✅ Build enrollment management page
2. ✅ Implement manual enrollment
3. ✅ Build student course catalog
4. ✅ Build student course player
5. ✅ Implement progress tracking
6. ✅ Integrate invoice generation
7. ✅ Test enrollment flow

**Deliverables:**

- `/course-management/courses/[id]/enrollments` page
- `/courses` (student catalog)
- `/my-courses/[id]/learn` (course player)

---

## ✅ Testing Checklist

### Category Management

- [ ] Create category
- [ ] Edit category
- [ ] Delete category (with guard)
- [ ] Tree view shows correct parent–child hierarchy (indentation and expand/collapse)
- [ ] Change category color
- [ ] Select category icon
- [ ] Test dark mode

### Course Creation

- [ ] Select course type (Single/Bundle)
- [ ] Create single course
- [ ] Create bundle course
- [ ] Upload featured image
- [ ] Add intro video
- [ ] Set pricing (One-time/Free)
- [ ] Add FAQs
- [ ] Test slug generation
- [ ] Test all validations
- [ ] Test dark mode

### Course Builder

- [ ] Add topic
- [ ] Edit topic
- [ ] Delete topic
- [ ] Reorder topics
- [ ] Add YouTube lesson
- [ ] Add Vimeo lesson
- [ ] Add uploaded video lesson
- [ ] Add Google Drive lesson
- [ ] Add document lesson
- [ ] Add text lesson
- [ ] Add iframe lesson
- [ ] Set access control
- [ ] Schedule lesson release
- [ ] Add attachments
- [ ] Reorder lessons
- [ ] Test dark mode

### Enrollment

- [ ] Manual enrollment
- [ ] Auto invoice generation
- [ ] Progress tracking
- [ ] View enrolled students
- [ ] Test dark mode

### Student Experience

- [ ] Browse course catalog
- [ ] Enroll in course
- [ ] View course content
- [ ] Complete lessons
- [ ] Track progress
- [ ] Test dark mode

---

## 🎯 Key Improvements Over Original Plan

### ✅ 1. Better Data Modeling

- Separate `CourseTopic` and `CourseLesson` for better organization
- `BundleCourse` junction table for many-to-many relationship
- `LessonCompletion` for granular progress tracking
- Support for multiple subscription types

### ✅ 2. Enhanced Lesson Types

- Added Google Drive video support
- Added iFrame embed support
- Added text-based lessons (articles)

### ✅ 3. Access Control

- Password-protected lessons
- Preview lessons (free sample)
- Scheduled release dates

### ✅ 4. Better Enrollment Management

- Track enrollment type (PAID/FREE/MANUAL)
- Expiry dates for time-limited access
- Certificate issuance tracking

### ✅ 5. SEO & Marketing

- Meta tags for SEO
- Featured courses
- Fake enrollment count (social proof)

### ✅ 6. Consistent with Your Codebase

- Uses same patterns as Academic Setup
- Same UI components (SearchableDropdown, Table, Dialog)
- Same RBAC and tenant isolation
- Same file storage service
- Same dark mode support

---

## 📊 Complete Database Schema (All Models)

### 6. CourseActivity

```prisma
model CourseActivity {
  id          String        @id @default(cuid())
  tenantId    String
  topicId     String
  topic       CourseTopic   @relation(fields: [topicId], references: [id], onDelete: Cascade)

  activityType ActivityType // QUIZ, ASSIGNMENT, EXAM

  // Link to existing exam/quiz system
  examId      String?       // If using existing exam module

  title       String
  description String?       @db.Text

  // Timing
  openDate    DateTime?
  closeDate   DateTime?
  duration    Int?          // In minutes

  // Grading
  totalMarks  Decimal?      @db.Decimal(10, 2)
  passMarks   Decimal?      @db.Decimal(10, 2)

  order       Int           @default(0)

  createdAt   DateTime      @default(now())
  updatedAt   DateTime      @updatedAt

  @@index([tenantId, topicId])
}
```

### 7. CourseEnrollment

```prisma
model CourseEnrollment {
  id              String          @id @default(cuid())
  tenantId        String

  courseId        String
  course          Course          @relation(fields: [courseId], references: [id], onDelete: Cascade)

  studentId       String
  student         Student         @relation(fields: [studentId], references: [id], onDelete: Cascade)

  // Enrollment Details
  enrolledAt      DateTime        @default(now())
  enrollmentType  EnrollmentType  @default(PAID) // PAID, FREE, MANUAL

  // Payment
  invoiceId       String?         // Link to invoice
  amountPaid      Decimal?        @db.Decimal(10, 2)

  // Progress
  progress        Int             @default(0) // 0-100%
  completedLessons Int            @default(0)
  totalLessons    Int             @default(0)

  // Status
  status          EnrollmentStatus @default(ACTIVE) // ACTIVE, COMPLETED, EXPIRED, CANCELLED
  completedAt     DateTime?
  expiresAt       DateTime?

  // Certificate
  certificateIssued Boolean       @default(false)
  certificateUrl    String?

  // Progress tracking
  lessonCompletions LessonCompletion[]

  createdAt       DateTime        @default(now())
  updatedAt       DateTime        @updatedAt

  @@unique([tenantId, courseId, studentId])
  @@index([tenantId, studentId])
  @@index([courseId])
}
```

### 8. LessonCompletion

```prisma
model LessonCompletion {
  id            String            @id @default(cuid())
  tenantId      String

  enrollmentId  String
  enrollment    CourseEnrollment  @relation(fields: [enrollmentId], references: [id], onDelete: Cascade)

  lessonId      String
  lesson        CourseLesson      @relation(fields: [lessonId], references: [id], onDelete: Cascade)

  completedAt   DateTime          @default(now())
  watchTime     Int?              // In seconds

  @@unique([enrollmentId, lessonId])
  @@index([tenantId])
}
```

### 9. CourseFAQ

```prisma
model CourseFAQ {
  id          String   @id @default(cuid())
  tenantId    String
  courseId    String
  course      Course   @relation(fields: [courseId], references: [id], onDelete: Cascade)

  question    String   @db.Text
  answer      String   @db.Text
  order       Int      @default(0)

  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  @@index([tenantId, courseId])
}
```

### Enums

```prisma
enum CourseType {
  SINGLE
  BUNDLE
}

enum PaymentType {
  ONE_TIME
  SUBSCRIPTION
  FREE
}

enum SubscriptionType {
  MONTHLY
  QUARTERLY
  YEARLY
  CUSTOM
}

enum CourseStatus {
  DRAFT
  PUBLISHED
  SCHEDULED
  PRIVATE
}

enum CourseVisibility {
  PUBLIC
  UNLISTED
  PRIVATE
  INTERNAL_ONLY
}

enum CourseEnrollmentStatus {
  OPEN
  PAUSED
  CLOSED
  INVITE_ONLY
}

enum LessonType {
  VIDEO_YOUTUBE
  VIDEO_VIMEO
  VIDEO_LOCAL
  VIDEO_GDRIVE
  DOCUMENT
  TEXT
  IFRAME
}

enum AccessType {
  PUBLIC
  PASSWORD
  ENROLLED_ONLY
}

enum ActivityType {
  QUIZ
  ASSIGNMENT
  EXAM
}

### Course Settings  Visibility, Schedule & Enrollment

**Goal:** Make the Settings tab the single place where an admin controls **who can see the course**, **when it appears/live**, and **how/when students can enroll**. This separates three ideas that were previously mixed:

1. **Lifecycle**  draft vs published vs archived (`Course.status`).
2. **Visibility**  public vs unlisted vs private (`Course.visibility`).
3. **Enrollment**  open vs paused vs closed, with max seat + date range (`CourseEnrollmentStatus`, `maxStudents`, `enrollmentStartAt`, `enrollmentEndAt`).

#### 1) Visibility & Lifecycle Card

- Rightside card with a modern dashboard look (soft surface + accent border, not flat gray):
  - **Visibility dropdown** (`Course.visibility`):
    - `Public`  shown in catalog/search and accessible via URL.
    - `Unlisted`  hidden from catalog/search, only accessible via direct link.
    - `Private`  only admins/instructors + alreadyenrolled students can see it.
    - `Internal only` (future)  visible only inside staff dashboards.
  - **Status dropdown** (`Course.status`):
    - Primary options in UI: `Draft`, `Published`, `Archived`.
    - Implementation detail: `SCHEDULED` may still exist internally; UI shows it as `Published (scheduled)` badge when schedule is enabled and `now < scheduledAt`.
  - Meta line: Last updated by {user} on {date} in small, muted text.
  - Status pill row showing combined state: e.g. `Public · Coming soon · Enrollment open` using colorful rounded chips.

**Rules / edge cases:**

- Draft overrides everything  even if visibility = Public and enrollment = Open, students never see the course.
- Archived  no new enrollments, course hidden from catalog; existing students may keep readonly access (implementation detail later).
- Switching back from Published/Archived to Draft should optionally show a warning if students are already enrolled.

#### 2) Schedule Card (Golive + Coming Soon)

- Inside Settings tab but visually a separate card under Visibility.
- Controls:
  - Toggle: **Schedule course golive**.
  - When ON:
    - `Date` input (type=`date`).
    - `Time` input (type=`time`).
    - Helper text: Course will go live on {date} at {time}.
    - Checkbox: **Show Coming soon before start date** (`showComingSoon`).
    - File input: **Coming soon thumbnail** (`comingSoonImage`)  optional override card image.
    - Toggle: **Preview curriculum for guests** (`allowCurriculumPreview`).
  - When OFF:
    - `scheduledAt` cleared; course either stays Draft or is immediately live depending on `status`.

**Validation / edge cases:**

- If schedule is ON and either date or time is empty  show inline error chip below the specific field and block saving Published status.
- If scheduled datetime is in the past:
  - Show a strong warning chip: Scheduled date/time must be in the future.
  - Offer quick fix in copy: Turn off schedule or Set to now (future enhancement).
- While `now < scheduledAt`:
  - If `showComingSoon = true`: course appears in catalog with a `Coming soon` pill + optional comingsoon thumbnail; enroll button behaviour depends on enrollment rules below.
  - If `showComingSoon = false`: course is completely hidden from students (but admins can preview).
- If schedule is turned OFF after it was ON:
  - Do **not** autoarchive; keep `status` as Draft or Published as chosen.
  - Clear `scheduledAt` and show a small note that schedule was removed.

#### 3) Enrollment Card (Capacity + Window + Pause)

- Same Settings tab, another card titled **Enrollment settings** with a subtle accent header.
- Fields:
  - **Maximum students** (`maxStudents`):
    - `0` or empty = unlimited.
    - When limit reached, selfenrollment is blocked with `Course full` chip/button state; admins can still manually enroll via Enrollments page.
  - **Default access duration (days)** (`defaultEnrollmentDurationDays`):
    - On new enrollment, compute `CourseEnrollment.expiresAt` = `now + N days` (or `null` for lifetime).
  - **Enrollment period** section:
    - Toggle: **Limit enrollment to a date range**.
    - When ON:
      - `Enrollment start date/time` (`enrollmentStartAt`).
      - `Enrollment end date/time` (`enrollmentEndAt`, optional).
      - Inline summary text like: Students can enroll from 1 Feb, 10:00 AM to 15 Feb, 11:59 PM.
  - **Pause enrollment** checkbox (`enrollmentStatus = PAUSED`):
    - Immediate override; takes precedence over date range and max students.
    - UI copy: Enrollment is paused. Existing students keep access, new students cannot join.

**Rules / edge cases:**

- `canSelfEnroll` logic (high level):
  - Course must be `status = PUBLISHED` (or scheduled + now >= scheduledAt).
  - Visibility must allow the current context:
    - Catalog listing requires `visibility = PUBLIC` or `UNLISTED`.
    - Direct link may still work for `UNLISTED` and `PRIVATE` (if the user has permission / invite).
  - `enrollmentStatus` must be `OPEN`.
  - If `maxStudents` is set, current active enrollments must be `< maxStudents`.
  - If date range is enabled:
    - `now >= enrollmentStartAt`.
    - `enrollmentEndAt` is `null` OR `now <= enrollmentEndAt`.
- If enrollment end is **before** scheduled course start:
  - Show a warning chip on the form: Enrollment ends before the course is live. Students may never see the course.
- If course is **Coming soon** (scheduled in future) but enrollment is **OPEN now**:
  - Allowed pattern for presale: students can enroll early, see curriculum (if preview allowed), but cannot start locked lessons until golive.
  - UI should make this clear using label like `Coming soon · Enrolling now`.
- Changing `maxStudents` after enrollments exist:
  - Increasing the limit simply allows more students.
  - Decreasing the limit **does not auto-drop** existing students; the new limit only affects future enrollments.
- Pausing enrollment with existing students:
  - Students keep access; only new enrollments are blocked.

All of these behaviours should be reflected in:

- **Settings tab UI** (chips, helper texts, warnings).
- **Catalog & course card** chips (e.g., `Coming soon`, `Enrollment closed`, `Full`, `Invite only`).
- **Student view** (what happens when trying to enroll or open a course in each state).


enum EnrollmentType {
  PAID
  FREE
  MANUAL
}

enum EnrollmentStatus {
  ACTIVE
  COMPLETED
  EXPIRED
  CANCELLED
}
```

---

## 🎨 UI/UX Design Patterns

### Theme & Button Styling (Step 1 – done)

- All primary/secondary CTA buttons and important actions in the Course Management module must take their colors from the **tenant theme variables** (e.g. CSS vars like `--theme-button-from` / `--theme-button-to`, `--theme-active-from` / `--theme-active-to`), not from hard-coded hex values.
- Status/type/freemium chips should also reuse the shared theme palette (success/warning/info) instead of inventing new colors per screen, so the whole dashboard feels consistent and tenant-branded.

### Course List Page (Your Screenshot Style)

**Route:** `/course-management/courses`

**Top Section:**

```
┌─────────────────────────────────────────────────────────────────┐
│ All Courses                                          [+ Add New] │
├─────────────────────────────────────────────────────────────────┤
│ All (20) | Mine (20) | Published (18) | Draft (1) | Scheduled (0)│
│ | Private (0) | Trash (0)                                        │
├─────────────────────────────────────────────────────────────────┤
│ [Bulk Action ▼] [Reset] [Select Category ▼] [Select Sort ▼]    │
│                                              [Select Date 📅]    │
│ [🔍 Type to search...]                                          │
└─────────────────────────────────────────────────────────────────┘
```

**Table:**

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ ☐ | Title | Category | Type | Author | Price | Date | Enrollments | Status | Action │
├──────────────────────────────────────────────────────────────────────────────┤
│ ☐ | [📷] Advanced Physics                                                    │
│   | Topic: 3  Lesson: 10  Quiz: 10  Assignment: 0                            │
│   | Science | Single | 👤 Dr. Nabil | ৳1,500 | Mar 20 | 12 | 🟢 Publish ▼ | View │
│   |         |        |              |        |        |    |              | Edit │
│   |         |        |              |        |        |    |              | Duplicate │
└──────────────────────────────────────────────────────────────────────────────┘
```

**Data points inspired by latest UI reference (screenshot):**

- **Title column:**
  - Thumbnail image (featuredImage)
  - Course title (clickable)
  - Meta line below: total topics, total lessons, total assignments/activities
- **Category column:**
  - Primary course category name
  - Optional sub-label (e.g., stream or subject) in smaller text
- **Type column:**
  - Pill: `Single` / `Bundle`
- **Author column:**
  - Instructor avatar + name
- **Price column:**
  - Regular price / offer price
  - `Free` pill if price is 0
- **Date column:**
  - Created or published date/time
- **Enrollments column:**
  - Total enrollments count (from CourseEnrollment)
- **Active devices / engagement column (optional future):**
  - Active device count per day (e.g., `288 / 324`)
  - Small rating badge or average devices per student text
- **View Enrolled column (CTA):**
  - Button: `View Enrolled` → navigates to `/course-management/courses/[id]/enrollments`
- **Status column:**
  - Status pill: `Draft`, `Scheduled`, `Published`, `Archived`
- **Action column (kebab menu):**
  - View
  - Edit
  - Duplicate
  - View Analytics
  - Device Management
  - Share Link (copy public URL)
  - Delete (with delete guard)

> Implementation note: Course list UI should feel like a modern analytics table with colorful chips (status, type, free/paid), not a dull ERP grid.

**Responsive behaviour for course table (column priority):**

- **Desktop (≥ 1024px)**

  - Show all columns: Title, Category, Type, Author, Price, Date, Enrollments, Active Devices, View Enrolled, Status, Action.
  - Each row is a single line with rich meta text under the Title (topics/lessons/assignments).

- **Tablet (≈ 768–1023px)**

  - Keep: Title, Category, Type, Price, Enrollments, Status, Action.
  - Hide as separate columns: Author, Active Devices, View Enrolled, Date.
    - Author avatar can move into the Title cell (small chip under title).
    - "View Enrolled" becomes a button inside the Action menu or inline under Title.
    - Date can appear as small muted text in the Title meta line if needed.

- **Mobile (< 768px)**

  - Switch from wide row → **stacked card layout** per course:
    - Line 1: Thumbnail + Title + Status pill + kebab (Action) on the right.
    - Line 2: Category + Type pill + Price/Free pill.
    - Line 3: Meta: `Topics · Lessons · Assignments` + `Enrollments` count.
  - Explicit columns removed: Category, Type, Author, Price, Date, Enrollments, Active Devices, View Enrolled (these are folded into the stacked card content).
  - Primary actions (View, Edit, Duplicate, View Enrolled, Delete, etc.) stay in the kebab menu to avoid horizontal scroll.

- **Priority levels (for future changes):**
  - **High:** Title, Status, Action, Enrollments, Price.
  - **Medium:** Category, Type, View Enrolled, Date.
  - **Low / optional:** Active Devices, Author avatar (can hide on smaller screens).

> Implementation note: avoid horizontal scroll on mobile; favour stacked cards with chips and concise meta lines.

### Course Type Selection Page

**Route:** `/course-management/courses/new`

```
┌─────────────────────────────────────────────────────────────────┐
│                     Choose Course Type                           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────────┐      ┌──────────────────────┐        │
│  │       📄             │      │       📚             │        │
│  │                      │      │                      │        │
│  │   Single Course      │      │   Bundle Course      │        │
│  │                      │      │                      │        │
│  │ Add course adjust    │      │ Add course adjust    │        │
│  │ them as you wish...  │      │ them as you wish...  │        │
│  │                      │      │                      │        │
│  │ [+ Add Single Course]│      │ [+ Add Bundle Course]│        │
│  └──────────────────────┘      └──────────────────────┘        │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Course Builder Page

**Route:** `/course-management/courses/[id]/builder`

```
┌─────────────────────────────────────────────────────────────────┐
│ Advanced Physics for Class 10                                    │
│ 3 Topics • 10 Lessons • 2h 30m                                  │
│                              [Preview Course] [Publish Course]   │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│ ┌─────────────────────────────────────────────────────────────┐ │
│ │                    [+ Add Topic]                             │ │
│ └─────────────────────────────────────────────────────────────┘ │
│                                                                  │
│ ▼ Topic 1: Introduction to Physics                              │
│   Description: Basic concepts and fundamentals                   │
│   [Edit] [Delete] [+ Add Lesson] [+ Add Activity]               │
│                                                                  │
│   ├─ 📹 Lesson 1: What is Physics? (10:30)                      │
│   │  [Edit] [Delete] [Preview]                                  │
│   │                                                              │
│   ├─ 📹 Lesson 2: Units and Measurements (15:45)                │
│   │  [Edit] [Delete] [Preview]                                  │
│   │                                                              │
│   └─ 📝 Quiz: Introduction Quiz (10 questions)                  │
│      [Edit] [Delete] [View Results]                             │
│                                                                  │
│ ▼ Topic 2: Motion                                               │
│   ...                                                            │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘

#### "Add activity or resource" modal (Course curriculum builder)

When the teacher clicks `+ Add Lesson` or `+ Add Activity` inside a topic, open a full-screen-ish Dialog inspired by the screenshot.

**Title:** `Add an activity or resource`

**Primary tiles (first version):**

- **Lesson**
  - Description: `Add text / image / video / URL`
  - Maps to: `CourseLesson` with rich content blocks (text, media, attachments, embed).
  - After choosing this tile, open the Lesson editor with:
    - Title, short description
    - Content editor (block-based or rich-text)
    - Optional attachments (PDF, image, link)
- **PDF Resource**
  - Description: `Upload or attach a PDF file`
  - Maps to: `CourseLesson` of type `PDF` (stored file + optional description).
  - Quick create: upload PDF, auto-fill title from filename, allow re-ordering in topic.
- **Video-only Lesson**
  - Description: `Add a single video with optional notes`
  - Maps to: `CourseLesson` with `contentType = VIDEO`.
  - Quick create: paste video URL or upload file, auto-detect duration (future), optional short description.
  - Player-first layout: big video on top, notes/resources below.
- **Online**
  - Description: `Exam / practice`
  - Maps to: `CourseActivity` of type `ONLINE_EXAM` or `PRACTICE_QUIZ`.
  - After selecting, teacher can choose:
    - Question source: `Create new` / `Import from question bank`
    - Mode: `Exam` (timed, graded) vs `Practice` (infinite attempts, hints allowed).
  - **Exam mode preview (student view)** — full-page exam layout (screenshot 1 style):
    - Top bar with breadcrumb, exam title, remaining time countdown (MM:SS), and a prominent `Submit` button.
    - Just below, a colored instruction banner showing marks, negative marking rules, and general instructions.
    - Main content area lists questions one below another, each inside a card: question number, text, and options (radio/checkbox) with clear spacing.
    - Right side shows a `Question Navigation` panel with numbered pills for all questions, indicating `Answered` vs `Unanswered` with color/dot legend.
    - Timer and navigation remain visible while scrolling (sticky header/sidebar), so student always sees time left and can jump between questions.
    - Admin "Preview" from the builder opens this same layout in read-only mode inside a dialog or new tab.
  - **Practice mode preview (student view)** — immediate‑feedback layout (screenshot 2 style):
    - Top bar still shows topic name, `Submit` button, and a timer showing `Time passed` (count‑up, optional pause/resume) with no hard time limit and **no `Time left` countdown UI at all**; plus summary chips: `Total`, `Correct`, `Wrong`.
    - Just below, a green instruction banner like: `Full marks for each question and X marks deducted for each mistake`.
    - Each question card highlights the selected option and correct option with subtle colored backgrounds (e.g. green for correct, red/amber for wrong) so students see feedback at a glance.
    - Under each question there is a `Show answer & solution` button that expands the detailed explanation section; explanation area uses a light panel style for long text.
    - Score chips and progress summary update live as answers are marked, reinforcing the practice / gamified feel.
    - Admin "Preview" for practice opens the same layout from inside the modal so teachers can quickly see how hints, colors and solution block will look.
    - Future improvement: optional per‑question hints and "retry" mode (clear this question only) without resetting the whole practice set.
- **Assignment / Homework**
  - Description: `Collect submissions and grade`
  - Maps to: `CourseActivity` of type `ASSIGNMENT`.
  - Fields: title, instructions, due date/time, max marks, submission type (file upload / text answer / both), allowed file types, late submission policy.
  - Future: rubric-based grading + show in gradebook.
- **Offline**
  - Description: `Create offline question / sheet`
  - Maps to: `CourseActivity` of type `OFFLINE_EXAM`.
  - Fields: exam name, date/time, instructions, max marks, optional file (question paper PDF).
- **SCORM / Package (future)**
  - Description: `Upload SCORM / xAPI content package`
  - Maps to: `CourseActivity` of type `SCORM_PACKAGE` (future integration).
  - Behaviour: launches package in dedicated player, tracks completion/score back into course progress.
  - Clearly marked as "Coming soon" in UI until backend support is ready.

**Footer actions:**

- **Import** button in bottom-left (like screenshot):
  - `Import from another course` – pick an existing course + topics, then select lessons/activities to clone into the current topic.
  - Future: `Import from template library` – use tenant/global templates for common lessons, quizzes, or offline exams.

**Usability / UX improvements over the base design:**

- Show each tile as a "card" with:
  - Icon, title, one-line description
  - Tiny tag line such as `Content`, `Assessment`, `Offline` to help scanning.
- Optional category filters at top: `All`, `Content`, `Assessments`, `Offline` – simply highlight relevant tiles.
- Support keyboard navigation:
  - Arrow keys move between tiles
  - `Enter` to choose, `Esc` to close.
- Show "Recently used" hint on tiles the teacher uses most in this course (e.g., `Most used` badge).
- For exam tiles (Online/Offline), show a small subtext like `Counts towards grade` vs `Practice only`.
- Keep the same modern, slightly gamified tile style as rest of dashboard: light background, subtle glow border on hover, consistent accent color for active card.

> Implementation note: technically, Lesson/PDF map into the same `CourseLesson` table with different `contentType`, and Online/Offline map into `CourseActivity` with different `activityType`. The UI should hide that complexity and present a simple, friendly choice.

---

```

### Course Enrollments Page (View Enrolled)

**Route:** `/course-management/courses/[id]/enrollments`

**Top Section:**

- Title: `Enrolled Students (N)` with total count.
- Global search bar: search by **student name, email, phone, or admission number**.
- Filter + Reset buttons for:
  - Enrollment status (Active, Completed, Expired, Cancelled, Suspended\*)
  - Payment status (Paid, Pending, Overdue, Refunded) – from invoice module
  - Progress range (e.g., 0–25%, 25–50%, 50–75%, 75–100%)
- Checkbox: `Select All (Current Page)` for bulk actions.

**Table Columns (per-row content):**

- **Student**
  - Avatar
  - Full name
  - Student code / roll (e.g., `STU006`)
- **Contact**
  - Email with mail icon
  - Phone number with phone icon
- **Status**
  - Pill using `EnrollmentStatus` (ACTIVE, COMPLETED, EXPIRED, CANCELLED)
  - Design can also support a "Suspended" style pill if we add such a status later.
- **Progress**
  - Percentage (e.g., `35%`)
  - Horizontal progress bar using `progress` field
- **Assignments / Activities**
  - Text like `4/12 completed`
  - Later: computed from `CourseActivity` + related completion records.
- **Payment**
  - Badge: `Paid`, `Pending`, `Overdue`, `Refunded` (from linked invoice/payment status).
- **Last Activity**
  - Relative time since last lesson/quiz (e.g., `2 weeks ago`, `3 days ago`, `2 hours ago`).
- **Actions (kebab menu)**
  - `View Profile` → open student profile page
  - `Send Message` → open messaging/communication UI (future integration)
  - `Remove from Course` → call unenroll action with confirmation dialog

**Other behaviours:**

- Pagination controls at bottom (page size select + Previous/Next).
- Bulk selection to allow future bulk actions (e.g., bulk message, bulk unenroll).
- Keep the same modern dashboard style as course list: light background, accent pills for status/payment, clean progress bars.

---

#### Extra features inspired by second "View Enrolled" design

**Header actions:**

- Primary button: `+ Enroll Students` → opens manual enrollment dialog for this course.
- Bulk action button: `Remove` → unenroll selected students from **this course only** (with AlertDialog confirmation + reason optional).

**Additional columns (per enrollment):**

- **Admission Number** – admission / roll / student code.
- **Class** – academic class/grade (from Academic Setup).
- **Section** – section/cohort label.
- **Last Login** – last visit time in this specific course (e.g., `11d 16h`, `3h 20m`).
- **Active Device** – chip showing device state for this course:
  - `Active` – normal single-device use
  - `Multiple Device` – detected concurrent use from multiple devices
  - Inline `Disable` button to temporarily block access for this enrollment

**Per-course disable behaviour:**

- Add a per-enrollment flag (planned) like `isDisabled` on `CourseEnrollment`:
  - When `isDisabled = true`, student keeps account but **cannot open this course**.
  - Course list / player should show a friendly message: "Access disabled by admin".
  - Admin can toggle disable/enable from this table (row action or Active Device column button).

**Bulk selection behaviour:**

- Checkbox column allows selecting multiple enrollments.
- Bulk actions (current + future):
  - `Bulk Unenroll` – remove from course, update `totalEnrollments`, and log audit entry.
  - `Bulk Disable/Enable` – toggle `isDisabled` for all selected students.

> Implementation note: this page combines **progress/payment view** and **access/device control**. Start simple (progress + basic status), then gradually add Last Login, Active Device chips, and bulk disable features as supporting data becomes available.

---

---

## 👨‍🎓 Student Experience

### Student Course Catalog

**Route:** `/courses` (public or student dashboard)

```
┌─────────────────────────────────────────────────────────────────┐
│                        Browse Courses                            │
├─────────────────────────────────────────────────────────────────┤
│ [All] [Science] [Mathematics] [Programming] [Business]           │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐  ┌────────────────┐│
│  │ [Featured Image] │  │ [Featured Image] │  │ [Featured Image]││
│  │ 🏷️ Science       │  │ 🏷️ Mathematics   │  │ 🏷️ Programming ││
│  │                  │  │                  │  │                 ││
│  │ Advanced Physics │  │ Calculus 101     │  │ Python Basics   ││
│  │ for Class 10     │  │                  │  │                 ││
│  │                  │  │                  │  │                 ││
│  │ ⭐⭐⭐⭐⭐ (4.8)   │  │ ⭐⭐⭐⭐⭐ (4.9)   │  │ ⭐⭐⭐⭐☆ (4.5)  ││
│  │ 1,234 students   │  │ 856 students     │  │ 2,103 students  ││
│  │                  │  │                  │  │                 ││
│  │ 👤 Dr. Nabil     │  │ 👤 Prof. Ahmed   │  │ 👤 Eng. Karim   ││
│  │                  │  │                  │  │                 ││
│  │ ৳1,500 ~~৳2,000~~│  │ ৳2,500           │  │ Free            ││
│  │                  │  │                  │  │                 ││
│  │  [Enroll Now]    │  │  [Enroll Now]    │  │  [Enroll Now]   ││
│  └──────────────────┘  └──────────────────┘  └────────────────┘│
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

### Student Course Player

**Route:** `/my-courses/[id]/learn`

```
┌─────────────────────────────────────────────────────────────────┐
│ Advanced Physics for Class 10          Progress: 45% ████░░░░   │
├──────────────────┬──────────────────────────────────────────────┤
│ Sidebar (30%)    │ Main Content (70%)                           │
│                  │                                               │
│ ▼ Topic 1        │ 📹 Video Player                              │
│   ✅ Lesson 1    │    ┌──────────────────────────────────────┐  │
│   ▶️ Lesson 2    │    │                                      │  │
│   🔒 Lesson 3    │    │         [Play Button]                │  │
│                  │    │                                      │  │
│ ▼ Topic 2        │    │                                      │  │
│   ✅ Quiz 1      │    └──────────────────────────────────────┘  │
│   ▶️ Lesson 4    │    [⏮️] [⏯️] [⏭️] [🔊] [⚙️] [⛶]            │
│   🔒 Lesson 5    │                                               │
│                  │ Lesson 2: Units and Measurements              │
│ ▶️ Topic 3       │ Duration: 15:45                               │
│                  │                                               │
│                  │ In this lesson, we will learn about...        │
│                  │                                               │
│                  │ [⬅️ Previous Lesson] [Mark Complete] [Next ➡️]│
│                  │                                               │
│                  │ 📎 Attachments:                              │
│                  │ - exercise.pdf [Download]                     │
│                  │ - notes.docx [Download]                       │
│                  │                                               │
└──────────────────┴──────────────────────────────────────────────┘
```

---

## 🔧 Server Actions Reference

### Category Actions

```typescript
// lib/actions/course-category.actions.ts

export async function createCourseCategory(data: CourseCategoryInput) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  // Validate
  const schema = z.object({
    name: z.string().min(1).max(100),
    slug: z.string().min(1).max(100),
    description: z.string().max(500).optional(),
    icon: z.string().max(50).optional(),
    color: z.string().max(20).optional(),
    status: z.enum(["ACTIVE", "INACTIVE"]),
  });

  const validated = schema.parse(data);

  // Create
  await prisma.courseCategory.create({
    data: { ...validated, tenantId },
  });

  revalidatePath("/course-management/categories");
  return { success: true };
}

export async function updateCourseCategory(
  id: string,
  data: CourseCategoryInput
) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  // Update
  await prisma.courseCategory.update({
    where: { id, tenantId },
    data,
  });

  revalidatePath("/course-management/categories");
  return { success: true };
}

export async function deleteCourseCategory(id: string) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  // Check if courses exist
  const coursesCount = await prisma.course.count({
    where: { categoryId: id, tenantId },
  });

  if (coursesCount > 0) {
    return {
      success: false,
      error: `Cannot delete category. ${coursesCount} courses are using this category.`,
    };
  }

  // Delete
  await prisma.courseCategory.delete({
    where: { id, tenantId },
  });

  revalidatePath("/course-management/categories");
  return { success: true };
}
```

### Course Actions

```typescript
// lib/actions/course.actions.ts

export async function createCourse(data: CourseInput) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  // Validate
  const schema = z.object({
    title: z.string().min(1).max(200),
    slug: z.string().min(1).max(200),
    shortDescription: z.string().max(500).optional(),
    description: z.string().optional(),
    categoryId: z.string().optional(),
    courseType: z.enum(["SINGLE", "BUNDLE"]),
    authorName: z.string().max(100).optional(),
    instructorId: z.string().optional(),
    paymentType: z.enum(["ONE_TIME", "SUBSCRIPTION", "FREE"]),
    invoiceTitle: z.string().max(200).optional(),
    regularPrice: z.number().min(0).optional(),
    offerPrice: z.number().min(0).optional(),
    // ... more fields
  });

  const validated = schema.parse(data);

  // Create course
  const course = await prisma.course.create({
    data: { ...validated, tenantId },
  });

  revalidatePath("/course-management/courses");
  return { success: true, courseId: course.id };
}
```

---

## 🔒 Critical Implementation Rules (Codex Guidelines)

### ✅ Codex Requirements vs This Plan

| Codex Requirement                      | Status         | Implementation Details                                                             |
| -------------------------------------- | -------------- | ---------------------------------------------------------------------------------- |
| **Server Actions নাম/সীমানা**          | ✅ **COVERED** | Section 1: Clear naming conventions, file organization, one action = one operation |
| **TenantId + Role Guard Everywhere**   | ✅ **COVERED** | Section 2: Mandatory pattern for ALL server actions (requireRole + getTenantId)    |
| **Enroll/Duplicate Hooks**             | ✅ **COVERED** | Section 3: Transaction-based enrollment with auto invoice + deep clone duplicate   |
| **DnD Reorder**                        | ✅ **COVERED** | Section 4: Optimistic updates + transaction-based reorder for topics/lessons       |
| **Quiz Save Transaction**              | ✅ **COVERED** | Section 5: Atomic quiz creation (activity + exam + questions in one transaction)   |
| **Performance/Aggregate Optimization** | ✅ **COVERED** | Section 6: N+1 prevention, computed fields, pagination, Prisma aggregates          |
| **Audit Trail**                        | ✅ **COVERED** | Section 7: Complete audit log schema + helper + usage examples                     |

**Summary:** এই plan Codex এর সব requirements cover করেছে এবং আরো detail দিয়েছে। 🎯

---

### 1. Server Actions Naming & Boundaries

**Naming Convention:**

```typescript
// ✅ CORRECT - Clear, specific, action-oriented
export async function createCourse(data: CourseInput);
export async function updateCourseBasicInfo(
  courseId: string,
  data: BasicInfoInput
);
export async function deleteCourse(courseId: string);
export async function publishCourse(courseId: string);
export async function duplicateCourse(courseId: string);
export async function enrollStudent(courseId: string, studentId: string);
export async function reorderTopics(courseId: string, topicIds: string[]);

// ❌ WRONG - Vague, generic
export async function saveCourse(data: any);
export async function handleCourse(action: string, data: any);
export async function courseAction(type: string, payload: any);
```

**Boundaries:**

- ✅ One action = One database operation (or one transaction)
- ✅ Separate actions for different concerns (create vs update vs delete)
- ✅ Separate actions for different entities (course vs topic vs lesson)
- ❌ Never mix multiple entity operations in one action (unless transaction)

**File Organization:**

```
lib/actions/
├── course-category.actions.ts    // Category CRUD only
├── course.actions.ts              // Course CRUD + publish/duplicate
├── course-topic.actions.ts        // Topic CRUD + reorder
├── course-lesson.actions.ts       // Lesson CRUD + reorder
├── course-activity.actions.ts     // Activity CRUD
├── course-enrollment.actions.ts   // Enrollment + progress tracking
└── course-faq.actions.ts          // FAQ CRUD
```

---

### 2. TenantId + Role Guard (MANDATORY EVERYWHERE)

**Every Server Action MUST:**

```typescript
export async function createCourse(data: CourseInput) {
  // 1️⃣ ROLE GUARD - First line, always
  await requireRole("ADMIN"); // or ['ADMIN', 'TEACHER']

  // 2️⃣ TENANT ID - Second line, always
  const tenantId = await getTenantId();

  // 3️⃣ VALIDATION - Third
  const schema = z.object({
    title: z.string().min(1).max(200),
    // ...
  });
  const validated = schema.parse(data);

  // 4️⃣ TENANT ISOLATION - All queries filtered by tenantId
  const course = await prisma.course.create({
    data: {
      ...validated,
      tenantId, // ✅ Always include
    },
  });

  // 5️⃣ REVALIDATE - Update cache
  revalidatePath("/course-management/courses");

  return { success: true, courseId: course.id };
}
```

**Read Operations:**

```typescript
export async function getCourseById(courseId: string) {
  const tenantId = await getTenantId();

  // ✅ ALWAYS filter by tenantId
  const course = await prisma.course.findFirst({
    where: {
      id: courseId,
      tenantId, // ✅ Prevents cross-tenant data access
    },
  });

  if (!course) {
    throw new Error("Course not found");
  }

  return course;
}
```

**Update/Delete Operations:**

```typescript
export async function deleteCourse(courseId: string) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  // ✅ Check ownership before delete
  const course = await prisma.course.findFirst({
    where: { id: courseId, tenantId },
  });

  if (!course) {
    return { success: false, error: "Course not found" };
  }

  // ✅ Delete with tenantId filter
  await prisma.course.delete({
    where: {
      id: courseId,
      tenantId, // ✅ Double protection
    },
  });

  revalidatePath("/course-management/courses");
  return { success: true };
}
```

---

### 3. Enrollment & Duplicate Hooks (Transaction Required)

#### **Enrollment Hook (Auto Invoice Generation)**

```typescript
// lib/actions/course-enrollment.actions.ts

export async function enrollStudent(
  courseId: string,
  studentId: string,
  enrollmentType: "PAID" | "FREE" | "MANUAL" = "PAID"
) {
  await requireRole(["ADMIN", "TEACHER"]);
  const tenantId = await getTenantId();

  // Validate course exists
  const course = await prisma.course.findFirst({
    where: { id: courseId, tenantId },
    include: { topics: { include: { lessons: true } } },
  });

  if (!course) {
    return { success: false, error: "Course not found" };
  }

  // Check if already enrolled
  const existing = await prisma.courseEnrollment.findFirst({
    where: { courseId, studentId, tenantId },
  });

  if (existing) {
    return { success: false, error: "Student already enrolled" };
  }

  // 🔥 TRANSACTION - Enrollment + Invoice generation
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create enrollment
    const totalLessons = course.topics.reduce(
      (sum, topic) => sum + topic.lessons.length,
      0
    );

    const enrollment = await tx.courseEnrollment.create({
      data: {
        tenantId,
        courseId,
        studentId,
        enrollmentType,
        totalLessons,
        status: "ACTIVE",
      },
    });

    // 2. Generate invoice (if PAID and autoGenerateInvoice enabled)
    let invoice = null;
    if (enrollmentType === "PAID" && course.autoGenerateInvoice) {
      const amount = course.offerPrice || course.regularPrice || 0;

      invoice = await tx.invoice.create({
        data: {
          tenantId,
          studentId,
          title: course.invoiceTitle || `Course: ${course.title}`,
          amount,
          dueDate: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          status: "PENDING",
          type: "COURSE_ENROLLMENT",
          referenceId: enrollment.id,
        },
      });
    }

    // 3. Update course enrollment count
    await tx.course.update({
      where: { id: courseId },
      data: { totalEnrollments: { increment: 1 } },
    });

    return { enrollment, invoice };
  });

  revalidatePath(`/course-management/courses/${courseId}/enrollments`);
  revalidatePath("/students");

  return {
    success: true,
    enrollmentId: result.enrollment.id,
    invoiceId: result.invoice?.id,
  };
}
```

#### **Duplicate Course Hook (Deep Clone)**

```typescript
// lib/actions/course.actions.ts

export async function duplicateCourse(courseId: string) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  // Fetch original course with all relations
  const original = await prisma.course.findFirst({
    where: { id: courseId, tenantId },
    include: {
      topics: {
        include: {
          lessons: true,
          activities: true,
        },
        orderBy: { order: "asc" },
      },
      faqs: { orderBy: { order: "asc" } },
    },
  });

  if (!original) {
    return { success: false, error: "Course not found" };
  }

  // 🔥 TRANSACTION - Deep clone course + topics + lessons + activities + FAQs
  const duplicate = await prisma.$transaction(async (tx) => {
    // 1. Create duplicate course
    const newCourse = await tx.course.create({
      data: {
        tenantId,
        title: `${original.title} (Copy)`,
        slug: `${original.slug}-copy-${Date.now()}`,
        description: original.description,
        shortDescription: original.shortDescription,
        categoryId: original.categoryId,
        courseType: original.courseType,
        authorName: original.authorName,
        instructorId: original.instructorId,
        paymentType: original.paymentType,
        invoiceTitle: original.invoiceTitle,
        regularPrice: original.regularPrice,
        offerPrice: original.offerPrice,
        currency: original.currency,
        featuredImage: original.featuredImage,
        introVideoUrl: original.introVideoUrl,
        status: "DRAFT", // ✅ Always draft
        isFeatured: false, // ✅ Not featured
        allowComments: original.allowComments,
        certificateEnabled: original.certificateEnabled,
        metaTitle: original.metaTitle,
        metaDescription: original.metaDescription,
        metaKeywords: original.metaKeywords,
      },
    });

    // 2. Clone topics
    for (const topic of original.topics) {
      const newTopic = await tx.courseTopic.create({
        data: {
          tenantId,
          courseId: newCourse.id,
          title: topic.title,
          description: topic.description,
          order: topic.order,
        },
      });

      // 3. Clone lessons
      for (const lesson of topic.lessons) {
        await tx.courseLesson.create({
          data: {
            tenantId,
            topicId: newTopic.id,
            title: lesson.title,
            description: lesson.description,
            lessonType: lesson.lessonType,
            contentUrl: lesson.contentUrl,
            contentText: lesson.contentText,
            iframeCode: lesson.iframeCode,
            duration: lesson.duration,
            videoProvider: lesson.videoProvider,
            attachments: lesson.attachments,
            accessType: lesson.accessType,
            password: lesson.password,
            allowDownload: lesson.allowDownload,
            isPreview: lesson.isPreview,
            order: lesson.order,
          },
        });
      }

      // 4. Clone activities
      for (const activity of topic.activities) {
        await tx.courseActivity.create({
          data: {
            tenantId,
            topicId: newTopic.id,
            activityType: activity.activityType,
            examId: activity.examId,
            title: activity.title,
            description: activity.description,
            duration: activity.duration,
            totalMarks: activity.totalMarks,
            passMarks: activity.passMarks,
            order: activity.order,
          },
        });
      }
    }

    // 5. Clone FAQs
    for (const faq of original.faqs) {
      await tx.courseFAQ.create({
        data: {
          tenantId,
          courseId: newCourse.id,
          question: faq.question,
          answer: faq.answer,
          order: faq.order,
        },
      });
    }

    return newCourse;
  });

  revalidatePath("/course-management/courses");

  return {
    success: true,
    courseId: duplicate.id,
    message: "Course duplicated successfully",
  };
}
```

---

### 4. Drag-and-Drop Reorder (Optimistic Update)

#### **Topic Reorder**

```typescript
// lib/actions/course-topic.actions.ts

export async function reorderTopics(
  courseId: string,
  topicIds: string[] // New order
) {
  await requireRole(["ADMIN", "TEACHER"]);
  const tenantId = await getTenantId();

  // Validate course ownership
  const course = await prisma.course.findFirst({
    where: { id: courseId, tenantId },
  });

  if (!course) {
    return { success: false, error: "Course not found" };
  }

  // 🔥 TRANSACTION - Update all topic orders atomically
  await prisma.$transaction(
    topicIds.map((topicId, index) =>
      prisma.courseTopic.updateMany({
        where: {
          id: topicId,
          courseId,
          tenantId, // ✅ Tenant isolation
        },
        data: { order: index },
      })
    )
  );

  revalidatePath(`/course-management/courses/${courseId}/builder`);

  return { success: true };
}
```

#### **Lesson Reorder**

```typescript
// lib/actions/course-lesson.actions.ts

export async function reorderLessons(topicId: string, lessonIds: string[]) {
  await requireRole(["ADMIN", "TEACHER"]);
  const tenantId = await getTenantId();

  // Validate topic ownership
  const topic = await prisma.courseTopic.findFirst({
    where: { id: topicId, tenantId },
  });

  if (!topic) {
    return { success: false, error: "Topic not found" };
  }

  // 🔥 TRANSACTION - Update all lesson orders atomically
  await prisma.$transaction(
    lessonIds.map((lessonId, index) =>
      prisma.courseLesson.updateMany({
        where: {
          id: lessonId,
          topicId,
          tenantId,
        },
        data: { order: index },
      })
    )
  );

  revalidatePath(`/course-management/courses/${topic.courseId}/builder`);

  return { success: true };
}
```

#### **Client-Side DnD Implementation**

```typescript
// components/course/topic-builder.tsx

"use client";

import { DragDropContext, Droppable, Draggable } from "@hello-pangea/dnd";
import { reorderTopics } from "@/lib/actions/course-topic.actions";

export function TopicBuilder({ courseId, topics }) {
  const [optimisticTopics, setOptimisticTopics] = useState(topics);

  const handleDragEnd = async (result) => {
    if (!result.destination) return;

    const items = Array.from(optimisticTopics);
    const [reorderedItem] = items.splice(result.source.index, 1);
    items.splice(result.destination.index, 0, reorderedItem);

    // ✅ Optimistic update (instant UI feedback)
    setOptimisticTopics(items);

    // ✅ Server update
    const topicIds = items.map((item) => item.id);
    const result = await reorderTopics(courseId, topicIds);

    if (!result.success) {
      // ✅ Rollback on error
      setOptimisticTopics(topics);
      toast.error("Failed to reorder topics");
    }
  };

  return (
    <DragDropContext onDragEnd={handleDragEnd}>
      <Droppable droppableId="topics">
        {(provided) => (
          <div {...provided.droppableProps} ref={provided.innerRef}>
            {optimisticTopics.map((topic, index) => (
              <Draggable key={topic.id} draggableId={topic.id} index={index}>
                {(provided) => (
                  <div
                    ref={provided.innerRef}
                    {...provided.draggableProps}
                    {...provided.dragHandleProps}
                  >
                    {/* Topic content */}
                  </div>
                )}
              </Draggable>
            ))}
            {provided.placeholder}
          </div>
        )}
      </Droppable>
    </DragDropContext>
  );
}
```

---

### 5. Quiz/Activity Save (Transaction Required)

```typescript
// lib/actions/course-activity.actions.ts

export async function createQuizActivity(
  topicId: string,
  data: {
    title: string;
    description?: string;
    questions: QuizQuestion[]; // Array of questions
    duration?: number;
    totalMarks: number;
    passMarks: number;
  }
) {
  await requireRole(["ADMIN", "TEACHER"]);
  const tenantId = await getTenantId();

  // Validate topic ownership
  const topic = await prisma.courseTopic.findFirst({
    where: { id: topicId, tenantId },
    include: { course: true },
  });

  if (!topic) {
    return { success: false, error: "Topic not found" };
  }

  // 🔥 TRANSACTION - Create activity + questions atomically
  const result = await prisma.$transaction(async (tx) => {
    // 1. Create exam in exam module
    const exam = await tx.exam.create({
      data: {
        tenantId,
        title: data.title,
        description: data.description,
        duration: data.duration,
        totalMarks: data.totalMarks,
        passMarks: data.passMarks,
        examType: "QUIZ",
        status: "PUBLISHED",
      },
    });

    // 2. Create questions
    for (const [index, question] of data.questions.entries()) {
      await tx.examQuestion.create({
        data: {
          tenantId,
          examId: exam.id,
          questionText: question.text,
          questionType: question.type,
          options: question.options,
          correctAnswer: question.correctAnswer,
          marks: question.marks,
          order: index,
        },
      });
    }

    // 3. Link to course activity
    const activity = await tx.courseActivity.create({
      data: {
        tenantId,
        topicId,
        activityType: "QUIZ",
        examId: exam.id,
        title: data.title,
        description: data.description,
        duration: data.duration,
        totalMarks: data.totalMarks,
        passMarks: data.passMarks,
        order: 0, // Will be updated by reorder
      },
    });

    return { exam, activity };
  });

  revalidatePath(`/course-management/courses/${topic.courseId}/builder`);

  return {
    success: true,
    activityId: result.activity.id,
    examId: result.exam.id,
  };
}
```

---

### 6. Performance & Aggregate Optimization

#### **Problem: N+1 Query**

```typescript
// ❌ BAD - N+1 queries
const courses = await prisma.course.findMany({ where: { tenantId } })

for (const course of courses) {
  const topics = await prisma.courseTopic.count({ where: { courseId: course.id } })
  const lessons = await prisma.courseLesson.count({ ... })
  // This runs 2 queries per course!
}
```

#### **Solution: Use Prisma Include + Aggregate**

```typescript
// ✅ GOOD - Single query with aggregates
const courses = await prisma.course.findMany({
  where: { tenantId },
  include: {
    _count: {
      select: {
        topics: true,
        enrollments: true,
      },
    },
    topics: {
      include: {
        _count: {
          select: {
            lessons: true,
            activities: true,
          },
        },
      },
    },
  },
});

// Access counts directly
courses.forEach((course) => {
  console.log(course._count.topics); // No extra query
  console.log(course._count.enrollments);
});
```

#### **Computed Fields (Update on Change)**

```typescript
// Update course stats when lesson is added
export async function createLesson(topicId: string, data: LessonInput) {
  await requireRole(["ADMIN", "TEACHER"]);
  const tenantId = await getTenantId();

  const topic = await prisma.courseTopic.findFirst({
    where: { id: topicId, tenantId },
    include: { course: true },
  });

  if (!topic) {
    return { success: false, error: "Topic not found" };
  }

  // 🔥 TRANSACTION - Create lesson + update course stats
  await prisma.$transaction(async (tx) => {
    // 1. Create lesson
    const lesson = await tx.courseLesson.create({
      data: { ...data, tenantId, topicId },
    });

    // 2. Update course stats
    await tx.course.update({
      where: { id: topic.courseId },
      data: {
        totalLessons: { increment: 1 },
        totalDuration: { increment: data.duration || 0 },
      },
    });
  });

  revalidatePath(`/course-management/courses/${topic.courseId}/builder`);
  return { success: true };
}
```

#### **Pagination for Large Lists**

```typescript
// ✅ Always paginate course lists
export async function getCourses(params: {
  page?: number;
  limit?: number;
  categoryId?: string;
  status?: CourseStatus;
  search?: string;
}) {
  const tenantId = await getTenantId();
  const page = params.page || 1;
  const limit = params.limit || 20;
  const skip = (page - 1) * limit;

  const where = {
    tenantId,
    ...(params.categoryId && { categoryId: params.categoryId }),
    ...(params.status && { status: params.status }),
    ...(params.search && {
      OR: [
        { title: { contains: params.search, mode: "insensitive" } },
        { description: { contains: params.search, mode: "insensitive" } },
      ],
    }),
  };

  const [courses, total] = await Promise.all([
    prisma.course.findMany({
      where,
      skip,
      take: limit,
      orderBy: { createdAt: "desc" },
      include: {
        category: true,
        instructor: true,
        _count: { select: { enrollments: true } },
      },
    }),
    prisma.course.count({ where }),
  ]);

  return {
    courses,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  };
}
```

---

### 7. Audit Trail (Optional but Recommended)

#### **Schema Addition**

```prisma
model AuditLog {
  id          String   @id @default(cuid())
  tenantId    String

  userId      String
  user        User     @relation(fields: [userId], references: [id])

  action      String   // "CREATE_COURSE", "UPDATE_COURSE", "DELETE_COURSE"
  entityType  String   // "Course", "Topic", "Lesson"
  entityId    String

  changes     Json?    // Before/after values
  ipAddress   String?
  userAgent   String?

  createdAt   DateTime @default(now())

  @@index([tenantId, entityType, entityId])
  @@index([userId])
}
```

#### **Audit Helper**

```typescript
// lib/audit.ts

export async function logAudit(params: {
  action: string;
  entityType: string;
  entityId: string;
  changes?: any;
}) {
  const tenantId = await getTenantId();
  const user = await getCurrentUser();

  await prisma.auditLog.create({
    data: {
      tenantId,
      userId: user.id,
      action: params.action,
      entityType: params.entityType,
      entityId: params.entityId,
      changes: params.changes,
      ipAddress: await getClientIP(),
      userAgent: await getUserAgent(),
    },
  });
}
```

#### **Usage in Server Actions**

```typescript
export async function deleteCourse(courseId: string) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();

  const course = await prisma.course.findFirst({
    where: { id: courseId, tenantId },
  });

  if (!course) {
    return { success: false, error: "Course not found" };
  }

  await prisma.course.delete({
    where: { id: courseId, tenantId },
  });

  // ✅ Log audit trail
  await logAudit({
    action: "DELETE_COURSE",
    entityType: "Course",
    entityId: courseId,
    changes: { title: course.title, status: course.status },
  });

  revalidatePath("/course-management/courses");
  return { success: true };
}
```

---

## 📋 Quick Reference Checklist (For Every Server Action)

Copy this checklist when creating ANY new server action:

```typescript
export async function yourActionName(params) {
  // ✅ 1. ROLE GUARD (First line)
  await requireRole("ADMIN"); // or ['ADMIN', 'TEACHER']

  // ✅ 2. TENANT ID (Second line)
  const tenantId = await getTenantId();

  // ✅ 3. ZOD VALIDATION (Third)
  const schema = z.object({
    field: z.string().min(1).max(100),
  });
  const validated = schema.parse(params);

  // ✅ 4. OWNERSHIP CHECK (For update/delete)
  const entity = await prisma.entity.findFirst({
    where: { id: params.id, tenantId },
  });
  if (!entity) {
    return { success: false, error: "Not found" };
  }

  // ✅ 5. TRANSACTION (If multiple operations)
  await prisma.$transaction(async (tx) => {
    // Multiple operations here
  });

  // ✅ 6. TENANT ISOLATION (All queries)
  await prisma.entity.create({
    data: { ...validated, tenantId }, // ✅ Always include tenantId
  });

  // ✅ 7. REVALIDATE PATH
  revalidatePath("/your-page");

  // ✅ 8. AUDIT LOG (Optional but recommended)
  await logAudit({
    action: "ACTION_NAME",
    entityType: "EntityType",
    entityId: entity.id,
  });

  // ✅ 9. RETURN CONSISTENT FORMAT
  return { success: true, data: entity };
}
```

### Common Mistakes to Avoid

| ❌ DON'T                                 | ✅ DO                                                   |
| ---------------------------------------- | ------------------------------------------------------- |
| `await prisma.course.findMany()`         | `await prisma.course.findMany({ where: { tenantId } })` |
| `async function saveCourse(data: any)`   | `async function createCourse(data: CourseInput)`        |
| Multiple entity operations in one action | Separate actions OR use transaction                     |
| `alert('Deleted')`                       | `toast.success('Deleted successfully')`                 |
| Hardcoded colors                         | Use theme CSS variables                                 |
| `<Select>` for 10+ items                 | Use `<SearchableDropdown>`                              |
| Base64 file storage                      | Use `StorageService`                                    |
| Manual state for forms                   | Use React Hook Form + Zod                               |
| Browser `confirm()`                      | Use `<AlertDialog>`                                     |
| Forget dark mode classes                 | Always add `dark:` variants                             |

---

## 🎯 Implementation Priority Order

### Phase 1: Foundation (Week 1-2)

1. ✅ Create Prisma schema (all 9 models + enums)
2. ✅ Run migration
3. ✅ Create server actions structure (7 files)
4. ✅ Build Course Category CRUD page
5. ✅ Test dark mode + RBAC + tenant isolation

### Phase 2: Course Creation (Week 3-4)

1. ✅ Course type selection page
2. ✅ Single course form (6 tabs)
3. ✅ Bundle course form
4. ✅ Course list page with filters
5. ✅ Duplicate course functionality
6. ✅ Test all validations

### Phase 3: Course Builder (Week 5-6)

1. ✅ Topic CRUD + DnD reorder
2. ✅ Lesson CRUD (all 7 types) + DnD reorder
3. ✅ Activity/Quiz integration
4. ✅ File upload for videos/documents
5. ✅ Preview functionality
6. ✅ Test all lesson types

### Phase 4: Enrollment & Student View (Week 7-8)

1. ✅ Enrollment management page
2. ✅ Manual enrollment + auto invoice
3. ✅ Student course catalog
4. ✅ Student course player
5. ✅ Progress tracking
6. ✅ Certificate generation (if enabled)

### Phase 5: Polish & Optimization (Week 9)

1. ✅ Performance optimization (N+1 queries)
2. ✅ Audit trail implementation
3. ✅ SEO optimization
4. ✅ Mobile responsiveness
5. ✅ Comprehensive testing
6. ✅ Documentation

---

## 🚀 Getting Started

### Step 1: Create Database Schema

```bash
# Add all models to prisma/schema.prisma
# Then run:
npx prisma generate
npx prisma migrate dev --name course_management_init
```

### Step 2: Create Server Actions Structure

```bash
# Create action files
mkdir -p lib/actions
touch lib/actions/course-category.actions.ts
touch lib/actions/course.actions.ts
touch lib/actions/course-topic.actions.ts
touch lib/actions/course-lesson.actions.ts
touch lib/actions/course-activity.actions.ts
touch lib/actions/course-enrollment.actions.ts
touch lib/actions/course-faq.actions.ts
```

### Step 3: Create Page Structure

```bash
# Create course management pages
mkdir -p app/\(dashboard\)/course-management/categories
mkdir -p app/\(dashboard\)/course-management/courses/new
mkdir -p app/\(dashboard\)/course-management/courses/create/single
mkdir -p app/\(dashboard\)/course-management/courses/create/bundle
```

### Step 4: Install Dependencies (if needed)

```bash
# For drag-and-drop
npm install @hello-pangea/dnd

# For rich text editor (choose one)
npm install @tiptap/react @tiptap/starter-kit
# OR
npm install tinymce @tinymce/tinymce-react
```

---

## 📚 Additional Resources

### Related Documentation

- `PHASE_1_COMPLETE.md` - Academic Setup implementation reference
- `README_FIXES.md` - UI/UX fixes and patterns
- `.augment/rules/lms-rule.md` - Global architecture rules

### Key Files to Reference

- `app/(dashboard)/academic-setup/cohorts/cohorts-client.tsx` - Filter + table pattern
- `components/ui/searchable-dropdown.tsx` - Dropdown component
- `components/ui/multi-select-dropdown.tsx` - Multi-select component
- `lib/storage/storage-service.ts` - File upload service
- `lib/rbac.ts` - Role-based access control

### Design Patterns

- **Server Components** - Data fetching (page.tsx)
- **Client Components** - Interactivity (\*-client.tsx)
- **Server Actions** - Mutations (lib/actions/\*.actions.ts)
- **Form Pattern** - React Hook Form + Zod + shadcn Form
- **Modal Pattern** - shadcn Dialog for CRUD
- **Delete Pattern** - AlertDialog confirmation
- **Theme Pattern** - CSS custom properties + dark mode

---

**Documentation Created:** 2025-11-04
**Last Updated:** 2025-11-04
**Status:** ✅ **PLANNING COMPLETE - READY FOR IMPLEMENTATION**
**Next Step:** Start Sprint 1 - Database Schema & Category Management
**Estimated Timeline:** 8-9 weeks for complete implementation

---

## 📞 Questions or Clarifications?

If you need clarification on any section:

1. Check the **Quick Reference Checklist** above
2. Review the **Common Mistakes** table
3. Reference existing Academic Setup pages for patterns
4. Ask specific questions about implementation details

**Remember:** Follow Codex guidelines strictly - TenantId + Role Guard + Transactions + Audit Trail! 🔒
