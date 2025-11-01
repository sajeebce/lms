-- AlterTable: Update storage settings fields
-- Drop old columns
ALTER TABLE "tenant_settings" DROP COLUMN "storageProvider";
ALTER TABLE "tenant_settings" DROP COLUMN "r2AccountId";
ALTER TABLE "tenant_settings" DROP COLUMN "r2AccessKeyId";
ALTER TABLE "tenant_settings" DROP COLUMN "r2SecretKey";
ALTER TABLE "tenant_settings" DROP COLUMN "r2BucketName";
ALTER TABLE "tenant_settings" DROP COLUMN "r2PublicUrl";

-- Add new columns
ALTER TABLE "tenant_settings" ADD COLUMN "storageType" TEXT DEFAULT 'LOCAL';
ALTER TABLE "tenant_settings" ADD COLUMN "storageLocalPath" TEXT DEFAULT './storage';
ALTER TABLE "tenant_settings" ADD COLUMN "storageR2AccountId" TEXT;
ALTER TABLE "tenant_settings" ADD COLUMN "storageR2AccessKeyId" TEXT;
ALTER TABLE "tenant_settings" ADD COLUMN "storageR2SecretAccessKey" TEXT;
ALTER TABLE "tenant_settings" ADD COLUMN "storageR2Bucket" TEXT;
ALTER TABLE "tenant_settings" ADD COLUMN "storageR2PublicUrl" TEXT;

