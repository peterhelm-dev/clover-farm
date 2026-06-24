import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users, subscriptions, referrals } from "../../drizzle/schema";
import { eq, count } from "drizzle-orm";

/** Generate a random 8-char alphanumeric referral code */
function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const referralRouter = router({
  /** Get (or generate) the current user's referral code and their referral stats */
  getMyReferrals: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database not available");

    // Ensure user has a referral code
    const [user] = await db.select().from(users).where(eq(users.id, ctx.user.id));
    let code = user?.referralCode;

    if (!code) {
      // Generate a unique code
      let attempts = 0;
      while (!code && attempts < 10) {
        const candidate = generateCode();
        const [existing] = await db
          .select()
          .from(users)
          .where(eq(users.referralCode, candidate));
        if (!existing) {
          await db
            .update(users)
            .set({ referralCode: candidate })
            .where(eq(users.id, ctx.user.id));
          code = candidate;
        }
        attempts++;
      }
    }

    // Count successful referrals
    const [{ count: totalReferrals }] = await db
      .select({ count: count() })
      .from(referrals)
      .where(eq(referrals.referrerId, ctx.user.id));

    const [{ count: creditedReferrals }] = await db
      .select({ count: count() })
      .from(referrals)
      .where(eq(referrals.referrerId, ctx.user.id));

    // Get free months remaining
    const [sub] = await db
      .select({ freeMonthsRemaining: subscriptions.freeMonthsRemaining })
      .from(subscriptions)
      .where(eq(subscriptions.userId, ctx.user.id));

    return {
      code: code ?? null,
      totalReferrals,
      creditedReferrals,
      freeMonthsRemaining: sub?.freeMonthsRemaining ?? 0,
    };
  }),

  /**
   * Apply a referral code for a newly signed-up user.
   * This should be called once during onboarding.
   * Credits 1 free Pro month to the referrer.
   */
  applyCode: protectedProcedure
    .input(z.object({ code: z.string().trim().toUpperCase().min(4).max(16) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Check the referred user hasn't already used a referral code
      const [existingReferral] = await db
        .select()
        .from(referrals)
        .where(eq(referrals.referredUserId, ctx.user.id));
      if (existingReferral) {
        return { success: false, message: "You have already used a referral code." };
      }

      // Find the referrer
      const [referrer] = await db
        .select()
        .from(users)
        .where(eq(users.referralCode, input.code));
      if (!referrer) {
        return { success: false, message: "Referral code not found." };
      }
      if (referrer.id === ctx.user.id) {
        return { success: false, message: "You cannot use your own referral code." };
      }

      // Record the referral
      await db.insert(referrals).values({
        referrerId: referrer.id,
        referredUserId: ctx.user.id,
        code: input.code,
        status: "credited",
      });

      // Credit 1 free month to the referrer's subscription
      const [referrerSub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, referrer.id));
      if (referrerSub) {
        await db
          .update(subscriptions)
          .set({ freeMonthsRemaining: (referrerSub.freeMonthsRemaining ?? 0) + 1 })
          .where(eq(subscriptions.userId, referrer.id));
      } else {
        await db.insert(subscriptions).values({
          userId: referrer.id,
          tier: "free",
          aiCallsUsedThisMonth: 0,
          periodStart: new Date(),
          trialUsed: 0,
          freeMonthsRemaining: 1,
        });
      }

      return { success: true, message: "Referral applied! Your friend earned a free month." };
    }),
});
