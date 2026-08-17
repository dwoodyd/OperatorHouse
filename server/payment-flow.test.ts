import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("payment flow safety", () => {
  const pricing = readFileSync(resolve(process.cwd(), "client/src/pages/Pricing.tsx"), "utf8");
  const billing = readFileSync(resolve(process.cwd(), "client/src/pages/BillingSetup.tsx"), "utf8");
  const paypal = readFileSync(resolve(process.cwd(), "server/paypal.ts"), "utf8");

  it("sends every plan selection through the verified in-app billing setup", () => {
    expect(pricing).toContain('const setupPath = `/billing-setup?tier=${tier}`');
    expect(pricing).not.toContain("webapps/billing/plans/subscribe");
    expect(billing).toContain("captureSubscription.mutateAsync");
  });

  it("uses the selected tier and avoids resetting trial dates for an existing subscription", () => {
    expect(billing).toContain('requestedTier === "operator_pro"');
    expect(paypal).toContain("existing?.paypalSubscriptionId === subscriptionId");
    expect(paypal).toContain("A different subscription is already associated with this account");
  });
});
