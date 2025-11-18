/*
  Warnings:

  - A unique constraint covering the columns `[tenantId,subjectId,classId,order]` on the table `chapters` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,order]` on the table `subjects` will be added. If there are existing duplicate values, this will fail.
  - A unique constraint covering the columns `[tenantId,chapterId,order]` on the table `topics` will be added. If there are existing duplicate values, this will fail.

*/
-- CreateIndex
CREATE UNIQUE INDEX "chapters_tenantId_subjectId_classId_order_key" ON "chapters"("tenantId", "subjectId", "classId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "subjects_tenantId_order_key" ON "subjects"("tenantId", "order");

-- CreateIndex
CREATE UNIQUE INDEX "topics_tenantId_chapterId_order_key" ON "topics"("tenantId", "chapterId", "order");
