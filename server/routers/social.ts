import { z } from "zod";
import { protectedProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  socialAccounts,
  socialPosts,
  contentLibrary,
  socialStrategies,
} from "../../drizzle/schema";
import { eq, and, desc, gte, lte } from "drizzle-orm";
import { invokeLLM } from "../_core/llm";
import { TRPCError } from "@trpc/server";

// ─── Social Accounts ──────────────────────────────────────────────────────────
const accountsRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    return db
      .select()
      .from(socialAccounts)
      .where(eq(socialAccounts.userId, ctx.user.id))
      .orderBy(desc(socialAccounts.createdAt));
  }),

  connect: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["linkedin", "twitter", "instagram", "facebook"]),
        accountName: z.string().min(1),
        accountHandle: z.string().optional(),
        followerCount: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(socialAccounts).values({
        userId: ctx.user.id,
        platform: input.platform,
        accountName: input.accountName,
        accountHandle: input.accountHandle,
        followerCount: input.followerCount ?? 0,
        isConnected: true,
        connectedAt: new Date(),
      });
      return { id: result.insertId };
    }),

  disconnect: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db
        .update(socialAccounts)
        .set({ isConnected: false })
        .where(
          and(
            eq(socialAccounts.id, input.id),
            eq(socialAccounts.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db
        .delete(socialAccounts)
        .where(
          and(
            eq(socialAccounts.id, input.id),
            eq(socialAccounts.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});

// ─── Social Posts ─────────────────────────────────────────────────────────────
const postsRouter = router({
  list: protectedProcedure
    .input(
      z.object({
        status: z
          .enum(["draft", "scheduled", "published", "failed", "pending_approval", "all"])
          .optional()
          .default("all"),
        platform: z
          .enum(["linkedin", "twitter", "instagram", "facebook", "all"])
          .optional()
          .default("all"),
        limit: z.number().optional().default(50),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const rows = await db
        .select()
        .from(socialPosts)
        .where(eq(socialPosts.userId, ctx.user.id))
        .orderBy(desc(socialPosts.createdAt))
        .limit(input.limit);

      return rows.filter((r: typeof rows[0]) => {
        if (input.status !== "all" && r.status !== input.status) return false;
        if (input.platform !== "all" && r.platform !== input.platform) return false;
        return true;
      });
    }),

  getCalendar: protectedProcedure
    .input(
      z.object({
        startDate: z.string(), // ISO date string
        endDate: z.string(),
      })
    )
    .query(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const start = new Date(input.startDate);
      const end = new Date(input.endDate);
      return db
        .select()
        .from(socialPosts)
        .where(
          and(
            eq(socialPosts.userId, ctx.user.id),
            gte(socialPosts.scheduledFor, start),
            lte(socialPosts.scheduledFor, end)
          )
        )
        .orderBy(socialPosts.scheduledFor);
    }),

  create: protectedProcedure
    .input(
      z.object({
        platform: z.enum(["linkedin", "twitter", "instagram", "facebook"]),
        content: z.string().min(1),
        hashtags: z.array(z.string()).optional().default([]),
        scheduledFor: z.string().optional(),
        accountId: z.number().optional(),
        aiGenerated: z.boolean().optional().default(false),
        aiPrompt: z.string().optional(),
        status: z
          .enum(["draft", "scheduled", "pending_approval"])
          .optional()
          .default("draft"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(socialPosts).values({
        userId: ctx.user.id,
        platform: input.platform,
        content: input.content,
        hashtags: input.hashtags,
        scheduledFor: input.scheduledFor ? new Date(input.scheduledFor) : undefined,
        accountId: input.accountId,
        aiGenerated: input.aiGenerated,
        aiPrompt: input.aiPrompt,
        status: input.scheduledFor ? "scheduled" : input.status,
      });
      return { id: result.insertId };
    }),

  update: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        content: z.string().optional(),
        hashtags: z.array(z.string()).optional(),
        scheduledFor: z.string().nullable().optional(),
        status: z
          .enum(["draft", "scheduled", "published", "failed", "pending_approval"])
          .optional(),
        approvalStatus: z.enum(["pending", "approved", "rejected"]).optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const { id, scheduledFor, ...rest } = input;
      await db
        .update(socialPosts)
        .set({
          ...rest,
          ...(scheduledFor !== undefined
            ? { scheduledFor: scheduledFor ? new Date(scheduledFor) : null }
            : {}),
        })
        .where(
          and(eq(socialPosts.id, id), eq(socialPosts.userId, ctx.user.id))
        );
      return { success: true };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db
        .delete(socialPosts)
        .where(
          and(
            eq(socialPosts.id, input.id),
            eq(socialPosts.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),

  approve: protectedProcedure
    .input(
      z.object({
        id: z.number(),
        approved: z.boolean(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db
        .update(socialPosts)
        .set({
          approvalStatus: input.approved ? "approved" : "rejected",
          status: input.approved ? "scheduled" : "draft",
        })
        .where(
          and(eq(socialPosts.id, input.id), eq(socialPosts.userId, ctx.user.id))
        );
      return { success: true };
    }),

  // AI generation
  generateWithAI: protectedProcedure
    .input(
      z.object({
        prompt: z.string().min(1),
        platform: z.enum(["linkedin", "twitter", "instagram", "facebook"]),
        tone: z
          .enum(["professional", "casual", "thought_leader", "educational"])
          .optional()
          .default("professional"),
        repurposeFrom: z.string().optional(),
        count: z.number().min(1).max(5).optional().default(3),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const charLimits: Record<string, number> = {
        twitter: 280,
        linkedin: 3000,
        instagram: 2200,
        facebook: 63206,
      };
      const limit = charLimits[input.platform];

      const systemPrompt = `You are a social media content expert for service-based business operators. 
Generate ${input.count} distinct post variations for ${input.platform} with a ${input.tone} tone.
Each post must be under ${limit} characters.
Return ONLY a JSON array of objects: [{"content": "...", "hashtags": ["...", "..."]}]
No markdown, no explanation — just the raw JSON array.`;

      const userMsg = input.repurposeFrom
        ? `Repurpose this content for ${input.platform}: "${input.repurposeFrom}"\nAdditional context: ${input.prompt}`
        : input.prompt;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: userMsg },
        ],
      });

      const raw = (response.choices[0]?.message?.content as string) ?? "[]";
      let variations: Array<{ content: string; hashtags: string[] }> = [];
      try {
        const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
        variations = Array.isArray(parsed) ? parsed : [];
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI returned invalid JSON",
        });
      }

      return { variations };
    }),
});

// ─── Content Library ──────────────────────────────────────────────────────────
const libraryRouter = router({
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    return db
      .select()
      .from(contentLibrary)
      .where(eq(contentLibrary.userId, ctx.user.id))
      .orderBy(desc(contentLibrary.createdAt));
  }),

  save: protectedProcedure
    .input(
      z.object({
        title: z.string().min(1),
        content: z.string().min(1),
        category: z
          .enum(["tips", "case_study", "promotion", "thought_leadership", "custom"])
          .optional()
          .default("custom"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [result] = await db.insert(contentLibrary).values({
        userId: ctx.user.id,
        title: input.title,
        content: input.content,
        category: input.category,
      });
      return { id: result.insertId };
    }),

  delete: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db
        .delete(contentLibrary)
        .where(
          and(
            eq(contentLibrary.id, input.id),
            eq(contentLibrary.userId, ctx.user.id)
          )
        );
      return { success: true };
    }),
});

// ─── Social Strategy ──────────────────────────────────────────────────────────
const strategyRouter = router({
  get: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const rows = await db
      .select()
      .from(socialStrategies)
      .where(eq(socialStrategies.userId, ctx.user.id))
      .orderBy(desc(socialStrategies.createdAt))
      .limit(1);
    return rows[0] ?? null;
  }),

  upsert: protectedProcedure
    .input(
      z.object({
        name: z.string().min(1).optional().default("My Content Strategy"),
        platforms: z.array(z.string()).optional().default([]),
        topics: z.array(z.string()).optional().default([]),
        tone: z
          .enum(["professional", "casual", "thought_leader", "educational"])
          .optional()
          .default("professional"),
        postsPerWeek: z.number().min(1).max(21).optional().default(5),
        isActive: z.boolean().optional().default(false),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const existing = await db
        .select()
        .from(socialStrategies)
        .where(eq(socialStrategies.userId, ctx.user.id))
        .limit(1);

      if (existing.length > 0) {
        await db
          .update(socialStrategies)
          .set(input)
          .where(eq(socialStrategies.userId, ctx.user.id));
        return { id: existing[0].id };
      } else {
        const [result] = await db.insert(socialStrategies).values({
          userId: ctx.user.id,
          ...input,
        });
        return { id: result.insertId };
      }
    }),

  generateWeeklyContent: protectedProcedure
    .input(
      z.object({
        platforms: z.array(z.string()),
        topics: z.array(z.string()),
        tone: z.enum(["professional", "casual", "thought_leader", "educational"]),
        postsPerWeek: z.number(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const systemPrompt = `You are a social media strategist for service-based business operators.
Generate a week of social media content.
Platforms: ${input.platforms.join(", ")}
Topics: ${input.topics.join(", ")}
Tone: ${input.tone}
Total posts: ${input.postsPerWeek}

Return ONLY a JSON array: [{"platform": "linkedin", "content": "...", "hashtags": ["..."], "day": "Monday"}]
No markdown, no explanation — raw JSON only.`;

      const response = await invokeLLM({
        messages: [
          { role: "system", content: systemPrompt },
          {
            role: "user",
            content: `Generate ${input.postsPerWeek} posts spread across the week for these platforms: ${input.platforms.join(", ")}`,
          },
        ],
      });

      const raw = (response.choices[0]?.message?.content as string) ?? "[]";
      let posts: Array<{
        platform: string;
        content: string;
        hashtags: string[];
        day: string;
      }> = [];
      try {
        const parsed = JSON.parse(raw.replace(/```json\n?|\n?```/g, "").trim());
        posts = Array.isArray(parsed) ? parsed : [];
      } catch {
        throw new TRPCError({
          code: "INTERNAL_SERVER_ERROR",
          message: "AI returned invalid JSON",
        });
      }

      // Save generated posts as drafts
      const db = (await getDb())!;
      for (const post of posts) {
        const platform = ["linkedin", "twitter", "instagram", "facebook"].includes(
          post.platform
        )
          ? (post.platform as "linkedin" | "twitter" | "instagram" | "facebook")
          : "linkedin";
        await db.insert(socialPosts).values({
          userId: ctx.user.id,
          platform,
          content: post.content,
          hashtags: post.hashtags ?? [],
          status: "pending_approval",
          aiGenerated: true,
          approvalStatus: "pending",
        });
      }

      // Update lastGeneratedAt
      await db
        .update(socialStrategies)
        .set({ lastGeneratedAt: new Date() })
        .where(eq(socialStrategies.userId, ctx.user.id));

      return { count: posts.length, posts };
    }),
});

// ─── Main Social Router ───────────────────────────────────────────────────────
export const socialRouter = router({
  accounts: accountsRouter,
  posts: postsRouter,
  library: libraryRouter,
  strategy: strategyRouter,
});
