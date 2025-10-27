---
type: "manual"
---

PHASE 1: ACADEMIC SETUP MODULE (THEMED)
⚙️ Reminder to Augment
Use global architecture and tenant/RBAC rules already in context.

🎨 GLOBAL THEME & MOOD (UPDATED - COLOR FREEDOM)
You MUST design with a modern, slightly gamified “learning dashboard / esports control panel” feeling.

Rules:

Light / neutral surfaces for backgrounds (e.g. white, off-white, very soft gray) so content is readable.

Use high-contrast accent chips, badges, pills, progress bars, icons to show state, status, “Current”, “Active”, etc.

You are NOT locked to violet / purple / indigo / any single brand color. You are allowed to choose any modern gaming / RGB style accent palette (ex: teal/neon, cyan/magenta gradient, lime/amber mix, etc.) as long as:

it feels energetic / gamified, not dull ERP.

text stays legible (sufficient contrast).

same status type always uses the same accent consistently inside this feature (e.g. ACTIVE always same style chip).

You may use subtle gradients or glow-ish borders for headers / pills if that supports the gaming dashboard vibe.

Admin pages MUST NOT look like flat gray legacy ERP.

Section headers and table header rows should feel like “module cards” / dashboard tiles, not boring table admin.

Use pill badges, subtle icons, micro progress bars, celebration/confetti emoji in success states, etc.

You have creative freedom on accent colors. Do NOT assume purple unless you decide it looks best. You pick.

🎯 Goal
Implement the Academic Setup domain of the LMS, including:

Prisma models with tenantId

