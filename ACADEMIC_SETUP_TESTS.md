Test scope (কি জিনিস টেস্টের মধ্যে আছে)

Global assumptions (tenant, RBAC, UI style)

Core feature-level test cases, ভাগ করে:

Branches

Academic Years

Streams / Classes

Cohorts

Section Templates

Sections

Year Wizard

Routine / Timetable

Promotions (501 placeholder)

প্রতিটা case-এ থাকবে:

“Given / When / Then” style scenario

Expected UI behavior (badges/chips/toast etc.)

Validation rules

এগুলো তুমি একটা QA doc হিসাবে রাখতে পারো, আবার Augment-কেও দিতে পারো যাতে তারা নিজেই Playwright / Vitest / Cypress টেস্ট লিখতে পারে এই লজিক ধরে।

চল শুরু করি 👇

────────────────
0. TEST SCOPE
────────────────
Academic Setup module covers:

/academic-setup/branches

/academic-setup/academic-years

/academic-setup/streams

/academic-setup/classes

/academic-setup/cohorts

/academic-setup/section-templates

/academic-setup/sections

/academic-setup/year-wizard

/academic-setup/routine

/academic-setup/promotions

Everything must:

Be tenant-scoped (tenantId)

Enforce RBAC (only ADMIN can create / edit / delete)

Respect delete guards (no destructive remove if downstream data exists)

Follow “UI Theme & Gamification Accent” rules:

gradient headers

pill badges (bg-emerald-50 text-emerald-700 etc.)

soft halo cards

CTA gradients (violet → pink → orange)

────────────────

GLOBAL / CROSS-CUTTING TESTS
────────────────

1.1 Tenant isolation

Given: Tenant A and Tenant B both exist
And: each has its own Branch entries
When: Admin of Tenant A opens /academic-setup/branches
Then: Only Tenant A’s branches are visible
And not Tenant B’s branches
And create/edit forms automatically set tenantId to Tenant A

✅ Expected UI:

Table shows only Tenant A rows

No “leakage” in dropdowns (Branch selector elsewhere should not show B’s branches)

1.2 RBAC guard

Given: A user with role TEACHER tries to access /academic-setup/academic-years
When: they attempt POST via server action
Then: Action fails with forbidden (401/403 or toast: “Insufficient permissions”)

✅ Expected UI:

The “Create Year” CTA button is either hidden or disabled for non-ADMIN

Restricted toast should use colored warning chip style (amber)

1.3 Theme Consistency

Given: Admin opens /academic-setup/academic-years
Then:

Page header area has gradient / accent (soft violet→pink background or border accent)

Both left “Add” card and right “Existing list” card have rounded corners, light border, subtle shadow

Status values (In Session, Planned, Archived, etc.) render as rounded-full pills, not plain text

This ensures Augment didn’t silently regress to a drab gray table.

────────────────
2. BRANCHES
────────────────
Route: /academic-setup/branches

2.1 Create valid branch

Given: No branches exist for current tenant
When: Admin clicks “Add Branch” and submits:

Branch Name = "Mirpur Campus"

Code = "MRP"

Phone = "01700000000"

Status = Active
Then:

Row appears in branch list with Name, Code, Status chip (“Active” green pill), Phone

A success toast appears: “Branch created 🎉”

✅ UI expectation:

Success toast uses green/emerald accent

List table header has a light violet-tinted band

2.2 Unique name per tenant

Given: Branch "Mirpur Campus" already exists for tenantId=T1
When: Admin tries to create another branch with same Name under same tenant
Then:

Form shows inline validation error under Name: “Branch name must be unique”

No new row is inserted

But:
When: Another tenant (T2) creates "Mirpur Campus"
Then: It’s allowed (uniqueness is within tenant).

2.3 Delete guard for in-use branch

Given: Branch "Mirpur Campus" is linked to an existing Cohort (branchId FK)
When: Admin tries Delete this branch
Then:

Delete is blocked

Show toast / chip: “Cannot delete. This branch is in use by active Cohorts.”

