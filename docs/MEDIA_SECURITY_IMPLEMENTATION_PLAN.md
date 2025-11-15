# 🔒 COMPREHENSIVE MEDIA SECURITY IMPLEMENTATION PLAN

**Created:** 2025-01-15  
**Status:** 📋 Planning Phase  
**Scope:** ALL media types (Audio, Images, Documents, Videos, Files)  
**Current Security Level:** 🔴 30% (Baseline - Tenant isolation only)  
**Target Security Level:** 🟢 95% (Production-ready)

---

## 📊 EXECUTIVE SUMMARY

### **Problem Statement:**
The LMS currently stores all media files (audio, images, student documents, assignments, exam papers) with **tenant isolation only**. However, there are **NO permission checks** at the API level, meaning:

- ❌ Any authenticated user can access any file within their tenant by guessing URLs
- ❌ Students can access other students' documents, assignments, grade reports
- ❌ Teachers can access admin-only files
- ❌ File URLs are visible in browser DevTools and never expire
- ❌ Download restrictions are UI-only (easily bypassed)

### **Impact:**
- 🔴 **Critical:** Student documents (birth certificates, marksheets) exposed
- 🔴 **Critical:** Assignment submissions accessible by other students (plagiarism risk)
- 🔴 **Critical:** Exam papers accessible before exam date (exam integrity compromised)
- 🔴 **Critical:** Grade reports accessible by unauthorized users (privacy violation)
- 🟠 **High:** Question bank audio/images can be bulk downloaded (content theft)
- 🟡 **Medium:** Student photos accessible by anyone in tenant

### **Solution:**
Implement **3-phase security rollout** with **zero downtime** and **backward compatibility**.

---

## 🎯 SECURITY GAPS IDENTIFIED

### **Gap 1: No Permission Checks in API Route** 🔴 **CRITICAL**

**Current Code:**
```typescript
// app/api/storage/[...path]/route.ts
export async function GET(request, { params }) {
  const filePath = pathArray.join('/')
  const tenantId = await getTenantId()
  
  // ❌ Only checks tenant isolation
  if (!filePath.startsWith(`tenants/${tenantId}/`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }
  
  // ❌ NO role-based permission checks
  // ❌ NO ownership verification
  // ❌ NO file type classification
  
  return serveFile(filePath)
}
```

**Vulnerability:**
```
Student A can access Student B's files:
/api/storage/tenants/tenant_1/students/documents/student_B_id/birth_cert.pdf ❌

Teacher can access admin-only exam papers:
/api/storage/tenants/tenant_1/exams/final_exam_2025.pdf ❌

Student can access grade reports of other students:
/api/storage/tenants/tenant_1/grades/student_C_id/report.pdf ❌
```

**Affected Media Types:**
- 🔴 Student documents (birth cert, transfer cert, marksheets)
- 🔴 Assignment submissions
- 🔴 Exam papers
- 🔴 Grade reports
- 🟠 Question bank audio/images
- 🟡 Student photos
- 🟡 Course materials

**Severity:** 🔴 **CRITICAL** - Privacy violation, academic integrity risk, legal issues

---

### **Gap 2: No Signed URLs (Local Storage)** 🔴 **HIGH**

**Current Behavior:**
```typescript
// File uploaded
const url = await storageService.uploadStudentDocument(studentId, 'birth_cert', file)
// Returns: /api/storage/tenants/tenant_1/students/documents/student_123/birth_cert.pdf

// URL is permanent and predictable
// Can be shared, bookmarked, accessed anytime
// Never expires ❌
```

**Vulnerability:**
- URLs never expire (can be shared permanently)
- Predictable file paths (can be brute-forced)
- No time-limited access control

**Affected Media Types:**
- 🔴 All private files (documents, assignments, grades, exam papers)

**Severity:** 🔴 **HIGH** - Permanent access, URL sharing risk

---

### **Gap 3: URL Visible in HTML/DevTools** 🔴 **HIGH**

**Current Behavior:**
```html
<!-- Audio player -->
<audio src="/api/storage/tenants/tenant_1/questions/audio/temp/123.webm"></audio>

<!-- Image in editor -->
<img src="/api/storage/tenants/tenant_1/questions/images/456.jpg" />

<!-- Student photo -->
<img src="/api/storage/tenants/tenant_1/students/photos/789/profile.jpg" />
```

**Vulnerability:**
- Right-click → Inspect Element → See full URL
- Browser DevTools → Network tab → Copy URL
- Console → `document.querySelector('audio').src` → Get URL
- Easy to copy and share

**Affected Media Types:**
- 🟠 All media embedded in HTML (audio, images, videos)

**Severity:** 🔴 **HIGH** - Easy URL extraction

---

### **Gap 4: Public Cache Headers for Private Files** 🟡 **MEDIUM**

**Current Code:**
```typescript
// app/api/storage/[...path]/route.ts
return new NextResponse(fileBuffer, {
  headers: {
    'Content-Type': mimeType,
    'Cache-Control': 'public, max-age=31536000', // ❌ 1 year cache for ALL files
  },
})
```

