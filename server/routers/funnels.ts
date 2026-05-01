import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  funnels, funnelPages, funnelSubmissions, crmContacts,
} from "../../drizzle/schema";
import { eq, and, desc, asc, sql } from "drizzle-orm";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

// Default section templates per funnel template type
const TEMPLATE_SECTIONS: Record<string, object[]> = {
  lead_magnet: [
    { type: "hero", content: { headline: "Get Your Free Guide", subheadline: "Enter your email to download instantly", cta: "Download Now" }, styles: {} },
    { type: "benefits", content: { title: "What You'll Learn", items: ["Key insight #1", "Key insight #2", "Key insight #3"] }, styles: {} },
    { type: "form", content: { title: "Get Instant Access", fields: ["name", "email"] }, styles: {} },
  ],
  consultation: [
    { type: "hero", content: { headline: "Book Your Free Consultation", subheadline: "30 minutes to transform your business", cta: "Schedule Now" }, styles: {} },
    { type: "about", content: { title: "About This Call", body: "We'll review your current situation and outline a clear path forward." }, styles: {} },
    { type: "form", content: { title: "Reserve Your Spot", fields: ["name", "email", "phone", "message"] }, styles: {} },
  ],
  webinar: [
    { type: "hero", content: { headline: "Join the Free Webinar", subheadline: "Live training — limited seats", cta: "Register Free" }, styles: {} },
    { type: "agenda", content: { title: "What We'll Cover", items: ["Topic 1", "Topic 2", "Topic 3"] }, styles: {} },
    { type: "form", content: { title: "Save Your Seat", fields: ["name", "email"] }, styles: {} },
  ],
  service: [
    { type: "hero", content: { headline: "Our Services", subheadline: "Tailored solutions for your business", cta: "Get Started" }, styles: {} },
    { type: "services", content: { title: "What We Offer", items: ["Service 1", "Service 2", "Service 3"] }, styles: {} },
    { type: "form", content: { title: "Get in Touch", fields: ["name", "email", "message"] }, styles: {} },
  ],
  case_study: [
    { type: "hero", content: { headline: "Client Success Story", subheadline: "See how we helped achieve results", cta: "Read More" }, styles: {} },
    { type: "results", content: { title: "The Results", metrics: ["Metric 1", "Metric 2", "Metric 3"] }, styles: {} },
    { type: "form", content: { title: "Want Similar Results?", fields: ["name", "email"] }, styles: {} },
  ],
  blank: [
    { type: "hero", content: { headline: "Your Headline Here", subheadline: "Your subheadline here", cta: "Get Started" }, styles: {} },
    { type: "form", content: { title: "Contact Us", fields: ["name", "email"] }, styles: {} },
  ],
};

// ─── Section schema ────────────────────────────────────────────────────────────
const sectionSchema = z.object({
  type: z.string(),
  content: z.record(z.string(), z.unknown()),
  styles: z.record(z.string(), z.unknown()).optional(),
});

const formConfigSchema = z.object({
  fields: z.array(z.string()),
  submitAction: z.enum(["show_message", "redirect"]).default("show_message"),
  redirectUrl: z.string().optional(),
  thankYouMessage: z.string().default("Thank you! We'll be in touch soon."),
}).optional();