Branch row remains

✅ Visual requirement:

The toast or inline message must use amber warning style, not silent fail

Button may be disabled in UI or attempt returns guard message via server action

────────────────
3. ACADEMIC YEARS
────────────────
Route: /academic-setup/academic-years

Fields: name, code, startDate, endDate, state [PLANNED | IN_SESSION | COMPLETED | ARCHIVED]
Derived: isCurrent if today is between startDate and endDate

3.1 Create valid academic year

Given: Admin fills

Name: 2025–26

Code: AY-25-26

StartDate: 2025-04-01

EndDate: 2026-03-31

State: PLANNED
When: Click “Create Year”
Then:

New row appears in “Existing Academic Years” list card

State pill shows “Planned” with amber-style badge

Toast: “Academic Year created ✅”

3.2 Validation: End before Start

When: Admin enters StartDate 2025-04-01, EndDate 2025-03-31
Then:

Form should not submit

Show inline field error near EndDate: “End date must be after start date”

No DB insert

3.3 Unique year per tenant

Given: Year with name="2025–26" already exists for this tenant
When: Admin tries to add another with same name
Then: Inline error under Name: “Year already exists.”

3.4 Derived “Current” badge

Given: Today’s date is within StartDate ≤ today ≤ EndDate
Then:

That row should display a tiny badge/pill like:

⭐ In Session
OR

two pills: one for state (“In Session”), one for ⭐ Current

Only one row is marked Current if that’s the only active period

If state in DB is not “IN_SESSION” but date range says it's current, the UI still shows a visual “Current” indicator — because current is derived logic.

3.5 Cannot hard delete if Cohorts exist

Given: AcademicYear A has at least one Cohort referencing it
When: Admin attempts to delete that AcademicYear
Then:

Block deletion

Show amber warning chip/toast: “Cannot delete: Cohorts depend on this year. Archive instead.”

State can still be changed to ARCHIVED

✅ UI expectation:

ARCHIVED years appear visually “dimmed” (gray pill “Archived”) in the list

────────────────
4. STREAMS (DEPARTMENTS)
────────────────
Route: /academic-setup/streams

4.1 Create new stream

When: Admin creates Stream:

name="Science"

note="Science discipline"
Then:

Appears in list immediately

Name is unique per tenant (trying “Science” twice shows error)

4.2 Delete unused stream

Given: Stream “Vocational” has no Classes linked
When: Delete
Then: Row disappears, success toast “Stream removed”

4.3 Delete stream that has classes

Given: Stream “Science” is linked to classes
When: Attempt Delete
Then:

Deletion blocked

Show tooltip or toast “Cannot delete — classes depend on this stream”

Row stays

✅ Visual nuance:

The delete icon/button for in-use streams can be disabled with a small lock icon in muted gray

────────────────
5. CLASSES / GRADES
────────────────
Route: /academic-setup/classes

Each Class: {name, alias?, order, streamId?}

5.1 Sorted by order ASC

Given: Classes exist:

Class 8 (order=8)

Class 11 (order=11)

Class 10 (order=10)
Then:

UI list shows: Class 8 → Class 10 → Class 11 (ascending by order)

Not creation order

5.2 Create class with duplicate order

When: Admin tries:

name="Class 10"

order=10
and another class already uses order=10 for this tenant
Then:

Inline error on order: “Order must be unique”

No insert

5.3 Change order and re-sort

When: Admin edits Class 11 and sets order=9
Then:

Save succeeds

UI re-sorts so that Class 11 now appears up in the list

Toast: “Class updated”

5.4 Delete guard with dependencies

Given: Class 11 already has Cohorts or SectionTemplates
When: Admin tries delete
Then:

Block with amber warning “Cannot delete Class 11 — it's already in use”

Row persists

────────────────
6. COHORTS
────────────────
Route: /academic-setup/cohorts

Cohort = {yearId, classId, branchId, name, status, enrollmentOpen}

6.1 Create planned cohort

Given:

AcademicYear = 2025–26

