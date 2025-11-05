-- CreateTable
CREATE TABLE "subjects" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "subjects_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "chapters" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "subjectId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "chapters_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chapters_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "chapters_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "chapterId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "topics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "topics_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "question_sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "year" INTEGER,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "question_sources_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateTable
CREATE TABLE "questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "sourceId" TEXT,
    "questionText" TEXT NOT NULL,
    "questionType" TEXT NOT NULL DEFAULT 'MCQ',
    "options" TEXT,
    "correctAnswer" TEXT,
    "explanation" TEXT,
    "difficulty" TEXT NOT NULL DEFAULT 'MEDIUM',
    "marks" REAL NOT NULL DEFAULT 1,
    "negativeMarks" REAL NOT NULL DEFAULT 0,
    "imageUrl" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "questions_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "questions_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "questions_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "question_sources" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);

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
INSERT INTO "new_courses" ("allowComments", "authorName", "autoGenerateInvoice", "categoryId", "certificateEnabled", "courseType", "createdAt", "currency", "description", "featuredImage", "id", "instructorId", "introVideoUrl", "invoiceTitle", "isFeatured", "metaDescription", "metaKeywords", "metaTitle", "offerPrice", "paymentType", "publishedAt", "regularPrice", "scheduledAt", "shortDescription", "slug", "status", "subscriptionDuration", "subscriptionType", "tenantId", "title", "totalDuration", "totalEnrollments", "totalLessons", "totalTopics", "updatedAt") SELECT "allowComments", "authorName", "autoGenerateInvoice", "categoryId", "certificateEnabled", "courseType", "createdAt", "currency", "description", "featuredImage", "id", "instructorId", "introVideoUrl", "invoiceTitle", "isFeatured", "metaDescription", "metaKeywords", "metaTitle", "offerPrice", "paymentType", "publishedAt", "regularPrice", "scheduledAt", "shortDescription", "slug", "status", "subscriptionDuration", "subscriptionType", "tenantId", "title", "totalDuration", "totalEnrollments", "totalLessons", "totalTopics", "updatedAt" FROM "courses";
DROP TABLE "courses";
ALTER TABLE "new_courses" RENAME TO "courses";
CREATE INDEX "courses_tenantId_status_idx" ON "courses"("tenantId", "status");
CREATE INDEX "courses_categoryId_idx" ON "courses"("categoryId");
CREATE INDEX "courses_tenantId_classId_subjectId_streamId_idx" ON "courses"("tenantId", "classId", "subjectId", "streamId");
CREATE UNIQUE INDEX "courses_tenantId_slug_key" ON "courses"("tenantId", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE INDEX "subjects_tenantId_status_idx" ON "subjects"("tenantId", "status");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_tenantId_name_key" ON "subjects"("tenantId", "name");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_tenantId_code_key" ON "subjects"("tenantId", "code");

-- CreateIndex
CREATE INDEX "chapters_tenantId_subjectId_classId_idx" ON "chapters"("tenantId", "subjectId", "classId");

-- CreateIndex
CREATE UNIQUE INDEX "chapters_tenantId_subjectId_classId_name_key" ON "chapters"("tenantId", "subjectId", "classId", "name");

-- CreateIndex
CREATE INDEX "topics_tenantId_chapterId_idx" ON "topics"("tenantId", "chapterId");

-- CreateIndex
CREATE UNIQUE INDEX "topics_tenantId_chapterId_name_key" ON "topics"("tenantId", "chapterId", "name");

-- CreateIndex
CREATE INDEX "question_sources_tenantId_type_idx" ON "question_sources"("tenantId", "type");

-- CreateIndex
CREATE UNIQUE INDEX "question_sources_tenantId_name_key" ON "question_sources"("tenantId", "name");

-- CreateIndex
CREATE INDEX "questions_tenantId_topicId_idx" ON "questions"("tenantId", "topicId");

-- CreateIndex
CREATE INDEX "questions_tenantId_sourceId_idx" ON "questions"("tenantId", "sourceId");

-- CreateIndex
CREATE INDEX "questions_tenantId_difficulty_idx" ON "questions"("tenantId", "difficulty");

-- CreateIndex
CREATE INDEX "questions_tenantId_questionType_idx" ON "questions"("tenantId", "questionType");
