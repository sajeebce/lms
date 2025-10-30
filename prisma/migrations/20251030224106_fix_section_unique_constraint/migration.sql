-- DropIndex
DROP INDEX "sections_tenantId_name_key";

-- CreateIndex
CREATE UNIQUE INDEX "sections_tenantId_cohortId_name_key" ON "sections"("tenantId", "cohortId", "name");

