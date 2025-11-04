# 🔧 Student Enrollment Implementation Guide

## PHASE 1: DATABASE CHANGES

### Step 1.1: Update Prisma Schema

**File:** `prisma/schema.prisma`

```prisma
// Add to StudentEnrollment model
model StudentEnrollment {
  id              String   @id @default(cuid())
  tenantId        String
  studentId       String
  sectionId       String

  // Enrollment Type (based on cohort setting)
  enrollmentType  EnrollmentType @default(DIRECT)
  cohortId        String?  // Only if enrollmentType = COHORT_BASED

  // Academic Info
  academicYearId  String
  classId         String
  streamId        String?  // 🔥 NEW - For DIRECT & ONLINE modes
  branchId        String?  // 🔥 CHANGED to optional (was required)

  // Online Flag
  isOnline        Boolean @default(false)  // 🔥 NEW

  enrollmentDate  DateTime @default(now())
  status          EnrollmentStatus @default(ACTIVE)
  createdAt       DateTime @default(now())
  updatedAt       DateTime @updatedAt

  tenant          Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  student         Student  @relation(fields: [studentId], references: [id], onDelete: Cascade)
  section         Section  @relation(fields: [sectionId], references: [id], onDelete: Restrict)
  cohort          Cohort?  @relation(fields: [cohortId], references: [id], onDelete: Restrict)
  academicYear    AcademicYear @relation(fields: [academicYearId], references: [id], onDelete: Restrict)
  class           Class @relation(fields: [classId], references: [id], onDelete: Restrict)
  stream          Stream? @relation(fields: [streamId], references: [id], onDelete: SetNull)
  branch          Branch? @relation(fields: [branchId], references: [id], onDelete: SetNull)

  @@unique([tenantId, studentId, academicYearId])
  @@map("student_enrollments")
}

// Add to Stream model
model Stream {
  id          String   @id @default(cuid())
  tenantId    String
  name        String
  note        String?
  createdAt   DateTime @default(now())
  updatedAt   DateTime @updatedAt

  tenant      Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  classes     Class[]
  cohorts     Cohort[]
  enrollments StudentEnrollment[]  // 🔥 NEW RELATION

  @@unique([tenantId, name])
  @@map("streams")
}

// Add to Section model
model Section {
  id        String   @id @default(cuid())
  tenantId  String
  name      String
  capacity  Int      @default(0)
  isOnline  Boolean @default(false)  // 🔥 NEW - Mark online sections
  note      String?
  createdAt DateTime @default(now())
  updatedAt DateTime @updatedAt

  tenant         Tenant   @relation(fields: [tenantId], references: [id], onDelete: Cascade)
  routines       Routine[]
  enrollments    StudentEnrollment[]
  cohortSections CohortSection[]

  @@unique([tenantId, name])
  @@map("sections")
}
```

### Step 1.2: Create Migration

```bash
npx prisma migrate dev --name add_stream_online_enrollment_fields
```

### Step 1.3: Update Existing Data

```sql
-- For existing COHORT_BASED enrollments, populate streamId from cohort
UPDATE student_enrollments se
SET streamId = c.streamId
FROM cohorts c
WHERE se.cohortId = c.id AND se.enrollmentType = 'COHORT_BASED';

-- For existing DIRECT enrollments, streamId remains NULL
-- (can be populated manually or left as NULL)
```

---

## PHASE 2: ADMISSION FORM CHANGES

### Step 2.1: Update AcademicInfoStep Component

**Key Changes:**
1. Add `isOnline` checkbox
2. Add `streamId` field for DIRECT mode
3. Update conditional rendering
4. Update validation logic

**Pseudo-code:**
```typescript
export function AcademicInfoStep({
  form,
  branches,
  academicYears,
  classes,
  streams,  // 🔥 NEW PROP
  enableCohorts,
  onFetchCohorts,
  onFetchSections,
}) {
  const isOnline = form.watch('isOnline')
  const enrollmentType = enableCohorts ? 'COHORT_BASED' : 'DIRECT'

  return (
    <div>
      {/* Online Checkbox */}
      <FormField
        control={form.control}
        name="isOnline"
        render={({ field }) => (
          <FormItem className="flex items-center space-x-2">
            <FormControl>
              <Checkbox {...field} />
            </FormControl>
            <FormLabel>This is an Online Student</FormLabel>
          </FormItem>
        )}
      />

      {/* COHORT MODE */}
      {enableCohorts && !isOnline && (
        <>
          {/* Branch, Year, Class, Cohort, Section */}
        </>
      )}

      {/* DIRECT MODE */}
      {!enableCohorts && !isOnline && (
        <>
          {/* Year, Class, Stream (optional), Section */}
        </>
      )}

      {/* ONLINE MODE */}
      {isOnline && (
        <>
          {/* Year, Class, Stream (optional), Section (online only) */}
        </>
      )}
    </div>
  )
}
```

