/**
 * Phase 17: Unified Analytics Router
 * Aggregates data from invoices, bookings, funnels, CRM, email sequences, and outreach.
 */
import { z } from "zod";
import { eq, and, gte, lte, sql, count, sum, desc } from "drizzle-orm";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  invoices, bookings, funnels, funnelSubmissions,
  crmContacts, emailSequenceEnrollments, emailSends,
  clientHealthScores, calls, smsMessages, socialPosts,
  contracts, reviews, workflows, workflowExecutions,
} from "../../drizzle/schema";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function startOf(period: "day" | "week" | "month" | "year") {
  const now = new Date();
  if (period === "day") return new Date(now.getFullYear(), now.getMonth(), now.getDate());
  if (period === "week") {
    const d = new Date(now);
    d.setDate(d.getDate() - d.getDay());
    d.setHours(0, 0, 0, 0);
    return d;
  }
  if (period === "month") return new Date(now.getFullYear(), now.getMonth(), 1);
  return new Date(now.getFullYear(), 0, 1);
}

function nDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  d.setHours(0, 0, 0, 0);
  return d;
}

export const analyticsRouter = router({
  // ─── Overview KPIs ──────────────────────────────────────────────────────────
  overview: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const uid = ctx.user.id;
    const monthStart = startOf("month");
    const lastMonthStart = new Date(monthStart.getFullYear(), monthStart.getMonth() - 1, 1);
    const lastMonthEnd = new Date(monthStart.getTime() - 1);

    // Revenue this month vs last month
    const [revenueThis] = await db.select({ total: sql<number>`COALESCE(SUM(total), 0)` })
      .from(invoices)
      .where(and(eq(invoices.userId, uid), eq(invoices.status, "paid"), gte(invoices.paidAt, monthStart)));
    const [revenueLast] = await db.select({ total: sql<number>`COALESCE(SUM(total), 0)` })
      .from(invoices)
      .where(and(eq(invoices.userId, uid), eq(invoices.status, "paid"), gte(invoices.paidAt, lastMonthStart), lte(invoices.paidAt, lastMonthEnd)));

    // Outstanding invoices
    const [outstanding] = await db.select({ total: sql<number>`COALESCE(SUM(total), 0)`, cnt: count() })
      .from(invoices)
      .where(and(eq(invoices.userId, uid), eq(invoices.status, "sent")));

    // Bookings this month
    const [bookingsThis] = await db.select({ cnt: count() })
      .from(bookings)
      .where(and(eq(bookings.userId, uid), gte(bookings.createdAt, monthStart)));
    const [bookingsLast] = await db.select({ cnt: count() })
      .from(bookings)
      .where(and(eq(bookings.userId, uid), gte(bookings.createdAt, lastMonthStart), lte(bookings.createdAt, lastMonthEnd)));

    // Total CRM contacts
    const [totalContacts] = await db.select({ cnt: count() })
      .from(crmContacts).where(eq(crmContacts.userId, uid));

    // New contacts this month
    const [newContacts] = await db.select({ cnt: count() })
      .from(crmContacts).where(and(eq(crmContacts.userId, uid), gte(crmContacts.createdAt, monthStart)));

    // Active funnels
    const [activeFunnels] = await db.select({ cnt: count() })
      .from(funnels).where(and(eq(funnels.userId, uid), eq(funnels.status, "published")));

    // Funnel leads this month
    const [funnelLeads] = await db.select({ cnt: count() })
      .from(funnelSubmissions).where(and(eq(funnelSubmissions.userId, uid), gte(funnelSubmissions.submittedAt, monthStart)));

    // Signed contracts
    const [signedContracts] = await db.select({ cnt: count() })
      .from(contracts).where(and(eq(contracts.userId, uid), eq(contracts.status, "signed")));

    // Avg review rating
    const [avgRating] = await db.select({ avg: sql<number>`COALESCE(AVG(rating), 0)`, cnt: count() })
      .from(reviews).where(and(eq(reviews.userId, uid), eq(reviews.status, "published")));

    const revenueThisNum = Number(revenueThis?.total ?? 0);
    const revenueLastNum = Number(revenueLast?.total ?? 0);
    const revenueChange = revenueLastNum > 0
      ? ((revenueThisNum - revenueLastNum) / revenueLastNum) * 100
      : revenueThisNum > 0 ? 100 : 0;

    const bookingsThisNum = Number(bookingsThis?.cnt ?? 0);
    const bookingsLastNum = Number(bookingsLast?.cnt ?? 0);
    const bookingsChange = bookingsLastNum > 0
      ? ((bookingsThisNum - bookingsLastNum) / bookingsLastNum) * 100
      : bookingsThisNum > 0 ? 100 : 0;

    return {
      revenue: { thisMonth: revenueThisNum, lastMonth: revenueLastNum, change: revenueChange },
      outstanding: { total: Number(outstanding?.total ?? 0), count: Number(outstanding?.cnt ?? 0) },
      bookings: { thisMonth: bookingsThisNum, lastMonth: bookingsLastNum, change: bookingsChange },
      contacts: { total: Number(totalContacts?.cnt ?? 0), newThisMonth: Number(newContacts?.cnt ?? 0) },
      funnels: { active: Number(activeFunnels?.cnt ?? 0), leadsThisMonth: Number(funnelLeads?.cnt ?? 0) },
      contracts: { signed: Number(signedContracts?.cnt ?? 0) },
      reviews: { avg: Number(avgRating?.avg ?? 0).toFixed(1), count: Number(avgRating?.cnt ?? 0) },
    };
  }),

  // ─── Revenue trend (last 12 months) ─────────────────────────────────────────
  revenueTrend: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const uid = ctx.user.id;
    const twelveMonthsAgo = new Date();
    twelveMonthsAgo.setMonth(twelveMonthsAgo.getMonth() - 11);
    twelveMonthsAgo.setDate(1);
    twelveMonthsAgo.setHours(0, 0, 0, 0);

    const rows = await db.select({
      month: sql<string>`DATE_FORMAT(paidAt, '%Y-%m')`,
      revenue: sql<number>`COALESCE(SUM(total), 0)`,
      count: count(),
    })
      .from(invoices)
      .where(and(eq(invoices.userId, uid), eq(invoices.status, "paid"), gte(invoices.paidAt, twelveMonthsAgo)))
      .groupBy(sql`DATE_FORMAT(paidAt, '%Y-%m')`)
      .orderBy(sql`DATE_FORMAT(paidAt, '%Y-%m')`);

    // Fill in missing months with 0
    const result: { month: string; revenue: number; count: number }[] = [];
    for (let i = 11; i >= 0; i--) {
      const d = new Date();
      d.setMonth(d.getMonth() - i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}`;
      const found = rows.find((r) => r.month === key);
      result.push({ month: key, revenue: found ? Number(found.revenue) : 0, count: found ? Number(found.count) : 0 });
    }
    return result;
  }),

  // ─── Booking trend (last 30 days) ────────────────────────────────────────────
  bookingTrend: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const uid = ctx.user.id;
    const thirtyDaysAgo = nDaysAgo(29);

    const rows = await db.select({
      day: sql<string>`DATE_FORMAT(createdAt, '%Y-%m-%d')`,
      count: count(),
    })
      .from(bookings)
      .where(and(eq(bookings.userId, uid), gte(bookings.createdAt, thirtyDaysAgo)))
      .groupBy(sql`DATE_FORMAT(createdAt, '%Y-%m-%d')`)
      .orderBy(sql`DATE_FORMAT(createdAt, '%Y-%m-%d')`);

    const result: { day: string; count: number }[] = [];
    for (let i = 29; i >= 0; i--) {
      const d = nDaysAgo(i);
      const key = `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
      const found = rows.find((r) => r.day === key);
      result.push({ day: key, count: found ? Number(found.count) : 0 });
    }
    return result;
  }),

  // ─── Funnel conversion rates ──────────────────────────────────────────────────
  funnelConversions: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const uid = ctx.user.id;

    const funnelList = await db.select({
      id: funnels.id,
      name: funnels.name,
      views: funnels.totalViews,
      conversions: funnels.totalSubmissions,
    })
      .from(funnels)
      .where(eq(funnels.userId, uid))
      .orderBy(desc(funnels.totalSubmissions))
      .limit(10);

    return funnelList.map((f) => ({
      id: f.id,
      name: f.name,
      views: f.views ?? 0,
      conversions: f.conversions ?? 0,
      rate: f.views && f.views > 0 ? ((f.conversions ?? 0) / f.views * 100).toFixed(1) : "0.0",
    }));
  }),

  // ─── CRM pipeline breakdown ───────────────────────────────────────────────────
  crmPipeline: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const uid = ctx.user.id;

    const rows = await db.select({
      stage: crmContacts.lifecycleStage,
      count: count(),
    })
      .from(crmContacts)
      .where(eq(crmContacts.userId, uid))
      .groupBy(crmContacts.lifecycleStage);

    const stageOrder = ["lead", "prospect", "qualified", "client", "churned", "partner"];
    const stageColors: Record<string, string> = {
      lead: "#6366f1", prospect: "#f59e0b", qualified: "#3b82f6",
      client: "#10b981", churned: "#ef4444", partner: "#f5c842",
    };

    return stageOrder.map((stage) => {
      const found = rows.find((r) => r.stage === stage);
      return { stage, count: found ? Number(found.count) : 0, color: stageColors[stage] ?? "#888" };
    }).filter((s) => s.count > 0);
  }),

  // ─── Outreach activity (last 30 days) ────────────────────────────────────────
  outreachActivity: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const uid = ctx.user.id;
    const thirtyDaysAgo = nDaysAgo(29);

    const [emailsSent] = await db.select({ cnt: count() })
      .from(emailSends)
      .where(and(eq(emailSends.userId, uid), gte(emailSends.sentAt, thirtyDaysAgo)));

    const [callsMade] = await db.select({ cnt: count() })
      .from(calls)
      .where(and(eq(calls.userId, uid), gte(calls.createdAt, thirtyDaysAgo)));

    const [smsSent] = await db.select({ cnt: count() })
      .from(smsMessages)
      .where(and(eq(smsMessages.userId, uid), eq(smsMessages.direction, "outbound"), gte(smsMessages.createdAt, thirtyDaysAgo)));

    const [postsPublished] = await db.select({ cnt: count() })
      .from(socialPosts)
      .where(and(eq(socialPosts.userId, uid), eq(socialPosts.status, "published"), gte(socialPosts.createdAt, thirtyDaysAgo)));

    return {
      emails: Number(emailsSent?.cnt ?? 0),
      calls: Number(callsMade?.cnt ?? 0),
      sms: Number(smsSent?.cnt ?? 0),
      socialPosts: Number(postsPublished?.cnt ?? 0),
    };
  }),

  // ─── Client health distribution ───────────────────────────────────────────────
  healthDistribution: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const uid = ctx.user.id;

    // Use score ranges: healthy ≥70, at_risk 40-69, churned <40
    const allScores = await db.select({ score: clientHealthScores.score })
      .from(clientHealthScores)
      .where(eq(clientHealthScores.userId, uid));

    const buckets = { healthy: 0, at_risk: 0, churned: 0 };
    for (const row of allScores) {
      if (row.score >= 70) buckets.healthy++;
      else if (row.score >= 40) buckets.at_risk++;
      else buckets.churned++;
    }
    const colors: Record<string, string> = { healthy: "#10b981", at_risk: "#f59e0b", churned: "#ef4444" };
    return Object.entries(buckets).map(([status, count]) => ({ status, count, color: colors[status] }));
  }),

  // ─── Recent activity feed ─────────────────────────────────────────────────────
  recentActivity: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const uid = ctx.user.id;

    const [recentInvoices, recentBookings, recentContacts, recentReviews] = await Promise.all([
      db.select({ id: invoices.id, label: invoices.clientName, status: invoices.status, amount: invoices.total, at: invoices.createdAt })
        .from(invoices).where(eq(invoices.userId, uid)).orderBy(desc(invoices.createdAt)).limit(5),
      db.select({ id: bookings.id, label: bookings.bookedByName, status: bookings.status, at: bookings.createdAt })
        .from(bookings).where(eq(bookings.userId, uid)).orderBy(desc(bookings.createdAt)).limit(5),
      db.select({ id: crmContacts.id, label: sql<string>`CONCAT(firstName, ' ', lastName)`, at: crmContacts.createdAt })
        .from(crmContacts).where(eq(crmContacts.userId, uid)).orderBy(desc(crmContacts.createdAt)).limit(5),
      db.select({ id: reviews.id, label: reviews.reviewerName, rating: reviews.rating, at: reviews.submittedAt })
        .from(reviews).where(and(eq(reviews.userId, uid), eq(reviews.status, "submitted"))).orderBy(desc(reviews.submittedAt)).limit(3),
    ]);

    const feed: { type: string; label: string; meta: string; at: Date | null }[] = [
      ...recentInvoices.map((i) => ({ type: "invoice", label: `Invoice to ${i.label}`, meta: `$${i.amount.toFixed(0)} · ${i.status}`, at: i.at })),
      ...recentBookings.map((b) => ({ type: "booking", label: `Booking: ${b.label}`, meta: b.status, at: b.at })),
      ...recentContacts.map((c) => ({ type: "contact", label: `New contact: ${c.label}`, meta: "CRM", at: c.at })),
      ...recentReviews.map((r) => ({ type: "review", label: `Review from ${r.label ?? "client"}`, meta: `${r.rating}★`, at: r.at })),
    ];

    return feed
      .filter((f) => f.at !== null)
      .sort((a, b) => new Date(b.at!).getTime() - new Date(a.at!).getTime())
      .slice(0, 15);
  }),
});
