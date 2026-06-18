import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { eq, and, desc, sql } from "drizzle-orm";

const STAGES = ["Prospect", "Contacted", "Responded", "Meeting", "Closed"] as const;
const SOURCES = ["google_maps", "facebook_groups", "causeiq", "referral", "manual", "other"] as const;

export const prospectingRouter = router({
  // ── List all leads for the current user ─────────────────────────────────────
  list: protectedProcedure
    .input(z.object({
      stage: z.enum(STAGES).optional(),
      search: z.string().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { prospectingLeads } = await import("../../drizzle/schema");
      const conditions = [eq(prospectingLeads.userId, ctx.user.id)];
      if (input?.stage) conditions.push(eq(prospectingLeads.stage, input.stage));
      const rows = await db
        .select()
        .from(prospectingLeads)
        .where(and(...conditions))
        .orderBy(desc(prospectingLeads.createdAt));
      if (input?.search) {
        const q = input.search.toLowerCase();
        return rows.filter(r =>
          r.businessName.toLowerCase().includes(q) ||
          (r.ownerName ?? "").toLowerCase().includes(q) ||
          (r.location ?? "").toLowerCase().includes(q) ||
          (r.category ?? "").toLowerCase().includes(q)
        );
      }
      return rows;
    }),

  // ── Stage-grouped counts for the kanban header ───────────────────────────────
  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new Error("Database unavailable");
    const { prospectingLeads } = await import("../../drizzle/schema");
    const rows = await db
      .select({
        stage: prospectingLeads.stage,
        count: sql<number>`count(*)`.as("count"),
      })
      .from(prospectingLeads)
      .where(eq(prospectingLeads.userId, ctx.user.id))
      .groupBy(prospectingLeads.stage);
    const map: Record<string, number> = {};
    for (const r of rows) map[r.stage] = Number(r.count);
    return map;
  }),

  // ── Create a new prospecting lead ────────────────────────────────────────────
  create: protectedProcedure
    .input(z.object({
      businessName: z.string().min(1),
      ownerName: z.string().optional(),
      email: z.string().email().optional().or(z.literal("")),
      phone: z.string().optional(),
      website: z.string().optional(),
      location: z.string().optional(),
      category: z.string().optional(),
      source: z.enum(SOURCES).default("manual"),
      stage: z.enum(STAGES).default("Prospect"),
      notes: z.string().optional(),
      noWebsite: z.boolean().default(false),
      estimatedValue: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { prospectingLeads } = await import("../../drizzle/schema");
      const [result] = await db.insert(prospectingLeads).values({
        userId: ctx.user.id,
        businessName: input.businessName,
        ownerName: input.ownerName ?? null,
        email: input.email || null,
        phone: input.phone ?? null,
        website: input.website ?? null,
        location: input.location ?? null,
        category: input.category ?? null,
        source: input.source,
        stage: input.stage,
        notes: input.notes ?? null,
        noWebsite: input.noWebsite,
        estimatedValue: input.estimatedValue ?? null,
      });
      const id = (result as any).insertId as number;
      const [created] = await db
        .select()
        .from(prospectingLeads)
        .where(eq(prospectingLeads.id, id));
      return created;
    }),

  // ── Update a lead (including stage moves) ────────────────────────────────────
  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      businessName: z.string().min(1).optional(),
      ownerName: z.string().optional().nullable(),
      email: z.string().optional().nullable(),
      phone: z.string().optional().nullable(),
      website: z.string().optional().nullable(),
      location: z.string().optional().nullable(),
      category: z.string().optional().nullable(),
      source: z.enum(SOURCES).optional(),
      stage: z.enum(STAGES).optional(),
      notes: z.string().optional().nullable(),
      noWebsite: z.boolean().optional(),
      estimatedValue: z.number().optional().nullable(),
      lastContactedAt: z.date().optional().nullable(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { prospectingLeads } = await import("../../drizzle/schema");
      const { id, ...fields } = input;
      await db
        .update(prospectingLeads)
        .set(fields as any)
        .where(and(eq(prospectingLeads.id, id), eq(prospectingLeads.userId, ctx.user.id)));
      const [updated] = await db
        .select()
        .from(prospectingLeads)
        .where(eq(prospectingLeads.id, id));
      return updated;
    }),

  // ── Delete a lead ────────────────────────────────────────────────────────────
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { prospectingLeads } = await import("../../drizzle/schema");
      await db
        .delete(prospectingLeads)
        .where(and(eq(prospectingLeads.id, input.id), eq(prospectingLeads.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Move a lead to a different stage ─────────────────────────────────────────
  moveStage: protectedProcedure
    .input(z.object({ id: z.number(), stage: z.enum(STAGES) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("Database unavailable");
      const { prospectingLeads } = await import("../../drizzle/schema");
      await db
        .update(prospectingLeads)
        .set({ stage: input.stage, lastContactedAt: new Date() })
        .where(and(eq(prospectingLeads.id, input.id), eq(prospectingLeads.userId, ctx.user.id)));
      return { success: true };
    }),
});