**Vulnerability:**
- Private files cached in browser for 1 year
- Cached files accessible even after permission revoked
- Shared computers = security risk

**Affected Media Types:**
- 🔴 Student documents, assignments, grades, exam papers

**Severity:** 🟡 **MEDIUM** - Cache persistence risk

---

### **Gap 5: Predictable File Paths** 🟡 **MEDIUM**

**Current Pattern:**
```
/api/storage/tenants/{tenantId}/students/documents/{studentId}/birth_cert.pdf
/api/storage/tenants/{tenantId}/students/documents/{studentId}/marksheet.pdf
/api/storage/tenants/{tenantId}/assignments/{assignmentId}/{studentId}/submission.pdf
```

**Vulnerability:**
- Sequential student IDs can be guessed
- File names are predictable (birth_cert, marksheet, etc.)
- Brute force possible

**Severity:** 🟡 **MEDIUM** - Enumeration risk

---

### **Gap 6: Download Permission Bypass** 🟠 **MEDIUM**

**Current Implementation:**
```typescript
// UI-level restriction only
<CustomAudioPlayer src={url} allowDownload={false} />

// But API serves file without checking allowDownload flag ❌
// User can still download via:
// - Direct URL access
// - Browser DevTools → Network → Save
// - curl/wget command
```

**Severity:** 🟠 **MEDIUM** - UI-only restriction (easily bypassed)

---

## 📋 MEDIA TYPE CLASSIFICATION

### **Category 1: CRITICAL PRIVATE FILES** 🔴

**Files:**
- Student documents (birth cert, transfer cert, marksheets, ID cards)
- Assignment submissions
- Exam papers (before exam date)
- Grade reports, transcripts
- Financial documents (invoices, receipts)
- Staff documents (contracts, salary slips)

**Security Requirements:**
- ✅ **Mandatory:** Role-based permission checks
- ✅ **Mandatory:** Ownership verification
- ✅ **Mandatory:** Signed URLs with expiration (1 hour)
- ✅ **Mandatory:** Private cache headers
- ✅ **Mandatory:** Audit trail (who accessed, when)
- ✅ **Recommended:** Random tokens in file names

**Access Rules:**
- **ADMIN:** Can access all files
- **TEACHER:** Can access their students' files only
- **STUDENT:** Can access only their own files
- **PARENT:** Can access only their child's files (future)

---

### **Category 2: SENSITIVE MEDIA FILES** 🟠

**Files:**
- Question bank audio/images
- Course materials (paid courses)
- Live class recordings
- Assessment content

**Security Requirements:**
- ✅ **Mandatory:** Role-based permission checks
- ✅ **Mandatory:** Enrollment verification (for course materials)
- ✅ **Recommended:** Signed URLs (optional for performance)
- ✅ **Recommended:** Private cache headers
- ⚠️ **Optional:** Audit trail

**Access Rules:**
- **ADMIN:** Can access all
- **TEACHER:** Can access their course materials
- **STUDENT:** Can access only enrolled course materials
- **PUBLIC:** No access

---

### **Category 3: PUBLIC MEDIA FILES** 🟢

**Files:**
- Student profile photos (if public profile enabled)
- Teacher profile photos
- School logo, banners
- Public course thumbnails
- Public announcements

**Security Requirements:**
- ✅ **Mandatory:** Tenant isolation only
- ✅ **Optional:** Role-based checks (if profile is private)
- ❌ **Not needed:** Signed URLs (performance impact)
- ✅ **Recommended:** Public cache headers (1 year)

**Access Rules:**
- **Anyone in tenant:** Can access
- **Public (future):** Can access if public profile enabled

---

## 🚀 3-PHASE IMPLEMENTATION STRATEGY

### **PHASE 1: QUICK WINS (Week 1) - CRITICAL FILES FIRST** 🔴

**Goal:** Secure critical files (student documents, assignments, exams, grades) with **70% security improvement**

**Effort:** 8-12 hours  
**Risk:** 🟢 Low (backward compatible)  
**Downtime:** ⏱️ Zero

#### **Task 1.1: Add Permission Checks in API Route** (4-5 hours)

**File:** `app/api/storage/[...path]/route.ts`

**Implementation:**

