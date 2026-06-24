/**
 * Stripe product and pricing definitions for Clover Wellness
 * These are used to create checkout sessions and manage subscriptions
 */

export const PRODUCTS = {
  PLUS: {
    name: "Clover Plus",
    description: "Unlimited voice logs, full history, calendar view, AI health overview, recipe recommendations",
    monthlyPrice: 799, // $7.99 in cents
    yearlyPrice: 5900, // $59/year in cents
    aiCallsPerMonth: Infinity,
  },
  PRO: {
    name: "Clover Pro",
    description: "Everything in Plus, plus travel sourcing, weekly email digest, priority AI response, export to CSV",
    monthlyPrice: 1499, // $14.99 in cents
    yearlyPrice: 9900, // $99/year in cents
    aiCallsPerMonth: Infinity,
  },
  FREE: {
    name: "Clover Free",
    description: "10 AI voice logs per month, basic dashboard, 7-day history",
    monthlyPrice: 0,
    yearlyPrice: 0,
    aiCallsPerMonth: 10,
  },
};

/**
 * Tier limits for AI call usage
 */
export const TIER_LIMITS = {
  free: 10,
  plus: Infinity,
  pro: Infinity,
} as const;

/**
 * Helper to get product details by tier
 */
export function getProductByTier(tier: "free" | "plus" | "pro") {
  switch (tier) {
    case "plus":
      return PRODUCTS.PLUS;
    case "pro":
      return PRODUCTS.PRO;
    case "free":
    default:
      return PRODUCTS.FREE;
  }
}

/**
 * Helper to get AI call limit by tier
 */
export function getAICallLimit(tier: "free" | "plus" | "pro"): number {
  return TIER_LIMITS[tier];
}
