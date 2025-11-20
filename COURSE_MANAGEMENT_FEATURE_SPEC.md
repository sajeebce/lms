# 📚 Course Management Module – Feature Specification (Non-Technical)

> Scope: This document summarizes **only the functional features** of the Course Management module.
> It intentionally **avoids database, schema, or implementation details** and focuses on
> pages, user-visible fields, columns, buttons, and behaviours.

---

## 1. High-Level Capabilities

- Admins and instructors can **create, edit, duplicate, publish, and archive courses**.
- Courses can be **single** (standalone) or **bundle** (package of multiple courses).
- Courses are organized into **categories** (e.g., Science, Mathematics, Programming).
- Each course can contain **topics**, **lessons**, and **activities/assessments**.
- Supported lesson types include **YouTube**, **Vimeo**, **local video**, **Google Drive video**, **documents**, **text lessons**, and **iframe embeds**.
- The system integrates with the exam/quiz module for **online exams and practice quizzes**.
- **Student enrollments** are tracked with progress, status, and certificate information.
- **Flexible pricing**: one-time payment, subscription, or free.
- Optional **auto invoice generation** when a student is enrolled in a paid course.
- Support for **SEO & marketing**: featured courses, meta tags, and optional fake enrollment count.

---

## 2. Course Category Management

### 2.1 Category Features

- Create, edit, and delete course categories.
- Each category has:
  - **Name** (e.g., "Science").
  - **Slug** (used for URLs; auto-generated from name but editable).
  - **Description**.
  - **Icon** (emoji or icon library).
  - **Color** (used for UI theming chips/badges).
  - **Order** (for manual sorting among siblings).
  - **Status**: `Active` / `Inactive`.
  - **Parent category** (optional) – supports an **unlimited-depth parent–child tree** of categories; top-level categories have no parent.
- Category list page features:
  - **Collapsible tree / outline view** of categories showing the full parent–child hierarchy with indentation and expand/collapse for parents.
  - Each row shows: name, description, color, icon, status, course count, and parent information (via indentation and optional "Parent: X › Y" text).
  - Sibling categories are sorted by their `order` field (then by name); manual reordering via drag-and-drop is **not** required in this phase.
  - **Color picker** for changing category color.
  - **Icon selector** for choosing an icon.
  - **Create / Edit** category modal (includes parent category selector).
  - **Delete** with guard:
    - If category is used by courses, show warning: _"This category has X courses. Please reassign or delete them first."_
    - If category has subcategories, show warning: _"This category has X subcategories. Please reassign or delete them first."_

### 2.2 Testing/UX Notes

- Dark mode support for the whole page.
- Categories respect the global dashboard visual style (chips, badges, modern table).
- Hierarchical categories (parent/child) are displayed with clear context (e.g., indentation or "Parent: X" chips) while still feeling like a modern dashboard list.
- All buttons in this module (primary, secondary, ghost) must use the tenant theme colors from the global design system (e.g. theme accent variables), not hard-coded hex values per screen.

---

## 3. Course Creation & Editing

### 3.1 Course Type Selection Page

- Page heading: **"Choose Course Type"**.
- Two main cards:
  - **Single Course** card
    - Short description text.
    - Primary button: **"+ Add Single Course"**.
  - **Bundle Course** card
    - Short description text.
    - Primary button: **"+ Add Bundle Course"**.

### 3.2 Single Course Form (Create/Edit)

> The single course form is organized into multiple tabs (6 sections). Below are the feature-level fields available to the user.

- **Basic information**
  - Field: **Title** (course name).
  - Field: **Slug** (auto-generated from title; editable if needed).
  - Field: **Short description** – summary shown in lists/cards, using the **same rich text editor component used in the Question Bank** (lightweight formatting + image support).
  - Field: **Full description** – detailed syllabus/marketing copy using the **Question Bank rich text editor** with the **Insert Image** dialog (tabs: `Upload`, `Server Files`, `Recent`, `URL`).
- **Category & type**
  - Field: **Category** (dropdown of course categories).
  - Field: **Course type** – `Single` or `Bundle` (determined by route but still part of the conceptual model).
- **Author & instructor**
  - Field: **Author name** (display text on course cards).
  - Field: **Instructor** (linked teacher/user selector backed by the `Teacher` model from Academic Setup).
- **Academic integration (optional)**
  - Fields: **Class**, **Stream**, **Subject** – all optional dropdowns backed by Academic Setup / Question Bank (`Class`, `Stream`, `Subject` models) using the global `SearchableDropdown` pattern.
  - Behaviour: linking a course to Class/Stream/Subject does **not** auto-enroll or auto-invoice any students. These fields are used for academic tagging, filters, and “recommended for your class” sections only.
  - Example display: course cards can show small chips like `Class 8 · Science · Mathematics` so admins, teachers, and students instantly see which academic track the course targets.
