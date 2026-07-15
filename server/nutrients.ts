/**
 * Fixed micronutrient panel — rough per-meal estimates from typical food
 * composition. Everything downstream (LLM output schema, nutrient summary
 * endpoint, stats panel, AI context) derives from these keys, so adding a
 * nutrient here cascades automatically.
 */
export const MICRONUTRIENT_KEYS = [
  // Minerals
  "iron_mg",
  "magnesium_mg",
  "potassium_mg",
  "calcium_mg",
  "zinc_mg",
  "selenium_mcg",
  "sodium_mg",
  // Vitamins
  "vitamin_a_mcg",
  "vitamin_b6_mg",
  "vitamin_b12_mcg",
  "vitamin_c_mg",
  "vitamin_d_mcg",
  "vitamin_e_mg",
  "vitamin_k_mcg",
  "folate_mcg",
] as const;

/**
 * General adult reference ranges — informational context only, NOT personal
 * targets or medical guidance. `upperLimit` marks nutrients where the concern
 * is exceeding, not reaching (sodium).
 */
export const NUTRIENT_REFERENCES: Record<
  (typeof MICRONUTRIENT_KEYS)[number],
  { label: string; unit: string; low: number; high: number; upperLimit?: boolean }
> = {
  // Minerals
  iron_mg: { label: "Iron", unit: "mg", low: 8, high: 18 },
  magnesium_mg: { label: "Magnesium", unit: "mg", low: 310, high: 420 },
  potassium_mg: { label: "Potassium", unit: "mg", low: 2600, high: 3400 },
  calcium_mg: { label: "Calcium", unit: "mg", low: 1000, high: 1200 },
  zinc_mg: { label: "Zinc", unit: "mg", low: 8, high: 11 },
  selenium_mcg: { label: "Selenium", unit: "mcg", low: 55, high: 70 },
  sodium_mg: { label: "Sodium", unit: "mg", low: 0, high: 2300, upperLimit: true },
  // Vitamins
  vitamin_a_mcg: { label: "Vitamin A", unit: "mcg", low: 700, high: 900 },
  vitamin_b6_mg: { label: "Vitamin B6", unit: "mg", low: 1.3, high: 1.7 },
  vitamin_b12_mcg: { label: "Vitamin B12", unit: "mcg", low: 2.4, high: 2.8 },
  vitamin_c_mg: { label: "Vitamin C", unit: "mg", low: 75, high: 90 },
  vitamin_d_mcg: { label: "Vitamin D", unit: "mcg", low: 15, high: 20 },
  vitamin_e_mg: { label: "Vitamin E", unit: "mg", low: 15, high: 19 },
  vitamin_k_mcg: { label: "Vitamin K", unit: "mcg", low: 90, high: 120 },
  folate_mcg: { label: "Folate", unit: "mcg", low: 400, high: 500 },
};
