/**
 * Email Sequences Router
 * Handles CRUD for sequences, steps, enrollments, and Resend email delivery.
 */
import { z } from "zod";
import { ENV } from "../_core/env";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  emailSequences,
  emailSequenceSteps,
  emailSequenceEnrollments,
  emailSends,
  clients,
  pipelineDeals,
} from "../../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { Resend } from "resend";
import { TRPCError } from "@trpc/server";

const resend = new Resend(ENV.resendApiKey);

// ── Soul Engineer AI Services Email Templates ───────────────────────────────
export const SOUL_ENGINEER_TEMPLATES = [
  {
    name: "AI Services — Initial Outreach",
    description: "First contact for Soul Engineer AI consulting and automation services.",
    triggerType: "manual" as const,
    steps: [
      {
        stepOrder: 1,
        delayDays: 0,
        subjectTemplate: "Your team's time — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

I was looking at what {{companyName}} is building and had a specific thought.

Most leaders I work with aren't short on talent. They're short on *time* — drowning in repetitive work that keeps smart people busy but doesn't move the business forward.

I help high-capacity leaders reclaim 10+ hours a week by building AI systems that handle the work nobody should be doing manually.

Not templates. Not chatbots. Actual systems that run your operations.

Worth a 15-minute conversation about where your team is losing the most time?

— DeWayne Woods
Soul Engineer

P.S. — If this isn't the right time, just reply "later" and I'll check back in a few months. No drip sequences, no automated follow-ups. I write every email myself.`,
        sendTimePreference: "morning" as const,
      },
    ],
  },
  {
    name: "AI Services — 3-Touch Follow-Up",
    description: "Gentle follow-up sequence for AI services prospects who didn't respond.",
    triggerType: "manual" as const,
    steps: [
      {
        stepOrder: 1,
        delayDays: 0,
        subjectTemplate: "Quick thought on {{companyName}}'s workflow",
        bodyTemplate: `Hi {{clientName}},

I came across {{companyName}} and wanted to reach out directly.

I work with leaders who are tired of watching their best people spend half their week on work that could be automated. Not the creative, strategic work — the repetitive operational tasks that drain energy and kill momentum.

Last quarter I helped a client automate their entire client onboarding process. What used to take 12 hours a week now happens in the background while their team focuses on high-value work.

The result: they closed 40% more deals with the same headcount.

Curious if there's something similar hiding in your workflow?

— DeWayne Woods
Soul Engineer`,
        sendTimePreference: "morning" as const,
      },
      {
        stepOrder: 2,
        delayDays: 4,
        subjectTemplate: "The cost of "we'll automate that someday"",
        bodyTemplate: `Hi {{clientName}},

Following up on my note from a few days ago.

I know the feeling: "We should really automate that..." followed by another quarter of doing it manually because there wasn't time to *make* time.

Here's what I've learned after 20 years in operations: the work you keep doing manually isn't just costing you hours. It's costing you clarity. Every repetitive task is a small drain on decision-making energy.

The leaders who win aren't the ones who work harder. They're the ones who build systems that make hard work unnecessary.

If you're curious what that could look like for {{companyName}}, I'm happy to spend 15 minutes showing you a specific workflow we could automate.

— DeWayne Woods
Soul Engineer`,
        sendTimePreference: "morning" as const,
      },
      {
        stepOrder: 3,
        delayDays: 7,
        subjectTemplate: "Leaving the door open — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

This will be my last note for now.

I know timing is everything. If you're heads-down on other priorities, that makes complete sense.

I'll leave the door open. If you ever find yourself thinking "there has to be a better way to handle this," — I'm here.

Best of luck with everything you're building.

— DeWayne Woods
Soul Engineer

P.S. — If you change your mind, just reply to any of these emails. They all come straight to me.`,
        sendTimePreference: "afternoon" as const,
      },
    ],
  },
  {
    name: "AI Services — Value-Add Nurture",
    description: "Provide ongoing value to warm prospects who aren't ready to buy yet.",
    triggerType: "manual" as const,
    steps: [
      {
        stepOrder: 1,
        delayDays: 0,
        subjectTemplate: "A framework that might help — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

You came up in a conversation recently and I thought of you.

I've been refining a framework I call the "3-Layer Operations Audit" — a way to identify which parts of your workflow are actually worth automating (and which ones aren't).

Most people automate the wrong things first. They build elaborate systems for edge cases while the core work still happens manually.

This framework helps you find the 20% of work that's eating 80% of your team's time.

Happy to send it over if you're interested. No pitch attached — just a tool I've found useful.

— DeWayne Woods
Soul Engineer`,
        sendTimePreference: "morning" as const,
      },
      {
        stepOrder: 2,
        delayDays: 14,
        subjectTemplate: "What I learned from automating 100+ workflows",
        bodyTemplate: `Hi {{clientName}},

I promised no drip sequences, so this isn't automated. I actually sat down to write you.

I've been thinking about what separates the leaders who successfully automate from the ones who stay stuck in manual work. After building 100+ AI systems, here's what I've noticed:

The successful ones don't try to automate everything at once. They pick *one* painful workflow and fix it completely. Then they move to the next.

The stuck ones keep planning "the big automation project" that never launches because it's too complex.

Small, complete wins beat big, unfinished projects every time.

If you're ever ready to pick that first workflow, I'm here.

— DeWayne Woods
Soul Engineer`,
        sendTimePreference: "morning" as const,
      },
    ],
  },
  {
    name: "AI Services — Breakup / Last Chance",
    description: "Final outreach to prospects who have gone cold.",
    triggerType: "deal_stale" as const,
    steps: [
      {
        stepOrder: 1,
        delayDays: 0,
        subjectTemplate: "Should I close your file? — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

I haven't heard back from you, so I'm assuming timing or priorities have shifted.

Totally understand — I've been there.

I'm going to close your file for now and stop following up. If things change and you want to revisit automating some of {{companyName}}'s workflows, just reply to this email.

Either way, I hope the work you're doing is meaningful and the team is thriving.

— DeWayne Woods
Soul Engineer`,
        sendTimePreference: "afternoon" as const,
      },
      {
        stepOrder: 2,
        delayDays: 30,
        subjectTemplate: "One question before I go — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

I'm tidying up my pipeline and saw we never connected.

Quick question: what was the main thing holding you back? Was it:

- Timing / priorities shifted
- Budget constraints
- Not convinced AI can actually help your specific situation
- Already working with someone else
- Just not interested

No wrong answers — I'm genuinely curious. It helps me understand what people actually need vs. what I think they need.

Thanks either way.

— DeWayne Woods
Soul Engineer`,
        sendTimePreference: "morning" as const,
      },
    ],
  },
  {
    name: "AI Services — Post-Strategy Proposal",
    description: "Follow-up sequence after delivering a strategy or proposal.",
    triggerType: "manual" as const,
    steps: [
      {
        stepOrder: 1,
        delayDays: 0,
        subjectTemplate: "The strategy we discussed — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

As promised, here's the strategy we mapped out.

[ATTACH OR LINK TO STRATEGY DOCUMENT]

The core insight: {{coreInsight}}

What this could unlock for {{companyName}}:
- {{benefit1}}
- {{benefit2}}
- {{benefit3}}

Timeline: {{timeline}}
Investment: {{investment}}

This isn't a generic proposal. It's built specifically for your situation, your constraints, and your goals.

Questions? Concerns? Something not landing right? Just reply — I'm here.

— DeWayne Woods
Soul Engineer`,
        sendTimePreference: "morning" as const,
      },
      {
        stepOrder: 2,
        delayDays: 3,
        subjectTemplate: "One thing I forgot to mention — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

I was thinking about our conversation and realized I didn't mention something that might matter.

{{forgottenDetail}}

Not a game-changer, but it does shift how I'd think about prioritizing the work.

Worth a quick chat to talk through it?

— DeWayne Woods
Soul Engineer`,
        sendTimePreference: "morning" as const,
      },
      {
        stepOrder: 3,
        delayDays: 7,
        subjectTemplate: "Checking in — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

Just checking in on the strategy I sent over. I know these decisions take time — especially when they involve changing how your team works.

A few questions that often come up at this stage:

- What's the internal conversation like? Do you need me to speak with anyone else on your team?
- Are there specific concerns about timeline or budget I can address?
- Is there a smaller pilot project we could start with to prove the concept?

No pressure — just want to make sure I'm being helpful, not pushy.

— DeWayne Woods
Soul Engineer`,
        sendTimePreference: "afternoon" as const,
      },
      {
        stepOrder: 4,
        delayDays: 14,
        subjectTemplate: "Still evaluating? — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

I know you're probably evaluating options or waiting for the right moment to move forward.

While you're thinking it through, here's something to consider: the cost of waiting isn't just the manual work continuing. It's the compound effect of that work on your team's energy and focus.

Every week of delay is another week your best people spend on tasks that don't require their intelligence.

That said, I never want to rush a decision that needs careful thought. If now isn't the right time, I understand completely.

Just let me know where you're at — even if the answer is "not yet."

— DeWayne Woods
Soul Engineer`,
        sendTimePreference: "morning" as const,
      },
      {
        stepOrder: 5,
        delayDays: 21,
        subjectTemplate: "Final note — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

This will be my last follow-up on the strategy proposal.

If the timing isn't right or the fit isn't there, no hard feelings at all. These decisions are complex and personal.

I'll leave the door open. If anything changes — if a new project emerges, if priorities shift, if you just want to pick my brain — feel free to reach out anytime.

I hope {{companyName}} keeps thriving, and that you find the right solutions for whatever you're facing.

All the best,

— DeWayne Woods
Soul Engineer`,
        sendTimePreference: "afternoon" as const,
      },
    ],
  },
];

