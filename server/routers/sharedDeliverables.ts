import { TRPCError } from "@trpc/server";
import { and, desc, eq, inArray, sql } from "drizzle-orm";
import { createHash, randomBytes } from "node:crypto";
import { z } from "zod";
import { sharedDeliverables, sharedDeliverableSources, strategies, vaultItems } from "../../drizzle/schema";
import { getDb } from "../db";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";

const MAX_SOURCE_EXCERPT = 1_200;
const MAX_STRATEGY_CONTENT = 60_000;
const tokenSchema = z.string().min(32).max(128);

function hashToken(token: string) {
  return createHash("sha256").update(token).digest("hex");
}

function createPublicToken() {
  return randomBytes(32).toString("base64url");
}

export const sharedDeliverablesRouter = router({
  list: protectedProcedure
    .input(z.object({ strategyId: z.number().optional() }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const filters = [eq(sharedDeliverables.userId, ctx.user.id)];
      if (input?.strategyId) filters.push(eq(sharedDeliverables.strategyId, input.strategyId));
      return db.select({
        id: sharedDeliverables.id,
        strategyId: sharedDeliverables.strategyId,
        status: sharedDeliverables.status,
        title: sharedDeliverables.title,
        clientName: sharedDeliverables.clientName,
        consultantName: sharedDeliverables.consultantName,
        accentColor: sharedDeliverables.accentColor,
        expiresAt: sharedDeliverables.expiresAt,
        revokedAt: sharedDeliverables.revokedAt,
        lastOpenedAt: sharedDeliverables.lastOpenedAt,
        openCount: sharedDeliverables.openCount,
        createdAt: sharedDeliverables.createdAt,
      }).from(sharedDeliverables).where(and(...filters)).orderBy(desc(sharedDeliverables.createdAt));
    }),

  create: protectedProcedure
    .input(z.object({
      strategyId: z.number(),
      title: z.string().trim().min(3).max(255),
      clientName: z.string().trim().min(1).max(255).optional(),
      consultantName: z.string().trim().min(1).max(255),
      consultantLogoUrl: z.string().url().max(1_000).optional(),
      accentColor: z.string().regex(/^#[0-9a-fA-F]{6}$/).default("#F5A623"),
      expiresInDays: z.number().int().min(1).max(365).default(30),
      sources: z.array(z.object({
        vaultItemId: z.number(),
        rationale: z.string().trim().max(1_000).optional(),
      })).min(1).max(8),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });

      const [strategy] = await db.select({
        id: strategies.id,
        clientId: strategies.clientId,
        content: strategies.content,
        status: strategies.status,
      }).from(strategies)
        .where(and(eq(strategies.id, input.strategyId), eq(strategies.userId, ctx.user.id)))
        .limit(1);
      if (!strategy || strategy.status !== "complete" || !strategy.content) {
        throw new TRPCError({ code: "NOT_FOUND", message: "Completed strategy not found" });
      }

      const sourceIds = Array.from(new Set(input.sources.map((source) => source.vaultItemId)));
      const sources = await db.select({
        id: vaultItems.id,
        title: vaultItems.title,
        content: vaultItems.content,
        textContent: vaultItems.textContent,
      }).from(vaultItems)
        .where(and(eq(vaultItems.userId, ctx.user.id), inArray(vaultItems.id, sourceIds)));
      if (sources.length !== sourceIds.length) {
        throw new TRPCError({ code: "FORBIDDEN", message: "One or more selected sources are unavailable" });
      }

      const token = createPublicToken();
      const expiresAt = new Date(Date.now() + input.expiresInDays * 86_400_000);
      const [result] = await db.insert(sharedDeliverables).values({
        userId: ctx.user.id,
        strategyId: strategy.id,
        clientId: strategy.clientId ?? undefined,
        tokenHash: hashToken(token),
        title: input.title,
        strategyContent: strategy.content.slice(0, MAX_STRATEGY_CONTENT),
        clientName: input.clientName,
        consultantName: input.consultantName,
        consultantLogoUrl: input.consultantLogoUrl,
        accentColor: input.accentColor,
        expiresAt,
      });
      const deliverableId = Number((result as { insertId: number }).insertId);
      const sourceById = new Map(sources.map((source) => [source.id, source]));
      await db.insert(sharedDeliverableSources).values(input.sources.map((selection, index) => {
        const source = sourceById.get(selection.vaultItemId)!;
        return {
          deliverableId,
          vaultItemId: source.id,
          sourceTitle: source.title.slice(0, 255),
          sourceExcerpt: (source.content ?? source.textContent ?? source.title).slice(0, MAX_SOURCE_EXCERPT),
          rationale: selection.rationale,
          sortOrder: index,
        };
      }));

      return { id: deliverableId, token, expiresAt };
    }),

  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      await db.update(sharedDeliverables).set({ status: "revoked", revokedAt: new Date() })
        .where(and(eq(sharedDeliverables.id, input.id), eq(sharedDeliverables.userId, ctx.user.id)));
      return { ok: true };
    }),

  reissue: protectedProcedure
    .input(z.object({ id: z.number(), expiresInDays: z.number().int().min(1).max(365).default(30) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Database unavailable" });
      const [existing] = await db.select().from(sharedDeliverables)
        .where(and(eq(sharedDeliverables.id, input.id), eq(sharedDeliverables.userId, ctx.user.id)))
        .limit(1);
      if (!existing) throw new TRPCError({ code: "NOT_FOUND", message: "Deliverable not found" });

      const frozenSources = await db.select().from(sharedDeliverableSources)
        .where(eq(sharedDeliverableSources.deliverableId, existing.id))
        .orderBy(sharedDeliverableSources.sortOrder);
      const token = createPublicToken();
      const expiresAt = new Date(Date.now() + input.expiresInDays * 86_400_000);
      const [result] = await db.insert(sharedDeliverables).values({
        userId: ctx.user.id,
        strategyId: existing.strategyId,
        clientId: existing.clientId ?? undefined,
        tokenHash: hashToken(token),
        title: existing.title,
        strategyContent: existing.strategyContent,
        clientName: existing.clientName ?? undefined,
        consultantName: existing.consultantName,
        consultantLogoUrl: existing.consultantLogoUrl ?? undefined,
        accentColor: existing.accentColor,
        expiresAt,
      });
      const deliverableId = Number((result as { insertId: number }).insertId);
      if (frozenSources.length) {
        await db.insert(sharedDeliverableSources).values(frozenSources.map((source) => ({
          deliverableId,
          vaultItemId: source.vaultItemId,
          sourceTitle: source.sourceTitle,
          sourceExcerpt: source.sourceExcerpt,
          rationale: source.rationale ?? undefined,
          sortOrder: source.sortOrder,
        })));
      }
      await db.update(sharedDeliverables).set({ status: "revoked", revokedAt: new Date() })
        .where(and(eq(sharedDeliverables.id, existing.id), eq(sharedDeliverables.userId, ctx.user.id)));
      return { id: deliverableId, token, expiresAt };
    }),

  getPublic: publicProcedure
    .input(z.object({ token: tokenSchema }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Document temporarily unavailable" });
      const [deliverable] = await db.select({
        id: sharedDeliverables.id,
        status: sharedDeliverables.status,
        title: sharedDeliverables.title,
        strategyContent: sharedDeliverables.strategyContent,
        clientName: sharedDeliverables.clientName,
        consultantName: sharedDeliverables.consultantName,
        consultantLogoUrl: sharedDeliverables.consultantLogoUrl,
        accentColor: sharedDeliverables.accentColor,
        expiresAt: sharedDeliverables.expiresAt,
      }).from(sharedDeliverables)
        .where(and(eq(sharedDeliverables.tokenHash, hashToken(input.token)), eq(sharedDeliverables.status, "active")))
        .limit(1);
      if (!deliverable || (deliverable.expiresAt && deliverable.expiresAt <= new Date())) {
        throw new TRPCError({ code: "NOT_FOUND", message: "This strategy link is invalid, expired, or no longer available" });
      }

      const sources = await db.select({
        title: sharedDeliverableSources.sourceTitle,
        excerpt: sharedDeliverableSources.sourceExcerpt,
        rationale: sharedDeliverableSources.rationale,
      }).from(sharedDeliverableSources)
        .where(eq(sharedDeliverableSources.deliverableId, deliverable.id))
        .orderBy(sharedDeliverableSources.sortOrder);
      await db.update(sharedDeliverables).set({
        lastOpenedAt: new Date(),
        openCount: sql`${sharedDeliverables.openCount} + 1`,
      }).where(eq(sharedDeliverables.id, deliverable.id));

      return {
        document: {
          title: deliverable.title,
          strategyContent: deliverable.strategyContent,
          clientName: deliverable.clientName,
          consultantName: deliverable.consultantName,
          consultantLogoUrl: deliverable.consultantLogoUrl,
          accentColor: deliverable.accentColor,
          expiresAt: deliverable.expiresAt,
        },
        sources,
      };
    }),
});
