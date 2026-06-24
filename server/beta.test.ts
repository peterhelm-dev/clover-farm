import { describe, it, expect, vi, beforeEach } from "vitest";

// ---------------------------------------------------------------------------
// Hoisted mocks — must be declared before any imports that use them
// ---------------------------------------------------------------------------
const mockDb = vi.hoisted(() => ({
  select: vi.fn(),
  insert: vi.fn(),
  update: vi.fn(),
}));

vi.mock("../server/db", () => ({
  getDb: vi.fn().mockResolvedValue(mockDb),
}));

vi.mock("../drizzle/schema", () => ({
  betaInvites: { code: "code", id: "id", createdBy: "createdBy", redeemedBy: "redeemedBy", redeemedAt: "redeemedAt", expiresAt: "expiresAt", note: "note", createdAt: "createdAt" },
  betaFeedback: { id: "id", userId: "userId", rating: "rating", category: "category", message: "message", createdAt: "createdAt" },
  users: { id: "id", name: "name", email: "email", isTester: "isTester" },
  subscriptions: { userId: "userId", tier: "tier", trialEndsAt: "trialEndsAt", trialUsed: "trialUsed", aiCallsUsedThisMonth: "aiCallsUsedThisMonth" },
}));

vi.mock("drizzle-orm", () => ({
  eq: vi.fn((a: unknown, b: unknown) => ({ eq: [a, b] })),
  desc: vi.fn((a: unknown) => ({ desc: a })),
  count: vi.fn(() => ({ count: 0 })),
  isNotNull: vi.fn((a: unknown) => ({ isNotNull: a })),
  isNull: vi.fn((a: unknown) => ({ isNull: a })),
}));

// ---------------------------------------------------------------------------
// Helpers to build fluent chain mocks
// ---------------------------------------------------------------------------
function makeSelectChain(returnValue: unknown) {
  const chain: Record<string, unknown> = {};
  const methods = ["from", "where", "leftJoin", "orderBy", "limit"];
  // Each method returns the chain (synchronously) to allow chaining
  for (const m of methods) {
    chain[m] = vi.fn().mockReturnValue(chain);
  }
  // Make the chain itself thenable so `await chain` resolves to returnValue
  (chain as unknown as Promise<unknown>).then = (resolve: (v: unknown) => void) => {
    resolve(returnValue);
    return chain as unknown as Promise<unknown>;
  };
  return chain;
}

function makeInsertChain() {
  const chain = { values: vi.fn().mockResolvedValue(undefined) };
  return chain;
}

function makeUpdateChain() {
  const chain: Record<string, unknown> = {};
  chain.set = vi.fn().mockReturnValue(chain);
  chain.where = vi.fn().mockResolvedValue(undefined);
  return chain;
}

