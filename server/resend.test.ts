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

  it("should be accepted by the Resend API", async () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn("Skipping live check — RESEND_API_KEY not set");
      return;
    }
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    // 200 = valid key, 401 = invalid key
    expect(res.status, `Resend API returned ${res.status} — key may be invalid`).toBe(200);
  });
});
