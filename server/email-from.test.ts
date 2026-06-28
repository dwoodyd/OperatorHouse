/**
 * Validates EMAIL_FROM is set correctly and that the sending domain
 * is verified in Resend (so emails will actually deliver).
 */
import { describe, it, expect } from "vitest";
import "dotenv/config";

describe("EMAIL_FROM configuration", () => {
  it("should have EMAIL_FROM set", () => {
    expect(process.env.EMAIL_FROM, "EMAIL_FROM is not set").toBeTruthy();
  });

  it("should contain a valid email address format", () => {
    const from = process.env.EMAIL_FROM ?? "";
    // Accepts both "hello@domain.com" and "Name <hello@domain.com>"
    const emailRegex = /[a-zA-Z0-9._%+\-]+@[a-zA-Z0-9.\-]+\.[a-zA-Z]{2,}/;
    expect(emailRegex.test(from), `EMAIL_FROM "${from}" does not contain a valid email`).toBe(true);
  });

  it("should confirm mail.operatorhouse.click is verified in Resend", async () => {
    const key = process.env.RESEND_API_KEY;
    if (!key) {
      console.warn("Skipping — RESEND_API_KEY not set");
      return;
    }
    const res = await fetch("https://api.resend.com/domains", {
      headers: { Authorization: `Bearer ${key}` },
    });
    expect(res.status).toBe(200);
    const body = await res.json() as { data: Array<{ name: string; status: string }> };
    const domain = body.data?.find((d) => d.name === "mail.operatorhouse.click");
    expect(domain, "mail.operatorhouse.click not found in Resend domains").toBeTruthy();
    expect(domain?.status, `Domain status is "${domain?.status}" — expected "verified"`).toBe("verified");
  });
});
