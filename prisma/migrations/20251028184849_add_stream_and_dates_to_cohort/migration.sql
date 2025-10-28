-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_cohorts" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "yearId" TEXT NOT NULL,
    "classId" TEXT NOT NULL,
    "streamId" TEXT,
    "branchId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "status" TEXT NOT NULL DEFAULT 'PLANNED',
    "enrollmentOpen" BOOLEAN NOT NULL DEFAULT false,
    "startDate" DATETIME,
    "endDate" DATETIME,
    "archivedAt" DATETIME,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "cohorts_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE,
    CONSTRAINT "cohorts_yearId_fkey" FOREIGN KEY ("yearId") REFERENCES "academic_years" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cohorts_classId_fkey" FOREIGN KEY ("classId") REFERENCES "classes" ("id") ON DELETE RESTRICT ON UPDATE CASCADE,
    CONSTRAINT "cohorts_streamId_fkey" FOREIGN KEY ("streamId") REFERENCES "streams" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "cohorts_branchId_fkey" FOREIGN KEY ("branchId") REFERENCES "branches" ("id") ON DELETE RESTRICT ON UPDATE CASCADE
);
INSERT INTO "new_cohorts" ("branchId", "classId", "createdAt", "enrollmentOpen", "id", "name", "status", "tenantId", "updatedAt", "yearId") SELECT "branchId", "classId", "createdAt", "enrollmentOpen", "id", "name", "status", "tenantId", "updatedAt", "yearId" FROM "cohorts";
DROP TABLE "cohorts";
ALTER TABLE "new_cohorts" RENAME TO "cohorts";
CREATE UNIQUE INDEX "cohorts_tenantId_yearId_classId_streamId_branchId_name_key" ON "cohorts"("tenantId", "yearId", "classId", "streamId", "branchId", "name");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
