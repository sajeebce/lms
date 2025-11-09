/*
  Warnings:

  - Added the required column `updatedAt` to the `uploaded_files` table without a default value. This is not possible if the table is not empty.

*/
-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_uploaded_files" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "url" TEXT NOT NULL,
    "fileName" TEXT NOT NULL,
    "fileSize" INTEGER NOT NULL,
    "mimeType" TEXT NOT NULL,
    "category" TEXT NOT NULL,
    "entityType" TEXT NOT NULL,
    "entityId" TEXT NOT NULL,
    "description" TEXT,
    "author" TEXT,
    "license" TEXT,
    "tags" TEXT,
    "folder" TEXT,
    "altText" TEXT,
    "width" INTEGER,
    "height" INTEGER,
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "uploadedBy" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "uploaded_files_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_uploaded_files" ("category", "entityId", "entityType", "fileName", "fileSize", "id", "isPublic", "key", "mimeType", "tenantId", "uploadedAt", "uploadedBy", "url") SELECT "category", "entityId", "entityType", "fileName", "fileSize", "id", "isPublic", "key", "mimeType", "tenantId", "uploadedAt", "uploadedBy", "url" FROM "uploaded_files";
DROP TABLE "uploaded_files";
ALTER TABLE "new_uploaded_files" RENAME TO "uploaded_files";
CREATE INDEX "uploaded_files_tenantId_entityType_entityId_idx" ON "uploaded_files"("tenantId", "entityType", "entityId");
CREATE INDEX "uploaded_files_tenantId_category_idx" ON "uploaded_files"("tenantId", "category");
CREATE INDEX "uploaded_files_tenantId_uploadedBy_idx" ON "uploaded_files"("tenantId", "uploadedBy");
CREATE INDEX "uploaded_files_tenantId_folder_idx" ON "uploaded_files"("tenantId", "folder");
CREATE UNIQUE INDEX "uploaded_files_tenantId_key_key" ON "uploaded_files"("tenantId", "key");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
