/**
 * Phase 18 — Integrations Hub
 * API key management, integration configs, Slack webhooks, Google Calendar stub, QuickBooks CSV export
 */
import { z } from "zod";
import crypto from "crypto";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { eq, and, desc } from "drizzle-orm";
import { apiKeys, integrationConfigs, integrationLogs, invoices } from "../../drizzle/schema";

// ── helpers ──────────────────────────────────────────────────────────────────

// ─── SSRF protection ─────────────────────────────────────────────────────────
// Only allow outbound webhook POSTs to known SaaS hosts.
// This prevents operators from pointing webhookUrl at internal cloud metadata
// endpoints (e.g. http://169.254.169.254/...) to exfiltrate credentials.
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
  // Reject raw IP literals (covers link-local, loopback, and RFC-1918 ranges)
  if (/^[\d.:]+$/.test(parsed.hostname)) {
    throw new TRPCError({ code: "BAD_REQUEST", message: "IP address literals are not allowed in webhook URLs" });
  }
  if (!ALLOWED_WEBHOOK_HOSTS.has(parsed.hostname)) {
    throw new TRPCError({
      code: "BAD_REQUEST",
      message: `Webhook host '${parsed.hostname}' is not in the allowlist. Allowed: ${Array.from(ALLOWED_WEBHOOK_HOSTS).join(", ")}`,
    });
  }
}

function generateApiKey(): { raw: string; prefix: string; hash: string } {
  const raw = `ohk_${crypto.randomBytes(32).toString("hex")}`;
  const prefix = raw.slice(0, 12);
  const hash = crypto.createHash("sha256").update(raw).digest("hex");
  return { raw, prefix, hash };
}

async function logIntegration(
  db: NonNullable<Awaited<ReturnType<typeof getDb>>>,
  userId: number,
  provider: string,
  event: string,
  status: "success" | "error",
  payload?: object,
  error?: string
) {
  await db.insert(integrationLogs).values({
    userId,
    provider,
    event,
    status,
    payload: payload ? JSON.stringify(payload) : null,
    error: error ?? null,
  });
}

// ── router ────────────────────────────────────────────────────────────────────

