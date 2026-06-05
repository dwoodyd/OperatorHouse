/**
 * Invoicing & Payments Router — Phase 8
 * Invoice CRUD, Stripe payment links, status tracking, revenue stats
 */
import { z } from "zod";
import { ENV } from "../_core/env";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";

const lineItemSchema = z.object({
  description: z.string().min(1),
  quantity: z.number().min(0),
  rate: z.number().min(0),
  amount: z.number().min(0),
});

export const invoicingRouter = router({
  // ── Invoice CRUD ──────────────────────────────────────────────────────────

  listInvoices: protectedProcedure
    .input(
      z.object({
        status: z.string().optional(),
        search: z.string().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const { invoices } = await import("../../drizzle/schema");
      const { eq, and, like, desc } = await import("drizzle-orm");

      const conditions = [eq(invoices.userId, ctx.user.id)];
      if (input.status) conditions.push(eq(invoices.status, input.status as any));
      if (input.search) {
        conditions.push(like(invoices.clientName, `%${input.search}%`));
      }

      return db
        .select()
        .from(invoices)
        .where(and(...conditions))
        .orderBy(desc(invoices.createdAt))
        .limit(input.limit)
        .offset(input.offset);
    }),

  getInvoice: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { invoices, paymentRecords } = await import("../../drizzle/schema");
      const { eq, and, desc } = await import("drizzle-orm");

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, input.id), eq(invoices.userId, ctx.user.id)));
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });

      const payments = await db
        .select()
        .from(paymentRecords)
        .where(and(eq(paymentRecords.invoiceId, input.id), eq(paymentRecords.userId, ctx.user.id)))
        .orderBy(desc(paymentRecords.paidAt));

      return { ...invoice, payments };
    }),

  createInvoice: protectedProcedure
    .input(
      z.object({
        contactId: z.number().optional(),
        companyId: z.number().optional(),
        clientName: z.string().min(1),
        clientEmail: z.string().email().optional().or(z.literal("")),
        lineItems: z.array(lineItemSchema).min(1),
        taxRate: z.number().min(0).max(100).default(0),
        discountAmount: z.number().min(0).default(0),
        currency: z.string().default("USD"),
        paymentTerms: z.enum(["due_on_receipt", "net_15", "net_30", "net_60"]).default("net_30"),
        dueDate: z.date().optional(),
        notes: z.string().optional(),
        isRecurring: z.boolean().default(false),
        recurringInterval: z.enum(["weekly", "monthly", "quarterly", "yearly"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { invoices, invoiceCounters } = await import("../../drizzle/schema");
      const { eq, sql } = await import("drizzle-orm");
      const userId = ctx.user.id;

      // Get/increment invoice counter
      await db
        .insert(invoiceCounters)
        .values({ userId, lastNumber: 1 })
        .onDuplicateKeyUpdate({ set: { lastNumber: sql`lastNumber + 1` } });
      const [counter] = await db.select().from(invoiceCounters).where(eq(invoiceCounters.userId, userId));
      const invoiceNumber = `OH-${String(counter.lastNumber).padStart(4, "0")}`;

      // Calculate totals
      const subtotal = input.lineItems.reduce((sum, item) => sum + item.amount, 0);
      const taxAmount = (subtotal * input.taxRate) / 100;
      const total = subtotal + taxAmount - input.discountAmount;

      // Calculate due date from payment terms if not provided
      let dueDate = input.dueDate;
      if (!dueDate) {
        const days = { due_on_receipt: 0, net_15: 15, net_30: 30, net_60: 60 }[input.paymentTerms];
        dueDate = new Date(Date.now() + days * 86400000);
      }

      await db.insert(invoices).values({
        userId,
        invoiceNumber,
        contactId: input.contactId,
        companyId: input.companyId,
        clientName: input.clientName,
        clientEmail: input.clientEmail || null,
        lineItems: input.lineItems,
        subtotal,
        taxRate: input.taxRate,
        taxAmount,
        discountAmount: input.discountAmount,
        total,
        currency: input.currency,
        paymentTerms: input.paymentTerms,
        dueDate,
        notes: input.notes,
        isRecurring: input.isRecurring,
        recurringInterval: input.recurringInterval,
        status: "draft",
      });

      return { invoiceNumber, total };
    }),

  updateInvoice: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        clientName: z.string().min(1).optional(),
        clientEmail: z.string().email().optional().or(z.literal("")),
        lineItems: z.array(lineItemSchema).optional(),
        taxRate: z.number().min(0).max(100).optional(),
        discountAmount: z.number().min(0).optional(),
        paymentTerms: z.enum(["due_on_receipt", "net_15", "net_30", "net_60"]).optional(),
        dueDate: z.date().optional(),
        notes: z.string().optional(),
        status: z.enum(["draft", "sent", "viewed", "paid", "overdue", "cancelled"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { invoices } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const { id, lineItems, ...rest } = input;

      let updates: Record<string, unknown> = { ...rest, clientEmail: rest.clientEmail || null };

      if (lineItems) {
        const subtotal = lineItems.reduce((sum, item) => sum + item.amount, 0);
        const taxRate = rest.taxRate ?? 0;
        const discountAmount = rest.discountAmount ?? 0;
        const taxAmount = (subtotal * taxRate) / 100;
        const total = subtotal + taxAmount - discountAmount;
        updates = { ...updates, lineItems, subtotal, taxAmount, total };
      }

      await db
        .update(invoices)
        .set(updates as any)
        .where(and(eq(invoices.id, id), eq(invoices.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteInvoice: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { invoices } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      await db
        .delete(invoices)
        .where(and(eq(invoices.id, input.id), eq(invoices.userId, ctx.user.id)));
      return { success: true };
    }),

  sendInvoice: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { invoices } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, input.id), eq(invoices.userId, ctx.user.id)));
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });
      if (!invoice.clientEmail) throw new TRPCError({ code: "BAD_REQUEST", message: "No client email on invoice" });

      // Send via Resend
      const RESEND_API_KEY = ENV.resendApiKey;
      if (RESEND_API_KEY) {
        const { Resend } = await import("resend");
        const resend = new Resend(RESEND_API_KEY);
        const lineItemsTyped = invoice.lineItems as Array<{ description: string; quantity: number; rate: number; amount: number }>;
        await resend.emails.send({
          from: ENV.emailFrom,
          to: invoice.clientEmail,
          subject: `Invoice ${invoice.invoiceNumber} from Operator House`,
          html: `
            <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:32px;background:#0f0f0f;color:#e5e5e5;border-radius:8px;">
              <h1 style="color:#f5c842;margin-bottom:4px;">Invoice ${invoice.invoiceNumber}</h1>
              <p style="color:#888;margin-top:0;">Due: ${invoice.dueDate ? new Date(invoice.dueDate).toLocaleDateString() : "On Receipt"}</p>
              <hr style="border-color:#333;margin:24px 0;"/>
              <table style="width:100%;border-collapse:collapse;">
                <thead>
                  <tr style="border-bottom:1px solid #333;">
                    <th style="text-align:left;padding:8px 0;color:#888;">Description</th>
                    <th style="text-align:right;padding:8px 0;color:#888;">Qty</th>
                    <th style="text-align:right;padding:8px 0;color:#888;">Rate</th>
                    <th style="text-align:right;padding:8px 0;color:#888;">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  ${lineItemsTyped.map((item) => `
                    <tr style="border-bottom:1px solid #222;">
                      <td style="padding:8px 0;">${item.description}</td>
                      <td style="text-align:right;padding:8px 0;">${item.quantity}</td>
                      <td style="text-align:right;padding:8px 0;">$${item.rate.toFixed(2)}</td>
                      <td style="text-align:right;padding:8px 0;">$${item.amount.toFixed(2)}</td>
                    </tr>
                  `).join("")}
                </tbody>
              </table>
              <hr style="border-color:#333;margin:24px 0;"/>
              <div style="text-align:right;">
                <p>Subtotal: $${invoice.subtotal.toFixed(2)}</p>
                ${invoice.taxAmount > 0 ? `<p>Tax (${invoice.taxRate}%): $${invoice.taxAmount.toFixed(2)}</p>` : ""}
                ${invoice.discountAmount > 0 ? `<p>Discount: -$${invoice.discountAmount.toFixed(2)}</p>` : ""}
                <h2 style="color:#f5c842;">Total: $${invoice.total.toFixed(2)} ${invoice.currency}</h2>
              </div>
              ${invoice.notes ? `<p style="color:#888;margin-top:24px;">${invoice.notes}</p>` : ""}
              <p style="color:#666;font-size:12px;margin-top:32px;">Sent via Operator House</p>
            </div>
          `,
        });
      }

      await db
        .update(invoices)
        .set({ status: "sent", sentAt: new Date() })
        .where(eq(invoices.id, input.id));

      return { success: true };
    }),

  markPaid: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        amount: z.number().optional(),
        method: z.enum(["stripe", "bank_transfer", "cash", "check", "other"]).default("other"),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { invoices, paymentRecords } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, input.id), eq(invoices.userId, ctx.user.id)));
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });

      const paidAmount = input.amount ?? invoice.total;
      await db.insert(paymentRecords).values({
        userId: ctx.user.id,
        invoiceId: input.id,
        amount: paidAmount,
        currency: invoice.currency,
        method: input.method,
        notes: input.notes,
        paidAt: new Date(),
      });

      await db
        .update(invoices)
        .set({ status: "paid", paidAt: new Date(), paymentMethod: input.method })
        .where(eq(invoices.id, input.id));

      return { success: true };
    }),

  createStripePaymentLink: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { invoices } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const [invoice] = await db
        .select()
        .from(invoices)
        .where(and(eq(invoices.id, input.id), eq(invoices.userId, ctx.user.id)));
      if (!invoice) throw new TRPCError({ code: "NOT_FOUND", message: "Invoice not found" });

      const STRIPE_SECRET_KEY = ENV.stripeSecretKey;
      if (!STRIPE_SECRET_KEY) {
        throw new TRPCError({ code: "PRECONDITION_FAILED", message: "Stripe not configured" });
      }

      const Stripe = (await import("stripe")).default;
      const stripe = new Stripe(STRIPE_SECRET_KEY, { apiVersion: "2026-03-25.dahlia" });

      // Create a price and payment link
      const price = await stripe.prices.create({
        currency: invoice.currency.toLowerCase(),
        unit_amount: Math.round(invoice.total * 100),
        product_data: { name: `Invoice ${invoice.invoiceNumber}` },
      });

      const link = await stripe.paymentLinks.create({
        line_items: [{ price: price.id, quantity: 1 }],
        metadata: { invoiceId: String(invoice.id), invoiceNumber: invoice.invoiceNumber },
      });

      await db
        .update(invoices)
        .set({ stripePaymentLinkId: link.id })
        .where(eq(invoices.id, input.id));

      return { url: link.url, linkId: link.id };
    }),

  // ── Revenue Stats ─────────────────────────────────────────────────────────

  getRevenueStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalRevenue: 0, outstanding: 0, overdue: 0, mrr: 0, byMonth: [], byClient: [] };
    const { invoices } = await import("../../drizzle/schema");
    const { eq, and, gte } = await import("drizzle-orm");
    const userId = ctx.user.id;

    const allInvoices = await db.select().from(invoices).where(eq(invoices.userId, userId));

    const totalRevenue = allInvoices
      .filter((i) => i.status === "paid")
      .reduce((sum, i) => sum + i.total, 0);

    const outstanding = allInvoices
      .filter((i) => ["sent", "viewed"].includes(i.status))
      .reduce((sum, i) => sum + i.total, 0);

    const overdue = allInvoices
      .filter((i) => i.status === "overdue" || (["sent", "viewed"].includes(i.status) && i.dueDate && i.dueDate < new Date()))
      .reduce((sum, i) => sum + i.total, 0);

    // MRR from recurring paid invoices
    const mrr = allInvoices
      .filter((i) => i.isRecurring && i.status === "paid" && i.recurringInterval === "monthly")
      .reduce((sum, i) => sum + i.total, 0);

    // Revenue by month (last 12 months)
    const byMonthMap: Record<string, number> = {};
    const now = new Date();
    for (let i = 11; i >= 0; i--) {
      const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      byMonthMap[key] = 0;
    }
    for (const inv of allInvoices.filter((i) => i.status === "paid" && i.paidAt)) {
      const d = inv.paidAt!;
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      if (key in byMonthMap) byMonthMap[key] += inv.total;
    }
    const byMonth = Object.entries(byMonthMap).map(([month, revenue]) => ({ month, revenue }));

    // Revenue by client (top 10)
    const clientMap: Record<string, number> = {};
    for (const inv of allInvoices.filter((i) => i.status === "paid")) {
      clientMap[inv.clientName] = (clientMap[inv.clientName] ?? 0) + inv.total;
    }
    const byClient = Object.entries(clientMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 10)
      .map(([name, revenue]) => ({ name, revenue }));

    return { totalRevenue, outstanding, overdue, mrr, byMonth, byClient };
  }),

  // ── Invoice number preview ────────────────────────────────────────────────

  getNextInvoiceNumber: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return "OH-0001";
    const { invoiceCounters } = await import("../../drizzle/schema");
    const { eq } = await import("drizzle-orm");
    const [counter] = await db.select().from(invoiceCounters).where(eq(invoiceCounters.userId, ctx.user.id));
    const next = (counter?.lastNumber ?? 0) + 1;
    return `OH-${String(next).padStart(4, "0")}`;
  }),
});
