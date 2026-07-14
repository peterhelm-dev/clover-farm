CREATE TYPE "public"."primary_goal" AS ENUM('weight_management', 'muscle_gain', 'protein_focus', 'energy_levels', 'blood_sugar_awareness', 'digestive_health', 'general_awareness');--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "primaryGoal" "primary_goal" DEFAULT 'general_awareness' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reminderEnabled" integer DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "reminderTime" varchar(5);--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "weeklyExportEmail" integer DEFAULT 0 NOT NULL;