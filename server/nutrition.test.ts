import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// ---------------------------------------------------------------------------
// Mock invokeLLM so tests never hit the real API
// ---------------------------------------------------------------------------
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

// ---------------------------------------------------------------------------
// Mock the subscription DB helpers so tests bypass the AI call limit check
// and never touch the real database.
// ---------------------------------------------------------------------------
vi.mock("./db-subscriptions", () => ({
  getOrCreateSubscription: vi.fn().mockResolvedValue({
    id: 1,
    userId: 1,
    tier: "plus",           // paid tier → unlimited calls
    aiCallsUsedThisMonth: 0,
    periodStart: new Date(),
    stripeCustomerId: null,
    stripeSubscriptionId: null,
    createdAt: new Date(),
    updatedAt: new Date(),
  }),
  incrementAICallsUsed: vi.fn().mockResolvedValue(undefined),
}));

import { invokeLLM } from "./_core/llm";
import { getOrCreateSubscription, incrementAICallsUsed } from "./db-subscriptions";
import { nutritionRouter } from "./routers/nutrition";

// Helper: create a caller with a mock authenticated user context
function createCaller() {
  const mockCtx = {
    user: { id: 1, name: "Test User", email: "test@example.com", role: "user" as const },
    req: {} as any,
    res: {} as any,
  };
  return nutritionRouter.createCaller(mockCtx as any);
}

// Helper: build a mock LLM response with the given payload
function mockLLMResponse(payload: object) {
  (invokeLLM as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
    choices: [
      {
        message: {
          content: JSON.stringify(payload),
        },
      },
    ],
  });
}

// Helper: a realistic micronutrient block (all keys required by the schema)
const micros = {
  iron_mg: 1.8,
  magnesium_mg: 40,
  vitamin_b12_mcg: 1.1,
  vitamin_d_mcg: 2.0,
  potassium_mg: 300,
  calcium_mg: 60,
  zinc_mg: 1.3,
  sodium_mg: 350,
};

