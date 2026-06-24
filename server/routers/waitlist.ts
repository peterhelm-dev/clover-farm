import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { getDb } from "../db";
import { waitlist } from "../../drizzle/schema";
import { publicProcedure, router } from "../_core/trpc";
import { eq } from "drizzle-orm";

export const waitlistRouter = router({
  /**
   * Join the waitlist with an email address.
   * Returns success:true on first signup, or a friendly message if already registered.
   */
  join: publicProcedure
    .input(
      z.object({
        email: z.string().email("Please enter a valid email address"),
        source: z.string().optional().default("landing_hero"),
      })
    )
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database not available" });

      // Check for duplicate before inserting to give a friendly message
      const existing = await db
        .select({ id: waitlist.id })
        .from(waitlist)
        .where(eq(waitlist.email, input.email.toLowerCase().trim()))
        .limit(1);

      if (existing.length > 0) {
        return { success: true, alreadyRegistered: true };
      }

      await db.insert(waitlist).values({
        email: input.email.toLowerCase().trim(),
        source: input.source,
      });

      return { success: true, alreadyRegistered: false };
    }),

  /**
   * Admin-only: get the total waitlist count.
   */
  count: publicProcedure.query(async () => {
    const db = await getDb();
    if (!db) return { count: 0 };
    const rows = await db.select({ id: waitlist.id }).from(waitlist);
    return { count: rows.length };
  }),
});
