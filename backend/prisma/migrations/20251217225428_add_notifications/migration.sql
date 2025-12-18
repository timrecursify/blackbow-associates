-- Manual migration: add notifications (non-destructive)

DO $$
BEGIN
  CREATE TYPE "NotificationType" AS ENUM (
    'DEPOSIT_CONFIRMED',
    'LEAD_PURCHASED',
    'PAYOUT_REQUESTED',
    'PAYOUT_PAID',
    'FEEDBACK_REWARD',
    'REFERRAL_COMMISSION_EARNED'
  );
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE TABLE IF NOT EXISTS "notifications" (
  "id" TEXT NOT NULL,
  "user_id" TEXT NOT NULL,
  "type" "NotificationType" NOT NULL,
  "title" TEXT NOT NULL,
  "body" TEXT NOT NULL,
  "link_url" TEXT,
  "metadata" JSONB,
  "read_at" TIMESTAMP(3),
  "dismissed_at" TIMESTAMP(3),
  "created_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
  CONSTRAINT "notifications_pkey" PRIMARY KEY ("id")
);

DO $$
BEGIN
  ALTER TABLE "notifications"
    ADD CONSTRAINT "notifications_user_id_fkey"
    FOREIGN KEY ("user_id") REFERENCES "users"("id")
    ON DELETE CASCADE ON UPDATE CASCADE;
EXCEPTION
  WHEN duplicate_object THEN NULL;
END $$;

CREATE INDEX IF NOT EXISTS "notifications_user_id_created_at_idx" ON "notifications"("user_id", "created_at");
CREATE INDEX IF NOT EXISTS "notifications_user_id_read_at_idx" ON "notifications"("user_id", "read_at");
CREATE INDEX IF NOT EXISTS "notifications_user_id_dismissed_at_idx" ON "notifications"("user_id", "dismissed_at");
CREATE INDEX IF NOT EXISTS "notifications_type_created_at_idx" ON "notifications"("type", "created_at");
