import { invokeLLM } from "../_core/llm";
import { publicProcedure, protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getSubscriptionByUserId, getOrCreateSubscription, incrementAICallsUsed } from "../db-subscriptions";
import { getAICallLimit } from "../products";

/**
 * The structured output schema the LLM must return.
 * Using strict JSON schema so the response is always typed and parseable.
 */
const NUTRITION_JSON_SCHEMA = {
  name: "food_nutrition_extraction",
  strict: true,
  schema: {
    type: "object",
    properties: {
      foodName: {
        type: "string",
        description: "A concise, human-readable name for the food or meal described",
      },
      quantity: {
        type: "string",
        description:
          "Best-estimate quantity/serving size (e.g. '2 large eggs', '1 cup cooked rice', '1 medium apple')",
      },
      calories: {
        type: "number",
        description: "Estimated total calories (kcal) for the described portion",
      },
      protein: {
        type: "number",
        description: "Estimated protein in grams",
      },
      carbs: {
        type: "number",
        description: "Estimated total carbohydrates in grams",
      },
      fat: {
        type: "number",
        description: "Estimated total fat in grams",
      },
      fiber: {
        type: "number",
        description: "Estimated dietary fiber in grams",
      },
      allergensDetected: {
        type: "array",
        items: { type: "string" },
        description:
          "List of common allergens present (e.g. 'Gluten', 'Dairy', 'Peanuts', 'Tree Nuts', 'Eggs', 'Soy', 'Shellfish'). Empty array if none detected.",
      },
      clarifyingQuestion: {
        type: ["string", "null"],
        description:
          "A single follow-up question to ask the user if key details are ambiguous (e.g. cooking method, portion size, brand). Set to null if the description is already clear enough.",
      },
      confidence: {
        type: "string",
        enum: ["high", "medium", "low"],
        description:
          "How confident the estimate is. 'high' = clear description with known quantities. 'medium' = reasonable estimate. 'low' = very vague description.",
      },
      notes: {
        type: ["string", "null"],
        description:
          "Optional brief nutritional note or health tip relevant to the food. Null if nothing notable.",
      },
    },
    required: [
      "foodName",
      "quantity",
      "calories",
      "protein",
      "carbs",
      "fat",
      "fiber",
      "allergensDetected",
      "clarifyingQuestion",
      "confidence",
      "notes",
    ],
    additionalProperties: false,
  },
};

const SYSTEM_PROMPT = `You are a professional nutritionist and dietitian AI assistant embedded in a wellness app called Clover.

Your job is to analyze natural-language food descriptions (spoken or typed) and extract accurate nutritional estimates.

Guidelines:
- Use USDA FoodData Central values as your reference for nutritional estimates.
- When quantities are not specified, use the most common serving size for that food.
- If cooking method is ambiguous (e.g. eggs could be fried, scrambled, boiled), assume the simplest preparation unless context suggests otherwise, but ask a clarifying question.
- Always detect common allergens: Gluten, Dairy, Peanuts, Tree Nuts, Eggs, Soy, Shellfish, Fish.
- Be conservative with calorie estimates — round to the nearest 5 kcal.
- Macros should be in grams, rounded to 1 decimal place.
- If the user mentions a refined or clarified version of a previous description, incorporate that context into your estimate.
- Respond ONLY with the JSON structure — no extra prose.`;

export const nutritionRouter = router({
  /**
   * Analyzes a food description transcript and returns structured nutritional data.
   * Accepts an optional `context` string (e.g. a previous clarifying answer) to refine estimates.
   * Enforces AI call limits based on subscription tier.
   */
  analyzeTranscript: protectedProcedure
    .input(
      z.object({
        transcript: z
          .string()
          .min(3, "Transcript too short")
          .max(2000, "Transcript too long"),
        /** Optional: user's answer to a previous clarifying question */
        clarificationContext: z.string().max(500).optional(),
        /** Optional: user's known allergies to cross-reference */
        knownAllergies: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const { transcript, clarificationContext, knownAllergies } = input;

      // Check AI call limit for this user's subscription tier
      // Auto-create free subscription if it doesn't exist
      const sub = await getOrCreateSubscription(ctx.user.id);

      // Testers get unlimited AI calls regardless of tier
      // isTester is stored as 0/1 in MySQL (tinyint), so coerce to boolean
      const isTester = !!(ctx.user.isTester);
      const limit = getAICallLimit(sub.tier);
      if (!isTester && sub.aiCallsUsedThisMonth >= limit) {
        throw new TRPCError({
          code: "FORBIDDEN",
          message: `You have reached your AI call limit for this month (${limit} calls). Upgrade to Clover Plus for unlimited logs.`,
        });
      }

      // Build the user message, incorporating any clarification context
      let userMessage = `Food description: "${transcript}"`;

      if (clarificationContext) {
        userMessage += `\n\nAdditional context from user: "${clarificationContext}"`;
      }

      if (knownAllergies && knownAllergies.length > 0) {
        const allergyList = knownAllergies
          .filter((a) => a !== "None")
          .join(", ");
        if (allergyList) {
          userMessage += `\n\nUser's known allergies (flag these if present): ${allergyList}`;
        }
      }

      let result;
      try {
        result = await invokeLLM({
          messages: [
            { role: "system", content: SYSTEM_PROMPT },
            { role: "user", content: userMessage },
          ],
          response_format: {
            type: "json_schema",
            json_schema: NUTRITION_JSON_SCHEMA,
          },
        });
      } catch (err) {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI nutritional analysis failed. Please try again.",
          cause: err,
        });
      }

      const rawContent = result.choices?.[0]?.message?.content;
      if (!rawContent || typeof rawContent !== "string") {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI returned an unexpected response format.",
        });
      }

      let parsed: {
        foodName: string;
        quantity: string;
        calories: number;
        protein: number;
        carbs: number;
        fat: number;
        fiber: number;
        allergensDetected: string[];
        clarifyingQuestion: string | null;
        confidence: "high" | "medium" | "low";
        notes: string | null;
      };

      try {
        parsed = JSON.parse(rawContent);
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI response could not be parsed as JSON.",
        });
      }

      // Increment AI calls used for this user
      await incrementAICallsUsed(ctx.user.id, 1);

      return parsed;
    }),
});
