# 📱 MOBILE APP REQUIREMENTS & ROADMAP

> **Status:** 🔮 Future Phase (After Web Dashboard Completion)  
> **Priority:** High (Student, Teacher, Admin apps)  
> **Architecture:** REST API + Offline-First + Secure Storage

---

## 🎯 OVERVIEW

### **Current Phase: Web Dashboard (Server Actions)**

- ✅ Admin, Teacher, Student - সবাই browser এ use করবে
- ✅ Server Actions দিয়ে সব feature complete হচ্ছে
- ✅ Multi-tenant SaaS architecture already ready
- ✅ RBAC (Role-Based Access Control) implemented
- ✅ File storage system (Local/R2) working

### **Future Phase: Mobile Apps (REST API)**

- 🔮 **Admin App** - School management on mobile
- 🔮 **Teacher App** - Course delivery, grading, attendance
- 🔮 **Student App** - Learning, assignments, offline content

---

## 📋 MOBILE APP REQUIREMENTS

### **1. Three Separate Mobile Apps**

#### **1.1 Student App (Priority: Highest)**

**Target Users:** Students (offline-first learning)

**Core Features:**

- ✅ Course enrollment & access
- ✅ Video lessons (streaming + offline download)
- ✅ PDF documents (download & offline reading)
- ✅ Assignments submission
- ✅ Exam participation
- ✅ Progress tracking
- ✅ Notifications (assignments, exams, announcements)
- ✅ Profile management

**Offline Features:**

- ✅ Download PDF documents inside app (secured)
- ✅ Download video lessons for offline viewing
- ✅ Offline database (SQLite/Realm) for course content
- ✅ Sync when internet available
- ✅ Offline quiz/assignment attempt (sync later)

**Security Requirements:**

- 🔒 **PDF/Documents stored ONLY inside app sandbox**
- 🔒 **Files NOT accessible from device file manager**
- 🔒 **Encrypted local storage**
- 🔒 **DRM protection for videos (optional)**
- 🔒 **Screenshot prevention for sensitive content (optional)**

---

#### **1.2 Teacher App (Priority: High)**

**Target Users:** Teachers (course delivery & grading)

**Core Features:**

- ✅ Course management (create, edit, publish)
- ✅ Lesson upload (videos, PDFs, assignments)
- ✅ Student progress monitoring
- ✅ Assignment grading
- ✅ Attendance marking
- ✅ Announcements & notifications
- ✅ Live class scheduling
- ✅ Grade book management

**Offline Features:**

- ✅ View student list offline
- ✅ Mark attendance offline (sync later)
- ✅ Grade assignments offline
- ✅ View course materials offline

---

#### **1.3 Admin App (Priority: Medium)**

**Target Users:** School administrators

**Core Features:**

- ✅ Student admission & enrollment
- ✅ Teacher management
- ✅ Course approval & publishing
- ✅ Reports & analytics
- ✅ Settings management
- ✅ Payment tracking
- ✅ Notifications management

**Offline Features:**

- ⚠️ Limited offline support (admin tasks mostly require real-time data)
- ✅ View reports offline
- ✅ Student/teacher directory offline

---

## 🔧 TECHNICAL ARCHITECTURE

### **Backend: REST API Layer**

#### **Migration Strategy: Server Actions → REST API**

**Current (Web Dashboard):**

```
Browser → Server Actions → Prisma → Database
```

**Future (Web + Mobile):**

```
Browser → Server Actions ──┐
                           ├──→ Service Layer → Prisma → Database
Mobile Apps → REST API ────┘
```

**Implementation Pattern:**

```typescript
// Step 1: Extract business logic to Service Layer
// lib/services/course.service.ts
export class CourseService {
  static async create(tenantId: string, data: CreateCourseInput) {
    // All business logic (validation, database operations)
    const validated = courseSchema.parse(data);
    const course = await prisma.course.create({
      data: { ...validated, tenantId },
    });
    return course;
  }

  static async list(tenantId: string, filters?: CourseFilters) {
    return await prisma.course.findMany({
      where: { tenantId, ...filters },
    });
  }
}

// Step 2: Server Action uses Service (Web Dashboard)
// lib/actions/course.actions.ts
("use server");
export async function createCourse(data: CreateCourseInput) {
  await requireRole("ADMIN");
  const tenantId = await getTenantId();
  const course = await CourseService.create(tenantId, data);
  revalidatePath("/courses");
  return { success: true, data: course };
}

// Step 3: REST API uses same Service (Mobile Apps)
// app/api/courses/route.ts
export async function POST(request: NextRequest) {
  const { tenantId, role } = await verifyApiToken(request);
  if (role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }
  const data = await request.json();
  const course = await CourseService.create(tenantId, data);
  return NextResponse.json({ success: true, data: course });
}
```

