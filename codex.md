Course & Category Implementation Plan

1. ডেটা মডেল & মাইগ্রেশন

CourseCategory, Course, CourseTopic, CourseLesson, CourseQuiz (বা CourseActivity) মডেল তৈরি।
প্রধান ফিল্ড: tenantId, title, slug, description, status, order.
Course ফিল্ড: type (SINGLE/BUNDLE), pricing (one-time/subscription), offerPrice, visibility, featuredImageUrl, autoInvoiceEnabled, authorId, bundleCourseIds (optional) ইত্যাদি।
Topic/Lesson এ position রাখুন যেন রিঅর্ডার করা যায়।
Quiz/Activity টেবিলে quiz config (timing, grading, etc.)।
Prisma schema update করে prisma migrate dev চালান।
Seed script এ ডিফল্ট category ও sample instructor/course ডেটা যোগ করুন।
2. সার্ভিস লেয়ার / Actions

app/(dashboard)/courses ফোল্ডারে actions.ts বা পৃথক সার্ভিস ফাইল:
Category: createCourseCategory, updateCourseCategory, listCourseCategories, deleteCourseCategory.
Course: createCourse, updateCourse, publishCourse, deleteCourse, duplicateCourse.
Builder: createTopic, updateTopic, deleteTopic, createLesson, updateLesson, reorderTopics, reorderLessons, createQuizActivity.
Enrollment: enrollStudent, listEnrollments, removeEnrollment.
Server Actions বা API Route Handler ব্যবহার করুন। প্রতিটি কলেই tenantId ও role guard (requireRole) নিশ্চিত করুন।
3. কোর্স ক্যাটাগরি ম্যানেজমেন্ট UI

নতুন পেজ Course Management > Categories:
টেবিল + সার্চ/ফিল্টার।
“Add Category” modal: Title, slug auto-generate, description, status, visibility।
Category delete করলে fallback/confirmation logic।
Existing course form এ category combobox (with create option) ব্যবহার করুন।
4. সকল কোর্স লিস্ট

app/(dashboard)/courses/page.tsx:
কলাম: Title, Category, Type, Author, Price (Regular/Offer), Enrollments, Status, UpdatedAt।
Filter bar: ক্যাটাগরি, স্ট্যাটাস, টাইপ, তারিখ, সার্চ।
Actions: View builder, Edit metadata, Publish/Unpublish toggle, Delete, Duplicate।
Pagination + bulk actions (optional)।
Prisma query অপ্টিমাইজ (include সীমিত, enrollments count aggregate)।
5. “Add New Course” প্রবাহ

Course Type Selection

Single vs Bundle নির্বাচন কার্ড।
?type= query param দিয়ে form রেন্ডার।
Course Setup Form

ফিল্ড: Title, slug preview, category select/create, Rich Text Description (TipTap/Quill), Author select, Course type, Payment settings (one-time default, subscription future ready), Invoice toggle, Status/Visibility, Featured image upload, Intro video, Fake enrolled count (optional), FAQ repeater, SEO meta (optional)।
Form validation Zod দিয়ে। slug uniqueness backend-এ চেক।
Submit → Draft course তৈরি; সফল হলে course builder অথবা “Save & Continue”।
Bundle Extra UI

Bundle হলে child courses multiselect ও reorder করতে পারবেন।
6. Course Builder (Topic/Lesson/Quiz)

CourseBuilder ক্লায়েন্ট কম্পোনেন্ট:
বাম পাশে topics accordion, ডান পাশে selection details panel।
+ Add Topic: inline form বা modal।
+ Add Lesson: lesson type চয়েস (YouTube/Vimeo/Local/Drive/Document/Text/iFrame)। file upload endpoint প্রস্তুত।
Lesson ফর্ম: Title, Description, Duration, Resource link/upload, Access control (public/password), Release schedule।
Drag & Drop reorder (React DnD বা sortable)।
Quiz/Online Activity builder: ৫ ধাপের Stepper (General, Timing, Grading, Layout, Security)।
Question Bank থেকে প্রশ্ন যোগের modal (search/filter)।
Prisma transaction দিয়ে quiz+questions binding সেভ।
7. কোর্স ডিটেইল / Preview পেজ

Admin view: course summary card (status, pricing, statistics), topics ও lesson count, publish toggle, duplicate button।
Student view (Phase 3/4): course landing page, intro video, enrol CTA, lesson list, quiz access।
Auto invoice toggle থাকলে enrollment সময় invoice সার্ভিস কল প্রস্তুত রাখুন।
8. Enrollment Workflow (Phase 3)

Course list এ View Enrolled → drawer/modal এ টেবিল (Student, Email, Status, JoinedAt)।
+ Enroll Student → existing student picker + payment info (manual/auto)।
Enrollment service: duplicate prevent, optional invoice generation hook.
এনরোলমেন্ট remove করলে access revoke ও optional notification।
9. Permission, Audit & SaaS বিবেচনা

Role guard: ADMIN, INSTRUCTOR course manage; STUDENT শুধু consume।
ডেটা সব জায়গায় tenantId scope। multi-tenant isolation বজায় রাখতে course/category query তে tenant filter ব্যবহার।
Audit trail table (optional): course create/update/delete, publish, enrollment change log।
Future SaaS ফিচার: usage quota, plan-based limits, webhooks/notifications, billing integration (Stripe/Razorpay) জন্য PaymentType schema future-ready রাখা হয়েছে।
10. UX Polish & Testing

Dark/Light mode consistency (buttons, background, typography)।
“Unsaved changes” warning course builder এ।
Loading/Skeleton states builder ও list এ।
Testing:
Unit: Prisma services, validation।
Integration/E2E: category create → course create → topic/lesson add → quiz add।
Accessibility: keyboard nav, aria-label, focus states।
Performance: lazy loading, pagination, SWR caching।
Optional Enhancements

Course duplication (template হিসেবে)।
Bulk lesson import (CSV, Google Drive)।
Content scheduling/drip feed।
Analytics dashboard (enrollment trends, completion rate)।
Course localization (multi-language fields)।
Notifications/webhooks (publish, enrollment events)।