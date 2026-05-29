import { TRPCError } from "@trpc/server";
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { invokeLLM } from "../_core/llm";
import { getAllFoodLogs, getUserProfile } from "../db-food-logs";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Summarise a user's recent logs into a compact text block for the LLM. */
async function buildLogContext(userId: number): Promise<string> {
  const [logs, profile] = await Promise.all([
    getAllFoodLogs(userId, 50),
    getUserProfile(userId),
  ]);

  if (logs.length === 0) {
    return "The user has not logged any food yet.";
  }

  // Group logs by day (last 7 days)
  const byDay: Record<string, { calories: number; protein: number; carbs: number; fat: number; fiber: number; items: string[] }> = {};
  for (const log of logs) {
    const d = new Date(log.loggedAt instanceof Date ? log.loggedAt : Number(log.loggedAt));
    const key = d.toISOString().slice(0, 10);
    if (!byDay[key]) byDay[key] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, items: [] };
    byDay[key].calories += Number(log.calories ?? 0);
    byDay[key].protein += Number(log.protein ?? 0);
    byDay[key].carbs += Number(log.carbs ?? 0);
    byDay[key].fat += Number(log.fat ?? 0);
    byDay[key].fiber += Number(log.fiber ?? 0);
    byDay[key].items.push(log.foodName);
  }

  const days = Object.entries(byDay)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);

  const dayLines = days.map(([date, d]) =>
    `${date}: ${Math.round(d.calories)} kcal | ${Math.round(d.protein)}g protein | ${Math.round(d.carbs)}g carbs | ${Math.round(d.fat)}g fat | ${Math.round(d.fiber)}g fiber | Foods: ${d.items.join(", ")}`
  ).join("\n");

  const profileLine = profile
    ? `User profile: age ${profile.age ?? "unknown"}, weight ${profile.weightLbs ?? "unknown"} lbs, dietary choices: ${(profile.dietaryChoices as string[] | null)?.join(", ") || "none"}, allergies: ${(profile.allergies as string[] | null)?.join(", ") || "none"}, health conditions: ${(profile.healthConditions as string[] | null)?.join(", ") || "none"}. Daily targets: ${profile.calorieTarget} kcal, ${profile.proteinTarget}g protein, ${profile.carbsTarget}g carbs, ${profile.fatTarget}g fat, ${profile.fiberTarget}g fiber.`
    : "No profile set up yet.";

  return `${profileLine}\n\nFood log (last 7 days, most recent first):\n${dayLines}`;
}

// ---------------------------------------------------------------------------
// Router
// ---------------------------------------------------------------------------

export const healthInsightsRouter = router({
  /**
   * Generate a daily health overview: a short summary + 2-3 actionable tips.
   * Returns plain text / markdown suitable for rendering with Streamdown.
   */
  overview: protectedProcedure.mutation(async ({ ctx }) => {
    const logContext = await buildLogContext(ctx.user.id);

    const systemPrompt = `You are Clover, a friendly and knowledgeable nutrition coach. 
Your job is to review a user's recent food logs and provide a concise, encouraging daily health overview.

Format your response in Markdown with two sections:
1. **Today's Summary** — 2-3 sentences summarising the day's intake vs. targets. Be specific about numbers.
2. **Tips for Tomorrow** — 2-3 short, actionable, personalised improvement tips based on the data.

Keep the total response under 200 words. Be warm, specific, and practical.`;

    try {
      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: `Here is my nutrition data:\n\n${logContext}\n\nPlease give me my daily overview and tips.` },
        ],
      });

      const content = response?.choices?.[0]?.message?.content;
      if (!content) throw new Error("Empty LLM response");
      return { overview: content };
    } catch (err) {
      throw new TRPCError({
        code: "INTERNAL_SERVER_ERROR",
        message: "Failed to generate health overview",
        cause: err,
      });
    }
  }),

  /**
   * Data-aware chat: answer questions about the user's food history.
   * Accepts a messages array (conversation history) and returns the next assistant reply.
   */
  chat: protectedProcedure
    .input(
      z.object({
        messages: z.array(
          z.object({
            role: z.enum(["user", "assistant"]),
            content: z.string(),
          })
        ).min(1),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const logContext = await buildLogContext(ctx.user.id);

      const systemPrompt = `You are Clover, a friendly nutrition coach with access to the user's food log history.
Answer questions about their eating habits, nutritional intake, patterns, and give personalised advice.
Always base your answers on the actual data provided. If data is insufficient, say so honestly.
Keep answers concise (under 150 words) and practical.

${logContext}`;

      try {
        const response = await invokeLLM({
          messages: [
            { role: "system", content: systemPrompt },
            ...input.messages,
          ],
        });

        const content = response?.choices?.[0]?.message?.content;
        if (!content) throw new Error("Empty LLM response");
        return { reply: content };
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "Failed to generate chat response",
          cause: err,
        });
      }
    }),
});
