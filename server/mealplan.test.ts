import { describe, it, expect, beforeEach, vi } from "vitest";

const { mockInvokeLLM } = vi.hoisted(() => ({
  mockInvokeLLM: vi.fn(),
}));

vi.mock("../server/_core/llm", () => ({
  invokeLLM: mockInvokeLLM,
}));

describe("Meal Plan Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should generate meal plan suggestions from LLM", async () => {
    const mockMealPlanResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify([
              {
                day: "Monday",
                breakfast: "Oatmeal with berries",
                lunch: "Grilled chicken with brown rice",
                dinner: "Salmon with roasted vegetables",
                snack: "Greek yogurt",
              },
              {
                day: "Tuesday",
                breakfast: "Scrambled eggs with toast",
                lunch: "Turkey sandwich with salad",
                dinner: "Pasta with marinara sauce",
              },
              {
                day: "Wednesday",
                breakfast: "Smoothie bowl",
                lunch: "Quinoa bowl with vegetables",
                dinner: "Beef stir-fry with rice",
              },
              {
                day: "Thursday",
                breakfast: "Pancakes with fruit",
                lunch: "Tuna salad",
                dinner: "Chicken tacos",
              },
              {
                day: "Friday",
                breakfast: "Bagel with cream cheese",
                lunch: "Pasta primavera",
                dinner: "Grilled fish with asparagus",
              },
              {
                day: "Saturday",
                breakfast: "French toast",
                lunch: "Burger with fries",
                dinner: "Pizza night",
              },
              {
                day: "Sunday",
                breakfast: "Waffles with syrup",
                lunch: "Roast chicken with potatoes",
                dinner: "Steak with vegetables",
              },
            ]),
          },
        },
      ],
    };

    mockInvokeLLM.mockResolvedValue(mockMealPlanResponse);

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    const result = await caller.mealPlan.getSuggestions({
      weekStart: "2026-07-06",
    });

    expect(result).toHaveProperty("meals");
    expect(result).toHaveProperty("weekStart");
    expect(Array.isArray(result.meals)).toBe(true);
    expect(result.meals.length).toBeGreaterThan(0);
    expect(result.meals[0]).toHaveProperty("day");
    expect(result.meals[0]).toHaveProperty("breakfast");
    expect(result.meals[0]).toHaveProperty("lunch");
    expect(result.meals[0]).toHaveProperty("dinner");
    expect(mockInvokeLLM).toHaveBeenCalled();
  });

  it("should save meal plan for a week", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    const meals = [
      {
        day: "Monday",
        breakfast: "Oatmeal",
        lunch: "Chicken",
        dinner: "Salmon",
      },
      {
        day: "Tuesday",
        breakfast: "Eggs",
        lunch: "Turkey",
        dinner: "Pasta",
      },
    ];

    const result = await caller.mealPlan.save({
      weekStart: "2026-07-06",
      meals,
    });

    expect(result).toEqual({ success: true });
  });

  it("should get saved meal plan for a week", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    const meals = [
      {
        day: "Monday",
        breakfast: "Oatmeal",
        lunch: "Chicken",
        dinner: "Salmon",
      },
    ];

    // Save first
    await caller.mealPlan.save({
      weekStart: "2026-07-06",
      meals,
    });

    // Then retrieve
    const result = await caller.mealPlan.getForWeek({
      weekStart: "2026-07-06",
    });

    expect(result).not.toBeNull();
    if (result) {
      expect(result).toHaveProperty("weekStart");
      expect(result).toHaveProperty("meals");
    }
  });

  it("should return null for non-existent meal plan", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: { id: 999, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    const result = await caller.mealPlan.getForWeek({
      weekStart: "2099-12-31",
    });

    expect(result).toBeNull();
  });

  it("should get all saved meal plans", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    const meals = [
      {
        day: "Monday",
        breakfast: "Oatmeal",
        lunch: "Chicken",
        dinner: "Salmon",
      },
    ];

    // Save a meal plan
    await caller.mealPlan.save({
      weekStart: "2026-07-06",
      meals,
    });

    // Get all
    const result = await caller.mealPlan.getAll();

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it("should handle LLM errors gracefully", async () => {
    mockInvokeLLM.mockRejectedValue(new Error("LLM API failed"));

    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    await expect(
      caller.mealPlan.getSuggestions({
        weekStart: "2026-07-06",
      })
    ).rejects.toThrow();
  });

  it("should require authentication for meal plan operations", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: null,
      req: { headers: { origin: "http://localhost:3000" } },
    });

    await expect(
      caller.mealPlan.getSuggestions({
        weekStart: "2026-07-06",
      })
    ).rejects.toThrow();
  });

  it("should validate meal schema on save", async () => {
    const { appRouter } = await import("./routers");
    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    // Missing required field (dinner)
    const invalidMeals = [
      {
        day: "Monday",
        breakfast: "Oatmeal",
        lunch: "Chicken",
      },
    ];

    await expect(
      caller.mealPlan.save({
        weekStart: "2026-07-06",
        meals: invalidMeals as any,
      })
    ).rejects.toThrow();
  });
});
