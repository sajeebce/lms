-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_courses" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "shortDescription" TEXT,
    "categoryId" TEXT,
    "courseType" TEXT NOT NULL DEFAULT 'SINGLE',
    "classId" TEXT,
    "subjectId" TEXT,
    "streamId" TEXT,
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
    "introVideoAutoplay" BOOLEAN NOT NULL DEFAULT false,
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
    CONSTRAINT "courses_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "courses_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "courses_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "streams" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "courses_instructorId_fkey" FOREIGN KEY ("instructorId") REFERENCES "teachers" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_courses" ("allowComments", "authorName", "autoGenerateInvoice", "categoryId", "certificateEnabled", "classId", "courseType", "createdAt", "currency", "description", "featuredImage", "id", "instructorId", "introVideoUrl", "invoiceTitle", "isFeatured", "metaDescription", "metaKeywords", "metaTitle", "offerPrice", "paymentType", "publishedAt", "regularPrice", "scheduledAt", "shortDescription", "slug", "status", "streamId", "subjectId", "subscriptionDuration", "subscriptionType", "tenantId", "title", "totalDuration", "totalEnrollments", "totalLessons", "totalTopics", "updatedAt") SELECT "allowComments", "authorName", "autoGenerateInvoice", "categoryId", "certificateEnabled", "classId", "courseType", "createdAt", "currency", "description", "featuredImage", "id", "instructorId", "introVideoUrl", "invoiceTitle", "isFeatured", "metaDescription", "metaKeywords", "metaTitle", "offerPrice", "paymentType", "publishedAt", "regularPrice", "scheduledAt", "shortDescription", "slug", "status", "streamId", "subjectId", "subscriptionDuration", "subscriptionType", "tenantId", "title", "totalDuration", "totalEnrollments", "totalLessons", "totalTopics", "updatedAt" FROM "courses";
DROP TABLE "courses";
ALTER TABLE "new_courses" RENAME TO "courses";
CREATE INDEX "courses_tenantId_status_idx" ON "courses"("tenantId", "status");
CREATE INDEX "courses_categoryId_idx" ON "courses"("categoryId");
CREATE INDEX "courses_tenantId_classId_subjectId_streamId_idx" ON "courses"("tenantId", "classId", "subjectId", "streamId");
CREATE UNIQUE INDEX "courses_tenantId_slug_key" ON "courses"("tenantId", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