### Step 2.2: Update Admission Form Schema

```typescript
const admissionSchema = z.object({
  // ... existing fields
  
  // 🔥 NEW FIELDS
  isOnline: z.boolean().default(false),
  streamId: z.string().optional().or(z.literal('')),
  
  // 🔥 UPDATED FIELD
  branchId: z.string().optional().or(z.literal('')),  // Now optional
})
```

### Step 2.3: Update Server Action (admitStudent)

```typescript
export async function admitStudent(data: FormValues, enableCohorts: boolean) {
  // Determine enrollment type
  let enrollmentType: EnrollmentType = 'DIRECT'
  
  if (data.isOnline) {
    enrollmentType = 'ONLINE'
  } else if (enableCohorts) {
    enrollmentType = 'COHORT_BASED'
  }

  // Validate based on enrollment type
  if (enrollmentType === 'COHORT_BASED') {
    if (!data.branchId || !data.cohortId) {
      return { success: false, error: 'Branch and Cohort required' }
    }
  } else if (enrollmentType === 'DIRECT') {
    if (!data.academicYearId || !data.classId || !data.sectionId) {
      return { success: false, error: 'Year, Class, Section required' }
    }
  } else if (enrollmentType === 'ONLINE') {
    if (!data.academicYearId || !data.classId || !data.sectionId) {
      return { success: false, error: 'Year, Class, Section required' }
    }
  }

  // Create enrollment
  await prisma.studentEnrollment.create({
    data: {
      tenantId,
      studentId: student.id,
      sectionId: data.sectionId,
      enrollmentType,
      cohortId: enrollmentType === 'COHORT_BASED' ? data.cohortId : null,
      academicYearId: data.academicYearId,
      classId: data.classId,
      streamId: data.streamId || null,
      branchId: enrollmentType === 'COHORT_BASED' ? data.branchId : null,
      isOnline: enrollmentType === 'ONLINE',
      status: 'ACTIVE',
    },
  })
}
```

---

## PHASE 3: STUDENT EDIT FORM CHANGES

### Step 3.1: Update Edit Form

**Key Changes:**
1. Show `isOnline` flag (read-only or editable)
2. Show `streamId` field for DIRECT mode
3. Update conditional rendering
4. Update validation

**Pseudo-code:**
```typescript
export function EditStudentForm({
  student,
  branches,
  academicYears,
  classes,
  streams,  // 🔥 NEW PROP
  enableCohorts,
}) {
  const isOnline = form.watch('isOnline')

  return (
    <form>
      {/* Online Flag - Read Only or Editable */}
      <FormField
        control={form.control}
        name="isOnline"
        render={({ field }) => (
          <FormItem>
            <FormLabel>Online Student</FormLabel>
            <FormControl>
              <Checkbox {...field} disabled={true} />
            </FormControl>
            <FormDescription>
              Cannot change enrollment type after admission
            </FormDescription>
          </FormItem>
        )}
      />

      {/* Stream Field - For DIRECT & ONLINE modes */}
      {!enableCohorts && (
        <FormField
          control={form.control}
          name="streamId"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Stream (Optional)</FormLabel>
              <FormControl>
                <SearchableDropdown
                  options={streams.map(s => ({
                    value: s.id,
                    label: s.name
                  }))}
                  value={field.value}
                  onChange={field.onChange}
                  placeholder="Select stream"
                />
              </FormControl>
            </FormItem>
          )}
        />
      )}
    </form>
  )
}
```

---

## PHASE 4: SECTIONS MANAGEMENT

### Step 4.1: Update Section Creation

**Add isOnline flag:**
```typescript
// In section creation form
<FormField
  control={form.control}
  name="isOnline"
  render={({ field }) => (
    <FormItem className="flex items-center space-x-2">
      <FormControl>
        <Checkbox {...field} />
      </FormControl>
      <FormLabel>This is an Online Section</FormLabel>
    </FormItem>
  )}
/>
```

