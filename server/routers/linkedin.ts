/**
 * LinkedIn Outreach Router
 * Manages campaigns, sequence steps, connection tracking, and message logs.
 * LinkedIn does NOT provide an official outreach API — this module is a
 * manual-assist tracker: you compose messages here, copy them, and paste
 * them into LinkedIn. Status updates are logged manually.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  linkedinCampaigns,
  linkedinSequenceSteps,
  linkedinConnections,
  linkedinMessageLog,
} from "../../drizzle/schema";
import { eq, and, desc, asc, lte, inArray } from "drizzle-orm";
import { TRPCError } from "@trpc/server";

// ─── Pre-built Soul Engineer LinkedIn Templates ───────────────────────────────
export const LINKEDIN_TEMPLATES = [
  {
    name: "AI Automation — Cold Outreach",
    description: "Connection request + 3-step follow-up for AI automation prospects.",
    targetAudience: "Founders, CEOs, COOs at 10-200 person companies. Any industry where repetitive ops work is a bottleneck.",
    steps: [
      {
        stepOrder: 1,
        stepType: "connection_request" as const,
        delayDays: 0,
        messageTemplate: `Hi {{firstName}}, I help leaders at companies like {{company}} reclaim 10+ hours/week by building AI systems that handle the work nobody should be doing manually. Would love to connect.`,
      },
      {
        stepOrder: 2,
        stepType: "message" as const,
        delayDays: 2,
        messageTemplate: `Hey {{firstName}}, thanks for connecting.

I noticed {{company}} is doing interesting work. Quick question — where does your team lose the most time each week? Reporting, onboarding, follow-ups, data entry?

I ask because I've been helping operators like you automate exactly those bottlenecks. Not templates or chatbots — actual systems that run in the background.

Worth a 15-min call to see if there's a fit?`,
      },
      {
        stepOrder: 3,
        stepType: "message" as const,
        delayDays: 5,
        messageTemplate: `{{firstName}}, just following up on my last message.

I know your inbox is full. I'll keep this short: I recently helped a client automate their entire client onboarding process. What took 12 hours/week now runs automatically.

If that sounds relevant to {{company}}, I'd love to show you how it works. If not, no worries — I won't follow up again.

Either way, I appreciate the connection.`,
      },
    ],
  },
  {
    name: "Strategy Consulting — Warm Intro",
    description: "For prospects who already know your work or were referred.",
    targetAudience: "Warm leads, referrals, people who engaged with your content.",
    steps: [
      {
        stepOrder: 1,
        stepType: "connection_request" as const,
        delayDays: 0,
        messageTemplate: `Hi {{firstName}}, {{referralContext}} — thought it made sense to connect directly. I work with leaders on AI strategy and operations. Looking forward to being in your network.`,
      },
      {
        stepOrder: 2,
        stepType: "message" as const,
        delayDays: 3,
        messageTemplate: `Hey {{firstName}}, glad to be connected.

I've been following what {{company}} is building — the work you're doing in {{industry}} is exactly the kind of thing I love working with.

I specialize in helping operators like you build AI systems that scale the high-value work without adding headcount. If you're ever thinking about that, I'd love to have a conversation.

No pitch — just a genuine conversation about where AI could move the needle for you.`,
      },
    ],
  },
  {
    name: "Post-Content Engagement",
    description: "For people who liked/commented on your LinkedIn posts.",
    targetAudience: "People who engaged with your content — they already know you exist.",
    steps: [
      {
        stepOrder: 1,
        stepType: "connection_request" as const,
        delayDays: 0,
        messageTemplate: `Hi {{firstName}}, saw you engaged with my post on {{postTopic}} — appreciate it. Would love to connect and stay in touch.`,
      },
      {
        stepOrder: 2,
        stepType: "message" as const,
        delayDays: 1,
        messageTemplate: `Hey {{firstName}}, thanks for connecting.

Your comment on {{postTopic}} caught my attention — it sounds like you're thinking about this the right way.

I work with leaders who are serious about using AI to reclaim time and scale operations. If that's something you're actively exploring, I'd love to hear more about what {{company}} is working on.

Open to a quick chat?`,
      },
    ],
  },
];

// ─── Campaigns ────────────────────────────────────────────────────────────────
const campaignsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const campaigns = await db
      .select()
      .from(linkedinCampaigns)
      .where(eq(linkedinCampaigns.userId, ctx.user.id))
      .orderBy(desc(linkedinCampaigns.createdAt));
    // Attach step count for each campaign
    const withSteps = await Promise.all(
      campaigns.map(async (c) => {
        const steps = await db
          .select()
          .from(linkedinSequenceSteps)
          .where(eq(linkedinSequenceSteps.campaignId, c.id))
          .orderBy(asc(linkedinSequenceSteps.stepOrder));
        const connections = await db
          .select()
          .from(linkedinConnections)
          .where(and(
            eq(linkedinConnections.campaignId, c.id),
            eq(linkedinConnections.userId, ctx.user.id),
          ));
        return { ...c, steps, connectionCount: connections.length };
      })
    );
    return withSteps;
  }),

  get: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [campaign] = await db
        .select()
        .from(linkedinCampaigns)
        .where(and(
          eq(linkedinCampaigns.id, input.id),
          eq(linkedinCampaigns.userId, ctx.user.id),
        ));
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      const steps = await db
        .select()
        .from(linkedinSequenceSteps)
        .where(eq(linkedinSequenceSteps.campaignId, campaign.id))
        .orderBy(asc(linkedinSequenceSteps.stepOrder));
      const connections = await db
        .select()
        .from(linkedinConnections)
        .where(and(
          eq(linkedinConnections.campaignId, campaign.id),
          eq(linkedinConnections.userId, ctx.user.id),
        ))
        .orderBy(desc(linkedinConnections.createdAt));
      return { ...campaign, steps, connections };
    }),

  create: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      targetAudience: z.string().optional(),
      dailyLimit: z.number().min(1).max(50).default(15),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(linkedinCampaigns).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        targetAudience: input.targetAudience,
        dailyLimit: input.dailyLimit,
        status: "draft",
      });
      return { id: result.insertId };
    }),

  createFromTemplate: protectedProcedure
    .input(z.object({ templateIndex: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const template = LINKEDIN_TEMPLATES[input.templateIndex];
      if (!template) throw new TRPCError({ code: "BAD_REQUEST", message: "Template not found" });
      const db = (await getDb())!;
      const [result] = await db.insert(linkedinCampaigns).values({
        userId: ctx.user.id,
        name: template.name,
        description: template.description,
        targetAudience: template.targetAudience,
        dailyLimit: 15,
        status: "draft",
      });
      const campaignId = result.insertId;
      for (const step of template.steps) {
        await db.insert(linkedinSequenceSteps).values({
          campaignId,
          stepOrder: step.stepOrder,
          stepType: step.stepType,
          delayDays: step.delayDays,
          messageTemplate: step.messageTemplate,
        });
      }
      return { id: campaignId };
    }),

  update: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      targetAudience: z.string().optional(),
      dailyLimit: z.number().min(1).max(50).optional(),
      status: z.enum(["draft", "active", "paused", "completed"]).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const { id, ...updates } = input;
      await db
        .update(linkedinCampaigns)
        .set(updates)
        .where(and(
          eq(linkedinCampaigns.id, id),
          eq(linkedinCampaigns.userId, ctx.user.id),
        ));
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Delete connections and logs first
      const connections = await db
        .select({ id: linkedinConnections.id })
        .from(linkedinConnections)
        .where(and(
          eq(linkedinConnections.campaignId, input.id),
          eq(linkedinConnections.userId, ctx.user.id),
        ));
      if (connections.length > 0) {
        const connIds = connections.map((c) => c.id);
        await db.delete(linkedinMessageLog).where(inArray(linkedinMessageLog.connectionId, connIds));
        await db.delete(linkedinConnections).where(inArray(linkedinConnections.id, connIds));
      }
      await db.delete(linkedinSequenceSteps).where(eq(linkedinSequenceSteps.campaignId, input.id));
      await db.delete(linkedinCampaigns).where(and(
        eq(linkedinCampaigns.id, input.id),
        eq(linkedinCampaigns.userId, ctx.user.id),
      ));
      return { success: true };
    }),

  getTemplates: protectedProcedure.query(() => {
    return LINKEDIN_TEMPLATES.map((t, i) => ({
      index: i,
      name: t.name,
      description: t.description,
      targetAudience: t.targetAudience,
      stepCount: t.steps.length,
    }));
  }),
});

// ─── Sequence Steps ───────────────────────────────────────────────────────────
const stepsRouter = router({
  upsert: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      steps: z.array(z.object({
        id: z.number().optional(),
        stepOrder: z.number(),
        stepType: z.enum(["connection_request", "message"]),
        delayDays: z.number().min(0),
        messageTemplate: z.string().min(1),
      })),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Verify ownership
      const [campaign] = await db
        .select()
        .from(linkedinCampaigns)
        .where(and(
          eq(linkedinCampaigns.id, input.campaignId),
          eq(linkedinCampaigns.userId, ctx.user.id),
        ));
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      // Delete existing steps and re-insert
      await db.delete(linkedinSequenceSteps).where(eq(linkedinSequenceSteps.campaignId, input.campaignId));
      for (const step of input.steps) {
        await db.insert(linkedinSequenceSteps).values({
          campaignId: input.campaignId,
          stepOrder: step.stepOrder,
          stepType: step.stepType,
          delayDays: step.delayDays,
          messageTemplate: step.messageTemplate,
        });
      }
      return { success: true };
    }),
});

// ─── Connections ──────────────────────────────────────────────────────────────
const connectionsRouter = router({
  add: protectedProcedure
    .input(z.object({
      campaignId: z.number(),
      firstName: z.string().min(1),
      lastName: z.string().optional(),
      title: z.string().optional(),
      company: z.string().optional(),
      linkedinUrl: z.string().url().optional(),
      linkedClientId: z.number().optional(),
      linkedProspectingLeadId: z.number().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [campaign] = await db
        .select()
        .from(linkedinCampaigns)
        .where(and(
          eq(linkedinCampaigns.id, input.campaignId),
          eq(linkedinCampaigns.userId, ctx.user.id),
        ));
      if (!campaign) throw new TRPCError({ code: "NOT_FOUND" });
      const [result] = await db.insert(linkedinConnections).values({
        userId: ctx.user.id,
        campaignId: input.campaignId,
        firstName: input.firstName,
        lastName: input.lastName,
        title: input.title,
        company: input.company,
        linkedinUrl: input.linkedinUrl,
        linkedClientId: input.linkedClientId,
        linkedProspectingLeadId: input.linkedProspectingLeadId,
        notes: input.notes,
        status: "pending",
        currentStep: 0,
      });
      return { id: result.insertId };
    }),

  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["pending","requested","accepted","messaged","replied","converted","withdrawn"]),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const updates: Record<string, unknown> = { status: input.status };
      if (input.notes !== undefined) updates.notes = input.notes;
      // Set timestamps based on status
      const now = new Date();
      if (input.status === "requested") updates.requestSentAt = now;
      if (input.status === "accepted") updates.acceptedAt = now;
      if (input.status === "messaged") updates.lastMessagedAt = now;
      await db
        .update(linkedinConnections)
        .set(updates)
        .where(and(
          eq(linkedinConnections.id, input.id),
          eq(linkedinConnections.userId, ctx.user.id),
        ));
      return { success: true };
    }),

  logMessage: protectedProcedure
    .input(z.object({
      connectionId: z.number(),
      stepOrder: z.number(),
      messageText: z.string().min(1),
      stepId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Verify ownership
      const [conn] = await db
        .select()
        .from(linkedinConnections)
        .where(and(
          eq(linkedinConnections.id, input.connectionId),
          eq(linkedinConnections.userId, ctx.user.id),
        ));
      if (!conn) throw new TRPCError({ code: "NOT_FOUND" });
      await db.insert(linkedinMessageLog).values({
        connectionId: input.connectionId,
        stepId: input.stepId,
        stepOrder: input.stepOrder,
        messageText: input.messageText,
        deliveryStatus: "sent",
      });
      // Update connection step and last messaged
      await db
        .update(linkedinConnections)
        .set({
          currentStep: input.stepOrder,
          lastMessagedAt: new Date(),
          status: input.stepOrder === 1 ? "requested" : "messaged",
        })
        .where(eq(linkedinConnections.id, input.connectionId));
      // Update campaign totalSent if step 1
      if (input.stepOrder === 1) {
        const campaign = await db
          .select()
          .from(linkedinCampaigns)
          .where(eq(linkedinCampaigns.id, conn.campaignId));
        if (campaign[0]) {
          await db
            .update(linkedinCampaigns)
            .set({ totalSent: campaign[0].totalSent + 1 })
            .where(eq(linkedinCampaigns.id, conn.campaignId));
        }
      }
      return { success: true };
    }),

  getMessageLog: protectedProcedure
    .input(z.object({ connectionId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [conn] = await db
        .select()
        .from(linkedinConnections)
        .where(and(
          eq(linkedinConnections.id, input.connectionId),
          eq(linkedinConnections.userId, ctx.user.id),
        ));
      if (!conn) throw new TRPCError({ code: "NOT_FOUND" });
      return db
        .select()
        .from(linkedinMessageLog)
        .where(eq(linkedinMessageLog.connectionId, input.connectionId))
        .orderBy(asc(linkedinMessageLog.sentAt));
    }),

  /** Generate a personalized message from a template for a given connection */
  generateMessage: protectedProcedure
    .input(z.object({
      connectionId: z.number(),
      stepOrder: z.number(),
    }))
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [conn] = await db
        .select()
        .from(linkedinConnections)
        .where(and(
          eq(linkedinConnections.id, input.connectionId),
          eq(linkedinConnections.userId, ctx.user.id),
        ));
      if (!conn) throw new TRPCError({ code: "NOT_FOUND" });
      const [step] = await db
        .select()
        .from(linkedinSequenceSteps)
        .where(and(
          eq(linkedinSequenceSteps.campaignId, conn.campaignId),
          eq(linkedinSequenceSteps.stepOrder, input.stepOrder),
        ));
      if (!step) throw new TRPCError({ code: "NOT_FOUND", message: "Step not found" });
      // Replace personalization tokens
      const personalized = step.messageTemplate
        .replace(/\{\{firstName\}\}/g, conn.firstName)
        .replace(/\{\{lastName\}\}/g, conn.lastName ?? "")
        .replace(/\{\{company\}\}/g, conn.company ?? "your company")
        .replace(/\{\{title\}\}/g, conn.title ?? "")
        .replace(/\{\{fullName\}\}/g, [conn.firstName, conn.lastName].filter(Boolean).join(" "));
      return {
        message: personalized,
        stepType: step.stepType,
        delayDays: step.delayDays,
        characterCount: personalized.length,
        isOverLimit: step.stepType === "connection_request" && personalized.length > 300,
      };
    }),

  /** Get all connections due for follow-up (accepted + next step overdue) */
  getDueFollowUps: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const now = new Date();
    return db
      .select()
      .from(linkedinConnections)
      .where(and(
        eq(linkedinConnections.userId, ctx.user.id),
        lte(linkedinConnections.nextFollowUpAt, now),
      ))
      .orderBy(asc(linkedinConnections.nextFollowUpAt));
  }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.delete(linkedinMessageLog).where(eq(linkedinMessageLog.connectionId, input.id));
      await db.delete(linkedinConnections).where(and(
        eq(linkedinConnections.id, input.id),
        eq(linkedinConnections.userId, ctx.user.id),
      ));
      return { success: true };
    }),
});

