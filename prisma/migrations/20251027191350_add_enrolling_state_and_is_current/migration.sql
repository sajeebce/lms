-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_academic_years" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "code" TEXT NOT NULL,
    "startDate" DATETIME NOT NULL,
    "endDate" DATETIME NOT NULL,
    "state" TEXT NOT NULL DEFAULT 'PLANNED',
    "isCurrent" BOOLEAN NOT NULL DEFAULT false,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "academic_years_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_academic_years" ("code", "createdAt", "endDate", "id", "name", "startDate", "state", "tenantId", "updatedAt") SELECT "code", "createdAt", "endDate", "id", "name", "startDate", "state", "tenantId", "updatedAt" FROM "academic_years";
DROP TABLE "academic_years";
ALTER TABLE "new_academic_years" RENAME TO "academic_years";
CREATE UNIQUE INDEX "academic_years_tenantId_code_key" ON "academic_years"("tenantId", "code");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
