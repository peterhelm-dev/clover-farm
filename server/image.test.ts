import { describe, it, expect, vi, beforeEach } from "vitest";

const { mockInvokeLLM, mockStoragePut } = vi.hoisted(() => ({
  mockInvokeLLM: vi.fn(),
  mockStoragePut: vi.fn(),
}));

vi.mock("../server/_core/llm", () => ({
  invokeLLM: mockInvokeLLM,
}));

vi.mock("../server/storage", () => ({
  storagePut: mockStoragePut,
}));

import { appRouter } from "./routers";

describe("Image Analysis Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should analyze meal image and extract nutrition data", async () => {
    const mockVisionResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              foodDescription: "Grilled chicken with vegetables",
              calories: 350,
              protein: 45,
              carbs: 15,
              fat: 12,
              fiber: 4,
              allergens: [],
              confidence: "high",
            }),
          },
        },
      ],
    };

    mockInvokeLLM.mockResolvedValue(mockVisionResponse);

    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    const result = await caller.image.analyzeImage({
      imageUrl: "https://example.com/meal.jpg",
    });

    expect(result).toHaveProperty("foodDescription");
    expect(result.foodDescription).toBe("Grilled chicken with vegetables");
    expect(result.calories).toBe(350);
    expect(result.protein).toBe(45);
    expect(mockInvokeLLM).toHaveBeenCalled();
  });

  it("should handle vision API errors gracefully", async () => {
    mockInvokeLLM.mockRejectedValue(new Error("Vision API failed"));

    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    await expect(
      caller.image.analyzeImage({
        imageUrl: "https://example.com/invalid.jpg",
      })
    ).rejects.toThrow();
  });

  it("should require authentication for image analysis", async () => {
    const caller = appRouter.createCaller({
      user: null,
      req: { headers: { origin: "http://localhost:3000" } },
    });

    await expect(
      caller.image.analyzeImage({
        imageUrl: "https://example.com/meal.jpg",
      })
    ).rejects.toThrow();
  });

  it("should validate image URL format", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    await expect(
      caller.image.analyzeImage({
        imageUrl: "not-a-valid-url",
      })
    ).rejects.toThrow();
  });

  it("should parse JSON response from vision API", async () => {
    const mockVisionResponse = {
      choices: [
        {
          message: {
            content: JSON.stringify({
              foodDescription: "Salmon with rice",
              calories: 450,
              protein: 50,
              carbs: 35,
              fat: 15,
              fiber: 2,
              allergens: ["fish"],
              confidence: "high",
            }),
          },
        },
      ],
    };

    mockInvokeLLM.mockResolvedValue(mockVisionResponse);

    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    const result = await caller.image.analyzeImage({
      imageUrl: "https://example.com/salmon.jpg",
    });

    expect(result.allergens).toContain("fish");
    expect(result.calories).toBe(450);
  });

  it("should log meal from image analysis", async () => {
    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    const result = await caller.image.logMealFromImage({
      imageUrl: "https://example.com/meal.jpg",
      foodDescription: "Grilled chicken with vegetables",
      calories: 350,
      protein: 45,
      carbs: 15,
      fat: 12,
      fiber: 4,
      allergens: [],
      confidence: "high",
    });

    expect(result).toHaveProperty("message");
    expect(result.message).toContain("successfully");
  });
});
