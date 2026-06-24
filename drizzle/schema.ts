import { bigint, decimal, int, json, mysqlEnum, mysqlTable, text, timestamp, varchar } from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  /** Testers get unlimited AI calls and Pro features regardless of subscription tier */
  isTester: int("isTester").default(0).notNull(), // 0=false, 1=true
  /** Unique referral code for this user (generated on first login) */
  referralCode: varchar("referralCode", { length: 16 }).unique(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ---------------------------------------------------------------------------
// User health profiles (onboarding data)
// ---------------------------------------------------------------------------
export const userProfiles = mysqlTable("userProfiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  age: int("age"),
  weightLbs: decimal("weightLbs", { precision: 6, scale: 2 }),
  allergies: json("allergies").$type<string[]>().default([]),
  dietaryChoices: json("dietaryChoices").$type<string[]>().default([]),
  healthConditions: json("healthConditions").$type<string[]>().default([]),
  calorieTarget: int("calorieTarget").default(2000),
  proteinTarget: int("proteinTarget").default(120),
  carbsTarget: int("carbsTarget").default(200),
  fatTarget: int("fatTarget").default(65),
  fiberTarget: int("fiberTarget").default(28),
  onboardingComplete: int("onboardingComplete").default(0), // 0=false, 1=true
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// ---------------------------------------------------------------------------
// Food logs (one row per AI-analyzed meal entry)
// ---------------------------------------------------------------------------
export const foodLogs = mysqlTable("foodLogs", {
  id: bigint("id", { mode: "number" }).autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  rawSpeech: text("rawSpeech"),
  foodName: varchar("foodName", { length: 255 }).notNull(),
  quantity: varchar("quantity", { length: 255 }),
  calories: decimal("calories", { precision: 8, scale: 2 }).default("0"),
  protein: decimal("protein", { precision: 8, scale: 2 }).default("0"),
  carbs: decimal("carbs", { precision: 8, scale: 2 }).default("0"),
  fat: decimal("fat", { precision: 8, scale: 2 }).default("0"),
  fiber: decimal("fiber", { precision: 8, scale: 2 }).default("0"),
  allergensDetected: json("allergensDetected").$type<string[]>().default([]),
  confidence: mysqlEnum("confidence", ["high", "medium", "low"]).default("medium"),
  notes: text("notes"),
  loggedAt: timestamp("loggedAt").defaultNow().notNull(),
});

export type FoodLog = typeof foodLogs.$inferSelect;
export type InsertFoodLog = typeof foodLogs.$inferInsert;

// ---------------------------------------------------------------------------
// Subscriptions (Stripe billing)
// ---------------------------------------------------------------------------
export const subscriptions = mysqlTable("subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  tier: mysqlEnum("tier", ["free", "plus", "pro"]).default("free").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 128 }),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 128 }),
  aiCallsUsedThisMonth: int("aiCallsUsedThisMonth").default(0).notNull(),
  periodStart: timestamp("periodStart").defaultNow().notNull(),
  /** Trial support: Plus trial auto-started on first login */
  trialEndsAt: timestamp("trialEndsAt"),
  trialUsed: int("trialUsed").default(0).notNull(), // 0=never used, 1=used
  /** Free months credited from referrals (each = 1 month of Pro) */
  freeMonthsRemaining: int("freeMonthsRemaining").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});

export type Subscription = typeof subscriptions.$inferSelect;
export type InsertSubscription = typeof subscriptions.$inferInsert;

// ---------------------------------------------------------------------------
// Waitlist (pre-launch email capture)
// ---------------------------------------------------------------------------
export const waitlist = mysqlTable("waitlist", {
  id: int("id").autoincrement().primaryKey(),
  email: varchar("email", { length: 320 }).notNull().unique(),
  source: varchar("source", { length: 64 }).default("landing_hero").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Waitlist = typeof waitlist.$inferSelect;
export type InsertWaitlist = typeof waitlist.$inferInsert;

// ---------------------------------------------------------------------------
// Referrals (one row per successful referred signup)
// ---------------------------------------------------------------------------
export const referrals = mysqlTable("referrals", {
  id: int("id").autoincrement().primaryKey(),
  /** The user who shared their referral code */
  referrerId: int("referrerId").notNull(),
  /** The new user who signed up using the code */
  referredUserId: int("referredUserId").notNull().unique(),
  /** The referral code that was used */
  code: varchar("code", { length: 16 }).notNull(),
  /** Whether the free month has been credited to the referrer */
  status: mysqlEnum("status", ["pending", "credited"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type Referral = typeof referrals.$inferSelect;
export type InsertReferral = typeof referrals.$inferInsert;

// ---------------------------------------------------------------------------
// Beta Invites (admin-generated single-use invite links)
// ---------------------------------------------------------------------------
export const betaInvites = mysqlTable("betaInvites", {
  id: int("id").autoincrement().primaryKey(),
  /** Unique token used in the invite URL: /beta/:code */
  code: varchar("code", { length: 32 }).notNull().unique(),
  /** Admin user who created this invite */
  createdBy: int("createdBy").notNull(),
  /** User who redeemed this invite (null until redeemed) */
  redeemedBy: int("redeemedBy"),
  redeemedAt: timestamp("redeemedAt"),
  /** Optional label/note for the invite (e.g. "For Alice - beta group 1") */
  note: varchar("note", { length: 255 }),
  /** When the invite expires (default 30 days from creation) */
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BetaInvite = typeof betaInvites.$inferSelect;
export type InsertBetaInvite = typeof betaInvites.$inferInsert;

// ---------------------------------------------------------------------------
// Beta Feedback (submitted by beta testers via the in-app feedback form)
// ---------------------------------------------------------------------------
export const betaFeedback = mysqlTable("betaFeedback", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  /** 1–5 star rating */
  rating: int("rating").notNull(),
  /** Category of feedback */
  category: mysqlEnum("category", ["general", "bug", "feature_request", "ux", "performance"]).default("general").notNull(),
  /** Free-text feedback message */
  message: text("message").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});

export type BetaFeedback = typeof betaFeedback.$inferSelect;
export type InsertBetaFeedback = typeof betaFeedback.$inferInsert;