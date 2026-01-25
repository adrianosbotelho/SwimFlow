/*
  Warnings:

  - You are about to drop the column `professor_id` on the `classes` table. All the data in the column will be lost.
  - Added the required column `professor_id` to the `class_schedules` table without a default value. This is not possible if the table is not empty.

*/

-- First, add the professor_id column to class_schedules as nullable
ALTER TABLE "class_schedules" ADD COLUMN "professor_id" UUID;

-- Copy the professor_id from classes to all their schedules
UPDATE "class_schedules" 
SET "professor_id" = "classes"."professor_id"
FROM "classes" 
WHERE "class_schedules"."class_id" = "classes"."id";

-- Now make the column NOT NULL since all rows have values
ALTER TABLE "class_schedules" ALTER COLUMN "professor_id" SET NOT NULL;

-- Add the foreign key constraint
ALTER TABLE "class_schedules" ADD CONSTRAINT "class_schedules_professor_id_fkey" FOREIGN KEY ("professor_id") REFERENCES "users"("id") ON DELETE RESTRICT ON UPDATE CASCADE;

-- Drop the old foreign key and column from classes
ALTER TABLE "classes" DROP CONSTRAINT "classes_professor_id_fkey";
ALTER TABLE "classes" DROP COLUMN "professor_id";

-- Drop old indexes that are no longer needed
DROP INDEX IF EXISTS "idx_classes_professor";
DROP INDEX IF EXISTS "idx_evaluations_student_date";
DROP INDEX IF EXISTS "idx_level_history_student_changed_at";
DROP INDEX IF EXISTS "idx_students_last_evaluation";
DROP INDEX IF EXISTS "idx_students_level";
DROP INDEX IF EXISTS "idx_trainings_class_date";
