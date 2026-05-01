/**
 * CRM Suite Router — Phase 7
 * Contacts, Companies, Tags, Segments, Custom Fields, Import/Export
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { router, protectedProcedure } from "../_core/trpc";
import { getDb } from "../db";

export const crmRouter = router({
  // ── Contacts ──────────────────────────────────────────────────────────────

  listContacts: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        lifecycleStage: z.string().optional(),
        source: z.string().optional(),
        companyId: z.number().optional(),
        limit: z.number().default(50),
        offset: z.number().default(0),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmContacts, crmCompanies } = await import("../../drizzle/schema");
      const { eq, and, like, or, desc, inArray } = await import("drizzle-orm");
      const userId = ctx.user.id;

      const conditions = [eq(crmContacts.userId, userId)];
      if (input.lifecycleStage) conditions.push(eq(crmContacts.lifecycleStage, input.lifecycleStage as any));
      if (input.source) conditions.push(eq(crmContacts.source, input.source as any));
      if (input.companyId) conditions.push(eq(crmContacts.companyId, input.companyId));
      if (input.search) {
        conditions.push(
          or(
            like(crmContacts.firstName, `%${input.search}%`),
            like(crmContacts.lastName, `%${input.search}%`),
            like(crmContacts.email, `%${input.search}%`),
            like(crmContacts.phone, `%${input.search}%`)
          )!
        );
      }

      const rows = await db
        .select()
        .from(crmContacts)
        .where(and(...conditions))
        .orderBy(desc(crmContacts.createdAt))
        .limit(input.limit)
        .offset(input.offset);

      // Attach company names
      const companyIds = Array.from(new Set(rows.filter((r) => r.companyId).map((r) => r.companyId!))) as number[];
      const companies = companyIds.length > 0
        ? await db.select().from(crmCompanies).where(inArray(crmCompanies.id, companyIds))
        : [];
      const companyMap: Record<number, typeof companies[0]> = {};
      for (const c of companies) companyMap[c.id] = c;

      return rows.map((r) => ({ ...r, company: r.companyId ? (companyMap[r.companyId] ?? null) : null }));
    }),

  getContact: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmContacts, crmCompanies, crmActivityNotes } = await import("../../drizzle/schema");
      const { eq, and, desc } = await import("drizzle-orm");

      const [contact] = await db
        .select()
        .from(crmContacts)
        .where(and(eq(crmContacts.id, input.id), eq(crmContacts.userId, ctx.user.id)));
      if (!contact) throw new TRPCError({ code: "NOT_FOUND", message: "Contact not found" });

      const companies = contact.companyId
        ? await db.select().from(crmCompanies).where(eq(crmCompanies.id, contact.companyId))
        : [];
      const notes = await db
        .select()
        .from(crmActivityNotes)
        .where(and(eq(crmActivityNotes.contactId, input.id), eq(crmActivityNotes.userId, ctx.user.id)))
        .orderBy(desc(crmActivityNotes.createdAt));

      return { ...contact, company: companies[0] ?? null, notes };
    }),

  createContact: protectedProcedure
    .input(
      z.object({
        firstName: z.string().min(1),
        lastName: z.string().default(""),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        companyId: z.number().optional(),
        title: z.string().optional(),
        lifecycleStage: z.enum(["lead", "prospect", "client", "past_client", "partner"]).default("lead"),
        source: z.enum(["manual", "funnel", "import", "prospecting", "referral", "social"]).default("manual"),
        tags: z.array(z.string()).default([]),
        notes: z.string().optional(),
        optedInEmail: z.boolean().default(true),
        optedInSms: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmContacts } = await import("../../drizzle/schema");
      await db.insert(crmContacts).values({
        ...input,
        userId: ctx.user.id,
        email: input.email || null,
      });
      return { success: true };
    }),

  updateContact: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        firstName: z.string().min(1).optional(),
        lastName: z.string().optional(),
        email: z.string().email().optional().or(z.literal("")),
        phone: z.string().optional(),
        companyId: z.number().nullable().optional(),
        title: z.string().optional(),
        lifecycleStage: z.enum(["lead", "prospect", "client", "past_client", "partner"]).optional(),
        source: z.enum(["manual", "funnel", "import", "prospecting", "referral", "social"]).optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        optedInEmail: z.boolean().optional(),
        optedInSms: z.boolean().optional(),
        customFields: z.record(z.string(), z.unknown()).optional(),
        healthScore: z.number().min(0).max(100).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmContacts } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const { id, ...data } = input;
      await db
        .update(crmContacts)
        .set({ ...data, email: data.email || null })
        .where(and(eq(crmContacts.id, id), eq(crmContacts.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteContact: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmContacts } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      await db
        .delete(crmContacts)
        .where(and(eq(crmContacts.id, input.id), eq(crmContacts.userId, ctx.user.id)));
      return { success: true };
    }),

  addNote: protectedProcedure
    .input(z.object({ contactId: z.number(), note: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmActivityNotes, crmContacts } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      await db.insert(crmActivityNotes).values({ ...input, userId: ctx.user.id });
      await db
        .update(crmContacts)
        .set({ lastContactedAt: new Date() })
        .where(and(eq(crmContacts.id, input.contactId), eq(crmContacts.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Companies ─────────────────────────────────────────────────────────────

  listCompanies: protectedProcedure
    .input(
      z.object({
        search: z.string().optional(),
        industry: z.string().optional(),
        size: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmCompanies, crmContacts } = await import("../../drizzle/schema");
      const { eq, and, like, asc, sql } = await import("drizzle-orm");

      const conditions = [eq(crmCompanies.userId, ctx.user.id)];
      if (input.industry) conditions.push(eq(crmCompanies.industry, input.industry));
      if (input.size) conditions.push(eq(crmCompanies.size, input.size as any));
      if (input.search) conditions.push(like(crmCompanies.name, `%${input.search}%`));

      const rows = await db
        .select()
        .from(crmCompanies)
        .where(and(...conditions))
        .orderBy(asc(crmCompanies.name));

      const counts = await db
        .select({ companyId: crmContacts.companyId, count: sql<number>`count(*)` })
        .from(crmContacts)
        .where(eq(crmContacts.userId, ctx.user.id))
        .groupBy(crmContacts.companyId);

      const countMap: Record<number, number> = {};
      for (const c of counts) {
        if (c.companyId !== null) countMap[c.companyId] = Number(c.count);
      }

      return rows.map((r) => ({ ...r, contactCount: countMap[r.id] ?? 0 }));
    }),

  getCompany: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmCompanies, crmContacts } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const [company] = await db
        .select()
        .from(crmCompanies)
        .where(and(eq(crmCompanies.id, input.id), eq(crmCompanies.userId, ctx.user.id)));
      if (!company) throw new TRPCError({ code: "NOT_FOUND", message: "Company not found" });

      const contacts = await db
        .select()
        .from(crmContacts)
        .where(and(eq(crmContacts.companyId, input.id), eq(crmContacts.userId, ctx.user.id)));

      return { ...company, contacts };
    }),

  createCompany: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        industry: z.string().optional(),
        size: z.enum(["solo", "small", "medium", "large", "enterprise"]).default("small"),
        website: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).default([]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmCompanies } = await import("../../drizzle/schema");
      await db.insert(crmCompanies).values({ ...input, userId: ctx.user.id });
      return { success: true };
    }),

  updateCompany: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        industry: z.string().optional(),
        size: z.enum(["solo", "small", "medium", "large", "enterprise"]).optional(),
        website: z.string().optional(),
        description: z.string().optional(),
        tags: z.array(z.string()).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmCompanies } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const { id, ...data } = input;
      await db
        .update(crmCompanies)
        .set(data)
        .where(and(eq(crmCompanies.id, id), eq(crmCompanies.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteCompany: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmCompanies } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      await db
        .delete(crmCompanies)
        .where(and(eq(crmCompanies.id, input.id), eq(crmCompanies.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Tags ──────────────────────────────────────────────────────────────────

  listTags: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const { crmContactTags } = await import("../../drizzle/schema");
    const { eq, asc } = await import("drizzle-orm");
    return db.select().from(crmContactTags).where(eq(crmContactTags.userId, ctx.user.id)).orderBy(asc(crmContactTags.name));
  }),

  createTag: protectedProcedure
    .input(z.object({ name: z.string().min(1), color: z.string().default("#6366f1") }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmContactTags } = await import("../../drizzle/schema");
      await db.insert(crmContactTags).values({ ...input, userId: ctx.user.id });
      return { success: true };
    }),

  deleteTag: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmContactTags } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      await db.delete(crmContactTags).where(and(eq(crmContactTags.id, input.id), eq(crmContactTags.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Segments ──────────────────────────────────────────────────────────────

  listSegments: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const { crmSegments } = await import("../../drizzle/schema");
    const { eq, desc } = await import("drizzle-orm");
    return db.select().from(crmSegments).where(eq(crmSegments.userId, ctx.user.id)).orderBy(desc(crmSegments.createdAt));
  }),

  createSegment: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        description: z.string().optional(),
        filterRules: z.object({
          logic: z.enum(["AND", "OR"]).default("AND"),
          rules: z.array(
            z.object({ field: z.string(), operator: z.string(), value: z.string() })
          ),
        }),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmSegments } = await import("../../drizzle/schema");
      await db.insert(crmSegments).values({ ...input, userId: ctx.user.id, isDynamic: true });
      return { success: true };
    }),

  updateSegment: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).optional(),
        description: z.string().optional(),
        filterRules: z.object({
          logic: z.enum(["AND", "OR"]),
          rules: z.array(z.object({ field: z.string(), operator: z.string(), value: z.string() })),
        }).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmSegments } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const { id, ...data } = input;
      await db.update(crmSegments).set(data).where(and(eq(crmSegments.id, id), eq(crmSegments.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteSegment: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmSegments } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      await db.delete(crmSegments).where(and(eq(crmSegments.id, input.id), eq(crmSegments.userId, ctx.user.id)));
      return { success: true };
    }),

  evaluateSegment: protectedProcedure
    .input(z.object({ segmentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmSegments, crmContacts } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");

      const [segment] = await db
        .select()
        .from(crmSegments)
        .where(and(eq(crmSegments.id, input.segmentId), eq(crmSegments.userId, ctx.user.id)));
      if (!segment) throw new TRPCError({ code: "NOT_FOUND", message: "Segment not found" });

      const allContacts = await db
        .select()
        .from(crmContacts)
        .where(eq(crmContacts.userId, ctx.user.id));

      const fr = segment.filterRules as { logic: "AND" | "OR"; rules: Array<{ field: string; operator: string; value: string }> };
      const rules = fr.rules ?? [];
      const logic = fr.logic ?? "AND";

      const matched = allContacts.filter((contact) => {
        const results = rules.map((rule) => {
          const val = (contact as Record<string, unknown>)[rule.field];
          const rv = rule.value;
          switch (rule.operator) {
            case "is": return String(val) === rv;
            case "is_not": return String(val) !== rv;
            case "contains": return String(val ?? "").toLowerCase().includes(rv.toLowerCase());
            case "greater_than": return Number(val) > Number(rv);
            case "less_than": return Number(val) < Number(rv);
            case "is_empty": return !val;
            case "is_not_empty": return !!val;
            default: return true;
          }
        });
        return logic === "AND" ? results.every(Boolean) : results.some(Boolean);
      });

      await db.update(crmSegments).set({ contactCount: matched.length }).where(eq(crmSegments.id, input.segmentId));
      return { contacts: matched, count: matched.length };
    }),

  // ── Custom Fields ─────────────────────────────────────────────────────────

  listCustomFields: protectedProcedure
    .input(z.object({ entityType: z.enum(["contact", "company"]).optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const { crmCustomFieldDefs } = await import("../../drizzle/schema");
      const { eq, and, asc } = await import("drizzle-orm");
      const conditions = [eq(crmCustomFieldDefs.userId, ctx.user.id)];
      if (input.entityType) conditions.push(eq(crmCustomFieldDefs.entityType, input.entityType));
      return db.select().from(crmCustomFieldDefs).where(and(...conditions)).orderBy(asc(crmCustomFieldDefs.sortOrder));
    }),

  createCustomField: protectedProcedure
    .input(
      z.object({
        entityType: z.enum(["contact", "company"]),
        fieldName: z.string().min(1).regex(/^[a-z_]+$/, "Lowercase letters and underscores only"),
        label: z.string().min(1),
        fieldType: z.enum(["text", "number", "date", "dropdown", "checkbox", "url", "long_text"]),
        options: z.array(z.string()).optional(),
        isRequired: z.boolean().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmCustomFieldDefs } = await import("../../drizzle/schema");
      await db.insert(crmCustomFieldDefs).values({ ...input, userId: ctx.user.id });
      return { success: true };
    }),

  deleteCustomField: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmCustomFieldDefs } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      await db.delete(crmCustomFieldDefs).where(and(eq(crmCustomFieldDefs.id, input.id), eq(crmCustomFieldDefs.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Import / Export ───────────────────────────────────────────────────────

  importContacts: protectedProcedure
    .input(
      z.object({
        rows: z.array(
          z.object({
            firstName: z.string().default(""),
            lastName: z.string().default(""),
            email: z.string().optional(),
            phone: z.string().optional(),
            company: z.string().optional(),
            title: z.string().optional(),
            lifecycleStage: z.string().optional(),
            tags: z.string().optional(),
          })
        ),
        duplicateHandling: z.enum(["skip", "overwrite", "merge"]).default("skip"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { crmContacts } = await import("../../drizzle/schema");
      const { eq, and } = await import("drizzle-orm");
      const userId = ctx.user.id;
      let created = 0, skipped = 0, updated = 0;

      for (const row of input.rows) {
        if (!row.firstName && !row.email) { skipped++; continue; }
        const tags = row.tags ? row.tags.split(",").map((t) => t.trim()).filter(Boolean) : [];
        const validStages = ["lead", "prospect", "client", "past_client", "partner"];
        const lifecycleStage = validStages.includes(row.lifecycleStage ?? "") ? row.lifecycleStage as any : "lead";

        let existing: typeof crmContacts.$inferSelect | undefined;
        if (row.email) {
          const found = await db.select().from(crmContacts).where(and(eq(crmContacts.userId, userId), eq(crmContacts.email, row.email)));
          existing = found[0];
        }

        if (existing) {
          if (input.duplicateHandling === "skip") { skipped++; continue; }
          const newTags = input.duplicateHandling === "merge"
            ? Array.from(new Set([...(existing.tags ?? []), ...tags]))
            : tags;
          await db.update(crmContacts).set({
            firstName: row.firstName || existing.firstName,
            lastName: row.lastName || existing.lastName,
            phone: row.phone || existing.phone,
            title: row.title || existing.title,
            tags: newTags,
            lifecycleStage,
          }).where(eq(crmContacts.id, existing.id));
          updated++;
        } else {
          await db.insert(crmContacts).values({
            userId,
            firstName: row.firstName || "Unknown",
            lastName: row.lastName || "",
            email: row.email || null,
            phone: row.phone,
            title: row.title,
            tags,
            lifecycleStage,
            source: "import",
          });
          created++;
        }
      }
      return { created, updated, skipped, total: input.rows.length };
    }),

  exportContacts: protectedProcedure
    .input(
      z.object({
        lifecycleStage: z.string().optional(),
        search: z.string().optional(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const { crmContacts } = await import("../../drizzle/schema");
      const { eq, and, like, or, asc } = await import("drizzle-orm");

      const conditions = [eq(crmContacts.userId, ctx.user.id)];
      if (input.lifecycleStage) conditions.push(eq(crmContacts.lifecycleStage, input.lifecycleStage as any));
      if (input.search) {
        conditions.push(
          or(
            like(crmContacts.firstName, `%${input.search}%`),
            like(crmContacts.lastName, `%${input.search}%`),
            like(crmContacts.email, `%${input.search}%`)
          )!
        );
      }

      const rows = await db.select().from(crmContacts).where(and(...conditions)).orderBy(asc(crmContacts.firstName));
      return rows.map((r) => ({
        firstName: r.firstName,
        lastName: r.lastName,
        email: r.email ?? "",
        phone: r.phone ?? "",
        title: r.title ?? "",
        lifecycleStage: r.lifecycleStage,
        source: r.source,
        healthScore: r.healthScore ?? 0,
        tags: (r.tags ?? []).join(", "),
        createdAt: r.createdAt.toISOString(),
      }));
    }),

  // ── Stats ─────────────────────────────────────────────────────────────────

  getStats: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return { totalContacts: 0, totalCompanies: 0, byStage: {}, recentContacts: [] };
    const { crmContacts, crmCompanies } = await import("../../drizzle/schema");
    const { eq, desc } = await import("drizzle-orm");
    const userId = ctx.user.id;

    const contacts = await db.select().from(crmContacts).where(eq(crmContacts.userId, userId)).orderBy(desc(crmContacts.createdAt));
    const companies = await db.select().from(crmCompanies).where(eq(crmCompanies.userId, userId));

    const byStage: Record<string, number> = {};
    for (const c of contacts) {
      byStage[c.lifecycleStage] = (byStage[c.lifecycleStage] ?? 0) + 1;
    }

    return {
      totalContacts: contacts.length,
      totalCompanies: companies.length,
      byStage,
      recentContacts: contacts.slice(0, 5),
    };
  }),
});
