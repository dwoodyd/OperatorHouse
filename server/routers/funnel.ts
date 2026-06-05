/**
 * Funnel Router — User acquisition flow
 * Handles: application form submission, invite code generation/validation/redemption
 * Admin-only: generate codes, list codes, list applications, approve/reject
 */
import { z } from "zod";
import { ENV } from "../_core/env";
import { TRPCError } from "@trpc/server";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import { inviteCodes, applications, users } from "../../drizzle/schema";
import { eq, isNull, desc } from "drizzle-orm";
import { notifyOwner } from "../_core/notification";
import { Resend } from "resend";

const resend = new Resend(ENV.resendApiKey);
const SPECTER_FROM = "Specter <specter@mail.operatorhouse.click>";
const REPLY_TO = "dewayne@operatorhouse.click";
const APP_URL = ENV.publicUrl || "https://app.operatorhouse.click";

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

// ── Email templates ───────────────────────────────────────────────────────────

function template1Html(name: string): string {
  return `
    <div style="font-family:DM Sans,sans-serif;background:#08080D;color:#E8E4D9;padding:40px 32px;max-width:560px;margin:0 auto;border-radius:8px;">
      <p style="font-family:Fira Code,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(245,166,35,0.6);margin-bottom:8px;">Specter · Operator House</p>
      <h1 style="font-family:Playfair Display,serif;font-size:28px;font-weight:700;color:#E8E4D9;margin:0 0 28px;">Application received.</h1>
      <p style="font-size:15px;line-height:1.7;color:rgba(232,228,217,0.8);">Hi ${name},</p>
      <p style="font-size:15px;line-height:1.7;color:rgba(232,228,217,0.8);">Your founding member application landed in my queue.</p>
      <p style="font-size:15px;line-height:1.7;color:rgba(232,228,217,0.8);">Operator House is invitation-only. We're inviting 100 operators total — across 4 cohorts of 25 — to lock in the founding rate for life. We're not filtering for credentials. We're looking for solo operators who actually run a practice, who already know the gap between enterprise CRM bloat and the reality of one-person operations.</p>
      <div style="border-top:1px solid rgba(245,166,35,0.15);margin:28px 0;padding-top:24px;">
        <p style="font-family:Fira Code,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(245,166,35,0.5);margin-bottom:12px;">WHAT HAPPENS NEXT</p>
        <p style="font-size:15px;line-height:1.7;color:rgba(232,228,217,0.8);">DeWayne reviews every application personally. You'll hear back within 48 hours with one of two answers: an invite code with your founding seat, or a note that says we're holding your application for the next cohort.</p>
        <p style="font-size:15px;line-height:1.7;color:rgba(232,228,217,0.8);">If anything comes to mind in the meantime — a question about how I'd fit into your workflow, or something you forgot to mention — reply to this email. Goes to a real inbox.</p>
      </div>
      <p style="font-size:15px;line-height:1.7;color:rgba(232,228,217,0.8);">Ready when you are.</p>
      <p style="font-size:15px;color:rgba(232,228,217,0.6);font-style:italic;">— Specter</p>
      <div style="border-top:1px solid rgba(255,255,255,0.06);margin-top:32px;padding-top:16px;">
        <p style="font-size:11px;color:rgba(232,228,217,0.3);">Specter · operatorhouse.click. You're receiving this because you applied for a founding seat. If that wasn't you, you can ignore this — no further emails will follow.</p>
      </div>
    </div>
  `;
}

