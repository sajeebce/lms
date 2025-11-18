-- CreateTable
CREATE TABLE "exam_boards" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "exam_boards_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_question_sources" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "boardId" TEXT,
    "name" TEXT NOT NULL,
    "type" TEXT NOT NULL DEFAULT 'CUSTOM',
    "year" INTEGER,
    "description" TEXT,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "question_sources_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "question_sources_boardId_fkey" FOREIGN KEY ("boardId") REFERENCES "exam_boards" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_question_sources" ("createdAt", "description", "id", "name", "status", "tenantId", "type", "updatedAt", "year") SELECT "createdAt", "description", "id", "name", "status", "tenantId", "type", "updatedAt", "year" FROM "question_sources";
DROP TABLE "question_sources";
ALTER TABLE "new_question_sources" RENAME TO "question_sources";
CREATE INDEX "question_sources_tenantId_type_idx" ON "question_sources"("tenantId", "type");
CREATE UNIQUE INDEX "question_sources_tenantId_boardId_year_key" ON "question_sources"("tenantId", "boardId", "year");
CREATE UNIQUE INDEX "question_sources_tenantId_name_type_year_key" ON "question_sources"("tenantId", "name", "type", "year");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;

-- CreateIndex
CREATE UNIQUE INDEX "exam_boards_tenantId_name_key" ON "exam_boards"("tenantId", "name");
