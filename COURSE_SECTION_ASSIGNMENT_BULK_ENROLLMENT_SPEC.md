# Course–Section Assignment & Bulk Enrollment (Future Feature Spec)

> **Status:** Not implemented yet (future phase). This doc designs a **separate, explicit feature** so that Academic Integration on the course form remains **safe + tag‑only**.

## 1. Overview & Goal

Allow admins to **assign a course to one or more Academic Sections** (e.g. `Class 8 – Science – Section A`) and then:

- ✅ **Bulk-enroll** all currently active students in those Sections into the course.
- ✅ **Optionally auto-generate invoices** for each enrolled student using the course pricing.
- ✅ Show a **clear preview** of how many students/invoices will be affected before confirming.
- ❌ Never run silently just because Class/Stream/Subject fields are set on the course.

This feature lives **beside** Academic Integration, not inside the basic course form.

## 2. Core Concepts & Entities

- **Section** – from Academic Setup; each Section has many `StudentEnrollment` records.
- **StudentEnrollment** – links student ↔ Branch/Year/Class/Section.
- **Course** – learning product; already has optional `classId`, `streamId`, `subjectId` tags.
- **CourseEnrollment** – links student ↔ course; controls access & progress.
- **Invoice** – financial record for paid enrollments.
- **CourseSectionAssignment (new, future model)** – joins `Course` and `Section` and tracks bulk assignment metadata.

### 2.1 Proposed Prisma Model (future)

```prisma
model CourseSectionAssignment {
  id        String   @id @default(cuid())
  tenantId  String

  courseId  String
  sectionId String

  course    Course   @relation(fields: [courseId], references: [id])
  section   Section  @relation(fields: [sectionId], references: [id])

  createdByUserId String
  createdAt       DateTime @default(now())

  // For audit: how many enrollments / invoices were created in this batch
  enrolledCount   Int      @default(0)
  invoiceCount    Int      @default(0)

  tenant Tenant @relation(fields: [tenantId], references: [id], onDelete: Cascade)

  @@unique([tenantId, courseId, sectionId])
}
```

> **Note:** This is a **plan**, not an immediate schema change.

## 3. Primary Use Case (Narrative Example)

**Example:** Admin wants every student in **Class 8 – Science – Section A (2025)** to take **“Class 8 Mathematics – Full Syllabus”**.

1. Admin opens the **Course Management → Courses → [Course Details] → "Academic Assignments" tab** (future tab).
2. Clicks **"Assign course to section"**.
3. Chooses:
   - Academic Year: `2025`
   - Branch: `Mirpur Campus`
   - Class: `Class 8`
   - Stream: `Science`
   - Section: `Section A`
4. System runs a **preview**:
   - Finds all active `StudentEnrollment` in that Section (say 92 students).
   - Checks which of them are **not already enrolled** in this course.
   - Calculates **potential invoice total** if `autoGenerateInvoice = true` and course is paid.
5. UI shows a summary dialog:
   - "This will enroll **87 new students** (5 already enrolled)."
   - "Will create **87 invoices** totaling **৳130,500**." (example).
   - "Are you sure you want to continue?"
6. Only after admin confirms, system runs the **bulk operation** inside a transaction.

## 4. Behaviour Details

### 4.1 What happens on Confirm

For each **eligible student** in the selected Section(s):

- If `CourseEnrollment` for `(studentId, courseId)` **already exists** → **skip**.
- Else:
  - Create `CourseEnrollment` row.
  - If course is **PAID** and `autoGenerateInvoice = true`:
    - Create an `Invoice` with type `COURSE_ENROLLMENT` and reference to the enrollment.
- Update `Course.totalEnrollments` accordingly.
- Store counts on `CourseSectionAssignment.enrolledCount` and `.invoiceCount`.

### 4.2 What does NOT happen

- Students **joining the Section later** are **not auto-enrolled**; admin must re-run the assignment or use a future "sync new students" action.
- Students **leaving the Section** are **not auto-unenrolled**; unenrollment is a separate explicit action.
- Changing course **Class/Stream/Subject tags** does **not** touch these assignments.

## 5. Corner Cases & Rules

- **Idempotency:** Because of `@@unique([tenantId, studentId, courseId])` on `CourseEnrollment`, re-running the same assignment will **not double-enroll** or double-bill; already enrolled students are skipped.
- **Capacity:** If `course.maxStudents` is set, the bulk action must:
  - Stop when capacity would be exceeded, and
  - Show a clear message: e.g. "Only 60 of 92 students enrolled due to course capacity".
- **Free vs Paid:**
  - For `paymentType = FREE`, enrollments are still created, but **no invoices**.
- **Multiple Sections:** Admin may assign the same course to **multiple Sections** (e.g. `8A`, `8B`, `8C`). Each creates its own `CourseSectionAssignment` record.

## 6. Server Action Pattern (High Level)

### 6.1 `previewCourseSectionAssignment`

- Input: `{ courseId, sectionId }` (or multiple sectionIds).
- Steps:
  1. `requireRole('ADMIN')`.
  2. `tenantId = getTenantId()`.
  3. Validate payload with Zod.
  4. Fetch students in Section via `StudentEnrollment` scoped by `tenantId`.
  5. Check who is already enrolled in `CourseEnrollment`.
  6. Return counts: `totalStudents`, `alreadyEnrolled`, `toEnroll`, `estimatedInvoiceTotal`.

### 6.2 `assignCourseToSection`

- Input: `{ courseId, sectionId }` (plus explicit `confirm` from UI).
- Steps (inside transaction):
  1. `requireRole('ADMIN')`, `getTenantId()`.
  2. Re-run the same query as preview (to avoid stale data).
  3. Insert `CourseSectionAssignment` row.
  4. For each eligible student: create `CourseEnrollment` (+ Invoice if applicable).
  5. Update `Course.totalEnrollments`.
  6. Return summary to UI for toast: e.g. "Enrolled 87 students, 87 invoices created".

## 7. Testing Checklist (for this feature)

- [ ] Assign a paid course with `autoGenerateInvoice = true` to a Section with N students:
  - Verify **N enrollments** and **N invoices** created.
- [ ] Re-run assignment to the same Section:
  - Verify **0 new enrollments/invoices** are created.
- [ ] Assign the same course to two different Sections and confirm totals.
- [ ] Reduce `maxStudents` so that not all Section students fit; confirm partial enrollment + clear message.
- [ ] Test a FREE course: enrollments are created but invoices are **not**.
- [ ] Verify that later StudentEnrollment changes (new joiners/leavers) do **not** auto-enroll or unenroll.
- [ ] Confirm that editing course Class/Stream/Subject tags has **no side-effect** on existing assignments or enrollments.