function template2Html(name: string, code: string, inviteUrl: string): string {
  return `
    <div style="font-family:DM Sans,sans-serif;background:#08080D;color:#E8E4D9;padding:40px 32px;max-width:560px;margin:0 auto;border-radius:8px;">
      <p style="font-family:Fira Code,monospace;font-size:10px;letter-spacing:0.2em;text-transform:uppercase;color:rgba(245,166,35,0.6);margin-bottom:8px;">Specter · Operator House</p>
      <h1 style="font-family:Playfair Display,serif;font-size:28px;font-weight:700;color:#E8E4D9;margin:0 0 28px;">You're in.</h1>
      <p style="font-size:15px;line-height:1.7;color:rgba(232,228,217,0.8);">Hi ${name},</p>
      <p style="font-size:15px;line-height:1.7;color:rgba(232,228,217,0.8);">I read your application. You're approved for the founding cohort.</p>
      <p style="font-size:15px;line-height:1.7;color:rgba(232,228,217,0.8);">Your founding rate is locked for life — even when retail moves up. Here's what you're locking in:</p>
      <ul style="font-size:15px;line-height:1.8;color:rgba(232,228,217,0.8);padding-left:20px;">
        <li><strong>Operator</strong> (Core Intelligence Suite): <strong>$399/yr</strong> — <em>retail will be $97/mo or $797/yr.</em> Includes Lead Intelligence, Client Pipeline, Strategy Generator, The Vault, Tasks, Daily Briefings.</li>
        <li><strong>Operator Pro</strong> (Full Outreach Suite): <strong>$99/mo</strong> — <em>retail $197/mo.</em> Adds Client Pulse, SMS Outreach, Call Center + AI Scripts, Email Sequences, Voice Agents.</li>
      </ul>
      <p style="font-size:15px;line-height:1.7;color:rgba(232,228,217,0.8);">During the 90-day beta, you have full Operator Pro access — every module unlocked, no preview limits. We do ask you to set up a card on file when you sign in. <strong>You won't be charged during the beta.</strong> At day 91, your locked founding rate kicks in.</p>
      <div style="border-top:1px solid rgba(245,166,35,0.15);margin:28px 0;padding-top:24px;">
        <p style="font-size:15px;line-height:1.7;color:rgba(232,228,217,0.8);">One click below opens Operator House. The first time you sign in, I'll walk you through what's where.</p>
        <a href="${inviteUrl}" style="display:inline-block;margin:16px 0;padding:14px 32px;background:linear-gradient(135deg,#F5A623 0%,#E8940F 100%);border-radius:6px;color:#0A0A0B;font-size:15px;font-weight:700;text-decoration:none;">Sign in to Operator House →</a>
        <p style="font-size:13px;color:rgba(232,228,217,0.5);">If the button doesn't work, your code is <strong style="color:#F5A623;font-family:Fira Code,monospace;">${code}</strong> — enter it at <a href="${APP_URL}" style="color:#F5A623;">app.operatorhouse.click</a>.</p>
      </div>
      <div style="border-top:1px solid rgba(255,255,255,0.06);margin-top:8px;padding-top:16px;">
        <p style="font-size:13px;line-height:1.7;color:rgba(232,228,217,0.5);">A few things worth knowing:</p>
        <ul style="font-size:13px;line-height:1.8;color:rgba(232,228,217,0.5);padding-left:20px;">
          <li>Operator House is a Progressive Web App. After your first sign-in, install it to your home screen on iOS, Android, or desktop.</li>
          <li><strong>Start by adding one lead.</strong> I'll run the audit, draft the strategy, and prepare the first briefing while you watch.</li>
          <li>If something looks off or could be sharper, reply to this email. Goes to a real inbox.</li>
        </ul>
      </div>
      <p style="font-size:15px;line-height:1.7;color:rgba(232,228,217,0.8);margin-top:24px;">Let's get to work.</p>
      <p style="font-size:15px;color:rgba(232,228,217,0.6);font-style:italic;">— DeWayne &amp; Specter</p>
      <div style="border-top:1px solid rgba(255,255,255,0.06);margin-top:32px;padding-top:16px;">
        <p style="font-size:11px;color:rgba(232,228,217,0.3);">Specter · operatorhouse.click. This invite is unique to you. It expires in 30 days.</p>
      </div>
    </div>
  `;
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

      // Template 1 — In Queue confirmation to applicant (fire-and-forget)
      resend.emails.send({
        from: SPECTER_FROM,
        replyTo: REPLY_TO,
        to: input.email,
        subject: "You're in the queue — Operator House founding cohort",
        html: template1Html(input.name),
      }).catch((err) => console.error("[Funnel] Template 1 send error:", err));

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

      // Generate a code with 30-day expiry
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

      const expiresAt = new Date(Date.now() + 30 * 86_400_000); // 30 days
      const [inserted] = await db.insert(inviteCodes).values({
        code,
        label: app.email,
        expiresAt,
        createdByUserId: ctx.user.id,
      }).$returningId();

      await db
        .update(applications)
        .set({ status: "approved", inviteCodeId: inserted.id })
        .where(eq(applications.id, input.applicationId));

      // Template 2 — Approval email with magic link (fire-and-forget)
      const inviteUrl = `${APP_URL}/invite/${code}`;
      resend.emails.send({
        from: SPECTER_FROM,
        replyTo: REPLY_TO,
        to: app.email,
        subject: "Your founding seat is ready",
        html: template2Html(app.name, code, inviteUrl),
      }).catch((err) => console.error("[Funnel] Template 2 send error:", err));

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
