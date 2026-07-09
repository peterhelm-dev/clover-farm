import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import type Stripe from "stripe";
import { getStripe } from "../_core/stripe";
import {
  getOrCreateSubscription,
  getSubscriptionByUserId,
  updateSubscriptionTier,
} from "../db-subscriptions";
import { PRODUCTS, getAICallLimit } from "../products";

export const billingRouter = router({
  /**
   * Get current subscription status
   */
  getSubscription: protectedProcedure.query(async ({ ctx }) => {
    const sub = await getOrCreateSubscription(ctx.user.id);
    return {
      tier: sub.tier,
      aiCallsUsed: sub.aiCallsUsedThisMonth,
      aiCallsLimit: getAICallLimit(sub.tier),
      stripeCustomerId: sub.stripeCustomerId,
      stripeSubscriptionId: sub.stripeSubscriptionId,
      trialEndsAt: sub.trialEndsAt ?? null,
      freeMonthsRemaining: sub.freeMonthsRemaining ?? 0,
    };
  }),

  /**
   * Create a Stripe checkout session for subscription upgrade
   */
  createCheckoutSession: protectedProcedure
    .input(
      z.object({
        tier: z.enum(["plus", "pro"]),
        billingCycle: z.enum(["monthly", "yearly"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const product = input.tier === "plus" ? PRODUCTS.PLUS : PRODUCTS.PRO;
      const priceInCents =
        input.billingCycle === "monthly"
          ? product.monthlyPrice
          : product.yearlyPrice;

      if (priceInCents === 0) {
        throw new Error("Cannot create checkout for free tier");
      }

      const session = await getStripe().checkout.sessions.create({
        payment_method_types: ["card"],
        mode: "subscription",
        customer_email: ctx.user.email || undefined,
        client_reference_id: ctx.user.id.toString(),
        metadata: {
          user_id: ctx.user.id.toString(),
          tier: input.tier,
          billing_cycle: input.billingCycle,
        },
        line_items: [
          {
            price_data: {
              currency: "usd",
              product_data: {
                name: product.name,
                description: product.description,
              },
              unit_amount: priceInCents,
              recurring: {
                interval: input.billingCycle === "monthly" ? "month" : "year",
                interval_count: 1,
              },
            },
            quantity: 1,
          },
        ],
        success_url: `${ctx.req.headers.origin}/dashboard?session_id={CHECKOUT_SESSION_ID}`,
        cancel_url: `${ctx.req.headers.origin}/dashboard`,
        allow_promotion_codes: true,
      });

      return {
        checkoutUrl: session.url,
        sessionId: session.id,
      };
    }),

  /**
   * Downgrade to free tier (cancel subscription)
   */
  downgradeToFree: protectedProcedure.mutation(async ({ ctx }) => {
    const sub = await getSubscriptionByUserId(ctx.user.id);

    if (!sub || !sub.stripeSubscriptionId) {
      throw new Error("No active subscription found");
    }

    // Cancel the Stripe subscription
    await getStripe().subscriptions.cancel(sub.stripeSubscriptionId);

    // Update local subscription to free tier
    await updateSubscriptionTier(ctx.user.id, "free");

    return {
      success: true,
      tier: "free",
    };
  }),

  /**
   * Get billing history (invoices)
   */
  getBillingHistory: protectedProcedure.query(async ({ ctx }) => {
    const sub = await getSubscriptionByUserId(ctx.user.id);

    if (!sub || !sub.stripeCustomerId) {
      return [];
    }

    const invoices = await getStripe().invoices.list({
      customer: sub.stripeCustomerId,
      limit: 12,
    });

    return invoices.data.map((invoice: Stripe.Invoice) => ({
      id: invoice.id,
      amount: invoice.amount_paid,
      currency: invoice.currency,
      status: invoice.status,
      date: new Date(invoice.created * 1000),
      pdfUrl: invoice.hosted_invoice_url,
    }));
  }),
});