```typescript
export async function GET(request, { params }) {
  const { path: pathArray } = await params
  const filePath = pathArray.join('/')
  const tenantId = await getTenantId()
  const currentUser = await getCurrentUser()

  // Step 1: Tenant isolation (existing)
  if (!filePath.startsWith(`tenants/${tenantId}/`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Step 2: Classify file type
  const fileCategory = classifyFile(filePath)

  // Step 3: Permission checks based on category
  if (fileCategory === 'CRITICAL_PRIVATE') {
    const hasPermission = await checkCriticalFilePermission(currentUser, filePath)
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  } else if (fileCategory === 'SENSITIVE_MEDIA') {
    const hasPermission = await checkSensitiveMediaPermission(currentUser, filePath)
    if (!hasPermission) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 })
    }
  }
  // PUBLIC files: no additional checks

  // Step 4: Set appropriate cache headers
  const cacheControl = fileCategory === 'PUBLIC'
    ? 'public, max-age=31536000'  // 1 year
    : 'private, no-cache, no-store, must-revalidate'  // No cache

  // Step 5: Serve file
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': mimeType,
      'Cache-Control': cacheControl,
    },
  })
}

// Helper: Classify file based on path
function classifyFile(filePath: string): 'CRITICAL_PRIVATE' | 'SENSITIVE_MEDIA' | 'PUBLIC' {
  if (filePath.includes('/students/documents/')) return 'CRITICAL_PRIVATE'
  if (filePath.includes('/assignments/submissions/')) return 'CRITICAL_PRIVATE'
  if (filePath.includes('/exams/papers/')) return 'CRITICAL_PRIVATE'
  if (filePath.includes('/grades/reports/')) return 'CRITICAL_PRIVATE'
  if (filePath.includes('/questions/audio/')) return 'SENSITIVE_MEDIA'
  if (filePath.includes('/questions/images/')) return 'SENSITIVE_MEDIA'
  if (filePath.includes('/courses/materials/')) return 'SENSITIVE_MEDIA'
  if (filePath.includes('/students/photos/')) return 'PUBLIC'
  if (filePath.includes('/teachers/photos/')) return 'PUBLIC'
  return 'PUBLIC'
}

// Helper: Check permission for critical files
async function checkCriticalFilePermission(user: User, filePath: string): Promise<boolean> {
  // ADMIN: Full access
  if (user.role === 'ADMIN') return true

  // Extract entity ID from path
  const studentId = extractStudentIdFromPath(filePath)
  const assignmentId = extractAssignmentIdFromPath(filePath)

  // STUDENT: Only their own files
  if (user.role === 'STUDENT') {
    const student = await prisma.student.findFirst({
      where: { userId: user.id, id: studentId }
    })
    return !!student
  }

  // TEACHER: Their students' files only
  if (user.role === 'TEACHER') {
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId: studentId,
        section: {
          routines: {
            some: { teacherId: user.teacherId }
          }
        }
      }
    })
    return !!enrollment
  }

  return false
}

// Helper: Check permission for sensitive media
async function checkSensitiveMediaPermission(user: User, filePath: string): Promise<boolean> {
  // ADMIN: Full access
  if (user.role === 'ADMIN') return true

  // TEACHER: Can access question bank
  if (user.role === 'TEACHER') return true

  // STUDENT: Can access enrolled course materials only
  if (user.role === 'STUDENT') {
    if (filePath.includes('/courses/materials/')) {
      const courseId = extractCourseIdFromPath(filePath)
      const enrollment = await prisma.enrollment.findFirst({
        where: {
          studentId: user.studentId,
          courseId: courseId,
          status: { in: ['PAID', 'FREE'] }
        }
      })
      return !!enrollment
    }
    // Question bank: no access for students
    return false
  }

  return false
}
```

**Testing:**
```bash
# Test 1: Student accessing their own document (should work)
curl -H "Cookie: session=student_A" \
  http://localhost:3000/api/storage/tenants/tenant_1/students/documents/student_A_id/birth_cert.pdf
# Expected: 200 OK

# Test 2: Student accessing another student's document (should fail)
curl -H "Cookie: session=student_A" \
  http://localhost:3000/api/storage/tenants/tenant_1/students/documents/student_B_id/birth_cert.pdf
# Expected: 403 Forbidden

# Test 3: Teacher accessing their student's document (should work)
curl -H "Cookie: session=teacher_X" \
  http://localhost:3000/api/storage/tenants/tenant_1/students/documents/student_A_id/birth_cert.pdf
# Expected: 200 OK (if student_A is in teacher_X's class)

# Test 4: Admin accessing any document (should work)
curl -H "Cookie: session=admin" \
  http://localhost:3000/api/storage/tenants/tenant_1/students/documents/student_A_id/birth_cert.pdf
# Expected: 200 OK
```

**Effort:** 4-5 hours
**Files Changed:** 1 file (`app/api/storage/[...path]/route.ts`)
**Lines Added:** ~150 lines
**Breaking Changes:** ❌ None (backward compatible)

---

#### **Task 1.2: Fix Cache Headers for Private Files** (30 mins)

**Already included in Task 1.1** ✅

**Result:**
- Critical files: `Cache-Control: private, no-cache, no-store`
- Public files: `Cache-Control: public, max-age=31536000`

---

#### **Task 1.3: Add Random Tokens to New Uploads** (1-2 hours)

**File:** `lib/storage/local-storage.ts` and `lib/storage/r2-storage.ts`

**Current:**
```typescript
// Predictable path
const filePath = `tenants/${tenantId}/students/documents/${studentId}/birth_cert.pdf`
```

