/**
 * Client Pulse Router — health scores, unified timeline, at-risk alerts
 * Health score formula: recency 40% + responsiveness 30% + deal velocity 20% + sentiment 10%
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";

export const pulseRouter = router({
  /** Calculate + persist health scores for all clients of the current user */
  calculateScores: protectedProcedure.mutation(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    const {
      clients, pipelineDeals, activities, clientHealthScores,
    } = await import("../../drizzle/schema");
    const { eq, desc, and, gte } = await import("drizzle-orm");

    const allClients = await db.select().from(clients)
      .where(eq(clients.userId, ctx.user.id));

    const now = Date.now();
    const DAY = 86_400_000;

    const results: Array<{ clientId: number; score: number; trend: "improving" | "stable" | "declining" }> = [];

    for (const client of allClients) {
      // ── Recency (40 pts) ─────────────────────────────────────────────────────
      const lastContact = client.lastContactAt ? client.lastContactAt.getTime() : (client.createdAt.getTime());
      const daysSince = (now - lastContact) / DAY;
      const recencyScore = Math.max(0, 40 - Math.floor(daysSince / 3) * 4); // -4pts per 3 days

      // ── Deal velocity (20 pts) ───────────────────────────────────────────────
      const deals = await db.select().from(pipelineDeals)
        .where(and(eq(pipelineDeals.userId, ctx.user.id), eq(pipelineDeals.clientId, client.id)));
      const hasActiveDeals = deals.some(d => d.stage !== "Closed");
      const hasClosedDeals = deals.some(d => d.stage === "Closed");
      const velocityScore = hasClosedDeals ? 20 : hasActiveDeals ? 12 : 4;

      // ── Responsiveness (30 pts) ──────────────────────────────────────────────
      // Based on activity count in last 30 days
      const thirtyDaysAgo = new Date(now - 30 * DAY);
      const recentActivities = await db.select().from(activities)
        .where(and(
          eq(activities.userId, ctx.user.id),
          gte(activities.createdAt, thirtyDaysAgo),
        ));
      const clientActivities = recentActivities.filter(a => a.clientId === client.id);
      const responsivenessScore = Math.min(30, clientActivities.length * 6);

      // ── Sentiment (10 pts) ───────────────────────────────────────────────────
      const sentimentScore = client.status === "active" ? 10 : client.status === "prospect" ? 6 : 2;

      const score = Math.min(100, recencyScore + velocityScore + responsivenessScore + sentimentScore);

      // Determine trend by comparing to previous score
      const prevRows = await db.select().from(clientHealthScores)
        .where(eq(clientHealthScores.clientId, client.id))
        .orderBy(desc(clientHealthScores.calculatedAt))
        .limit(1);
      const prevScore = prevRows[0]?.score ?? 50;
      const trend: "improving" | "stable" | "declining" =
        score > prevScore + 5 ? "improving" : score < prevScore - 5 ? "declining" : "stable";

      await db.insert(clientHealthScores).values({
        clientId: client.id,
        userId: ctx.user.id,
        score,
        trend,
        factors: { recency: recencyScore, velocity: velocityScore, responsiveness: responsivenessScore, sentiment: sentimentScore },
        calculatedAt: new Date(),
      });

      results.push({ clientId: client.id, score, trend });
    }

    return results;
  }),

  /** Get all clients with their latest health score */
  getClientScores: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const { clients, clientHealthScores, pipelineDeals } = await import("../../drizzle/schema");
    const { eq, desc } = await import("drizzle-orm");

    const allClients = await db.select().from(clients)
      .where(eq(clients.userId, ctx.user.id))
      .orderBy(desc(clients.updatedAt));

    const results = await Promise.all(allClients.map(async (client) => {
      const scoreRows = await db.select().from(clientHealthScores)
        .where(eq(clientHealthScores.clientId, client.id))
        .orderBy(desc(clientHealthScores.calculatedAt))
        .limit(1);

      const deals = await db.select().from(pipelineDeals)
        .where(eq(pipelineDeals.clientId, client.id));

      const latestScore = scoreRows[0];
      return {
        ...client,
        healthScore: latestScore?.score ?? 50,
        healthTrend: latestScore?.trend ?? "stable" as const,
        healthFactors: latestScore?.factors as Record<string, number> | null,
        activeDeals: deals.filter(d => d.stage !== "Closed").length,
        totalDeals: deals.length,
      };
    }));

    return results;
  }),

  /** Get unified timeline for a specific client */
  getClientTimeline: protectedProcedure
    .input(z.object({ clientId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];

      const { clientTimelineEvents, activities } = await import("../../drizzle/schema");
      const { eq, and, desc } = await import("drizzle-orm");

      // Get explicit timeline events
      const timelineRows = await db.select().from(clientTimelineEvents)
        .where(and(
          eq(clientTimelineEvents.clientId, input.clientId),
          eq(clientTimelineEvents.userId, ctx.user.id),
        ))
        .orderBy(desc(clientTimelineEvents.occurredAt))
        .limit(50);

      // Also pull activities tagged with this clientId
      const activityRows = await db.select().from(activities)
        .where(eq(activities.userId, ctx.user.id))
        .orderBy(desc(activities.createdAt))
        .limit(100);

      const clientActivities = activityRows.filter(a =>
        a.clientId === input.clientId
      ).slice(0, 20);

      const activityEvents = clientActivities.map(a => ({
        id: -a.id,
        clientId: input.clientId,
        userId: ctx.user.id,
        eventType: "note" as const,
        eventId: a.id,
        summary: a.summary ?? a.activityType,
        sentiment: null,
        occurredAt: a.createdAt,
      }));

      return [...timelineRows, ...activityEvents]
        .sort((a, b) => b.occurredAt.getTime() - a.occurredAt.getTime())
        .slice(0, 50);
    }),

  /** Add a manual timeline event */
  addTimelineEvent: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      eventType: z.enum(["sms", "call", "email", "voice_agent", "pipeline_change", "strategy_delivered", "note"]),
      summary: z.string().max(1000),
      sentiment: z.enum(["positive", "neutral", "negative"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const { clientTimelineEvents } = await import("../../drizzle/schema");
      await db.insert(clientTimelineEvents).values({
        clientId: input.clientId,
        userId: ctx.user.id,
        eventType: input.eventType,
        summary: input.summary,
        sentiment: input.sentiment ?? null,
        occurredAt: new Date(),
      });

      // Update client lastContactAt
      const { clients } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      await db.update(clients)
        .set({ lastContactAt: new Date() })
        .where(and(eq(clients.id, input.clientId), eq(clients.userId, ctx.user.id)));

      return { success: true };
    }),

  /** Get at-risk clients (health score < 40) */
  getAtRiskClients: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];

    const { clients, clientHealthScores } = await import("../../drizzle/schema");
    const { eq, desc, lt } = await import("drizzle-orm");

    const allClients = await db.select().from(clients)
      .where(eq(clients.userId, ctx.user.id));

    const atRisk: Array<{ id: number; name: string; company: string | null; score: number; trend: string }> = [];

    for (const client of allClients) {
      const scoreRows = await db.select().from(clientHealthScores)
        .where(eq(clientHealthScores.clientId, client.id))
        .orderBy(desc(clientHealthScores.calculatedAt))
        .limit(1);
      const score = scoreRows[0]?.score ?? 50;
      if (score < 40) {
        atRisk.push({ id: client.id, name: client.name, company: client.company, score, trend: scoreRows[0]?.trend ?? "stable" });
      }
    }

    return atRisk.sort((a, b) => a.score - b.score);
  }),

  /** Dashboard summary: avg health, at-risk count, improving count */
  getSummary: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { avgScore: 0, atRiskCount: 0, improvingCount: 0, totalClients: 0 };

    const { clients, clientHealthScores } = await import("../../drizzle/schema");
    const { eq, desc } = await import("drizzle-orm");

    const allClients = await db.select().from(clients)
      .where(eq(clients.userId, ctx.user.id));

    let total = 0, atRisk = 0, improving = 0, scoreSum = 0;

    for (const client of allClients) {
      total++;
      const scoreRows = await db.select().from(clientHealthScores)
        .where(eq(clientHealthScores.clientId, client.id))
        .orderBy(desc(clientHealthScores.calculatedAt))
        .limit(1);
      const score = scoreRows[0]?.score ?? 50;
      scoreSum += score;
      if (score < 40) atRisk++;
      if (scoreRows[0]?.trend === "improving") improving++;
    }

    return {
      avgScore: total > 0 ? Math.round(scoreSum / total) : 0,
      atRiskCount: atRisk,
      improvingCount: improving,
      totalClients: total,
    };
  }),
});