- **Pricing & payment**
  - Field: **Payment type** – `One-time`, `Subscription`, or `Free`.
    - When **Subscription** is selected, extra fields appear:
      - **Subscription duration** (e.g., number of months/days of access, depending on implementation).
      - **Subscription plan type** – `Monthly`, `Quarterly`, `Yearly`, or `Custom`.
  - Field: **Invoice title** (used on generated invoices).
  - Fields: **Regular price** and **Offer price**.
  - Field: **Currency** (default BDT but shown in UI for clarity).
  - Toggle: **Auto-generate invoice on enrollment**.
- **Media**
  - Field: **Featured image** upload using the shared **StorageService**. The image picker supports the same options as the Question Bank editor: `Upload`, `Server Files`, `Recent`, and `URL`.
  - Field: **Intro video URL** (YouTube/Vimeo/local/drive-compatible input).
- **Visibility, status & schedule**
  - Dropdown: **Visibility** – `Public`, `Unlisted`, `Private`, `Internal only`.
    - **Public** – appears in public/student catalog and is reachable via direct URL.
    - **Unlisted** – hidden from catalog/search but accessible via direct URL (good for invite-only campaigns).
    - **Private** – only admins/instructors + already-enrolled students see it; not listed anywhere else.
    - **Internal only** (future) – visible only inside authenticated dashboard, not public site.
  - Dropdown: **Course status** – `Draft`, `Published`, `Archived` (UI may label `Published` as `Live`).
    - **Draft** – never visible to students regardless of visibility/enrollment settings; only admins/instructors can preview.
    - **Published** – course is live and uses the visibility + enrollment rules below.
    - **Archived** – course is read‑only; no new enrollments; existing students may keep read access (configurable in future).
  - Section: **Schedule**
    - Toggle: **Schedule course go‑live**.
    - When ON:
      - Field: **Scheduled date** (separate date picker).
      - Field: **Scheduled time** (separate time picker).
      - Both are required and must be in the future.
      - Field: **Published date/time** is auto‑set when the course actually goes live; for scheduled courses this is `scheduledAt`, for immediate publish it is “now”.
      - Checkbox: **Show “Coming soon” in course list & details page** while `now < scheduledAt`.
      - Field: **Coming soon thumbnail** upload (optional) – used instead of normal featured image on catalog cards while coming‑soon is active; if empty, fall back to featured image.
      - Checkbox: **Preview course curriculum** – when checked, non‑enrolled students can see the full topic/lesson outline but cannot open locked lessons until the course is live.
    - When OFF:
      - Course either stays Draft or becomes immediately Published depending on the main status dropdown.
      - Any previous `scheduledAt` value is cleared.
  - Behaviour/corner cases:
    - Draft courses are never visible to students, even if Visibility is Public or enrollment is Open.
    - If schedule is ON and **Show “Coming soon”** is unchecked, the course stays completely hidden from students until the go‑live moment (admins/instructors can still preview).
    - If schedule is ON but either date or time is missing, inline validation errors are shown and the form cannot be saved in Published state.
    - If schedule date/time is in the past, show a clear error and ask the admin to either turn scheduling off or pick a future time.
  - Toggles:
    - Toggle: **Featured course** (show in highlighted sections).
    - Toggle: **Allow comments**.
    - Toggle: **Certificate enabled** (course awards certificate on completion).
- **Enrollment settings (same Settings tab)**
  - Field: **Maximum students** – numeric; `0` or empty = no limit.
    - When the limit is reached, self‑enrollment via catalog is blocked with a “Course full” message; admins can still manually enroll students.
  - Field: **Default access duration (days)** – numeric; `0` or empty = lifetime access.
    - On new enrollment, this sets the default `expiresAt` for `CourseEnrollment` (existing enrollments are not retroactively changed).
  - Section: **Course enrollment period**
    - Toggle: **Limit enrollment to a date range**.
    - When ON:
      - Field: **Enrollment start date/time** – from when students can self‑enroll.
      - Field: **Enrollment end date/time** (optional) – after this, self‑enrollment automatically closes.
      - Validation: end must be on/after start; if schedule is also enabled, the UI should warn if enrollment ends before the course start date.
  - Checkbox: **Pause enrollment** – immediate override that prevents new enrollments regardless of dates or max students.
    - While paused, existing students keep access; new students see a friendly message like “Enrollment is currently paused by the instructor”.
