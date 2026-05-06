import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { callQueue, callScripts } from "../../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

// ─── Built-in script templates ────────────────────────────────────────────────
const BUILT_IN_SCRIPTS = [
  {
    name: "Discovery Call",
    pipelineStage: "Discovery" as const,
    openingLines:
      "Hi [Name], this is [Your Name] from Operator House. I'm reaching out because [reason]. Do you have about 15 minutes to chat?",
    talkingPoints: [
      "What's your biggest challenge with [area] right now?",
      "How are you currently handling [problem]?",
      "What would success look like for you in the next 90 days?",
      "Who else is involved in decisions like this?",
    ],
    objectionHandlers: [
      { objection: "Not a good time", response: "Totally understand — when would be better? I'll send a calendar invite." },
      { objection: "Already have a solution", response: "That's great. I'm curious — what's working well and what would you change if you could?" },
      { objection: "Not interested", response: "Fair enough. Can I ask what would need to be different for this to be worth 10 minutes?" },
    ],
    closingLines:
      "Based on what you've shared, I think there's a real fit here. Can we schedule a follow-up to go deeper? I'll send over a summary of what we discussed.",
    isBuiltIn: true,
  },
  {
    name: "Follow-Up Call",
    pipelineStage: "Analysis" as const,
    openingLines:
      "Hi [Name], it's [Your Name] following up on our last conversation. I wanted to check in and see where things stand on your end.",
    talkingPoints: [
      "Have you had a chance to review what I sent over?",
      "Any questions come up since we last spoke?",
      "What's the current priority on your side?",
      "Is there anything blocking a decision right now?",
    ],
    objectionHandlers: [
      { objection: "Still reviewing", response: "No rush — what's the timeline looking like? I want to make sure I'm supporting you, not pressuring you." },
      { objection: "Budget concerns", response: "Let's talk about that. What number would make this a no-brainer for you?" },
      { objection: "Need more time", response: "Understood. What would help you feel confident moving forward?" },
    ],
    closingLines:
      "I appreciate you taking the time. Let's lock in a next step — even if it's just a quick check-in next week. What works for you?",
    isBuiltIn: true,
  },
  {
    name: "Win-Back Call",
    pipelineStage: "nurture" as const,
    openingLines:
      "Hi [Name], it's [Your Name]. I know it's been a while — I wanted to reach out personally because I've been thinking about our conversation.",
    talkingPoints: [
      "A lot has changed since we last spoke — [specific update].",
      "I wanted to share something that might be relevant to what you were working on.",
      "Has anything shifted on your end since we last connected?",
      "We've helped [similar company] solve exactly what you described — want to hear how?",
    ],
    objectionHandlers: [
      { objection: "Went with someone else", response: "I respect that. How's it going? I'm always here if you ever want a second opinion." },
      { objection: "Not a priority anymore", response: "Totally get it. What would need to change for it to become one?" },
      { objection: "Bad timing before", response: "I appreciate you being honest about that. What's different now?" },
    ],
    closingLines:
      "I'm not here to pressure you — just wanted to reconnect and see if there's a way I can add value. Even a 10-minute call would be worth it. What do you think?",
    isBuiltIn: true,
  },
];

