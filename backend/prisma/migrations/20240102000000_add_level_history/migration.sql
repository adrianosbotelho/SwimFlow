-- CreateTable
CREATE TABLE "level_history" (
    "id" UUID NOT NULL DEFAULT gen_random_uuid(),
    "student_id" UUID NOT NULL,
    "from_level" "level",
    "to_level" "level" NOT NULL,
    "changed_at" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "changed_by" UUID,
    "reason" TEXT,

    CONSTRAINT "level_history_pkey" PRIMARY KEY ("id")
);

-- AddForeignKey
ALTER TABLE "level_history" ADD CONSTRAINT "level_history_student_id_fkey" FOREIGN KEY ("student_id") REFERENCES "students"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- CreateIndex
CREATE INDEX "idx_level_history_student_changed_at" ON "level_history"("student_id", "changed_at");