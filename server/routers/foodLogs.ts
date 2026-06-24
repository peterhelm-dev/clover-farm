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
        confidence: z.enum(["high", "medium", "low"]).default("medium"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      try {
        await createFoodLog({
          userId: ctx.user.id,
          rawSpeech: input.rawSpeech,
          foodName: input.foodName,
          quantity: input.quantity,
          calories: String(input.calories),
          protein: String(input.protein),
          carbs: String(input.carbs),
          fat: String(input.fat),
          fiber: String(input.fiber),
          allergensDetected: input.allergensDetected,
          confidence: input.confidence,
          notes: input.notes,
        });
        return { success: true };
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
