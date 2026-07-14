import { invokeLLM } from "../_core/llm";
import { protectedProcedure, router } from "../_core/trpc";
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { getOrCreateSubscription, incrementAICallsUsed } from "../db-subscriptions";
import { getAICallLimit } from "../products";

/**
 * Fixed micronutrient panel — rough per-meal estimates from typical food
 * composition. Chosen for relevance to common wellness questions (energy,
 * sleep, hydration balance). Keys must match foodLogs.micronutrients.
 */
export const MICRONUTRIENT_KEYS = [
  "iron_mg",
  "magnesium_mg",
  "vitamin_b12_mcg",
  "vitamin_d_mcg",
  "potassium_mg",
  "calcium_mg",
  "zinc_mg",
  "sodium_mg",
] as const;

const micronutrientSchemaProps = Object.fromEntries(
  MICRONUTRIENT_KEYS.map(k => [
    k,
    { type: "number", description: `Estimated ${k.replace(/_/g, " ")} for this meal` },
  ])
);

/**
 * The structured output schema the LLM must return.
 * One entry per distinct meal/eating occasion in the description, so
 * "oatmeal this morning and a sandwich for lunch" produces two meals,
 * each with its own rough time-of-day placement.
 */
const NUTRITION_JSON_SCHEMA = {
  name: "food_nutrition_extraction",
  strict: true,
  schema: {
    type: "object",
    properties: {
      meals: {
        type: "array",
        minItems: 1,
        description:
          "One entry per distinct meal or eating occasion described. A single meal description = one entry.",
        items: {
          type: "object",
          properties: {
            foodName: {
              type: "string",
              description: "A concise, human-readable name for this meal",
            },
            quantity: {
              type: "string",
              description:
                "Best-estimate quantity/serving size (e.g. '2 large eggs', '1 cup cooked rice')",
            },
            calories: { type: "number", description: "Estimated total calories (kcal)" },
            protein: { type: "number", description: "Estimated protein in grams" },
            carbs: { type: "number", description: "Estimated total carbohydrates in grams" },
            fat: { type: "number", description: "Estimated total fat in grams" },
            fiber: { type: "number", description: "Estimated dietary fiber in grams" },
            micronutrients: {
              type: "object",
              description:
                "Rough micronutrient estimates for this meal based on typical composition. Best-effort estimates are expected — do not omit.",
              properties: micronutrientSchemaProps,
              required: [...MICRONUTRIENT_KEYS],
              additionalProperties: false,
            },
            allergensDetected: {
              type: "array",
              items: { type: "string" },
              description:
                "Common allergens present in this meal ('Gluten', 'Dairy', 'Peanuts', 'Tree Nuts', 'Eggs', 'Soy', 'Shellfish', 'Fish'). Empty array if none.",
            },
            mealPeriod: {
              type: ["string", "null"],
              enum: ["breakfast", "lunch", "dinner", "snack", null],
              description:
                "Time-of-day placement inferred from context ('this morning' → breakfast, 'for lunch' → lunch, 'last night' → dinner). Null when no time context is given.",
            },
            dayOffset: {
              type: "number",
              enum: [0, -1],
              description:
                "0 = today, -1 = yesterday (e.g. 'yesterday for dinner', 'last night'). Default 0.",
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
            "micronutrients",
            "allergensDetected",
            "mealPeriod",
            "dayOffset",
          ],
          additionalProperties: false,
        },
      },
      clarifyingQuestion: {
        type: ["string", "null"],
        description:
          "If — and only if — the description has multiple ambiguous details that meaningfully change the estimates, combine ALL of them into ONE natural question, and ALWAYS end it by offering to log anyway (e.g. '…— or I can just log my best guess now.'). This is your only chance to ask. Set to null when the description is clear enough.",
      },
      confidence: {
        type: "string",
        enum: ["high", "medium", "low"],
        description:
          "Overall confidence. 'high' = clear description with known quantities. 'medium' = reasonable estimate. 'low' = very vague.",
      },
      notes: {
        type: ["string", "null"],
        description:
          "Optional brief nutritional note or health tip relevant to the food. Null if nothing notable.",
      },
    },
    required: ["meals", "clarifyingQuestion", "confidence", "notes"],
    additionalProperties: false,
  },
};

const SYSTEM_PROMPT = `You are a professional nutritionist and dietitian AI assistant embedded in a wellness app called Clover.

Your job is to analyze natural-language food descriptions (spoken or typed) and extract accurate nutritional estimates.

Guidelines:
- Use USDA FoodData Central values as your reference for nutritional estimates.
- When quantities are not specified, use the most common serving size for that food.
- If cooking method is ambiguous (e.g. eggs could be fried, scrambled, boiled), assume the simplest preparation unless context suggests otherwise.
- MULTIPLE MEALS: if the description covers more than one distinct meal or eating occasion ("oatmeal this morning, then a sandwich for lunch"), return one meals[] entry per occasion. A single meal = a single entry.
- MEAL TIMING: infer mealPeriod from casual context — "this morning"/"for breakfast" → breakfast, "for lunch"/"midday" → lunch, "tonight"/"for dinner"/"last night" → dinner, otherwise snack when it's clearly between-meals, null when there's no time context at all. "Yesterday"/"last night" → dayOffset -1. Never ask the user for exact clock times — rough placement is the point. If it feels natural, you may append a brief, low-key line to 'notes' that mentioning when they ate helps their timing patterns — at most occasionally, never as a demand.
- MICRONUTRIENTS: estimate the full micronutrient panel per meal from typical food composition. These are understood to be rough estimates — provide your best numbers, never zeros for foods that plainly contain a nutrient.
- You get ONE opportunity to ask for clarification per description, ever. If several details are ambiguous, bundle them into a single natural-sounding question — and always close the question by offering to log with best estimates instead (e.g. "— or I can just log my best guess now."). Do not ask about anything you could reasonably assume.
- If this message already contains "Additional context from user" (the user answered, or chose to log anyway), you MUST return clarifyingQuestion: null and give your best estimates with what you have — do not ask again under any circumstances.
- Always detect common allergens: Gluten, Dairy, Peanuts, Tree Nuts, Eggs, Soy, Shellfish, Fish.
- Be conservative with calorie estimates — round to the nearest 5 kcal.
- Macros should be in grams, rounded to 1 decimal place.
- If the user mentions a refined or clarified version of a previous description, incorporate that context into your estimate.
- Respond ONLY with the JSON structure — no extra prose.`;

/** Zod mirror of the LLM output, used to validate before returning to the client. */
const mealSchema = z.object({
  foodName: z.string(),
  quantity: z.string(),
  calories: z.number(),
  protein: z.number(),
  carbs: z.number(),
  fat: z.number(),
  fiber: z.number(),
  micronutrients: z.record(z.string(), z.number()),
  allergensDetected: z.array(z.string()),
  mealPeriod: z.enum(["breakfast", "lunch", "dinner", "snack"]).nullable(),
  dayOffset: z.number().int().min(-1).max(0),
});

const analysisSchema = z.object({
  meals: z.array(mealSchema).min(1),
  clarifyingQuestion: z.string().nullable(),
  confidence: z.enum(["high", "medium", "low"]),
  notes: z.string().nullable(),
});

export type MealAnalysis = z.infer<typeof mealSchema>;

export const nutritionRouter = router({
  /**
   * Analyzes a food description and returns structured nutritional data —
   * one entry per distinct meal, each with rough time-of-day placement.
   * Accepts an optional `context` string (e.g. a previous clarifying answer).
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

      let parsed: z.infer<typeof analysisSchema>;
      try {
        parsed = analysisSchema.parse(JSON.parse(rawContent));
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
