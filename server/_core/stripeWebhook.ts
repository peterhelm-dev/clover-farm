import express, { Express, Request, Response } from "express";
import Stripe from "stripe";
import { updateSubscriptionTier } from "../db-subscriptions";

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY || "");
const webhookSecret = process.env.STRIPE_WEBHOOK_SECRET || "";

/**
 * Register Stripe webhook endpoint
 * Must be called BEFORE express.json() middleware so we can access the raw body
 */
export function registerStripeWebhook(app: Express) {
  // Register webhook BEFORE express.json() middleware
  app.post(
    "/api/stripe/webhook",
    express.raw({ type: "application/json" }) as any,
    async (req: Request, res: Response) => {
      const sig = req.headers["stripe-signature"] as string;

      if (!sig || !webhookSecret) {
        console.warn("[Stripe Webhook] Missing signature or webhook secret");
        return res.status(400).json({ error: "Missing signature" });
      }

      let event: Stripe.Event;

      try {
        event = stripe.webhooks.constructEvent(
          req.body as Buffer,
          sig,
          webhookSecret
        );
      } catch (err) {
        console.error("[Stripe Webhook] Signature verification failed:", err);
        return res.status(400).json({ error: "Webhook signature verification failed" });
      }

      // Handle test events (for development/testing)
      if (event.id.startsWith("evt_test_")) {
        console.log("[Stripe Webhook] Test event detected, returning verification response");
        return res.json({
          verified: true,
        });
      }

      try {
        switch (event.type) {
          case "checkout.session.completed": {
            const session = event.data.object as Stripe.Checkout.Session;
            await handleCheckoutSessionCompleted(session);
            break;
          }

          case "customer.subscription.updated": {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionUpdated(subscription);
            break;
          }

          case "customer.subscription.deleted": {
            const subscription = event.data.object as Stripe.Subscription;
            await handleSubscriptionDeleted(subscription);
            break;
          }

          default:
            console.log(`[Stripe Webhook] Unhandled event type: ${event.type}`);
        }

        res.json({ received: true });
      } catch (err) {
        console.error("[Stripe Webhook] Error processing event:", err);
        res.status(500).json({ error: "Webhook processing failed" });
      }
    }
  );
}

/**
 * Handle checkout.session.completed event
 * This is triggered when a user completes payment
 */
async function handleCheckoutSessionCompleted(session: Stripe.Checkout.Session) {
  const userId = session.metadata?.user_id;
  const tier = session.metadata?.tier as "plus" | "pro";
  const stripeCustomerId = session.customer as string;
  const stripeSubscriptionId = session.subscription as string;

  if (!userId || !tier) {
    console.error("[Stripe Webhook] Missing metadata in checkout session");
    return;
  }

  console.log(
    `[Stripe Webhook] Checkout completed for user ${userId}, tier: ${tier}`
  );

  // Update the user's subscription in the database
  await updateSubscriptionTier(
    parseInt(userId),
    tier,
    stripeCustomerId,
    stripeSubscriptionId
  );
}

/**
 * Handle customer.subscription.updated event
 * This is triggered when a subscription is modified (e.g., plan change, pause)
 */
async function handleSubscriptionUpdated(subscription: Stripe.Subscription) {
  const stripeCustomerId = subscription.customer as string;
  const metadata = subscription.metadata;

  console.log(
    `[Stripe Webhook] Subscription updated for customer ${stripeCustomerId}`
  );

  // In a full implementation, you'd look up the user by stripeCustomerId
  // and update their subscription status. For now, we just log it.
}

/**
 * Handle customer.subscription.deleted event
 * This is triggered when a subscription is cancelled
 */
async function handleSubscriptionDeleted(subscription: Stripe.Subscription) {
  const stripeCustomerId = subscription.customer as string;

  console.log(
    `[Stripe Webhook] Subscription cancelled for customer ${stripeCustomerId}`
  );

  // In a full implementation, you'd downgrade the user to the free tier
  // For now, we just log it.
}