Class = Class 11

Branch = Mirpur
When: Create Cohort with:

name: "Class 11 – 2025 Intake"

status: PLANNED

enrollmentOpen: false
Then:

Row shows:

Cohort Name

Year “2025–26”

Class “Class 11”

Branch “Mirpur”

Status pill “Planned” (amber)

EnrollmentOpen pill “Closed”

Toast success: “Cohort created 🎉”

6.2 Unique per (yearId,classId,branchId,name)

Given: A cohort with same combination already exists in this tenant
When: Admin tries to create duplicate
Then:

Form should show error: “A cohort with this name already exists for this Year / Class / Branch”

6.3 Toggle enrollmentOpen

When: Admin flips a switch in the table row
Then:

enrollmentOpen=true should immediately render pill “Open” in green (e.g. bg-emerald-50 text-emerald-700)

The change persists after reload

No full page reload required (server action -> optimistic rerender ok)

6.4 Delete guard if Sections exist

Given: Cohort has at least one Section under it
When: Delete is attempted
Then:

Deletion blocked

Amber toast: “Cannot delete — Sections exist. Archive instead.”

────────────────
7. SECTION TEMPLATES
────────────────
Route: /academic-setup/section-templates

Template = per Class, reusable seat config

7.1 Create template

When: Admin adds:

Class: Class 11

Template Name: "A"

Capacity: 40
Then:

Appears in list

Shows "Class 11" and "A (40 seats)"

Toast “Template created”

7.2 Duplicate template in same class

When: Another "A" for Class 11 is attempted
Then:

Error: “Section template with this name already exists for this class”

No insert

7.3 Delete template

When: Admin deletes a template
Then:

Row removed

Toast: “Template deleted. Existing sections are not affected.”

This wording is important, matches your rule that templates only affect future clones

────────────────
8. SECTIONS
────────────────
Route: /academic-setup/sections

Section = {cohortId, name, capacity, note?}

8.1 Create section under cohort

When: Admin picks Cohort "Class 11 – 2025 Intake (Mirpur)"
and submits:

name="Science-B"

capacity=40
Then:

Appears in list with Capacity 40

Cohort badge visible (Cohort name chip)

8.2 Unique per cohort

When: Admin tries to add another Section with same name "Science-B" under the SAME cohort
Then:

Error: “This section name is already used in this cohort”

8.3 Large capacity allowed

When: Admin sets capacity=1000
Then:

Save allowed (unless business rule forbids)

Maybe show soft warning chip “High capacity” (optional, UI nice-to-have)

8.4 Delete guard if students assigned

Given: Section has students assigned (later from StudentPlacement)
When: Admin tries Delete Section
Then:

Deletion fails

Amber toast: “Cannot delete — students assigned to this section”

────────────────
9. YEAR WIZARD
────────────────
Route: /academic-setup/year-wizard

Wizard inputs:

AcademicYear

Branch

Classes[] (multi-select)
Wizard output:

Will generate Cohorts for each (Year x Class x Branch)

And clone default Sections from SectionTemplates

9.1 Preview generation

Given:

There is Year=2025–26

Branch=Mirpur

Class 10 has templates A(45)

Class 11 has templates A(40), B(40)
When: Admin selects:

Year: 2025–26

Branch: Mirpur

Classes: [Class 10, Class 11]
Then:

Preview table shows:

"Will create Cohort 'Class 10 – 2025 Intake' with Sections: A(45)"

"Will create Cohort 'Class 11 – 2025 Intake' with Sections: A(40),B(40)"

Rows that ALREADY exist should have an amber pill “Already exists” instead of green

✅ Visual requirement:

Preview rows should use pill badges and tinted backgrounds (violet-50, amber-50, etc.) for gamified dashboard feel, not raw text.

9.2 Commit generation

When: Admin clicks “Generate Now”
Then:

New Cohorts and their Sections are created in one atomic transaction

Conflicting Cohorts/Sections are skipped, not partially duplicated

Toast: “Cohorts & Sections created 🎉”

