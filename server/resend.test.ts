/**
 * Validates that RESEND_API_KEY is set and accepted by the Resend API.
 * Makes a lightweight GET /domains call — no emails are sent.
 */
import { describe, it, expect } from "vitest";
import "dotenv/config";

describe("Resend API key validation", () => {
  it("should have RESEND_API_KEY set", () => {
    expect(process.env.RESEND_API_KEY, "RESEND_API_KEY is not set").toBeTruthy();
  });

  it("should be accepted by the Resend API", { timeout: 15000 }, async () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn("Skipping live check — RESEND_API_KEY not set");
      return;
    }
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    // 200 = full-access key (can list domains)
    // 401 with "restricted_api_key" = sending-only key — valid for email delivery
    if (res.status === 401) {
      const body = await res.json() as { name?: string };
      if (body.name === "restricted_api_key") {
        console.info("RESEND_API_KEY is a sending-only key — valid for email delivery ✓");
        return;
      }
    }
    expect(res.status, `Resend API returned ${res.status} — key may be invalid`).toBe(200);
  });
});
