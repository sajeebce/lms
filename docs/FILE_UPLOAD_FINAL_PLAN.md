# 🎯 **File Upload Enhancement - Final Implementation Plan**

## 📊 **Current Status Analysis**

### ✅ **Already Implemented (Phases 1-7):**

1. **Database Schema** ✅
   - `UploadedFile` model created
   - Migration completed: `20251109044818_add_uploaded_files_table`

2. **Storage Service Updates** ✅
   - `uploadStudentPhoto()` - Auto-deletes old files
   - `uploadQuestionImage()` - Tracks in database
   - `deleteQuestionFiles()` - Cleans storage + database
   - `listUploadedFiles()` - Query files
   - `deleteUploadedFile()` - Delete by ID

3. **File API Routes** ✅
   - `/api/files/upload` (POST) - Upload with category tracking
   - `/api/files` (GET) - List files with pagination
   - `/api/files/[fileId]` (DELETE) - Delete file

4. **File Picker Modal** ✅
   - 4 Tabs: Upload, Server Files, URL, Recent
   - Drag & drop support
   - Search functionality
   - Grid view with thumbnails
   - File validation

5. **Image Properties Dialog** ✅
   - Alt text (accessibility)
   - Dimensions (width/height)
   - Alignment (left/center/right)
   - Decorative checkbox
   - Image preview

6. **File Upload Button** ✅
   - Reusable component
   - Auto-detects image uploads
   - Optional image properties dialog
   - Success/error toasts

7. **Test Page** ✅
   - `/test-upload` page created
   - Student photo demo
   - Question image demo
   - Document upload demo

---

## 🎯 **What User Wants (Based on Moodle Screenshots):**

### ✅ **Already Have:**
- ✅ Server files browsing (Tab 2)
- ✅ Upload a file (Tab 1 with drag & drop)
- ✅ URL input (Tab 3)
- ✅ Recent files (Tab 4 - placeholder)
- ✅ Image properties dialog

