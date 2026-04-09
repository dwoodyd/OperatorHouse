import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createClient, createDeal, createLead, createStrategy, createTask,
  createVaultItem, deleteClient, deleteDeal, deleteLead, deleteTask,
  deleteVaultItem, getActivities, getAnalyticsData, getClients,
  getDashboardMetrics, getLatestBriefing, getLeads, getPipelineDeals,
  getStrategies, getTasks, getUserProfile, getVaultItems, logActivity,
  updateClient, updateDeal, updateLead, updateStrategy, updateTask,
  updateVaultItem, upsertUserProfile,
} from "./db";
import { invokeLLM } from "./_core/llm";

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
  }),

  profile: router({
    get: protectedProcedure.query(async ({ ctx }) => getUserProfile(ctx.user.id)),
    upsert: protectedProcedure
      .input(z.object({ companyName: z.string().optional(), timezone: z.string().optional() }))
      .mutation(async ({ ctx, input }) => {
        await upsertUserProfile({ userId: ctx.user.id, ...input });
        return { success: true };
      }),
  }),

  dashboard: router({
    metrics: protectedProcedure.query(async ({ ctx }) => getDashboardMetrics(ctx.user.id)),
    activities: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => getActivities(ctx.user.id, input.limit ?? 20)),
  }),

  clients: router({
    list: protectedProcedure.query(async ({ ctx }) => getClients(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        name: z.string().min(1),
        company: z.string().optional(),
        website: z.string().optional(),
        linkedinUrl: z.string().optional(),
        email: z.string().optional(),
        industry: z.string().optional(),
        summary: z.string().optional(),
        status: z.enum(["active", "inactive", "prospect"]).optional(),
        nextStep: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createClient({ ...input, userId: ctx.user.id });
        await logActivity({ userId: ctx.user.id, activityType: "client_created", summary: `Added client: ${input.name}` });
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        name: z.string().optional(),
        company: z.string().optional(),
        website: z.string().optional(),
        linkedinUrl: z.string().optional(),
        email: z.string().optional(),
        industry: z.string().optional(),
        summary: z.string().optional(),
        status: z.enum(["active", "inactive", "prospect"]).optional(),
        nextStep: z.string().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateClient(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteClient(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  leads: router({
    list: protectedProcedure.query(async ({ ctx }) => getLeads(ctx.user.id)),
    analyze: protectedProcedure
      .input(z.object({ input: z.string().min(1) }))
      .mutation(async ({ ctx, input }) => {
        const prompt = `You are the Ghost Consultant, an AI strategist operating through the Soul Engineer framework. Analyze the following lead and produce a structured JSON audit.

Lead Input: ${input.input}

Return ONLY valid JSON with this exact structure:
{
  "name": "<person or company name>",
  "company": "<company name if identifiable>",
  "intentScore": <number 1-10>,
  "vibeCheck": "<2-3 sentence assessment of their current state, energy, and readiness>",
  "painPoints": "<key pain points and structural problems you identify>",
  "engineeringMap": "<specific AI/automation solutions mapped to their situation>",
  "legacyPlay": "<long-term positioning and legacy opportunity>",
  "nextBeat": "<specific next action to take with this lead>"
}`;
        const response = await invokeLLM({
          messages: [
            { role: "system", content: "You are the Ghost Consultant. Return only valid JSON, no markdown fences." },
            { role: "user", content: prompt },
          ],
          response_format: { type: "json_object" },
        });
        const raw = response.choices[0]?.message?.content ?? "{}";
        let parsed: Record<string, unknown>;
        try { parsed = JSON.parse(typeof raw === 'string' ? raw : JSON.stringify(raw)); } catch { parsed = {}; }
        const intentScore = typeof parsed.intentScore === "number" ? parsed.intentScore : 5;
        const { name, company, ...auditData } = parsed;
        await createLead({
          userId: ctx.user.id,
          rawInput: input.input,
          sourceType: "manual",
          analysisJson: { name, company, ...auditData },
          intentScore,
          status: "analysis",
        });
        await logActivity({ userId: ctx.user.id, activityType: "lead_created", summary: `Lead analyzed: ${String(name ?? input.input.slice(0, 40))}` });
        return { success: true };
      }),
    create: protectedProcedure
      .input(z.object({
        sourceType: z.enum(["linkedin", "email", "url", "twitter", "reddit", "manual"]).optional(),
        sourceValue: z.string().optional(),
        rawInput: z.string().optional(),
        analysisJson: z.any().optional(),
        intentScore: z.number().optional(),
        status: z.enum(["new", "review", "analysis", "ready", "sent", "closed"]).optional(),
        clientId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createLead({ ...input, userId: ctx.user.id });
        await logActivity({ userId: ctx.user.id, activityType: "lead_created", summary: "New lead added" });
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        sourceType: z.enum(["linkedin", "email", "url", "twitter", "reddit", "manual"]).optional(),
        sourceValue: z.string().optional(),
        rawInput: z.string().optional(),
        analysisJson: z.any().optional(),
        intentScore: z.number().optional(),
        status: z.enum(["new", "review", "analysis", "ready", "sent", "closed"]).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateLead(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteLead(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  pipeline: router({
    list: protectedProcedure.query(async ({ ctx }) => getPipelineDeals(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        stage: z.enum(["Discovery", "Analysis", "Strategy", "Proposal", "Closed"]).optional(),
        value: z.number().optional(),
        intentScore: z.number().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        closeProbability: z.number().optional(),
        clientId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createDeal({ ...input, userId: ctx.user.id });
        await logActivity({ userId: ctx.user.id, activityType: "deal_created", summary: `New deal: ${input.title}` });
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        stage: z.enum(["Discovery", "Analysis", "Strategy", "Proposal", "Closed"]).optional(),
        value: z.number().optional(),
        intentScore: z.number().optional(),
        tags: z.array(z.string()).optional(),
        notes: z.string().optional(),
        closeProbability: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateDeal(id, ctx.user.id, data);
        if (data.stage) {
          await logActivity({ userId: ctx.user.id, activityType: "deal_stage_changed", summary: `Deal moved to ${data.stage}` });
        }
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteDeal(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  vault: router({
    list: protectedProcedure.query(async ({ ctx }) => getVaultItems(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        type: z.enum(["framework", "case_study", "voice_note", "template", "research", "note"]).optional(),
        title: z.string().min(1),
        content: z.string().optional(),
        textContent: z.string().optional(),
        tags: z.array(z.string()).optional(),
        clientId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createVaultItem({ ...input, userId: ctx.user.id });
        await logActivity({ userId: ctx.user.id, activityType: "vault_item_created", summary: `Vault item added: ${input.title}` });
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        type: z.enum(["framework", "case_study", "voice_note", "template", "research", "note"]).optional(),
        title: z.string().optional(),
        content: z.string().optional(),
        textContent: z.string().optional(),
        tags: z.array(z.string()).optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateVaultItem(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteVaultItem(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  strategies: router({
    list: protectedProcedure.query(async ({ ctx }) => getStrategies(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        outputType: z.enum(["full", "quick", "deck", "email"]).optional(),
        inputContext: z.any().optional(),
        content: z.string().optional(),
        clientId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createStrategy({ ...input, userId: ctx.user.id, status: "complete" });
        await logActivity({ userId: ctx.user.id, activityType: "strategy_generated", summary: `Strategy generated (${input.outputType ?? "full"})` });
        return { success: true };
      }),
  }),

  tasks: router({
    list: protectedProcedure.query(async ({ ctx }) => getTasks(ctx.user.id)),
    create: protectedProcedure
      .input(z.object({
        title: z.string().min(1),
        description: z.string().optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        dueAt: z.date().optional(),
        clientId: z.number().optional(),
        dealId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await createTask({ ...input, userId: ctx.user.id });
        return { success: true };
      }),
    update: protectedProcedure
      .input(z.object({
        id: z.number(),
        title: z.string().optional(),
        description: z.string().optional(),
        status: z.enum(["pending", "in_progress", "done", "cancelled"]).optional(),
        priority: z.enum(["low", "medium", "high", "urgent"]).optional(),
        dueAt: z.date().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const { id, ...data } = input;
        await updateTask(id, ctx.user.id, data);
        return { success: true };
      }),
    delete: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await deleteTask(input.id, ctx.user.id);
        return { success: true };
      }),
  }),

  analytics: router({
    data: protectedProcedure.query(async ({ ctx }) => getAnalyticsData(ctx.user.id)),
  }),

  briefings: router({
    latest: protectedProcedure.query(async ({ ctx }) => getLatestBriefing(ctx.user.id)),
  }),
});

export type AppRouter = typeof appRouter;
