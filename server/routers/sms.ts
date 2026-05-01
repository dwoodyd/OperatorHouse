import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { smsConversations, smsMessages, smsTemplates } from "../../drizzle/schema";
import { eq, and, desc, asc } from "drizzle-orm";

const BUILT_IN_TEMPLATES = [
  {
    name: "Intro — First Touch",
    body: "Hi {{firstName}}, this is {{operatorName}} from {{company}}. I help operators like you close more deals with less friction. Worth a quick 10-min call this week?",
    category: "follow_up" as const,
    isBuiltIn: true,
  },
  {
    name: "Follow-Up — After Meeting",
    body: "Hey {{firstName}}, great connecting today. I'll send over the summary we discussed. Any questions in the meantime, just reply here.",
    category: "follow_up" as const,
    isBuiltIn: true,
  },
  {
    name: "Appointment Reminder",
    body: "Hi {{firstName}}, just a reminder about our call tomorrow at {{time}}. Looking forward to it. Reply CONFIRM to lock it in.",
    category: "reminder" as const,
    isBuiltIn: true,
  },
  {
    name: "Check-In — 30 Days",
    body: "Hey {{firstName}}, checking in. How's everything going with {{topic}}? Happy to jump on a quick call if anything's come up.",
    category: "check_in" as const,
    isBuiltIn: true,
  },
  {
    name: "Re-Engagement — Gone Cold",
    body: "{{firstName}}, I know it's been a while. Wanted to reach back out — we've helped a few operators in your space recently and thought of you. Still relevant?",
    category: "re_engagement" as const,
    isBuiltIn: true,
  },
  {
    name: "Close — Final Ask",
    body: "Hey {{firstName}}, I want to be straightforward — I think we can genuinely help you. If now isn't the right time, just say so. If it is, let's get it done this week.",
    category: "follow_up" as const,
    isBuiltIn: true,
  },
];

export const smsRouter = router({
  // ── Conversations ──────────────────────────────────────────────────────────
  listConversations: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const convos = await db
      .select()
      .from(smsConversations)
      .where(eq(smsConversations.userId, ctx.user.id))
      .orderBy(desc(smsConversations.lastMessageAt));
    return convos;
  }),

  createConversation: protectedProcedure
    .input(z.object({
      clientId: z.number(),
      phoneNumber: z.string().min(7),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [row] = await db.insert(smsConversations).values({
        clientId: input.clientId,
        userId: ctx.user.id,
        phoneNumber: input.phoneNumber,
        optInStatus: "opted_in",
        lastMessageAt: new Date(),
      });
      return { id: (row as any).insertId };
    }),

  // ── Messages ───────────────────────────────────────────────────────────────
  listMessages: protectedProcedure
    .input(z.object({ conversationId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      // verify ownership
      const [convo] = await db
        .select()
        .from(smsConversations)
        .where(and(eq(smsConversations.id, input.conversationId), eq(smsConversations.userId, ctx.user.id)))
        .limit(1);
      if (!convo) throw new TRPCError({ code: "NOT_FOUND" });
      const msgs = await db
        .select()
        .from(smsMessages)
        .where(eq(smsMessages.conversationId, input.conversationId))
        .orderBy(asc(smsMessages.createdAt));
      return msgs;
    }),

  sendMessage: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      body: z.string().min(1).max(1600),
      templateId: z.number().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [convo] = await db
        .select()
        .from(smsConversations)
        .where(and(eq(smsConversations.id, input.conversationId), eq(smsConversations.userId, ctx.user.id)))
        .limit(1);
      if (!convo) throw new TRPCError({ code: "NOT_FOUND" });

      // Attempt Twilio send if credentials are available
      const twilioSid = process.env.TWILIO_ACCOUNT_SID;
      const twilioAuth = process.env.TWILIO_AUTH_TOKEN;
      const twilioFrom = process.env.TWILIO_PHONE_NUMBER;
      let smsSid: string | undefined;
      let status: "sent" | "queued" = "queued";

      if (twilioSid && twilioAuth && twilioFrom) {
        try {
          const res = await fetch(
            `https://api.twilio.com/2010-04-01/Accounts/${twilioSid}/Messages.json`,
            {
              method: "POST",
              headers: {
                Authorization: "Basic " + Buffer.from(`${twilioSid}:${twilioAuth}`).toString("base64"),
                "Content-Type": "application/x-www-form-urlencoded",
              },
              body: new URLSearchParams({
                From: twilioFrom,
                To: convo.phoneNumber,
                Body: input.body,
              }).toString(),
            }
          );
          const data = await res.json() as any;
          if (data.sid) {
            smsSid = data.sid;
            status = "sent";
          }
        } catch (_) {
          // fall through — save as queued
        }
      }

      const [row] = await db.insert(smsMessages).values({
        conversationId: input.conversationId,
        userId: ctx.user.id,
        direction: "outbound",
        body: input.body,
        status,
        twilioSid: smsSid,
        templateId: input.templateId,
        sentAt: status === "sent" ? new Date() : undefined,
      });

      // update lastMessageAt on conversation
      await db.update(smsConversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(smsConversations.id, input.conversationId));

      return { id: (row as any).insertId, status, twilioSid: smsSid };
    }),

  // ── Templates ──────────────────────────────────────────────────────────────
  listTemplates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    // seed built-in templates if none exist for this user
    const existing = await db
      .select()
      .from(smsTemplates)
      .where(and(eq(smsTemplates.userId, ctx.user.id), eq(smsTemplates.isBuiltIn, true)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(smsTemplates).values(
        BUILT_IN_TEMPLATES.map((t) => ({ ...t, userId: ctx.user.id }))
      );
    }

    return db.select().from(smsTemplates)
      .where(eq(smsTemplates.userId, ctx.user.id))
      .orderBy(asc(smsTemplates.isBuiltIn), asc(smsTemplates.name));
  }),

  createTemplate: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      body: z.string().min(1).max(1600),
      category: z.enum(["follow_up", "reminder", "check_in", "celebration", "re_engagement", "referral", "custom"]).default("custom"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [row] = await db.insert(smsTemplates).values({ ...input, userId: ctx.user.id });
      return { id: (row as any).insertId };
    }),

  deleteTemplate: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(smsTemplates)
        .where(and(eq(smsTemplates.id, input.id), eq(smsTemplates.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Twilio inbound webhook (public) ────────────────────────────────────────
  // Registered separately as a raw Express route in index.ts
  // This procedure is a helper to save inbound messages from the webhook handler
  saveInbound: protectedProcedure
    .input(z.object({
      conversationId: z.number(),
      body: z.string(),
      twilioSid: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [row] = await db.insert(smsMessages).values({
        conversationId: input.conversationId,
        userId: ctx.user.id,
        direction: "inbound",
        body: input.body,
        status: "read",
        twilioSid: input.twilioSid,
        sentAt: new Date(),
      });
      await db.update(smsConversations)
        .set({ lastMessageAt: new Date() })
        .where(eq(smsConversations.id, input.conversationId));
      return { id: (row as any).insertId };
    }),
});
