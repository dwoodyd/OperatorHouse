import { z } from "zod";
import { COOKIE_NAME } from "@shared/const";
import { ENV } from "./_core/env";
import { getSessionCookieOptions } from "./_core/cookies";
import { systemRouter } from "./_core/systemRouter";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "./_core/trpc";
import { pulseRouter } from "./routers/pulse";
import { emailSequencesRouter } from "./routers/emailSequences";
import { callCenterRouter } from "./routers/callCenter";
import { smsRouter } from "./routers/sms";
import { voiceAgentsRouter } from "./routers/voiceAgents";
import { crmRouter } from "./routers/crm";
import { invoicingRouter } from "./routers/invoicing";
import { bookingRouter } from "./routers/booking";
import { funnelsRouter } from "./routers/funnels";
import { socialRouter } from "./routers/social";
import { analyticsRouter } from './routers/analytics';
import { teamRouter } from './routers/team';
import { reviewsRouter } from './routers/reviews';
import { contractsRouter } from './routers/contracts';
import { portalRouter } from './routers/portal';
import { automationsRouter } from "./routers/automations";
import { integrationsRouter } from "./routers/integrations";
import { apolloRouter } from "./routers/apollo";
import { linkedinRouter } from "./routers/linkedin";
import { funnelRouter } from "./routers/funnel";
import { pushRouter } from "./routers/push";
import { prospectingRouter } from "./routers/prospecting";
import {
  createBriefing, createClient, createDeal, createLead, createNotification, createStrategy, createTask,
  createVaultItem, deleteAllUserData, deleteClient, deleteDeal, deleteLead, deleteTask,
  deleteVaultItem, getActivities, getAnalyticsData, getClients,
  getDashboardMetrics, getLatestBriefing, getLeads, getPipelineDeals,
  getStrategies, getTasks, getUserNotifications, getUserProfile, getVaultItems,
  getUnreadNotificationCount, logActivity, markAllNotificationsRead, markNotificationRead,
  updateClient, updateDeal, updateLead, updateStrategy, updateTask,
  updateVaultItem, upsertUserProfile, updateSpectrePrefs, getDb,
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
    me: publicProcedure.query((opts) => {
      const u = opts.ctx.user;
      if (!u) return null;
      // Strip payment-sensitive fields before sending to client
      const { paypalSubscriptionId: _ps, ...safe } = u;
      return safe;
    }),
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
    updateSpectrePrefs: protectedProcedure
      .input(z.object({
        spectreHidden: z.boolean().optional(),
        spectreChatbotEnabled: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        await updateSpectrePrefs(ctx.user.id, input);
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
        createNotification({
          userId: ctx.user.id,
          type: 'new_client',
          title: `New client added: ${input.name}`,
          body: input.company ? `Company: ${input.company}` : undefined,
          metadata: { clientName: input.name, company: input.company },
        }).catch(() => {});
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
        
        // Get the deal before update to check for stage change
        const deals = await getPipelineDeals(ctx.user.id);
        const existingDeal = deals.find(d => d.id === id);
        const oldStage = existingDeal?.stage;
        const clientId = existingDeal?.clientId;
        
        await updateDeal(id, ctx.user.id, data);
        
        if (data.stage) {
          await logActivity({ userId: ctx.user.id, activityType: "deal_stage_changed", summary: `Deal moved to ${data.stage}` });
          const dealTitle = data.title ?? existingDeal?.title ?? `Deal #${id}`;
          createNotification({
            userId: ctx.user.id,
            type: 'deal_moved',
            title: `Deal moved to ${data.stage}`,
            body: dealTitle !== `Deal #${id}` ? dealTitle : undefined,
            metadata: { dealId: id, stage: data.stage, title: dealTitle },
          }).catch(() => {});
          
          // Trigger email sequence enrollment on stage change
          if (clientId && oldStage && oldStage !== data.stage) {
            const { handlePipelineStageChange } = await import('./routers/emailSequences');
            handlePipelineStageChange(ctx.user.id, clientId, oldStage, data.stage)
              .then((result: { enrolled: number[] }) => {
                if (result.enrolled.length > 0) {
                  console.log(`[Pipeline] Auto-enrolled client ${clientId} in ${result.enrolled.length} email sequences`);
                }
              })
              .catch((err: Error) => {
                console.error('[Pipeline] Failed to auto-enroll in email sequences:', err);
              });
          }
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
    overview: analyticsRouter.overview,
    revenueTrend: analyticsRouter.revenueTrend,
    bookingTrend: analyticsRouter.bookingTrend,
    funnelConversions: analyticsRouter.funnelConversions,
    crmPipeline: analyticsRouter.crmPipeline,
    outreachActivity: analyticsRouter.outreachActivity,
    healthDistribution: analyticsRouter.healthDistribution,
    recentActivity: analyticsRouter.recentActivity,
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
      const recentActivity = activities.slice(0, 5).map((a) => a.summary ?? '').filter(Boolean).join('; ') || 'No recent activity logged';
      const prompt = `You are Specter — the intelligence engine for ${ctx.user.name ?? 'this operator'}. They just logged in and need a fast read on where things stand.

Business snapshot:
- Active leads: ${leads.length}
- Pipeline: ${activeDeals.length} active deals, ${staleDeals.length} have gone quiet (no activity in 7+ days)
- Recent activity: ${recentActivity}

Write a login briefing in the voice of a trusted adviser who genuinely cares about how this operator is doing. Be honest, be warm, be specific. Don't write like a report — write like someone who knows their business and wants to help them win today.

Return JSON:
{
  situation: "A real, grounded 2-3 sentence read of where things actually stand — what's moving, what's stuck, what's worth paying attention to.",
  priority: "The single most important move they should make today. Concrete and specific — not 'review your pipeline' but 'reach back out to [deal] before it goes cold.'",
  ghostNote: "A quiet, personal observation — something you noticed that they might have overlooked. Written with care, not alarm. Like a colleague pulling them aside after a meeting."
}`;
      const response = await withAiTimeout(
        () => invokeLLM({
          messages: [{ role: 'user', content: prompt }],
          response_format: { type: 'json_schema', json_schema: { name: 'briefing', strict: true, schema: { type: 'object', properties: { situation: { type: 'string' }, priority: { type: 'string' }, ghostNote: { type: 'string' } }, required: ['situation', 'priority', 'ghostNote'], additionalProperties: false } } },
        }),
        'Briefing'
      );
      let parsed: { situation: string; priority: string; ghostNote: string };
      try {
        parsed = JSON.parse(response.choices[0].message.content as string) as { situation: string; priority: string; ghostNote: string };
      } catch {
        throw new TRPCError({ code: 'INTERNAL_SERVER_ERROR', message: 'Briefing generation failed — AI returned an unexpected format. Please try again.' });
      }
      await createBriefing({ userId: ctx.user.id, briefingType: 'login', content: JSON.stringify(parsed), payload: parsed });
      createNotification({
        userId: ctx.user.id,
        type: 'briefing_ready',
        title: 'Your briefing is ready',
        body: parsed.priority,
        metadata: { situation: parsed.situation },
      }).catch(() => {});
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
          `Specter: ${ctx.user.name ?? 'Unknown'}`,
          `Active leads: ${leads.length} (${leads.filter(l => l.intentScore !== null && l.intentScore >= 80).length} high-intent)`,
          `Lead statuses: ${leads.map(l => l.status).filter((v, i, a) => a.indexOf(v) === i).join(', ')}`,
          `Pipeline: ${activeDeals.length} active deals, ${staleDeals.length} stale (>7d no activity)`,
          `Pipeline value: $${activeDeals.reduce((s, d) => s + (d.value ?? 0), 0).toLocaleString()}`,
          vaultItems.length > 0
            ? `Vault (${vaultItems.length} entries):\n${vaultItems.map(v => `  [${v.type}] ${v.title}${(v.content ?? v.textContent) ? ': ' + (v.content ?? v.textContent)!.slice(0, 600) : ''}`).join('\n')}`
            : 'Vault: empty',
          activeDeals.length > 0 ? `Top deals: ${activeDeals.slice(0, 3).map(d => `${d.title} (${d.stage}, $${(d.value ?? 0).toLocaleString()})`).join('; ')}` : '',
        ].filter(Boolean).join('\n');

        const systemPrompt = `You are Specter — the intelligence engine inside Operator House, built to help ${ctx.user.name ?? 'this operator'} find the right clients, say the right things, and close real work.

You know this operator's business: their leads, pipeline, and what they've built in the Vault. Use that context to give advice that actually fits — not generic tips, but moves that make sense for where they are right now.

When asked to draft an outreach message, first contact email, or any communication to a potential client — write it like a real human who did their homework. People can feel automation from a mile away. The goal is for the prospect to feel like they were specifically thought of, not like they landed in a drip sequence. Write warm, write curious, write with confidence — not salesy, not stiff, not fake urgent. No buzzwords. No filler.

Be direct. Be honest. Be genuinely useful.

Respond in markdown.

## Live Context
${contextBlock}`;

        // Limit history to last 20 messages to prevent unbounded context growth
        const trimmedHistory = input.history.slice(-20);
        const messages = [
          { role: 'system' as const, content: systemPrompt },
          ...trimmedHistory.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
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
    // publicProcedure so unauthenticated visitors never trigger the global
    // redirectToLoginIfUnauthorized handler in main.tsx while the onboarding
    // is still playing. Returns null / no-ops silently when there is no session.
    topLead: publicProcedure.query(async ({ ctx }) => {
      if (!ctx.user) return null;
      const allLeads = await getLeads(ctx.user.id);
      if (!allLeads.length) return null;
      const top = allLeads
        .filter(l => l.intentScore !== null)
        .sort((a, b) => (b.intentScore ?? 0) - (a.intentScore ?? 0))[0]
        ?? allLeads[0];
      // Try to get client name for the lead
      let clientName: string | null = null;
      if (top.clientId) {
        const allClients = await getClients(ctx.user.id);
        const c = allClients.find(c => c.id === top.clientId);
        clientName = c?.company ?? c?.name ?? null;
      }
      return {
        id: top.id,
        sourceValue: top.sourceValue ?? null,
        intentScore: top.intentScore ?? null,
        status: top.status,
        clientName,
      };
    }),
    complete: publicProcedure.mutation(async ({ ctx }) => {
      // No-op for unauthenticated visitors — the onboarding still completes
      // visually; DB writes and notifications only happen for real users.
      if (!ctx.user) return { success: true };
      // Mark needsIntro = false so the onboarding never shows again for this user
      const _db = await getDb();
      if (_db) {
        const { users: _users } = await import('../drizzle/schema');
        const { eq: _eq } = await import('drizzle-orm');
        await _db.update(_users).set({ needsIntro: false }).where(_eq(_users.id, ctx.user.id));
      }
      await logActivity({
        userId: ctx.user.id,
        activityType: 'onboarding_completed',
        summary: 'Specter completed onboarding walkthrough',
      });
      // Fire-and-forget owner notification
      notifyOwner({
        title: 'New Specter Activated',
        content: `${ctx.user.name ?? 'An operator'} (${ctx.user.email ?? 'unknown'}) completed onboarding and entered the House.`,
      }).catch(() => {});
      return { success: true };
    }),
    seedSampleData: protectedProcedure.mutation(async ({ ctx }) => {
      const uid = ctx.user.id;
      // Only seed if the account is truly empty
      const [existingLeads, existingDeals, existingVault] = await Promise.all([
        getLeads(uid), getPipelineDeals(uid), getVaultItems(uid),
      ]);
      if (existingLeads.length || existingDeals.length || existingVault.length) {
        return { seeded: false, reason: 'Account already has data' };
      }
      // Vault: 5 starter items
      await Promise.all([
        createVaultItem({ userId: uid, type: 'template', title: 'First Contact Email — Businesses Without a Website', textContent: `Use this template when reaching out to a local business that doesn't have a website. Personalize every bracket before sending.

Subject: Quick thought about [Business Name]

Hi [First Name],

I came across [Business Name] while looking into [type of business] in [City], and I wanted to reach out.

I noticed you don't have a website yet — or the one you have might not be doing much for you. I build websites for small businesses, and I've seen how much of a difference it makes when someone can actually find you online and know what to expect before they walk through the door.

I'm not going to pitch you anything in this message. I just thought it was worth a conversation.

If you're open to a quick 15-minute call this week, I'd love to hear where you're at and whether there's something I can actually help with.

Either way, keep doing what you're doing — [something specific you noticed about the business].

[Your Name]

Tips: The last line before your name should be something real and specific to them. Keep the subject line simple — plain subject lines feel like a person, not marketing. Don't send more than 3 follow-ups.` }),
        createVaultItem({ userId: uid, type: 'template', title: 'Proposal Email — After First Conversation', textContent: `Use this after you've had an initial call and you're putting a proposal in front of someone.

Subject: Here's what I'm thinking — [Client Name]

Hi [First Name],

Really appreciated the time last [day]. I've been thinking about what you shared, and I want to put something concrete in front of you.

Here's how I'd structure our work together:

What we're solving: [2-3 sentences describing the specific problem in their own language]

What that looks like:
- [Deliverable 1 — specific, not generic]
- [Deliverable 2]
- [Deliverable 3]

Timeline: [X weeks / months]
Investment: $[X] total / $[X] per month

I want this to feel right before we get into paperwork. If something needs adjusting — the scope, the framing, the timeline — just say the word.

If it does feel right, I can have the agreement over to you within 24 hours.

[Your Name]` }),
        createVaultItem({ userId: uid, type: 'framework', title: 'The 3-Layer Discovery Framework', textContent: `Use this framework on every first call. It keeps you from jumping to solutions before you understand what someone actually needs.

LAYER 1 — What They Say They Need (the surface)
Ask: "What's going on that brought you here?" or "What are you trying to solve?"
Listen for: The symptom. The thing that's bothering them enough to reach out.

LAYER 2 — What Their Business Actually Needs (the structure)
Ask: "How does that affect things day-to-day?" or "What happens if this doesn't get fixed?"
Listen for: The operational gap. The workflow that's breaking.

LAYER 3 — What They're Building Toward (the legacy)
Ask: "Where do you want to be in a few years?" or "What does success actually look like for you?"
Listen for: The bigger vision. What they're trying to create, not just fix.

HOW TO USE IT: The gap between Layer 1 and Layer 3 is your engagement scope. When you respond to all three layers, your proposal feels like it was built specifically for them — because it was.` }),
        createVaultItem({ userId: uid, type: 'case_study', title: 'Case Study: The 40-Day Deal Cycle', textContent: `Client: Mid-market B2B SaaS (~$2M ARR). Challenge: Deals dying at the Proposal stage — average 74-day close cycle.

THE SITUATION: They had a solid product and qualified buyers. Prospects were getting to "send me the proposal" — and then disappearing. The easy diagnosis would've been pricing. It wasn't pricing.

WHAT WE FOUND: Their proposals were landing in front of the right person — but that person had to sell the decision internally. And nobody was helping them do that.

WHAT WE BUILT: A "champion enablement kit" for every proposal — a one-page document designed to be shared internally. It explained the problem in plain language, made the ROI concrete, and answered the questions a budget holder would ask. We also started mapping decision-making structure before sending anything.

THE RESULT: Average deal cycle dropped from 74 days to 44 days in one quarter. Close rate improved.

THE LESSON: Sometimes you're not losing deals because of your offer. You're losing them because your champion can't get internal buy-in. Give them the words, and you win.` }),
        createVaultItem({ userId: uid, type: 'note', title: 'My Positioning Statement (Fill This In)', textContent: `Before you reach out to anyone, you need to be able to answer: "Who do you help, and what changes for them when you do?"

THE FORMULA: I help [specific type of person or business] who [are dealing with a specific situation] get to [the outcome they actually want] — without [the thing they're afraid of or tired of trying].

YOUR DRAFT: I help _______ who _______ get to _______ — without _______.

EXAMPLES:
"I help small service businesses that rely on word of mouth finally get consistent leads from their website — without paying for ads they can't track."
"I help established consultants who are always busy but never earning what they're worth raise their rates — without losing the clients they already have."

HOW TO TEST IT: Put your draft in front of someone who fits your description and ask: "Does this sound like you?" The right positioning statement will sound exactly right to the people you want to work with.` }),
      ]);
      // Leads: 3 seeded audits
      await Promise.all([
        createLead({ userId: uid, sourceType: 'manual', rawInput: 'Marcus Chen - CEO, TechFlow Solutions', status: 'analysis', intentScore: 8.5, analysisJson: { name: 'Marcus Chen', company: 'TechFlow Solutions', intentScore: 8.5, vibeCheck: 'High-energy founder, recently raised Series A. Actively looking to scale GTM without adding headcount.', painPoints: 'No repeatable sales process. Founder-led sales hitting a ceiling at $1.8M ARR.', engineeringMap: 'Build a fractional GTM system: ICP definition, outbound sequence, pipeline cadence, and weekly deal reviews.', legacyPlay: 'Position TechFlow as the category leader in workflow automation for mid-market ops teams.', nextBeat: 'Send a 3-slide diagnostic deck showing the gap between current ARR velocity and Series B readiness.', sourcesUsed: ['The 3-Layer Discovery Framework'], missingContext: null } }),
        createLead({ userId: uid, sourceType: 'linkedin', rawInput: 'Sarah Okafor - Founder, Meridian Brand Studio', status: 'review', intentScore: 6.2, analysisJson: { name: 'Sarah Okafor', company: 'Meridian Brand Studio', intentScore: 6.2, vibeCheck: 'Thoughtful creative operator. Growing steadily but feeling the ceiling of her current client roster.', painPoints: 'Project-based revenue is unpredictable. No retainer structure. Undercharging for strategic work.', engineeringMap: 'Introduce a productized retainer offer. Reposition from execution to brand strategy.', legacyPlay: 'Become the go-to brand strategist for purpose-driven consumer brands in the $5M-$50M range.', nextBeat: 'Book a 30-min positioning audit call. Come with three examples of her best work.', sourcesUsed: ['My Positioning Statement (Edit This)'], missingContext: 'Current average project value and client count' } }),
        createLead({ userId: uid, sourceType: 'email', rawInput: 'David Park - COO, Nexus Logistics', status: 'ready', intentScore: 9.1, analysisJson: { name: 'David Park', company: 'Nexus Logistics', intentScore: 9.1, vibeCheck: 'Operational thinker under pressure. Company is growing fast but processes are breaking. High urgency.', painPoints: 'Manual ops processes causing errors at scale. Team is reactive, not systematic.', engineeringMap: 'Ops audit -> SOPs -> automation layer. 90-day engagement to systematize the top 5 bottlenecks.', legacyPlay: 'Build Nexus into a logistics operator that can scale to 10x without proportional headcount growth.', nextBeat: 'Send proposal within 48 hours. He is talking to two other consultants.', sourcesUsed: ['The 3-Layer Discovery Framework', 'Case Study: 40% Pipeline Velocity Increase'], missingContext: null } }),
      ]);
      // Pipeline: one deal per stage
      await Promise.all([
        createDeal({ userId: uid, title: 'Marcus Chen - TechFlow GTM System', stage: 'Discovery', value: 8500, intentScore: 8.5, notes: 'From Lead Intel. Next Beat: Send diagnostic deck.' }),
        createDeal({ userId: uid, title: 'Sarah Okafor - Brand Strategy Retainer', stage: 'Analysis', value: 4200, intentScore: 6.2, notes: 'Positioning audit call scheduled.' }),
        createDeal({ userId: uid, title: 'Nexus Logistics - Ops Systematization', stage: 'Strategy', value: 18000, intentScore: 9.1, notes: 'High urgency. Competing with 2 others. Send proposal ASAP.' }),
        createDeal({ userId: uid, title: 'Pinnacle Ventures - Fractional CMO', stage: 'Proposal', value: 12000, notes: 'Proposal sent. Following up Friday.' }),
        createDeal({ userId: uid, title: 'Clearwater Health - Q1 Engagement', stage: 'Closed', value: 22000, notes: 'Closed. Kick-off scheduled.' }),
      ]);
      // Strategy: one example
      await createStrategy({ userId: uid, outputType: 'full', status: 'complete', promptVersion: 'v1', inputContext: { clientName: 'TechFlow Solutions', goal: 'Build repeatable GTM motion', context: 'Series A SaaS, $1.8M ARR, founder-led sales' }, content: '# GTM Strategy: TechFlow Solutions\n\n## Situation\nTechFlow is at the classic Series A inflection point: product-market fit confirmed, but growth is founder-dependent.\n\n## Strategic Objective\nBuild a GTM system that generates and closes $500K in new ARR over the next 6 months without Marcus being in every deal.\n\n## The Play\n**Phase 1 (Weeks 1-3): ICP Sharpening** - Narrow the target to Series A SaaS companies with 20-80 employees in workflow automation.\n\n**Phase 2 (Weeks 4-8): Outbound Engine** - Build a 3-touch outbound sequence targeting VP Ops and COO personas. 50 outbound touches per week.\n\n**Phase 3 (Weeks 9-12): Pipeline Cadence** - Weekly deal review with Marcus. Every deal gets a next action and a close date.\n\n## Expected Outcome\n$500K new ARR in 6 months. Marcus spending < 30% of his time on sales by month 3.', citations: ['The 3-Layer Discovery Framework', 'Case Study: 40% Pipeline Velocity Increase'] });
      await logActivity({ userId: uid, activityType: 'sample_data_loaded', summary: 'Sample Specter data loaded - explore the House' });
      return { seeded: true };
    }),
  }),

  paypal: router({
    /** Returns PayPal plan IDs and client ID for the frontend subscription buttons */
    plans: publicProcedure.query(() => ({
      clientId: ENV.paypalClientId,
      plans: {
        operator: {
          planId: ENV.paypalPlanOperator,
          label: 'Operator',
          founding: '$399/yr',
          retail: '$797/yr',
          description: 'Core Intelligence Suite — Command, Pipeline, Vault, Strategy, Analytics',
        },
        operator_pro: {
          planId: ENV.paypalPlanOperatorPro,
          label: 'Operator Pro',
          founding: '$99/mo',
          retail: '$197/mo',
          description: 'Full Outreach Suite — SMS, Email Sequences, Call Center, Voice Agents, Pulse',
        },
      },
    })),
    /** Called after PayPal subscription is approved — activates founding member status */
    captureSubscription: protectedProcedure
      .input(z.object({
        subscriptionId: z.string(),
        tier: z.enum(['operator', 'operator_pro']),
      }))
      .mutation(async ({ ctx, input }) => {
        const { activateFoundingMember } = await import('./paypal');
        const { betaStartDate, betaEndDate } = await activateFoundingMember(
          ctx.user.id,
          input.subscriptionId,
          input.tier
        );
        await logActivity({ userId: ctx.user.id, activityType: 'founding_member_activated', summary: `Founding member activated — ${input.tier} tier` });
        notifyOwner({
          title: `New Founding Member: ${ctx.user.name ?? ctx.user.email}`,
          content: `Tier: ${input.tier}\nBeta ends: ${betaEndDate.toDateString()}\nSubscription: ${input.subscriptionId}`,
        }).catch(() => {});
        return { success: true, betaStartDate, betaEndDate };
      }),
    /** Cancel subscription */
    cancelSubscription: protectedProcedure
      .mutation(async ({ ctx }) => {
        const user = ctx.user as { paypalSubscriptionId?: string };
        if (!user.paypalSubscriptionId) throw new TRPCError({ code: 'BAD_REQUEST', message: 'No subscription found' });
        const { cancelSubscription } = await import('./paypal');
        await cancelSubscription(user.paypalSubscriptionId, 'Cancelled during trial by user');
        const { getDb: _getDb } = await import('./db');
        const { users } = await import('../drizzle/schema');
        const { eq } = await import('drizzle-orm');
        const _db = await _getDb();
        if (_db) await _db.update(users).set({ billingStatus: 'cancelled' }).where(eq(users.id, ctx.user.id));
        return { success: true };
      }),
    /** Get billing status for Settings → Subscription page */
    billingStatus: protectedProcedure.query(async ({ ctx }) => {
      const u = ctx.user as {
        billingStatus?: string;
        foundingTier?: string;
        betaStartDate?: Date;
        betaEndDate?: Date;
        paypalSubscriptionId?: string;
        isFounding?: boolean;
      };
      const betaEndDate = u.betaEndDate ? new Date(u.betaEndDate) : null;
      const today = new Date();
      const daysRemaining = betaEndDate
        ? Math.max(0, Math.ceil((betaEndDate.getTime() - today.getTime()) / (1000 * 60 * 60 * 24)))
        : null;
      return {
        billingStatus: u.billingStatus ?? 'inactive',
        foundingTier: u.foundingTier ?? null,
        betaStartDate: u.betaStartDate ?? null,
        betaEndDate,
        daysRemaining,
        hasSubscription: !!u.paypalSubscriptionId,
        isFounding: u.isFounding ?? false,
      };
    }),
    /** Mark intro as seen — clears needsIntro flag */
    markIntroSeen: protectedProcedure.mutation(async ({ ctx }) => {
      const _db = await getDb();
      if (_db) {
        const { users: _users } = await import('../drizzle/schema');
        const { eq: _eq } = await import('drizzle-orm');
        await _db.update(_users).set({ needsIntro: false }).where(_eq(_users.id, ctx.user.id));
      }
      return { success: true };
    }),
    /** Reset intro — for Settings → Replay Intro */
    resetIntro: protectedProcedure.mutation(async ({ ctx }) => {
      const _db = await getDb();
      if (_db) {
        const { users: _users } = await import('../drizzle/schema');
        const { eq: _eq } = await import('drizzle-orm');
        await _db.update(_users).set({ needsIntro: true }).where(_eq(_users.id, ctx.user.id));
      }
      return { success: true };
    }),
  }),

  notifications: router({
    list: protectedProcedure
      .input(z.object({ limit: z.number().optional() }))
      .query(async ({ ctx, input }) => getUserNotifications(ctx.user.id, input.limit ?? 30)),
    unreadCount: protectedProcedure.query(async ({ ctx }) =>
      getUnreadNotificationCount(ctx.user.id)
    ),
    markRead: protectedProcedure
      .input(z.object({ id: z.number() }))
      .mutation(async ({ ctx, input }) => {
        await markNotificationRead(input.id, ctx.user.id);
        return { success: true };
      }),
    markAllRead: protectedProcedure.mutation(async ({ ctx }) => {
      await markAllNotificationsRead(ctx.user.id);
      return { success: true };
    }),
  }),

  notificationPreferences: router({
    get: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { newClient: true, dealMoved: true, payment: true, briefingReady: true };
      const { userNotificationPreferences } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const rows = await db.select().from(userNotificationPreferences)
        .where(eq(userNotificationPreferences.userId, ctx.user.id)).limit(1);
      if (!rows[0]) return { newClient: true, dealMoved: true, payment: true, briefingReady: true };
      const r = rows[0];
      return {
        newClient: r.newClient === 1,
        dealMoved: r.dealMoved === 1,
        payment: r.payment === 1,
        briefingReady: r.briefingReady === 1,
      };
    }),
    update: protectedProcedure
      .input(z.object({
        newClient: z.boolean().optional(),
        dealMoved: z.boolean().optional(),
        payment: z.boolean().optional(),
        briefingReady: z.boolean().optional(),
      }))
      .mutation(async ({ ctx, input }) => {
        const db = await getDb();
        if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
        const { userNotificationPreferences } = await import("../drizzle/schema");
        const { eq } = await import("drizzle-orm");
        const patch = {
          ...(input.newClient !== undefined ? { newClient: input.newClient ? 1 : 0 } : {}),
          ...(input.dealMoved !== undefined ? { dealMoved: input.dealMoved ? 1 : 0 } : {}),
          ...(input.payment !== undefined ? { payment: input.payment ? 1 : 0 } : {}),
          ...(input.briefingReady !== undefined ? { briefingReady: input.briefingReady ? 1 : 0 } : {}),
        };
        const existing = await db.select().from(userNotificationPreferences)
          .where(eq(userNotificationPreferences.userId, ctx.user.id)).limit(1);
        if (existing.length > 0) {
          await db.update(userNotificationPreferences).set(patch)
            .where(eq(userNotificationPreferences.userId, ctx.user.id));
        } else {
          await db.insert(userNotificationPreferences).values({
            userId: ctx.user.id,
            newClient: input.newClient !== false ? 1 : 0,
            dealMoved: input.dealMoved !== false ? 1 : 0,
            payment: input.payment !== false ? 1 : 0,
            briefingReady: input.briefingReady !== false ? 1 : 0,
          });
        }
        return { success: true };
      }),
  }),
  pulse: pulseRouter,
  emailSequences: emailSequencesRouter,
  callCenter: callCenterRouter,

  subscription: router({
    getMyTier: protectedProcedure.query(async ({ ctx }) => {
      const db = await getDb();
      if (!db) return { tier: "operator" as const, isFounding: false, hasFullAccess: false };
      const { userSubscriptions, users } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const [subRow] = await db.select().from(userSubscriptions)
        .where(eq(userSubscriptions.userId, ctx.user.id))
        .limit(1);
      // isFounding is a permanent per-user attribute — NEVER derived from tier.
      // Founding members (Cohort 1-4) keep full-platform access at their lifetime-locked
      // rate regardless of any future subscription tier changes.
      const [userRow] = await db.select({ isFounding: users.isFounding })
        .from(users)
        .where(eq(users.id, ctx.user.id))
        .limit(1);
      const isFounding = userRow?.isFounding ?? false;
      const tier = (subRow?.tier ?? "operator") as "operator" | "operator_pro";
      return { tier, isFounding, hasFullAccess: isFounding || tier === "operator_pro" };
    }),
    upgradeToPro: protectedProcedure.mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { userSubscriptions } = await import("../drizzle/schema");
      const { eq } = await import("drizzle-orm");
      const existing = await db.select().from(userSubscriptions)
        .where(eq(userSubscriptions.userId, ctx.user.id)).limit(1);
      if (existing.length > 0) {
        await db.update(userSubscriptions)
          .set({ tier: "operator_pro", updatedAt: new Date() })
          .where(eq(userSubscriptions.userId, ctx.user.id));
      } else {
        await db.insert(userSubscriptions).values({ userId: ctx.user.id, tier: "operator_pro" });
      }
      return { success: true };
    }),
  }),
  capabilities: router({
    check: publicProcedure.query(() => ({
      twilio: !!(ENV.twilioAccountSid && ENV.twilioAuthToken && ENV.twilioPhoneNumber),
      vapi: !!ENV.vapiApiKey,
      emailDispatch: !!ENV.resendApiKey,
      stripe: !!(ENV.stripeSecretKey && ENV.stripeMonthlyPriceId && ENV.stripeAnnualPriceId),
      socialLinkedIn: !!(ENV.linkedinClientId && ENV.linkedinClientSecret),
      socialTwitter: !!(ENV.twitterApiKey && ENV.twitterApiSecret),
    })),
  }),
  sms: smsRouter,
  voiceAgents: voiceAgentsRouter,
  crm: crmRouter,
  invoicing: invoicingRouter,
  booking: bookingRouter,
  funnels: funnelsRouter,
  social: socialRouter,
  automations: automationsRouter,
  portal: portalRouter,
  contracts: contractsRouter,
  reviews: reviewsRouter,
  team: teamRouter,
  integrations: integrationsRouter,
  funnel: funnelRouter,
  push: pushRouter,
  prospecting: prospectingRouter,
  apollo: apolloRouter,
  linkedin: linkedinRouter,
});

export type AppRouter = typeof appRouter;