- **SEO & marketing**
  - Field: **Meta title**.
  - Field: **Meta description**.
  - Field: **Meta keywords**.
  - Optional field: **Fake enrollment count** (social proof on catalog cards; shown as students enrolled).
    - **Display logic:** wherever a course shows a "students enrolled" count in the **public catalog**, use `displayedEnrollment = fakeEnrollmentCount ?? realEnrollmentCount`.
    - **Admin UI:** grid cards and top summary stats may use the same displayed value; detailed tables can still show real enrollments if needed, but this behaviour must be explicitly documented when implemented.
- **FAQs**
  - Section for **Course FAQs**:
    - Field: **Question** – uses the same rich text editor as the Question Bank.
    - Field: **Answer** – uses the same rich text editor as the Question Bank (so answers can include formatted text and images via `Upload` / `Server Files` / `Recent` / `URL`).
    - Field: **Order** for FAQ sorting.
    - Buttons per FAQ: `Add`, `Edit`, `Delete`, `Reorder`.

#### 3.2.1 Single Course – Implementation Notes (Rich Text, Media & Forms)

- The **short description**, **full description**, and **FAQ question/answer** fields must all use the **existing rich text editor from the Question Bank module**, not plain textareas.
- The rich text editor’s **image dialog** must always expose the four sources: **`Upload`**, **`Server Files`**, **`Recent`**, and **`URL`**, matching the Question Bank UX (including drag-and-drop and max-size messages).
- The **Featured image** field in the Media tab must be implemented as a real file upload using `StorageService` (tenant-scoped public path). The URL textbox can remain as an advanced option, but the primary path is upload.
- When **status = `Scheduled`**, the form must require a **Scheduled publish date/time** and show it with the same control in both Create and Edit flows.
- **Author & Instructor** fields are mandatory to implement once the `Teacher` model is available; they should not be deferred as “future”.
- FAQ UX must support **Add / Edit / Delete / Reorder** properly. The helper text should either match the chosen interaction (e.g. “You can reorder FAQs using the move controls”) or true drag-and-drop must be implemented.
- The **course creation forms** should be progressively refactored to use the global **React Hook Form + Zod + shadcn Form** pattern instead of plain `useState`, for consistent validation, accessibility, and error handling.

#### 3.2.2 Academic Integration – Behaviour & Examples

- **Purpose:** clarify what happens (and what does _not_ happen) when admins fill the optional **Class / Stream / Subject** fields on a course.
- **Baseline rule:** academic fields behave as **metadata and targeting**, not as hard enrollment rules:
  - They power **admin filters**, **badges** on course cards, and **recommended sections** in the student catalog.
  - They do **not** auto-create `CourseEnrollment` records or invoices.
- **Internal academic course example (tagged only):**
  - Admin creates **"Class 8 – Mathematics (Full Syllabus)"** and sets `Class = Class 8`, `Stream = Science`, `Subject = Mathematics`.
  - Students in Class 8 Science may see this under a **"Recommended for your class"** area in `/courses`, but they still need to enroll (manually or via catalog) to get access.
  - Auto invoice is triggered only when an enrollment is created (per course settings), not when academic fields are saved.
- **Public/marketing course example:**
  - Admin creates **"Spoken English Bootcamp"** with only Category set (no Class/Stream/Subject).
  - Course appears in general catalog and marketing pages, but is **not tied** to any specific class, and is never auto-pushed to academic enrollments.
- **Corner cases / future safety:**
  - Because academic tags alone do not enroll students, changing a student’s Class/Stream or moving them between Sections does **not** silently create or cancel course enrollments.
  - Any future "auto academic enrollment" feature (e.g. assign this course to Section A and auto-enroll/invoice everyone) must be designed as a **separate, explicit module** so that admins clearly understand the financial and enrollment impact.

### 3.3 Bundle Course Form

- Everything from the single course form **except curriculum**, plus:
  - Section: **Included courses**
    - Control: **Add course to bundle** (searchable dropdown).
    - Per-item controls: `Remove` and drag handle to **reorder** courses inside the bundle.
  - Bundle price fields (regular/offer) representing the package price.

### 3.4 Global Course Actions

- Buttons associated with a course:
  - **Create / Save draft**.
  - **Update**.
  - **Publish Course**.
  - **Duplicate Course** (creates a full copy of course, topics, lessons, activities, and FAQs in Draft status).
  - **Delete Course** (with confirmation and guard if needed).

---

## 4. Course List Page (Admin/Instructor)

### 4.1 Top Filters & Controls

- Page title: **"All Courses"**.
- Primary action button: **"+ Add New"** (opens course type selection).
- Filter chips under the title:
  - `All`, `Mine`, `Published`, `Draft`, `Scheduled`, `Private`, `Trash`.
