import Stripe from "stripe";

let _stripe: Stripe | null = null;

/**
 * Lazily-created Stripe client. Constructing `new Stripe()` eagerly at
 * import time throws when STRIPE_SECRET_KEY isn't set, which used to take
 * down the entire server on boot (billing.ts and stripeWebhook.ts are both
 * imported unconditionally by routers.ts/index.ts). Deferring construction
 * means only billing/webhook requests fail until the key is configured.
 */
export function getStripe(): Stripe {
  if (!_stripe) {
    if (!process.env.STRIPE_SECRET_KEY) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    _stripe = new Stripe(process.env.STRIPE_SECRET_KEY);
  }
  return _stripe;
}
