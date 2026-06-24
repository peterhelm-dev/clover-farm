import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Use vi.hoisted() so mockDb is available when vi.mock() factory runs
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

import { referralRouter } from "./routers/referral";

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------

/** Create a caller for user with id=10 (the "new" user applying a code) */
function createNewUserCaller() {
  const ctx = {
    user: { id: 10, name: "New User", email: "new@example.com", role: "user" as const },
    req: {} as any,
    res: {} as any,
  };
  return referralRouter.createCaller(ctx as any);
}

/** Create a caller for user with id=99 (the referrer) */
function createReferrerCaller() {
  const ctx = {
    user: { id: 99, name: "Referrer", email: "referrer@example.com", role: "user" as const },
    req: {} as any,
    res: {} as any,
  };
  return referralRouter.createCaller(ctx as any);
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------

describe("referral.applyCode", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns failure when the user has already used a referral code", async () => {
    const whereMock = vi.fn().mockResolvedValue([{ id: 1, referredUserId: 10 }]);
    const fromMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.select.mockReturnValue({ from: fromMock });

    const caller = createNewUserCaller();
    const result = await caller.applyCode({ code: "ABCD1234" });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/already used/i);
  });

  it("returns failure when the referral code does not exist", async () => {
    // First select: no existing referral for this user
    mockDb.select
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
      // Second select: no user with that referral code
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) });

    const caller = createNewUserCaller();
    const result = await caller.applyCode({ code: "NOTFOUND" });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/not found/i);
  });

  it("returns failure when the user tries to use their own referral code", async () => {
    // First select: no existing referral for user 10
    mockDb.select
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
      // Second select: returns user 10 as the referrer (same user!)
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 10, referralCode: "MYCODE12" }]),
        }),
      });

    const caller = createNewUserCaller();
    const result = await caller.applyCode({ code: "MYCODE12" });
    expect(result.success).toBe(false);
    expect(result.message).toMatch(/own referral code/i);
  });

  it("credits the referrer and records the referral on success (referrer has existing subscription)", async () => {
    // select 1: no existing referral for user 10
    // select 2: referrer user found (id=99)
    // select 3: referrer's existing subscription
    mockDb.select
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 99, referralCode: "REFER999" }]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 5, userId: 99, tier: "free", freeMonthsRemaining: 0 }]),
        }),
      });

    const insertValues = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: insertValues });

    const whereMock = vi.fn().mockResolvedValue(undefined);
    const setMock = vi.fn().mockReturnValue({ where: whereMock });
    mockDb.update.mockReturnValue({ set: setMock });

    const caller = createNewUserCaller();
    const result = await caller.applyCode({ code: "REFER999" });
    expect(result.success).toBe(true);
    expect(result.message).toMatch(/free month/i);
    // referral record inserted
    expect(mockDb.insert).toHaveBeenCalledOnce();
    // subscription updated with +1 free month
    expect(mockDb.update).toHaveBeenCalledOnce();
  });

  it("creates a new subscription for the referrer when none exists", async () => {
    // select 1: no existing referral for user 10
    // select 2: referrer user found (id=99)
    // select 3: no existing subscription for referrer
    mockDb.select
      .mockReturnValueOnce({ from: vi.fn().mockReturnValue({ where: vi.fn().mockResolvedValue([]) }) })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 99, referralCode: "REFER999" }]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

    const insertValues = vi.fn().mockResolvedValue(undefined);
    mockDb.insert.mockReturnValue({ values: insertValues });

    const caller = createNewUserCaller();
    const result = await caller.applyCode({ code: "REFER999" });
    expect(result.success).toBe(true);
    // insert called twice: once for referral record, once for new subscription
    expect(mockDb.insert).toHaveBeenCalledTimes(2);
  });
});

describe("referral.getMyReferrals", () => {
  beforeEach(() => {
    vi.clearAllMocks();
  });

  it("returns the user's existing referral code and stats", async () => {
    // select 1: user with existing referral code
    // select 2: total referrals count
    // select 3: credited referrals count
    // select 4: subscription freeMonthsRemaining
    mockDb.select
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 99, referralCode: "MYCODE12" }]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 3 }]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 3 }]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ freeMonthsRemaining: 2 }]),
        }),
      });

    const caller = createReferrerCaller();
    const result = await caller.getMyReferrals();
    expect(result.code).toBe("MYCODE12");
    expect(result.totalReferrals).toBe(3);
    expect(result.freeMonthsRemaining).toBe(2);
  });

  it("returns zero freeMonthsRemaining when user has no subscription", async () => {
    // select 1: user with existing referral code
    // select 2: total referrals count
    // select 3: credited referrals count
    // select 4: no subscription found
    mockDb.select
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ id: 99, referralCode: "MYCODE12" }]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([{ count: 0 }]),
        }),
      })
      .mockReturnValueOnce({
        from: vi.fn().mockReturnValue({
          where: vi.fn().mockResolvedValue([]),
        }),
      });

    const caller = createReferrerCaller();
    const result = await caller.getMyReferrals();
    expect(result.freeMonthsRemaining).toBe(0);
    expect(result.totalReferrals).toBe(0);
  });
});
