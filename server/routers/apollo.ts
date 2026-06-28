/**
 * Apollo.io B2B Lead Search Router
 * Search, preview, and one-click import to CRM / Pipeline
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { TRPCError } from "@trpc/server";
import { eq, and } from "drizzle-orm";
import { integrationConfigs, crmContacts, crmCompanies, prospectingLeads, leads, pipelineDeals, activities } from "../../drizzle/schema";
import { searchContacts, testApiKey, ApolloSearchFilter } from "../services/apollo";
import { ENV } from "../_core/env";

async function getUserApolloKey(userId: number): Promise<string | null> {
  const db = await getDb();
  if (!db) return null;

  // 1. User-specific config
  const [row] = await db
    .select({ config: integrationConfigs.config, isEnabled: integrationConfigs.isEnabled })
    .from(integrationConfigs)
    .where(and(eq(integrationConfigs.userId, userId), eq(integrationConfigs.provider, "apollo")))
    .limit(1);

  if (row && row.isEnabled) {
    const cfg = JSON.parse(row.config) as Record<string, string>;
    if (cfg.apiKey) return cfg.apiKey;
  }

  // 2. Global fallback from env
  if (ENV.apolloApiKey) return ENV.apolloApiKey;

  return null;
}

function normalizeApolloLead(contact: any) {
  const org = contact.organization;
  return {
    apolloId: contact.id,
    name: contact.name || `${contact.first_name || ""} ${contact.last_name || ""}`.trim(),
    firstName: contact.first_name || "",
    lastName: contact.last_name || "",
    email: contact.email || "",
    title: contact.title || "",
    linkedinUrl: contact.linkedin_url || "",
    phone: contact.phone_numbers?.[0]?.sanitized_number || "",
    company: org?.name || "",
    companyIndustry: org?.industry || "",
    companySize: org?.employee_count
      ? org.employee_count < 50
        ? "small"
        : org.employee_count < 500
        ? "medium"
        : org.employee_count < 2000
        ? "large"
        : "enterprise"
      : "",
    companyWebsite: org?.website_url || "",
    companyLinkedinUrl: org?.linkedin_url || "",
  };
}

export const apolloRouter = router({
  /**
   * Test the Apollo API key stored for this user
   */
  testKey: protectedProcedure.mutation(async ({ ctx }) => {
    const key = await getUserApolloKey(ctx.user.id);
    if (!key) {
      throw new TRPCError({ code: "UNAUTHORIZED", message: "Apollo API key not configured" });
    }
    const result = await testApiKey(key);
    if (!result.valid) {
      throw new TRPCError({ code: "BAD_REQUEST", message: result.message });
    }
    return result;
  }),

  /**
   * Search Apollo.io for B2B leads with filters
   */
  search: protectedProcedure
    .input(
      z.object({
        q: z.string().optional(),
        industry: z.string().optional(),
        title: z.string().optional(),
        companySize: z.string().optional(),
        location: z.string().optional(),
        technology: z.string().optional(),
        page: z.number().default(1),
        limit: z.number().max(100).default(10),
      })
    )
    .query(async ({ ctx, input }) => {
      const key = await getUserApolloKey(ctx.user.id);
      if (!key) {
        throw new TRPCError({ code: "UNAUTHORIZED", message: "Apollo API key not configured" });
      }

      const filter: ApolloSearchFilter = {
        q: input.q,
        industry: input.industry,
        title: input.title,
        companySize: input.companySize,
        location: input.location,
        technology: input.technology,
        page: input.page,
        limit: input.limit,
      };

      try {
        const result = await searchContacts(key, filter);
        return {
          contacts: result.contacts.map(normalizeApolloLead),
          pagination: result.pagination,
        };
      } catch (err) {
        if (err instanceof Error && err.message.includes("rate limit")) {
          throw new TRPCError({ code: "TOO_MANY_REQUESTS", message: "Apollo rate limit hit. Please try again shortly." });
        }
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: err instanceof Error ? err.message : "Apollo search failed",
        });
      }
    }),

  /**
   * One-click import an Apollo lead into the CRM as a contact (+ company)
   */
  importToCrm: protectedProcedure
    .input(
      z.object({
        apolloId: z.string(),
        name: z.string(),
        firstName: z.string(),
        lastName: z.string(),
        email: z.string(),
        title: z.string(),
        linkedinUrl: z.string(),
        phone: z.string(),
        company: z.string(),
        companyIndustry: z.string(),
        companySize: z.enum(["solo", "small", "medium", "large", "enterprise"]).optional(),
        companyWebsite: z.string(),
        companyLinkedinUrl: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Create or find company
      let companyId: number | null = null;
      if (input.company) {
        const existingCompanies = await db
          .select()
          .from(crmCompanies)
          .where(and(eq(crmCompanies.userId, ctx.user.id), eq(crmCompanies.name, input.company)))
          .limit(1);

        if (existingCompanies[0]) {
          companyId = existingCompanies[0].id;
        } else {
          const size = input.companySize || "small";
          await db.insert(crmCompanies).values({
            userId: ctx.user.id,
            name: input.company,
            industry: input.companyIndustry || null,
            size: size as any,
            website: input.companyWebsite || null,
          });
          const newCompanies = await db
            .select()
            .from(crmCompanies)
            .where(and(eq(crmCompanies.userId, ctx.user.id), eq(crmCompanies.name, input.company)))
            .limit(1);
          companyId = newCompanies[0]?.id ?? null;
        }
      }

      // Create contact
      await db.insert(crmContacts).values({
        userId: ctx.user.id,
        firstName: input.firstName || input.name.split(" ")[0] || "Unknown",
        lastName: input.lastName || input.name.split(" ").slice(1).join(" ") || "",
        email: input.email || null,
        phone: input.phone || null,
        title: input.title || null,
        companyId,
        lifecycleStage: "lead",
        source: "prospecting",
        tags: ["apollo"],
      });

      // Log activity
      await db.insert(activities).values({
        userId: ctx.user.id,
        activityType: "apollo_import_crm",
        summary: `Imported ${input.name} from Apollo to CRM`,
        payload: { source: "apollo", name: input.name, email: input.email },
      });

      return { success: true, companyId };
    }),

  /**
   * One-click import an Apollo lead into Prospecting Leads
   */
  importToProspecting: protectedProcedure
    .input(
      z.object({
        apolloId: z.string(),
        name: z.string(),
        email: z.string(),
        title: z.string(),
        linkedinUrl: z.string(),
        phone: z.string(),
        company: z.string(),
        companyIndustry: z.string(),
        companyWebsite: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [result] = await db.insert(prospectingLeads).values({
        userId: ctx.user.id,
        businessName: input.company || input.name,
        ownerName: input.name,
        email: input.email || null,
        phone: input.phone || null,
        website: input.companyWebsite || null,
        category: input.companyIndustry || null,
        source: "other",
        stage: "Prospect",
        notes: `Apollo lead: ${input.title}${input.linkedinUrl ? `\nLinkedIn: ${input.linkedinUrl}` : ""}`,
      });

      const id = (result as any).insertId as number;

      await db.insert(activities).values({
        userId: ctx.user.id,
        activityType: "apollo_import_prospecting",
        summary: `Imported ${input.name} from Apollo to Prospecting`,
        payload: { source: "apollo", name: input.name, email: input.email },
      });

      return { success: true, id };
    }),

  /**
   * One-click import an Apollo lead into the Pipeline as a deal
   */
  importToPipeline: protectedProcedure
    .input(
      z.object({
        apolloId: z.string(),
        name: z.string(),
        email: z.string(),
        title: z.string(),
        company: z.string(),
        companyIndustry: z.string(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      await db.insert(pipelineDeals).values({
        userId: ctx.user.id,
        title: `${input.name} - ${input.company || "Apollo Lead"}`,
        stage: "Discovery",
        tags: ["apollo"],
        notes: `Source: Apollo\nTitle: ${input.title}\nEmail: ${input.email}\nIndustry: ${input.companyIndustry}`,
      });

      await db.insert(activities).values({
        userId: ctx.user.id,
        activityType: "apollo_import_pipeline",
        summary: `Imported ${input.name} from Apollo to Pipeline`,
        payload: { source: "apollo", name: input.name, email: input.email },
      });

      return { success: true };
    }),
});
