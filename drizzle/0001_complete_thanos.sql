CREATE TYPE "public"."log_method" AS ENUM('voice', 'photo', 'text');--> statement-breakpoint
CREATE TYPE "public"."log_status" AS ENUM('success', 'failed');--> statement-breakpoint
ALTER TABLE "foodLogs" ADD COLUMN "logMethod" "log_method";--> statement-breakpoint
ALTER TABLE "foodLogs" ADD COLUMN "status" "log_status" DEFAULT 'success' NOT NULL;--> statement-breakpoint
ALTER TABLE "users" ADD COLUMN "timezone" varchar(64);