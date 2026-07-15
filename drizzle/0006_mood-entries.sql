CREATE TYPE "public"."mood_source" AS ENUM('manual_checkin', 'chat_extracted', 'retrospective');--> statement-breakpoint
CREATE TABLE "moodEntries" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"source" "mood_source" NOT NULL,
	"feelingTags" jsonb DEFAULT '[]'::jsonb,
	"contextTags" jsonb DEFAULT '[]'::jsonb,
	"energy" integer,
	"ease" integer,
	"intensity" integer,
	"note" text,
	"linkedFoodLogId" bigint,
	"sourceText" text,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "moodExtractionEnabled" integer DEFAULT 1 NOT NULL;--> statement-breakpoint
CREATE INDEX "mood_entries_user_id_idx" ON "moodEntries" USING btree ("userId");--> statement-breakpoint
CREATE INDEX "mood_entries_created_at_idx" ON "moodEntries" USING btree ("createdAt");