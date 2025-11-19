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
- **Visibility & status**
  - Field: **Status** – `Draft`, `Published`, `Scheduled`, `Private`.
  - Field: **Published date/time** (displayed in course list).
  - Field: **Scheduled publish date/time** (used when status = `Scheduled`).
  - Toggle: **Featured course** (show in highlighted sections).
  - Toggle: **Allow comments**.
  - Toggle: **Certificate enabled** (course awards certificate on completion).
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

### 5.2 Topic Management

- Button: **"+ Add Topic"** (opens add topic form).
- Per topic row:
  - Displays **Topic title** and **description**.
  - Buttons: `Edit`, `Delete`, `+ Add Lesson`, `+ Add Activity`.
  - Drag handle to **reorder topics**.
- Topic behaviour:
  - Topics can be **custom** (course-only) or **linked** to existing Subject/Chapter/Topic from Academic Setup/Question Bank.
  - Adding a topic supports:
    - Option: **"Use existing Chapter/Topic"** (maps to existing syllabus item but copies the current name into the topic title).
    - Option: **"Create custom topic"** (no external mapping).

### 5.3 Lesson Management

- Each topic contains a list of lessons with icons and details.
- Supported **lesson types**:
  - `YouTube video`.
  - `Vimeo video`.
  - `Local uploaded video`.
  - `Google Drive video`.
  - `Document` (PDF, DOC, PPT, etc.).
  - `Text` lesson (rich text article).
  - `Iframe` embed.
- Per lesson or activity row:
  - Shows icon, title, and (for videos) **duration** where applicable.
  - Buttons: `Edit`, `Delete`, `Preview`; for assessments (online exams/quizzes, assignments) there can also be **"View Results"** / **"View Submissions"** shortcuts that open the relevant reporting page.
  - Drag handle to **reorder lessons and activities** within a topic.
- Lesson-level settings:
  - Access control: `Public`, `Password`, `Enrolled only`.
  - Password field (when password-protected).
  - Scheduled release date/time.
  - Attachments list (e.g., PDFs, images, links) with `Add` / `Remove` controls.
  - Toggle: **"Allow download"**.
  - Toggle: **"Mark as preview"** (free sample lesson).
- Content protection / viewing behaviour (best effort, non-DRM):
  - **Document lessons** default to a **protected view-only mode**:
    - Students normally see a **"View"** button that opens the document in a secure viewer instead of getting a raw file link.
    - The **"Allow download"** toggle explicitly controls whether a separate **"Download"** action is shown for that lesson.
  - Document viewer and video player screens overlay a subtle, per-student **watermark** (e.g., name, code, timestamp) to discourage casual leaks and make the source traceable.
  - Locally hosted / Drive-proxied videos are played through a streaming player rather than a simple direct file download, and YouTube embeds use a **restricted UI** (no obvious "Watch on YouTube" / share buttons) to make copying harder.
  - The system does **not** promise 100% prevention against advanced screen recording or download tools, but is designed to make copying significantly harder for normal users.

### 5.4 Activities & Resources (Add Activity/Resource Modal)

