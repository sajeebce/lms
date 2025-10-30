-- CreateTable: CohortSection junction table
CREATE TABLE "cohort_sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "cohortId" TEXT NOT NULL,
    "sectionId" TEXT NOT NULL,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cohort_sections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cohort_sections_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cohort_sections_sectionId_fkey" FOREIGN KEY ("sectionId") REFERENCES "sections" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "cohort_sections_tenantId_cohortId_sectionId_key" ON "cohort_sections"("tenantId", "cohortId", "sectionId");

-- Data Migration: Migrate existing cohortId relationships to junction table
INSERT INTO "cohort_sections" ("id", "tenantId", "cohortId", "sectionId", "createdAt", "updatedAt")
SELECT 
    lower(hex(randomblob(16))),  -- Generate random CUID-like ID
    s."tenantId",
    s."cohortId",
    s."id",
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
FROM "sections" s
WHERE s."cohortId" IS NOT NULL;

-- Drop the old unique constraint on sections table
DROP INDEX IF EXISTS "sections_tenantId_cohortId_name_key";

-- AlterTable: Remove cohortId column from sections table
-- First, create a new table without cohortId
CREATE TABLE "sections_new" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL DEFAULT 0,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- Copy data from old table to new table
INSERT INTO "sections_new" ("id", "tenantId", "name", "capacity", "note", "createdAt", "updatedAt")
SELECT "id", "tenantId", "name", "capacity", "note", "createdAt", "updatedAt"
FROM "sections";

-- Drop old table
DROP TABLE "sections";

-- Rename new table to sections
ALTER TABLE "sections_new" RENAME TO "sections";

-- CreateIndex: Section name must be unique per tenant
CREATE UNIQUE INDEX "sections_tenantId_name_key" ON "sections"("tenantId", "name");

