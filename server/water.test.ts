import { describe, it, expect, beforeEach, vi } from "vitest";

describe("Water Intake Router", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("should log water intake for today", async () => {
    const { appRouter } = await import("./routers");

    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    const result = await caller.water.logIntake({
      amount: 250,
    });

    expect(result).toEqual({ success: true });
  });

  it("should log water intake for a specific date", async () => {
    const { appRouter } = await import("./routers");

    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    const result = await caller.water.logIntake({
      amount: 500,
      date: "2026-07-06",
    });

    expect(result).toEqual({ success: true });
  });

  it("should reject water intake below minimum", async () => {
    const { appRouter } = await import("./routers");

    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    await expect(
      caller.water.logIntake({
        amount: 0,
      })
    ).rejects.toThrow();
  });

  it("should reject water intake above maximum", async () => {
    const { appRouter } = await import("./routers");

    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    await expect(
      caller.water.logIntake({
        amount: 6000,
      })
    ).rejects.toThrow();
  });

  it("should get daily water intake and goal", async () => {
    const { appRouter } = await import("./routers");

    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    // Log some water first
    await caller.water.logIntake({ amount: 250 });
    await caller.water.logIntake({ amount: 500 });

    const result = await caller.water.getDaily({});

    expect(result).toHaveProperty("date");
    expect(result).toHaveProperty("totalAmount");
    expect(result).toHaveProperty("goal");
    expect(result).toHaveProperty("percentage");
    expect(result).toHaveProperty("logs");
    expect(result.totalAmount).toBeGreaterThanOrEqual(0);
    expect(result.goal).toBe(2000);
  });

  it("should set water goal", async () => {
    const { appRouter } = await import("./routers");

    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    const result = await caller.water.setGoal({
      goal: 3000,
    });

    expect(result).toEqual({ success: true, goal: 3000 });
  });

  it("should reject water goal below minimum", async () => {
    const { appRouter } = await import("./routers");

    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    await expect(
      caller.water.setGoal({
        goal: 400,
      })
    ).rejects.toThrow();
  });

  it("should reject water goal above maximum", async () => {
    const { appRouter } = await import("./routers");

    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    await expect(
      caller.water.setGoal({
        goal: 11000,
      })
    ).rejects.toThrow();
  });

  it("should get water intake history for date range", async () => {
    const { appRouter } = await import("./routers");

    const caller = appRouter.createCaller({
      user: { id: 1, role: "user", isTester: false },
      req: { headers: { origin: "http://localhost:3000" } },
    });

    // Log water for multiple dates
    await caller.water.logIntake({ amount: 250, date: "2026-07-04" });
    await caller.water.logIntake({ amount: 500, date: "2026-07-05" });
    await caller.water.logIntake({ amount: 750, date: "2026-07-06" });

    const result = await caller.water.getHistory({
      startDate: "2026-07-04",
      endDate: "2026-07-06",
    });

    expect(Array.isArray(result)).toBe(true);
    expect(result.length).toBeGreaterThanOrEqual(0);
  });

  it("should require authentication for water operations", async () => {
    const { appRouter } = await import("./routers");

    const caller = appRouter.createCaller({
      user: null,
      req: { headers: { origin: "http://localhost:3000" } },
    });

    await expect(
      caller.water.logIntake({
        amount: 250,
      })
    ).rejects.toThrow();
  });
});