// ─── Analytics ────────────────────────────────────────────────────────────────
const analyticsRouter = router({
  summary: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const campaigns = await db
      .select()
      .from(linkedinCampaigns)
      .where(eq(linkedinCampaigns.userId, ctx.user.id));
    const connections = await db
      .select()
      .from(linkedinConnections)
      .where(eq(linkedinConnections.userId, ctx.user.id));
    const totalSent = connections.filter((c) => c.status !== "pending").length;
    const totalAccepted = connections.filter((c) => ["accepted","messaged","replied","converted"].includes(c.status)).length;
    const totalReplied = connections.filter((c) => ["replied","converted"].includes(c.status)).length;
    const totalConverted = connections.filter((c) => c.status === "converted").length;
    return {
      totalCampaigns: campaigns.length,
      activeCampaigns: campaigns.filter((c) => c.status === "active").length,
      totalConnections: connections.length,
      totalSent,
      totalAccepted,
      totalReplied,
      totalConverted,
      acceptanceRate: totalSent > 0 ? Math.round((totalAccepted / totalSent) * 100) : 0,
      replyRate: totalAccepted > 0 ? Math.round((totalReplied / totalAccepted) * 100) : 0,
    };
  }),
});

// ─── Root LinkedIn Router ─────────────────────────────────────────────────────
export const linkedinRouter = router({
  campaigns: campaignsRouter,
  steps: stepsRouter,
  connections: connectionsRouter,
  analytics: analyticsRouter,
});
