# 👨‍🎓 Student Management Module – Implementation Plan

**Project:** LMS (Learning Management System)
**Module:** Student Management (Journey + Student List)
**Date:** 2025-11-19
**Status:** 📋 PLANNING PHASE

---

## 📋 Table of Contents

1. Overview & Goals
2. End‑to‑End Student Journey
3. Data Model & Existing Modules
4. `/students` List Screen – Desktop Design
5. Responsive / Mobile Behaviour
6. Bulk Actions & Row Actions
7. Phase‑wise Implementation Plan
8. Testing & Acceptance Checklist

---

## 1️⃣ Overview & Goals

**Goal:** Student Management module e **lead → admission → enrollment → in‑session → promotion / exit** full journey support kora, and `/students` page ke powerful "Student 360 list" banানো.

**Key outcomes:**

- Admin ra **fast filter + search** diye correct student khuje pabe.
- Academic Setup (Branch, AcademicYear, Class, Cohort, Section) + `StudentEnrollment` data ekta table‑e visible.
- Desktop e rich table, mobile e compact card view – kon field kothay thakbe clear definition.
- Future features: risk score, communication shortcuts, segments.

---

## 2️⃣ End‑to‑End Student Journey (High Level)

Full journey other docs sathe aligned thakbe (📄 `STUDENT_ENROLLMENT_DESIGN.md`, `ACADEMIC_YEAR_AND_ENROLLMENT_ARCHITECTURE.md`). Ei plan only high‑level outline dibe jeno UI/filters design korte pari.

1. **Pre‑Admission / Lead (future phase)**
   - Lead create: name, guardian, phone, preferred branch/year/class.
   - Status: `NEW → CONTACTED → FOLLOW_UP → CONVERTED / LOST`.
2. **Application Stage**
   - Application form: personal info, guardian info, previous school, desired program.
   - Status: `SUBMITTED → UNDER_REVIEW → SHORTLISTED → REJECTED`.
3. **Admission Confirmation**
   - Admission decision + fee invoice.
   - `Student` + `User` record create, optional auto `studentId` (STU‑YYYY‑NNN).
   - Initial `StudentEnrollment` create (branch/year/class/stream/cohort/section based on mode).
4. **In‑Session Lifecycle**
   - Daily attendance, quizzes/exams, course enrollments, fee tracking.
   - Device + login activity (from auth logs) – later used in list as chips.
   - Status transitions: `ACTIVE ↔ INACTIVE`, temporary leave etc.
5. **Completion / Exit**
   - Promotion: new `StudentEnrollment` for next academic year (Promotion module).
   - Terminal classes: mark `GRADUATED`.
   - Transfer / dropout: `TRANSFERRED` / `DROPPED` with reason; history preserved.

**Student List view target:** je kono time e ek line e "ei student ekhon koi porjonto journey te ase" short summary dekhano.

---

## 3️⃣ Data Model & Existing Modules

Already existing Prisma models use korte hobe (no duplicate):

- `Student` – core identity, personal info, `status: StudentStatus`.
- `Guardian` – primary/secondary guardians.
- `StudentEnrollment` – academic placement (branch/year/class/stream/cohort/section, enrollmentType, status).
- `CourseEnrollment` – online course level enrollments.
- Academic Setup: `Branch`, `AcademicYear`, `Class`, `Cohort`, `Section`, `Stream`.

**Rule:** `/students` list er sob query **tenantId filtered** hobe, and default view **current AcademicYear** er active enrollments show korbe (filter change kore past years dekhano jabe).

Existing implementation:

- Route: `app/(dashboard)/students/page.tsx`
- Client table: `StudentsClient` (simple columns: Name, Email, Phone, Class, Section, Status).
  Ei plan e ei table ke upgrade korar detailed spec dিচ্ছি.

---

## 4️⃣ `/students` List Screen – Desktop Design

### 4.1 Top Filters & Search

**Route:** `/students` (ADMIN only, RBAC guard already present).
**Data fetch:** server component theke Prisma `student` + latest/current `StudentEnrollment` include kore.

**Primary filter controls (top bar):**

