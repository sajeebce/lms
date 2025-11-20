-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_course_topics" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "courseId" TEXT NOT NULL,
    "title" TEXT NOT NULL,
    "description" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "subjectId" TEXT,
    "chapterId" TEXT,
    "topicId" TEXT,
    "sourceType" TEXT NOT NULL DEFAULT 'CUSTOM',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_topics_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_topics_courseId_fkey" FOREIGN KEY ("courseId") REFERENCES "courses" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "course_topics_subjectId_fkey" FOREIGN KEY ("subjectId") REFERENCES "subjects" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "course_topics_chapterId_fkey" FOREIGN KEY ("chapterId") REFERENCES "chapters" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "course_topics_topicId_fkey" FOREIGN KEY ("topicId") REFERENCES "topics" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_course_topics" ("courseId", "createdAt", "description", "id", "order", "tenantId", "title", "updatedAt") SELECT "courseId", "createdAt", "description", "id", "order", "tenantId", "title", "updatedAt" FROM "course_topics";
DROP TABLE "course_topics";
ALTER TABLE "new_course_topics" RENAME TO "course_topics";
CREATE INDEX "course_topics_courseId_idx" ON "course_topics"("courseId");
CREATE INDEX "course_topics_tenantId_subjectId_idx" ON "course_topics"("tenantId", "subjectId");
CREATE INDEX "course_topics_tenantId_chapterId_idx" ON "course_topics"("tenantId", "chapterId");
CREATE INDEX "course_topics_tenantId_topicId_idx" ON "course_topics"("tenantId", "topicId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
