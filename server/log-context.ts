// Shared user-data context for every AI surface (logging chat, floating
// Q&A panel, daily overview): recent logs, nutrient estimate averages, and
// an explicit statement of what is and isn't tracked, so the model reasons
// honestly about gaps instead of papering over them.
import { getAllFoodLogs, getUserProfile } from "./db-food-logs";
import { MICRONUTRIENT_KEYS, NUTRIENT_REFERENCES } from "./nutrients";

/** Summarise a user's recent logs into a compact text block for the LLM. */
export async function buildLogContext(userId: number): Promise<string> {
  const [logs, profile] = await Promise.all([
    getAllFoodLogs(userId, 50),
    getUserProfile(userId),
  ]);

  if (logs.length === 0) {
    return "The user has not logged any food yet.";
  }

  // Group logs by day (last 7 days)
  const byDay: Record<string, { calories: number; protein: number; carbs: number; fat: number; fiber: number; items: string[] }> = {};
  // Micronutrient sums, only over logs that carry estimates
  const microByDay: Record<string, Record<string, number>> = {};
  let logsWithMicros = 0;
  for (const log of logs) {
    const d = new Date(log.loggedAt instanceof Date ? log.loggedAt : Number(log.loggedAt));
    const key = d.toISOString().slice(0, 10);
    if (!byDay[key]) byDay[key] = { calories: 0, protein: 0, carbs: 0, fat: 0, fiber: 0, items: [] };
    byDay[key].calories += Number(log.calories ?? 0);
    byDay[key].protein += Number(log.protein ?? 0);
    byDay[key].carbs += Number(log.carbs ?? 0);
    byDay[key].fat += Number(log.fat ?? 0);
    byDay[key].fiber += Number(log.fiber ?? 0);
    byDay[key].items.push(log.foodName);

    const micros = log.micronutrients as Record<string, number> | null;
    if (micros) {
      logsWithMicros++;
      if (!microByDay[key]) microByDay[key] = {};
      for (const mk of MICRONUTRIENT_KEYS) {
        microByDay[key][mk] = (microByDay[key][mk] ?? 0) + Number(micros[mk] ?? 0);
      }
    }
  }

  const days = Object.entries(byDay)
    .sort(([a], [b]) => b.localeCompare(a))
    .slice(0, 7);

  const dayLines = days.map(([date, d]) =>
    `${date}: ${Math.round(d.calories)} kcal | ${Math.round(d.protein)}g protein | ${Math.round(d.carbs)}g carbs | ${Math.round(d.fat)}g fat | ${Math.round(d.fiber)}g fiber | Foods: ${d.items.join(", ")}`
  ).join("\n");

  // Micronutrient averages over days that have estimate-bearing logs
  const microDays = Object.keys(microByDay).length;
  let microBlock = "Micronutrient estimates: none available yet (older logs predate micro tracking).";
  if (microDays > 0) {
    const microLines = MICRONUTRIENT_KEYS.map(mk => {
      const ref = NUTRIENT_REFERENCES[mk];
      let total = 0;
      for (const sums of Object.values(microByDay)) total += sums[mk] ?? 0;
      const avg = Math.round((total / microDays) * 10) / 10;
      const range = ref.upperLimit
        ? `advisory upper limit ~${ref.high}${ref.unit}`
        : `typical adult range ${ref.low}–${ref.high}${ref.unit}`;
      return `- ${ref.label}: ~${avg}${ref.unit}/day (${range})`;
    }).join("\n");
    microBlock = `Estimated micronutrient intake, averaged over the ${microDays} day(s) with micro data (ROUGH AI estimates from meal descriptions, not lab measurements):\n${microLines}`;
  }

  // Explicit data-coverage note so the model reasons honestly about gaps
  const last7 = new Set<string>();
  const now = Date.now();
  for (let i = 0; i < 7; i++) last7.add(new Date(now - i * 86400000).toISOString().slice(0, 10));
  const daysLoggedLast7 = Object.keys(byDay).filter(d => last7.has(d)).length;
  const coverageBlock = `Data coverage: the user logged food on ${daysLoggedLast7} of the last 7 days. ${logsWithMicros} of ${logs.length} recent logs carry micronutrient estimates. NOT tracked at all: sleep, physical activity, stress, medications, hydration (only partially, via manual water logging). Unlogged days are unknown — never assume they were empty or the same as logged days.`;

  const profileLine = profile
    ? `User profile: age ${profile.age ?? "unknown"}, weight ${profile.weightLbs ?? "unknown"} lbs, dietary choices: ${(profile.dietaryChoices as string[] | null)?.join(", ") || "none"}, allergies: ${(profile.allergies as string[] | null)?.join(", ") || "none"}, health conditions: ${(profile.healthConditions as string[] | null)?.join(", ") || "none"}. Daily targets: ${profile.calorieTarget} kcal, ${profile.proteinTarget}g protein, ${profile.carbsTarget}g carbs, ${profile.fatTarget}g fat, ${profile.fiberTarget}g fiber.`
    : "No profile set up yet.";

  return `${profileLine}\n\n${coverageBlock}\n\nFood log (last 7 days, most recent first):\n${dayLines}\n\n${microBlock}`;
}

/**
 * Shared guardrails for symptom-adjacent questions (fatigue, energy, sleep):
 * pattern-spotting is welcome, diagnosis is not, and data limits must be
 * named out loud.
 */
export const SYMPTOM_GUARDRAILS = `When the user asks about symptoms or how they feel (fatigue, low energy, poor sleep, brain fog, etc.):
- You MAY point at plausible nutritional patterns in their data (e.g. "your estimated iron intake has averaged below the typical range on the days you logged").
- You MUST name the limits in the same breath: intake numbers are rough AI estimates (not lab values), some days aren't logged, and sleep/activity/stress/medical factors aren't tracked here at all — any of which could matter more than food.
- NEVER diagnose a deficiency or condition. Intake is not absorption; only a blood test can establish deficiency.
- If a symptom is persistent or significant, say clearly that a doctor (and possibly bloodwork) is the right next step, and that this data can be a useful starting point for that conversation — offer the weekly export as something they can bring along.`;