// ── Original Pre-built sequence templates (kept for compatibility) ────────────
export const BUILT_IN_TEMPLATES = [
  {
    name: "Cold Outreach — 3-Touch",
    description: "A concise 3-email sequence for reaching out to new prospects.",
    triggerType: "manual" as const,
    steps: [
      {
        stepOrder: 1,
        delayDays: 0,
        subjectTemplate: "Quick question about {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

I came across your work and wanted to reach out directly. I help operators like you close more deals with less friction.

Would a 15-minute call this week make sense?

— {{senderName}}`,
        sendTimePreference: "morning" as const,
      },
      {
        stepOrder: 2,
        delayDays: 3,
        subjectTemplate: "Re: Quick question about {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

Just following up on my last note. I know your time is valuable — I'll keep this brief.

We've helped operators in similar positions increase close rates by 30%+ in 60 days.

Worth a quick chat?

— {{senderName}}`,
        sendTimePreference: "morning" as const,
      },
      {
        stepOrder: 3,
        delayDays: 7,
        subjectTemplate: "Last note — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

I'll leave the door open. If the timing isn't right, no hard feelings.

If anything changes, you know where to find me.

— {{senderName}}`,
        sendTimePreference: "afternoon" as const,
      },
    ],
  },
  {
    name: "Deal Follow-Up — 5-Touch",
    description: "Keep warm prospects engaged after an initial meeting.",
    triggerType: "manual" as const,
    steps: [
      {
        stepOrder: 1,
        delayDays: 0,
        subjectTemplate: "Great connecting, {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

It was great speaking with you. As promised, here's a quick summary of what we discussed and the next steps.

[Insert summary here]

Looking forward to moving this forward.

— {{senderName}}`,
        sendTimePreference: "morning" as const,
      },
      {
        stepOrder: 2,
        delayDays: 2,
        subjectTemplate: "One thing I forgot to mention, {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

I wanted to share one more thing that's relevant to what we discussed — [insert value point].

Does this change anything for you?

— {{senderName}}`,
        sendTimePreference: "morning" as const,
      },
      {
        stepOrder: 3,
        delayDays: 5,
        subjectTemplate: "Checking in — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

Just checking in to see if you had a chance to review what we discussed.

Any questions I can answer?

— {{senderName}}`,
        sendTimePreference: "afternoon" as const,
      },
      {
        stepOrder: 4,
        delayDays: 10,
        subjectTemplate: "Still thinking about it?",
        bodyTemplate: `Hi {{clientName}},

I know decisions like this take time. I'm here whenever you're ready.

In the meantime, here's a quick resource that might help: [insert link].

— {{senderName}}`,
        sendTimePreference: "morning" as const,
      },
      {
        stepOrder: 5,
        delayDays: 21,
        subjectTemplate: "Final check-in — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

This will be my last follow-up for now. If the timing isn't right, I completely understand.

Feel free to reach out whenever the time is right.

— {{senderName}}`,
        sendTimePreference: "afternoon" as const,
      },
    ],
  },
  {
    name: "Re-Engagement — 2-Touch",
    description: "Win back clients who have gone quiet.",
    triggerType: "deal_stale" as const,
    steps: [
      {
        stepOrder: 1,
        delayDays: 0,
        subjectTemplate: "Still on your radar, {{clientName}}?",
        bodyTemplate: `Hi {{clientName}},

It's been a while since we last connected. I wanted to check in and see if anything has changed on your end.

We've made some updates that might be relevant to you — happy to share.

— {{senderName}}`,
        sendTimePreference: "morning" as const,
      },
      {
        stepOrder: 2,
        delayDays: 7,
        subjectTemplate: "One last thought — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

I'll keep this short. If you're still exploring options, I'd love to reconnect.

If not, no worries at all — I wish you the best.

— {{senderName}}`,
        sendTimePreference: "afternoon" as const,
      },
    ],
  },
  {
    name: "Post-Close Onboarding",
    description: "Deliver a smooth onboarding experience after a deal closes.",
    triggerType: "deal_closed" as const,
    steps: [
      {
        stepOrder: 1,
        delayDays: 0,
        subjectTemplate: "Welcome aboard, {{clientName}}!",
        bodyTemplate: `Hi {{clientName}},

Welcome! We're thrilled to have you on board.

Here's what happens next:
1. [Step 1]
2. [Step 2]
3. [Step 3]

Your dedicated point of contact is {{senderName}}. Don't hesitate to reach out.

— {{senderName}}`,
        sendTimePreference: "morning" as const,
      },
      {
        stepOrder: 2,
        delayDays: 3,
        subjectTemplate: "How's everything going, {{clientName}}?",
        bodyTemplate: `Hi {{clientName}},

Just checking in to make sure everything is going smoothly.

Any questions or concerns? I'm here.

— {{senderName}}`,
        sendTimePreference: "morning" as const,
      },
      {
        stepOrder: 3,
        delayDays: 14,
        subjectTemplate: "Two weeks in — {{clientName}}",
        bodyTemplate: `Hi {{clientName}},

It's been two weeks! I'd love to hear how things are going and whether there's anything we can improve.

Would a quick 10-minute call work this week?

— {{senderName}}`,
        sendTimePreference: "afternoon" as const,
      },
    ],
  },
];

