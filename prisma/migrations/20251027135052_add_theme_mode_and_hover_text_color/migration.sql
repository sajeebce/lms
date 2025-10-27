-- RedefineTables
PRAGMA defer_foreign_keys=ON;
PRAGMA foreign_keys=OFF;
CREATE TABLE "new_theme_settings" (
    "id" TEXT NOT NULL PRIMARY KEY,
    "tenantId" TEXT NOT NULL,
    "mode" TEXT NOT NULL DEFAULT 'light',
    "themeName" TEXT NOT NULL DEFAULT 'pink-orange',
    "isCustom" BOOLEAN NOT NULL DEFAULT false,
    "activeFrom" TEXT NOT NULL DEFAULT '#ec4899',
    "activeTo" TEXT NOT NULL DEFAULT '#f97316',
    "hoverFrom" TEXT NOT NULL DEFAULT '#fdf2f8',
    "hoverTo" TEXT NOT NULL DEFAULT '#fff7ed',
    "borderColor" TEXT NOT NULL DEFAULT '#fbcfe8',
    "buttonFrom" TEXT NOT NULL DEFAULT '#ec4899',
    "buttonTo" TEXT NOT NULL DEFAULT '#f97316',
    "hoverTextColor" TEXT,
    "createdAt" DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" DATETIME NOT NULL,
    CONSTRAINT "theme_settings_tenantId_fkey" FOREIGN KEY ("tenantId") REFERENCES "tenants" ("id") ON DELETE CASCADE ON UPDATE CASCADE
);
INSERT INTO "new_theme_settings" ("activeFrom", "activeTo", "borderColor", "buttonFrom", "buttonTo", "createdAt", "hoverFrom", "hoverTo", "id", "isCustom", "tenantId", "themeName", "updatedAt") SELECT "activeFrom", "activeTo", "borderColor", "buttonFrom", "buttonTo", "createdAt", "hoverFrom", "hoverTo", "id", "isCustom", "tenantId", "themeName", "updatedAt" FROM "theme_settings";
DROP TABLE "theme_settings";
ALTER TABLE "new_theme_settings" RENAME TO "theme_settings";
CREATE UNIQUE INDEX "theme_settings_tenantId_key" ON "theme_settings"("tenantId");
PRAGMA foreign_keys=ON;
PRAGMA defer_foreign_keys=OFF;