---

### **REST API Endpoints (To Be Implemented)**

#### **Authentication**

```
POST   /api/auth/login              # Login (email/password) → JWT token
POST   /api/auth/logout             # Logout
POST   /api/auth/refresh            # Refresh token
GET    /api/auth/me                 # Current user info
POST   /api/auth/forgot-password    # Password reset request
POST   /api/auth/reset-password     # Password reset confirmation
```

#### **Courses**

```
GET    /api/courses                 # List courses (with filters)
POST   /api/courses                 # Create course (ADMIN/TEACHER)
GET    /api/courses/:id             # Get course details
PUT    /api/courses/:id             # Update course
DELETE /api/courses/:id             # Delete course
GET    /api/courses/:id/lessons     # List lessons in course
POST   /api/courses/:id/enroll      # Enroll student (STUDENT)
```

#### **Lessons**

```
GET    /api/lessons/:id             # Get lesson details
POST   /api/lessons                 # Create lesson (TEACHER)
PUT    /api/lessons/:id             # Update lesson
DELETE /api/lessons/:id             # Delete lesson
GET    /api/lessons/:id/download    # Download lesson content (secured)
```

#### **Assignments**

```
GET    /api/assignments             # List assignments
POST   /api/assignments             # Create assignment (TEACHER)
GET    /api/assignments/:id         # Get assignment details
POST   /api/assignments/:id/submit  # Submit assignment (STUDENT)
GET    /api/assignments/:id/submissions  # List submissions (TEACHER)
PUT    /api/assignments/:id/grade   # Grade assignment (TEACHER)
```

#### **Students**

```
GET    /api/students                # List students (ADMIN/TEACHER)
POST   /api/students                # Create student (ADMIN)
GET    /api/students/:id            # Get student details
PUT    /api/students/:id            # Update student
GET    /api/students/:id/courses    # Student's enrolled courses
GET    /api/students/:id/progress   # Student's progress
```

#### **File Upload/Download**

```
POST   /api/upload                  # Upload file (multipart/form-data)
GET    /api/files/:id               # Download file (with permission check)
GET    /api/files/:id/stream        # Stream video (with range support)
DELETE /api/files/:id               # Delete file
```

#### **Offline Sync**

```
POST   /api/sync/pull               # Pull updates (courses, lessons, assignments)
POST   /api/sync/push               # Push local changes (submissions, progress)
GET    /api/sync/status             # Check sync status
```

---

## 📱 MOBILE APP TECHNICAL STACK

### **Recommended: React Native (Cross-Platform)**

**Why React Native:**

- ✅ Single codebase for iOS + Android
- ✅ Team already knows React (Next.js)
- ✅ Large ecosystem (libraries, community)
- ✅ Native performance
- ✅ Easy to integrate with REST API

**Alternative: Flutter**

- ✅ Better performance
- ✅ Beautiful UI out of the box
- ❌ Team needs to learn Dart

**Tech Stack:**

```
Frontend:  React Native + TypeScript
State:     Zustand / Redux Toolkit
API:       Axios / React Query
Offline:   WatermelonDB / Realm
Storage:   react-native-fs (secure file storage)
Video:     react-native-video
PDF:       react-native-pdf
Auth:      AsyncStorage (encrypted)
Push:      Firebase Cloud Messaging
```

---

## 🔒 SECURITY REQUIREMENTS (CRITICAL)

### **1. Secure File Storage (PDF/Videos)**

**Requirement:**

- ✅ Files downloaded inside app ONLY
- ✅ NOT accessible from device file manager
- ✅ Encrypted local storage
- ✅ Auto-delete when user logs out or course expires

**Implementation (React Native):**

