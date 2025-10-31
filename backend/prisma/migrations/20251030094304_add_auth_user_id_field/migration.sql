-- AlterTable
ALTER TABLE "users" ADD COLUMN "auth_user_id" TEXT;
ALTER TABLE "users" ALTER COLUMN "clerk_user_id" DROP NOT NULL;

-- CreateIndex
CREATE UNIQUE INDEX "users_auth_user_id_key" ON "users"("auth_user_id");