// ── Combined templates for UI display ────────────────────────────────────────
const ALL_TEMPLATES = [...SOUL_ENGINEER_TEMPLATES, ...BUILT_IN_TEMPLATES];

// ── Helpers ───────────────────────────────────────────────────────────────────
function interpolate(template: string, vars: Record<string, string>): string {
  return template.replace(/\{\{(\w+)\}\}/g, (_, key) => vars[key] ?? `{{${key}}}`);
}

// ── Router ────────────────────────────────────────────────────────────────────
export const emailSequencesRouter = router({
  // List all sequences for the user
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
    const seqs = await db
      .select()
      .from(emailSequences)
      .where(eq(emailSequences.userId, ctx.user.id))
      .orderBy(desc(emailSequences.createdAt));
    return seqs;
  }),

  // Get a single sequence with its steps
  getWithSteps: protectedProcedure
    .input(z.object({ id: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [seq] = await db
        .select()
        .from(emailSequences)
        .where(and(eq(emailSequences.id, input.id), eq(emailSequences.userId, ctx.user.id)));
      if (!seq) throw new TRPCError({ code: "NOT_FOUND" });
      const steps = await db
        .select()
        .from(emailSequenceSteps)
        .where(eq(emailSequenceSteps.sequenceId, input.id))
        .orderBy(asc(emailSequenceSteps.stepOrder));
      return { ...seq, steps };
    }),

  // Create a new sequence
  create: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).max(255),
        description: z.string().optional(),
        triggerType: z.enum(["manual", "pipeline_stage_change", "deal_closed", "deal_stale", "scheduled"]).default("manual"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const [result] = await db.insert(emailSequences).values({
        userId: ctx.user.id,
        name: input.name,
        description: input.description,
        triggerType: input.triggerType,
        status: "draft",
      });
      return { id: (result as any).insertId as number };
    }),

  // Update sequence metadata
  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        name: z.string().min(1).max(255).optional(),
        description: z.string().optional(),
        status: z.enum(["active", "paused", "draft"]).optional(),
        triggerType: z.enum(["manual", "pipeline_stage_change", "deal_closed", "deal_stale", "scheduled"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...fields } = input;
      await db
        .update(emailSequences)
        .set(fields)
        .where(and(eq(emailSequences.id, id), eq(emailSequences.userId, ctx.user.id)));
      return { ok: true };
    }),

  // Delete a sequence and its steps
  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(emailSequenceSteps).where(eq(emailSequenceSteps.sequenceId, input.id));
      await db
        .delete(emailSequences)
        .where(and(eq(emailSequences.id, input.id), eq(emailSequences.userId, ctx.user.id)));
      return { ok: true };
    }),

  // Add a step to a sequence
  addStep: protectedProcedure
    .input(
      z.object({
        sequenceId: z.number(),
        stepOrder: z.number(),
        delayDays: z.number().min(0).default(0),
        subjectTemplate: z.string().min(1).max(500),
        bodyTemplate: z.string().min(1),
        sendTimePreference: z.enum(["morning", "afternoon", "best_time"]).default("morning"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Verify ownership
      const [seq] = await db
        .select()
        .from(emailSequences)
        .where(and(eq(emailSequences.id, input.sequenceId), eq(emailSequences.userId, ctx.user.id)));
      if (!seq) throw new TRPCError({ code: "NOT_FOUND" });
      const [result] = await db.insert(emailSequenceSteps).values(input);
      return { id: (result as any).insertId as number };
    }),

  // Update a step
  updateStep: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        delayDays: z.number().min(0).optional(),
        subjectTemplate: z.string().min(1).max(500).optional(),
        bodyTemplate: z.string().min(1).optional(),
        sendTimePreference: z.enum(["morning", "afternoon", "best_time"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...fields } = input;
      await db.update(emailSequenceSteps).set(fields).where(eq(emailSequenceSteps.id, id));
      return { ok: true };
    }),

  // Delete a step
  deleteStep: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(emailSequenceSteps).where(eq(emailSequenceSteps.id, input.id));
      return { ok: true };
    }),

  // Seed a built-in template as a new sequence for this user
  seedTemplate: protectedProcedure
    .input(z.object({ templateIndex: z.number().min(0) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tpl = ALL_TEMPLATES[input.templateIndex];
      if (!tpl) throw new TRPCError({ code: "NOT_FOUND" });
      const [result] = await db.insert(emailSequences).values({
        userId: ctx.user.id,
        name: tpl.name,
        description: tpl.description,
        triggerType: tpl.triggerType,
        status: "draft",
        isBuiltIn: true,
      });
      const seqId = (result as any).insertId as number;
      for (const step of tpl.steps) {
        await db.insert(emailSequenceSteps).values({ sequenceId: seqId, ...step });
      }
      return { id: seqId };
    }),

  // List enrollments for a sequence
  listEnrollments: protectedProcedure
    .input(z.object({ sequenceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select({
          enrollment: emailSequenceEnrollments,
          client: clients,
        })
        .from(emailSequenceEnrollments)
        .leftJoin(clients, eq(emailSequenceEnrollments.clientId, clients.id))
        .where(
          and(
            eq(emailSequenceEnrollments.sequenceId, input.sequenceId),
            eq(emailSequenceEnrollments.userId, ctx.user.id)
          )
        )
        .orderBy(desc(emailSequenceEnrollments.enrolledAt));
      return rows;
    }),

  // Enroll a client in a sequence
  enroll: protectedProcedure
    .input(z.object({ sequenceId: z.number(), clientId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Check if already enrolled and active
      const [existing] = await db
        .select()
        .from(emailSequenceEnrollments)
        .where(
          and(
            eq(emailSequenceEnrollments.sequenceId, input.sequenceId),
            eq(emailSequenceEnrollments.clientId, input.clientId),
            eq(emailSequenceEnrollments.userId, ctx.user.id)
          )
        );
      if (existing && existing.status === "active") {
        throw new TRPCError({ code: "CONFLICT", message: "Client is already enrolled in this sequence." });
      }
      const [result] = await db.insert(emailSequenceEnrollments).values({
        sequenceId: input.sequenceId,
        clientId: input.clientId,
        userId: ctx.user.id,
        currentStep: 0,
        status: "active",
      });
      return { id: (result as any).insertId as number };
    }),

  // Auto-enroll a client when pipeline stage changes (triggered by pipeline router)
  autoEnrollOnPipelineChange: protectedProcedure
    .input(z.object({ 
      clientId: z.number(), 
      fromStage: z.string(),
      toStage: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // Find sequences triggered by pipeline_stage_change that match this stage transition
      const sequences = await db
        .select()
        .from(emailSequences)
        .where(
          and(
            eq(emailSequences.userId, ctx.user.id),
            eq(emailSequences.triggerType, "pipeline_stage_change"),
            eq(emailSequences.status, "active")
          )
        );
      
      const enrolled: number[] = [];
      
      for (const seq of sequences) {
        // Check if trigger config matches this stage transition
        const triggerConfig = seq.triggerConfig as any;
        if (triggerConfig?.toStage === input.toStage || triggerConfig?.toStage === "any") {
          // Check if already enrolled
          const [existing] = await db
            .select()
            .from(emailSequenceEnrollments)
            .where(
              and(
                eq(emailSequenceEnrollments.sequenceId, seq.id),
                eq(emailSequenceEnrollments.clientId, input.clientId),
                eq(emailSequenceEnrollments.userId, ctx.user.id)
              )
            );
          
          if (!existing || existing.status !== "active") {
            const [result] = await db.insert(emailSequenceEnrollments).values({
              sequenceId: seq.id,
              clientId: input.clientId,
              userId: ctx.user.id,
              currentStep: 0,
              status: "active",
            });
            enrolled.push((result as any).insertId as number);
          }
        }
      }
      
      return { enrolled };
    }),

  // Unenroll a client
  unenroll: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db
        .update(emailSequenceEnrollments)
        .set({ status: "unsubscribed" })
        .where(
          and(
            eq(emailSequenceEnrollments.id, input.enrollmentId),
            eq(emailSequenceEnrollments.userId, ctx.user.id)
          )
        );
      return { ok: true };
    }),

  // Send the next step email for an enrollment
  sendNextStep: protectedProcedure
    .input(z.object({ enrollmentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Load enrollment
      const [enrollment] = await db
        .select()
        .from(emailSequenceEnrollments)
        .where(
          and(
            eq(emailSequenceEnrollments.id, input.enrollmentId),
            eq(emailSequenceEnrollments.userId, ctx.user.id)
          )
        );
      if (!enrollment) throw new TRPCError({ code: "NOT_FOUND" });
      if (enrollment.status !== "active") throw new TRPCError({ code: "BAD_REQUEST", message: "Enrollment is not active." });

      // Load steps
      const steps = await db
        .select()
        .from(emailSequenceSteps)
        .where(eq(emailSequenceSteps.sequenceId, enrollment.sequenceId))
        .orderBy(asc(emailSequenceSteps.stepOrder));

      const nextStepIndex = enrollment.currentStep;
      if (nextStepIndex >= steps.length) {
        // Sequence complete
        await db
          .update(emailSequenceEnrollments)
          .set({ status: "completed" })
          .where(eq(emailSequenceEnrollments.id, enrollment.id));
        return { done: true, message: "Sequence completed." };
      }

      const step = steps[nextStepIndex];

      // Load client
      const [client] = await db.select().from(clients).where(eq(clients.id, enrollment.clientId));
      if (!client || !client.email) throw new TRPCError({ code: "BAD_REQUEST", message: "Client has no email address." });

      // Interpolate templates with Soul Engineer variables
      const vars = {
        clientName: client.name ?? "there",
        senderName: ctx.user.name ?? "DeWayne Woods",
        clientEmail: client.email,
        companyName: client.company ?? "your company",
        coreInsight: "[Core insight will be customized per strategy]",
        benefit1: "[Benefit 1]",
        benefit2: "[Benefit 2]",
        benefit3: "[Benefit 3]",
        timeline: "[Timeline]",
        investment: "[Investment]",
        forgottenDetail: "[Detail to be added]",
      };
      const subject = interpolate(step.subjectTemplate, vars);
      const body = interpolate(step.bodyTemplate, vars);

      // Send via Resend
      let resendId: string | undefined;
      let status: "sent" | "failed" = "sent";
      try {
        const { data, error } = await resend.emails.send({
          from: ENV.emailFrom,
          to: client.email,
          subject,
          text: body,
        });
        if (error) throw new Error(error.message);
        resendId = data?.id;
      } catch (err) {
        status = "failed";
        console.error("[EmailSequences] Resend error:", err);
      }

      // Log the send
      await db.insert(emailSends).values({
        enrollmentId: enrollment.id,
        stepId: step.id,
        userId: ctx.user.id,
        subject,
        body,
        toEmail: client.email,
        resendId,
        status,
        sentAt: new Date(),
      });

      // Advance enrollment step
      await db
        .update(emailSequenceEnrollments)
        .set({
          currentStep: nextStepIndex + 1,
          lastEmailSentAt: new Date(),
          status: nextStepIndex + 1 >= steps.length ? "completed" : "active",
        })
        .where(eq(emailSequenceEnrollments.id, enrollment.id));

      return { done: false, status, subject, toEmail: client.email };
    }),

  // Get send history for a sequence
  getSendHistory: protectedProcedure
    .input(z.object({ sequenceId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const rows = await db
        .select()
        .from(emailSends)
        .where(eq(emailSends.userId, ctx.user.id))
        .orderBy(desc(emailSends.createdAt))
        .limit(100);
      return rows;
    }),

  // Get built-in template list (no DB needed)
  getTemplates: protectedProcedure.query(() => {
    return ALL_TEMPLATES.map((t, i) => ({
      index: i,
      name: t.name,
      description: t.description,
      triggerType: t.triggerType,
      stepCount: t.steps.length,
      isSoulEngineer: i < SOUL_ENGINEER_TEMPLATES.length,
    }));
  }),

  // ── Test endpoint for Resend ───────────────────────────────────────────────
  testSend: protectedProcedure
    .input(z.object({ 
      toEmail: z.string().email(),
      testType: z.enum(["text", "html", "template"]).default("text"),
    }))
    .mutation(async ({ ctx, input }) => {
      try {
        let result;
        
        if (input.testType === "text") {
          result = await resend.emails.send({
            from: ENV.emailFrom,
            to: input.toEmail,
            subject: "Operator House — Resend Test (Text)",
            text: `Hi there,

This is a test email from Operator House's Resend integration.

If you're receiving this, email delivery is working correctly.

Test details:
- Sent by: ${ctx.user.name ?? ctx.user.email ?? "Unknown user"}
- Timestamp: ${new Date().toISOString()}
- Type: Plain text

— Operator House / SoulOps`,
          });
        } else if (input.testType === "html") {
          result = await resend.emails.send({
            from: ENV.emailFrom,
            to: input.toEmail,
            subject: "Operator House — Resend Test (HTML)",
            html: `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Resend Test</title>
</head>
<body style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; color: #333;">
  <div style="background: #f8f9fa; padding: 20px; border-radius: 8px; margin-bottom: 20px;">
    <h1 style="margin: 0 0 10px 0; color: #d4a853;">✓ Resend Integration Working</h1>
    <p style="margin: 0; color: #666;">This HTML email confirms your email configuration is correct.</p>
  </div>
  
  <h2 style="color: #333;">Test Details</h2>
  <ul style="line-height: 1.6;">
    <li><strong>Sent by:</strong> ${ctx.user.name ?? ctx.user.email ?? "Unknown user"}</li>
    <li><strong>Timestamp:</strong> ${new Date().toLocaleString()}</li>
    <li><strong>Type:</strong> HTML formatted</li>
    <li><strong>From:</strong> ${ENV.emailFrom}</li>
  </ul>
  
  <p style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #eee; color: #999; font-size: 12px;">
    — Operator House / SoulOps
  </p>
</body>
</html>`,
          });
        } else {
          // Template test - uses Soul Engineer template style
          result = await resend.emails.send({
            from: ENV.emailFrom,
            to: input.toEmail,
            subject: "Your team's time — Test Recipient",
            text: `Hi Test Recipient,

I was looking at what your company is building and had a specific thought.

Most leaders I work with aren't short on talent. They're short on *time* — drowning in repetitive work that keeps smart people busy but doesn't move the business forward.

I help high-capacity leaders reclaim 10+ hours a week by building AI systems that handle the work nobody should be doing manually.

Not templates. Not chatbots. Actual systems that run your operations.

Worth a 15-minute conversation about where your team is losing the most time?

— DeWayne Woods
Soul Engineer

P.S. — If this isn't the right time, just reply "later" and I'll check back in a few months. No drip sequences, no automated follow-ups. I write every email myself.

---
This is a TEST EMAIL from the Soul Engineer template library.`,
          });
        }

        if (result.error) {
          throw new Error(result.error.message);
        }

        return { 
          success: true, 
          messageId: result.data?.id,
          testType: input.testType,
          to: input.toEmail,
        };
      } catch (err: any) {
        console.error("[EmailSequences] Test send error:", err);
        throw new TRPCError({ 
          code: "INTERNAL_SERVER_ERROR", 
          message: `Failed to send test email: ${err.message}` 
        });
      }
    }),

  // ── Schedule/Trigger Management ────────────────────────────────────────────
  // Get pending emails that need to be sent (for cron job)
  getPendingEmails: protectedProcedure
    .input(z.object({ limit: z.number().default(50) }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // Find active enrollments where next email is due
      const now = new Date();
      const enrollments = await db
        .select({
          enrollment: emailSequenceEnrollments,
          client: clients,
          sequence: emailSequences,
        })
        .from(emailSequenceEnrollments)
        .leftJoin(clients, eq(emailSequenceEnrollments.clientId, clients.id))
        .leftJoin(emailSequences, eq(emailSequenceEnrollments.sequenceId, emailSequences.id))
        .where(
          and(
            eq(emailSequenceEnrollments.userId, ctx.user.id),
            eq(emailSequenceEnrollments.status, "active")
          )
        )
        .limit(input.limit);
      
      // Filter to those where enough time has passed since last email
      const pending = enrollments.filter(({ enrollment, sequence }) => {
        if (!enrollment.lastEmailSentAt) return true; // Never sent, send immediately
        
        // Get the next step's delay
        // This is a simplified version - in production you'd look up the actual step
        const hoursSinceLastEmail = (now.getTime() - new Date(enrollment.lastEmailSentAt).getTime()) / (1000 * 60 * 60);
        return hoursSinceLastEmail >= 24; // At least 1 day has passed
      });
      
      return pending;
    }),

  // Bulk send pending emails (for cron job)
  processScheduledSends: protectedProcedure
    .mutation(async ({ ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      
      // Get pending emails
      const pending = await db
        .select({
          enrollment: emailSequenceEnrollments,
        })
        .from(emailSequenceEnrollments)
        .where(
          and(
            eq(emailSequenceEnrollments.userId, ctx.user.id),
            eq(emailSequenceEnrollments.status, "active")
          )
        );
      
      const results = [];
      
      for (const { enrollment } of pending) {
        try {
          // This would call sendNextStep logic for each enrollment
          // Simplified for now
          results.push({ enrollmentId: enrollment.id, status: "processed" });
        } catch (err) {
          results.push({ enrollmentId: enrollment.id, status: "failed", error: String(err) });
        }
      }
      
      return { processed: results.length, results };
    }),
});

// ── Pipeline Integration Helper ──────────────────────────────────────────────
// This function can be called from the pipeline router when deals change stages
export async function handlePipelineStageChange(
  userId: number,
  clientId: number,
  fromStage: string,
  toStage: string
) {
  const db = await getDb();
  if (!db) return { enrolled: [] };
  
  // Find active sequences triggered by pipeline stage changes
  const sequences = await db
    .select()
    .from(emailSequences)
    .where(
      and(
        eq(emailSequences.userId, userId),
        eq(emailSequences.triggerType, "pipeline_stage_change"),
        eq(emailSequences.status, "active")
      )
    );
  
  const enrolled: number[] = [];
  
  for (const seq of sequences) {
    const triggerConfig = seq.triggerConfig as any;
    // Match if the toStage matches the configured trigger stage
    if (triggerConfig?.toStage === toStage || triggerConfig?.toStage === "any") {
      // Check if not already enrolled
      const [existing] = await db
        .select()
        .from(emailSequenceEnrollments)
        .where(
          and(
            eq(emailSequenceEnrollments.sequenceId, seq.id),
            eq(emailSequenceEnrollments.clientId, clientId),
            eq(emailSequenceEnrollments.userId, userId)
          )
        );
      
      if (!existing || existing.status !== "active") {
        const [result] = await db.insert(emailSequenceEnrollments).values({
          sequenceId: seq.id,
          clientId,
          userId,
          currentStep: 0,
          status: "active",
        });
        enrolled.push((result as any).insertId as number);
      }
    }
  }
  
  return { enrolled };
}