9.3 Transaction safety

If DB error occurs mid-generation
Then: No partial cohorts/sections should remain half-created
(atomic behavior: all-or-nothing per run)

────────────────
10. ROUTINE / TIMETABLE
────────────────
Route: /academic-setup/routine

Routine = class schedule, constraints:

A teacher cannot teach two places at same overlapping time

A room cannot be double-booked

A section cannot be double-scheduled same slot

10.1 Add routine slot success

Given:

Section = “Class 11 – 2025 Intake / Science-B”

Teacher = “Dr. Sarah”

Room = “Room 202”

DayOfWeek = "Mon"

StartTime = 10:00

EndTime = 11:00
When: Admin saves
Then:

Entry appears in timetable list/grid

Each row cell shows:

Day "Mon"

Time "10:00–11:00"

Colored chips for Course, Teacher, Room (purple/teal/blue chips)

Toast: “Session added”

10.2 Teacher conflict

Given:

Teacher “Dr. Sarah” already scheduled Mon 10:00–11:00 with Section A
When:

Admin tries to add Mon 10:00–11:00 for Teacher “Dr. Sarah” but with Section B
Then:

Save is blocked

Error banner / toast shows amber or red chip:
“Conflict: Teacher already booked at this time”

No new Routine row is created

10.3 Room conflict

Similar logic:
Room 202 already booked 11:00–12:00 for Section A
Trying to book same Room 202 for 11:30–12:00 Section B → should block (overlap detection counts)

10.4 Section conflict

If same Section is booked in two different rooms same time → block too.

10.5 Filter panel

When: Admin selects Branch=Mirpur and DayOfWeek=Mon in the routine view
Then:

Only sessions for that Branch + day show

No other branch sessions leak (tenant + branch filter combined)

────────────────
11. PROMOTIONS (PLACEHOLDER)
────────────────
Route: /academic-setup/promotions

11.1 Page renders “Coming Soon”

When: Admin opens Promotions page
Then:

The page shows a card like:
“🚧 Student Promotion is coming soon. You’ll be able to move Class 10 → Class 11 in one click.”

There should be a disabled or dummy “Promote Now” button

11.2 Server action returns 501

When: Admin clicks the placeholder action (e.g. “Check Eligible Students”)
Then:

The server action responds with 501

Toast shows: “Not implemented yet”

UI remains functional, no crash

✅ Visual requirement:

The card itself should follow theme: soft gradient / border-violet-200 / subtle icon / rounded-xl

Not a boring plain div

────────────────
12. REGRESSION / VISUAL CHECK
────────────────

12.1 Gradient theming applied

For each Academic Setup page:

Page headline (e.g. “Academic Years”) should include colored icon or emoji (📅 🏫 etc.)

Background / header zone uses the soft violet→pink wash OR at least a violet accent border/top bar

Primary CTA buttons use violet→pink→orange gradient

If any page reverts to flat gray table with Bootstrap-ish vibes → ❌ that’s a regression.

12.2 Pill chips for status everywhere

“In Session”, “Planned”, “Completed”, “Active”, “Inactive”, “Open”, “Closed”, “Already exists”, “Conflict”…
All of these must be shown as rounded-full colored chips, not plain text or raw booleans.

Why test this?
Because this is part of your product identity (gamified LMS admin). It’s not cosmetics only — এটা তুমি SaaS বিক্রি করবে বলে এটিই তোমার signature.

────────────────
13. SUMMARY FOR QA / AUGMENT
────────────────

সব create/update/delete action:

must respect RBAC (ADMIN only modify)

must set and filter by tenantId

must use server actions (no client-side fetch leaks)

must validate Zod schemas before DB write

All delete attempts that violate guard rules MUST return a friendly toast with amber pill style, not a raw crash.

Year Wizard and Routine MUST behave transactionally / conflict-aware so no half-broken data state তৈরি না হয়।

Visual tone (gradient headers, pill badges, emojis, celebratory toasts) is NOT optional. এটা “product feel” part, তাই regression মানে bug.