**New:**
```typescript
import { randomBytes } from 'crypto'

// Random token added
const token = randomBytes(16).toString('hex')
const filePath = `tenants/${tenantId}/students/documents/${studentId}/${token}_birth_cert.pdf`
// Example: tenants/tenant_1/students/documents/student_123/a3f5e9d2c1b4.../birth_cert.pdf
```

**Implementation:**
```typescript
// lib/storage/storage-service.ts
export class StorageService {
  async uploadStudentDocument(
    studentId: string,
    documentType: string,
    file: File
  ): Promise<string> {
    const tenantId = await getTenantId()
    const token = randomBytes(16).toString('hex')
    const fileName = `${token}_${documentType}.${getFileExtension(file.name)}`
    const category = `students/documents/${studentId}`

    return this.adapter.upload(category, fileName, file, {
      isPublic: false,  // Private file
      metadata: {
        studentId,
        documentType,
        uploadedAt: new Date().toISOString(),
      }
    })
  }
}
```

**Note:** This only affects **NEW uploads**. Old files remain accessible (backward compatible).

**Effort:** 1-2 hours
**Files Changed:** 2 files
**Breaking Changes:** ❌ None (only new uploads)

---

#### **Task 1.4: Create Helper Functions** (1 hour)

**File:** `lib/storage/file-permissions.ts` (NEW)

```typescript
import { prisma } from '@/lib/prisma'
import { User } from '@/types'

export async function checkStudentDocumentPermission(
  user: User,
  studentId: string
): Promise<boolean> {
  if (user.role === 'ADMIN') return true

  if (user.role === 'STUDENT') {
    const student = await prisma.student.findFirst({
      where: { userId: user.id, id: studentId }
    })
    return !!student
  }

  if (user.role === 'TEACHER') {
    const enrollment = await prisma.studentEnrollment.findFirst({
      where: {
        studentId,
        section: {
          routines: {
            some: { teacherId: user.teacherId }
          }
        }
      }
    })
    return !!enrollment
  }

  return false
}

export async function checkAssignmentPermission(
  user: User,
  assignmentId: string,
  studentId: string
): Promise<boolean> {
  if (user.role === 'ADMIN') return true

  if (user.role === 'STUDENT') {
    return user.studentId === studentId
  }

  if (user.role === 'TEACHER') {
    const assignment = await prisma.assignment.findFirst({
      where: {
        id: assignmentId,
        teacherId: user.teacherId
      }
    })
    return !!assignment
  }

  return false
}

export async function checkCourseEnrollment(
  user: User,
  courseId: string
): Promise<boolean> {
  if (user.role === 'ADMIN') return true
  if (user.role === 'TEACHER') return true

  if (user.role === 'STUDENT') {
    const enrollment = await prisma.enrollment.findFirst({
      where: {
        studentId: user.studentId,
        courseId,
        status: { in: ['PAID', 'FREE'] }
      }
    })
    return !!enrollment
  }

  return false
}
```

**Effort:** 1 hour
**Files Changed:** 1 new file

---

#### **Phase 1 Summary:**

**Total Effort:** 8-12 hours
**Files Changed:** 3 files (1 modified, 2 new)
**Security Improvement:** 🔴 30% → 🟡 70%
**Breaking Changes:** ❌ None
**Downtime:** ⏱️ Zero

**What's Secured:**
- ✅ Student documents (birth cert, marksheets, etc.)
- ✅ Assignment submissions
- ✅ Exam papers
- ✅ Grade reports
- ✅ Question bank audio/images (teacher-only access)
- ✅ Course materials (enrollment-based access)

**What's NOT Secured Yet:**
- ❌ URLs still visible in DevTools
- ❌ URLs never expire (no signed URLs)
- ❌ Download permission not enforced

---

### **PHASE 2: ADVANCED SECURITY (Week 2) - SIGNED URLs & BLOB URLS** 🟢

**Goal:** Implement signed URLs and blob URLs for **95% security**

**Effort:** 12-16 hours
**Risk:** 🟡 Medium (requires backward compatibility layer)
**Downtime:** ⏱️ Zero

#### **Task 2.1: Implement Signed URLs for Local Storage** (4-5 hours)

**Concept:**
```
Old URL (permanent):
/api/storage/tenants/tenant_1/students/documents/student_123/birth_cert.pdf

New URL (expires in 1 hour):
/api/storage/signed?path=tenants/...&token=eyJhbGc...&expires=1234567890
```

**Implementation:**

**File:** `lib/storage/signed-urls.ts` (NEW)

