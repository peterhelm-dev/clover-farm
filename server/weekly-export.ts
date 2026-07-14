// Weekly Compassionate Export — pattern analysis + fixed template library.
// Per clover-golden-path-weekly-export-spec.md Part 2:
//  * trends only, never target pass/fail framing
//  * averages computed ONLY over logged days, labeled as such
//  * days without logs are simply absent — never zeros, never red
//  * fixed reviewed copy, not generative — tone control is the point
import { and, eq, gte, lt } from "drizzle-orm";
import { foodLogs, type User } from "../drizzle/schema";
import { getDb } from "./db";

const DAY_MS = 24 * 60 * 60 * 1000;

export type MealPeriod = "morning" | "afternoon" | "evening" | "late night";
export type Trend = "up" | "down" | "stable" | "none";

export type WeekPatterns = {
  daysLogged: number;
  totalLogs: number;
  avgCalories: number | null; // per logged day
  avgProtein: number | null; // grams per logged day
  calorieTrend: Trend; // vs previous period, only when prior data is meaningful
  proteinTrend: Trend;
  proteinAvgLow: boolean; // vs a general adult reference (~50g/day), NOT a personal target
  mostCommonMealPeriod: MealPeriod | null;
  preferredMethod: "voice" | "photo" | "text" | null;
};

export type WeeklyReport = {
  available: boolean;
  /** Set when available=false and we know when the first report lands. */
  firstReportAt: number | null;
  periodStart: number;
  periodEnd: number;
  headerLine: string;
  highlights: string[];
  habitNote: string | null;
  gentleSuggestion: string | null;
  caption: string;
  footerNote: string;
  stats: { daysLogged: number; avgCalories: number | null; avgProtein: number | null };
};

// ---------------------------------------------------------------------------
// Period math — weeks are anchored on signup so "end of each 7-day period"
// is per-user, matching the D14 windows.
// ---------------------------------------------------------------------------
export function latestCompletedPeriod(signupAt: Date, now = new Date()) {
  const elapsed = now.getTime() - signupAt.getTime();
  const completedWeeks = Math.floor(elapsed / (7 * DAY_MS));
  if (completedWeeks < 1) {
    return { available: false as const, firstReportAt: signupAt.getTime() + 7 * DAY_MS };
  }
  const periodStart = signupAt.getTime() + (completedWeeks - 1) * 7 * DAY_MS;
  return { available: true as const, periodStart, periodEnd: periodStart + 7 * DAY_MS };
}

// ---------------------------------------------------------------------------
// Pattern analysis — trend calculations only, no target comparisons.
// ---------------------------------------------------------------------------
type LogRow = { loggedAt: Date; calories: string | null; protein: string | null; logMethod: string | null };

function summarize(rows: LogRow[]) {
  const byDay = new Map<string, { calories: number; protein: number }>();
  for (const r of rows) {
    const day = r.loggedAt.toISOString().slice(0, 10);
    const acc = byDay.get(day) ?? { calories: 0, protein: 0 };
    acc.calories += Number(r.calories ?? 0);
    acc.protein += Number(r.protein ?? 0);
    byDay.set(day, acc);
  }
  const days = byDay.size;
  const totals = Array.from(byDay.values());
  return {
    daysLogged: days,
    totalLogs: rows.length,
    avgCalories: days > 0 ? Math.round(totals.reduce((s, d) => s + d.calories, 0) / days) : null,
    avgProtein: days > 0 ? Math.round(totals.reduce((s, d) => s + d.protein, 0) / days) : null,
  };
}

function trendBetween(current: number | null, previous: number | null, prevDays: number): Trend {
  // Only call a trend when the previous week has enough data to mean something.
  if (current == null || previous == null || prevDays < 2 || previous === 0) return "none";
  const delta = (current - previous) / previous;
  if (delta > 0.05) return "up";
  if (delta < -0.05) return "down";
  return "stable";
}

