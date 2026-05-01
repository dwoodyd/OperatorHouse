import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { voiceAgents, voiceAgentCalls, voiceAgentKnowledge, vaultItems } from "../../drizzle/schema";
import { eq, and, desc } from "drizzle-orm";

const BUILT_IN_AGENTS = [
  {
    name: "Discovery Agent",
    description: "Handles inbound discovery calls — qualifies leads, captures pain points, and books follow-up meetings.",
    personality: "professional" as const,
    greetingScript: "Hi, this is the Operator House discovery line. I'm here to learn a bit about your business and see if we might be a fit. Do you have a few minutes?",
    fallbackAction: "schedule_callback" as const,
    isBuiltIn: true,
    isActive: false,
  },
  {
    name: "Follow-Up Agent",
    description: "Proactively calls warm leads who haven't responded to email or SMS within 72 hours.",
    personality: "warm" as const,
    greetingScript: "Hey, this is a follow-up from Operator House. I know you've been busy — just wanted to make sure my last message didn't get lost. Is now an okay time?",
    fallbackAction: "voicemail" as const,
    isBuiltIn: true,
    isActive: false,
  },
  {
    name: "Appointment Setter",
    description: "Calls prospects to confirm, reschedule, or set new appointments based on pipeline triggers.",
    personality: "concise" as const,
    greetingScript: "Hi {{firstName}}, calling to confirm your appointment scheduled for {{time}}. Just reply or press 1 to confirm, or 2 to reschedule.",
    fallbackAction: "schedule_callback" as const,
    isBuiltIn: true,
    isActive: false,
  },
  {
    name: "Re-Engagement Agent",
    description: "Reaches out to cold leads (90+ days inactive) with a brief, low-pressure check-in.",
    personality: "warm" as const,
    greetingScript: "Hey {{firstName}}, it's been a while. I wanted to check in and see if anything's changed on your end. No pressure at all — just wanted to stay in touch.",
    fallbackAction: "voicemail" as const,
    isBuiltIn: true,
    isActive: false,
  },
];

export const voiceAgentsRouter = router({
  // ── Agents ─────────────────────────────────────────────────────────────────
  listAgents: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

    // seed built-in agents if none exist
    const existing = await db
      .select()
      .from(voiceAgents)
      .where(and(eq(voiceAgents.userId, ctx.user.id), eq(voiceAgents.isBuiltIn, true)))
      .limit(1);

    if (existing.length === 0) {
      await db.insert(voiceAgents).values(
        BUILT_IN_AGENTS.map((a) => ({ ...a, userId: ctx.user.id }))
      );
    }

    return db.select().from(voiceAgents)
      .where(eq(voiceAgents.userId, ctx.user.id))
      .orderBy(desc(voiceAgents.isBuiltIn));
  }),

  createAgent: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      personality: z.enum(["professional", "warm", "concise", "custom"]).default("professional"),
      greetingScript: z.string().optional(),
      fallbackAction: z.enum(["voicemail", "transfer", "schedule_callback"]).default("voicemail"),
      phoneNumber: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [row] = await db.insert(voiceAgents).values({ ...input, userId: ctx.user.id });
      return { id: (row as any).insertId };
    }),

  updateAgent: protectedProcedure
    .input(z.object({
      id: z.number(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      personality: z.enum(["professional", "warm", "concise", "custom"]).optional(),
      greetingScript: z.string().optional(),
      fallbackAction: z.enum(["voicemail", "transfer", "schedule_callback"]).optional(),
      isActive: z.boolean().optional(),
      phoneNumber: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const { id, ...data } = input;
      await db.update(voiceAgents)
        .set({ ...data, updatedAt: new Date() })
        .where(and(eq(voiceAgents.id, id), eq(voiceAgents.userId, ctx.user.id)));
      return { success: true };
    }),

  deleteAgent: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(voiceAgents)
        .where(and(eq(voiceAgents.id, input.id), eq(voiceAgents.userId, ctx.user.id)));
      return { success: true };
    }),

  // ── Call Logs ──────────────────────────────────────────────────────────────
  listCalls: protectedProcedure
    .input(z.object({ agentId: z.number().optional() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const conditions = [eq(voiceAgentCalls.userId, ctx.user.id)];
      if (input.agentId) conditions.push(eq(voiceAgentCalls.agentId, input.agentId));
      return db.select().from(voiceAgentCalls)
        .where(and(...conditions))
        .orderBy(desc(voiceAgentCalls.handledAt))
        .limit(100);
    }),

  // ── Knowledge (Vault links) ────────────────────────────────────────────────
  listKnowledge: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      // verify agent ownership
      const [agent] = await db.select().from(voiceAgents)
        .where(and(eq(voiceAgents.id, input.agentId), eq(voiceAgents.userId, ctx.user.id))).limit(1);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND" });

      const links = await db.select().from(voiceAgentKnowledge)
        .where(eq(voiceAgentKnowledge.agentId, input.agentId));

      if (links.length === 0) return [];

      const vaultIds = links.map((l) => l.vaultItemId);
      const items = await db.select().from(vaultItems)
        .where(eq(vaultItems.userId, ctx.user.id));
      return items.filter((v) => vaultIds.includes(v.id));
    }),

  addKnowledge: protectedProcedure
    .input(z.object({ agentId: z.number(), vaultItemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [agent] = await db.select().from(voiceAgents)
        .where(and(eq(voiceAgents.id, input.agentId), eq(voiceAgents.userId, ctx.user.id))).limit(1);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND" });
      await db.insert(voiceAgentKnowledge).values({ agentId: input.agentId, vaultItemId: input.vaultItemId });
      return { success: true };
    }),

  removeKnowledge: protectedProcedure
    .input(z.object({ agentId: z.number(), vaultItemId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db.delete(voiceAgentKnowledge)
        .where(and(
          eq(voiceAgentKnowledge.agentId, input.agentId),
          eq(voiceAgentKnowledge.vaultItemId, input.vaultItemId)
        ));
      return { success: true };
    }),

  // ── Vapi.ai integration stub ───────────────────────────────────────────────
  deployToVapi: protectedProcedure
    .input(z.object({ agentId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const [agent] = await db.select().from(voiceAgents)
        .where(and(eq(voiceAgents.id, input.agentId), eq(voiceAgents.userId, ctx.user.id))).limit(1);
      if (!agent) throw new TRPCError({ code: "NOT_FOUND" });

      const vapiKey = process.env.VAPI_API_KEY;
      if (!vapiKey) {
        return { success: false, message: "Vapi API key not configured. Add VAPI_API_KEY in Settings → Secrets." };
      }

      try {
        const res = await fetch("https://api.vapi.ai/assistant", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${vapiKey}`,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({
            name: agent.name,
            firstMessage: agent.greetingScript ?? "Hello, how can I help you today?",
            model: { provider: "openai", model: "gpt-4o", messages: [{ role: "system", content: agent.description ?? "" }] },
            voice: { provider: "11labs", voiceId: agent.voiceId ?? "rachel" },
          }),
        });
        const data = await res.json() as any;
        if (data.id) {
          await db.update(voiceAgents)
            .set({ vapiAgentId: data.id, isActive: true, updatedAt: new Date() })
            .where(eq(voiceAgents.id, input.agentId));
          return { success: true, vapiAgentId: data.id };
        }
        return { success: false, message: data.message ?? "Vapi deployment failed." };
      } catch (e: any) {
        return { success: false, message: e.message };
      }
    }),
});
