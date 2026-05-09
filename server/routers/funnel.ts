/**
 * Funnel Router — User acquisition flow
 * Handles: application form submission, invite code generation/validation/redemption
 * Admin-only: generate codes, list codes, list applications, approve/reject
 */
import { z } from "zod";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { inviteCodes, applications, users } from "../../drizzle/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";

// ── Helpers ──────────────────────────────────────────────────────────────────

function generateCode(): string {
  const chars = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789"; // no O/0/I/1 to avoid confusion
  let code = "OH-";
  for (let i = 0; i < 8; i++) {
    code += chars[Math.floor(Math.random() * chars.length)];
  }
  return code;
}

function isAdminUser(user: { role?: string }): boolean {
  return user.role === "admin";
}

// ── Router ───────────────────────────────────────────────────────────────────

export const funnelRouter = router({
  // ── Public: submit application ─────────────────────────────────────────────
  submitApplication: publicProcedure
    .input(z.object({
      name: z.string().min(2).max(255),
      email: z.string().email().max(320),
      reason: z.string().min(10).max(2000),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      // Prevent duplicate applications from same email
      const existing = await db
        .select({ id: applications.id })
        .from(applications)
        .where(eq(applications.email, input.email))
        .limit(1);

      if (existing.length > 0) {
        throw new TRPCError({
          code: "CONFLICT",
          message: "An application from this email already exists.",
        });
      }

      await db.insert(applications).values({
        name: input.name,
        email: input.email,
        reason: input.reason,
        status: "pending",
      });

      // Notify owner
      await notifyOwner({
        title: "New Operator House Application",
        content: `**${input.name}** (${input.email}) just applied.\n\n> ${input.reason.slice(0, 200)}${input.reason.length > 200 ? "…" : ""}`,
      }).catch(() => {}); // fire-and-forget

      return { success: true };
    }),

  // ── Public: validate invite code (check if valid before OAuth) ─────────────
  validateCode: publicProcedure
    .input(z.object({ code: z.string().min(1).max(32) }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const normalised = input.code.trim().toUpperCase();

      const [row] = await db
        .select()
        .from(inviteCodes)
        .where(eq(inviteCodes.code, normalised))
        .limit(1);

      if (!row) return { valid: false, reason: "Code not found." };
      if (row.redeemedByUserId) return { valid: false, reason: "Code has already been used." };
      if (row.expiresAt && row.expiresAt < new Date()) return { valid: false, reason: "Code has expired." };

      return { valid: true, label: row.label ?? null };
    }),

  // ── Protected: redeem invite code (called after OAuth, marks code as used) ─
  redeemCode: protectedProcedure
    .input(z.object({ code: z.string().min(1).max(32) }))
    .mutation(async ({ input, ctx }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const normalised = input.code.trim().toUpperCase();

      const [row] = await db
        .select()
        .from(inviteCodes)
        .where(eq(inviteCodes.code, normalised))
        .limit(1);

      if (!row) throw new TRPCError({ code: "NOT_FOUND", message: "Code not found." });
      if (row.redeemedByUserId) throw new TRPCError({ code: "CONFLICT", message: "Code has already been used." });
      if (row.expiresAt && row.expiresAt < new Date()) throw new TRPCError({ code: "BAD_REQUEST", message: "Code has expired." });

      await db
        .update(inviteCodes)
        .set({ redeemedByUserId: ctx.user.id, redeemedAt: new Date() })
        .where(eq(inviteCodes.id, row.id));

      return { success: true };
    }),

  // ── Admin: generate one or more invite codes ───────────────────────────────
  generateCodes: protectedProcedure
    .input(z.object({
      count: z.number().int().min(1).max(50).default(1),
      label: z.string().max(255).optional(),
      expiresInDays: z.number().int().min(1).max(365).optional(),
    }))
    .mutation(async ({ input, ctx }) => {
      if (!isAdminUser(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only." });
      }

      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 86_400_000)
        : undefined;

      const codes: string[] = [];
      for (let i = 0; i < input.count; i++) {
        let code: string;
        // Ensure uniqueness
        let attempts = 0;
        do {
          code = generateCode();
          attempts++;
          if (attempts > 20) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not generate unique code." });
          const [existing] = await db
            .select({ id: inviteCodes.id })
            .from(inviteCodes)
            .where(eq(inviteCodes.code, code))
            .limit(1);
          if (!existing) break;
        } while (true);

        await db.insert(inviteCodes).values({
          code,
          label: input.label ?? null,
          expiresAt: expiresAt ?? null,
          createdByUserId: ctx.user.id,
        });
        codes.push(code);
      }

      return { codes };
    }),

  // ── Admin: list all invite codes ───────────────────────────────────────────
  listCodes: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdminUser(ctx.user)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin only." });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const rows = await db
      .select()
      .from(inviteCodes)
      .orderBy(desc(inviteCodes.createdAt));
    return rows;
  }),

  // ── Admin: list all applications ───────────────────────────────────────────
  listApplications: protectedProcedure.query(async ({ ctx }) => {
    if (!isAdminUser(ctx.user)) {
      throw new TRPCError({ code: "FORBIDDEN", message: "Admin only." });
    }
    const db = await getDb();
    if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
    const rows = await db
      .select()
      .from(applications)
      .orderBy(desc(applications.createdAt));
    return rows;
  }),

  // ── Admin: approve application (generates a code and marks application approved) ─
  approveApplication: protectedProcedure
    .input(z.object({ applicationId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      if (!isAdminUser(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });

      const [app] = await db
        .select()
        .from(applications)
        .where(eq(applications.id, input.applicationId))
        .limit(1);

      if (!app) throw new TRPCError({ code: "NOT_FOUND", message: "Application not found." });

      // Generate a code
      let code: string;
      let attempts = 0;
      do {
        code = generateCode();
        attempts++;
        if (attempts > 20) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "Could not generate unique code." });
        const [existing] = await db
          .select({ id: inviteCodes.id })
          .from(inviteCodes)
          .where(eq(inviteCodes.code, code))
          .limit(1);
        if (!existing) break;
      } while (true);

      const [inserted] = await db.insert(inviteCodes).values({
        code,
        label: app.email,
        createdByUserId: ctx.user.id,
      }).$returningId();

      await db
        .update(applications)
        .set({ status: "approved", inviteCodeId: inserted.id })
        .where(eq(applications.id, input.applicationId));

      return { code, applicationEmail: app.email, applicantName: app.name };
    }),

  // ── Admin: reject application ──────────────────────────────────────────────
  rejectApplication: protectedProcedure
    .input(z.object({ applicationId: z.number().int() }))
    .mutation(async ({ input, ctx }) => {
      if (!isAdminUser(ctx.user)) {
        throw new TRPCError({ code: "FORBIDDEN", message: "Admin only." });
      }
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR", message: "DB unavailable" });
      await db
        .update(applications)
        .set({ status: "rejected" })
        .where(eq(applications.id, input.applicationId));
      return { success: true };
    }),
});
