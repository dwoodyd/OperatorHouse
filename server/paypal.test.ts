import { describe, it, expect } from "vitest";

// Validate PayPal plan IDs are set in environment
describe("PayPal plan configuration", () => {
  it("should have PAYPAL_PLAN_OPERATOR set", () => {
    const planId = process.env.PAYPAL_PLAN_OPERATOR;
    expect(planId).toBeTruthy();
    expect(planId).toMatch(/^P-/);
  });

  it("should have PAYPAL_PLAN_OPERATOR_PRO set", () => {
    const planId = process.env.PAYPAL_PLAN_OPERATOR_PRO;
    expect(planId).toBeTruthy();
    expect(planId).toMatch(/^P-/);
  });

  it("should have PAYPAL_CLIENT_ID set", () => {
    const clientId = process.env.PAYPAL_CLIENT_ID;
    expect(clientId).toBeTruthy();
    expect(clientId!.length).toBeGreaterThan(10);
  });

  it("should have PAYPAL_CLIENT_SECRET set", () => {
    const secret = process.env.PAYPAL_CLIENT_SECRET;
    expect(secret).toBeTruthy();
    expect(secret!.length).toBeGreaterThan(10);
  });

  it("should be able to authenticate with PayPal sandbox API", async () => {
    const clientId = process.env.PAYPAL_CLIENT_ID!;
    const clientSecret = process.env.PAYPAL_CLIENT_SECRET!;
    const base = process.env.PAYPAL_BASE_URL || "https://api-m.sandbox.paypal.com";

    const res = await fetch(`${base}/v1/oauth2/token`, {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
        Authorization: "Basic " + Buffer.from(`${clientId}:${clientSecret}`).toString("base64"),
      },
      body: "grant_type=client_credentials",
    });

    expect(res.ok).toBe(true);
    const data = await res.json() as { access_token?: string };
    expect(data.access_token).toBeTruthy();
  });
});
