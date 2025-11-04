/*
  Warnings:

  - You are about to drop the column `code` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `credits` on the `courses` table. All the data in the column will be lost.
  - You are about to drop the column `name` on the `courses` table. All the data in the column will be lost.
  - Added the required column `slug` to the `courses` table without a default value. This is not possible if the table is not empty.
  - Added the required column `title` to the `courses` table without a default value. This is not possible if the table is not empty.

*/
-- CreateTable
CREATE TABLE "course_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "course_topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_topics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_topics_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "course_lessons" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "lessonType" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "videoUrl" TEXT,
    "videoFilePath" TEXT,
    "documentPath" TEXT,
    "textContent" TEXT,
    "iframeUrl" TEXT,
    "duration" INTEGER,
    "isPreview" BOOLEAN NOT NULL DEFAULT false,
    "accessType" TEXT NOT NULL DEFAULT 'ENROLLED_ONLY',
    "password" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_lessons_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_lessons_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "course_topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "bundle_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "bundleId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "bundle_courses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bundle_courses_bundleId_fkey" FOREIGN KEY ("bundleId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "bundle_courses_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "course_faqs" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "question" TEXT NOT NULL,
    "answer" TEXT NOT NULL,
    "order" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_faqs_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_faqs_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "lesson_completions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "enrollmentId" TEXT NOT NULL,
    "lessonId" TEXT NOT NULL,
    "completedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "watchDuration" INTEGER,
    CONSTRAINT "lesson_completions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lesson_completions_enrollmentId_fkey" FOREIGN KEY ("enrollmentId") REFERENCES "course_enrollments" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "lesson_completions_lessonId_fkey" FOREIGN KEY ("lessonId") REFERENCES "course_lessons" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_course_enrollments" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "studentId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "enrollmentDate" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "paymentStatus" TEXT NOT NULL DEFAULT 'PENDING',
    "amountPaid" REAL,
    "invoiceId" TEXT,
    "progressPercent" INTEGER NOT NULL DEFAULT 0,
    "completedLessons" INTEGER NOT NULL DEFAULT 0,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "lastAccessedAt" DATETIME,
    "completedAt" DATETIME,
    "certificateIssued" BOOLEAN NOT NULL DEFAULT false,
    "certificateUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_enrollments_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_enrollments_studentId_fkey" FOREIGN KEY ("studentId") REFERENCES "students" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_enrollments_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_course_enrollments" ("courseId", "createdAt", "enrollmentDate", "id", "status", "studentId", "tenantId", "updatedAt") SELECT "courseId", "createdAt", "enrollmentDate", "id", "status", "studentId", "tenantId", "updatedAt" FROM "course_enrollments";
DROP TABLE "course_enrollments";
ALTER TABLE "new_course_enrollments" RENAME TO "course_enrollments";
CREATE INDEX "course_enrollments_studentId_idx" ON "course_enrollments"("studentId");
CREATE INDEX "course_enrollments_courseId_idx" ON "course_enrollments"("courseId");
CREATE UNIQUE INDEX "course_enrollments_tenantId_studentId_courseId_key" ON "course_enrollments"("tenantId", "studentId", "courseId");
CREATE TABLE "new_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "categoryId" TEXT,
    "courseType" TEXT NOT NULL DEFAULT 'SINGLE',
    "authorName" TEXT,
    "instructorId" TEXT,
    "paymentType" TEXT NOT NULL DEFAULT 'ONE_TIME',
    "invoiceTitle" TEXT,
    "regularPrice" REAL,
    "offerPrice" REAL,
    "currency" TEXT NOT NULL DEFAULT 'BDT',
    "subscriptionDuration" INTEGER,
    "subscriptionType" TEXT,
    "autoGenerateInvoice" BOOLEAN NOT NULL DEFAULT true,
    "featuredImage" TEXT,
    "introVideoUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'DRAFT',
    "publishedAt" DATETIME,
    "scheduledAt" DATETIME,
    "metaTitle" TEXT,
    "metaDescription" TEXT,
    "metaKeywords" TEXT,
    "isFeatured" BOOLEAN NOT NULL DEFAULT false,
    "allowComments" BOOLEAN NOT NULL DEFAULT true,
    "certificateEnabled" BOOLEAN NOT NULL DEFAULT false,
    "totalTopics" INTEGER NOT NULL DEFAULT 0,
    "totalLessons" INTEGER NOT NULL DEFAULT 0,
    "totalDuration" INTEGER NOT NULL DEFAULT 0,
    "totalEnrollments" INTEGER NOT NULL DEFAULT 0,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "courses_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "courses_categoryId_fkey" FOREIGN KEY ("categoryId") REFERENCES "course_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "teachers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_courses" ("createdAt", "description", "id", "tenantId", "updatedAt") SELECT "createdAt", "description", "id", "tenantId", "updatedAt" FROM "courses";
DROP TABLE "courses";
ALTER TABLE "new_courses" RENAME TO "courses";
CREATE INDEX "courses_tenantId_status_idx" ON "courses"("tenantId", "status");
CREATE INDEX "courses_categoryId_idx" ON "courses"("categoryId");
CREATE UNIQUE INDEX "courses_tenantId_slug_key" ON "courses"("tenantId", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "course_categories_tenantId_status_idx" ON "course_categories"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "course_categories_tenantId_slug_key" ON "course_categories"("tenantId", "slug");

-- CreateIndex
CREATE INDEX "course_topics_courseId_idx" ON "course_topics"("courseId");

-- CreateIndex
CREATE INDEX "course_lessons_topicId_idx" ON "course_lessons"("topicId");

-- CreateIndex
CREATE INDEX "bundle_courses_bundleId_idx" ON "bundle_courses"("bundleId");

-- CreateIndex
CREATE INDEX "bundle_courses_courseId_idx" ON "bundle_courses"("courseId");

-- CreateIndex
CREATE UNIQUE INDEX "bundle_courses_bundleId_courseId_key" ON "bundle_courses"("bundleId", "courseId");

-- CreateIndex
CREATE INDEX "course_faqs_courseId_idx" ON "course_faqs"("courseId");

-- CreateIndex
CREATE INDEX "lesson_completions_enrollmentId_idx" ON "lesson_completions"("enrollmentId");

-- CreateIndex
CREATE INDEX "lesson_completions_lessonId_idx" ON "lesson_completions"("lessonId");

-- CreateIndex
CREATE UNIQUE INDEX "lesson_completions_enrollmentId_lessonId_key" ON "lesson_completions"("enrollmentId", "lessonId");