```typescript
// Use app's internal storage (not accessible from file manager)
import RNFS from "react-native-fs";

const SECURE_STORAGE_PATH = RNFS.DocumentDirectoryPath + "/secure_content";

// Download PDF securely
async function downloadPDFSecurely(lessonId: string, url: string) {
  const token = await getAuthToken();

  // Download to app's internal storage
  const filePath = `${SECURE_STORAGE_PATH}/lessons/${lessonId}.pdf`;

  await RNFS.downloadFile({
    fromUrl: url,
    toFile: filePath,
    headers: {
      Authorization: `Bearer ${token}`,
    },
  }).promise;

  // Encrypt file (optional, for extra security)
  await encryptFile(filePath);

  // Save metadata to local database
  await db.lessons.update(lessonId, {
    downloadedAt: new Date(),
    localPath: filePath,
    isOfflineAvailable: true,
  });
}

// Open PDF (only inside app)
async function openPDF(lessonId: string) {
  const lesson = await db.lessons.findById(lessonId);

  if (!lesson.localPath) {
    throw new Error("PDF not downloaded");
  }

  // Decrypt if encrypted
  const decryptedPath = await decryptFile(lesson.localPath);

  // Open in app's PDF viewer (NOT external app)
  navigation.navigate("PDFViewer", { filePath: decryptedPath });
}

// Delete when user logs out
async function clearSecureStorage() {
  await RNFS.unlink(SECURE_STORAGE_PATH);
}
```

**Security Layers:**

1. ✅ **App Sandbox** - Files stored in app's private directory
2. ✅ **Encryption** - Files encrypted at rest (AES-256)
3. ✅ **Authentication** - Download requires valid JWT token
4. ✅ **In-App Viewer** - PDF/Video opened only inside app
5. ✅ **Auto-Cleanup** - Files deleted on logout/expiry

---

### **2. Offline Database Security**

**Requirement:**

- ✅ Local database encrypted
- ✅ Sync only authenticated data
- ✅ Auto-wipe on logout

**Implementation (WatermelonDB):**

```typescript
import { Database } from "@nozbe/watermelondb";
import SQLiteAdapter from "@nozbe/watermelondb/adapters/sqlite";

const adapter = new SQLiteAdapter({
  schema,
  // Enable encryption
  jsi: true,
  encryptionKey: await getDeviceEncryptionKey(),
});

const database = new Database({
  adapter,
  modelClasses: [Course, Lesson, Assignment, Student],
});

// Sync with server
async function syncWithServer() {
  const token = await getAuthToken();

  await synchronize({
    database,
    pullChanges: async ({ lastPulledAt }) => {
      const response = await fetch("/api/sync/pull", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ lastPulledAt }),
      });
      return await response.json();
    },
    pushChanges: async ({ changes }) => {
      await fetch("/api/sync/push", {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          "Content-Type": "application/json",
        },
        body: JSON.stringify(changes),
      });
    },
  });
}
```

---

## 📊 OFFLINE-FIRST ARCHITECTURE

### **Data Flow:**

```
┌─────────────────────────────────────────────────┐
│              Mobile App (Student)               │
├─────────────────────────────────────────────────┤
│                                                 │
│  ┌──────────────┐      ┌──────────────┐        │
│  │   UI Layer   │      │  PDF Viewer  │        │
│  └──────┬───────┘      └──────┬───────┘        │
│         │                     │                 │
│  ┌──────▼──────────────────────▼───────┐       │
│  │      Local State (Zustand)          │       │
│  └──────┬──────────────────────────────┘       │
│         │                                       │
│  ┌──────▼──────────────────────────────┐       │
│  │   Offline Database (WatermelonDB)   │       │
│  │   - Courses, Lessons, Assignments   │       │
│  │   - Encrypted SQLite                │       │
│  └──────┬──────────────────────────────┘       │
│         │                                       │
│  ┌──────▼──────────────────────────────┐       │
│  │   Secure File Storage (RNFS)        │       │
│  │   - PDFs, Videos (Encrypted)        │       │
│  │   - App Sandbox Only                │       │
│  └─────────────────────────────────────┘       │
│         │                                       │
└─────────┼───────────────────────────────────────┘
          │
          │ Sync when online
          │
┌─────────▼───────────────────────────────────────┐
│              Backend (REST API)                 │
├─────────────────────────────────────────────────┤
│  JWT Auth → Service Layer → Prisma → Database  │
└─────────────────────────────────────────────────┘
```

---

## 🚀 IMPLEMENTATION ROADMAP

### **Phase 1: Current (Web Dashboard) - IN PROGRESS**

- ✅ Complete all features using Server Actions
- ✅ Admin, Teacher, Student - browser-based
- ✅ File upload/download working
- ✅ Multi-tenant + RBAC ready

**Timeline:** Current sprint (ongoing)

---

### **Phase 2: REST API Layer - FUTURE**

**Tasks:**

1. ✅ Create Service Layer (extract business logic)
2. ✅ Implement JWT authentication
3. ✅ Create REST API endpoints (30+ endpoints)
4. ✅ Add API middleware (auth, RBAC, rate limiting)
5. ✅ Implement file upload/download APIs
6. ✅ Add offline sync endpoints
7. ✅ API documentation (Swagger/Postman)
8. ✅ API testing (Postman, automated tests)

