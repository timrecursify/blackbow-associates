-- CreateTable
CREATE TABLE "crm_beta_signups" (
    "id" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "email" TEXT NOT NULL,
    "phone" TEXT NOT NULL,
    "company_name" TEXT NOT NULL,
    "company_website" TEXT,
    "vendor_type" TEXT,
    "message" TEXT,
    "status" TEXT NOT NULL DEFAULT 'pending',
    "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updated_at" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "crm_beta_signups_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE UNIQUE INDEX "crm_beta_signups_email_key" ON "crm_beta_signups"("email");

-- CreateIndex
CREATE INDEX "crm_beta_signups_status_idx" ON "crm_beta_signups"("status");

-- CreateIndex
CREATE INDEX "crm_beta_signups_created_at_idx" ON "crm_beta_signups"("created_at");