Next.js App Router pages under /academic-setup/*

CRUD (list/create/edit/archive/delete-guard)

Routine / Timetable screen with conflict validation

Year Wizard (bulk cohort/section generation)

Promotions stub (501)

All UI must use shadcn/ui + Tailwind tokens and must respect the THEME rules above:

Section headers look like “module cards”

Status pills and “Current” badge use consistent accent badge styles (rounded-full px-2 py-[2px] text-xs font-medium)

“Enrollment Open” toggle in Cohort should show a visually distinct “open” vs “closed” state using your chosen accent logic (ex: green / amber / warning glow). You decide exact colors, just keep it readable and consistent.

🧱 Step 1 — Create Models
In prisma/schema.prisma, define/update models:

Branch
(id, tenantId, name, code?, address?, phone?, status: ACTIVE|INACTIVE, createdAt, updatedAt)
@@unique([tenantId, name])

AcademicYear
(id, tenantId, name, code, startDate, endDate, state: PLANNED|IN_SESSION|COMPLETED|ARCHIVED, createdAt, updatedAt)
Derived isCurrent = startDate ≤ today ≤ endDate
Cannot hard-delete if Cohorts exist.

Stream
(id, tenantId, name unique per tenant, note?)
Cannot delete if Classes exist.

Class
(id, tenantId, name unique per tenant, alias?, order unique per tenant, streamId?)
Cannot delete if Cohorts or SectionTemplates exist.
Sort ASC by order.

Cohort
(id, tenantId, yearId, classId, branchId, name, status: PLANNED|RUNNING|FINISHED|ARCHIVED, enrollmentOpen:boolean)
@@unique([tenantId, yearId, classId, branchId, name])
Cannot delete if Sections or Enrollments exist.
This is where we know Year + Class + Branch + “2025 Intake”.
UI should show “Open for Enrollment” as a positive/active pill style if enrollmentOpen=true.

SectionTemplate
(id, tenantId, classId, name, capacity>=1, note?)
@@unique([tenantId, classId, name])

Section
(id, tenantId, cohortId, name, capacity, note?)
@@unique([tenantId, cohortId, name])
Cannot delete if students are assigned.

Teacher
(id, tenantId, name, email(unique per tenant), phone?, availabilityJson?)
Eventually ties to auth user, but not in this phase.

Room
(id, tenantId, name, capacity?, status: ACTIVE|INACTIVE)

Routine
(id, tenantId, sectionId, teacherId, roomId, courseId, dayOfWeek, startTime, endTime, createdByUserId, createdAt)
Validation required:

same teacher cannot overlap

same room cannot overlap

same section cannot overlap

After schema edits:
npx prisma generate
npx prisma migrate dev --name academic_setup_init

🧭 Step 2 — Routes & Pages
Create /academic-setup parent under app/(dashboard)/academic-setup.

Each sub-page must:

Use list + form modals (shadcn Dialog) + edit inline + guarded delete

Use server components for data fetch

Use server actions for create/update/delete

Apply RBAC guard (ADMIN only for create/update/delete in this module)

Filter queries by tenantId

Visual style must follow THEME rules (dashboard cards, accent pills, no boring gray)

/academic-setup/branches

Columns: Branch name, Code, Status pill (ACTIVE = “active/ready” style chip, INACTIVE = muted/disabled chip), Phone

“Add Branch” button opens modal (Dialog)

Prevent delete if any Cohort exists for this Branch

The table header row / section header should look like a dashboard tile strip, not a plain gray bar. You choose accent/glow.

/academic-setup/academic-years

Show Year name, code, date range, state (pill), “Current” badge if today is within range.

“Archive” action sets state=ARCHIVED

Delete must be blocked if Cohorts exist; show toast styled with a warning/amber chip feeling (no raw alert)

Include Search bar + pagination

The “Current” badge uses a highlighted pill with an icon/star/emoji. You pick color; just keep consistent everywhere.

/academic-setup/streams

Simple CRUD list of department/stream

If Stream has Classes, show lock icon on delete with tooltip “Used in Classes”

Use accent chips to show state / lock info

/academic-setup/classes

Table columns: Name, Alias, Stream, Order (↑ sorted)

“Add Class” form includes Stream select

Deleting a Class that has Cohorts/SectionTemplates should show a warning chip like “In Use”

Order changes should immediately reorder list on save

Add a subtle “Promotion path = order+1” badge / progress-style accent to keep the gamified learning path vibe

/academic-setup/cohorts

Columns: Cohort Name, AcademicYear, Class, Branch, Status pill (RUNNING, etc.), EnrollmentOpen pill (Open / Closed)

Toggle EnrollmentOpen directly from table row using a switch → visually reflect new state instantly (chip changes)

Filter bar on top: Branch, Academic Year, Class, Status, EnrollmentOpen

Delete guard: block if Sections exist

Page tone should feel “live admin dashboard” (active filters, colorful pills), not dead gray forms

/academic-setup/section-templates

Columns: Class, Template Name, Capacity

“Add Template” modal

Delete allowed because templates affect future cloning only

Show an info chip like “Safe to delete, future only” (style it with soft accent instead of scary red)

/academic-setup/sections

Columns: Section Name, Cohort (with Cohort badge), Capacity

Filter by Branch / AcademicYear / Class / Cohort

Delete guard if students assigned

/academic-setup/routine

Top filter: Branch, Section, DayOfWeek

Table/grid view of schedule slots

Each row: Day, Time Range, Course Title chip, Teacher chip, Room chip

“Add Session” modal fields:

Section (select)

Teacher (select)

Room (select)

Course (select)

DayOfWeek

Start/End

On save:

Validate no teacher/room/section overlap

If conflict, show inline warning chip (e.g. “Conflict: Teacher already booked at this time”), using a high-attention accent. You choose the warning color (amber/red/etc.) but keep contrast clear.

Chips for teacher / room / course should look like distinct badge colors so schedule rows are scannable fast. Color choice is yours.

/academic-setup/year-wizard

Stepper-style card UI with a prominent accent header/title like “Year Wizard”

Form fields:

Academic Year (select)

Branch (select)

Classes[] multiselect

Preview table:

For each class, show “Will create Cohort ‘Class 11 – 2025 Intake’ at Branch Mirpur”

List auto-generated Sections based on SectionTemplates (Example: “Section A (40 seats), Section B (40 seats)”)

Conflict rows (already exists) get a non-error warning chip “Already Exists” (use a softer warning tone, not red fail state)

“Generate Now” button:

Creates the Cohorts + Sections transactionally where missing

Skips conflicts (not an error)

Toast success message with celebratory / playful tone (can include 🎉 or similar)

VERY IMPORTANT: This screen should feel like onboarding / setup assistant, not a dry admin dump.

/academic-setup/promotions

Show an info card with a lock icon and text:
“Student Promotion is coming soon 🚧. You’ll be able to move Class 10 (2025) → Class 11 (2026), same branch, with one click.”

Any action buttons (Promote Now) should call a server action that returns 501 with toast “Not implemented yet”.

Style this card with a soft accent background and subtle lock/future-state visuals. It should NOT be plain gray and NOT feel broken/404. It should feel like a planned feature teaser.

All pages must:

Be server components for data fetch

Use server actions for create/update/delete

Apply RBAC guard (ADMIN only for create/update/delete here)

Filter queries by tenantId

⏰ Step 3 — Delete Guards & Validation
AcademicYear: block hard delete if Cohorts exist.
Stream: block delete if Classes exist.
Class: block delete if Cohorts or SectionTemplates exist.
Cohort: block delete if any Section exists.
Section: block delete if students assigned (placeholder guard for future student assignment relation).
Routine save validation:

teacher not overlapping

room not overlapping

section not overlapping

If conflict → show inline chip / toast using the warning accent style (not raw browser alert, not plain text). The chip/toast style must follow THEME rules (rounded pill, readable contrast, small text-xs, etc.).

🧠 Step 4 — Testing Checklist
Augment must confirm after implementation:

Branches page loads, create/edit works, list styled with accent chips.

Academic Years page shows a “Current” badge for the active date range.

Classes sorted by order ascending.

Cohorts page allows toggling enrollmentOpen and the visual pill updates instantly.

Year Wizard successfully creates Cohorts + Sections in one transaction and uses a celebratory success toast.

Routine page prevents scheduling conflicts and shows colorful chips per row.

Promotions page responds 501 but still renders a nice locked/future card — not blank / not ugly.

All Prisma operations and UI queries are tenant-scoped.

All server actions use RBAC and Zod validation.

✅ Acceptance Criteria

All /academic-setup/* routes exist and render with the themed dashboard look (light surfaces + energetic accent chips / pills, not dull ERP gray).

Prisma models for Branch, AcademicYear, Stream, Class, Cohort, SectionTemplate, Section, Teacher, Room, Routine exist and migrated.

Delete guards and conflict validation are wired.

Year Wizard + Routine work per description.

Promotions page shows future/gamified style lock state.

No TypeScript or ESLint errors.

Color accents follow your chosen modern gaming / learning dashboard identity. Do NOT force everything to be purple unless you actually decide purple is best.