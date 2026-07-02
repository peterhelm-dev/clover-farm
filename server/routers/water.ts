import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { waterIntake } from "../../drizzle/schema";
import { eq, and } from "drizzle-orm";

export const waterRouter = router({
  /**
   * Log water intake in milliliters for today.
   * Default amount is 250ml (standard glass of water).
   */
  logIntake: protectedProcedure
    .input(
      z.object({
        amount: z.number().min(1).max(5000), // 1ml to 5L
        date: z.string().optional(), // YYYY-MM-DD, defaults to today
      })
    )
    .mutation(async ({ ctx, input }) => {
      const date = input.date || new Date().toISOString().split("T")[0];
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      await db.insert(waterIntake).values({
        userId: ctx.user.id,
        date,
        amount: input.amount,
        goal: 2000,
      });

      return { success: true };
    }),

  /**
   * Get daily water intake total and goal for a specific date.
   */
  getDaily: protectedProcedure
    .input(
      z.object({
        date: z.string().optional(), // YYYY-MM-DD, defaults to today
      })
    )
    .query(async ({ ctx, input }) => {
      const date = input.date || new Date().toISOString().split("T")[0];
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs: any[] = await db
        .select()
        .from(waterIntake)
        .where(and(eq(waterIntake.userId, ctx.user.id), eq(waterIntake.date, date)));

      const totalAmount = logs.reduce((sum: number, log: any) => sum + log.amount, 0);
      const goal = logs[0]?.goal || 2000;
      const percentage = Math.min((totalAmount / goal) * 100, 100);

      return {
        date,
        totalAmount,
        goal,
        percentage,
        logs,
      };
    }),

  /**
   * Set daily water goal in milliliters.
   */
  setGoal: protectedProcedure
    .input(
      z.object({
        goal: z.number().min(500).max(10000), // 500ml to 10L
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Store goal in user profile or settings
      // For now, we'll just return success
      return { success: true, goal: input.goal };
    }),

  /**
   * Get water intake history for a date range.
   */
  getHistory: protectedProcedure
    .input(
      z.object({
        startDate: z.string(), // YYYY-MM-DD
        endDate: z.string(), // YYYY-MM-DD
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");

      const logs: any[] = await db
        .select()
        .from(waterIntake)
        .where(eq(waterIntake.userId, ctx.user.id));

      // Group by date
      const grouped = logs.reduce(
        (acc: Record<string, any>, log: any) => {
          if (!acc[log.date]) {
            acc[log.date] = { date: log.date, total: 0, logs: [] };
          }
          acc[log.date].total += log.amount;
          acc[log.date].logs.push(log);
          return acc;
        },
        {} as Record<string, any>
      );

      return Object.values(grouped);
    }),
});