- Branch (SearchableDropdown)
- Academic Year
- Class
- Section
- Cohort / Intake (optional chip/tab)
- Enrollment Type: Cohort / Direct / Online
- Student Status (`ACTIVE/INACTIVE/GRADUATED/TRANSFERRED/DROPPED`)
- Enrollment Status (`ACTIVE/INACTIVE` from StudentEnrollment)
- Fee Status (from finance module – Phase 2)
- Search box: name, studentId, phone, guardian phone, email.

### 4.2 Table Columns (Desktop, ≥1024px)

Each row ekjon student er mini‑summary. Column priority left→right:

1. **Identity**
   - Avatar + Name (click → Student Profile `/students/[id]`).
   - Sub‑text: `studentId` (e.g., STU‑2025‑001).
2. **Academic Placement**
   - Column: `Class • Section` (e.g., `Class 9 • A`).
   - Hover / sub‑line: Cohort name (e.g., `2025 Intake – Mirpur`).
3. **Branch**
   - Branch short name; hide if single branch tenant (config later).
4. **Contact**
   - Primary phone (CopyablePhone) + optional email icon.
   - Tooltip/secondary line: Guardian phone if different.
5. **Guardian**
   - Guardian name + relationship (e.g., `Md. Rahim (Father)`).
6. **Enrollment & Student Status**
   - Two chips:
     - **Student Status chip** from `Student.status` (ACTIVE, INACTIVE, GRADUATED…).
     - **Enrollment chip** from `StudentEnrollment.status` (`Enrolled`, `On Leave`, `Transferred`, `Online` etc; label mapping needed).
   - Gamified style: rounded‑full pill, color‑coded.
7. **Fee Status (Phase 2)**
   - Chip: `Clear`, `Due`, `Overdue`.
8. **Login / Active Device (Phase 2)**
   - Column label: **Active Device**.
   - Chip examples: `Single (1/1)`, `Multiple (2/3)`, `Unlimited`, `Disabled`.
   - Secondary text (muted): last login relative time (e.g., `Last login 2d ago`).
   - Clicking the chip or a `Manage Devices` row action opens the **Active Device** modal (see 4.3).
9. **View Courses**
   - Button: `View Enrolled` → course enrollment page for that student.
10. **Actions**

- Icon buttons or kebab: View Profile, Edit, **Enroll in Courses**, Payment, Attendance, Manage Devices (optional shortcut), Delete (AlertDialog).
- `Enroll in Courses` opens the **Course Enrollment** modal (see 4.5) for that student.
- `Payment` opens the **Payment History & Fee Actions** modal (see 4.4).

### 4.3 Active Device Modal – Per‑Student Device Control (Phase 2)

**Goal:** per‑student basis e LMS access er **device limit** securely control kora, consistent with the LMS dashboard theme and security standards.

**Trigger:**

- Click on the `Active Device` chip in the table, **or**
- Use row action `Manage Devices`.

**Modal layout (desktop):**

- Title: `Active Device – {Student Name}`.
- Section 1 – **Device Access Mode** (radio/segmented buttons):
  - `Single Device` – at a time **1 active device** allowed; new login → old device session expire.
  - `Multiple Devices` – allow fixed number of devices; show numeric input `Number of devices`.
  - `Unlimited Device` – no limit; use only for trusted accounts / debugging.
- Section 2 – **Number of Devices** (only when `Multiple Devices` selected):
  - Numeric input (min 1, max e.g. 10) with helper text: `How many devices can this student use at the same time?`.
- Section 3 – **Active Devices List**:
  - Columns: `Device name` (derived from browser/OS), `Device ID` (hashed fingerprint), `Last active`, `Location/IP (optional)`, `Action`.
  - Each row has `Delete` button → immediately revoke that device (next request → forced re‑login).
- Bottom info panel (amber background): short warning that deleting a device or lowering limits can sign the student out from some devices.

**Data & behaviour notes (high‑level):**

