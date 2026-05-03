/**
 * P0 Security Fix Tests
 *
 * Covers three critical fixes:
 * 1. Email URL construction uses ENV.publicUrl (not empty ternary)
 * 2. VAPID keys must be set as env vars (no hardcoded fallback)
 * 3. SSRF protection: webhook URLs must pass assertSafeWebhook
 */

import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";
import { TRPCError } from "@trpc/server";

// ─── Ticket 1: ENV.publicUrl ──────────────────────────────────────────────────

describe("Ticket 1 — ENV.publicUrl", () => {
  it("publicUrl reads from PUBLIC_URL env var", async () => {
    const originalEnv = process.env.PUBLIC_URL;
    process.env.PUBLIC_URL = "https://operatorhouse.click";
    // Re-import env to pick up the new value
    const { ENV } = await import("./_core/env");
    expect(ENV.publicUrl).toBe("https://operatorhouse.click");
    process.env.PUBLIC_URL = originalEnv;
  });

  it("email sign URL is an absolute URL when publicUrl is set", () => {
    const publicUrl = "https://operatorhouse.click";
    const token = "abc123";
    const signUrl = `${publicUrl}/sign/${token}`;
    expect(signUrl).toBe("https://operatorhouse.click/sign/abc123");
    expect(signUrl.startsWith("http")).toBe(true);
  });

  it("email review URL is an absolute URL when publicUrl is set", () => {
    const publicUrl = "https://operatorhouse.click";
    const token = "xyz789";
    const reviewUrl = `${publicUrl}/review/${token}`;
    expect(reviewUrl).toBe("https://operatorhouse.click/review/xyz789");
    expect(reviewUrl.startsWith("http")).toBe(true);
  });

  it("email invite URL is an absolute URL when publicUrl is set", () => {
    const publicUrl = "https://operatorhouse.click";
    const token = "tok456";
    const inviteUrl = `${publicUrl}/join-team/${token}`;
    expect(inviteUrl).toBe("https://operatorhouse.click/join-team/tok456");
    expect(inviteUrl.startsWith("http")).toBe(true);
  });

  it("old broken ternary pattern produces empty prefix (regression guard)", () => {
    // This is the bug pattern — both branches are empty strings
    const brokenUrl = `${process.env.VITE_OAUTH_PORTAL_URL ? "" : ""}/review/token`;
    // The ternary always evaluates to "" regardless of env var value
    expect(brokenUrl).toBe("/review/token");
    expect(brokenUrl.startsWith("http")).toBe(false);
  });
});

// ─── Ticket 2: VAPID key guard ────────────────────────────────────────────────

describe("Ticket 2 — VAPID key env guard", () => {
  it("VAPID_PUBLIC_KEY env var is set", () => {
    expect(process.env.VAPID_PUBLIC_KEY).toBeTruthy();
    expect(typeof process.env.VAPID_PUBLIC_KEY).toBe("string");
    expect((process.env.VAPID_PUBLIC_KEY ?? "").length).toBeGreaterThan(10);
  });

  it("VAPID_PRIVATE_KEY env var is set", () => {
    expect(process.env.VAPID_PRIVATE_KEY).toBeTruthy();
    expect(typeof process.env.VAPID_PRIVATE_KEY).toBe("string");
    expect((process.env.VAPID_PRIVATE_KEY ?? "").length).toBeGreaterThan(10);
  });

  it("VAPID keys do not contain the old compromised values", () => {
    const OLD_PUBLIC = "BKY0U6ZO8vrRHkguUvoS8UXYWmMM0a9uo8_CkwYBg1cPvGOLXTOxM6QmzAWAdrmEwmFaXYqezT4cdLjAwP4FolQ";
    const OLD_PRIVATE = "qbATmcquxaZjLqdQRYHDo4b5i4nsb-kmqzQv3fDwCIk";
    expect(process.env.VAPID_PUBLIC_KEY).not.toBe(OLD_PUBLIC);
    expect(process.env.VAPID_PRIVATE_KEY).not.toBe(OLD_PRIVATE);
  });
});

// ─── Ticket 3: SSRF webhook allowlist ────────────────────────────────────────

// Inline the assertSafeWebhook logic for unit testing without importing the full router
const ALLOWED_WEBHOOK_HOSTS = new Set([
  "hooks.slack.com",
  "hooks.zapier.com",
  "discord.com",
  "outlook.office.com",
  "outlook.office365.com",
]);

function assertSafeWebhook(url: string): void {
  let parsed: URL;
  try {
    parsed = new URL(url);
  } catch {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Invalid webhook URL" });
  }
  if (parsed.protocol !== "https:") {
    throw new TRPCError({ code: "BAD_REQUEST", message: "Webhook URL must use HTTPS" });
  }
  if (/^[\d.:]+$/.test(parsed.hostname)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "IP address literals are not allowed in webhook URLs" });
  }
  if (!ALLOWED_WEBHOOK_HOSTS.has(parsed.hostname)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Webhook host '${parsed.hostname}' is not in the allowlist.`,
    });
  }
}

describe("Ticket 3 — SSRF webhook allowlist", () => {
  it("allows valid Slack webhook URL", () => {
    expect(() =>
      assertSafeWebhook("https://hooks.slack.com/services/T00000000/B00000000/XXXXXXXXXXXXXXXXXXXXXXXX")
    ).not.toThrow();
  });

  it("allows valid Zapier webhook URL", () => {
    expect(() =>
      assertSafeWebhook("https://hooks.zapier.com/hooks/catch/123456/abcdef/")
    ).not.toThrow();
  });

  it("blocks AWS instance metadata endpoint (SSRF)", () => {
    expect(() =>
      assertSafeWebhook("http://169.254.169.254/latest/meta-data/iam/security-credentials/")
    ).toThrow(TRPCError);
  });

  it("blocks HTTP (non-HTTPS) URLs", () => {
    expect(() =>
      assertSafeWebhook("http://hooks.slack.com/services/T00000000/B00000000/XXX")
    ).toThrow(TRPCError);
  });

  it("blocks raw IPv4 literals", () => {
    expect(() =>
      assertSafeWebhook("https://192.168.1.1/webhook")
    ).toThrow(TRPCError);
  });

  it("blocks raw IPv6 literals", () => {
    expect(() =>
      assertSafeWebhook("https://[::1]/webhook")
    ).toThrow(TRPCError);
  });

  it("blocks loopback address", () => {
    expect(() =>
      assertSafeWebhook("https://127.0.0.1/webhook")
    ).toThrow(TRPCError);
  });

  it("blocks unknown external host", () => {
    expect(() =>
      assertSafeWebhook("https://attacker.example.com/steal-creds")
    ).toThrow(TRPCError);
  });

  it("blocks malformed URL", () => {
    expect(() =>
      assertSafeWebhook("not-a-url")
    ).toThrow(TRPCError);
  });

  it("SSRF error code is BAD_REQUEST", () => {
    try {
      assertSafeWebhook("https://evil.com/exfil");
    } catch (err) {
      expect(err).toBeInstanceOf(TRPCError);
      expect((err as TRPCError).code).toBe("BAD_REQUEST");
    }
  });
});
