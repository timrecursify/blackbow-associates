-- AlterTable
ALTER TABLE "leads" ADD COLUMN     "active" BOOLEAN NOT NULL DEFAULT true,
ADD COLUMN     "comment" TEXT,
ADD COLUMN     "conversion_page_url" TEXT,
ADD COLUMN     "description" TEXT,
ADD COLUMN     "email" TEXT,
ADD COLUMN     "ethnic_religious" TEXT,
ADD COLUMN     "event_id" TEXT,
ADD COLUMN     "expected_value" DECIMAL(10,2),
ADD COLUMN     "fbclid" TEXT,
ADD COLUMN     "first_name" TEXT,
ADD COLUMN     "gclid" TEXT,
ADD COLUMN     "last_name" TEXT,
ADD COLUMN     "person_name" TEXT,
ADD COLUMN     "phone" TEXT,
ADD COLUMN     "pixel_id" TEXT,
ADD COLUMN     "project_id" TEXT,
ADD COLUMN     "session_id" TEXT,
ADD COLUMN     "source" TEXT,
ADD COLUMN     "sp_utm_campaign" TEXT,
ADD COLUMN     "utm_content" TEXT,
ADD COLUMN     "utm_medium" TEXT,
ADD COLUMN     "utm_term" TEXT,
ALTER COLUMN "location" DROP NOT NULL,
ALTER COLUMN "masked_info" DROP NOT NULL,
ALTER COLUMN "full_info" DROP NOT NULL;

-- CreateIndex
CREATE INDEX "leads_state_idx" ON "leads"("state");

-- CreateIndex
CREATE INDEX "leads_active_idx" ON "leads"("active");

-- CreateIndex
CREATE INDEX "leads_pipedrive_deal_id_idx" ON "leads"("pipedrive_deal_id");