function mealPeriodOf(d: Date): MealPeriod {
  const h = d.getUTCHours();
  if (h >= 5 && h < 11) return "morning";
  if (h >= 11 && h < 17) return "afternoon";
  if (h >= 17 && h < 22) return "evening";
  return "late night";
}

export async function analyzePatterns(userId: number, periodStart: number, periodEnd: number): Promise<WeekPatterns> {
  const db = await getDb();
  if (!db) throw new Error("Database not available");

  const fetch = (startMs: number, endMs: number) =>
    db
      .select({
        loggedAt: foodLogs.loggedAt,
        calories: foodLogs.calories,
        protein: foodLogs.protein,
        logMethod: foodLogs.logMethod,
      })
      .from(foodLogs)
      .where(
        and(
          eq(foodLogs.userId, userId),
          eq(foodLogs.status, "success"),
          gte(foodLogs.loggedAt, new Date(startMs)),
          lt(foodLogs.loggedAt, new Date(endMs))
        )
      );

  const [current, previous] = await Promise.all([
    fetch(periodStart, periodEnd),
    fetch(periodStart - 7 * DAY_MS, periodStart),
  ]);

  const cur = summarize(current);
  const prev = summarize(previous);

  const periodCounts = new Map<MealPeriod, number>();
  const methodCounts = new Map<string, number>();
  for (const r of current) {
    const p = mealPeriodOf(r.loggedAt);
    periodCounts.set(p, (periodCounts.get(p) ?? 0) + 1);
    if (r.logMethod) methodCounts.set(r.logMethod, (methodCounts.get(r.logMethod) ?? 0) + 1);
  }
  const topOf = <K>(m: Map<K, number>): K | null =>
    m.size === 0 ? null : Array.from(m.entries()).sort((a, b) => b[1] - a[1])[0][0];

  return {
    daysLogged: cur.daysLogged,
    totalLogs: cur.totalLogs,
    avgCalories: cur.avgCalories,
    avgProtein: cur.avgProtein,
    calorieTrend: trendBetween(cur.avgCalories, prev.avgCalories, prev.daysLogged),
    proteinTrend: trendBetween(cur.avgProtein, prev.avgProtein, prev.daysLogged),
    proteinAvgLow: cur.avgProtein != null && cur.avgProtein < 50,
    mostCommonMealPeriod: topOf(periodCounts),
    preferredMethod: topOf(methodCounts) as WeekPatterns["preferredMethod"],
  };
}

// ---------------------------------------------------------------------------
// Template library — fixed, reviewed copy. The surrounding language never
// changes at runtime; only the computed pattern values are interpolated.
// Tone bar for every string: would a supportive friend say this?
// ---------------------------------------------------------------------------
const TEMPLATES = {
  weight_mgmt_positive_trend: (p: WeekPatterns) =>
    p.calorieTrend === "down"
      ? "Your average intake ran a little lighter than the week before on the days you logged — steady, unforced shifts like this are what sustainable change is built on."
      : "Your average intake held steady across the days you logged — consistency like that is a quiet win worth noticing.",
  weight_mgmt_neutral_observation: (p: WeekPatterns) =>
    p.avgCalories != null
      ? `Your logged days averaged around ${p.avgCalories} calories. No judgment either way — simply knowing your own baseline is the real value here.`
      : "You checked in with your food this week, and that awareness is the foundation everything else builds on.",
  protein_positive_trend: () =>
    "Protein trended up compared to your previous week — nice momentum on the days you logged.",
  protein_gentle_suggestion: () =>
    "If you're ever looking for ideas, a few easy protein-forward options: eggs or Greek yogurt in the morning, or beans, chicken, or tofu folded into lunch. Only if it sounds good — you know your week best.",
  protein_steady: (p: WeekPatterns) =>
    p.avgProtein != null
      ? `Your protein held steady at roughly ${p.avgProtein}g a day across your logged days — reliable patterns like that do more than occasional big swings.`
      : "Your protein intake held steady across your logged days — reliable patterns beat occasional big swings.",
  general_pattern_observation: (p: WeekPatterns) => {
    if (p.mostCommonMealPeriod && p.preferredMethod) {
      return `Most of your logs landed in the ${p.mostCommonMealPeriod}, usually by ${p.preferredMethod} — sounds like you've found a rhythm that fits your day.`;
    }
    if (p.mostCommonMealPeriod) {
      return `Most of your logs landed in the ${p.mostCommonMealPeriod} — a natural rhythm that fits your day beats forced check-ins every time.`;
    }
    return "You kept a record of your week, in your own way and on your own time — that's exactly how this is meant to work.";
  },
} as const;