```typescript
import jwt from 'jsonwebtoken'

const JWT_SECRET = process.env.JWT_SECRET || 'your-secret-key'

export function generateSignedUrl(filePath: string, expiresIn: number = 3600): string {
  const token = jwt.sign(
    {
      filePath,
      expiresAt: Date.now() + expiresIn * 1000,
    },
    JWT_SECRET,
    { expiresIn: `${expiresIn}s` }
  )

  return `/api/storage/signed?path=${encodeURIComponent(filePath)}&token=${token}`
}

export function verifySignedUrl(token: string, filePath: string): boolean {
  try {
    const decoded = jwt.verify(token, JWT_SECRET) as { filePath: string; expiresAt: number }

    // Check if token matches path
    if (decoded.filePath !== filePath) return false

    // Check if expired
    if (Date.now() > decoded.expiresAt) return false

    return true
  } catch (error) {
    return false
  }
}
```

**File:** `app/api/storage/signed/route.ts` (NEW)

```typescript
import { NextRequest, NextResponse } from 'next/server'
import { verifySignedUrl } from '@/lib/storage/signed-urls'
import { getTenantId } from '@/lib/auth'
import { serveFile } from '@/lib/storage/file-server'

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams
  const filePath = searchParams.get('path')
  const token = searchParams.get('token')

  if (!filePath || !token) {
    return NextResponse.json({ error: 'Missing parameters' }, { status: 400 })
  }

  // Verify signed URL
  const isValid = verifySignedUrl(token, filePath)
  if (!isValid) {
    return NextResponse.json({ error: 'Invalid or expired token' }, { status: 401 })
  }

  // Verify tenant isolation
  const tenantId = await getTenantId()
  if (!filePath.startsWith(`tenants/${tenantId}/`)) {
    return NextResponse.json({ error: 'Unauthorized' }, { status: 403 })
  }

  // Serve file
  return serveFile(filePath, {
    cacheControl: 'private, no-cache, no-store, must-revalidate'
  })
}
```

**Update StorageService:**

```typescript
// lib/storage/storage-service.ts
import { generateSignedUrl } from './signed-urls'

export class StorageService {
  async uploadStudentDocument(
    studentId: string,
    documentType: string,
    file: File
  ): Promise<string> {
    const url = await this.adapter.upload(...)

    // For local storage, return signed URL
    if (this.adapter instanceof LocalStorageAdapter) {
      return generateSignedUrl(url, 3600)  // 1 hour expiration
    }

    // For R2, signed URLs are automatic
    return url
  }
}
```

**Backward Compatibility:**

```typescript
// app/api/storage/[...path]/route.ts
export async function GET(request, { params }) {
  // ... existing permission checks ...

  // Check if signed URLs are enabled
  const useSignedUrls = process.env.STORAGE_USE_SIGNED_URLS === 'true'

  if (useSignedUrls && fileCategory === 'CRITICAL_PRIVATE') {
    // Redirect to signed URL
    const signedUrl = generateSignedUrl(filePath, 3600)
    return NextResponse.redirect(new URL(signedUrl, request.url))
  }

  // Fallback: serve file directly (for backward compatibility)
  return serveFile(filePath)
}
```

**Environment Variable:**
```env
# .env
STORAGE_USE_SIGNED_URLS=true  # Enable signed URLs
```

**Effort:** 4-5 hours
**Files Changed:** 3 new files, 2 modified
**Breaking Changes:** ❌ None (feature flag controlled)

---

#### **Task 2.2: Implement Blob URLs in Frontend** (3-4 hours)

**Concept:**
```
Old (URL visible):
<audio src="/api/storage/tenants/.../audio.webm"></audio>

New (URL hidden):
<audio src="blob:http://localhost:3000/abc123-def456"></audio>
```

**Implementation:**

**File:** `components/ui/custom-audio-player.tsx`

```typescript
'use client'

import { useEffect, useState } from 'react'

export function CustomAudioPlayer({ src, allowDownload }: Props) {
  const [blobUrl, setBlobUrl] = useState<string | null>(null)

  useEffect(() => {
    // Fetch file and create blob URL
    async function loadAudio() {
      const response = await fetch(src, {
        credentials: 'include'  // Include session cookie
      })

      if (!response.ok) {
        console.error('Failed to load audio')
        return
      }

      const blob = await response.blob()
      const url = URL.createObjectURL(blob)
      setBlobUrl(url)
    }

    loadAudio()

    // Cleanup
    return () => {
      if (blobUrl) {
        URL.revokeObjectURL(blobUrl)
      }
    }
  }, [src])

  if (!blobUrl) {
    return <div>Loading audio...</div>
  }

  return (
    <div className="custom-audio-player">
      <audio ref={audioRef} src={blobUrl} preload="metadata" />
      {/* ... rest of player UI ... */}
    </div>
  )
}
```

**Benefits:**
- ✅ Original URL hidden from DevTools
- ✅ Blob URL is temporary (revoked on unmount)
- ✅ Cannot be copied or shared
- ✅ Works with signed URLs (fetches with session cookie)

**Effort:** 3-4 hours
**Files Changed:** 3 files (audio player, image component, video player)

---

#### **Task 2.3: Enforce Download Permission in API** (2 hours)

**File:** `app/api/storage/[...path]/route.ts`

