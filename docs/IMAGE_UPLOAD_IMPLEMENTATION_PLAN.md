# 🖼️ **Image Upload & File Management - Complete Implementation Plan**

## 📋 **Table of Contents**
1. [Overview](#overview)
2. [Current State Analysis](#current-state-analysis)
3. [Folder Structure](#folder-structure)
4. [Old File Deletion Strategy](#old-file-deletion-strategy)
5. [Unified Upload Journey](#unified-upload-journey)
6. [Storage Migration System](#storage-migration-system)
7. [Component Architecture](#component-architecture)
8. [Implementation Steps](#implementation-steps)
9. [Augment Rule Updates](#augment-rule-updates)

---

## 🎯 **Overview**

### **Goals:**
1. ✅ **Unified Upload Journey** - Same UI/UX for all file uploads (images, documents, videos)
2. ✅ **Old File Deletion** - Automatically delete old files when updating
3. ✅ **Consistent Folder Structure** - Same structure for Local and R2 storage
4. ✅ **Storage Migration** - Seamless migration between Local ↔ R2
5. ✅ **Moodle-Style File Picker** - Professional file management interface

---

## 📊 **Current State Analysis**

### **✅ Already Implemented:**

#### **1. Storage Adapter Pattern:**
```
lib/storage/
  ├── storage-adapter.ts          ← Interface
  ├── storage-service.ts          ← Business logic
  ├── storage-factory.ts          ← Adapter selection
  └── adapters/
      ├── local-storage.ts        ← Local filesystem
      └── r2-storage.ts           ← Cloudflare R2
```

#### **2. Existing Folder Structure:**
```
storage/
  └── tenants/
      └── {tenantId}/
          ├── students/
          │   ├── photos/{studentId}/profile.jpg
          │   └── documents/{studentId}/{documentType}.{ext}
          ├── courses/
          │   └── {courseId}/materials/{materialType}_{timestamp}.{ext}
          ├── assignments/
          │   └── {assignmentId}/submissions/{studentId}/submission_v{version}.{ext}
          └── questions/
              └── images/{questionId}/{timestamp}.{ext}
```

#### **3. Storage Service Methods:**
- `uploadStudentPhoto(studentId, file)` → `tenants/{tenantId}/students/photos/{studentId}/profile.jpg`
- `uploadStudentDocument(studentId, documentType, file)` → `tenants/{tenantId}/students/documents/{studentId}/{documentType}.{ext}`
- `uploadQuestionImage(questionId, file)` → `tenants/{tenantId}/questions/images/{questionId}/{timestamp}.{ext}`
- `deleteStudentFiles(studentId)` → Cascade delete
- `deleteQuestionFiles(questionId)` → Cascade delete

### **❌ Missing:**

1. **Old File Deletion on Update** - Currently, uploading a new file doesn't delete the old one
2. **Unified File Picker Modal** - No reusable component for file selection
3. **Image Properties Dialog** - No alt text, dimensions, alignment settings
4. **Server Files Browsing** - No UI to browse uploaded files
5. **Storage Migration Tool** - No automated migration between Local ↔ R2
6. **File Metadata Tracking** - No database records for uploaded files

---

## 📁 **Folder Structure (Standardized)**

### **Principle: Same structure for Local and R2**

```
storage/                                    ← Local base path
  └── tenants/
      └── {tenantId}/
          ├── students/
          │   ├── photos/
          │   │   └── {studentId}/
          │   │       └── profile.jpg         ← Fixed name (auto-replace)
          │   └── documents/
          │       └── {studentId}/
          │           ├── birth_certificate.{ext}
          │           ├── transfer_certificate.{ext}
          │           └── marksheet.{ext}
          │
          ├── teachers/
          │   ├── photos/
          │   │   └── {teacherId}/
          │   │       └── profile.jpg
          │   └── documents/
          │       └── {teacherId}/
          │           └── {documentType}.{ext}
          │
          ├── courses/
          │   └── {courseId}/
          │       ├── featured_image.{ext}    ← Fixed name (auto-replace)
          │       └── materials/
          │           └── {materialId}_{timestamp}.{ext}
          │
          ├── assignments/
          │   └── {assignmentId}/
          │       └── submissions/
          │           └── {studentId}/
          │               └── submission_v{version}.{ext}
          │
          ├── questions/
          │   └── images/
          │       └── {questionId}/
          │           └── {imageId}_{timestamp}.{ext}
          │
          ├── exams/
          │   └── {examId}/
          │       └── attachments/
          │           └── {attachmentId}_{timestamp}.{ext}
          │
          ├── library/
          │   └── books/
          │       └── {bookId}/
          │           ├── cover.{ext}          ← Fixed name (auto-replace)
          │           └── pdf/{bookId}.pdf
          │
          ├── notices/
          │   └── {noticeId}/
          │       └── attachments/
          │           └── {attachmentId}_{timestamp}.{ext}
          │
          ├── reports/
          │   └── {reportType}/
          │       └── {reportId}_{timestamp}.{ext}
          │
          └── settings/
              ├── logo.{ext}                  ← Fixed name (auto-replace)
              ├── signature.{ext}             ← Fixed name (auto-replace)
              └── banners/
                  └── {bannerId}.{ext}
```

### **Key Principles:**

1. **Fixed Name Files** (Auto-Replace):
   - `profile.jpg`, `cover.jpg`, `logo.png`, `signature.png`
   - When uploading new file → **Delete old file first** → Upload new file
   - Example: Student photo update deletes old `profile.jpg`, uploads new `profile.jpg`

2. **Timestamped Files** (Keep Multiple):
   - Question images, course materials, exam attachments
   - Format: `{id}_{timestamp}.{ext}`
   - Example: `img_123_1704567890.jpg`

3. **Versioned Files** (Keep History):
   - Assignment submissions
   - Format: `submission_v{version}.{ext}`
   - Example: `submission_v1.pdf`, `submission_v2.pdf`

---

## 🗑️ **Old File Deletion Strategy**

### **Problem:**
Currently, when updating a file (e.g., student photo), the old file remains on the server, wasting storage.

### **Solution:**

#### **Pattern 1: Fixed Name Files (Auto-Replace)**

**Use Case:** Student photo, course featured image, school logo

**Implementation:**
```typescript
async uploadStudentPhoto(studentId: string, file: File): Promise<string> {
  const storage = await this.getStorageAdapter()
  const key = await this.generateKey('students', `photos/${studentId}/profile.jpg`)
  
  // ✅ Check if old file exists
  const oldFileExists = await storage.exists(key)
  
  // ✅ Delete old file if exists
  if (oldFileExists) {
    await storage.delete(key)
  }
  
  // ✅ Upload new file
  const result = await storage.upload({
    key,
    file,
    contentType: file.type,
    metadata: {
      studentId,
      uploadedAt: new Date().toISOString(),
    },
    isPublic: true,
  })

  return result.url
}
```

**Why This Works:**
- Same filename (`profile.jpg`) → Old file is replaced
- No orphaned files
- Simple and efficient

---

#### **Pattern 2: Timestamped Files (Manual Cleanup)**

**Use Case:** Question images (multiple images per question)

**Current Implementation:**
```typescript
async uploadQuestionImage(questionId: string, file: File): Promise<string> {
  const extension = file.name.split('.').pop()
  const timestamp = Date.now()
  const key = await this.generateKey('questions', `images/${questionId}/${timestamp}.${extension}`)
  
  // Upload new file (old files remain)
  const result = await storage.upload({ key, file, ... })
  return result.url
}
```

**Problem:** Old images are NOT deleted when question is updated.

**Solution:** Track uploaded files in database and delete old ones on update.

**New Database Model:**
```prisma
model UploadedFile {
  id          String   @id @default(cuid())
  tenantId    String

  // File metadata
  key         String   // Storage key: tenants/{tenantId}/questions/images/{questionId}/123.jpg
  url         String   // Public URL
  fileName    String   // Original filename
  fileSize    Int      // Size in bytes
  mimeType    String   // image/jpeg, application/pdf, etc.

  // Categorization
  category    String   // 'question_image', 'student_photo', 'course_material', etc.
  entityType  String   // 'question', 'student', 'course', etc.
  entityId    String   // ID of the related entity

  // Metadata
  isPublic    Boolean  @default(false)
  uploadedBy  String?  // User ID who uploaded
  uploadedAt  DateTime @default(now())

  // Relations
  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, key])
  @@index([tenantId, entityType, entityId])
  @@index([tenantId, category])
  @@map("uploaded_files")
}
```

**Updated Upload Method:**
```typescript
async uploadQuestionImage(questionId: string, file: File): Promise<string> {
  const storage = await this.getStorageAdapter()
  const tenantId = await getTenantId()
  const extension = file.name.split('.').pop()
  const timestamp = Date.now()
  const key = await this.generateKey('questions', `images/${questionId}/${timestamp}.${extension}`)

  // ✅ Upload file
  const result = await storage.upload({
    key,
    file,
    contentType: file.type,
    metadata: { questionId, uploadedAt: new Date().toISOString() },
    isPublic: false,
  })

  // ✅ Save to database
  await prisma.uploadedFile.create({
    data: {
      tenantId,
      key,
      url: result.url,
      fileName: file.name,
      fileSize: result.size,
      mimeType: file.type,
      category: 'question_image',
      entityType: 'question',
      entityId: questionId,
      isPublic: false,
    }
  })

  return result.url
}
```

**Delete Old Files on Question Update:**
```typescript
async updateQuestionImages(questionId: string, newImageUrls: string[]): Promise<void> {
  const tenantId = await getTenantId()

  // ✅ Get all existing files for this question
  const existingFiles = await prisma.uploadedFile.findMany({
    where: {
      tenantId,
      entityType: 'question',
      entityId: questionId,
      category: 'question_image',
    }
  })

  // ✅ Find files to delete (not in newImageUrls)
  const filesToDelete = existingFiles.filter(f => !newImageUrls.includes(f.url))

  // ✅ Delete from storage
  const storage = await this.getStorageAdapter()
  await Promise.all(filesToDelete.map(f => storage.delete(f.key)))

  // ✅ Delete from database
  await prisma.uploadedFile.deleteMany({
    where: {
      id: { in: filesToDelete.map(f => f.id) }
    }
  })
}
```

---

## 🎨 **Unified Upload Journey**

### **Principle: Same UI/UX for ALL file uploads**

Whether uploading:
- Student photo
- Question image
- Course material
- Assignment submission
- Exam attachment

**The user experience should be identical:**

```
┌─────────────────────────────────────────────────────────────┐
│ 1. Click "Upload" or "Browse" button                        │
│    ↓                                                         │
│ 2. File Picker Modal opens                                  │
│    ├── Tab 1: Upload a file (Drag & Drop)                   │
│    ├── Tab 2: Server files (Browse uploaded files)          │
│    ├── Tab 3: URL (Direct URL input)                        │
│    └── Tab 4: Recent files (Last 10 uploads)                │
│    ↓                                                         │
│ 3. User selects file                                        │
│    ↓                                                         │
│ 4. (For images) Image Properties Dialog opens               │
│    ├── Alt text (accessibility)                             │
│    ├── Width x Height (optional)                            │
│    ├── Alignment (left/center/right)                        │
│    └── Decorative checkbox                                  │
│    ↓                                                         │
│ 5. File uploads to storage                                  │
│    ├── Local: ./storage/tenants/{tenantId}/...              │
│    └── R2: Same folder structure                            │
│    ↓                                                         │
│ 6. Database record created (UploadedFile model)             │
│    ↓                                                         │
│ 7. Old file deleted (if replacing)                          │
│    ↓                                                         │
│ 8. Success toast + Preview shown                            │
└─────────────────────────────────────────────────────────────┘
```

### **Reusable Components:**

#### **1. FilePickerModal**
```tsx
<FilePickerModal
  open={boolean}
  onClose={() => void}
  onSelect={(file: SelectedFile) => void}

  // Configuration
  category="question_image" | "student_photo" | "course_material" | etc.
  accept="image/*" | "application/pdf" | "*/*"
  maxSize={5 * 1024 * 1024}  // 5MB
  allowMultiple={false}

  // Features
  allowUpload={true}
  allowBrowse={true}
  allowUrl={true}
  allowRecent={true}
/>
```

#### **2. ImagePropertiesDialog** (Only for images)
```tsx
<ImagePropertiesDialog
  open={boolean}
  onClose={() => void}
  onInsert={(props: ImageProps) => void}
  initialUrl?: string
/>
```

#### **3. FileUploadButton** (Wrapper)
```tsx
<FileUploadButton
  category="question_image"
  entityId={questionId}
  onUploadComplete={(url: string) => void}
  accept="image/*"
  maxSize={5 * 1024 * 1024}

  // Renders:
  // - Button with icon
  // - Opens FilePickerModal
  // - Handles upload logic
  // - Shows progress
  // - Deletes old file if needed
/>
```

---

## 🔄 **Storage Migration System**

### **Problem:**
User starts with Local storage, later wants to migrate to R2 (or vice versa).

### **Requirements:**
1. ✅ **Local → R2 Migration** - Move all files from `./storage` to R2 bucket
2. ✅ **R2 → Local Migration** - Download all files from R2 to `./storage`
3. ✅ **Preserve folder structure** - Same paths in both systems
4. ✅ **Update database URLs** - Change URLs from `/api/storage/...` to R2 URLs
5. ✅ **Zero downtime** - Migration runs in background
6. ✅ **Progress tracking** - Show migration status

### **Can R2 → Local Migration Work?**

**✅ YES, it's possible!**

**How:**
1. Download all files from R2 using `list()` and `download()` methods
2. Save to local `./storage` directory with same folder structure
3. Update database URLs from R2 URLs to `/api/storage/...` URLs
4. Switch storage type in settings

**Limitations:**
- **Large datasets** - May take time (run as background job)
- **Disk space** - Ensure local server has enough space
- **Network bandwidth** - Downloading from R2 may be slow

**Recommendation:**
- ✅ **Local → R2** - Common use case (scaling up)
- ⚠️ **R2 → Local** - Rare use case (downgrading), but supported

---

## 🏗️ **Storage Migration Architecture**

### **Migration Service:**

```typescript
// lib/storage/migration-service.ts

export class StorageMigrationService {
  /**
   * Migrate from Local to R2
   */
  async migrateLocalToR2(
    localAdapter: LocalStorageAdapter,
    r2Adapter: R2StorageAdapter,
    tenantId: string,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationResult> {
    // 1. List all files in local storage
    const prefix = `tenants/${tenantId}/`
    const localFiles = await localAdapter.list(prefix)

    const total = localFiles.length
    let completed = 0
    let failed = 0

    // 2. Upload each file to R2
    for (const file of localFiles) {
      try {
        // Download from local
        const buffer = await localAdapter.download(file.key)

        // Upload to R2
        await r2Adapter.upload({
          key: file.key,
          file: buffer,
          contentType: this.getMimeType(file.key),
          isPublic: this.isPublicFile(file.key),
        })

        completed++
        onProgress?.({ total, completed, failed, current: file.key })
      } catch (error) {
        failed++
        console.error(`Failed to migrate ${file.key}:`, error)
      }
    }

    // 3. Update database URLs
    await this.updateDatabaseUrls(tenantId, 'local', 'r2')

    return { total, completed, failed }
  }

  /**
   * Migrate from R2 to Local
   */
  async migrateR2ToLocal(
    r2Adapter: R2StorageAdapter,
    localAdapter: LocalStorageAdapter,
    tenantId: string,
    onProgress?: (progress: MigrationProgress) => void
  ): Promise<MigrationResult> {
    // 1. List all files in R2
    const prefix = `tenants/${tenantId}/`
    const r2Files = await r2Adapter.list(prefix)

    const total = r2Files.length
    let completed = 0
    let failed = 0

    // 2. Download each file to local
    for (const file of r2Files) {
      try {
        // Download from R2
        const buffer = await r2Adapter.download(file.key)

        // Upload to local
        await localAdapter.upload({
          key: file.key,
          file: buffer,
          contentType: this.getMimeType(file.key),
          isPublic: this.isPublicFile(file.key),
        })

        completed++
        onProgress?.({ total, completed, failed, current: file.key })
      } catch (error) {
        failed++
        console.error(`Failed to migrate ${file.key}:`, error)
      }
    }

    // 3. Update database URLs
    await this.updateDatabaseUrls(tenantId, 'r2', 'local')

    return { total, completed, failed }
  }

  /**
   * Update database URLs after migration
   */
  private async updateDatabaseUrls(
    tenantId: string,
    from: 'local' | 'r2',
    to: 'local' | 'r2'
  ): Promise<void> {
    // Update UploadedFile table
    const files = await prisma.uploadedFile.findMany({
      where: { tenantId }
    })

    for (const file of files) {
      let newUrl = file.url

      if (from === 'local' && to === 'r2') {
        // /api/storage/tenants/... → https://r2.../tenants/...
        newUrl = file.url.replace('/api/storage/', process.env.R2_PUBLIC_URL + '/')
      } else if (from === 'r2' && to === 'local') {
        // https://r2.../tenants/... → /api/storage/tenants/...
        newUrl = file.url.replace(process.env.R2_PUBLIC_URL + '/', '/api/storage/')
      }

      await prisma.uploadedFile.update({
        where: { id: file.id },
        data: { url: newUrl }
      })
    }

    // Update other tables with file URLs
    // - Student.photoUrl
    // - TenantSettings.logoUrl
    // - TenantSettings.signatureUrl
    // etc.
  }

  private getMimeType(key: string): string {
    const ext = key.split('.').pop()?.toLowerCase()
    const mimeTypes: Record<string, string> = {
      'jpg': 'image/jpeg',
      'jpeg': 'image/jpeg',
      'png': 'image/png',
      'gif': 'image/gif',
      'webp': 'image/webp',
      'pdf': 'application/pdf',
      'doc': 'application/msword',
      'docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    }
    return mimeTypes[ext || ''] || 'application/octet-stream'
  }

  private isPublicFile(key: string): boolean {
    // Photos are public, documents are private
    return key.includes('/photos/') || key.includes('/logo') || key.includes('/banner')
  }
}

interface MigrationProgress {
  total: number
  completed: number
  failed: number
  current: string
}

interface MigrationResult {
  total: number
  completed: number
  failed: number
}
```

### **Migration UI (Settings Page):**

```tsx
// app/(dashboard)/settings/storage/migration-tab.tsx

export default function MigrationTab() {
  const [migrating, setMigrating] = useState(false)
  const [progress, setProgress] = useState<MigrationProgress | null>(null)

  const handleMigrate = async (direction: 'local-to-r2' | 'r2-to-local') => {
    setMigrating(true)

    const response = await fetch('/api/storage/migrate', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ direction })
    })

    // Poll for progress
    const pollInterval = setInterval(async () => {
      const statusRes = await fetch('/api/storage/migrate/status')
      const status = await statusRes.json()

      setProgress(status.progress)

      if (status.completed) {
        clearInterval(pollInterval)
        setMigrating(false)
        toast.success('Migration completed!')
      }
    }, 1000)
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Storage Migration</CardTitle>
        <CardDescription>
          Migrate files between Local and R2 storage
        </CardDescription>
      </CardHeader>
      <CardContent>
        {migrating ? (
          <div className="space-y-4">
            <Progress value={(progress?.completed || 0) / (progress?.total || 1) * 100} />
            <p className="text-sm text-muted-foreground">
              Migrating: {progress?.completed} / {progress?.total} files
              {progress?.failed > 0 && ` (${progress.failed} failed)`}
            </p>
            <p className="text-xs text-muted-foreground">
              Current: {progress?.current}
            </p>
          </div>
        ) : (
          <div className="space-y-4">
            <Button onClick={() => handleMigrate('local-to-r2')}>
              Migrate Local → R2
            </Button>
            <Button onClick={() => handleMigrate('r2-to-local')} variant="outline">
              Migrate R2 → Local
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  )
}
```

---

## 📦 **Component Architecture**

### **File Structure:**

```
components/ui/
  ├── file-picker-modal.tsx           ← Main file picker
  ├── image-properties-dialog.tsx     ← Image settings
  └── file-upload-button.tsx          ← Reusable upload button

lib/storage/
  ├── storage-adapter.ts              ← Interface (existing)
  ├── storage-service.ts              ← Business logic (update)
  ├── storage-factory.ts              ← Adapter selection (existing)
  ├── migration-service.ts            ← NEW: Migration logic
  └── adapters/
      ├── local-storage.ts            ← Local filesystem (existing)
      └── r2-storage.ts               ← Cloudflare R2 (existing)

app/api/
  ├── storage/
  │   ├── [...path]/route.ts          ← Serve files (existing)
  │   └── migrate/
  │       ├── route.ts                ← NEW: Start migration
  │       └── status/route.ts         ← NEW: Migration status
  └── files/
      ├── route.ts                    ← NEW: List files (browse)
      ├── upload/route.ts             ← NEW: Upload file
      └── [fileId]/route.ts           ← NEW: Delete file

prisma/schema.prisma
  └── UploadedFile model              ← NEW: Track uploaded files
```

---

## 🛠️ **Implementation Steps**

### **Phase 1: Database Schema (1-2 hours)**

**Step 1.1: Create UploadedFile Model**
```bash
# Add to prisma/schema.prisma
npx prisma migrate dev --name add_uploaded_files_table
```

**Step 1.2: Update Existing Models**
- Add `uploadedFiles` relation to Tenant model
- Add indexes for performance

---

### **Phase 2: Storage Service Updates (2-3 hours)**

**Step 2.1: Update Upload Methods**
- Modify `uploadStudentPhoto()` to delete old file first
- Modify `uploadQuestionImage()` to save to database
- Add `replaceFile()` method for fixed-name files
- Add `trackUploadedFile()` method for database records

**Step 2.2: Add File Management Methods**
```typescript
// lib/storage/storage-service.ts

async listFiles(category: string, entityId?: string): Promise<UploadedFile[]>
async deleteFile(fileId: string): Promise<void>
async getFileMetadata(fileId: string): Promise<UploadedFile | null>
async updateFileMetadata(fileId: string, metadata: Partial<UploadedFile>): Promise<void>
```

---

### **Phase 3: Migration Service (3-4 hours)**

**Step 3.1: Create Migration Service**
```bash
touch lib/storage/migration-service.ts
```

**Step 3.2: Implement Migration Logic**
- `migrateLocalToR2()`
- `migrateR2ToLocal()`
- `updateDatabaseUrls()`
- Progress tracking

**Step 3.3: Create Migration API Routes**
```bash
mkdir -p app/api/storage/migrate/status
touch app/api/storage/migrate/route.ts
touch app/api/storage/migrate/status/route.ts
```

---

### **Phase 4: File Picker Modal (4-6 hours)**

**Step 4.1: Create FilePickerModal Component**
```bash
touch components/ui/file-picker-modal.tsx
```

**Features:**
- Tab 1: Upload (Drag & Drop)
- Tab 2: Server Files (Grid view with thumbnails)
- Tab 3: URL Input
- Tab 4: Recent Files (localStorage cache)
- Search functionality
- Pagination (20 items per page)
- File preview
- Delete file option

**Step 4.2: Create File API Routes**
```bash
mkdir -p app/api/files/[fileId]
touch app/api/files/route.ts          # GET: List files
touch app/api/files/upload/route.ts   # POST: Upload file
touch app/api/files/[fileId]/route.ts # DELETE: Delete file
```

---

### **Phase 5: Image Properties Dialog (2-3 hours)**

**Step 5.1: Create ImagePropertiesDialog Component**
```bash
touch components/ui/image-properties-dialog.tsx
```

**Features:**
- URL input with "Browse repositories..." button
- Alt text textarea (max 125 chars, required)
- Width x Height inputs with "Auto size" checkbox
- Alignment dropdown (left/center/right)
- "Decorative only" checkbox
- Preview image

---

### **Phase 6: Reusable Upload Button (1-2 hours)**

**Step 6.1: Create FileUploadButton Component**
```bash
touch components/ui/file-upload-button.tsx
```

**Features:**
- Renders button with icon
- Opens FilePickerModal on click
- Handles upload logic
- Shows progress bar
- Deletes old file if needed
- Success/error toasts

---

### **Phase 7: TipTap Integration (1-2 hours)**

**Step 7.1: Update math-editor.tsx**
- Replace `prompt()` with `ImagePropertiesDialog`
- Add image properties (alt, width, height, alignment)
- Track uploaded images in database

**Step 7.2: Update question-form.tsx**
- Use `FileUploadButton` for question image upload
- Delete old image when uploading new one

---

### **Phase 8: Migration UI (2-3 hours)**

**Step 8.1: Create Migration Tab in Settings**
```bash
touch app/(dashboard)/settings/storage/migration-tab.tsx
```

**Features:**
- "Migrate Local → R2" button
- "Migrate R2 → Local" button
- Progress bar
- File count display
- Error handling
- Confirmation dialog

---

### **Phase 9: Testing & Documentation (2-3 hours)**

**Step 9.1: Test All Upload Scenarios**
- Student photo upload (replace old)
- Question image upload (multiple images)
- Course material upload
- Assignment submission upload
- Migration Local → R2
- Migration R2 → Local

**Step 9.2: Update Documentation**
- Update lms-rule.md with new standards
- Create user guide for file management
- Document migration process

---

## 📝 **Augment Rule Updates**

### **Add to lms-rule.md:**

```markdown
## 🖼️ FILE UPLOAD STANDARDS (MANDATORY)

### **1. ALWAYS Use Unified Upload Components**

For ALL file uploads in the system, use these components:

#### **FileUploadButton** (Recommended)
```tsx
import { FileUploadButton } from '@/components/ui/file-upload-button'

<FileUploadButton
  category="question_image"
  entityId={questionId}
  onUploadComplete={(url) => setImageUrl(url)}
  accept="image/*"
  maxSize={5 * 1024 * 1024}
/>
```

#### **FilePickerModal** (Advanced)
```tsx
import { FilePickerModal } from '@/components/ui/file-picker-modal'

<FilePickerModal
  open={showPicker}
  onClose={() => setShowPicker(false)}
  onSelect={(file) => handleFileSelect(file)}
  category="course_material"
  accept="application/pdf"
  maxSize={10 * 1024 * 1024}
/>
```

#### **ImagePropertiesDialog** (For Images Only)
```tsx
import { ImagePropertiesDialog } from '@/components/ui/image-properties-dialog'

<ImagePropertiesDialog
  open={showImageDialog}
  onClose={() => setShowImageDialog(false)}
  onInsert={(props) => insertImage(props)}
/>
```

---

### **2. File Upload Categories**

Use these standardized categories:

| Category | Use Case | Example |
|----------|----------|---------|
| `student_photo` | Student profile photo | `tenants/{id}/students/photos/{studentId}/profile.jpg` |
| `student_document` | Birth cert, marksheet | `tenants/{id}/students/documents/{studentId}/birth_cert.pdf` |
| `teacher_photo` | Teacher profile photo | `tenants/{id}/teachers/photos/{teacherId}/profile.jpg` |
| `course_featured_image` | Course cover image | `tenants/{id}/courses/{courseId}/featured_image.jpg` |
| `course_material` | Notes, syllabus, videos | `tenants/{id}/courses/{courseId}/materials/{id}_{timestamp}.pdf` |
| `question_image` | Question diagrams | `tenants/{id}/questions/images/{questionId}/{id}_{timestamp}.jpg` |
| `assignment_submission` | Student submissions | `tenants/{id}/assignments/{id}/submissions/{studentId}/submission_v{version}.pdf` |
| `exam_attachment` | Exam papers | `tenants/{id}/exams/{examId}/attachments/{id}_{timestamp}.pdf` |
| `library_book_cover` | Book cover image | `tenants/{id}/library/books/{bookId}/cover.jpg` |
| `library_book_pdf` | Book PDF file | `tenants/{id}/library/books/{bookId}/pdf/{bookId}.pdf` |
| `notice_attachment` | Notice attachments | `tenants/{id}/notices/{noticeId}/attachments/{id}_{timestamp}.pdf` |
| `school_logo` | School logo | `tenants/{id}/settings/logo.png` |
| `school_signature` | Principal signature | `tenants/{id}/settings/signature.png` |

---

### **3. Old File Deletion Rules**

#### **Fixed Name Files (Auto-Replace):**
Files with fixed names MUST delete old file before uploading new one.

**Examples:**
- Student photo: `profile.jpg`
- Course featured image: `featured_image.jpg`
- School logo: `logo.png`

**Implementation:**
```typescript
const storage = await this.getStorageAdapter()
const key = await this.generateKey('students', `photos/${studentId}/profile.jpg`)

// ✅ Delete old file if exists
if (await storage.exists(key)) {
  await storage.delete(key)
}

// ✅ Upload new file
await storage.upload({ key, file, ... })
```

#### **Timestamped Files (Track in Database):**
Files with timestamps MUST be tracked in `UploadedFile` table.

**Examples:**
- Question images: `{id}_{timestamp}.jpg`
- Course materials: `{id}_{timestamp}.pdf`

**Implementation:**
```typescript
// ✅ Upload file
const result = await storage.upload({ key, file, ... })

// ✅ Save to database
await prisma.uploadedFile.create({
  data: {
    tenantId,
    key,
    url: result.url,
    fileName: file.name,
    fileSize: result.size,
    mimeType: file.type,
    category: 'question_image',
    entityType: 'question',
    entityId: questionId,
  }
})
```

**Delete old files on entity update:**
```typescript
// ✅ Get files to delete
const oldFiles = await prisma.uploadedFile.findMany({
  where: { entityType: 'question', entityId: questionId }
})

// ✅ Delete from storage
await Promise.all(oldFiles.map(f => storage.delete(f.key)))

// ✅ Delete from database
await prisma.uploadedFile.deleteMany({
  where: { id: { in: oldFiles.map(f => f.id) } }
})
```

---

### **4. Storage Migration**

When switching storage providers (Local ↔ R2):

1. ✅ **Use Migration Service** - Never manually copy files
2. ✅ **Run in Background** - Use job queue for large datasets
3. ✅ **Track Progress** - Show progress bar to user
4. ✅ **Update URLs** - Automatically update database URLs
5. ✅ **Verify Integrity** - Check file count before/after

**Migration API:**
```typescript
// Start migration
POST /api/storage/migrate
{
  "direction": "local-to-r2" | "r2-to-local"
}

// Check status
GET /api/storage/migrate/status
{
  "total": 1000,
  "completed": 750,
  "failed": 5,
  "current": "tenants/tenant_1/students/photos/123/profile.jpg"
}
```

---

### **5. Folder Structure Consistency**

**MANDATORY:** Same folder structure for Local and R2 storage.

**Pattern:**
```
tenants/{tenantId}/{category}/{entityId}/{filename}
```

**Examples:**
```
✅ tenants/tenant_1/students/photos/student_123/profile.jpg
✅ tenants/tenant_1/questions/images/question_456/img_789_1704567890.jpg
✅ tenants/tenant_1/courses/course_101/materials/notes_1704567890.pdf

❌ students/student_123/profile.jpg  (Missing tenantId)
❌ tenant_1/student_123.jpg          (Wrong structure)
```

---

### **6. Checklist for New File Upload Features**

When implementing ANY new file upload feature:

- [ ] Use `FileUploadButton` or `FilePickerModal` component
- [ ] Specify correct `category` from standardized list
- [ ] Add file type validation (client + server)
- [ ] Add file size validation (client + server)
- [ ] Implement old file deletion (if replacing)
- [ ] Save to `UploadedFile` table (if timestamped)
- [ ] Add cascade delete on entity deletion
- [ ] Test with both Local and R2 storage
- [ ] Add loading states and progress indicators
- [ ] Add error handling with user-friendly messages
- [ ] Update documentation

---

### **7. Security Requirements**

- ✅ **Tenant Isolation** - All files scoped to `tenants/{tenantId}/`
- ✅ **RBAC Enforcement** - Check user role before upload
- ✅ **File Validation** - Type, size, extension checks
- ✅ **Sanitize Filenames** - Remove special characters
- ✅ **Public vs Private** - Set `isPublic` flag correctly
- ✅ **Signed URLs** - Use for private files on R2
```

---

## ⏱️ **Timeline Estimate**

| Phase | Task | Time | Priority |
|-------|------|------|----------|
| 1 | Database Schema | 1-2 hours | High |
| 2 | Storage Service Updates | 2-3 hours | High |
| 3 | Migration Service | 3-4 hours | Medium |
| 4 | File Picker Modal | 4-6 hours | High |
| 5 | Image Properties Dialog | 2-3 hours | High |
| 6 | Reusable Upload Button | 1-2 hours | High |
| 7 | TipTap Integration | 1-2 hours | High |
| 8 | Migration UI | 2-3 hours | Medium |
| 9 | Testing & Documentation | 2-3 hours | High |
| **Total** | | **19-28 hours** | |

---

## ✅ **Acceptance Criteria**

### **File Upload:**
- [ ] All file uploads use unified components (FileUploadButton/FilePickerModal)
- [ ] File Picker Modal has 4 tabs (Upload, Server Files, URL, Recent)
- [ ] Drag & drop works in Upload tab
- [ ] Server Files tab shows grid of uploaded files (tenant-scoped)
- [ ] Search and pagination work in Server Files tab
- [ ] Image uploads show Image Properties Dialog
- [ ] Alt text is required for images (accessibility)
- [ ] File validation (type, size) works on client and server
- [ ] Progress bar shows during upload
- [ ] Success/error toasts display correctly

### **Old File Deletion:**
- [ ] Fixed-name files (profile.jpg, logo.png) delete old file before upload
- [ ] Timestamped files are tracked in UploadedFile table
- [ ] Deleting entity deletes associated files (cascade delete)
- [ ] No orphaned files remain after updates

### **Folder Structure:**
- [ ] Same folder structure for Local and R2 storage
- [ ] All files scoped to `tenants/{tenantId}/`
- [ ] Folder structure follows standardized pattern

### **Storage Migration:**
- [ ] Local → R2 migration works correctly
- [ ] R2 → Local migration works correctly
- [ ] Progress bar shows during migration
- [ ] Database URLs update after migration
- [ ] File count matches before/after migration
- [ ] Migration can be cancelled
- [ ] Failed files are logged

### **Security:**
- [ ] Tenant isolation enforced
- [ ] RBAC checks on all upload endpoints
- [ ] File validation prevents malicious uploads
- [ ] Public/private files handled correctly
- [ ] Signed URLs used for private R2 files

### **Documentation:**
- [ ] lms-rule.md updated with new standards
- [ ] User guide created for file management
- [ ] Migration process documented
- [ ] API documentation updated

---

## 🎯 **Summary**

This plan provides:

1. ✅ **Unified Upload Journey** - Same UI/UX for all file uploads
2. ✅ **Old File Deletion** - Automatic cleanup on updates
3. ✅ **Consistent Folder Structure** - Same for Local and R2
4. ✅ **Storage Migration** - Seamless Local ↔ R2 migration
5. ✅ **Moodle-Style File Picker** - Professional file management
6. ✅ **Database Tracking** - All files tracked in UploadedFile table
7. ✅ **Security** - Tenant isolation, RBAC, validation
8. ✅ **Reusability** - Components work across entire app

**Next Steps:**
1. Review this plan
2. Approve or request modifications
3. Begin implementation (Phase 1: Database Schema)

---

**END OF PLAN**
```


