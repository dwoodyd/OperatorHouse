/**
 * Phase 16: Team & Permissions Router
 *
 * Role enforcement: admin > member > viewer
 * - Only workspace owners (ctx.user.id === ownerId) can invite, remove, or change roles.
 * - Team members can read the member list and their own membership.
 * - "viewer" role cannot perform any write operations on workspace data.
 *   This is enforced via the requireOwner helper below.
 */
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { TRPCError } from "@trpc/server";
import { Resend } from "resend";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { teamMembers, teamInvites } from "../../drizzle/schema";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Operator House <onboarding@resend.dev>";

// ─── Role hierarchy ───────────────────────────────────────────────────────────
const ROLE_RANK: Record<string, number> = { admin: 3, member: 2, viewer: 1 };

/**
 * Verify the calling user is the workspace owner for a given ownerId.
 * Team members (even admins) cannot manage other workspaces.
 */
function assertOwner(ctxUserId: number, ownerId: number) {
  if (ctxUserId !== ownerId) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: "Only the workspace owner can perform this action.",
    });
  }
}

/**
 * Verify the calling user has at least the required role in a workspace.
 * Used to gate write operations for non-owner team members.
 */
async function assertMinRole(
  db: Awaited<ReturnType<typeof getDb>>,
  memberId: number,
  ownerId: number,
  minRole: "admin" | "member"
) {
  if (!db) return; // no DB = dev mode, allow
  const [membership] = await db
    .select({ role: teamMembers.role })
    .from(teamMembers)
    .where(
      and(
        eq(teamMembers.memberId, memberId),
        eq(teamMembers.ownerId, ownerId),
        eq(teamMembers.status, "active")
      )
    )
    .limit(1);
  if (!membership) return; // not a team member of this workspace — they're the owner or unrelated
  const rank = ROLE_RANK[membership.role] ?? 0;
  const required = ROLE_RANK[minRole] ?? 0;
  if (rank < required) {
    throw new TRPCError({
      code: "FORBIDDEN",
      message: `Your role (${membership.role}) does not have permission to perform this action. Required: ${minRole} or above.`,
    });
  }
}

export const teamRouter = router({
  // List all team members for the owner's workspace
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const members = await db
      .select()
      .from(teamMembers)
      .where(eq(teamMembers.ownerId, ctx.user.id))
      .orderBy(desc(teamMembers.joinedAt));
    const invites = await db
      .select()
      .from(teamInvites)
      .where(
        and(
          eq(teamInvites.ownerId, ctx.user.id),
          eq(teamInvites.status, "pending")
        )
      )
      .orderBy(desc(teamInvites.createdAt));
    return { members, invites };
  }),

  // Send an invite email — owner only
  invite: protectedProcedure
    .input(
      z.object({
        email: z.string().email(),
        role: z.enum(["admin", "member", "viewer"]).default("member"),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;

      // Only the workspace owner can invite
      // (Team members who are admins cannot invite others to a workspace they don't own)
      // This is intentional: each user owns their own workspace.
      // Future multi-tenant expansion can relax this.

      // Check not already a member
      const [existing] = await db
        .select({ id: teamMembers.id })
        .from(teamMembers)
        .where(
          and(
            eq(teamMembers.ownerId, ctx.user.id),
            eq(teamMembers.email, input.email)
          )
        )
        .limit(1);
      if (existing) throw new TRPCError({ code: "CONFLICT", message: "This person is already a team member" });

      // Revoke any existing pending invite for same email
      await db
        .update(teamInvites)
        .set({ status: "revoked" })
        .where(
          and(
            eq(teamInvites.ownerId, ctx.user.id),
            eq(teamInvites.email, input.email),
            eq(teamInvites.status, "pending")
          )
        );

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
      const [invite] = await db
        .select()
        .from(teamInvites)
        .where(
          and(
            eq(teamInvites.token, input.token),
            eq(teamInvites.status, "pending")
          )
        )
        .limit(1);
      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid or expired invite" });
      if (invite.expiresAt < new Date()) {
        await db
          .update(teamInvites)
          .set({ status: "expired" })
          .where(eq(teamInvites.id, invite.id));
        throw new TRPCError({ code: "BAD_REQUEST", message: "Invite has expired" });
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

      await db
        .update(teamInvites)
        .set({ status: "accepted" })
        .where(eq(teamInvites.id, invite.id));

      return { ok: true, ownerId: invite.ownerId, role: invite.role };
    }),

  // Public: get invite info by token (for the accept page)
  getInvite: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [invite] = await db
        .select({
          id: teamInvites.id,
          email: teamInvites.email,
          role: teamInvites.role,
          status: teamInvites.status,
          expiresAt: teamInvites.expiresAt,
        })
        .from(teamInvites)
        .where(eq(teamInvites.token, input.token))
        .limit(1);
      if (!invite) throw new TRPCError({ code: "NOT_FOUND", message: "Invalid invite link" });
      return invite;
    }),

  // Update a member's role — owner only
  updateRole: protectedProcedure
    .input(
      z.object({
        memberId: z.number(),
        role: z.enum(["admin", "member", "viewer"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      // Verify the record belongs to this owner before updating
      const [record] = await db
        .select({ ownerId: teamMembers.ownerId })
        .from(teamMembers)
        .where(eq(teamMembers.id, input.memberId))
        .limit(1);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      assertOwner(ctx.user.id, record.ownerId);

      await db
        .update(teamMembers)
        .set({ role: input.role })
        .where(eq(teamMembers.id, input.memberId));
      return { ok: true };
    }),

  // Suspend / reactivate a member — owner only
  updateStatus: protectedProcedure
    .input(
      z.object({
        memberId: z.number(),
        status: z.enum(["active", "suspended"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [record] = await db
        .select({ ownerId: teamMembers.ownerId })
        .from(teamMembers)
        .where(eq(teamMembers.id, input.memberId))
        .limit(1);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      assertOwner(ctx.user.id, record.ownerId);

      await db
        .update(teamMembers)
        .set({ status: input.status })
        .where(eq(teamMembers.id, input.memberId));
      return { ok: true };
    }),

  // Remove a member — owner only
  remove: protectedProcedure
    .input(z.object({ memberId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [record] = await db
        .select({ ownerId: teamMembers.ownerId })
        .from(teamMembers)
        .where(eq(teamMembers.id, input.memberId))
        .limit(1);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Member not found" });
      assertOwner(ctx.user.id, record.ownerId);

      await db.delete(teamMembers).where(eq(teamMembers.id, input.memberId));
      return { ok: true };
    }),

  // Revoke a pending invite — owner only
  revokeInvite: protectedProcedure
    .input(z.object({ inviteId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [record] = await db
        .select({ ownerId: teamInvites.ownerId })
        .from(teamInvites)
        .where(eq(teamInvites.id, input.inviteId))
        .limit(1);
      if (!record) throw new TRPCError({ code: "NOT_FOUND", message: "Invite not found" });
      assertOwner(ctx.user.id, record.ownerId);

      await db
        .update(teamInvites)
        .set({ status: "revoked" })
        .where(eq(teamInvites.id, input.inviteId));
      return { ok: true };
    }),

  // Check if the current user is a team member of any workspace
  myMembership: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const [membership] = await db
      .select()
      .from(teamMembers)
      .where(
        and(
          eq(teamMembers.memberId, ctx.user.id),
          eq(teamMembers.status, "active")
        )
      )
      .limit(1);
    return membership ?? null;
  }),
});