// Helper: build a meal entry with overridable fields
function meal(overrides: Record<string, unknown> = {}) {
  return {
    foodName: "Scrambled Eggs with Spinach",
    quantity: "2 large eggs, 1 cup spinach",
    calories: 210,
    protein: 14.5,
    carbs: 2.0,
    fat: 15.0,
    fiber: 0.5,
    micronutrients: micros,
    allergensDetected: ["Eggs"],
    mealPeriod: null,
    dayOffset: 0,
    ...overrides,
  };
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("nutrition.analyzeTranscript", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    // Re-apply the subscription mock after clearAllMocks resets it
    vi.mocked(getOrCreateSubscription).mockResolvedValue({
      id: 1,
      userId: 1,
      tier: "plus",
      aiCallsUsedThisMonth: 0,
      periodStart: new Date(),
      stripeCustomerId: null,
      stripeSubscriptionId: null,
      createdAt: new Date(),
      updatedAt: new Date(),
    } as any);
    vi.mocked(incrementAICallsUsed).mockResolvedValue(undefined);
  });

  it("returns structured nutritional data for a clear food description", async () => {
    mockLLMResponse({
      meals: [meal({ mealPeriod: "breakfast" })],
      clarifyingQuestion: null,
      confidence: "high",
      notes: "Eggs are a great source of complete protein and choline.",
    });

    const caller = createCaller();
    const result = await caller.analyzeTranscript({
      transcript: "I had two scrambled eggs with fresh spinach this morning",
    });

    expect(result.meals).toHaveLength(1);
    expect(result.meals[0].foodName).toBe("Scrambled Eggs with Spinach");
    expect(result.meals[0].calories).toBe(210);
    expect(result.meals[0].protein).toBe(14.5);
    expect(result.meals[0].mealPeriod).toBe("breakfast");
    expect(result.meals[0].micronutrients.iron_mg).toBe(1.8);
    expect(result.confidence).toBe("high");
    expect(result.clarifyingQuestion).toBeNull();
    expect(result.meals[0].allergensDetected).toContain("Eggs");
    expect(result.notes).toBeTruthy();
  });

  it("splits multi-meal descriptions into separate meal entries", async () => {
    mockLLMResponse({
      meals: [
        meal({ foodName: "Oatmeal with Honey", mealPeriod: "breakfast" }),
        meal({ foodName: "Turkey Sandwich", mealPeriod: "lunch", calories: 420 }),
      ],
      clarifyingQuestion: null,
      confidence: "medium",
      notes: null,
    });

    const caller = createCaller();
    const result = await caller.analyzeTranscript({
      transcript: "I had oatmeal with honey this morning and a turkey sandwich for lunch",
    });

    expect(result.meals).toHaveLength(2);
    expect(result.meals[0].mealPeriod).toBe("breakfast");
    expect(result.meals[1].mealPeriod).toBe("lunch");
    expect(result.meals[1].calories).toBe(420);
  });

  it("supports yesterday placement via dayOffset", async () => {
    mockLLMResponse({
      meals: [meal({ foodName: "Pasta Dinner", mealPeriod: "dinner", dayOffset: -1 })],
      clarifyingQuestion: null,
      confidence: "medium",
      notes: null,
    });

    const caller = createCaller();
    const result = await caller.analyzeTranscript({
      transcript: "last night I had pasta",
    });

    expect(result.meals[0].dayOffset).toBe(-1);
    expect(result.meals[0].mealPeriod).toBe("dinner");
  });

  it("returns a clarifying question when the description is ambiguous", async () => {
    mockLLMResponse({
      meals: [meal({ foodName: "Eggs", calories: 140 })],
      clarifyingQuestion:
        "Were the eggs fried, scrambled, or boiled — or I can just log my best guess now?",
      confidence: "medium",
      notes: null,
    });

    const caller = createCaller();
    const result = await caller.analyzeTranscript({
      transcript: "I had eggs",
    });

    expect(result.clarifyingQuestion).toBeTruthy();
    expect(result.confidence).toBe("medium");
  });

  it("incorporates clarification context in the second call", async () => {
    mockLLMResponse({
      meals: [
        meal({
          foodName: "Fried Eggs in Butter",
          calories: 250,
          allergensDetected: ["Eggs", "Dairy"],
        }),
      ],
      clarifyingQuestion: null,
      confidence: "high",
      notes: null,
    });

    const caller = createCaller();
    const result = await caller.analyzeTranscript({
      transcript: "I had eggs",
      clarificationContext: "They were fried in butter",
    });

    expect(result.meals[0].foodName).toContain("Fried");
    expect(result.meals[0].allergensDetected).toContain("Dairy");
    expect(result.clarifyingQuestion).toBeNull();
  });

  it("detects known allergens and flags them in the response", async () => {
    mockLLMResponse({
      meals: [
        meal({
          foodName: "Peanut Butter Toast",
          allergensDetected: ["Peanuts", "Gluten"],
        }),
      ],
      clarifyingQuestion: null,
      confidence: "high",
      notes: null,
    });

    const caller = createCaller();
    const result = await caller.analyzeTranscript({
      transcript: "I had peanut butter on whole wheat toast",
      knownAllergies: ["Peanuts", "Gluten"],
    });

    expect(result.meals[0].allergensDetected).toContain("Peanuts");
    expect(result.meals[0].allergensDetected).toContain("Gluten");
  });

  it("throws INTERNAL_SERVER_ERROR when invokeLLM rejects", async () => {
    (invokeLLM as ReturnType<typeof vi.fn>).mockRejectedValueOnce(
      new Error("LLM service unavailable")
    );

    const caller = createCaller();
    await expect(
      caller.analyzeTranscript({ transcript: "I had a salad" })
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("throws INTERNAL_SERVER_ERROR when LLM returns malformed JSON", async () => {
    (invokeLLM as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      choices: [{ message: { content: "not valid json {{" } }],
    });

    const caller = createCaller();
    await expect(
      caller.analyzeTranscript({ transcript: "I had a salad" })
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("throws INTERNAL_SERVER_ERROR when LLM output fails schema validation", async () => {
    // meals missing entirely — must be rejected, not passed through
    mockLLMResponse({ clarifyingQuestion: null, confidence: "high", notes: null });

    const caller = createCaller();
    await expect(
      caller.analyzeTranscript({ transcript: "I had a salad" })
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("throws INTERNAL_SERVER_ERROR when LLM returns empty content", async () => {
    (invokeLLM as ReturnType<typeof vi.fn>).mockResolvedValueOnce({
      choices: [{ message: { content: null } }],
    });

    const caller = createCaller();
    await expect(
      caller.analyzeTranscript({ transcript: "I had a salad" })
    ).rejects.toMatchObject({
      code: "INTERNAL_SERVER_ERROR",
    });
  });

  it("rejects transcripts that are too short", async () => {
    const caller = createCaller();
    await expect(
      caller.analyzeTranscript({ transcript: "hi" })
    ).rejects.toMatchObject({
      code: "BAD_REQUEST",
    });
  });
});