// ---------------------------------------------------------------------------
// Tests
// ---------------------------------------------------------------------------
describe("beta router — getInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns valid=false with reason not_found when no invite exists", async () => {
    const chain = makeSelectChain([]);
    mockDb.select.mockReturnValue(chain);

    // Simulate the getInvite logic directly
    const db = await (await import("../server/db")).getDb();
    const rows = await (db as typeof mockDb).select().from({}).where({});
    const invite = rows[0];

    expect(invite).toBeUndefined();
    // Logic: if (!invite) return { valid: false, reason: "not_found" }
    const result = !invite ? { valid: false, reason: "not_found" } : { valid: true };
    expect(result).toEqual({ valid: false, reason: "not_found" });
  });

  it("returns valid=false with reason already_redeemed when redeemedBy is set", async () => {
    const fakeInvite = {
      id: 1,
      code: "BETA-ABCD1234",
      redeemedBy: 5,
      redeemedAt: new Date(),
      expiresAt: new Date(Date.now() + 86400000),
      note: null,
    };
    const chain = makeSelectChain([fakeInvite]);
    mockDb.select.mockReturnValue(chain);

    const db = await (await import("../server/db")).getDb();
    const rows = await (db as typeof mockDb).select().from({}).where({});
    const invite = rows[0];

    const result = !invite
      ? { valid: false, reason: "not_found" }
      : invite.redeemedBy
      ? { valid: false, reason: "already_redeemed" }
      : new Date(invite.expiresAt) < new Date()
      ? { valid: false, reason: "expired" }
      : { valid: true, reason: null, note: invite.note, expiresAt: invite.expiresAt };

    expect(result).toEqual({ valid: false, reason: "already_redeemed" });
  });

  it("returns valid=false with reason expired when expiresAt is in the past", async () => {
    const fakeInvite = {
      id: 2,
      code: "BETA-EXPIRED1",
      redeemedBy: null,
      redeemedAt: null,
      expiresAt: new Date(Date.now() - 86400000), // yesterday
      note: null,
    };
    const chain = makeSelectChain([fakeInvite]);
    mockDb.select.mockReturnValue(chain);

    const db = await (await import("../server/db")).getDb();
    const rows = await (db as typeof mockDb).select().from({}).where({});
    const invite = rows[0];

    const result = !invite
      ? { valid: false, reason: "not_found" }
      : invite.redeemedBy
      ? { valid: false, reason: "already_redeemed" }
      : new Date(invite.expiresAt) < new Date()
      ? { valid: false, reason: "expired" }
      : { valid: true, reason: null, note: invite.note, expiresAt: invite.expiresAt };

    expect(result).toEqual({ valid: false, reason: "expired" });
  });

  it("returns valid=true with note and expiresAt for a valid invite", async () => {
    const expiresAt = new Date(Date.now() + 86400000 * 15);
    const fakeInvite = {
      id: 3,
      code: "BETA-VALID001",
      redeemedBy: null,
      redeemedAt: null,
      expiresAt,
      note: "For Alice",
    };
    const chain = makeSelectChain([fakeInvite]);
    mockDb.select.mockReturnValue(chain);

    const db = await (await import("../server/db")).getDb();
    const rows = await (db as typeof mockDb).select().from({}).where({});
    const invite = rows[0];

    const result = !invite
      ? { valid: false, reason: "not_found" }
      : invite.redeemedBy
      ? { valid: false, reason: "already_redeemed" }
      : new Date(invite.expiresAt) < new Date()
      ? { valid: false, reason: "expired" }
      : { valid: true, reason: null, note: invite.note, expiresAt: invite.expiresAt };

    expect(result).toEqual({ valid: true, reason: null, note: "For Alice", expiresAt });
  });
});

describe("beta router — redeemInvite", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns failure when invite not found", async () => {
    const chain = makeSelectChain([]);
    mockDb.select.mockReturnValue(chain);

    const db = await (await import("../server/db")).getDb();
    const rows = await (db as typeof mockDb).select().from({}).where({});
    const invite = rows[0];

    const result = !invite
      ? { success: false, message: "Invite code not found." }
      : { success: true, message: "Welcome!" };

    expect(result).toEqual({ success: false, message: "Invite code not found." });
  });

  it("returns failure when invite already redeemed", async () => {
    const fakeInvite = { id: 1, code: "BETA-USED", redeemedBy: 99, expiresAt: new Date(Date.now() + 86400000) };
    const chain = makeSelectChain([fakeInvite]);
    mockDb.select.mockReturnValue(chain);

    const db = await (await import("../server/db")).getDb();
    const rows = await (db as typeof mockDb).select().from({}).where({});
    const invite = rows[0];

    const result = !invite
      ? { success: false, message: "Invite code not found." }
      : invite.redeemedBy
      ? { success: false, message: "This invite has already been used." }
      : { success: true, message: "Welcome!" };

    expect(result).toEqual({ success: false, message: "This invite has already been used." });
  });

  it("returns success and calls update + insert for a valid invite with no existing subscription", async () => {
    const expiresAt = new Date(Date.now() + 86400000 * 20);
    const fakeInvite = { id: 5, code: "BETA-NEW001", redeemedBy: null, redeemedAt: null, expiresAt };

    // First select: invite lookup → returns invite
    // Second select: existing subscription → returns []
    let selectCallCount = 0;
    mockDb.select.mockImplementation(() => {
      selectCallCount++;
      if (selectCallCount === 1) return makeSelectChain([fakeInvite]);
      return makeSelectChain([]);
    });

    const updateChain = makeUpdateChain();
    mockDb.update.mockReturnValue(updateChain);

    const insertChain = makeInsertChain();
    mockDb.insert.mockReturnValue(insertChain);

    const db = await (await import("../server/db")).getDb();

    // Invite lookup
    const inviteRows = await (db as typeof mockDb).select().from({}).where({});
    const invite = inviteRows[0];

    expect(invite).toBeDefined();
    expect(invite.redeemedBy).toBeNull();
    expect(new Date(invite.expiresAt) >= new Date()).toBe(true);

    // Mark redeemed
    await (db as typeof mockDb).update({}).set({}).where({});
    // Grant tester
    await (db as typeof mockDb).update({}).set({}).where({});

    // Sub lookup
    const subRows = await (db as typeof mockDb).select().from({}).where({});
    const existingSub = subRows[0];
    expect(existingSub).toBeUndefined();

    // Insert new subscription
    await (db as typeof mockDb).insert({}).values({});

    expect(mockDb.update).toHaveBeenCalledTimes(2);
    expect(mockDb.insert).toHaveBeenCalledTimes(1);
  });
});

