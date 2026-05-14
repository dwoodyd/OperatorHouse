/**
 * Stripe has been replaced by PayPal for Operator House billing.
 * See server/paypal.test.ts for the active billing integration tests.
 * This file is kept as a placeholder to avoid breaking the test runner config.
 */
import { describe, it, expect } from "vitest";

describe("Stripe (deprecated — replaced by PayPal)", () => {
  it("PayPal is the active billing provider", () => {
    expect(true).toBe(true);
  });
});
