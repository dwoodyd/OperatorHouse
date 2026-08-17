import { TRPCError } from "@trpc/server";
import { and, desc, eq, sql } from "drizzle-orm";
import { z } from "zod";
import { pipelineDeals, strategies, vaultItems } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, router } from "../_core/trpc";

export const operatorLearningRouter = router({
  captureStrategyToVault: protectedProcedure
    .input(z.object({ strategyId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [strategy] = await db.select({
        id: strategies.id,
        clientId: strategies.clientId,
        outputType: strategies.outputType,
        inputContext: strategies.inputContext,
        content: strategies.content,
        status: strategies.status,
      }).from(strategies)
        .where(and(eq(strategies.id, input.strategyId), eq(strategies.userId, ctx.user.id)))
        .limit(1);
      if (!strategy || strategy.status !== "complete" || !strategy.content) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Completed strategy not found" });
      }

      const [existing] = await db.select({ id: vaultItems.id }).from(vaultItems)
        .where(and(eq(vaultItems.userId, ctx.user.id), eq(vaultItems.sourceStrategyId, strategy.id)))
        .limit(1);
      if (existing) return { created: false, vaultItemId: existing.id };

      const context = strategy.inputContext as { clientName?: string; company?: string } | null;
      const subject = context?.company || context?.clientName || "Operator";
      const title = `${subject} — ${strategy.outputType} strategy`;
      const [result] = await db.insert(vaultItems).values({
        userId: ctx.user.id,
        clientId: strategy.clientId ?? undefined,
        type: "note",
        title,
        textContent: strategy.content,
        tags: ["approved-strategy", strategy.outputType],
        metadata: { provenance: "operator_approved_strategy_capture", sourceStrategyId: strategy.id },
        sourceStrategyId: strategy.id,
      });
      return { created: true, vaultItemId: Number((result as { insertId: number }).insertId) };
    }),

  recordDealClose: protectedProcedure
    .input(z.object({
      dealId: z.number(),
      outcome: z.enum(["won", "lost"]),
      reason: z.enum(["budget", "timing", "priority", "fit", "competitor", "no_response", "other"]).optional(),
    }).refine((value) => value.outcome === "won" || !!value.reason, { message: "Select a brief reason for a closed-lost deal" }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [deal] = await db.select({ id: pipelineDeals.id }).from(pipelineDeals)
        .where(and(eq(pipelineDeals.id, input.dealId), eq(pipelineDeals.userId, ctx.user.id))).limit(1);
      if (!deal) throw new TRPCError({ code: "NOT_FOUND", message: "Deal not found" });
      await db.update(pipelineDeals).set({
        stage: "Closed",
        closeOutcome: input.outcome,
        closeReason: input.outcome === "lost" ? input.reason : null,
        closedAt: new Date(),
      }).where(and(eq(pipelineDeals.id, input.dealId), eq(pipelineDeals.userId, ctx.user.id)));
      return { ok: true };
    }),

  closeReasonInsights: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select({
      reason: pipelineDeals.closeReason,
      count: sql<number>`count(*)`,
    }).from(pipelineDeals)
      .where(and(eq(pipelineDeals.userId, ctx.user.id), eq(pipelineDeals.closeOutcome, "lost")))
      .groupBy(pipelineDeals.closeReason)
      .orderBy(desc(sql`count(*)`));
  }),
});