// ─── Router ───────────────────────────────────────────────────────────────────
export const funnelsRouter = router({
  // ── Funnel CRUD ────────────────────────────────────────────────────────────
  listFunnels: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(funnels)
      .where(eq(funnels.userId, ctx.user.id))
      .orderBy(desc(funnels.updatedAt));
  }),

  getFunnel: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [funnel] = await db.select().from(funnels)
        .where(and(eq(funnels.id, input.id), eq(funnels.userId, ctx.user.id)));
      if (!funnel) throw new TRPCError({ code: "NOT_FOUND" });

      const pages = await db.select().from(funnelPages)
        .where(eq(funnelPages.funnelId, input.id))
        .orderBy(asc(funnelPages.pageOrder));

      return { ...funnel, pages };
    }),

  createFunnel: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      templateType: z.enum(["lead_magnet", "consultation", "webinar", "service", "case_study", "blank"]).default("blank"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      let slug = slugify(input.name);
      const existing = await db.select({ slug: funnels.slug })
        .from(funnels)
        .where(and(eq(funnels.userId, ctx.user.id), eq(funnels.slug, slug)));
      if (existing.length > 0) slug = `${slug}-${Date.now()}`;

      const [result] = await db.insert(funnels).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        slug,
        templateType: input.templateType,
        status: "draft",
        totalViews: 0,
        totalSubmissions: 0,
      });
      const funnelId = (result as any).insertId as number;

      // Create default page from template
      const sections = TEMPLATE_SECTIONS[input.templateType] ?? TEMPLATE_SECTIONS.blank;
      await db.insert(funnelPages).values({
        funnelId,
        userId: ctx.user.id,
        name: "Main Page",
        slug: "main",
        pageOrder: 0,
        sections,
        formConfig: {
          fields: ["name", "email"],
          submitAction: "show_message",
          thankYouMessage: "Thank you! We'll be in touch soon.",
        },
        isPublished: false,
        views: 0,
        submissions: 0,
      });

      return { id: funnelId, slug };
    }),

  updateFunnel: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      status: z.enum(["draft", "published", "archived"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...fields } = input;
      await db.update(funnels)
        .set({ ...fields, updatedAt: new Date() })
        .where(and(eq(funnels.id, id), eq(funnels.userId, ctx.user.id)));
      return { ok: true };
    }),

  deleteFunnel: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(funnelSubmissions).where(eq(funnelSubmissions.funnelId, input.id));
      await db.delete(funnelPages).where(eq(funnelPages.funnelId, input.id));
      await db.delete(funnels).where(and(eq(funnels.id, input.id), eq(funnels.userId, ctx.user.id)));
      return { ok: true };
    }),

  // ── Page CRUD ──────────────────────────────────────────────────────────────
  listPages: protectedProcedure
    .input(z.object({ funnelId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      // Verify ownership
      const [f] = await db.select({ id: funnels.id }).from(funnels)
        .where(and(eq(funnels.id, input.funnelId), eq(funnels.userId, ctx.user.id)));
      if (!f) throw new TRPCError({ code: "NOT_FOUND" });
      return db.select().from(funnelPages)
        .where(eq(funnelPages.funnelId, input.funnelId))
        .orderBy(asc(funnelPages.pageOrder));
    }),

  createPage: protectedProcedure
    .input(z.object({
      funnelId: z.number().int(),
      name: z.string().min(1).max(255),
      sections: z.array(sectionSchema).default([]),
      formConfig: formConfigSchema,
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [f] = await db.select({ id: funnels.id }).from(funnels)
        .where(and(eq(funnels.id, input.funnelId), eq(funnels.userId, ctx.user.id)));
      if (!f) throw new TRPCError({ code: "NOT_FOUND" });

      // Get max page order
      const pages = await db.select({ pageOrder: funnelPages.pageOrder })
        .from(funnelPages).where(eq(funnelPages.funnelId, input.funnelId));
      const maxOrder = pages.reduce((m, p) => Math.max(m, p.pageOrder), -1);

      let slug = slugify(input.name);
      const [result] = await db.insert(funnelPages).values({
        funnelId: input.funnelId,
        userId: ctx.user.id,
        name: input.name,
        slug,
        pageOrder: maxOrder + 1,
        sections: input.sections,
        formConfig: input.formConfig,
        isPublished: false,
        views: 0,
        submissions: 0,
      });
      return { id: (result as any).insertId as number };
    }),

  updatePage: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      name: z.string().min(1).max(255).optional(),
      sections: z.array(sectionSchema).optional(),
      formConfig: formConfigSchema,
      isPublished: z.boolean().optional(),
      seoTitle: z.string().optional(),
      seoDescription: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...fields } = input;
      await db.update(funnelPages)
        .set({ ...fields, updatedAt: new Date() })
        .where(and(eq(funnelPages.id, id), eq(funnelPages.userId, ctx.user.id)));
      return { ok: true };
    }),

  deletePage: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(funnelSubmissions).where(eq(funnelSubmissions.funnelPageId, input.id));
      await db.delete(funnelPages)
        .where(and(eq(funnelPages.id, input.id), eq(funnelPages.userId, ctx.user.id)));
      return { ok: true };
    }),

  // ── Public: Submit Form ────────────────────────────────────────────────────
  submitForm: publicProcedure
    .input(z.object({
      funnelSlug: z.string(),
      pageSlug: z.string().default("main"),
      formData: z.record(z.string(), z.string()),
      sourceUrl: z.string().optional(),
      utmSource: z.string().optional(),
      utmMedium: z.string().optional(),
      utmCampaign: z.string().optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [funnel] = await db.select().from(funnels)
        .where(and(eq(funnels.slug, input.funnelSlug), eq(funnels.status, "published")));
      if (!funnel) throw new TRPCError({ code: "NOT_FOUND", message: "Funnel not found" });

      const [page] = await db.select().from(funnelPages)
        .where(and(eq(funnelPages.funnelId, funnel.id), eq(funnelPages.slug, input.pageSlug)));
      if (!page) throw new TRPCError({ code: "NOT_FOUND", message: "Page not found" });

      // Auto-create or match CRM contact from email field
      let contactId: number | null = null;
      const email = input.formData["email"] ?? input.formData["Email"];
      const name = input.formData["name"] ?? input.formData["Name"] ?? "";

      if (email) {
        const [existing] = await db.select({ id: crmContacts.id })
          .from(crmContacts)
          .where(and(eq(crmContacts.userId, funnel.userId), eq(crmContacts.email, email)));

        if (existing) {
          contactId = existing.id;
        } else {
          const nameParts = name.split(" ");
          const [newContact] = await db.insert(crmContacts).values({
            userId: funnel.userId,
            firstName: nameParts[0] ?? name,
            lastName: nameParts.slice(1).join(" ") || "",
            email,
            lifecycleStage: "lead",
            source: "manual",
          });
          contactId = (newContact as any).insertId as number;
        }
      }

      // Record submission
      await db.insert(funnelSubmissions).values({
        funnelPageId: page.id,
        funnelId: funnel.id,
        userId: funnel.userId,
        contactId,
        formData: input.formData,
        sourceUrl: input.sourceUrl,
        utmSource: input.utmSource,
        utmMedium: input.utmMedium,
        utmCampaign: input.utmCampaign,
      });

      // Increment counters
      await db.update(funnelPages)
        .set({ submissions: sql`${funnelPages.submissions} + 1` })
        .where(eq(funnelPages.id, page.id));
      await db.update(funnels)
        .set({ totalSubmissions: sql`${funnels.totalSubmissions} + 1` })
        .where(eq(funnels.id, funnel.id));

      const formConfig = page.formConfig as any;
      return {
        success: true,
        redirectUrl: formConfig?.submitAction === "redirect" ? formConfig.redirectUrl : null,
        thankYouMessage: formConfig?.thankYouMessage ?? "Thank you! We'll be in touch soon.",
      };
    }),

  // ── Public: Track View ─────────────────────────────────────────────────────
  trackView: publicProcedure
    .input(z.object({ funnelSlug: z.string(), pageSlug: z.string().default("main") }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) return { ok: true };
      const [funnel] = await db.select({ id: funnels.id }).from(funnels)
        .where(eq(funnels.slug, input.funnelSlug));
      if (!funnel) return { ok: true };
      const [page] = await db.select({ id: funnelPages.id }).from(funnelPages)
        .where(and(eq(funnelPages.funnelId, funnel.id), eq(funnelPages.slug, input.pageSlug)));
      if (!page) return { ok: true };
      await db.update(funnelPages)
        .set({ views: sql`${funnelPages.views} + 1` })
        .where(eq(funnelPages.id, page.id));
      await db.update(funnels)
        .set({ totalViews: sql`${funnels.totalViews} + 1` })
        .where(eq(funnels.id, funnel.id));
      return { ok: true };
    }),

  // ── Submissions ────────────────────────────────────────────────────────────
  getSubmissions: protectedProcedure
    .input(z.object({ funnelId: z.number().int() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const [f] = await db.select({ id: funnels.id }).from(funnels)
        .where(and(eq(funnels.id, input.funnelId), eq(funnels.userId, ctx.user.id)));
      if (!f) throw new TRPCError({ code: "NOT_FOUND" });
      return db.select().from(funnelSubmissions)
        .where(eq(funnelSubmissions.funnelId, input.funnelId))
        .orderBy(desc(funnelSubmissions.submittedAt))
        .limit(500);
    }),

  // ── Public: Get Funnel Page ────────────────────────────────────────────────
  getPublicPage: publicProcedure
    .input(z.object({
      funnelSlug: z.string(),
      pageSlug: z.string().default("main"),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return null;
      const [funnel] = await db.select().from(funnels)
        .where(and(eq(funnels.slug, input.funnelSlug), eq(funnels.status, "published")));
      if (!funnel) return null;
      const [page] = await db.select().from(funnelPages)
        .where(and(
          eq(funnelPages.funnelId, funnel.id),
          eq(funnelPages.slug, input.pageSlug),
          eq(funnelPages.isPublished, true),
        ));
      if (!page) return null;
      return { funnel, page };
    }),
});
