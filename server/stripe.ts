import Stripe from "stripe";
import { getDb, createNotification } from "./db";
import { users, stripeEvents } from "../drizzle/schema";
import { eq } from "drizzle-orm";

export const stripe = new Stripe(process.env.STRIPE_SECRET_KEY ?? "", {
  apiVersion: "2026-03-25.dahlia",
});

// ─── Products ─────────────────────────────────────────────────────────────────
export const PLANS = {
  monthly: {
    name: "Operator House — Monthly",
    priceId: process.env.STRIPE_MONTHLY_PRICE_ID ?? "",
    amount: 9700,
    interval: "month" as const,
  },
  annual: {
    name: "Operator House — Annual",
    priceId: process.env.STRIPE_ANNUAL_PRICE_ID ?? "",
    amount: 79700,
    interval: "year" as const,
  },
} as const;

// ─── Checkout Session ─────────────────────────────────────────────────────────
export async function createCheckoutSession({
  userId, email, name, priceId, origin,
}: {
  userId: number; email: string; name: string; priceId: string; origin: string;
}) {
  const session = await stripe.checkout.sessions.create({
    mode: "subscription",
    payment_method_types: ["card"],
    customer_email: email,
    allow_promotion_codes: true,
    client_reference_id: userId.toString(),
    metadata: { user_id: userId.toString(), customer_email: email, customer_name: name },
    line_items: [{ price: priceId, quantity: 1 }],
    success_url: `${origin}/dashboard?subscribed=1`,
    cancel_url: `${origin}/pricing?cancelled=1`,
  });
  return session;
}

// ─── Access policy ────────────────────────────────────────────────────────────
const ACCESS_STATUSES: readonly Stripe.Subscription.Status[] = ["active", "trialing", "past_due"];

function mapSubscriptionStatus(status: Stripe.Subscription.Status): "active" | "inactive" {
  return ACCESS_STATUSES.includes(status) ? "active" : "inactive";
}

// ─── Webhook Handler ──────────────────────────────────────────────────────────
export async function handleStripeWebhook(rawBody: Buffer, signature: string) {
  const event = stripe.webhooks.constructEvent(
    rawBody, signature, process.env.STRIPE_WEBHOOK_SECRET ?? ""
  );

  const db = await getDb();
  if (db) {
    try {
      await db.insert(stripeEvents).values({ eventId: event.id, eventType: event.type });
    } catch {
      console.log(`[Stripe] Duplicate event ${event.id} (${event.type}) — skipping`);
      return { received: true, duplicate: true };
    }
  }

  switch (event.type) {
    case "checkout.session.completed": {
      const session = event.data.object as Stripe.Checkout.Session;
      const userId = parseInt(session.metadata?.user_id ?? "0");
      if (!userId) break;
      const customerId = session.customer as string;
      const subscriptionId = session.subscription as string;
      if (!db) break;
      await db.update(users).set({ stripeCustomerId: customerId, subscriptionId, subscriptionStatus: "active" }).where(eq(users.id, userId));
      console.log(`[Stripe] Subscription activated for user ${userId}`);
      createNotification({ userId, type: 'payment', title: 'Payment received — Operator House activated', body: 'Your subscription is now active. Welcome to the House.', metadata: { customerId, subscriptionId } }).catch(() => {});
      break;
    }
    case "customer.subscription.updated": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      const status = mapSubscriptionStatus(sub.status);
      if (!db) break;
      await db.update(users).set({ subscriptionStatus: status, subscriptionId: sub.id }).where(eq(users.stripeCustomerId, customerId));
      console.log(`[Stripe] Subscription ${sub.id} updated: stripe=${sub.status} → app=${status}`);
      break;
    }
    case "customer.subscription.deleted": {
      const sub = event.data.object as Stripe.Subscription;
      const customerId = sub.customer as string;
      if (!db) break;
      await db.update(users).set({ subscriptionStatus: "inactive", subscriptionId: null }).where(eq(users.stripeCustomerId, customerId));
      console.log(`[Stripe] Subscription cancelled for customer ${customerId}`);
      break;
    }
    case "invoice.payment_failed": {
      const invoice = event.data.object as Stripe.Invoice;
      const customerId = invoice.customer as string;
      if (!db || !customerId) break;
      const [user] = await db.select({ id: users.id }).from(users).where(eq(users.stripeCustomerId, customerId)).limit(1);
      if (!user) break;
      console.log(`[Stripe] Payment failed for user ${user.id} — notifying`);
      createNotification({ userId: user.id, type: 'payment', title: 'Payment failed — please update your card', body: "We couldn't charge your card for this period. Update your payment method to keep your subscription active.", metadata: { invoiceId: invoice.id, attemptCount: invoice.attempt_count ?? 1 } }).catch(() => {});
      break;
    }
    default:
      console.log(`[Stripe] Unhandled event: ${event.type}`);
  }

  return { received: true };
}
