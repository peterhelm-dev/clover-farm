import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import {
  createFoodLog,
  deleteFoodLog,
  updateFoodLog,
  getAllFoodLogs,
  getFoodLogsByDateRange,
  getUserProfile,
  upsertUserProfile,
} from "../db-food-logs";
import { MICRONUTRIENT_KEYS, NUTRIENT_REFERENCES } from "../nutrients";

/**
 * Rough meal-period anchor hours (UTC, matching the app's existing UTC-day
 * convention). "This morning" shouldn't require the user to state a clock
 * time — breakfast lands ~8:00, lunch ~12:30, dinner ~18:30, snack ~15:30.
 */
const MEAL_PERIOD_HOURS: Record<string, { h: number; m: number }> = {
  breakfast: { h: 8, m: 0 },
  lunch: { h: 12, m: 30 },
  snack: { h: 15, m: 30 },
  dinner: { h: 18, m: 30 },
};

function resolveLoggedAt(mealPeriod: string | null | undefined, dayOffset: number | undefined): Date | undefined {
  if (!mealPeriod && !dayOffset) return undefined; // no time context → server now()
  const base = new Date();
  if (dayOffset) base.setUTCDate(base.getUTCDate() + dayOffset);
  const anchor = mealPeriod ? MEAL_PERIOD_HOURS[mealPeriod] : undefined;
  if (anchor) {
    base.setUTCHours(anchor.h, anchor.m, 0, 0);
  }
  return base;
}

