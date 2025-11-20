-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_course_lessons" (
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
    "allowDownload" BOOLEAN NOT NULL DEFAULT true,
    "scheduledAt" DATETIME,
    "attachmentsJson" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_lessons_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_lessons_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "course_topics" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_course_lessons" ("accessType", "createdAt", "description", "documentPath", "duration", "id", "iframeUrl", "isPreview", "lessonType", "order", "password", "tenantId", "textContent", "title", "topicId", "updatedAt", "videoFilePath", "videoUrl") SELECT "accessType", "createdAt", "description", "documentPath", "duration", "id", "iframeUrl", "isPreview", "lessonType", "order", "password", "tenantId", "textContent", "title", "topicId", "updatedAt", "videoFilePath", "videoUrl" FROM "course_lessons";
DROP TABLE "course_lessons";
ALTER TABLE "new_course_lessons" RENAME TO "course_lessons";
CREATE INDEX "course_lessons_topicId_idx" ON "course_lessons"("topicId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
