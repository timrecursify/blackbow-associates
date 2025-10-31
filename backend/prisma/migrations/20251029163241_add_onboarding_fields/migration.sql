-- AlterTable
ALTER TABLE "users" ADD COLUMN     "about" TEXT,
ADD COLUMN     "location" TEXT,
ADD COLUMN     "onboarding_completed" BOOLEAN NOT NULL DEFAULT false;
