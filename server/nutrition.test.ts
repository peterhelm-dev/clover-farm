import { describe, it, expect, vi, beforeEach } from "vitest";
import { TRPCError } from "@trpc/server";

// ---------------------------------------------------------------------------
// Mock invokeLLM so tests never hit the real API
// ---------------------------------------------------------------------------
vi.mock("./_core/llm", () => ({
  invokeLLM: vi.fn(),
}));

import { invokeLLM } from "./_core/llm";
import { nutritionRouter } from "./routers/nutrition";

// Helper: create a caller without auth context (publicProcedure)
function createCaller() {
  return nutritionRouter.createCaller({} as any);
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

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("nutrition.analyzeTranscript", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns structured nutritional data for a clear food description", async () => {
    const payload = {
      foodName: "Scrambled Eggs with Spinach",
      quantity: "2 large eggs, 1 cup spinach",
      calories: 210,
      protein: 14.5,
      carbs: 2.0,
      fat: 15.0,
      fiber: 0.5,
      allergensDetected: ["Eggs"],
      clarifyingQuestion: null,
      confidence: "high",
      notes: "Eggs are a great source of complete protein and choline.",
    };
    mockLLMResponse(payload);

    const caller = createCaller();
    const result = await caller.analyzeTranscript({
      transcript: "I had two scrambled eggs with fresh spinach",
    });

    expect(result.foodName).toBe("Scrambled Eggs with Spinach");
    expect(result.calories).toBe(210);
    expect(result.protein).toBe(14.5);
    expect(result.confidence).toBe("high");
    expect(result.clarifyingQuestion).toBeNull();
    expect(result.allergensDetected).toContain("Eggs");
    expect(result.notes).toBeTruthy();
  });

  it("returns a clarifying question when the description is ambiguous", async () => {
    const payload = {
      foodName: "Eggs",
      quantity: "2 eggs",
      calories: 140,
      protein: 12.0,
      carbs: 1.0,
      fat: 10.0,
      fiber: 0.0,
      allergensDetected: ["Eggs"],
      clarifyingQuestion:
        "Were the eggs fried, scrambled, or boiled? And did you use any oil or butter?",
      confidence: "medium",
      notes: null,
    };
    mockLLMResponse(payload);

    const caller = createCaller();
    const result = await caller.analyzeTranscript({
      transcript: "I had eggs",
    });

    expect(result.clarifyingQuestion).toBeTruthy();
    expect(result.confidence).toBe("medium");
  });

  it("incorporates clarification context in the second call", async () => {
    const payload = {
      foodName: "Fried Eggs in Butter",
      quantity: "2 large eggs, 1 tsp butter",
      calories: 250,
      protein: 13.0,
      carbs: 1.0,
      fat: 21.0,
      fiber: 0.0,
      allergensDetected: ["Eggs", "Dairy"],
      clarifyingQuestion: null,
      confidence: "high",
      notes: null,
    };
    mockLLMResponse(payload);

    const caller = createCaller();
    const result = await caller.analyzeTranscript({
      transcript: "I had eggs",
      clarificationContext: "They were fried in butter",
    });

    expect(result.foodName).toContain("Fried");
    expect(result.allergensDetected).toContain("Dairy");
    expect(result.clarifyingQuestion).toBeNull();
  });

  it("detects known allergens and flags them in the response", async () => {
    const payload = {
      foodName: "Peanut Butter Toast",
      quantity: "2 tbsp peanut butter, 1 slice whole wheat bread",
      calories: 330,
      protein: 11.0,
      carbs: 32.0,
      fat: 18.0,
      fiber: 3.0,
      allergensDetected: ["Peanuts", "Gluten"],
      clarifyingQuestion: null,
      confidence: "high",
      notes: null,
    };
    mockLLMResponse(payload);

    const caller = createCaller();
    const result = await caller.analyzeTranscript({
      transcript: "I had peanut butter on whole wheat toast",
      knownAllergies: ["Peanuts", "Gluten"],
    });

    expect(result.allergensDetected).toContain("Peanuts");
    expect(result.allergensDetected).toContain("Gluten");
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