// ---------------------------------------------------------------------------
// Report assembly — goal-driven highlight selection per spec 2.5 pseudocode.
// Goals without their own template set fall back to general_awareness copy.
// ---------------------------------------------------------------------------
export function buildReport(
  user: Pick<User, "primaryGoal">,
  patterns: WeekPatterns,
  period: { periodStart: number; periodEnd: number }
): WeeklyReport {
  const p = patterns;
  const highlights: string[] = [];
  let gentleSuggestion: string | null = null;

  if (p.daysLogged === 0) {
    // Empty week: warm, zero shame, no highlights to force.
    return {
      available: true,
      firstReportAt: null,
      ...period,
      headerLine: "A quiet week on the logging front — that's completely okay.",
      highlights: [
        "Life gets full. Clover picks right back up with you whenever it's natural — no streaks to rebuild, no catching up to do.",
      ],
      habitNote: null,
      gentleSuggestion: null,
      caption: "",
      footerNote: FOOTER_NOTE,
      stats: { daysLogged: 0, avgCalories: null, avgProtein: null },
    };
  }

  switch (user.primaryGoal) {
    case "weight_management":
      if (p.calorieTrend === "down" || p.calorieTrend === "stable") {
        highlights.push(TEMPLATES.weight_mgmt_positive_trend(p));
      } else {
        // Neutral, non-judgmental even when the trend isn't the "preferred" direction.
        highlights.push(TEMPLATES.weight_mgmt_neutral_observation(p));
      }
      break;
    case "protein_focus":
      if (p.proteinTrend === "up") {
        highlights.push(TEMPLATES.protein_positive_trend());
      } else if (p.proteinAvgLow) {
        highlights.push(TEMPLATES.protein_steady(p));
        gentleSuggestion = TEMPLATES.protein_gentle_suggestion();
      } else {
        highlights.push(TEMPLATES.protein_steady(p));
      }
      break;
    default:
      // general_awareness + any goal whose template set isn't written yet.
      highlights.push(TEMPLATES.general_pattern_observation(p));
      break;
  }

  const habitNote =
    p.mostCommonMealPeriod != null
      ? `You logged on ${p.daysLogged} ${p.daysLogged === 1 ? "day" : "days"}, most often in the ${p.mostCommonMealPeriod} — a rhythm that fits your life is the one that lasts.`
      : `You logged on ${p.daysLogged} ${p.daysLogged === 1 ? "day" : "days"} this week, on your own schedule — exactly how this is meant to work.`;

  return {
    available: true,
    firstReportAt: null,
    ...period,
    headerLine: `You logged ${p.daysLogged} ${p.daysLogged === 1 ? "day" : "days"} this week — here's what stood out.`,
    highlights,
    habitNote,
    gentleSuggestion,
    caption: "Averages and trends are based only on the days you logged.",
    footerNote: FOOTER_NOTE,
    stats: { daysLogged: p.daysLogged, avgCalories: p.avgCalories, avgProtein: p.avgProtein },
  };
}

const FOOTER_NOTE =
  "This summary is for your own insight — it isn't a medical document. If anything here raises questions, a doctor or dietitian is the right person to explore it with.";
