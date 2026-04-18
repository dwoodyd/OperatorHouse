import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import {
  createBriefing, createClient, createDeal, createLead, createStrategy, createTask,
  createVaultItem, deleteAllUserData, deleteClient, deleteDeal, deleteLead, deleteTask,
  deleteVaultItem, getActivities, getAnalyticsData, getClients,
  getDashboardMetrics, getLatestBriefing, getLeads, getPipelineDeals,
  getStrategies, getTasks, getUserProfile, getVaultItems, logActivity,
  updateClient, updateDeal, updateLead, updateStrategy, updateTask,
  updateVaultItem, upsertUserProfile,
} from "./db";
import { runLeadAudit, runStrategyGeneration, PROMPT_VERSIONS } from "./ai";
import { notifyOwner } from "./_core/notification";
import { invokeLLM } from "./_core/llm";

// AI timeout helper for inline LLM calls in this router
const AI_TIMEOUT_MS = 45_000;
async function withAiTimeout<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`AI ${label} timed out after ${AI_TIMEOUT_MS / 1000}s. Please try again.`));
    }, AI_TIMEOUT_MS);
  });
  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

export const appRouter = router({
  system: systemRouter,
  auth: router({
    me: publicProcedure.query((opts) => opts.ctx.user),
    logout: publicProcedure.mutation(({ ctx }) => {
      const cookieOptions = getSessionCookieOptions(ctx.req);
      ctx.res.clearCookie(COOKIE_NAME, { ...cookieOptions, maxAge: -1 });
      return { success: true } as const;
    }),
    deleteAccount: protectedProcedure.mutation(async ({ ctx }) => {
      await deleteAllUserData(ctx.user.id);
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
      .input(z.object({
        input: z.string().min(1),
        clientId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const [vaultItems, clients] = await Promise.all([
          getVaultItems(ctx.user.id),
          getClients(ctx.user.id),
        ]);
        const clientRecord = input.clientId
          ? (clients.find(c => c.id === input.clientId) ?? null)
          : null;
        const contextVault = vaultItems
          .filter(v => v.type === "framework" || v.type === "case_study" || v.type === "research")
          .slice(0, 5)
          .map(v => ({ title: v.title, content: v.content ?? v.textContent ?? null, type: v.type }));
        const audit = await runLeadAudit({
          rawInput: input.input,
          vaultContext: contextVault,
          clientContext: clientRecord ? {
            name: clientRecord.name,
            company: clientRecord.company ?? null,
            industry: clientRecord.industry ?? null,
            summary: clientRecord.summary ?? null,
          } : null,
        });
        await createLead({
          userId: ctx.user.id,
          rawInput: input.input,
          sourceType: "manual",
          clientId: input.clientId,
          analysisJson: audit,
          intentScore: audit.intentScore,
          status: "analysis",
        });
        await logActivity({ userId: ctx.user.id, activityType: "lead_analyzed", summary: `Lead analyzed: ${audit.name} @ ${audit.company}` });
        // Fire-and-forget owner notification — don't block the response
        notifyOwner({
          title: `New Lead Audit: ${audit.name} @ ${audit.company}`,
          content: `Intent score: ${audit.intentScore}/10\nNext beat: ${audit.nextBeat ?? "—"}\nAnalyzed by: ${ctx.user.name ?? ctx.user.email ?? "user"}`,
        }).catch(() => {/* non-critical */});
        return { audit };
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
    generate: protectedProcedure
      .input(z.object({
        outputType: z.enum(["full", "quick", "deck", "email"]),
        clientName: z.string().min(1),
        company: z.string().min(1),
        industry: z.string().optional(),
        context: z.string().min(1),
        clientId: z.number().optional(),
        dealId: z.number().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const [vaultItems, clients, deals] = await Promise.all([
          getVaultItems(ctx.user.id),
          getClients(ctx.user.id),
          getPipelineDeals(ctx.user.id),
        ]);
        const clientRecord = input.clientId
          ? (clients.find(c => c.id === input.clientId) ?? null)
          : null;
        const dealRecord = input.dealId
          ? (deals.find(d => d.id === input.dealId) ?? null)
          : null;
        // Use top 6 vault items as context
        const contextVault = vaultItems
          .filter(v => v.type === "framework" || v.type === "case_study" || v.type === "template" || v.type === "research")
          .slice(0, 6)
          .map(v => ({ id: v.id, title: v.title, content: v.content ?? v.textContent ?? null, type: v.type }));
        const result = await runStrategyGeneration({
          outputType: input.outputType,
          clientName: input.clientName,
          company: input.company,
          industry: input.industry,
          context: input.context,
          vaultItems: contextVault,
          clientRecord: clientRecord ? {
            id: clientRecord.id,
            summary: clientRecord.summary ?? null,
            nextStep: clientRecord.nextStep ?? null,
          } : null,
          dealRecord: dealRecord ? {
            id: dealRecord.id,
            title: dealRecord.title,
            stage: dealRecord.stage,
            notes: dealRecord.notes ?? null,
          } : null,
        });
        await createStrategy({
          userId: ctx.user.id,
          clientId: input.clientId,
          outputType: input.outputType,
          inputContext: { clientName: input.clientName, company: input.company, industry: input.industry, context: input.context },
          content: result.content,
          structuredOutput: result.structuredSections,
          promptVersion: result.promptVersion,
          modelName: result.modelName,
          status: "complete",
          citations: result.citations,
        });
        await logActivity({ userId: ctx.user.id, activityType: "strategy_generated", summary: `Strategy generated: ${result.title} (${input.outputType})` });
        return { strategy: result };
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
    generate: protectedProcedure.mutation(async ({ ctx }) => {
      const [leads, deals, activities] = await Promise.all([
        getLeads(ctx.user.id),
        getPipelineDeals(ctx.user.id),
        getActivities(ctx.user.id, 10),
      ]);
      const activeDeals = deals.filter((d) => d.stage !== 'Closed');
      const staleDeals = activeDeals.filter((d) => {
        const daysSince = (Date.now() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
        return daysSince > 7;
      });
      const prompt = `You are The Operator — an AI strategist for ${ctx.user.name ?? 'the operator'}. Active leads: ${leads.length}. Pipeline: ${activeDeals.length} active (${staleDeals.length} stale >7d). Recent: ${activities.slice(0,5).map((a) => a.summary ?? '').join('; ')}. Generate a crisp login briefing. Return JSON: { situation: string, priority: string, ghostNote: string }`;
      const response = await withAiTimeout(
        () => invokeLLM({
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_schema', json_schema: { name: 'briefing', strict: true, schema: { type: 'object', properties: { situation: { type: 'string' }, priority: { type: 'string' }, ghostNote: { type: 'string' } }, required: ['situation', 'priority', 'ghostNote'], additionalProperties: false } } },
        }),
        'Briefing'
      );
      const parsed = JSON.parse(response.choices[0].message.content as string) as { situation: string; priority: string; ghostNote: string };
      await createBriefing({ userId: ctx.user.id, briefingType: 'login', content: JSON.stringify(parsed), payload: parsed });
      return parsed;
    }),
    staleDeals: protectedProcedure.query(async ({ ctx }) => {
      const deals = await getPipelineDeals(ctx.user.id);
      return deals
        .filter((d) => {
          if (d.stage === 'Closed') return false;
          const daysSince = (Date.now() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
          return daysSince > 7;
        })
        .map((d) => ({
          id: d.id, title: d.title, stage: d.stage,
          daysSince: Math.floor((Date.now() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24)),
        }));
    }),
  }),

  operator: router({
    chat: protectedProcedure
      .input(z.object({
        message: z.string().min(1).max(2000),
        history: z.array(z.object({
          role: z.enum(["user", "assistant"]),
          content: z.string(),
        })).optional().default([]),
      }))
      .mutation(async ({ ctx, input }) => {
        // Inject live context from the user's data
        const [leads, deals, vaultItems] = await Promise.all([
          getLeads(ctx.user.id),
          getPipelineDeals(ctx.user.id),
          getVaultItems(ctx.user.id),
        ]);
        const activeDeals = deals.filter((d) => d.stage !== 'Closed');
        const staleDeals = activeDeals.filter((d) => {
          const days = (Date.now() - new Date(d.updatedAt).getTime()) / (1000 * 60 * 60 * 24);
          return days > 7;
        });
        const contextBlock = [
          `Operator: ${ctx.user.name ?? 'Unknown'}`,
          `Active leads: ${leads.length} (${leads.filter(l => l.intentScore !== null && l.intentScore >= 80).length} high-intent)`,
          `Lead statuses: ${leads.map(l => l.status).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`,
          `Pipeline: ${activeDeals.length} active deals, ${staleDeals.length} stale (>7d no activity)`,
          `Pipeline value: $${activeDeals.reduce((s, d) => s + (d.value ?? 0), 0).toLocaleString()}`,
          `Vault: ${vaultItems.length} items (${vaultItems.map(v => v.type).filter((v, i, a) => a.indexOf(v) === i).join(', ')})`,
          activeDeals.length > 0 ? `Top deals: ${activeDeals.slice(0, 3).map(d => `${d.title} (${d.stage}, $${(d.value ?? 0).toLocaleString()})`).join('; ')}` : '',
        ].filter(Boolean).join('\n');

        const systemPrompt = `You are The Operator — the AI strategist powering Operator House, the command center for ${ctx.user.name ?? 'this operator'}.

You have full context on their business. Be direct, strategic, and actionable. No filler. Respond in markdown.

## Live Context
${contextBlock}`;

        const messages = [
          { role: 'system' as const, content: systemPrompt },
          ...input.history.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
          { role: 'user' as const, content: input.message },
        ];

        const response = await withAiTimeout(
          () => invokeLLM({ messages }),
          'Command Line'
        );
        const reply = response.choices[0].message.content as string;

        // Log the interaction as an activity
        await logActivity({
          userId: ctx.user.id,
          activityType: 'operator_chat',
          summary: `Command Line: "${input.message.slice(0, 80)}${input.message.length > 80 ? '...' : ''}"`,
        });

        return { reply };
      }),
  }),

  onboarding: router({
    complete: protectedProcedure.mutation(async ({ ctx }) => {
      await logActivity({
        userId: ctx.user.id,
        activityType: 'onboarding_completed',
        summary: 'Operator completed onboarding walkthrough',
      });
      // Fire-and-forget owner notification
      notifyOwner({
        title: 'New Operator Activated',
        content: `${ctx.user.name ?? 'An operator'} (${ctx.user.email ?? 'unknown'}) completed onboarding and entered the House.`,
      }).catch(() => {});
      return { success: true };
    }),
  }),

  stripe: router({
    createCheckout: protectedProcedure
      .input(z.object({ plan: z.enum(["monthly", "annual"]), origin: z.string().url() }))
      .mutation(async ({ ctx, input }) => {
        const { createCheckoutSession, PLANS } = await import('./stripe');
        const priceId = PLANS[input.plan].priceId;
        if (!priceId) throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Plan price not configured. Please set STRIPE_MONTHLY_PRICE_ID / STRIPE_ANNUAL_PRICE_ID.' });
        const session = await createCheckoutSession({
          userId: ctx.user.id,
          email: ctx.user.email ?? '',
          name: ctx.user.name ?? '',
          priceId,
          origin: input.origin,
        });
        return { url: session.url };
      }),
    subscriptionStatus: protectedProcedure.query(async ({ ctx }) => ({
      status: (ctx.user as { subscriptionStatus?: string }).subscriptionStatus ?? 'inactive',
    })),
  }),
});

export type AppRouter = typeof appRouter;
