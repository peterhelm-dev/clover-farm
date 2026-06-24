import { z } from "zod";
import { adminProcedure, protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { betaInvites, betaFeedback, users, subscriptions } from "../../drizzle/schema";
import { eq, desc, count, isNull, isNotNull } from "drizzle-orm";

/** Generate a random invite code like BETA-XXXXXXXX */
function generateInviteCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  let code = "BETA-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

export const betaRouter = router({
  /**
   * Admin: create a new beta invite link.
   * Returns the full invite URL to share.
   */
  createInvite: adminProcedure
    .input(
      z.object({
        note: z.string().max(255).optional(),
        origin: z.string().url(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      // Generate a unique code
      let code = "";
      for (let attempt = 0; attempt < 10; attempt++) {
        const candidate = generateInviteCode();
        const [existing] = await db
          .select()
          .from(betaInvites)
          .where(eq(betaInvites.code, candidate));
        if (!existing) {
          code = candidate;
          break;
        }
      }
      if (!code) throw new Error("Failed to generate unique invite code");

      const expiresAt = new Date();
      expiresAt.setDate(expiresAt.getDate() + 30);

      await db.insert(betaInvites).values({
        code,
        createdBy: ctx.user.id,
        note: input.note ?? null,
        expiresAt,
      });

      const inviteUrl = `${input.origin}/beta/${code}`;
      return { code, inviteUrl, expiresAt };
    }),

  /**
   * Public: look up an invite by code (used on the /beta/:code landing page).
   * Returns invite status without revealing sensitive data.
   */
  getInvite: publicProcedure
    .input(z.object({ code: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [invite] = await db
        .select()
        .from(betaInvites)
        .where(eq(betaInvites.code, input.code));

      if (!invite) return { valid: false, reason: "not_found" as const };
      if (invite.redeemedBy) return { valid: false, reason: "already_redeemed" as const };
      if (new Date(invite.expiresAt) < new Date()) return { valid: false, reason: "expired" as const };

      return {
        valid: true,
        reason: null,
        note: invite.note,
        expiresAt: invite.expiresAt,
      };
    }),

  /**
   * Protected: redeem an invite code for the currently logged-in user.
   * Grants isTester=1 and a 30-day Pro subscription.
   */
  redeemInvite: protectedProcedure
    .input(z.object({ code: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const [invite] = await db
        .select()
        .from(betaInvites)
        .where(eq(betaInvites.code, input.code));

      if (!invite) return { success: false, message: "Invite code not found." };
      if (invite.redeemedBy) return { success: false, message: "This invite has already been used." };
      if (new Date(invite.expiresAt) < new Date()) return { success: false, message: "This invite has expired." };

      // Mark invite as redeemed
      await db
        .update(betaInvites)
        .set({ redeemedBy: ctx.user.id, redeemedAt: new Date() })
        .where(eq(betaInvites.code, input.code));

      // Grant isTester=1 to the user
      await db
        .update(users)
        .set({ isTester: 1 })
        .where(eq(users.id, ctx.user.id));

      // Set up a 30-day Pro beta subscription
      const betaEndsAt = new Date();
      betaEndsAt.setDate(betaEndsAt.getDate() + 30);

      const [existingSub] = await db
        .select()
        .from(subscriptions)
        .where(eq(subscriptions.userId, ctx.user.id));

      if (existingSub) {
        await db
          .update(subscriptions)
          .set({
            tier: "pro",
            trialEndsAt: betaEndsAt,
            trialUsed: 1,
            aiCallsUsedThisMonth: 0,
          })
          .where(eq(subscriptions.userId, ctx.user.id));
      } else {
        await db.insert(subscriptions).values({
          userId: ctx.user.id,
          tier: "pro",
          aiCallsUsedThisMonth: 0,
          periodStart: new Date(),
          trialEndsAt: betaEndsAt,
          trialUsed: 1,
          freeMonthsRemaining: 0,
        });
      }

      return {
        success: true,
        message: "Welcome to the Clover beta! You have 30 days of unlimited Pro access.",
      };
    }),

  /**
   * Protected: submit beta feedback.
   */
  submitFeedback: protectedProcedure
    .input(
      z.object({
        rating: z.number().int().min(1).max(5),
        category: z.enum(["general", "bug", "feature_request", "ux", "performance"]),
        message: z.string().min(5).max(2000),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(betaFeedback).values({
        userId: ctx.user.id,
        rating: input.rating,
        category: input.category,
        message: input.message,
      });

      return { success: true };
    }),

  /**
   * Admin: list all beta invites with redemption status.
   */
  listInvites: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select({
        id: betaInvites.id,
        code: betaInvites.code,
        note: betaInvites.note,
        expiresAt: betaInvites.expiresAt,
        createdAt: betaInvites.createdAt,
        redeemedAt: betaInvites.redeemedAt,
        redeemedByName: users.name,
        redeemedByEmail: users.email,
      })
      .from(betaInvites)
      .leftJoin(users, eq(betaInvites.redeemedBy, users.id))
      .orderBy(desc(betaInvites.createdAt))
      .limit(200);

    return rows;
  }),

  /**
   * Admin: list all beta feedback submissions with user info.
   */
  listFeedback: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return [];

    const rows = await db
      .select({
        id: betaFeedback.id,
        rating: betaFeedback.rating,
        category: betaFeedback.category,
        message: betaFeedback.message,
        createdAt: betaFeedback.createdAt,
        userName: users.name,
        userEmail: users.email,
      })
      .from(betaFeedback)
      .leftJoin(users, eq(betaFeedback.userId, users.id))
      .orderBy(desc(betaFeedback.createdAt))
      .limit(500);

    return rows;
  }),

  /**
   * Admin: summary stats for the beta program.
   */
  getStats: adminProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { totalInvites: 0, redeemedInvites: 0, pendingInvites: 0, totalFeedback: 0, avgRating: 0 };

    const [totalInvites] = await db.select({ count: count() }).from(betaInvites);
    const [redeemedInvites] = await db
      .select({ count: count() })
      .from(betaInvites)
      .where(isNotNull(betaInvites.redeemedBy));
    const [totalFeedback] = await db.select({ count: count() }).from(betaFeedback);

    // Average rating
    const allRatings = await db.select({ rating: betaFeedback.rating }).from(betaFeedback);
    const avgRating =
      allRatings.length > 0
        ? Math.round((allRatings.reduce((s, r) => s + r.rating, 0) / allRatings.length) * 10) / 10
        : 0;

    return {
      totalInvites: totalInvites.count,
      redeemedInvites: redeemedInvites.count,
      pendingInvites: totalInvites.count - redeemedInvites.count,
      totalFeedback: totalFeedback.count,
      avgRating,
    };
  }),
});
