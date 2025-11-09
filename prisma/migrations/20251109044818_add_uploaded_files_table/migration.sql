-- CreateTable
CREATE TABLE "uploaded_files" (
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
    "isPublic" BOOLEAN NOT NULL DEFAULT false,
    "uploadedBy" TEXT,
    "uploadedAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT "uploaded_files_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE INDEX "uploaded_files_tenantId_entityType_entityId_idx" ON "uploaded_files"("tenantId", "entityType", "entityId");

-- CreateIndex
CREATE INDEX "uploaded_files_tenantId_category_idx" ON "uploaded_files"("tenantId", "category");

-- CreateIndex
CREATE UNIQUE INDEX "uploaded_files_tenantId_key_key" ON "uploaded_files"("tenantId", "key");