- Toolbar controls:
  - Dropdown: **"Bulk Action"** (for bulk operations).
  - Button: **"Reset"** (clears filters and search).
  - Dropdown: **"Select Category"**.
  - Dropdown: **"Select Sort"** (e.g., by date, title, enrollments).
  - Date picker: **"Select Date"**.
  - Search input with placeholder: **"Type to search..."**.

### 4.2 Table Columns & Row Content

- Checkbox column for **selecting multiple courses**.
- **Title** column
  - Thumbnail image (featured image).
  - Course title (clickable).
  - Meta line: `Topics · Lessons · Quizzes · Assignments` counts.
- **Category** column – primary category name with optional smaller sub-label.
- **Type** column – pill: `Single` or `Bundle`.
- **Author** column – instructor avatar and name.
- **Price** column
  - Shows **regular price / offer price**.
  - Shows `Free` pill if price is 0.
- **Date** column – created or published date/time.
- **Enrollments** column – total enrollments count.
- **Active devices / engagement** (optional future column)
  - e.g., `288 / 324` plus small rating/engagement badge.
- **View Enrolled** column
  - Button: **"View Enrolled"** (opens enrollment page for that course).
- **Status** column
  - Status pill values: `Draft`, `Scheduled`, `Published`, `Archived`.
- **Action** column (kebab menu per row)
  - Menu items: `View`, `Edit`, `Duplicate`, `View Analytics`, `Device Management`, `Share Link`, `Delete`.
  - `Share Link` copies the public course URL.
  - `Delete` uses a confirmation dialog and respects delete guards.

### 4.3 Responsive Behaviour

- Desktop: show **all** columns.
- Tablet: keep `Title`, `Category`, `Type`, `Price`, `Enrollments`, `Status`, `Action`; hide others or move them into the title/meta line.
- Mobile: switch to **stacked card layout** per course:
  - Line 1: thumbnail, title, status pill, kebab menu.
  - Line 2: category, type pill, price/free pill.
  - Line 3: meta (`Topics · Lessons · Assignments`) and enrollments count.
- **QA note (small laptop screens):** Verify that tall dialogs like **Course Category create/edit**, **Course Enrollment dialog**, and other large shadcn Dialog forms (e.g. Branches, Academic Years, Subjects, Chapters, Sections) keep header + primary action visible by using an internal scroll area (`max-height` + `overflow-y-auto`) when content exceeds viewport height.

---

## 5. Course Builder (Topics, Lessons, Activities)

### 5.1 Builder Header & Global Actions

- Shows course title and summary, e.g., **"Advanced Physics for Class 10 – 3 Topics • 10 Lessons • 2h 30m"**.
- Buttons on the right:
  - **"Preview Course"**.
  - **"Publish Course"** (same core action as in course form).

### 5.2 Chapters (Topics) & Syllabus Integration

> Terminology: in the UI we refer to course-level containers as **Chapters**. Internally they map to "topics" in the data model, but this detail is hidden from users.

#### 5.2.1 Initial State & Syllabus Source Card

- When the builder first loads and the course has **no chapters yet**:
  - If the course has a **Subject** (and optionally Class/Stream) set:
    - Show a prominent card at the top with title **"Start from syllabus?"**.
    - Card body text explains: _"You can import chapters from the **Subject → Chapter → Topic** tree or create custom chapters only for this course."_.
    - Primary button: **"Import chapters from syllabus"**.
    - Secondary link/button: **"Start with custom chapters"**.
  - If the course has **no Subject**:
    - Show a similar card explaining that syllabus import works best when a Subject is chosen.
    - Buttons:
      - **"Select Subject & import"** – opens a side-panel or navigates back to the course edit form focused on the Academic section.
      - **"Continue with custom chapters only"**.

#### 5.2.2 Syllabus Import Wizard ✅ **COMPLETED**

- Clicking **"Import chapters from syllabus"** opens a 3-step wizard (visual style similar to the Academic Year Wizard):
  - **Step 1 – Confirm scope**
    - Shows the current **Class**, **Stream**, and **Subject** (read-only chips).
    - Optional info text like _"Questions and topics will be filtered using this scope in the Question Bank."_.
  - **Step 2 – Select chapters**
    - Displays a table/list of chapters from the selected subject:
      - Columns: `Chapter name`, `# Topics`, `# Questions`.
      - Checkbox per row and a **"Select all"** checkbox.
    - Already-imported chapters (if any) show a muted chip: **"Already in course"** and are **pre-selected but disabled**.
  - **Step 3 – Preview & confirm**
    - Summary text: _"You are about to create N chapters in this course."_.
    - Preview list: `Chapter 1 – Algebra → will create a chapter with 0 lessons / 0 activities`.
    - Conflict behaviour:
      - If a selected chapter name already exists inside this course, show chip **"Will be skipped (duplicate title)"**.
