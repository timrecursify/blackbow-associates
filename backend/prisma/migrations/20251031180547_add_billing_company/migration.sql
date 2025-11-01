-- AlterTable
ALTER TABLE "users" ADD COLUMN IF NOT EXISTS "billing_company_name" TEXT,
ADD COLUMN IF NOT EXISTS "billing_is_company" BOOLEAN NOT NULL DEFAULT false;
