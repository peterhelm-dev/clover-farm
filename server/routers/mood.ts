import { z } from "zod";
import { and, desc, eq, gte } from "drizzle-orm";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { moodEntries } from "../../drizzle/schema";
import { generateMoodInsights } from "../mood-insights";
import { logEvent } from "../events";

const axisSchema = z.number().int().min(1).max(5).nullable();

/**
 * Mood & feeling tracker. Everything optional by design — an empty manual
 * check-in is a valid "checked in" timestamp. Chat-extracted rows are always
 * user-editable and deletable (transparency over automation).
 */
export const moodRouter = router({
  create: protectedProcedure
    .input(
      z.object({
        source: z.enum(["manual_checkin", "chat_extracted", "retrospective"]),
        feelingTags: z.array(z.string().min(1).max(40)).max(10).default([]),
        contextTags: z.array(z.string().min(1).max(40)).max(10).default([]),
        energy: axisSchema.optional(),
        ease: axisSchema.optional(),
        intensity: axisSchema.optional(),
        note: z.string().max(1000).optional(),
        linkedFoodLogId: z.number().int().positive().optional(),
        sourceText: z.string().max(2000).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      // Respect the extraction toggle server-side: if the user turned passive
      // extraction off, silently drop chat_extracted writes (manual still works).
      if (input.source === "chat_extracted" && !ctx.user.moodExtractionEnabled) {
        return { success: true, id: null, skipped: true } as const;
      }
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const [row] = await db
        .insert(moodEntries)
        .values({
          userId: ctx.user.id,
          source: input.source,
          feelingTags: input.feelingTags,
          contextTags: input.contextTags,
          energy: input.energy ?? null,
          ease: input.ease ?? null,
          intensity: input.intensity ?? null,
          note: input.note,
          linkedFoodLogId: input.linkedFoodLogId ?? null,
          sourceText: input.sourceText,
        })
        .returning({ id: moodEntries.id });
      if (input.source === "manual_checkin") {
        void logEvent(ctx.user.id, "mood_checkin_completed", {
          has_energy: input.energy != null,
          has_ease: input.ease != null,
          tag_count: input.feelingTags.length + input.contextTags.length,
        });
      }
      return { success: true, id: row.id, skipped: false } as const;
    }),

  list: protectedProcedure
    .input(z.object({ days: z.union([z.literal(7), z.literal(14), z.literal(30)]).default(7) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const since = new Date(Date.now() - input.days * 24 * 60 * 60 * 1000);
      const rows = await db
        .select()
        .from(moodEntries)
        .where(and(eq(moodEntries.userId, ctx.user.id), gte(moodEntries.createdAt, since)))
        .orderBy(desc(moodEntries.createdAt));
      return rows.map(r => ({ ...r, createdAt: r.createdAt.getTime() }));
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number().int().positive(),
        feelingTags: z.array(z.string().min(1).max(40)).max(10).optional(),
        contextTags: z.array(z.string().min(1).max(40)).max(10).optional(),
        energy: axisSchema.optional(),
        ease: axisSchema.optional(),
        note: z.string().max(1000).nullable().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const { id, ...fields } = input;
      const set: Record<string, unknown> = {};
      if (fields.feelingTags !== undefined) set.feelingTags = fields.feelingTags;
      if (fields.contextTags !== undefined) set.contextTags = fields.contextTags;
      if (fields.energy !== undefined) set.energy = fields.energy;
      if (fields.ease !== undefined) set.ease = fields.ease;
      if (fields.note !== undefined) set.note = fields.note;
      if (Object.keys(set).length === 0) return { success: true } as const;
      const updated = await db
        .update(moodEntries)
        .set(set)
        .where(and(eq(moodEntries.id, id), eq(moodEntries.userId, ctx.user.id)))
        .returning({ id: moodEntries.id });
      if (updated.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mood entry not found" });
      }
      return { success: true } as const;
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number().int().positive() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database not available");
      const deleted = await db
        .delete(moodEntries)
        .where(and(eq(moodEntries.id, input.id), eq(moodEntries.userId, ctx.user.id)))
        .returning({ id: moodEntries.id });
      if (deleted.length === 0) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Mood entry not found" });
      }
      return { success: true } as const;
    }),

  insights: protectedProcedure.query(async ({ ctx }) => {
    return generateMoodInsights(ctx.user.id);
  }),
});
