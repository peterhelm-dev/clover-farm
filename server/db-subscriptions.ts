import { getDb } from "./db";
import { subscriptions } from "../drizzle/schema";
import { eq } from "drizzle-orm";

/**
 * Get or create a subscription record for a user
 */
export async function getOrCreateSubscription(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  let sub = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  if (sub.length > 0) {
    const existing = sub[0];
    // Auto-downgrade expired trials to free tier
    if (existing.trialEndsAt && new Date(existing.trialEndsAt) < new Date() && existing.tier === "plus" && existing.trialUsed === 1 && !existing.stripeSubscriptionId) {
      await db.update(subscriptions).set({ tier: "free" }).where(eq(subscriptions.userId, userId));
      return { ...existing, tier: "free" as const };
    }
    return existing;
  }

  // Create a new subscription with a 14-day Plus trial for new users
  const db2 = await getDb();
  if (!db2) throw new Error("Database not available");

  const trialEndsAt = new Date();
  trialEndsAt.setDate(trialEndsAt.getDate() + 14);

  await db2
    .insert(subscriptions)
    .values({
      userId,
      tier: "plus",          // trial starts on Plus
      aiCallsUsedThisMonth: 0,
      periodStart: new Date(),
      trialEndsAt,
      trialUsed: 1,           // mark trial as used so it can't be restarted
      freeMonthsRemaining: 0,
    });

  // Fetch and return the created subscription
  const created = await db2
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return created[0];
}

/**
 * Get subscription by user ID
 */
export async function getSubscriptionByUserId(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  const result = await db
    .select()
    .from(subscriptions)
    .where(eq(subscriptions.userId, userId))
    .limit(1);

  return result[0] || null;
}

/**
 * Update subscription tier
 */
export async function updateSubscriptionTier(
  userId: number,
  tier: "free" | "plus" | "pro",
  stripeCustomerId?: string,
  stripeSubscriptionId?: string
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .update(subscriptions)
    .set({
      tier,
      stripeCustomerId: stripeCustomerId || undefined,
      stripeSubscriptionId: stripeSubscriptionId || undefined,
    })
    .where(eq(subscriptions.userId, userId));
}

/**
 * Increment AI calls used this month
 */
export async function incrementAICallsUsed(userId: number, count: number = 1) {
  const sub = await getSubscriptionByUserId(userId);
  if (!sub) {
    throw new Error(`Subscription not found for user ${userId}`);
  }

  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .update(subscriptions)
    .set({
      aiCallsUsedThisMonth: sub.aiCallsUsedThisMonth + count,
    })
    .where(eq(subscriptions.userId, userId));
}

/**
 * Reset AI calls at the start of a new billing period
 */
export async function resetAICallsForNewPeriod(userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  
  return db
    .update(subscriptions)
    .set({
      aiCallsUsedThisMonth: 0,
      periodStart: new Date(),
    })
    .where(eq(subscriptions.userId, userId));
}

/**
 * Check if user has exceeded their AI call limit.
 * Testers always return false (unlimited).
 */
export async function hasExceededAILimit(
  userId: number,
  limit: number,
  isTester?: boolean
): Promise<boolean> {
  if (isTester) return false; // testers have unlimited AI calls
  const sub = await getSubscriptionByUserId(userId);
  if (!sub) {
    return false;
  }
  return sub.aiCallsUsedThisMonth >= limit;
}