export const foodLogsRouter = router({
  // -------------------------------------------------------------------------
  // Save a single food log entry (after AI analysis)
  // -------------------------------------------------------------------------
  create: protectedProcedure
    .input(
      z.object({
        rawSpeech: z.string().optional(),
        foodName: z.string().min(1),
        quantity: z.string().optional(),
        calories: z.number().min(0).default(0),
        protein: z.number().min(0).default(0),
        carbs: z.number().min(0).default(0),
        fat: z.number().min(0).default(0),
        fiber: z.number().min(0).default(0),
        allergensDetected: z.array(z.string()).default([]),
        /** Rough AI-estimated micronutrients for the meal. */
        micronutrients: z.record(z.string(), z.number()).optional(),
        confidence: z.enum(["high", "medium", "low"]).default("medium"),
        notes: z.string().optional(),
        /** How the entry was captured; feeds the voice-vs-photo secondary metric. */
        logMethod: z.enum(["voice", "text"]).optional(),
        /** Rough time-of-day placement inferred from the description. */
        mealPeriod: z.enum(["breakfast", "lunch", "dinner", "snack"]).nullish(),
        /** 0 = today, -1 = yesterday ("last night", "yesterday for lunch"). */
        dayOffset: z.number().int().min(-1).max(0).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        const id = await createFoodLog({
          userId: ctx.user.id,
          rawSpeech: input.rawSpeech,
          logMethod: input.logMethod,
          foodName: input.foodName,
          quantity: input.quantity,
          calories: String(input.calories),
          protein: String(input.protein),
          carbs: String(input.carbs),
          fat: String(input.fat),
          fiber: String(input.fiber),
          allergensDetected: input.allergensDetected,
          micronutrients: input.micronutrients,
          confidence: input.confidence,
          notes: input.notes,
          loggedAt: resolveLoggedAt(input.mealPeriod, input.dayOffset),
        });
        return { success: true, id };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to save food log",
          cause: err,
        });
      }
    }),

  // -------------------------------------------------------------------------
  // Fetch logs for a specific date (UTC day boundaries)
  // -------------------------------------------------------------------------
  getByDate: protectedProcedure
    .input(
      z.object({
        // UTC timestamp for any moment within the desired day
        dateMs: z.number(),
      })
    )
    .query(async ({ ctx, input }) => {
      const d = new Date(input.dateMs);
      const startOfDay = Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate());
      const endOfDay = startOfDay + 24 * 60 * 60 * 1000 - 1;
      const rows = await getFoodLogsByDateRange(ctx.user.id, startOfDay, endOfDay);
      return rows.map(normalizeLog);
    }),

  // -------------------------------------------------------------------------
  // Fetch all logs (for calendar / history view, capped at 200)
  // -------------------------------------------------------------------------
  getAll: protectedProcedure.query(async ({ ctx }) => {
    const rows = await getAllFoodLogs(ctx.user.id);
    return rows.map(normalizeLog);
  }),

  // -------------------------------------------------------------------------
  // Micronutrient summary: per-nutrient average per logged day over the
  // trailing window. Averages only cover days that actually have logs with
  // micro data — missing days are absent, never counted as zeros.
  // -------------------------------------------------------------------------
  nutrientSummary: protectedProcedure
    .input(z.object({ days: z.union([z.literal(7), z.literal(30)]).default(7) }))
    .query(async ({ ctx, input }) => {
      const endMs = Date.now();
      const startMs = endMs - input.days * 24 * 60 * 60 * 1000;
      const rows = await getFoodLogsByDateRange(ctx.user.id, startMs, endMs);

      const allDays = new Set<string>();
      // Per-day sums, only over logs that carry micronutrient estimates
      const daySums = new Map<string, Record<string, number>>();
      let logsWithMicros = 0;

      for (const row of rows) {
        const day = (row.loggedAt instanceof Date ? row.loggedAt : new Date(Number(row.loggedAt)))
          .toISOString()
          .slice(0, 10);
        allDays.add(day);
        const micros = row.micronutrients as Record<string, number> | null;
        if (!micros) continue;
        logsWithMicros++;
        const acc = daySums.get(day) ?? {};
        for (const key of MICRONUTRIENT_KEYS) {
          const v = Number(micros[key] ?? 0);
          if (!Number.isNaN(v)) acc[key] = (acc[key] ?? 0) + v;
        }
        daySums.set(day, acc);
      }

      const daysWithData = daySums.size;
      const nutrients = MICRONUTRIENT_KEYS.map(key => {
        const ref = NUTRIENT_REFERENCES[key];
        let avg: number | null = null;
        if (daysWithData > 0) {
          let total = 0;
          for (const sums of Array.from(daySums.values())) total += sums[key] ?? 0;
          avg = Math.round((total / daysWithData) * 10) / 10;
        }
        const status: "below" | "within" | "above" | "unknown" =
          avg == null
            ? "unknown"
            : ref.upperLimit
              ? avg > ref.high
                ? "above"
                : "within"
              : avg < ref.low
                ? "below"
                : avg > ref.high
                  ? "above"
                  : "within";
        return { key, ...ref, avgPerDay: avg, status };
      });

      return {
        windowDays: input.days,
        daysLogged: allDays.size,
        daysWithData,
        totalLogs: rows.length,
        logsWithMicros,
        nutrients,
      };
    }),

  // -------------------------------------------------------------------------
  // Delete a food log entry (owner-only)
  // -------------------------------------------------------------------------
  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      try {
        await deleteFoodLog(input.id, ctx.user.id);
        return { success: true };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to delete food log",
          cause: err,
        });
      }
    }),

  // -------------------------------------------------------------------------
  // Update a food log entry (owner-only, inline edit)
  // -------------------------------------------------------------------------
  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        foodName: z.string().min(1).optional(),
        quantity: z.string().optional(),
        calories: z.number().min(0).optional(),
        protein: z.number().min(0).optional(),
        carbs: z.number().min(0).optional(),
        fat: z.number().min(0).optional(),
        fiber: z.number().min(0).optional(),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { id, ...fields } = input;
      const data: Record<string, string> = {};
      if (fields.foodName !== undefined) data.foodName = fields.foodName;
      if (fields.quantity !== undefined) data.quantity = fields.quantity;
      if (fields.calories !== undefined) data.calories = String(fields.calories);
      if (fields.protein !== undefined) data.protein = String(fields.protein);
      if (fields.carbs !== undefined) data.carbs = String(fields.carbs);
      if (fields.fat !== undefined) data.fat = String(fields.fat);
      if (fields.fiber !== undefined) data.fiber = String(fields.fiber);
      if (fields.notes !== undefined) data.notes = fields.notes;
      try {
        await updateFoodLog(id, ctx.user.id, data);
        return { success: true };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to update food log",
          cause: err,
        });
      }
    }),

  // -------------------------------------------------------------------------
  // User profile: get
  // -------------------------------------------------------------------------
  getProfile: protectedProcedure.query(async ({ ctx }) => {
    const profile = await getUserProfile(ctx.user.id);
    return profile;
  }),

  // -------------------------------------------------------------------------
  // User profile: upsert (onboarding + settings)
  // -------------------------------------------------------------------------
  saveProfile: protectedProcedure
    .input(
      z.object({
        age: z.number().int().min(1).max(120).optional(),
        weightLbs: z.number().min(1).max(1000).optional(),
        allergies: z.array(z.string()).optional(),
        dietaryChoices: z.array(z.string()).optional(),
        healthConditions: z.array(z.string()).optional(),
        calorieTarget: z.number().int().min(500).max(10000).optional(),
        proteinTarget: z.number().int().min(0).max(500).optional(),
        carbsTarget: z.number().int().min(0).max(1000).optional(),
        fatTarget: z.number().int().min(0).max(500).optional(),
        fiberTarget: z.number().int().min(0).max(200).optional(),
        onboardingComplete: z.number().int().min(0).max(1).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      await upsertUserProfile({
        userId: ctx.user.id,
        ...input,
        weightLbs: input.weightLbs !== undefined ? String(input.weightLbs) : undefined,
      });
      return { success: true };
    }),
});

// ---------------------------------------------------------------------------
// Normalize decimal strings from MySQL to numbers
// ---------------------------------------------------------------------------
function normalizeLog(row: Awaited<ReturnType<typeof getFoodLogsByDateRange>>[number]) {
  return {
    ...row,
    calories: Number(row.calories ?? 0),
    protein: Number(row.protein ?? 0),
    carbs: Number(row.carbs ?? 0),
    fat: Number(row.fat ?? 0),
    fiber: Number(row.fiber ?? 0),
    loggedAt: row.loggedAt instanceof Date ? row.loggedAt.getTime() : Number(row.loggedAt),
  };
}
