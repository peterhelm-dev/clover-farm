import { z } from "zod";
import { eq } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { users } from "../../drizzle/schema";
import { logEvent } from "../events";

/**
 * Golden-path user settings (spec Part 3). All three are independently
 * toggleable — changing one never implies another:
 *  - primary goal (same fixed enum as onboarding)
 *  - daily reminder (off unless the user actively set one)
 *  - weekly export email (off by default; in-app view always available)
 */

/** Goals currently selectable in the UI — only goals with a written template set. */
const SELECTABLE_GOALS = ["weight_management", "protein_focus", "general_awareness"] as const;

const timePattern = /^([01]\d|2[0-3]):[0-5]\d$/; // "HH:MM" 24h

export const settingsRouter = router({
  get: protectedProcedure.query(({ ctx }) => ({
    primaryGoal: ctx.user.primaryGoal,
    reminderEnabled: !!ctx.user.reminderEnabled,
    reminderTime: ctx.user.reminderTime,
    weeklyExportEmail: !!ctx.user.weeklyExportEmail,
  })),

  setGoal: protectedProcedure
    .input(z.object({ goal: z.enum(SELECTABLE_GOALS) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db.update(users).set({ primaryGoal: input.goal }).where(eq(users.id, ctx.user.id));
      if (ctx.user.primaryGoal !== input.goal) {
        void logEvent(ctx.user.id, "goal_changed", { from: ctx.user.primaryGoal, to: input.goal });
      }
      return { success: true, previous: ctx.user.primaryGoal, current: input.goal } as const;
    }),

  setReminder: protectedProcedure
    .input(
      z
        .object({
          enabled: z.boolean(),
          time: z.string().regex(timePattern).nullable(),
        })
        .refine(v => !v.enabled || v.time !== null, {
          message: "A reminder time is required when enabling the reminder",
        })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(users)
        .set({
          reminderEnabled: input.enabled ? 1 : 0,
          reminderTime: input.enabled ? input.time : null,
        })
        .where(eq(users.id, ctx.user.id));
      void logEvent(ctx.user.id, "reminder_setting_changed", {
        enabled: input.enabled,
        time: input.enabled ? input.time : null,
      });
      return { success: true } as const;
    }),

  setWeeklyExportEmail: protectedProcedure
    .input(z.object({ enabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      await db
        .update(users)
        .set({ weeklyExportEmail: input.enabled ? 1 : 0 })
        .where(eq(users.id, ctx.user.id));
      void logEvent(ctx.user.id, "weekly_export_email_toggled", { enabled: input.enabled });
      return { success: true } as const;
    }),
});
