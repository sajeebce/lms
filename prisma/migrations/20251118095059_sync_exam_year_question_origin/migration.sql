-- CreateTable
CREATE TABLE "exam_years" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "year" INTEGER NOT NULL,
    "label" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "exam_years_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_questions" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "topicId" TEXT NOT NULL,
    "sourceId" TEXT,
    "institutionId" TEXT,
    "examYearId" TEXT,
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
    CONSTRAINT "questions_sourceId_fkey" FOREIGN KEY ("sourceId") REFERENCES "question_sources" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "questions_institutionId_fkey" FOREIGN KEY ("institutionId") REFERENCES "exam_boards" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "questions_examYearId_fkey" FOREIGN KEY ("examYearId") REFERENCES "exam_years" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_questions" ("correctAnswer", "createdAt", "difficulty", "explanation", "id", "imageUrl", "marks", "negativeMarks", "options", "questionText", "questionType", "sourceId", "status", "tenantId", "topicId", "updatedAt") SELECT "correctAnswer", "createdAt", "difficulty", "explanation", "id", "imageUrl", "marks", "negativeMarks", "options", "questionText", "questionType", "sourceId", "status", "tenantId", "topicId", "updatedAt" FROM "questions";
DROP TABLE "questions";
ALTER TABLE "new_questions" RENAME TO "questions";
CREATE INDEX "questions_tenantId_topicId_idx" ON "questions"("tenantId", "topicId");
CREATE INDEX "questions_tenantId_sourceId_idx" ON "questions"("tenantId", "sourceId");
CREATE INDEX "questions_tenantId_institutionId_idx" ON "questions"("tenantId", "institutionId");
CREATE INDEX "questions_tenantId_examYearId_idx" ON "questions"("tenantId", "examYearId");
CREATE INDEX "questions_tenantId_difficulty_idx" ON "questions"("tenantId", "difficulty");
CREATE INDEX "questions_tenantId_questionType_idx" ON "questions"("tenantId", "questionType");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "exam_years_tenantId_year_key" ON "exam_years"("tenantId", "year");
