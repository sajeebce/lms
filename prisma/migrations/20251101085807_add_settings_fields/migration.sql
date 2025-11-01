-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_tenant_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "enableCohorts" BOOLEAN NOT NULL DEFAULT true,
    "instituteName" TEXT,
    "logoUrl" TEXT,
    "signatureUrl" TEXT,
    "currencyName" TEXT DEFAULT 'USD',
    "currencySymbol" TEXT DEFAULT '$',
    "countryCode" TEXT DEFAULT 'US',
    "phonePrefix" TEXT DEFAULT '+1',
    "emailEnabled" BOOLEAN NOT NULL DEFAULT false,
    "smtpHost" TEXT,
    "smtpPort" INTEGER,
    "smtpUser" TEXT,
    "smtpPassword" TEXT,
    "smtpFromEmail" TEXT,
    "smtpFromName" TEXT,
    "smtpEncryption" TEXT DEFAULT 'tls',
    "emailTemplates" TEXT,
    "paymentMethods" TEXT,
    "storageProvider" TEXT DEFAULT 'local',
    "r2AccountId" TEXT,
    "r2AccessKeyId" TEXT,
    "r2SecretKey" TEXT,
    "r2BucketName" TEXT,
    "r2PublicUrl" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "tenant_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_tenant_settings" ("createdAt", "enableCohorts", "id", "tenantId", "updatedAt") SELECT "createdAt", "enableCohorts", "id", "tenantId", "updatedAt" FROM "tenant_settings";
DROP TABLE "tenant_settings";
ALTER TABLE "new_tenant_settings" RENAME TO "tenant_settings";
CREATE UNIQUE INDEX "tenant_settings_tenantId_key" ON "tenant_settings"("tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
