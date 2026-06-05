/**
 * PayPal Billing Integration — Operator House
 * Pattern B: card-on-file at signup, 90-day trial, then auto-billing at founding rates.
 *
 * Founding rates (locked for life):
 *   Operator:     $399/yr  (annual plan)
 *   Operator Pro: $99/mo   (monthly plan)
 */

import { getDb } from "./db";
import { users } from "../drizzle/schema";
import { eq } from "drizzle-orm";
import { ENV } from "./_core/env";

const PAYPAL_BASE =
  ENV.paypalEnv === "live"
    ? "https://api-m.paypal.com"
    : "https://api-m.sandbox.paypal.com";

const CLIENT_ID = ENV.paypalClientId;
const CLIENT_SECRET = ENV.paypalClientSecret;

export const PLANS = {
  operator: {
    id: ENV.paypalPlanOperator,
    label: "Operator",
    founding: "$399/yr",
    retail: "$797/yr",
  },
  operator_pro: {
    id: ENV.paypalPlanOperatorPro,
    label: "Operator Pro",
    founding: "$99/mo",
    retail: "$197/mo",
  },
} as const;

export type FoundingTier = keyof typeof PLANS;

// ─── Auth ─────────────────────────────────────────────────────────────────────
async function getAccessToken(): Promise<string> {
  const res = await fetch(`${PAYPAL_BASE}/v1/oauth2/token`, {
    method: "POST",
    headers: {
      "Content-Type": "application/x-www-form-urlencoded",
      Authorization:
        "Basic " +
        Buffer.from(`${CLIENT_ID}:${CLIENT_SECRET}`).toString("base64"),
    },
    body: "grant_type=client_credentials",
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal auth failed: ${err}`);
  }
  const data = (await res.json()) as { access_token: string };
  return data.access_token;
}

async function paypalRequest<T>(
  method: string,
  path: string,
  body?: unknown
): Promise<T> {
  const token = await getAccessToken();
  const res = await fetch(`${PAYPAL_BASE}${path}`, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: body ? JSON.stringify(body) : undefined,
  });
  if (!res.ok) {
    const err = await res.text();
    throw new Error(`PayPal API error ${res.status}: ${err}`);
  }
  return res.json() as Promise<T>;
}

// ─── Plan Management ──────────────────────────────────────────────────────────
/**
 * Create the two founding PayPal subscription plans.
 * Run once, then set PAYPAL_PLAN_OPERATOR and PAYPAL_PLAN_OPERATOR_PRO in secrets.
 */
export async function createFoundingPlans() {
  const product = await paypalRequest<{ id: string }>("POST", "/v1/catalogs/products", {
    name: "Operator House",
    description: "Operator House — AI-powered solo operator intelligence platform",
    type: "SERVICE",
    category: "SOFTWARE",
  });

  console.log("Product created:", product.id);

  const operatorPlan = await paypalRequest<{ id: string }>("POST", "/v1/billing/plans", {
    product_id: product.id,
    name: "Operator — Founding Rate",
    description: "Operator founding rate: $399/yr locked for life (retail $797/yr)",
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: { interval_unit: "DAY", interval_count: 90 },
        tenure_type: "TRIAL",
        sequence: 1,
        total_cycles: 1,
        pricing_scheme: { fixed_price: { value: "0", currency_code: "USD" } },
      },
      {
        frequency: { interval_unit: "YEAR", interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 2,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: "399.00", currency_code: "USD" } },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: { value: "0", currency_code: "USD" },
      setup_fee_failure_action: "CONTINUE",
      payment_failure_threshold: 3,
    },
  });

  console.log("Operator plan:", operatorPlan.id, "→ set PAYPAL_PLAN_OPERATOR");

  const operatorProPlan = await paypalRequest<{ id: string }>("POST", "/v1/billing/plans", {
    product_id: product.id,
    name: "Operator Pro — Founding Rate",
    description: "Operator Pro founding rate: $99/mo locked for life (retail $197/mo)",
    status: "ACTIVE",
    billing_cycles: [
      {
        frequency: { interval_unit: "DAY", interval_count: 90 },
        tenure_type: "TRIAL",
        sequence: 1,
        total_cycles: 1,
        pricing_scheme: { fixed_price: { value: "0", currency_code: "USD" } },
      },
      {
        frequency: { interval_unit: "MONTH", interval_count: 1 },
        tenure_type: "REGULAR",
        sequence: 2,
        total_cycles: 0,
        pricing_scheme: { fixed_price: { value: "99.00", currency_code: "USD" } },
      },
    ],
    payment_preferences: {
      auto_bill_outstanding: true,
      setup_fee: { value: "0", currency_code: "USD" },
      setup_fee_failure_action: "CONTINUE",
      payment_failure_threshold: 3,
    },
  });

  console.log("Operator Pro plan:", operatorProPlan.id, "→ set PAYPAL_PLAN_OPERATOR_PRO");

  return {
    productId: product.id,
    operatorPlanId: operatorPlan.id,
    operatorProPlanId: operatorProPlan.id,
  };
}

// ─── Subscription Verification ────────────────────────────────────────────────
interface PayPalSubscription {
  id: string;
  status: string;
  plan_id: string;
  subscriber?: { email_address?: string };
}

export async function getSubscription(subscriptionId: string): Promise<PayPalSubscription> {
  return paypalRequest<PayPalSubscription>("GET", `/v1/billing/subscriptions/${subscriptionId}`);
}

export async function cancelSubscription(subscriptionId: string, reason: string): Promise<void> {
  await paypalRequest("POST", `/v1/billing/subscriptions/${subscriptionId}/cancel`, { reason });
}

// ─── Activate Founding Member ─────────────────────────────────────────────────
export async function activateFoundingMember(
  userId: number,
  subscriptionId: string,
  tier: FoundingTier
): Promise<{ betaStartDate: Date; betaEndDate: Date }> {
  const subscription = await getSubscription(subscriptionId);

  const validStatuses = ["APPROVAL_PENDING", "APPROVED", "ACTIVE"];
  if (!validStatuses.includes(subscription.status)) {
    throw new Error(`Invalid subscription status: ${subscription.status}`);
  }

  const expectedPlanId = PLANS[tier].id;
  if (expectedPlanId && subscription.plan_id !== expectedPlanId) {
    throw new Error(`Plan mismatch: expected ${expectedPlanId}, got ${subscription.plan_id}`);
  }

  const betaStartDate = new Date();
  const betaEndDate = new Date(betaStartDate.getTime() + 90 * 24 * 60 * 60 * 1000);

  const db = await getDb();
  if (db) {
    await db
      .update(users)
      .set({
        paypalSubscriptionId: subscriptionId,
        foundingTier: tier,
        billingStatus: "trialing",
        betaStartDate,
        betaEndDate,
        isFounding: true,
        needsIntro: true,
      })
      .where(eq(users.id, userId));
  }

  return { betaStartDate, betaEndDate };
}

// ─── Webhook Handler ──────────────────────────────────────────────────────────
export interface PayPalWebhookEvent {
  id: string;
  event_type: string;
  resource: {
    id?: string;
    status?: string;
    plan_id?: string;
    custom_id?: string;
    subscriber?: { email_address?: string };
  };
}

export async function handlePayPalWebhook(
  event: PayPalWebhookEvent
): Promise<{ handled: boolean }> {
  const { event_type, resource } = event;
  const subscriptionId = resource.id;

  console.log(`[PayPal Webhook] ${event_type} — subscription: ${subscriptionId}`);

  const db = await getDb();
  if (!db) {
    console.warn("[PayPal Webhook] DB unavailable — event not persisted");
    return { handled: false };
  }

  switch (event_type) {
    case "BILLING.SUBSCRIPTION.ACTIVATED": {
      if (subscriptionId) {
        await db
          .update(users)
          .set({ billingStatus: "active" })
          .where(eq(users.paypalSubscriptionId, subscriptionId));
      }
      break;
    }
    case "BILLING.SUBSCRIPTION.CANCELLED":
    case "BILLING.SUBSCRIPTION.EXPIRED": {
      if (subscriptionId) {
        await db
          .update(users)
          .set({ billingStatus: "cancelled" })
          .where(eq(users.paypalSubscriptionId, subscriptionId));
      }
      break;
    }
    case "BILLING.SUBSCRIPTION.PAYMENT.FAILED": {
      if (subscriptionId) {
        await db
          .update(users)
          .set({ billingStatus: "past_due" })
          .where(eq(users.paypalSubscriptionId, subscriptionId));
      }
      break;
    }
    case "PAYMENT.SALE.COMPLETED": {
      console.log(`[PayPal] Payment completed for subscription: ${subscriptionId}`);
      break;
    }
    default:
      return { handled: false };
  }

  return { handled: true };
}