export const integrationsRouter = router({
  // ── API Keys ──────────────────────────────────────────────────────────────

  listApiKeys: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    return db
      .select({
        id: apiKeys.id,
        name: apiKeys.name,
        keyPrefix: apiKeys.keyPrefix,
        scopes: apiKeys.scopes,
        lastUsedAt: apiKeys.lastUsedAt,
        expiresAt: apiKeys.expiresAt,
        isActive: apiKeys.isActive,
        createdAt: apiKeys.createdAt,
      })
      .from(apiKeys)
      .where(eq(apiKeys.userId, ctx.user.id))
      .orderBy(desc(apiKeys.createdAt));
  }),

  createApiKey: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(100),
      scopes: z.array(z.string()).default([]),
      expiresInDays: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { raw, prefix, hash } = generateApiKey();
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 86400000)
        : null;
      await db.insert(apiKeys).values({
        userId: ctx.user.id,
        name: input.name,
        keyHash: hash,
        keyPrefix: prefix,
        scopes: JSON.stringify(input.scopes),
        expiresAt: expiresAt ?? undefined,
      });
      return { key: raw, prefix };
    }),

  revokeApiKey: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(apiKeys)
        .set({ isActive: 0 })
        .where(and(eq(apiKeys.id, input.id), eq(apiKeys.userId, ctx.user.id)));
      return { ok: true };
    }),

  // ── Integration Configs ───────────────────────────────────────────────────

  listIntegrations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const saved = await db
      .select({
        id: integrationConfigs.id,
        provider: integrationConfigs.provider,
        isEnabled: integrationConfigs.isEnabled,
        lastTestedAt: integrationConfigs.lastTestedAt,
        lastTestStatus: integrationConfigs.lastTestStatus,
        updatedAt: integrationConfigs.updatedAt,
      })
      .from(integrationConfigs)
      .where(eq(integrationConfigs.userId, ctx.user.id));

    const catalog = [
      { provider: "slack", label: "Slack", description: "Post notifications to a Slack channel when new leads, bookings, or invoices arrive.", icon: "slack", fields: [{ key: "webhookUrl", label: "Webhook URL", type: "url", placeholder: "https://hooks.slack.com/services/..." }] },
      { provider: "google_calendar", label: "Google Calendar", description: "Sync confirmed bookings to your Google Calendar automatically.", icon: "google", fields: [{ key: "calendarId", label: "Calendar ID", type: "text", placeholder: "your-calendar@gmail.com" }, { key: "serviceAccountJson", label: "Service Account JSON", type: "textarea", placeholder: '{"type":"service_account",...}' }] },
      { provider: "quickbooks", label: "QuickBooks", description: "Export paid invoices to QuickBooks-compatible CSV for accounting.", icon: "quickbooks", fields: [{ key: "companyName", label: "Company Name", type: "text", placeholder: "Acme Corp" }] },
      { provider: "zapier", label: "Zapier", description: "Trigger Zapier zaps from Operator House events via webhook.", icon: "zapier", fields: [{ key: "webhookUrl", label: "Zapier Webhook URL", type: "url", placeholder: "https://hooks.zapier.com/hooks/catch/..." }] },
      { provider: "stripe_connect", label: "Stripe Connect", description: "Accept payments directly from clients via Stripe-powered invoices.", icon: "stripe", fields: [{ key: "publishableKey", label: "Publishable Key", type: "text", placeholder: "pk_live_..." }, { key: "secretKey", label: "Secret Key", type: "password", placeholder: "sk_live_..." }] },
      { provider: "apollo", label: "Apollo.io", description: "Search millions of B2B contacts and companies. Filter by title, industry, location, and technology.", icon: "apollo", fields: [{ key: "apiKey", label: "Apollo API Key", type: "password", placeholder: "api_key_..." }] },
    ];

    return catalog.map(c => {
      const savedRow = saved.find(s => s.provider === c.provider);
      return {
        ...c,
        isEnabled: savedRow ? Boolean(savedRow.isEnabled) : false,
        lastTestedAt: savedRow?.lastTestedAt ?? null,
        lastTestStatus: savedRow?.lastTestStatus ?? null,
        configId: savedRow?.id ?? null,
      };
    });
  }),

  saveIntegrationConfig: protectedProcedure
    .input(z.object({
      provider: z.string(),
      config: z.record(z.string(), z.string()),
      isEnabled: z.boolean().default(true),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const existing = await db
        .select({ id: integrationConfigs.id })
        .from(integrationConfigs)
        .where(and(eq(integrationConfigs.userId, ctx.user.id), eq(integrationConfigs.provider, input.provider)))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(integrationConfigs)
          .set({ config: JSON.stringify(input.config), isEnabled: input.isEnabled ? 1 : 0 })
          .where(and(eq(integrationConfigs.userId, ctx.user.id), eq(integrationConfigs.provider, input.provider)));
      } else {
        await db.insert(integrationConfigs).values({
          userId: ctx.user.id,
          provider: input.provider,
          config: JSON.stringify(input.config),
          isEnabled: input.isEnabled ? 1 : 0,
        });
      }

      await logIntegration(db, ctx.user.id, input.provider, "config_saved", "success");
      return { ok: true };
    }),

  testIntegration: protectedProcedure
    .input(z.object({ provider: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [row] = await db
        .select({ config: integrationConfigs.config })
        .from(integrationConfigs)
        .where(and(eq(integrationConfigs.userId, ctx.user.id), eq(integrationConfigs.provider, input.provider)))
        .limit(1);

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Integration not configured" });

      const config = JSON.parse(row.config) as Record<string, string>;
      let status: "success" | "error" = "success";
      let message = "Connection verified";

      try {
        if (input.provider === "slack") {
          if (!config.webhookUrl) throw new Error("Missing webhook URL");
          assertSafeWebhook(config.webhookUrl);
          const res = await fetch(config.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ text: "✅ Operator House integration test — connection successful!" }),
          });
          if (!res.ok) throw new Error(`Slack returned ${res.status}`);
        } else if (input.provider === "zapier") {
          if (!config.webhookUrl) throw new Error("Missing webhook URL");
          assertSafeWebhook(config.webhookUrl);
          const res = await fetch(config.webhookUrl, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ event: "test", source: "operator_house", timestamp: new Date().toISOString() }),
          });
          if (!res.ok) throw new Error(`Zapier returned ${res.status}`);
        } else if (input.provider === "apollo") {
          const { testApiKey } = await import("../services/apollo");
          if (!config.apiKey) throw new Error("Missing Apollo API key");
          const result = await testApiKey(config.apiKey);
          if (!result.valid) throw new Error(result.message);
          message = result.message;
        } else {
          message = "Configuration saved — live sync will activate on next event";
        }
      } catch (err) {
        status = "error";
        message = err instanceof Error ? err.message : "Test failed";
      }

      await db
        .update(integrationConfigs)
        .set({ lastTestedAt: new Date(), lastTestStatus: status })
        .where(and(eq(integrationConfigs.userId, ctx.user.id), eq(integrationConfigs.provider, input.provider)));

      await logIntegration(db, ctx.user.id, input.provider, "test", status, undefined, status === "error" ? message : undefined);
      return { status, message };
    }),

  toggleIntegration: protectedProcedure
    .input(z.object({ provider: z.string(), isEnabled: z.boolean() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(integrationConfigs)
        .set({ isEnabled: input.isEnabled ? 1 : 0 })
        .where(and(eq(integrationConfigs.userId, ctx.user.id), eq(integrationConfigs.provider, input.provider)));
      return { ok: true };
    }),

  // ── QuickBooks CSV Export ─────────────────────────────────────────────────

  exportInvoicesCsv: protectedProcedure
    .input(z.object({
      status: z.enum(["paid", "all"]).default("paid"),
    }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const conditions = [eq(invoices.userId, ctx.user.id)];
      if (input.status === "paid") conditions.push(eq(invoices.status, "paid"));

      const rows = await db
        .select({
          invoiceNumber: invoices.invoiceNumber,
          clientName: invoices.clientName,
          clientEmail: invoices.clientEmail,
          total: invoices.total,
          taxAmount: invoices.taxAmount,
          discountAmount: invoices.discountAmount,
          status: invoices.status,
          sentAt: invoices.sentAt,
          dueDate: invoices.dueDate,
          currency: invoices.currency,
          notes: invoices.notes,
        })
        .from(invoices)
        .where(and(...conditions))
        .orderBy(desc(invoices.createdAt))
        .limit(1000);

      const headers = ["Invoice Number", "Customer", "Email", "Amount", "Tax", "Discount", "Status", "Issue Date", "Due Date", "Currency", "Memo"];
      const csvRows = rows.map(inv => [
        inv.invoiceNumber ?? "",
        inv.clientName ?? "",
        inv.clientEmail ?? "",
        inv.total ?? "0",
        inv.taxAmount ?? "0",
        inv.discountAmount ?? "0",
        inv.status ?? "",
        inv.sentAt ? new Date(inv.sentAt).toLocaleDateString("en-US") : "",
        inv.dueDate ? new Date(inv.dueDate).toLocaleDateString("en-US") : "",
        inv.currency ?? "USD",
        inv.notes ?? "",
      ].map(v => `"${String(v).replace(/"/g, '""')}"`).join(","));

      const csv = [headers.join(","), ...csvRows].join("\n");
      await logIntegration(db, ctx.user.id, "quickbooks", "csv_export", "success", { count: rows.length });
      return { csv, count: rows.length };
    }),

  // ── Slack Notify ──────────────────────────────────────────────────────────

  sendSlackNotification: protectedProcedure
    .input(z.object({ message: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return { ok: false };

      const [row] = await db
        .select({ config: integrationConfigs.config })
        .from(integrationConfigs)
        .where(and(
          eq(integrationConfigs.userId, ctx.user.id),
          eq(integrationConfigs.provider, "slack"),
          eq(integrationConfigs.isEnabled, 1)
        ))
        .limit(1);

      if (!row) return { ok: false, reason: "Slack not configured" };
      const { webhookUrl } = JSON.parse(row.config) as { webhookUrl?: string };
      if (!webhookUrl) return { ok: false, reason: "No webhook URL" };

      try {
        assertSafeWebhook(webhookUrl);
        await fetch(webhookUrl, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ text: input.message }),
        });
        await logIntegration(db, ctx.user.id, "slack", "notification_sent", "success");
        return { ok: true };
      } catch (err) {
        await logIntegration(db, ctx.user.id, "slack", "notification_sent", "error", undefined, String(err));
        return { ok: false };
      }
    }),

  // ── Integration Logs ──────────────────────────────────────────────────────

  listLogs: protectedProcedure
    .input(z.object({ provider: z.string().optional(), limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const conditions = [eq(integrationLogs.userId, ctx.user.id)];
      if (input.provider) conditions.push(eq(integrationLogs.provider, input.provider));

      return db
        .select({
          id: integrationLogs.id,
          provider: integrationLogs.provider,
          event: integrationLogs.event,
          status: integrationLogs.status,
          error: integrationLogs.error,
          createdAt: integrationLogs.createdAt,
        })
        .from(integrationLogs)
        .where(and(...conditions))
        .orderBy(desc(integrationLogs.createdAt))
        .limit(input.limit);
    }),
});
