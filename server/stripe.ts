import Stripe from "stripe";
import { getDb, createNotification } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

// ─── Products ─────────────────────────────────────────────────────────────────
export const PLANS = {
  monthly: {
    name: "Operator House — Monthly",
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID ?? "",
    amount: 9700, // $97/month
    interval: "month" as const,
  },
  annual: {
    name: "Operator House — Annual",
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID ?? "",
    amount: 79700, // $797/year
    interval: "year" as const,
  },
} as const;

// ─── Checkout Session ─────────────────────────────────────────────────────────
export async function createCheckoutSession({
  userId,
  email,
  name,
  priceId,
  origin,
}: {
  userId: number;
  email: string;
  name: string;
  priceId: string;
  origin: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
    allow_promotion_codes: true,
    client_reference_id: userId.toString(),
    metadata: {
      user_id: userId.toString(),
      customer_email: email,
      customer_name: name,
    },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?subscribed=1`,
    cancel_url: `${origin}/pricing?cancelled=1`,
  });
  return session;
}

// ─── Webhook Handlers ─────────────────────────────────────────────────────────
export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  const event = stripe.webhooks.constructEvent(
    rawBody,
    signature,
    process.env.STRIPE_WEBHOOK_SECRET ?? ""
  );

  // Test event passthrough
  if (event.id.startsWith("evt_test_")) {
    console.log("[Webhook] Test event detected, returning verification response");
    return { verified: true };
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = parseInt(session.metadata?.user_id ?? "0");
      if (!userId) break;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      const db = await getDb();
      if (!db) break;
      await db
        .update(users)
        .set({
          stripeCustomerId: customerId,
          subscriptionId,
          subscriptionStatus: "active",
        })
        .where(eq(users.id, userId));
      console.log(`[Stripe] Subscription activated for user ${userId}`);
      createNotification({
        userId,
        type: 'payment',
        title: 'Payment received — Operator House activated',
        body: 'Your subscription is now active. Welcome to the House.',
        metadata: { customerId, subscriptionId },
      }).catch(() => {});
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const status = sub.status === "active" ? "active" : "inactive";
      const db2 = await getDb();
      if (!db2) break;
      await db2
        .update(users)
        .set({ subscriptionStatus: status, subscriptionId: sub.id })
        .where(eq(users.stripeCustomerId, customerId));
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const db3 = await getDb();
      if (!db3) break;
      await db3
        .update(users)
        .set({ subscriptionStatus: "inactive", subscriptionId: null })
        .where(eq(users.stripeCustomerId, customerId));
      console.log(`[Stripe] Subscription cancelled for customer ${customerId}`);
      break;
    }
    default:
      console.log(`[Stripe] Unhandled event: ${event.type}`);
  }

  return { received: true };
}
