// Mood insight cards — fixed template patterns, same tone-control approach
// as the weekly export. A card is a single, standalone, optional observation:
// no scores, no pass/fail, no bulk actions, no causal claims. This module is
// deliberately standalone so a future opt-in weekly-export section can reuse
// it without touching the UI layer.
import { and, eq, gte } from "drizzle-orm";
import { foodLogs, moodEntries, type MoodEntry } from "../drizzle/schema";
import { getDb } from "./db";

export type MoodInsightCard = {
  /** Stable id so the client can persist save/dismiss choices per card. */
  id: string;
  text: string;
};

const DAY_MS = 24 * 60 * 60 * 1000;

function mealPeriodOfHour(h: number): string {
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "midday";
  if (h >= 17 && h < 22) return "evening";
  return "late-night";
}

/**
 * Generate 0–4 insight cards from the trailing 7 days of mood entries.
 * Templates (tone-checked against "would a thoughtful friend say this?"):
 *  1. context_pattern — a context tag recurring (never framed as a flaw)
 *  2. energy_rhythm — where energy check-ins tend to sit by time of day
 *  3. ease_steady — ease holding steady (presence, not performance)
 *  4. presence — acknowledges checking in at all, without streak pressure;
 *     phrasing is count-neutral so sparse loggers never read it as judgment.
 */
export async function generateMoodInsights(userId: number): Promise<MoodInsightCard[]> {
  const db = await getDb();
  if (!db) return [];

  const since = new Date(Date.now() - 7 * DAY_MS);
  const entries: MoodEntry[] = await db
    .select()
    .from(moodEntries)
    .where(and(eq(moodEntries.userId, userId), gte(moodEntries.createdAt, since)));

  if (entries.length === 0) return [];

  const cards: MoodInsightCard[] = [];
  const weekTag = since.toISOString().slice(0, 10); // keeps card ids stable per week

  // 1. context_pattern: a context tag appearing 3+ times this week
  const tagCounts = new Map<string, number>();
  for (const e of entries) {
    for (const t of e.contextTags ?? []) tagCounts.set(t, (tagCounts.get(t) ?? 0) + 1);
  }
  const recurring = Array.from(tagCounts.entries())
    .filter(([, n]) => n >= 3)
    .sort((a, b) => b[1] - a[1])[0];
  if (recurring) {
    const [tag, n] = recurring;
    // Where does it cluster? Check linked food logs' meal periods.
    const linkedIds = entries
      .filter(e => (e.contextTags ?? []).includes(tag) && e.linkedFoodLogId != null)
      .map(e => e.linkedFoodLogId as number);
    let around = "";
    if (linkedIds.length >= 2) {
      const logs = await db
        .select({ loggedAt: foodLogs.loggedAt })
        .from(foodLogs)
        .where(and(eq(foodLogs.userId, userId), gte(foodLogs.loggedAt, since)));
      const periods = new Map<string, number>();
      for (const l of logs) {
        const p = mealPeriodOfHour(l.loggedAt.getUTCHours());
        periods.set(p, (periods.get(p) ?? 0) + 1);
      }
      const top = Array.from(periods.entries()).sort((a, b) => b[1] - a[1])[0];
      if (top) around = ` around ${top[0]} meals`;
    }
    cards.push({
      id: `context_pattern:${tag}:${weekTag}`,
      text: `"${tag}" has come up ${n} times in your entries this week${around}. No conclusion to draw — just something you might like to know is there.`,
    });
  }

  // 2. energy_rhythm: where energy check-ins tend to sit by time of day
  const energyByPeriod = new Map<string, number[]>();
  for (const e of entries) {
    if (e.energy == null) continue;
    const p = mealPeriodOfHour(e.createdAt.getUTCHours());
    const arr = energyByPeriod.get(p) ?? [];
    arr.push(e.energy);
    energyByPeriod.set(p, arr);
  }
  const periodAvgs = Array.from(energyByPeriod.entries())
    .filter(([, v]) => v.length >= 2)
    .map(([p, v]) => ({ p, avg: v.reduce((s, x) => s + x, 0) / v.length }));
  if (periodAvgs.length >= 2) {
    const sorted = [...periodAvgs].sort((a, b) => b.avg - a.avg);
    const high = sorted[0];
    const low = sorted[sorted.length - 1];
    if (high.avg - low.avg >= 1) {
      cards.push({
        id: `energy_rhythm:${high.p}:${weekTag}`,
        text: `Your energy check-ins have tended a little higher in the ${high.p} than the ${low.p} this week. Rhythms like that are worth noticing — nothing to fix.`,
      });
    }
  }

  // 3. ease_steady: ease holding steady across check-ins
  const eases = entries.filter(e => e.ease != null).map(e => e.ease as number);
  if (eases.length >= 3) {
    const min = Math.min(...eases);
    const max = Math.max(...eases);
    if (max - min <= 1) {
      cards.push({
        id: `ease_steady:${weekTag}`,
        text: `Your sense of ease has held pretty steady across the ${eases.length} check-ins where you noted it this week.`,
      });
    }
  }

  // 4. presence — count-neutral so sparse check-ins never read as judgment
  cards.push({
    id: `presence:${weekTag}`,
    text: `You've captured ${entries.length} ${entries.length === 1 ? "moment" : "moments"} of how you felt this week — the kind of data only you can add.`,
  });

  return cards.slice(0, 4);
}
