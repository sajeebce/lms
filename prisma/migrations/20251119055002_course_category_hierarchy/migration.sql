-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_course_categories" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "slug" TEXT NOT NULL,
    "description" TEXT,
    "icon" TEXT,
    "color" TEXT,
    "order" INTEGER NOT NULL DEFAULT 0,
    "status" TEXT NOT NULL DEFAULT 'ACTIVE',
    "parentId" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "course_categories_parentId_fkey" FOREIGN KEY ("parentId") REFERENCES "course_categories" ("id") ON DELETE SET NULL ON UPDATE CASCADE,
    CONSTRAINT "course_categories_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_course_categories" ("color", "createdAt", "description", "icon", "id", "name", "order", "slug", "status", "tenantId", "updatedAt") SELECT "color", "createdAt", "description", "icon", "id", "name", "order", "slug", "status", "tenantId", "updatedAt" FROM "course_categories";
DROP TABLE "course_categories";
ALTER TABLE "new_course_categories" RENAME TO "course_categories";
CREATE INDEX "course_categories_tenantId_status_idx" ON "course_categories"("tenantId", "status");
CREATE INDEX "course_categories_tenantId_parentId_idx" ON "course_categories"("tenantId", "parentId");
CREATE UNIQUE INDEX "course_categories_tenantId_slug_key" ON "course_categories"("tenantId", "slug");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