- **Generate** button:
  - Creates all missing chapters in one go.
  - Returns the user to the builder with the new chapters visible and briefly highlighted.

> **Implementation Status:** This feature has been fully implemented and tested. The wizard successfully imports chapters from the Question Bank syllabus structure into course chapters.

#### 5.2.3 Chapter Rows & Per-Row Actions ✅ **COMPLETED**

- Button at the bottom/right: **"+ Add Chapter"** (opens simple add/edit form with title and description).
- Each chapter row shows:
  - **Chapter title** and short description.
  - Small chips such as:
    - `Linked to syllabus` (when mapped to a Subject/Chapter/Topic item).
    - `3 lessons · 2 activities`.
  - A drag handle allowing chapters to be **reordered**.
- Per chapter actions:
  - Buttons: `Edit`, `Delete`, `+ Add Lesson`, `+ Add Activity`.
  - Delete guard:
    - If the chapter contains lessons or activities, show a warning dialog:
      - _"This chapter has X lessons and Y activities. You can archive or move them before deleting, or delete everything together."_.
    - If any graded exams under this chapter have student attempts, **hard delete is blocked**; show: _"Chapters with graded attempts cannot be deleted. Archive instead."_.
- Adding a chapter supports two modes (when a Subject exists):
  - **"Use existing Chapter/Topic"** – teacher chooses from the syllabus tree; the selected name is copied into the chapter title and a link is stored.
  - **"Create custom chapter"** – standalone chapter with no external mapping.

**Implementation Status:**

- ✅ Add/Edit chapter form with title and description
- ✅ Chapter rows with title, description, and lesson count chips
- ✅ Drag handle visual (GripVertical icon) - actual drag-and-drop can be added later with dnd-kit library
- ✅ Edit, Delete, + Add Lesson buttons per chapter
- ✅ Delete guard with lesson count warning
- ✅ Schema support for syllabus linking (subjectId, chapterId, topicId, sourceType fields)
- ⏳ UI for two-mode chapter creation (syllabus vs custom) - can be added when needed
- ⏳ + Add Activity button - will be implemented with Activity Management module

### 5.3 Lesson Management (Text / Document / Video)

- Each chapter contains a list of **lessons** and **activities** displayed in order.
- Per row:
  - Shows icon, title, lesson type (e.g. `Video`, `PDF`, `Text`), and (for videos) **duration** if provided.
  - Hover/ellipsis menu with: `Edit`, `Duplicate`, `Delete`, `Preview`.
  - Drag handle to **reorder lessons and activities** within the chapter.

#### 5.3.1 Adding a Lesson

- Clicking **"+ Add Lesson"** on a chapter opens a small **lesson type chooser** (popover or mini-dialog) with options:
  - **Text lesson** – rich text article.
  - **PDF / Document** – upload or attach a document file.
  - **Video lesson** – primary focus on a single video source.
  - **Advanced / Mixed content** – full content editor supporting multiple blocks (text, images, embeds).
- After selecting a type, a **lesson editor** opens in the right-hand panel or full-screen:
  - Common fields:
    - **Title** (required).
    - **Short description** (optional helper text).
  - Type-specific main fields:
    - **Text lesson**:
      - Uses the same rich text editor as the Question Bank (with `Upload / Server Files / Recent / URL` for images).
    - **PDF / Document**:
      - Upload area for PDF/DOC/PPT etc. using `StorageService` (tenant-scoped).
      - Auto-fills the lesson title from the file name, but teacher can edit.
    - **Video lesson**:
      - Tabs or radio buttons for:
        - `YouTube`, `Vimeo`, `VdoCipher`, `Google Drive / URL`, `Local upload`.
      - Depending on source, either a URL box or upload picker.
      - Optional **Estimated duration** field (minutes:seconds).
    - **Advanced / Mixed content**:
      - Same rich editor as Text lesson plus attachments and embed blocks.

#### 5.3.2 Lesson-Level Settings & Protection

- All lesson types share a configuration section:
  - Access control: `Public`, `Password`, `Enrolled only`.
  - Password field when `Password` is selected.
  - Scheduled release date/time.
  - Attachments list (e.g., PDFs, images, links) with `Add` / `Remove` controls.
  - Toggle: **"Allow download"** (affects document/video download buttons).
  - Toggle: **"Mark as preview"** (makes the lesson free to view without enrollment if the course allows previews).