```typescript
export async function GET(request, { params }) {
  // ... existing checks ...

  // Check download permission
  const allowDownload = await checkDownloadPermission(currentUser, filePath)

  if (!allowDownload) {
    // Serve file with Content-Disposition: inline (no download)
    return new NextResponse(fileBuffer, {
      headers: {
        'Content-Type': mimeType,
        'Content-Disposition': 'inline',  // Force inline viewing
        'X-Content-Type-Options': 'nosniff',
      },
    })
  }

  // Allow download
  return new NextResponse(fileBuffer, {
    headers: {
      'Content-Type': mimeType,
      'Content-Disposition': `attachment; filename="${fileName}"`,
    },
  })
}
```

**Note:** This is NOT foolproof (users can still use browser extensions), but adds a layer of protection.

**Effort:** 2 hours

---

#### **Task 2.4: Add Audit Trail** (3-4 hours)

**File:** `prisma/schema.prisma`

```prisma
model FileAccessLog {
  id          String   @id @default(cuid())
  tenantId    String
  userId      String
  filePath    String
  action      String   // VIEW, DOWNLOAD, DELETE
  ipAddress   String?
  userAgent   String?
  accessedAt  DateTime @default(now())

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@index([tenantId, userId])
  @@index([tenantId, filePath])
  @@map("file_access_logs")
}
```

**File:** `lib/storage/audit-trail.ts` (NEW)

```typescript
import { prisma } from '@/lib/prisma'

export async function logFileAccess(
  userId: string,
  filePath: string,
  action: 'VIEW' | 'DOWNLOAD' | 'DELETE',
  request: Request
) {
  const tenantId = await getTenantId()
  const ipAddress = request.headers.get('x-forwarded-for') || 'unknown'
  const userAgent = request.headers.get('user-agent') || 'unknown'

  await prisma.fileAccessLog.create({
    data: {
      tenantId,
      userId,
      filePath,
      action,
      ipAddress,
      userAgent,
    }
  })
}
```

**Usage:**
```typescript
// app/api/storage/[...path]/route.ts
export async function GET(request, { params }) {
  // ... permission checks ...

  // Log access
  await logFileAccess(currentUser.id, filePath, 'VIEW', request)

  return serveFile(filePath)
}
```

**Effort:** 3-4 hours
**Files Changed:** 2 files (schema + audit helper)

---

#### **Phase 2 Summary:**

**Total Effort:** 12-16 hours
**Files Changed:** 8 files (5 new, 3 modified)
**Security Improvement:** 🟡 70% → 🟢 95%
**Breaking Changes:** ❌ None (feature flag controlled)
**Downtime:** ⏱️ Zero

**What's Secured:**
- ✅ Signed URLs with 1-hour expiration
- ✅ Blob URLs (hidden from DevTools)
- ✅ Download permission enforced
- ✅ Audit trail (who accessed what, when)

**What's NOT Secured Yet:**
- ⚠️ Old files still use permanent URLs (migration needed)

---

### **PHASE 3: MIGRATION (Week 3+) - OPTIONAL** 🟢

**Goal:** Migrate old files to new secure format

**Effort:** 6-8 hours
**Risk:** 🟡 Medium (database changes)
**Downtime:** ⏱️ Zero (background migration)

#### **Task 3.1: Create Migration Script** (4-5 hours)

**File:** `scripts/migrate-file-urls.ts`

```typescript
import { prisma } from '@/lib/prisma'
import { generateSignedUrl } from '@/lib/storage/signed-urls'

async function migrateFileUrls() {
  console.log('Starting file URL migration...')

  // Migrate student documents
  const students = await prisma.student.findMany({
    select: { id: true, avatarUrl: true }
  })

  for (const student of students) {
    if (student.avatarUrl && !student.avatarUrl.includes('/signed?')) {
      const signedUrl = generateSignedUrl(student.avatarUrl, 31536000)  // 1 year
      await prisma.student.update({
        where: { id: student.id },
        data: { avatarUrl: signedUrl }
      })
      console.log(`Migrated student ${student.id}`)
    }
  }

  // Migrate question bank audio
  const questions = await prisma.question.findMany({
    where: { audioUrl: { not: null } }
  })

  for (const question of questions) {
    if (question.audioUrl && !question.audioUrl.includes('/signed?')) {
      const signedUrl = generateSignedUrl(question.audioUrl, 31536000)
      await prisma.question.update({
        where: { id: question.id },
        data: { audioUrl: signedUrl }
      })
      console.log(`Migrated question ${question.id}`)
    }
  }

  console.log('Migration complete!')
}

migrateFileUrls()
```

**Run:**
```bash
npx tsx scripts/migrate-file-urls.ts
```

**Effort:** 4-5 hours

---

#### **Task 3.2: Remove Backward Compatibility Layer** (1-2 hours)

**After 6 months of Phase 2 deployment:**

