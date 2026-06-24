import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Use vi.hoisted() so mockDb is available when vi.mock() factory runs
// (vi.mock calls are hoisted to the top of the file by vitest)
// ---------------------------------------------------------------------------
const { mockDb } = vi.hoisted(() => {
  const mockDb = {
    select: vi.fn(),
    insert: vi.fn(),
    update: vi.fn(),
  };
  return { mockDb };
});

vi.mock("./db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

import { adminRouter } from "./routers/admin";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a caller with an admin user context */
function createAdminCaller() {
  const ctx = {
    user: { id: 1, name: "Admin User", email: "admin@example.com", role: "admin" as const },
    req: {} as any,
    res: {} as any,
  };
  return adminRouter.createCaller(ctx as any);
}

/** Create a caller with a non-admin user context */
function createUserCaller() {
  const ctx = {
    user: { id: 2, name: "Regular User", email: "user@example.com", role: "user" as const },
    req: {} as any,
    res: {} as any,
  };
  return adminRouter.createCaller(ctx as any);
}

/** Create a caller with no user (unauthenticated) */
function createUnauthCaller() {
  const ctx = {
    user: null,
    req: {} as any,
    res: {} as any,
  };
  return adminRouter.createCaller(ctx as any);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("admin router — access control", () => {
  it("throws FORBIDDEN when a regular user calls setRole", async () => {
    const caller = createUserCaller();
    await expect(
      caller.setRole({ userId: 3, role: "admin" })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });

  it("throws FORBIDDEN when an unauthenticated caller calls setTester", async () => {
    const caller = createUnauthCaller();
    await expect(
      caller.setTester({ userId: 3, isTester: true })
    ).rejects.toMatchObject({ code: "FORBIDDEN" });
  });
});

describe("admin.setRole", () => {
  beforeEach(() => {
    vi.clearAllMocks();
    const whereMock = vi.fn().mockResolvedValue(undefined);
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.update.mockReturnValue({ set: setMock });
  });

  it("returns success when admin promotes a user to admin", async () => {
    const caller = createAdminCaller();
    const result = await caller.setRole({ userId: 5, role: "admin" });
    expect(result).toEqual({ success: true });
    expect(mockDb.update).toHaveBeenCalledOnce();
  });

  it("returns success when admin demotes a user back to user role", async () => {
    const caller = createAdminCaller();
    const result = await caller.setRole({ userId: 5, role: "user" });
    expect(result).toEqual({ success: true });
  });
});

describe("admin.setTester", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("grants tester status and upgrades subscription to pro when no subscription exists", async () => {
    const userWhere = vi.fn().mockResolvedValue(undefined);
    const userSet = vi.fn().mockReturnValue({ where: userWhere });
    mockDb.update.mockReturnValue({ set: userSet });

    // db.select returns empty array (no existing subscription)
    const subWhere = vi.fn().mockResolvedValue([]);
    const subFrom = vi.fn().mockReturnValue({ where: subWhere });
    mockDb.select.mockReturnValue({ from: subFrom });

    const insertValues = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: insertValues });

    const caller = createAdminCaller();
    const result = await caller.setTester({ userId: 5, isTester: true });
    expect(result).toEqual({ success: true });
    expect(mockDb.update).toHaveBeenCalled();
    expect(mockDb.insert).toHaveBeenCalledOnce();
  });

  it("grants tester status and upgrades existing subscription to pro", async () => {
    const whereMock = vi.fn().mockResolvedValue(undefined);
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.update.mockReturnValue({ set: setMock });

    // db.select returns an existing subscription
    const subWhere = vi.fn().mockResolvedValue([
      { id: 10, userId: 5, tier: "free", freeMonthsRemaining: 0 },
    ]);
    const subFrom = vi.fn().mockReturnValue({ where: subWhere });
    mockDb.select.mockReturnValue({ from: subFrom });

    const caller = createAdminCaller();
    const result = await caller.setTester({ userId: 5, isTester: true });
    expect(result).toEqual({ success: true });
    // update called for both users table and subscriptions table
    expect(mockDb.update).toHaveBeenCalledTimes(2);
  });

  it("revokes tester status without touching subscription", async () => {
    const whereMock = vi.fn().mockResolvedValue(undefined);
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.update.mockReturnValue({ set: setMock });

    const caller = createAdminCaller();
    const result = await caller.setTester({ userId: 5, isTester: false });
    expect(result).toEqual({ success: true });
    // Only the users table update should fire (no subscription change on revoke)
    expect(mockDb.update).toHaveBeenCalledOnce();
  });
});

describe("admin.overrideSubscription", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("updates an existing subscription tier to pro", async () => {
    const subWhere = vi.fn().mockResolvedValue([{ id: 10, userId: 5, tier: "free" }]);
    const subFrom = vi.fn().mockReturnValue({ where: subWhere });
    mockDb.select.mockReturnValue({ from: subFrom });

    const whereMock = vi.fn().mockResolvedValue(undefined);
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.update.mockReturnValue({ set: setMock });

    const caller = createAdminCaller();
    const result = await caller.overrideSubscription({ userId: 5, tier: "pro" });
    expect(result).toEqual({ success: true });
    expect(mockDb.update).toHaveBeenCalledOnce();
  });

  it("inserts a new subscription when none exists", async () => {
    const subWhere = vi.fn().mockResolvedValue([]);
    const subFrom = vi.fn().mockReturnValue({ where: subWhere });
    mockDb.select.mockReturnValue({ from: subFrom });

    const insertValues = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: insertValues });

    const caller = createAdminCaller();
    const result = await caller.overrideSubscription({ userId: 5, tier: "plus", freeMonthsRemaining: 3 });
    expect(result).toEqual({ success: true });
    expect(mockDb.insert).toHaveBeenCalledOnce();
  });
});