- Content protection / viewing behaviour (best-effort, non-DRM):
  - **Document lessons** default to a **protected view-only mode**:
    - Students see a **"View"** button opening a document viewer instead of a raw file URL.
    - The **"Allow download"** toggle explicitly controls whether a separate **"Download"** action is visible.
  - Document viewer and video player screens overlay a subtle, per-student **watermark** (e.g., name, code, timestamp).
  - Locally hosted / Drive-proxied videos use a streaming player, and YouTube embeds use a **restricted UI** (no obvious "Watch on YouTube" / share buttons) to make copying harder.
  - The system does **not** promise 100% prevention against advanced screen recording or download tools, but is designed to make copying significantly harder for normal users.

### 5.4 Activities (Online Exams, Practice Quizzes, Assignments)

#### 5.4.1 Add Activity Palette

- Clicking **"+ Add Activity"** on a chapter (or choosing an assessment option from **"+ Add Lesson"**) opens an **"Add activity"** modal.
- The modal shows tiles/cards grouped under `Content`, `Assessments`, and `Offline`:
  - Assessments focus for this phase:
    - **Online MCQ Exam** (timed, graded).
    - **Practice MCQ Quiz** (untimed practice with explanations).
  - Additional tiles (same behaviour as earlier spec):
    - **Assignment / Homework** – collect submissions and grade.
    - **Offline Exam** – record details of an exam held outside the system.
    - **SCORM / Package (coming soon)** – future support for SCORM/xAPI content.
- Each tile displays an icon, title, short description, and category label. Selecting a tile immediately closes the modal and opens the relevant activity editor.

#### 5.4.2 Online MCQ Exam (graded)

- Purpose: formal, timed exam that contributes to course completion and grades.
- Core settings (right-side panel):
  - Time limit (required).
  - Attempts allowed (`1` by default, configurable).
  - Question order shuffle and option shuffle toggles.
  - Grading:
    - Pass mark (percentage or marks).
    - Global negative marking value (e.g. `-0.25`) or "no negative marks".
  - Availability:
    - Start date/time and optional end date/time.
    - Toggle for allowing or blocking late attempts.
  - Result visibility:
    - Show score only, or
    - Show detailed review with correct answers after exam window closes.
- Question source & selection:
  - Teacher chooses between:
    - **"Create new questions"** – opens the Question Bank question form in a side-panel; newly created questions are saved to the bank and added to this exam.
    - **"Import from Question Bank"** – opens a selection view that reuses the existing Question Bank filters.
  - Question selection view:
    - Filters down by the course's **Subject**, **Class**, and **current Chapter** by default (but can be changed).
    - Supports Topic filters, difficulty chips, source and exam year filters, mirroring the Question Bank UI.
    - Middle area lists questions with stem preview and meta chips; right side lists **Selected questions** with drag-to-reorder and per-question mark override (optional future).
    - Summary footer shows: `X questions · Y total marks`.
- Student exam experience (preview behaviour):
  - Full-page layout with top bar showing breadcrumb, exam title, and `Time left` countdown plus a prominent **"Submit"** button.
  - Colored instruction banner summarizing total marks, negative marking, and rules.
  - Question cards stacked vertically with clearly separated options.
  - Right-side **"Question Navigation"** panel with numbered pills and legend for `Answered` / `Unanswered`.
  - Timer and navigation remain visible while scrolling; admin **Preview** opens the same layout in read-only mode.

#### 5.4.3 Practice MCQ Quiz (untimed practice)

- Purpose: low-pressure practice that helps students learn using instant feedback and explanations.
- Core settings:
  - No strict time limit (only an optional "Suggested time" field).
  - Attempts: unlimited by default; optional limit per day or per student.
  - Behavioural options:
    - Immediate correctness feedback vs. requiring a **"Check answer"** click.
    - Toggle: **"Allow re-attempt for entire quiz"**.
- Question selection:
  - Uses the same Question Bank selection UI as Online MCQ Exam.
  - By default, practice quizzes can share questions with exams; they do not affect grading, only progress/completion rules.
- Student practice experience:
  - Top bar shows topic name, a **"Submit"** or **"Finish practice"** button, and a **"Time passed"** counter (count-up only; **no countdown timer**).
  - Summary chips (`Total`, `Correct`, `Wrong`) update live as students answer.
  - Instruction banner explains that this is practice and may include note about negative marking if configured.
  - Each question card visually highlights selected and correct options with colors.
  - Per-question button: **"Show answer & solution"** expands an explanation panel.
  - Optional future behaviour: per-question retry / hints.

#### 5.4.4 Other Activity Types

- **Assignment / Homework**
  - Description: _"Collect submissions and grade"_.
  - Fields: title, instructions, due date/time, maximum marks, submission type (`File upload`, `Text answer`, or both), allowed file types, late submission policy.
- **Offline Exam**
  - Description: _"Create an entry for an exam conducted offline"_.
  - Fields: exam name, exam date/time, instructions, maximum marks, optional question paper file for record.
