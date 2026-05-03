/**
 * Phase 16: Team & Permissions Router
 */
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { teamMembers, teamInvites, users } from "../../drizzle/schema";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Operator House <onboarding@resend.dev>";

// ─── Role hierarchy ───────────────────────────────────────────────────────────
const ROLE_RANK: Record<string, number> = { admin: 3, member: 2, viewer: 1 };

export const teamRouter = router({
  // List all team members for the owner's workspace
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const members = await db.select().from(teamMembers)
      .where(eq(teamMembers.ownerId, ctx.user.id))
      .orderBy(desc(teamMembers.joinedAt));
    const invites = await db.select().from(teamInvites)
      .where(and(eq(teamInvites.ownerId, ctx.user.id), eq(teamInvites.status, "pending")))
      .orderBy(desc(teamInvites.createdAt));
    return { members, invites };
  }),

  // Send an invite email
  invite: protectedProcedure
    .input(z.object({
      email: z.string().email(),
      role: z.enum(["admin", "member", "viewer"]).default("member"),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;

      // Check not already a member
      const [existing] = await db.select({ id: teamMembers.id })
        .from(teamMembers)
        .where(and(eq(teamMembers.ownerId, ctx.user.id), eq(teamMembers.email, input.email)))
        .limit(1);
      if (existing) throw new Error("This person is already a team member");

      // Revoke any existing pending invite for same email
      await db.update(teamInvites).set({ status: "revoked" })
        .where(and(
          eq(teamInvites.ownerId, ctx.user.id),
          eq(teamInvites.email, input.email),
          eq(teamInvites.status, "pending"),
        ));

      const token = randomBytes(32).toString("hex");
      const expiresAt = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000); // 7 days

      await db.insert(teamInvites).values({
        ownerId: ctx.user.id,
        email: input.email,
        role: input.role,
        token,
        status: "pending",
        expiresAt,
      });

      const inviteUrl = `${ENV.publicUrl}/join-team/${token}`;

      try {
        await resend.emails.send({
          from: FROM,
          to: input.email,
          subject: `You've been invited to join Operator House`,
          text: `You've been invited to join a workspace on Operator House as a ${input.role}.\n\nAccept your invitation here: ${inviteUrl}\n\nThis link expires in 7 days.`,
        });
      } catch (err) {
        console.error("[Team] Invite email error:", err);
      }

      return { ok: true, token };
    }),

  // Accept an invite (called after user logs in)
  acceptInvite: protectedProcedure
    .input(z.object({ token: z.string() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [invite] = await db.select().from(teamInvites)
        .where(and(eq(teamInvites.token, input.token), eq(teamInvites.status, "pending")))
        .limit(1);
      if (!invite) throw new Error("Invalid or expired invite");
      if (invite.expiresAt < new Date()) {
        await db.update(teamInvites).set({ status: "expired" }).where(eq(teamInvites.id, invite.id));
        throw new Error("Invite has expired");
      }

      // Add as team member
      await db.insert(teamMembers).values({
        ownerId: invite.ownerId,
        memberId: ctx.user.id,
        role: invite.role,
        name: ctx.user.name,
        email: ctx.user.email ?? invite.email,
        status: "active",
      });

      await db.update(teamInvites).set({ status: "accepted" }).where(eq(teamInvites.id, invite.id));

      return { ok: true, ownerId: invite.ownerId, role: invite.role };
    }),

  // Public: get invite info by token (for the accept page)
  getInvite: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [invite] = await db.select({
        id: teamInvites.id,
        email: teamInvites.email,
        role: teamInvites.role,
        status: teamInvites.status,
        expiresAt: teamInvites.expiresAt,
      }).from(teamInvites)
        .where(eq(teamInvites.token, input.token))
        .limit(1);
      if (!invite) throw new Error("Invalid invite link");
      return invite;
    }),

  // Update a member's role
  updateRole: protectedProcedure
    .input(z.object({
      memberId: z.number(),
      role: z.enum(["admin", "member", "viewer"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.update(teamMembers).set({ role: input.role })
        .where(and(eq(teamMembers.id, input.memberId), eq(teamMembers.ownerId, ctx.user.id)));
      return { ok: true };
    }),

  // Suspend / reactivate a member
  updateStatus: protectedProcedure
    .input(z.object({
      memberId: z.number(),
      status: z.enum(["active", "suspended"]),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.update(teamMembers).set({ status: input.status })
        .where(and(eq(teamMembers.id, input.memberId), eq(teamMembers.ownerId, ctx.user.id)));
      return { ok: true };
    }),

  // Remove a member
  remove: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.delete(teamMembers)
        .where(and(eq(teamMembers.id, input.memberId), eq(teamMembers.ownerId, ctx.user.id)));
      return { ok: true };
    }),

  // Revoke a pending invite
  revokeInvite: protectedProcedure
    .input(z.object({ inviteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.update(teamInvites).set({ status: "revoked" })
        .where(and(eq(teamInvites.id, input.inviteId), eq(teamInvites.ownerId, ctx.user.id)));
      return { ok: true };
    }),

  // Check if the current user is a team member of any workspace
  myMembership: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const [membership] = await db.select().from(teamMembers)
      .where(and(eq(teamMembers.memberId, ctx.user.id), eq(teamMembers.status, "active")))
      .limit(1);
    return membership ?? null;
  }),
});
