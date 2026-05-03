/**
 * Email Sequences Router
 * Handles CRUD for sequences, steps, enrollments, and Resend email delivery.
 */
import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  emailSequences,
  emailSequenceSteps,
  emailSequenceEnrollments,
  emailSends,
  clients,
} from "../../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { Resend } from "resend";
import { TRPCError } from "@trpc/server";

const resend = new Resend(process.env.RESEND_API_KEY);

// ── Pre-built sequence templates ──────────────────────────────────────────────
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
    .input(z.object({ templateIndex: z.number().min(0).max(3) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const tpl = BUILT_IN_TEMPLATES[input.templateIndex];
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

      // Interpolate templates
      const vars = {
        clientName: client.name ?? "there",
        senderName: ctx.user.name ?? "Your Specter",
        clientEmail: client.email,
      };
      const subject = interpolate(step.subjectTemplate, vars);
      const body = interpolate(step.bodyTemplate, vars);

      // Send via Resend
      let resendId: string | undefined;
      let status: "sent" | "failed" = "sent";
      try {
        const { data, error } = await resend.emails.send({
          from: "Operator House <onboarding@resend.dev>",
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
    return BUILT_IN_TEMPLATES.map((t, i) => ({
      index: i,
      name: t.name,
      description: t.description,
      triggerType: t.triggerType,
      stepCount: t.steps.length,
    }));
  }),
});