- **SCORM / Package (coming soon)**
  - Description: _"Upload SCORM / xAPI content package"_.
  - Behaviour: launches in a dedicated player and records completion/score into course progress; clearly marked as **"Coming soon"** in the UI so admins know it is not fully available yet.
- Footer actions (inside the Add activity modal or editor):

  - **"Import from another course"** – pick a source course and select chapters/lessons/activities to clone.
  - Future: **"Import from template library"** for reusable templates.

- UX details:
  - The Add activity modal supports keyboard navigation (`Arrow` keys to move between tiles, `Enter` to select, `Esc` to close).
  - Activity rows inside the chapter list use consistent icons and colored pills (`Exam`, `Practice`, `Assignment`, `Offline`) so teachers can quickly scan the curriculum.

---

## 6. Enrollment Management (View Enrolled)

### 6.1 Top Section & Filters

- Page title: **"Enrolled Students (N)"** showing total count.
- Global search bar: search by **student name, email, phone, or admission number**.
- Filter controls:
  - Enrollment status: `Active`, `Completed`, `Expired`, `Cancelled`, `Suspended` (future).
  - Payment status: `Paid`, `Pending`, `Overdue`, `Refunded`.
  - Progress range filters: `0–25%`, `25–50%`, `50–75%`, `75–100%`.
- Checkbox: **"Select All (Current Page)"** for bulk operations.

### 6.2 Table Columns

- **Student**
  - Avatar.
  - Full name.
  - Student code/roll (e.g., `STU006`).
- **Contact**
  - Email (with mail icon).
  - Phone number (with phone icon).
- **Status**
  - Status pill using enrollment status values.
- **Progress**
  - Percentage (e.g., `35%`).
  - Horizontal progress bar.
- **Assignments / Activities**
  - Text like `4/12 completed`.
- **Payment**
  - Badge: `Paid`, `Pending`, `Overdue`, or `Refunded`.
- **Last Activity**
  - Relative time since last interaction (e.g., `2 weeks ago`).
- **Actions** (kebab menu)
  - `View Profile` (opens student profile).
  - `Send Message` (opens messaging UI, future integration).
  - `Remove from Course` (unenrolls with confirmation prompt).

### 6.3 Header & Extra Features

- Header primary button: **"+ Enroll Students"** (manual enrollment dialog).
- Header bulk action button: **"Remove"** (bulk unenroll selected students with confirmation and optional reason).
- Additional columns (extended design):
  - **Admission Number**.
  - **Class** (academic grade).
  - **Section** (cohort/section label).
  - **Last Login** in this course.
  - **Active Device** chip showing:
    - `Active` (normal use).
    - `Multiple Device` (detected concurrent devices) plus inline **"Disable"** button.
- Per-course disable behaviour:
  - When disabled, student keeps account but cannot open this specific course; course player shows a friendly message such as _"Access disabled by admin"_.
  - Admins can toggle disable/enable using the **Active Device** column or a row action.
- Bulk actions (current + future):
  - `Bulk Unenroll` (remove from course and update course enrollment count).
  - `Bulk Disable/Enable` (toggle access for multiple students).

---

## 7. Student Experience

### 7.1 Course Catalog

- Public/student-facing **course catalog** page.
- Section header: **"Browse Courses"**.
- Category filter chips at top (e.g., `All`, `Science`, `Mathematics`, `Programming`, `Business`).
- Course cards show:
  - Featured image.
  - Category label badge.
  - Course title (e.g., "Advanced Physics for Class 10").
  - Star rating (e.g., `⭐⭐⭐⭐⭐ (4.8)`).
  - Student count (e.g., `1,234 students`).
  - Instructor name (e.g., `Dr. Nabil`).
  - Price (e.g., `৳1,500` with optional strikethrough for old price) or **"Free"** badge.
  - Primary button: **"Enroll Now"**.

### 7.2 Student Course Player

- Layout is split into **sidebar (curriculum)** and **main content (player)**.
- Top bar shows:
  - Course title.
  - A **Progress indicator** (e.g., `Progress: 45%` + progress bar).
  - Optional "Back to My Courses" link/button.

#### 7.2.1 Sidebar – Chapters, Lessons, Activities

- Sidebar label: **"Curriculum"**.
- Groups items by **Chapter** (the same chapters defined in the Course Builder):
  - Each chapter row shows title and a small completion chip (e.g., `3 / 7 items`)
  - Chapters can expand/collapse to show inner items.
