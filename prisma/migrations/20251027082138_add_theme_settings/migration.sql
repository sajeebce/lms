-- CreateTable
CREATE TABLE "theme_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "themeName" TEXT NOT NULL DEFAULT 'pink-orange',
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "activeFrom" TEXT NOT NULL DEFAULT '#ec4899',
    "activeTo" TEXT NOT NULL DEFAULT '#f97316',
    "hoverFrom" TEXT NOT NULL DEFAULT '#fdf2f8',
    "hoverTo" TEXT NOT NULL DEFAULT '#fff7ed',
    "borderColor" TEXT NOT NULL DEFAULT '#fbcfe8',
    "buttonFrom" TEXT NOT NULL DEFAULT '#ec4899',
    "buttonTo" TEXT NOT NULL DEFAULT '#f97316',
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "theme_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);

-- CreateIndex
CREATE UNIQUE INDEX "theme_settings_tenantId_key" ON "theme_settings"("tenantId");