- Triggered from `+ Add Lesson` or `+ Add Activity` on a topic.
- Dialog title: **"Add an activity or resource"**.
- Primary tiles/cards:
  - **Lesson**
    - Description: _"Add text / image / video / URL"_.
    - Opens a rich content editor with title, short description, content blocks, and attachments.
  - **PDF Resource**
    - Description: _"Upload or attach a PDF file"_.
    - Quick create: upload PDF, auto-fill title from filename; can reorder within topic.
  - **Video-only Lesson**
    - Description: _"Add a single video with optional notes"_.
    - Quick create: paste video URL or upload, optional short description; video-first layout.
  - **Online**
    - Description: _"Exam / practice"_.
    - After selecting, teacher chooses:
      - **Question source**: `Create new` or `Import from question bank`.
      - **Mode**: `Exam` (timed, graded) or `Practice` (no time limit, instant feedback).
    - **Exam mode – student preview**:
      - Full-page exam layout with top bar showing breadcrumb, exam title, remaining time (`Time left` countdown), and prominent **"Submit"** button.
      - Colored instruction banner with total marks, negative marking, and rules.
      - Question cards listed vertically with clear options.
      - Right-side **"Question Navigation"** panel with numbered pills and legend for `Answered`/`Unanswered`.
      - Timer and navigation stay visible while scrolling.
      - Admin `Preview` opens this layout in read-only mode.
    - **Practice mode – student preview**:
      - Top bar with topic name, **"Submit"** button, and **"Time passed"** counter (count-up only; **no time limit and no "Time left"** countdown).
      - Summary chips: `Total`, `Correct`, `Wrong`.
      - Green instruction banner describing marks and negative marking.
      - Each question card visually highlights selected and correct options with colors.
      - Button per question: **"Show answer & solution"** to expand the explanation panel.
      - Score chips update live as answers are marked; optional future "hint" and per-question retry behaviour.
  - **Assignment / Homework**
    - Description: _"Collect submissions and grade"_.
    - Fields: title, instructions, due date/time, maximum marks, submission type (`File upload`, `Text answer`, or both), allowed file types, late submission policy.
  - **Offline**
    - Description: _"Create offline question / sheet"_.
    - Fields: exam name, exam date/time, instructions, maximum marks, optional question paper file.
  - **SCORM / Package (coming soon)**
    - Description: _"Upload SCORM / xAPI content package"_.
    - Behaviour: launches in dedicated player and records completion/score into course progress; marked as **"Coming soon"** in the UI.
- Footer actions:
  - Button: **"Import from another course"** – pick source course and select topics/lessons/activities to clone.
  - Future: **"Import from template library"** for reusable templates.
- UX details:
  - Tiles are styled as modern cards with icon, title, short description, and small category labels (`Content`, `Assessment`, `Offline`).
  - Optional filter chips at top: `All`, `Content`, `Assessments`, `Offline`.
  - Keyboard navigation: arrow keys move between tiles; `Enter` to choose; `Esc` to close.

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

- Layout is split into **sidebar (curriculum)** and **main content (lesson player)**.
- Top bar shows course title and a **Progress indicator** (e.g., `Progress: 45%` + progress bar).
- Sidebar features:
  - List of topics with expand/collapse.
  - Within each topic, lessons/activities with icons and status states:
    - `✅` Completed.
    - `▶️` In progress / available.
    - `🔒` Locked.
- Main content area (for a lesson):
  - For video lessons: a video player with controls (play/pause, next/previous, volume, settings, fullscreen).
  - Lesson title and duration.
  - Lesson description/body content.
  - Navigation buttons: **"Previous Lesson"**, **"Mark Complete"**, **"Next"**.
  - Attachments section with file links and **"Download"** actions; for protected document lessons, students instead see a dedicated viewer (with watermark) unless the teacher has explicitly allowed downloads.
- Behaviour:
  - Completing lessons updates the **progress percentage**.
  - When all required lessons/activities are completed and certificate is enabled, the course can mark the student as **Completed** and expose the certificate download/link.

---

## 8. Cross-Cutting Features & Checklist

- **Dark mode** supported across all Course Management screens.
- Reusable UI patterns from Academic Setup: searchable dropdowns, tables, dialogs, and modern chip/badge styling.
- **Testing checklist** items covered by this spec:
  - Category create/edit/delete/reorder, color/icon selection.
  - Single/bundle course creation, featured image upload, intro video, pricing, and FAQs.
  - Course list filters and search.
  - Topic and lesson CRUD, lesson types, access control, scheduling, attachments, and reorder.
  - Enrollment management, auto invoice generation, and progress tracking.
  - Student catalog browsing, enrollment, content viewing, completion, and progress tracking.
- The system also records important actions for **audit/logging purposes** (e.g., course deletion, bulk unenroll), even though the storage format is outside the scope of this non-technical document.