- Inside each chapter:
  - Lessons and activities appear in the same order as in the builder.
  - Each item shows:
    - Icon + small type pill: `Video`, `PDF`, `Text`, `Exam`, `Practice`, `Assignment`, `Offline`.
    - Title and an optional small duration/marks chip (e.g., `12 min`, `30 marks`).
    - Status indicator:
      - `✅` Completed.
      - `▶️` Available / in progress.
      - `🔒` Locked (hover tooltip shows reason – not yet released, or prerequisites not met).
  - For **Online MCQ Exams**, sidebar may additionally show a small chip like `1 attempt left` or `Graded`.
  - For **Practice MCQ Quizzes**, a chip like `Practice` helps distinguish from graded exams.

#### 7.2.2 Main Content – Lessons (Text / PDF / Video)

- When a **Video lesson** is selected:
  - Main area shows a unified video player UI (play/pause, seek, volume, settings, fullscreen).
  - Under the hood the source may be YouTube, Vimeo, VdoCipher, Google Drive, or locally uploaded video, but the player controls stay consistent for students.
  - Below the player:
    - Lesson title and (if set) duration.
    - Short description and body content (notes, summary, links).
- When a **Text lesson** is selected:
  - Main area shows the rich text content with headings, images, lists, and inline math if supported.
  - Optional estimated reading time can be shown near the title.
- When a **PDF / Document lesson** is selected:
  - Main area shows a **document viewer** with page thumbnails/controls, zoom, and scroll.
  - A subtle watermark (name / student code / timestamp) is overlaid.
  - If the teacher enabled "Allow download", a `Download` button appears; otherwise only view mode is available.

#### 7.2.3 Main Content – Activities (Exam / Practice / Others)

- When an **Online MCQ Exam** item is opened:
  - The player uses the exam layout defined in 5.4.2:
    - Top bar with breadcrumb, exam title, and `Time left` countdown plus **Submit**.
    - Instructions banner with total marks, negative marking, and attempt rules.
    - Question list with numbered cards and options.
    - Right-side **Question Navigation** panel with status legend.
  - On submit, students see either:
    - Score only, or
    - Detailed review with correct answers, depending on teacher settings.
- When a **Practice MCQ Quiz** item is opened:
  - The player uses the practice layout defined in 5.4.3:
    - Top bar with chapter/quiz title, **"Finish practice"** button, and `Time passed` (count-up).
    - Live score chips (`Total`, `Correct`, `Wrong`).
    - Per-question **"Show answer & solution"** actions with explanation panels.
  - Practice attempts typically do not affect formal grades but can still count towards course completion rules.
- When an **Assignment / Homework** item is opened:
  - Shows title, instructions, due date/time, and maximum marks.
  - If submissions are enabled:
    - Upload area for files and/or text answer box.
    - Status text: `Not submitted`, `Submitted`, or `Graded` with score.
- When an **Offline Exam** item is opened:
  - Shows exam details and any attached question paper or instructions.
  - May show a `Marks recorded` chip once the teacher enters scores.

#### 7.2.4 Navigation & Progress Behaviour

- Below the main content, navigation buttons:
  - **"Previous"**, **"Mark Complete"**, **"Next"**.
  - For graded exams, **Mark Complete** is automatic on successful submission.
- Completion rules:
  - Each item has a `Required for completion` flag configured in the builder.
  - Required lessons/activities must be marked complete or submitted/passed for overall course completion.
  - Optional items can still be opened but do not block certificate eligibility.
- Progress updates:
  - When a lesson or activity is completed, the sidebar status updates instantly and the top progress bar recalculates.
  - For video lessons, there is room in the design for an optional auto-complete rule (e.g., mark complete when 90% watched), but exact percentage logic can be tuned later.
- Locked behaviour:
  - Clicking a locked item shows an inline message instead of a hard error page:
    - Example: "Available on 20 Aug, 10:00 AM" or "Complete previous chapter to unlock this exam".
  - This keeps the player feeling guided rather than broken.

---

## 8. Cross-Cutting Features & Checklist

- **Dark mode** supported across all Course Management screens.
- Reusable UI patterns from Academic Setup: searchable dropdowns, tables, dialogs, and modern chip/badge styling.
- **Testing checklist** items covered by this spec:
  - Category create/edit/delete/reorder, color/icon selection.
  - Single/bundle course creation, featured image upload, intro video, pricing, and FAQs.
  - Course list filters and search.
  - Academic integration: creating courses with and without Class/Stream/Subject tags, verifying admin filters and badges, testing student catalog Recommended for your class sections, and confirming that no students are auto-enrolled or auto-invoiced just from tagging.
  - Topic and lesson CRUD, lesson types, access control, scheduling, attachments, and reorder.
  - Enrollment management, auto invoice generation, and progress tracking.
  - Student catalog browsing, enrollment, content viewing, completion, and progress tracking.
- The system also records important actions for **audit/logging purposes** (e.g., course deletion, bulk unenroll), even though the storage format is outside the scope of this non-technical document.