- Policy fields will live on `User`/**or** `Student` (see `DEVICE_SECURITY_AND_ACTIVE_DEVICE_IMPLEMENTATION.md` for full design details):
  - `deviceAccessMode`: `SINGLE` | `MULTIPLE` | `UNLIMITED`.
  - `deviceLimit`: number (only for `MULTIPLE`).
- Devices table backed by `UserDevice`/**StudentDevice** model (tenant‑scoped) that stores a **hashed device fingerprint**, derived device name, user agent and IP/geo metadata (no paid service; simple in‑house parsing).
- Enforcement rules (runtime):
  - **Single:** new login → keep newest device, invalidate others (server‑side session store checks fingerprint).
  - **Multiple:** if active device count ≥ limit, login API should reject with friendly error until admin removes a device or raises limit.
  - **Unlimited:** skip limit check, only log for analytics.
- All queries and mutations must respect `tenantId` and RBAC (`ADMIN` only from admin UI). Sensitive identifiers (fingerprints, IPs) must never be exposed in raw form on the client; only **hashed IDs + human‑readable device names** are shown.

**Responsive behaviour:**

- On mobile, modal becomes full‑screen sheet; device table collapses into stacked list (Device ID + last active + Delete button).

**Important:** table header row & all status/device chips must follow global theme: light surfaces + high‑contrast accent chips (no dull grey ERP look).

### 4.4 Payment History & Fee Actions (Row Menu)

**Goal:** ek jaygay theke kono student-er **all invoices + payment status** dekhano, and quick action diye fee receive/verify kora.

**Trigger:**

- Row actions menu theke `Payment` select korle.
- (Optional Phase 2) `Fee Status` chip click করলেও same panel open korte deya jabe.

**Layout (desktop):**

- Large centered modal / drawer with:

  - **Header:** Student name + studentId + small badge `Current Class • Section`.
  - **Summary strip (top cards):**
    - `Total Paid` amount card.
    - `Total Due` amount card.
  - **Toolbar (right side):**
    - `Print` button – current table view printable version.
    - `Delete` / `Void` invoice action (guarded; disabled if payment exists or restricted by finance rules).

- **Payment History table:** per row one invoice/fee item.
  - Columns (initial):
    - `#` (Invoice number / short id)
    - `Invoice Title` (e.g., Monthly fee, Admission fee)
    - `Payable` (total amount)
    - `Paid` (amount already received)
    - `Due` (remaining)
    - `Status` (chip + inline action links)
    - `Payment Method` (Cash, Card, Mobile Wallet, Bank, etc.)
    - `Date Issued`
    - `Due Date`
    - `Action` (kebab for future finance actions)
  - Pagination bottom bar: page numbers, `Previous`/`Next`, and a `Show all` link (optional) for power users.

**Status + inline actions behaviour:**

- When `Status = Unpaid`:
  - Show red/muted chip `Unpaid`.
  - Underneath, small primary link `Pay Now` → opens **Pay Now** modal.
- When `Status = Partial` (some paid, some due):
  - Chip `Partial` with warning/amber style.
  - Link `Pay Now` still available (applies to remaining due).
- When `Status = Paid`:
  - Green chip `Paid`.
  - Optional link `Receipt` (future phase – open receipt/print view).
- When `Status = Pending Verification` (online/mobile payment submitted but not approved):
  - Chip `Pending` or `Verify`.
  - Link `Verify Now` → opens **Payment Verify** modal.

**Pay Now modal (record payment):**

- Title: `Record Payment` (or `Pay Now`).
- Fields (follow global form standards – Zod + RHF + char limits):
  - `Amount` – numeric, prefilled with remaining due, editable but cannot exceed due.
  - `Mobile Number` / `Payer Contact` – string, max 20 chars.
  - `Note` – optional, max 500 chars (e.g., remarks about payment opportunity).
- Single primary submit button (e.g., `Confirm Payment`); closing handled by X/overlay (no separate Cancel button, consistent with global pattern).
- On submit:
  - Creates a payment record linked to the invoice (exact schema in finance module).
  - Updates invoice `Paid` + `Due` amounts and `Status` (`Unpaid` → `Partial`/`Paid`).
  - Updates header `Total Paid` / `Total Due` cards.

**Payment Verify modal (approve transaction):**

- Used when student/guardian already paid via mobile wallet/bank and staff needs to verify.
- Title: `Verify Payment`.
- Fields:
  - `Amount` – default from invoice or reported amount.
  - `Transaction ID` / `Reference` – string, max 50 chars.
  - `Note` – optional verification note (max 500 chars).
- Primary button: `Approve & Mark as Paid`.
- Secondary destructive action (link/button) inside modal: `Mark as Failed` or `Discard` to close without changes.
- On approve:
  - Marks invoice as `Paid` (or `Partial` if amount < payable).
  - Stores transaction id + note in payment record.
  - Refreshes Payment History table and summary.

**Permissions & data rules:**

- All data in this modal comes from the central **Invoice/Fee** models (finance module), always filtered by `tenantId` and `studentId`.
- Only `ADMIN` (and later finance roles) can open this modal from `/students` and perform payment actions.
- Actual money movement (gateway integration) will be configured under `/settings/payment`; this modal focuses on **recording and verifying** payments against invoices.

### 4.5 Course Enrollment – Suggested Courses (Row Menu)

**Goal:** `/students` page theke direct ekta modal diye specific student‑ke **one or more courses‑e enroll** kora, jekhane:

- Academic Setup (Branch, Academic Year, Class, Section) onujai **suggested course list** dekhabe.
- Per‑course level‑e discount apply kora jabe, plus ekta **overall discount** o thakbe.
- Course‑er payment settings (one‑time vs subscription/monthly) respect kore **auto invoice / monthly billing** trigger hobe.

**Trigger:**

- Row actions menu theke `Enroll in Courses` / `Enrollment` click korle ei modal open hobe.
- Future phase e same modal `View Courses` screen theke o reuse kora jabe (pre‑selected student diye).

**Data dependencies (read‑only):**

- **Academic Setup:** current `StudentEnrollment` theke:
  - `branch`, `academicYear`, `class`, `cohort`, `section`.
- **Course Management:**
  - `Course` (status = `PUBLISHED`), `CourseCategory`, `paymentType`, `regularPrice`/`offerPrice`, `autoGenerateInvoice`, subscription fields (`subscriptionType`, `subscriptionDuration`).
- **Finance:**
  - Invoice / billing engine (one‑time invoice + monthly/recurring plan), already defined in finance/course docs.

**Layout (desktop):**

- Large centered modal / drawer, esports‑style header:
  - Title: `Enroll in Courses – {Student Name}`.
  - Sub‑line (muted): `Branch • Class • Section • Academic Year` chips.
- **Top search & filters bar:**
  - Left side:
    - `Type to search` input – course title / code search (debounced).
    - `Course Category` dropdown (SearchableDropdown from CourseCategory list).
  - Right side:
    - `Starting From` date/time picker (default = today, required).
    - `Enrollment Duration` segmented control:
      - `Unlimited` – no end date; `expiresAt = null` on `CourseEnrollment`.
      - `Fixed Time` – show `Ends On` date picker → maps to `expiresAt`.
- All dropdowns (Branch override, Category, etc.) must use **SearchableDropdown** / **MultiSelectDropdown** per global standard (no raw `<Select>`).

**Suggested courses panel:**

- Under filters, ekta two‑tab style view:
  - Tab 1: `Suggested` – default active.
  - Tab 2: `All courses`.
- **Suggested logic (high‑level):** backend e simple rules:
  - Same `branch` + `class` + (optional) `stream/subject` tagged courses first.
  - `PUBLISHED` + `status != ARCHIVED` courses only.
  - Inside tab, results ordered by `isFeatured` desc, then `regularPrice`/`offerPrice`, then title.
- Tab switch korleo same layout/table use hobe; sudhu filter set change hobe.

**Course selection & pricing table:**

- Section title: `Select Courses`.
- Multi‑select behaviour:
  - Left side ekta `Courses` MultiSelectDropdown (for quick selection by name).
  - Niche ekta table jeikhane **selected courses** show hobe (one row per selected course):
    - `Course Name` (with small chip: `One-time` / `Subscription` / `Free`).
    - `Category` (short name).
    - `Payment Type` (`ONE_TIME`, `SUBSCRIPTION`, `FREE`) – pill badge.
    - `Base Price` – `offerPrice || regularPrice || 0` (read‑only).
    - `Per‑course Discount` inputs:
      - Small select: `৳` (amount) / `%` (percentage).
      - Numeric input `discountValue` (>=0, client+server guard: final price cannot be negative or exceed 999999).
    - `Final Price` – computed: `basePrice - discountAmount` (or `%` calc); read‑only.
- If kono course `FREE`, tahole `Base Price = 0` and discount fields disabled; `Final Price` 0.
- If student already enrolled in a selected course:
  - Row e amber chip `Already enrolled`; checkbox/discount fields disabled; server validation o same behaviour follow korbe.

**Overall discount & summary panel:**

- Modal bottom‑right e ekta summary card (light surface + strong accent border):
  - `Subtotal` – sum of all `Final Price` (per‑course discount calculate kore).
  - `Overall Discount` (optional):
    - Same pattern: select `৳` / `%` + numeric value (>=0, subtotal er beshi na).
  - `Grand Total` – `Subtotal - overallDiscount`.
  - (Optional, info line) `Monthly billing estimate`:
    - Jodi kono selected course‑er `paymentType = SUBSCRIPTION` and `subscriptionType = MONTHLY`, tahole ekta small text: `Estimated monthly: ৳X,XXX`.
- Summary card e small note: `Exact invoice schedule course payment settings onujai finance engine handle korbe`.

**Extra fields:**

- Optional `Note` textarea (max 500 chars) – enrollment related remark (e.g., scholarship reason, special discount justification).
- Future placeholder toggle: `Mark as scholarship` / `Internal enrollment` etc. (just documented as idea; not required in first implementation).

**Submit behaviour & backend flow:**

- Primary button (bottom left or full width on mobile): `Enroll Student in Courses`.
- On submit:
  - Client‑side validation (React Hook Form + Zod):
    - At least 1 course selected and not fully `Already enrolled`.
    - All discount fields numeric and within bounds.
    - `Starting From` date required; if `Fixed Time`, `Ends On` must be after start.
  - Server action (e.g., `enrollStudentInCourses`) pattern:
    - `await requireRole(["ADMIN", "TEACHER"])` (exact roles later finalize).
    - `const tenantId = await getTenantId()`.
    - Zod schema re‑validate: courseIds[], per‑course discount payload, overall discount, start/end dates, note.
    - For each selected course (inside single transaction per student request):
      - Check `Course` exists for `tenantId` and is `PUBLISHED`.
      - Prevent duplicate by checking existing `CourseEnrollment` (`@@unique([tenantId, courseId, studentId])`).
      - Compute **final enrollment price** after per‑course + overall discount split (implementation detail in finance docs; here only requirement is total not negative).
      - Create `CourseEnrollment` row with `enrolledAt = startDate`, `expiresAt` (if fixed), `status = ACTIVE`.
      - Trigger existing **enrollment + invoice hook** (from Course Management plan) so that:
        - `paymentType = ONE_TIME` → one invoice (or none if FREE) respecting `autoGenerateInvoice`.
        - `paymentType = SUBSCRIPTION` + `subscriptionType = MONTHLY` (or others) → finance module creates monthly/periodic invoice schedule starting from `startDate`.
    - On success: revalidate `/students` and relevant course pages.
- Response handling:
  - Success toast (playful tone): `Enrolled in {N} course(s) for {Student Name} 🎉` with `Grand Total` in subtitle.
  - If partial failure (some courses already enrolled), show warning list of skipped courses with `Already enrolled` reason.

**Responsive behaviour:**

- Mobile e modal full‑screen sheet hobe:
  - Filters collapses into accordion (`Filters`, `Selected Courses`, `Summary` sections).
  - Course table small stacked cards (Course name + base price + discount inputs + final price + chips).
  - Primary CTA bottom sticky bar e.

**Permissions & security:**

- Only `ADMIN` (and future approved roles) row menu theke ei modal open korte parbe.
- Server side e sob queries/mutations must:
  - Filter by `tenantId` (multi‑tenant safety).
  - Respect RBAC (no student‑side enrollment through ei modal).
  - Validate discounts so that **no invoice/enrollment negative amount** create na hoy.

---

## 5️⃣ Responsive / Mobile Behaviour

Mobile (<768px) e full table horizontal scroll avoid kore **stacked card layout** use korte hobe.

### 5.1 Mobile Card Layout

Per student card:

- **Line 1:** Avatar + **Name**; right side chip: `Class • Section`.
- **Line 2:** `studentId` + Cohort short label (`2025 Intake`).
- **Line 3 (chips row):** Student Status chip + Enrollment Status chip + (optional) Fee Status chip.
- **Footer:** Phone icon + primary contact number; chevron or `…` button for actions.

### 5.2 Which Columns Hide on Mobile

**Visible on mobile main card:** Name, photo, studentId, Class & Section, Cohort badge, primary contact number, Student + Enrollment status chips.
**Hidden / moved to detail sheet:** Branch, Guardian name, Guardian phone, Fee Status amount details, Login/Device info, View Courses button, Created/Admission date, any extra codes.

Implementation hint:

- `lg` breakpoint: full table (all columns).
- `md` breakpoint: compress columns (merge Branch into Cohort tooltip, hide View Courses column).
- `<md`: switch to custom card list component instead of `<Table>`; reuse same data shape.

---

## 6️⃣ Bulk Actions & Row Actions

**Bulk selection:** checkbox column; when rows selected, bottom sticky bar show `X students selected` + allowed bulk actions. Initial set:

- Send SMS/Email/WhatsApp (integration later).
- Change Student Status (Active ↔ Inactive).
- Change Section (reassign selected students to another section – guarded by capacity).
- Export to CSV.

**Row actions (per student):**

- **Primary:** `View Profile`, `Edit`, `Enroll in Courses`, `Payment`, `Attendance`, `View Courses`.
- **Danger:** `Disable Login` / `Enable Login` (Phase 2), `Delete` (existing flow with enrollment warning modal reuse).

---

## 7️⃣ Phase‑wise Implementation Plan

**Sprint 1 – Data & Table Upgrade**

- Refactor `/students` server query to always fetch "current enrollment" (latest `StudentEnrollment` per student for selected AcademicYear).
- Implement filters (Branch, Year, Class, Section, Status) with SearchableDropdown + debounced search.
- Replace existing simple table columns with new desktop columns (Sections 4.1–4.2, without Fee/Login yet).
- Implement responsive behaviour (desktop table + mobile cards).

**Sprint 2 – Student 360 & Actions**

- Enhance `/students/[id]` profile to show full journey (enrollment history timeline, guardian info, contact shortcuts).
- Wire row actions to profile, payments, attendance, courses.
- Implement bulk actions (status change, export).

**Sprint 3 – Analytics, Risk & Device Control (Phase 2)**

- Integrate Fee Status (from finance) + Attendance risk + Course progress to compute simple risk score chip (`Low/Medium/High`).
- Implement `Active Device` column + per‑student device policy modal, wiring to device models + login enforcement hooks (basic version).
- Add saved segments (e.g., "Fee Overdue >30 days", "Low Attendance <75%", "Online students only", "Multiple devices detected").

---

## 8️⃣ Testing & Acceptance Checklist

- [ ] `/students` page loads with filters and pagination (no N+1 queries).
- [ ] Filters correctly combine (Branch + Year + Class + Section + Status).
- [ ] Desktop view shows all defined columns with correct data mapping.
- [ ] `Active Device` column shows correct policy chips and last login text for students where the feature is enabled.
- [ ] `Active Device` modal opens from chip/row action and successfully updates policy + revokes devices (Phase 2).
- [ ] Mobile view switches to card layout without horizontal scroll; correct fields visible/hidden per section 5.2.
- [ ] Row actions navigate to correct pages; delete flow still respects enrollment warning and AlertDialog.
- [ ] All Prisma queries tenant‑scoped; RBAC remains `ADMIN` for mutations.
- [ ] Dark mode looks good with accent chips and headers (no unreadable text).
- [ ] Performance acceptable for 5k+ students (paged, server‑side filters).

**Acceptance:** যখন ei checklist pass করবে, tokhon Student Management list screen **implementation‑ready** ধরা হবে and further analytics features Sprint 3 te add kora jabe.
