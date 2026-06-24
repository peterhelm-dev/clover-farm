import { and, desc, eq, gte, lte } from "drizzle-orm";
import { foodLogs, InsertFoodLog, InsertUserProfile, userProfiles } from "../drizzle/schema";
import { getDb } from "./db";

// ---------------------------------------------------------------------------
// Food log helpers
// ---------------------------------------------------------------------------

export async function createFoodLog(data: InsertFoodLog) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  const result = await db.insert(foodLogs).values(data);
  return result;
}

export async function getFoodLogsByDateRange(
  userId: number,
  startMs: number,
  endMs: number
) {
  const db = await getDb();
  if (!db) return [];
  const start = new Date(startMs);
  const end = new Date(endMs);
  return db
    .select()
    .from(foodLogs)
    .where(
      and(
        eq(foodLogs.userId, userId),
        gte(foodLogs.loggedAt, start),
        lte(foodLogs.loggedAt, end)
      )
    )
    .orderBy(desc(foodLogs.loggedAt));
}

export async function getAllFoodLogs(userId: number, limitRows = 200) {
  const db = await getDb();
  if (!db) return [];
  return db
    .select()
    .from(foodLogs)
    .where(eq(foodLogs.userId, userId))
    .orderBy(desc(foodLogs.loggedAt))
    .limit(limitRows);
}

export async function deleteFoodLog(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .delete(foodLogs)
    .where(and(eq(foodLogs.id, id), eq(foodLogs.userId, userId)));
}

export async function updateFoodLog(
  id: number,
  userId: number,
  data: {
    foodName?: string;
    quantity?: string;
    calories?: string;
    protein?: string;
    carbs?: string;
    fat?: string;
    fiber?: string;
    notes?: string;
  }
) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");
  await db
    .update(foodLogs)
    .set(data)
    .where(and(eq(foodLogs.id, id), eq(foodLogs.userId, userId)));
}

// ---------------------------------------------------------------------------
// User profile helpers
// ---------------------------------------------------------------------------

export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const rows = await db
    .select()
    .from(userProfiles)
    .where(eq(userProfiles.userId, userId))
    .limit(1);
  return rows[0] ?? null;
}

export async function upsertUserProfile(data: InsertUserProfile) {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const updateSet: Partial<InsertUserProfile> = {};
  const fields: (keyof InsertUserProfile)[] = [
    "age",
    "weightLbs",
    "allergies",
    "dietaryChoices",
    "healthConditions",
    "calorieTarget",
    "proteinTarget",
    "carbsTarget",
    "fatTarget",
    "fiberTarget",
    "onboardingComplete",
  ];
  for (const f of fields) {
    if (data[f] !== undefined) {
      (updateSet as Record<string, unknown>)[f] = data[f];
    }
  }

  await db
    .insert(userProfiles)
    .values(data)
    .onDuplicateKeyUpdate({ set: updateSet });
}