### Step 4.2: Filter Sections in Admission Form

```typescript
// When fetching sections for online students
export async function getAvailableSections(
  cohortId?: string,
  classId?: string,
  isOnline?: boolean
) {
  const where: any = { tenantId }

  if (cohortId) {
    where.cohortSections = { some: { cohortId } }
  }

  if (isOnline) {
    where.isOnline = true  // Only online sections
  }

  const sections = await prisma.section.findMany({
    where,
    orderBy: { name: 'asc' },
  })

  return { success: true, data: sections }
}
```

---

## PHASE 5: QUERIES & REPORTS

### Step 5.1: Get Student with Full Context

```typescript
// Get student enrollment with all related data
const enrollment = await prisma.studentEnrollment.findFirst({
  where: { studentId },
  include: {
    student: true,
    section: true,
    academicYear: true,
    class: true,
    stream: true,
    branch: true,
    cohort: {
      include: {
        year: true,
        class: true,
        stream: true,
        branch: true,
      }
    }
  }
})

// Usage:
if (enrollment.enrollmentType === 'COHORT_BASED') {
  // Use cohort data
  const context = {
    branch: enrollment.cohort.branch.name,
    year: enrollment.cohort.year.name,
    class: enrollment.cohort.class.name,
    stream: enrollment.cohort.stream?.name,
    section: enrollment.section.name,
  }
} else if (enrollment.enrollmentType === 'DIRECT') {
  // Use direct data
  const context = {
    year: enrollment.academicYear.name,
    class: enrollment.class.name,
    stream: enrollment.stream?.name,
    section: enrollment.section.name,
  }
} else if (enrollment.enrollmentType === 'ONLINE') {
  // Use online data
  const context = {
    year: enrollment.academicYear.name,
    class: enrollment.class.name,
    stream: enrollment.stream?.name,
    section: enrollment.section.name,
    isOnline: true,
  }
}
```

---

## PHASE 6: TESTING CHECKLIST

### Admission Form Tests
- [ ] COHORT mode: Branch → Year → Class → Cohort → Section
- [ ] DIRECT mode: Year → Class → Stream → Section
- [ ] ONLINE mode: Year → Class → Stream → Section (online only)
- [ ] isOnline checkbox hides branch selection
- [ ] Stream field shows for DIRECT & ONLINE modes
- [ ] Validation works for all modes

### Student Edit Tests
- [ ] Cohort mode: All fields prefilled correctly
- [ ] Direct mode: Stream field shows and prefilled
- [ ] Online mode: isOnline flag shows as checked
- [ ] Cannot change enrollment type
- [ ] Stream can be edited for DIRECT & ONLINE

### Database Tests
- [ ] StudentEnrollment has streamId, isOnline, optional branchId
- [ ] Stream relation works
- [ ] Section.isOnline flag works
- [ ] Existing data migrated correctly

### Query Tests
- [ ] Get student with full context works
- [ ] Filter sections by isOnline works
- [ ] Reports show stream information

---

## PHASE 7: ROLLOUT PLAN

### Week 1: Database & Backend
- [ ] Update Prisma schema
- [ ] Create migration
- [ ] Update server actions
- [ ] Test queries

### Week 2: Admission Form
- [ ] Update AcademicInfoStep
- [ ] Add isOnline checkbox
- [ ] Add streamId field
- [ ] Test all three modes

### Week 3: Student Edit Form
- [ ] Update edit form
- [ ] Show streamId field
- [ ] Show isOnline flag
- [ ] Test editing

### Week 4: Sections & Reports
- [ ] Update section creation
- [ ] Add isOnline flag
- [ ] Update reports
- [ ] Final testing

---

## SUMMARY

### What Changes
✅ StudentEnrollment: Add streamId, isOnline, make branchId optional
✅ Stream: Add enrollments relation
✅ Section: Add isOnline flag
✅ Admission Form: Add isOnline checkbox, streamId field
✅ Student Edit: Show streamId, show isOnline flag

### What Doesn't Change
✅ Cohort model
✅ Class model
✅ Branch model
✅ Existing cohort-based enrollments

### Benefits
✅ Complete context for all enrollment types
✅ No confusion about branch for online students
✅ Stream information always available
✅ Flexible enrollment options
✅ Backward compatible