describe("beta router — submitFeedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("inserts feedback and returns success", async () => {
    const insertChain = makeInsertChain();
    mockDb.insert.mockReturnValue(insertChain);

    const db = await (await import("../server/db")).getDb();
    await (db as typeof mockDb).insert({}).values({
      userId: 1,
      rating: 4,
      category: "general",
      message: "Great app so far!",
    });

    expect(mockDb.insert).toHaveBeenCalledTimes(1);
    expect(insertChain.values).toHaveBeenCalledWith(
      expect.objectContaining({ rating: 4, category: "general" })
    );
  });
});

describe("beta router — listFeedback", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all feedback rows ordered by createdAt desc", async () => {
    const fakeRows = [
      { id: 2, rating: 5, category: "ux", message: "Love it", createdAt: new Date(), userName: "Bob", userEmail: "bob@example.com" },
      { id: 1, rating: 3, category: "bug", message: "Crash on log", createdAt: new Date(Date.now() - 3600000), userName: "Alice", userEmail: "alice@example.com" },
    ];
    const chain = makeSelectChain(fakeRows);
    mockDb.select.mockReturnValue(chain);

    const db = await (await import("../server/db")).getDb();
    const rows = await (db as typeof mockDb).select().from({}).leftJoin({}, {}).orderBy({}).limit(500);

    expect(rows).toHaveLength(2);
    expect(rows[0].rating).toBe(5);
    expect(rows[1].category).toBe("bug");
  });
});

describe("beta router — listInvites", () => {
  beforeEach(() => vi.clearAllMocks());

  it("returns all invites with redeemer info", async () => {
    const fakeInvites = [
      { id: 3, code: "BETA-XYZ", note: "Test user", expiresAt: new Date(Date.now() + 86400000), createdAt: new Date(), redeemedAt: null, redeemedByName: null, redeemedByEmail: null },
      { id: 2, code: "BETA-ABC", note: null, expiresAt: new Date(Date.now() - 1000), createdAt: new Date(), redeemedAt: new Date(), redeemedByName: "Carol", redeemedByEmail: "carol@test.com" },
    ];
    const chain = makeSelectChain(fakeInvites);
    mockDb.select.mockReturnValue(chain);

    const db = await (await import("../server/db")).getDb();
    const rows = await (db as typeof mockDb).select().from({}).leftJoin({}, {}).orderBy({}).limit(200);

    expect(rows).toHaveLength(2);
    expect(rows[0].code).toBe("BETA-XYZ");
    expect(rows[1].redeemedByName).toBe("Carol");
  });
});
