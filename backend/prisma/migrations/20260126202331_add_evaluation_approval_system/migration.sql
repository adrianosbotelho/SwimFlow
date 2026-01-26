-- CreateEnum
CREATE TYPE "evaluation_type" AS ENUM ('REGULAR', 'LEVEL_PROGRESSION');

-- AlterTable
ALTER TABLE "evaluations" ADD COLUMN     "approval_notes" TEXT,
ADD COLUMN     "evaluation_type" "evaluation_type" NOT NULL DEFAULT 'REGULAR',
ADD COLUMN     "is_approved" BOOLEAN,
ADD COLUMN     "target_level" "level";
