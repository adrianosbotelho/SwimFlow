-- Alter users table for auth providers and email verification
ALTER TABLE "users"
  ALTER COLUMN "password_hash" DROP NOT NULL;

ALTER TABLE "users"
  ADD COLUMN IF NOT EXISTS "auth_provider" VARCHAR(50) NOT NULL DEFAULT 'local',
  ADD COLUMN IF NOT EXISTS "google_id" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "email_verified" BOOLEAN NOT NULL DEFAULT false,
  ADD COLUMN IF NOT EXISTS "email_verification_token" VARCHAR(255),
  ADD COLUMN IF NOT EXISTS "email_verification_expires" TIMESTAMP;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'users_google_id_key'
  ) THEN
    ALTER TABLE "users" ADD CONSTRAINT "users_google_id_key" UNIQUE ("google_id");
  END IF;
END$$;