### ❌ **NOT Needed (User Confirmed):**
- ❌ URL downloader (External URL download)
- ❌ Private files (User's private file area)
- ❌ Wikimedia integration
- ❌ Content bank (Centralized repository)

### 🔧 **Missing Features to Implement:**

1. **Recent Files Tab (localStorage)** - Track last 20 uploads
2. **File Metadata on Upload** - Author, Description (NOT License - too complex)
3. **Folder Navigation** - Browse by folder structure with breadcrumbs
4. **Image Optimization** - Auto-resize large images, compress
5. **Bulk File Operations** - Select multiple, delete
6. **Storage Migration** - Local ↔ R2 migration tool

---

## 📋 **Final Implementation Tasks**

### **Task 1: Recent Files Tab (localStorage)**
**Priority:** HIGH  
**Time:** 1-2 hours

**What to do:**
- Store last 20 uploaded files in `localStorage` (per tenant)
- Display in "Recent" tab with thumbnails
- Clear button to reset recent files
- Auto-update when new file uploaded

**Implementation:**
```typescript
// lib/storage/recent-files.ts
export function addRecentFile(file: UploadedFile) {
  const recent = getRecentFiles()
  recent.unshift(file)
  localStorage.setItem('recentFiles', JSON.stringify(recent.slice(0, 20)))
}

export function getRecentFiles(): UploadedFile[] {
  const data = localStorage.getItem('recentFiles')
  return data ? JSON.parse(data) : []
}
```

---

### **Task 2: File Metadata (Author, Description)**
**Priority:** MEDIUM  
**Time:** 2-3 hours

**What to do:**
- Add `author` and `description` fields to `UploadedFile` model
- Update upload form to include these fields (optional)
- Display metadata in file browser

**Schema Update:**
```prisma
model UploadedFile {
  // ... existing fields
  author      String?  // NEW
  description String?  // NEW (max 500 chars)
}
```

**UI Update:**
- Add "Author" input in Upload tab
- Add "Description" textarea in Upload tab
- Show metadata in file grid (tooltip or card)

---

### **Task 3: Folder Navigation with Breadcrumbs**
**Priority:** HIGH  
**Time:** 3-4 hours

**What to do:**
- Parse file keys to extract folder structure
- Display folders as clickable cards
- Breadcrumb navigation (Home > students > photos > student_123)
- Back button to parent folder

**Example:**
```
tenants/tenant_1/students/photos/student_123/profile.jpg
                 ↓
Folders: students → photos → student_123 → profile.jpg
```

**UI:**
```tsx
<div className="breadcrumbs">
  <span onClick={() => navigateTo('/')}>Home</span> /
  <span onClick={() => navigateTo('/students')}>students</span> /
  <span onClick={() => navigateTo('/students/photos')}>photos</span> /
  <span>student_123</span>
</div>
```

---

### **Task 4: Image Optimization**
**Priority:** MEDIUM  
**Time:** 2-3 hours

**What to do:**
- Auto-resize images > 2MB to max 1920x1080
- Compress JPEG/PNG images (quality 85%)
- Convert to WebP for better compression (optional)
- Show "Optimizing..." progress

**Library:**
```bash
npm install sharp
```

**Implementation:**
```typescript
import sharp from 'sharp'

async function optimizeImage(buffer: Buffer): Promise<Buffer> {
  return await sharp(buffer)
    .resize(1920, 1080, { fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 85 })
    .toBuffer()
}
```

---

### **Task 5: Bulk File Operations**
**Priority:** LOW  
**Time:** 2-3 hours

**What to do:**
- Checkbox selection in file grid
- "Select All" button
- "Delete Selected" button
- Confirmation dialog before bulk delete

**UI:**
```tsx
<div className="bulk-actions">
  <Checkbox onChange={selectAll} /> Select All
  <Button onClick={deleteSelected} disabled={selected.length === 0}>
    Delete {selected.length} files
  </Button>
</div>
```

---

### **Task 6: Storage Migration Service**
**Priority:** LOW (Future)  
**Time:** 4-5 hours

**What to do:**
- Create `lib/storage/migration-service.ts`
- Implement `migrateLocalToR2()` and `migrateR2ToLocal()`
- Create `/api/storage/migrate` endpoint
- Create Settings page UI with progress bar

**Note:** This is for future when user wants to switch from Local to R2 storage.

---

### **Task 7: Integrate with TipTap Editor**
**Priority:** HIGH  
**Time:** 1-2 hours

**What to do:**
- Replace `prompt()` in `math-editor.tsx` with `ImagePropertiesDialog`
- Use `FileUploadButton` for image insertion
- Track uploaded images in database
- Delete old images when question is updated

**File:** `app/(dashboard)/question-bank/questions/_components/math-editor.tsx`

**Current Code (Line 492-500):**
```tsx
const addImage = () => {
  const url = prompt('Enter image URL:')
  if (url && editor) {
    editor.chain().focus().setImage({ src: url }).run()
  }
}
```

**New Code:**
```tsx
const [showImageDialog, setShowImageDialog] = useState(false)

const handleImageInsert = (props: ImageProperties) => {
  if (editor) {
    editor.chain().focus().setImage({
      src: props.url,
      alt: props.alt,
      title: props.alt,
    }).run()
  }
}

// In toolbar:
<Button onClick={() => setShowImageDialog(true)}>
  <ImageIcon /> Image
</Button>

<ImagePropertiesDialog
  open={showImageDialog}
  onClose={() => setShowImageDialog(false)}
  onInsert={handleImageInsert}
  category="question_image"
/>
```

---

## 🎯 **Recommended Implementation Order**

### **Phase A: Essential Features (Do Now)**
1. ✅ Task 7: TipTap Integration (1-2 hours) - **HIGHEST PRIORITY**
2. ✅ Task 1: Recent Files Tab (1-2 hours)
3. ✅ Task 3: Folder Navigation (3-4 hours)

**Total: 5-8 hours**

### **Phase B: Nice-to-Have (Do Later)**
4. ⚠️ Task 2: File Metadata (2-3 hours)
5. ⚠️ Task 4: Image Optimization (2-3 hours)
6. ⚠️ Task 5: Bulk Operations (2-3 hours)

**Total: 6-9 hours**

### **Phase C: Future (When Needed)**
7. 🔮 Task 6: Storage Migration (4-5 hours)

---

## ✅ **Final Approval Checklist**

Before implementation, confirm:

- [ ] ✅ Recent Files tab needed? **YES**
- [ ] ✅ File metadata (Author, Description) needed? **YES (Simple version)**
- [ ] ✅ Folder navigation needed? **YES**
- [ ] ✅ Image optimization needed? **YES**
- [ ] ✅ Bulk operations needed? **YES**
- [ ] ⚠️ Storage migration needed now? **NO (Future)**
- [ ] ✅ TipTap integration needed? **YES (CRITICAL)**

---

## 📝 **Summary**

**What's Done:**
- ✅ Database schema
- ✅ Storage service
- ✅ API routes
- ✅ File picker modal (4 tabs)
- ✅ Image properties dialog
- ✅ File upload button
- ✅ Test page

**What's Missing:**
- ❌ Recent files (localStorage)
- ❌ File metadata (author, description)
- ❌ Folder navigation
- ❌ Image optimization
- ❌ Bulk operations
- ❌ TipTap integration (CRITICAL)

**Next Steps:**
1. Get user approval on this plan
2. Implement Phase A (Essential Features)
3. Test in browser
4. Integrate with all rich text editors in the app
5. Implement Phase B (Nice-to-Have) if time permits

---

**Ready for approval?** 🚀