export const callCenterRouter = router({
  // ── Queue ──────────────────────────────────────────────────────────────────
  getQueue: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    return db
      .select()
      .from(callQueue)
      .where(and(eq(callQueue.userId, ctx.user.id), eq(callQueue.completed, false)))
      .orderBy(
        asc(
          // priority order: high → medium → low
          callQueue.priority
        ),
        asc(callQueue.createdAt)
      );
  }),

  addToQueue: protectedProcedure
    .input(
      z.object({
        clientId: z.number(),
        priority: z.enum(["high", "medium", "low"]).default("medium"),
        reason: z.enum(["new_lead", "follow_up", "stale_deal", "scheduled"]).default("follow_up"),
        scheduledFor: z.date().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.insert(callQueue).values({
        userId: ctx.user.id,
        clientId: input.clientId,
        priority: input.priority,
        reason: input.reason,
        scheduledFor: input.scheduledFor,
      });
      return { success: true };
    }),

  completeCall: protectedProcedure
    .input(
      z.object({
        queueItemId: z.number(),
        disposition: z.enum(["connected", "voicemail", "no_answer", "callback_requested", "not_interested", "converted"]),
        notes: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .update(callQueue)
        .set({ completed: true, completedAt: new Date() })
        .where(and(eq(callQueue.id, input.queueItemId), eq(callQueue.userId, ctx.user.id)));
      return { success: true, disposition: input.disposition, notes: input.notes };
    }),

  removeFromQueue: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .delete(callQueue)
        .where(and(eq(callQueue.id, input.id), eq(callQueue.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Call Log (completed calls) ─────────────────────────────────────────────
  getLog: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    return db
      .select()
      .from(callQueue)
      .where(and(eq(callQueue.userId, ctx.user.id), eq(callQueue.completed, true)))
      .orderBy(desc(callQueue.completedAt))
      .limit(100);
  }),

  // ── Scripts ────────────────────────────────────────────────────────────────
  getScripts: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    // Seed built-in scripts if none exist for this user
    const existing = await db
      .select()
      .from(callScripts)
      .where(eq(callScripts.userId, ctx.user.id));

    if (existing.length === 0) {
      for (const s of BUILT_IN_SCRIPTS) {
        await db.insert(callScripts).values({
          userId: ctx.user.id,
          ...s,
          talkingPoints: s.talkingPoints,
          objectionHandlers: s.objectionHandlers,
          isAiGenerated: false,
        });
      }
      return db.select().from(callScripts).where(eq(callScripts.userId, ctx.user.id));
    }

    return existing;
  }),

  createScript: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1),
        pipelineStage: z.enum(["Discovery", "Analysis", "Strategy", "Proposal", "Closed", "nurture"]),
        openingLines: z.string().optional(),
        talkingPoints: z.array(z.string()).optional(),
        objectionHandlers: z
          .array(z.object({ objection: z.string(), response: z.string() }))
          .optional(),
        closingLines: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [result] = await db.insert(callScripts).values({
        userId: ctx.user.id,
        name: input.name,
        pipelineStage: input.pipelineStage,
        openingLines: input.openingLines,
        talkingPoints: input.talkingPoints ?? [],
        objectionHandlers: input.objectionHandlers ?? [],
        closingLines: input.closingLines,
        isAiGenerated: false,
        isBuiltIn: false,
      });
      return { id: (result as any).insertId };
    }),

  generateScript: protectedProcedure
    .input(
      z.object({
        clientName: z.string().min(1),
        companyName: z.string().optional(),
        pipelineStage: z.enum(["Discovery", "Analysis", "Strategy", "Proposal", "Closed", "nurture"]),
        context: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const systemPrompt = `You are Specter, an elite sales intelligence engine for Operator House. 
Generate a concise, high-converting call script for a ${input.pipelineStage} stage call.
Return ONLY valid JSON matching this exact schema:
{
  "openingLines": "string",
  "talkingPoints": ["string", "string", "string", "string"],
  "objectionHandlers": [
    {"objection": "string", "response": "string"},
    {"objection": "string", "response": "string"},
    {"objection": "string", "response": "string"}
  ],
  "closingLines": "string"
}`;

      const userPrompt = `Client: ${input.clientName}${input.companyName ? ` at ${input.companyName}` : ""}
Stage: ${input.pipelineStage}
${input.context ? `Context: ${input.context}` : ""}
Generate a sharp, natural-sounding call script. Keep talking points as questions that uncover pain and intent.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userPrompt },
        ],
        response_format: {
          type: "json_schema",
          json_schema: {
            name: "call_script",
            strict: true,
            schema: {
              type: "object",
              properties: {
                openingLines: { type: "string" },
                talkingPoints: { type: "array", items: { type: "string" } },
                objectionHandlers: {
                  type: "array",
                  items: {
                    type: "object",
                    properties: {
                      objection: { type: "string" },
                      response: { type: "string" },
                    },
                    required: ["objection", "response"],
                    additionalProperties: false,
                  },
                },
                closingLines: { type: "string" },
              },
              required: ["openingLines", "talkingPoints", "objectionHandlers", "closingLines"],
              additionalProperties: false,
            },
          },
        },
      });

      const content = response.choices?.[0]?.message?.content as string | null;
      if (!content) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Specter failed to generate a script. Try again." });

      const parsed = JSON.parse(content);
      const scriptName = `${input.clientName} — ${input.pipelineStage} (Specter)`;

      const [result] = await db.insert(callScripts).values({
        userId: ctx.user.id,
        name: scriptName,
        pipelineStage: input.pipelineStage,
        openingLines: parsed.openingLines,
        talkingPoints: parsed.talkingPoints,
        objectionHandlers: parsed.objectionHandlers,
        closingLines: parsed.closingLines,
        isAiGenerated: true,
        isBuiltIn: false,
      });

      return { id: (result as any).insertId, script: parsed, name: scriptName };
    }),

  deleteScript: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .delete(callScripts)
        .where(and(eq(callScripts.id, input.id), eq(callScripts.userId, ctx.user.id)));
      return { success: true };
    }),
});