```typescript
// app/api/storage/[...path]/route.ts
export async function GET(request, { params }) {
  // Remove feature flag check
  // const useSignedUrls = process.env.STORAGE_USE_SIGNED_URLS === 'true'

  // Always require signed URLs for critical files
  if (fileCategory === 'CRITICAL_PRIVATE') {
    return NextResponse.json(
      { error: 'Direct access not allowed. Use signed URLs.' },
      { status: 403 }
    )
  }

  // ... rest of code ...
}
```

**Effort:** 1-2 hours

---

#### **Phase 3 Summary:**

**Total Effort:** 6-8 hours
**Files Changed:** 2 files
**Security Improvement:** 🟢 95% → 🟢 100%
**Breaking Changes:** ⚠️ Yes (old URLs stop working after 6 months)
**Downtime:** ⏱️ Zero

---

## 📊 SECURITY IMPROVEMENT MATRIX

| Phase | Security Level | Critical Files | Sensitive Media | Public Files | Effort | Risk |
|-------|----------------|----------------|-----------------|--------------|--------|------|
| **Current** | 🔴 30% | ❌ No protection | ❌ No protection | ✅ Tenant isolation | 0h | N/A |
| **Phase 1** | 🟡 70% | ✅ Permission checks<br>✅ Private cache<br>✅ Random tokens | ✅ Permission checks | ✅ Tenant isolation | 8-12h | 🟢 Low |
| **Phase 2** | 🟢 95% | ✅ Signed URLs<br>✅ Blob URLs<br>✅ Audit trail | ✅ Signed URLs<br>✅ Blob URLs | ✅ Tenant isolation | 12-16h | 🟡 Medium |
| **Phase 3** | 🟢 100% | ✅ All old files migrated | ✅ All old files migrated | ✅ Tenant isolation | 6-8h | 🟡 Medium |

---

## 🧪 TESTING STRATEGY

### **Unit Tests:**

**File:** `__tests__/storage/file-permissions.test.ts`

```typescript
import { checkStudentDocumentPermission } from '@/lib/storage/file-permissions'

describe('File Permissions', () => {
  it('should allow admin to access any file', async () => {
    const admin = { role: 'ADMIN', id: 'admin_1' }
    const result = await checkStudentDocumentPermission(admin, 'student_123')
    expect(result).toBe(true)
  })

  it('should allow student to access their own files', async () => {
    const student = { role: 'STUDENT', id: 'user_1', studentId: 'student_123' }
    const result = await checkStudentDocumentPermission(student, 'student_123')
    expect(result).toBe(true)
  })

  it('should deny student access to other student files', async () => {
    const student = { role: 'STUDENT', id: 'user_1', studentId: 'student_123' }
    const result = await checkStudentDocumentPermission(student, 'student_456')
    expect(result).toBe(false)
  })
})
```

---

### **Integration Tests:**

**File:** `__tests__/api/storage.test.ts`

```typescript
import { GET } from '@/app/api/storage/[...path]/route'

describe('Storage API', () => {
  it('should return 403 for unauthorized access', async () => {
    const request = new Request('http://localhost/api/storage/tenants/tenant_1/students/documents/student_123/birth_cert.pdf')
    const response = await GET(request, { params: { path: ['tenants', 'tenant_1', 'students', 'documents', 'student_123', 'birth_cert.pdf'] } })
    expect(response.status).toBe(403)
  })
})
```

---

### **Manual Testing Checklist:**

**Phase 1:**
- [ ] Admin can access all files
- [ ] Student can access only their own files
- [ ] Student cannot access other student files (403 error)
- [ ] Teacher can access their students' files
- [ ] Teacher cannot access other teachers' students' files
- [ ] Critical files have private cache headers
- [ ] Public files have public cache headers
- [ ] New uploads have random tokens in file names

**Phase 2:**
- [ ] Signed URLs expire after 1 hour
- [ ] Expired signed URLs return 401 error
- [ ] Blob URLs work in audio player
- [ ] Blob URLs hidden in DevTools
- [ ] Download permission enforced (inline vs attachment)
- [ ] Audit trail logs all file access

**Phase 3:**
- [ ] Old files migrated to signed URLs
- [ ] Old direct URLs return 403 error
- [ ] All media types working after migration

---

## 🚀 DEPLOYMENT PLAN

### **Phase 1 Deployment:**

**Step 1: Deploy to Staging** (Day 1)
```bash
git checkout -b feature/media-security-phase1
# Implement Phase 1 tasks
git commit -m "feat: Add permission checks for all media types"
git push origin feature/media-security-phase1

# Deploy to staging
vercel --prod --scope=staging
```

**Step 2: Test in Staging** (Day 2-3)
- Run manual testing checklist
- Run automated tests
- Performance testing (check API response time)

**Step 3: Deploy to Production** (Day 4)
```bash
git checkout main
git merge feature/media-security-phase1
git push origin main

# Deploy to production
vercel --prod
```

