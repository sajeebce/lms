-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_sections" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "cohortId" TEXT,
    "name" TEXT NOT NULL,
    "capacity" INTEGER NOT NULL,
    "note" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "sections_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "sections_cohortId_fkey" FOREIGN KEY ("cohortId") REFERENCES "cohorts" ("id") ON DELETE SET NULL ON UPDATE CASCADE
);
INSERT INTO "new_sections" ("capacity", "cohortId", "createdAt", "id", "name", "note", "tenantId", "updatedAt") SELECT "capacity", "cohortId", "createdAt", "id", "name", "note", "tenantId", "updatedAt" FROM "sections";
DROP TABLE "sections";
ALTER TABLE "new_sections" RENAME TO "sections";
CREATE UNIQUE INDEX "sections_tenantId_name_key" ON "sections"("tenantId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
