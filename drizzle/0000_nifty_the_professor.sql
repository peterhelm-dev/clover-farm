CREATE TYPE "public"."confidence" AS ENUM('high', 'medium', 'low');--> statement-breakpoint
CREATE TYPE "public"."feedback_category" AS ENUM('general', 'bug', 'feature_request', 'ux', 'performance');--> statement-breakpoint
CREATE TYPE "public"."referral_status" AS ENUM('pending', 'credited');--> statement-breakpoint
CREATE TYPE "public"."role" AS ENUM('user', 'admin');--> statement-breakpoint
CREATE TYPE "public"."tier" AS ENUM('free', 'plus', 'pro');--> statement-breakpoint
CREATE TABLE "appSettings" (
	"id" serial PRIMARY KEY NOT NULL,
	"inviteOnly" integer DEFAULT 0 NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "betaFeedback" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"rating" integer NOT NULL,
	"category" "feedback_category" DEFAULT 'general' NOT NULL,
	"message" text NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "betaInvites" (
	"id" serial PRIMARY KEY NOT NULL,
	"code" varchar(32) NOT NULL,
	"createdBy" integer NOT NULL,
	"redeemedBy" integer,
	"redeemedAt" timestamp,
	"note" varchar(255),
	"expiresAt" timestamp NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "betaInvites_code_unique" UNIQUE("code")
);
--> statement-breakpoint
CREATE TABLE "foodLogs" (
	"id" bigserial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"rawSpeech" text,
	"imageUrl" text,
	"foodName" varchar(255) NOT NULL,
	"quantity" varchar(255),
	"calories" numeric(8, 2) DEFAULT '0',
	"protein" numeric(8, 2) DEFAULT '0',
	"carbs" numeric(8, 2) DEFAULT '0',
	"fat" numeric(8, 2) DEFAULT '0',
	"fiber" numeric(8, 2) DEFAULT '0',
	"allergensDetected" jsonb DEFAULT '[]'::jsonb,
	"confidence" "confidence" DEFAULT 'medium',
	"notes" text,
	"loggedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "mealPlans" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"weekStart" varchar(10) NOT NULL,
	"meals" jsonb DEFAULT '[]'::jsonb,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL
);
--> statement-breakpoint
CREATE TABLE "referrals" (
	"id" serial PRIMARY KEY NOT NULL,
	"referrerId" integer NOT NULL,
	"referredUserId" integer NOT NULL,
	"code" varchar(16) NOT NULL,
	"status" "referral_status" DEFAULT 'pending' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "referrals_referredUserId_unique" UNIQUE("referredUserId")
);
--> statement-breakpoint
CREATE TABLE "subscriptions" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"tier" "tier" DEFAULT 'free' NOT NULL,
	"stripeCustomerId" varchar(128),
	"stripeSubscriptionId" varchar(128),
	"aiCallsUsedThisMonth" integer DEFAULT 0 NOT NULL,
	"periodStart" timestamp DEFAULT now() NOT NULL,
	"trialEndsAt" timestamp,
	"trialUsed" integer DEFAULT 0 NOT NULL,
	"freeMonthsRemaining" integer DEFAULT 0 NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "subscriptions_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "userProfiles" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"age" integer,
	"weightLbs" numeric(6, 2),
	"allergies" jsonb DEFAULT '[]'::jsonb,
	"dietaryChoices" jsonb DEFAULT '[]'::jsonb,
	"healthConditions" jsonb DEFAULT '[]'::jsonb,
	"calorieTarget" integer DEFAULT 2000,
	"proteinTarget" integer DEFAULT 120,
	"carbsTarget" integer DEFAULT 200,
	"fatTarget" integer DEFAULT 65,
	"fiberTarget" integer DEFAULT 28,
	"onboardingComplete" integer DEFAULT 0,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "userProfiles_userId_unique" UNIQUE("userId")
);
--> statement-breakpoint
CREATE TABLE "users" (
	"id" serial PRIMARY KEY NOT NULL,
	"openId" varchar(64) NOT NULL,
	"name" text,
	"email" varchar(320),
	"loginMethod" varchar(64),
	"role" "role" DEFAULT 'user' NOT NULL,
	"isTester" integer DEFAULT 0 NOT NULL,
	"referralCode" varchar(16),
	"createdAt" timestamp DEFAULT now() NOT NULL,
	"updatedAt" timestamp DEFAULT now() NOT NULL,
	"lastSignedIn" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "users_openId_unique" UNIQUE("openId"),
	CONSTRAINT "users_referralCode_unique" UNIQUE("referralCode")
);
--> statement-breakpoint
CREATE TABLE "waitlist" (
	"id" serial PRIMARY KEY NOT NULL,
	"email" varchar(320) NOT NULL,
	"source" varchar(64) DEFAULT 'landing_hero' NOT NULL,
	"createdAt" timestamp DEFAULT now() NOT NULL,
	CONSTRAINT "waitlist_email_unique" UNIQUE("email")
);
--> statement-breakpoint
CREATE TABLE "waterIntake" (
	"id" serial PRIMARY KEY NOT NULL,
	"userId" integer NOT NULL,
	"date" varchar(10) NOT NULL,
	"amount" integer NOT NULL,
	"goal" integer DEFAULT 2000 NOT NULL,
	"timestamp" timestamp DEFAULT now() NOT NULL
);
