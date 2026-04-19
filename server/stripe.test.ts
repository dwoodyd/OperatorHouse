/* =============================================================================
   Stripe Webhook — Unit Tests
   ============================================================================= */
import { describe, it, expect, vi, beforeEach } from "vitest";
import type Stripe from "stripe";

/* ── Mocks ──────────────────────────────────────────────────────────────── */
const mockWhere = vi.fn().mockResolvedValue(undefined);
const mockSet = vi.fn(() => ({ where: mockWhere }));
const mockUpdate = vi.fn(() => ({ set: mockSet }));

const mockInsertValues = vi.fn().mockResolvedValue(undefined);
const mockInsert = vi.fn(() => ({ values: mockInsertValues }));

const mockLimit = vi.fn().mockResolvedValue([{ id: 42 }]);
const mockSelectWhere = vi.fn(() => ({ limit: mockLimit }));
const mockFrom = vi.fn(() => ({ where: mockSelectWhere }));
const mockSelect = vi.fn(() => ({ from: mockFrom }));

const mockCreateNotification = vi.fn().mockResolvedValue(undefined);

vi.mock("./db", () => ({
  getDb: vi.fn(async () => ({
    update: mockUpdate,
    insert: mockInsert,
    select: mockSelect,
  })),
  createNotification: mockCreateNotification,
}));

let nextEvent: Stripe.Event;
vi.mock("stripe", () => {
  return {
    default: class MockStripe {
      webhooks = {
        constructEvent: vi.fn(() => nextEvent),
      };
      checkout = { sessions: { create: vi.fn() } };
    },
  };
});

/* ── Helpers ────────────────────────────────────────────────────────────── */
function makeEvent<T>(type: string, obj: T, id = `evt_${Math.random().toString(36).slice(2)}`): Stripe.Event {
  return {
    id,
    type,
    data: { object: obj as unknown as Stripe.Event.Data.Object },
    api_version: "2026-03-25",
    created: Date.now() / 1000,
    livemode: false,
    object: "event",
    pending_webhooks: 0,
    request: { id: null, idempotency_key: null },
  } as unknown as Stripe.Event;
}

beforeEach(() => {
  vi.clearAllMocks();
  mockInsertValues.mockResolvedValue(undefined);
  mockLimit.mockResolvedValue([{ id: 42 }]);
});

/* ── 1. Status mapping ──────────────────────────────────────────────────── */
describe("subscription status mapping", () => {
  const cases: Array<[Stripe.Subscription.Status, "active" | "inactive"]> = [
    ["active",              "active"],
    ["trialing",            "active"],
    ["past_due",            "active"],
    ["canceled",            "inactive"],
    ["unpaid",              "inactive"],
    ["incomplete",          "inactive"],
    ["incomplete_expired",  "inactive"],
    ["paused",              "inactive"],
  ];

  for (const [stripeStatus, appStatus] of cases) {
    it(`maps stripe "${stripeStatus}" → app "${appStatus}"`, async () => {
      const { handleStripeWebhook } = await import("./stripe");
      nextEvent = makeEvent("customer.subscription.updated", {
        id: "sub_test_123",
        customer: "cus_test_abc",
        status: stripeStatus,
      });

      await handleStripeWebhook(Buffer.from("{}"), "sig_test");

      expect(mockSet).toHaveBeenCalledWith(
        expect.objectContaining({ subscriptionStatus: appStatus })
      );
    });
  }
});

/* ── 2. Idempotency ─────────────────────────────────────────────────────── */
describe("webhook idempotency", () => {
  it("skips side effects on duplicate event.id", async () => {
    const { handleStripeWebhook } = await import("./stripe");

    mockInsertValues.mockRejectedValueOnce(
      Object.assign(new Error("ER_DUP_ENTRY"), { code: "ER_DUP_ENTRY" })
    );

    nextEvent = makeEvent(
      "checkout.session.completed",
      { metadata: { user_id: "42" }, customer: "cus_1", subscription: "sub_1" },
      "evt_duplicate_123"
    );

    const result = await handleStripeWebhook(Buffer.from("{}"), "sig_test");

    expect(result).toEqual({ received: true, duplicate: true });
    expect(mockUpdate).not.toHaveBeenCalled();
    expect(mockCreateNotification).not.toHaveBeenCalled();
  });

  it("processes fresh events normally", async () => {
    const { handleStripeWebhook } = await import("./stripe");

    nextEvent = makeEvent(
      "checkout.session.completed",
      { metadata: { user_id: "42" }, customer: "cus_1", subscription: "sub_1" },
      "evt_fresh_456"
    );

    const result = await handleStripeWebhook(Buffer.from("{}"), "sig_test");

    expect(result).toEqual({ received: true });
    expect(mockUpdate).toHaveBeenCalled();
    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({ userId: 42, type: "payment" })
    );
  });
});

/* ── 3. Payment failure notifications ───────────────────────────────────── */
describe("invoice.payment_failed", () => {
  it("sends a notification when Stripe fails to charge", async () => {
    const { handleStripeWebhook } = await import("./stripe");
    nextEvent = makeEvent("invoice.payment_failed", {
      id: "in_test_xyz",
      customer: "cus_test_abc",
      attempt_count: 2,
    });

    await handleStripeWebhook(Buffer.from("{}"), "sig_test");

    expect(mockCreateNotification).toHaveBeenCalledWith(
      expect.objectContaining({
        userId: 42,
        type: "payment",
        title: expect.stringMatching(/payment failed/i),
      })
    );
  });

  it("no-ops when the customer isn't in our database", async () => {
    const { handleStripeWebhook } = await import("./stripe");
    mockLimit.mockResolvedValueOnce([]);

    nextEvent = makeEvent("invoice.payment_failed", {
      id: "in_test_xyz",
      customer: "cus_unknown",
      attempt_count: 1,
    });

    await handleStripeWebhook(Buffer.from("{}"), "sig_test");

    expect(mockCreateNotification).not.toHaveBeenCalled();
  });
});