**Timeline:** 2-3 weeks (after web dashboard complete)

---

### **Phase 3: Student Mobile App - FUTURE**

**Tasks:**

1. ✅ Setup React Native project
2. ✅ Implement authentication (JWT)
3. ✅ Implement offline database (WatermelonDB)
4. ✅ Implement secure file storage (RNFS)
5. ✅ Build course listing & enrollment
6. ✅ Build lesson viewer (PDF, Video)
7. ✅ Build assignment submission
8. ✅ Implement offline sync
9. ✅ Add push notifications
10. ✅ Testing (iOS + Android)
11. ✅ App Store deployment

**Timeline:** 4-6 weeks

---

### **Phase 4: Teacher Mobile App - FUTURE**

**Tasks:**

1. ✅ Reuse Student App codebase
2. ✅ Add teacher-specific features
3. ✅ Course management UI
4. ✅ Assignment grading UI
5. ✅ Student progress monitoring
6. ✅ Attendance marking
7. ✅ Testing & deployment

**Timeline:** 3-4 weeks

---

### **Phase 5: Admin Mobile App - FUTURE**

**Tasks:**

1. ✅ Reuse shared components
2. ✅ Add admin-specific features
3. ✅ Student admission UI
4. ✅ Reports & analytics
5. ✅ Settings management
6. ✅ Testing & deployment

**Timeline:** 2-3 weeks

---

## 📝 NOTES & DECISIONS

### **Key Decisions:**

1. ✅ **Web First, Mobile Later** - Complete web dashboard first, then add mobile apps
2. ✅ **Service Layer Pattern** - Share business logic between Server Actions and REST API
3. ✅ **React Native** - Cross-platform mobile development (iOS + Android)
4. ✅ **Offline-First** - Students can download content and use offline
5. ✅ **Secure Storage** - Files stored only inside app, not accessible from file manager
6. ✅ **Encrypted Database** - Local database encrypted for security
7. ✅ **JWT Authentication** - Stateless authentication for mobile apps

### **Security Priorities:**

1. 🔒 **File Security** - PDFs/Videos only accessible inside app
2. 🔒 **Data Encryption** - Local database and files encrypted
3. 🔒 **Authentication** - JWT tokens with expiration
4. 🔒 **Authorization** - RBAC enforced on every API call
5. 🔒 **Tenant Isolation** - All data scoped by tenantId

### **Performance Priorities:**

1. ⚡ **Offline-First** - App works without internet
2. ⚡ **Smart Sync** - Only sync changed data
3. ⚡ **Video Streaming** - Support range requests for video
4. ⚡ **Image Optimization** - Compress images before upload
5. ⚡ **Lazy Loading** - Load content on demand

---

## ✅ CHECKLIST (Before Starting Mobile App)

- [ ] Web dashboard 100% complete (all features working)
- [ ] All Server Actions tested and working
- [ ] Database schema finalized (no major changes expected)
- [ ] File storage system working (Local + R2)
- [ ] Multi-tenant isolation verified
- [ ] RBAC working for all roles
- [ ] Service Layer extracted (business logic separated)
- [ ] REST API endpoints implemented
- [ ] JWT authentication working
- [ ] API documentation complete
- [ ] API testing complete (Postman/automated)
- [ ] Mobile app tech stack decided
- [ ] Security requirements documented
- [ ] Offline sync strategy finalized

---

## 🎯 SUCCESS CRITERIA

### **Student App:**

- ✅ Students can login with email/password
- ✅ Students can browse and enroll in courses
- ✅ Students can download PDFs and watch videos offline
- ✅ Downloaded files are NOT accessible from file manager
- ✅ Students can submit assignments (online/offline)
- ✅ Students can view their progress
- ✅ App syncs automatically when online
- ✅ App works smoothly offline

### **Teacher App:**

- ✅ Teachers can create and manage courses
- ✅ Teachers can upload lessons (PDF, video)
- ✅ Teachers can grade assignments
- ✅ Teachers can view student progress
- ✅ Teachers can mark attendance

### **Admin App:**

- ✅ Admins can manage students and teachers
- ✅ Admins can view reports and analytics
- ✅ Admins can manage settings

---

**Document Created:** 2025-11-20
**Last Updated:** 2025-11-20
**Status:** 📋 Requirements Documented - Ready for Future Implementation
**Next Step:** Complete web dashboard, then start REST API layer