**Step 4: Monitor** (Day 5-7)
- Check error logs for 403/401 errors
- Monitor API response times
- Collect user feedback

---

### **Phase 2 Deployment:**

**Step 1: Enable Feature Flag** (Week 2, Day 1)
```env
# .env
STORAGE_USE_SIGNED_URLS=true
```

**Step 2: Deploy with Backward Compatibility** (Week 2, Day 2-3)
- Deploy signed URL implementation
- Keep old direct URLs working (fallback)

**Step 3: Monitor** (Week 2, Day 4-7)
- Check signed URL expiration working
- Monitor blob URL performance
- Check audit trail logs

---

### **Phase 3 Deployment:**

**Step 1: Backup Database** (Week 3, Day 1)
```bash
pg_dump -U postgres lms_db > backup_before_migration.sql
```

**Step 2: Run Migration Script** (Week 3, Day 2)
```bash
npx tsx scripts/migrate-file-urls.ts
```

**Step 3: Verify Migration** (Week 3, Day 3)
- Check all files accessible
- Check no broken URLs
- Check database integrity

**Step 4: Remove Backward Compatibility** (6 months later)
- Remove feature flag
- Remove fallback code
- Force signed URLs for all critical files

---

## 📋 ROLLBACK PROCEDURES

### **Phase 1 Rollback:**

**If permission checks too strict:**
```typescript
// Temporarily disable permission checks
const ENABLE_PERMISSION_CHECKS = false

if (ENABLE_PERMISSION_CHECKS && fileCategory === 'CRITICAL_PRIVATE') {
  // ... permission checks ...
}
```

**If complete failure:**
```bash
git revert <phase1-commit-hash>
git push origin main
```

---

### **Phase 2 Rollback:**

**Disable signed URLs:**
```env
STORAGE_USE_SIGNED_URLS=false
```

**Revert code:**
```bash
git revert <phase2-commit-hash>
git push origin main
```

---

### **Phase 3 Rollback:**

**Restore database:**
```bash
psql -U postgres -d lms_db < backup_before_migration.sql
```

**Revert migration:**
```bash
git revert <migration-commit-hash>
git push origin main
```

---

## 🎯 SUCCESS CRITERIA

### **Phase 1:**
- ✅ All critical files protected by permission checks
- ✅ Students cannot access other students' files
- ✅ Teachers can access only their students' files
- ✅ Private cache headers for critical files
- ✅ Zero downtime deployment
- ✅ No user complaints about broken access

### **Phase 2:**
- ✅ Signed URLs working with 1-hour expiration
- ✅ Blob URLs hiding original URLs
- ✅ Audit trail logging all access
- ✅ Download permission enforced
- ✅ Backward compatibility maintained
- ✅ Performance impact < 100ms per request

### **Phase 3:**
- ✅ All old files migrated successfully
- ✅ No broken URLs after migration
- ✅ Database integrity maintained
- ✅ Old direct URLs return 403 error

---

## 📚 RELATED DOCUMENTS

- `docs/AUDIO_SECURITY_IMPLEMENTATION_PLAN.md` - Original audio-only plan (superseded by this document)
- `docs/AUDIO_SECURITY_SUMMARY.md` - Quick reference (audio-only)
- `docs/ROLLBACK_GUIDE.md` - Emergency rollback procedures
- `docs/FILE_UPLOAD_FINAL_PLAN.md` - File upload architecture
- `.augment/rules/lms-rule.md` - Storage service patterns

---

## 🔐 ENVIRONMENT VARIABLES

```env
# .env

# Storage Configuration
STORAGE_TYPE=LOCAL  # or R2
STORAGE_LOCAL_PATH=./storage

# Security Features
STORAGE_USE_SIGNED_URLS=true  # Enable signed URLs (Phase 2)
STORAGE_SIGNED_URL_EXPIRY=3600  # 1 hour (in seconds)

# JWT Secret for Signed URLs
JWT_SECRET=your-secret-key-here  # CHANGE IN PRODUCTION

# Cloudflare R2 (if using R2)
STORAGE_R2_ACCOUNT_ID=your-account-id
STORAGE_R2_ACCESS_KEY_ID=your-access-key
STORAGE_R2_SECRET_ACCESS_KEY=your-secret-key
STORAGE_R2_BUCKET_NAME=lms-storage
STORAGE_R2_PUBLIC_URL=https://cdn.yourdomain.com
```

---

## 📞 SUPPORT & ESCALATION

**If issues arise during implementation:**

1. **Development Team:** Review this document
2. **Security Team:** Consult for permission logic
3. **DevOps Team:** For deployment issues
4. **DBA:** For database migration issues

**Emergency Rollback:** See `docs/ROLLBACK_GUIDE.md`

---

**Last Updated:** 2025-01-15
**Document Owner:** Development Team
**Status:** 📋 Planning Phase
**Next Review:** After Phase 1 completion

---

**END OF COMPREHENSIVE MEDIA SECURITY IMPLEMENTATION PLAN**

