/**
 * Phase 13: Client Portal Router
 * - Portal access management (create, revoke, list)
 * - Portal messaging (operator ↔ client)
 * - Portal documents
 * - Booking email reminders via Resend
 * - Public portal endpoint (token-based, no auth)
 */
import { z } from "zod";
import { eq, and, desc } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { getDb } from "../db";
import {
  clientPortals,
  portalMessages,
  portalDocuments,
  bookingEmailLogs,
  crmContacts,
  bookings,
  meetingTypes,
  invoices,
} from "../../drizzle/schema";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Operator House <onboarding@resend.dev>";

// ─── Email helpers ────────────────────────────────────────────────────────────
async function sendBookingEmail(
  type: "confirmation" | "reminder_24h" | "reminder_1h" | "cancellation" | "reschedule",
  to: string,
  data: {
    guestName: string;
    meetingTitle: string;
    startTime: Date;
    location?: string | null;
    operatorName?: string;
    portalUrl?: string;
  }
) {
  const db = await getDb();
  if (!db) return;

  const timeStr = data.startTime.toLocaleString("en-US", {
    weekday: "long",
    month: "long",
    day: "numeric",
    year: "numeric",
    hour: "numeric",
    minute: "2-digit",
    timeZoneName: "short",
  });

  const subjects: Record<string, string> = {
    confirmation: `Confirmed: ${data.meetingTitle}`,
    reminder_24h: `Reminder: ${data.meetingTitle} tomorrow`,
    reminder_1h: `Starting soon: ${data.meetingTitle} in 1 hour`,
    cancellation: `Cancelled: ${data.meetingTitle}`,
    reschedule: `Rescheduled: ${data.meetingTitle}`,
  };

  const bodies: Record<string, string> = {
    confirmation: `Hi ${data.guestName},\n\nYour meeting has been confirmed.\n\n📅 ${data.meetingTitle}\n🕐 ${timeStr}${data.location ? `\n📍 ${data.location}` : ""}\n\n${data.portalUrl ? `View your client portal: ${data.portalUrl}` : ""}`,
    reminder_24h: `Hi ${data.guestName},\n\nJust a reminder that your meeting is tomorrow.\n\n📅 ${data.meetingTitle}\n🕐 ${timeStr}${data.location ? `\n📍 ${data.location}` : ""}`,
    reminder_1h: `Hi ${data.guestName},\n\nYour meeting starts in 1 hour.\n\n📅 ${data.meetingTitle}\n🕐 ${timeStr}${data.location ? `\n📍 ${data.location}` : ""}`,
    cancellation: `Hi ${data.guestName},\n\nYour meeting has been cancelled.\n\n📅 ${data.meetingTitle}\n🕐 ${timeStr}\n\nPlease reach out to reschedule.`,
    reschedule: `Hi ${data.guestName},\n\nYour meeting has been rescheduled.\n\n📅 ${data.meetingTitle}\n🕐 ${timeStr}${data.location ? `\n📍 ${data.location}` : ""}`,
  };

  try {
    await resend.emails.send({
      from: FROM,
      to,
      subject: subjects[type],
      text: bodies[type],
    });
    // Log success (best-effort, no bookingId needed for direct calls)
  } catch (err) {
    console.error(`[Portal] Email send failed (${type}):`, err);
  }
}

export const portalRouter = router({
  // ─── Specter: list portals ───────────────────────────────────────────────
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const portals = await db
      .select()
      .from(clientPortals)
      .where(eq(clientPortals.userId, ctx.user.id))
      .orderBy(desc(clientPortals.createdAt));

    // Enrich with contact info
    const enriched = await Promise.all(
      portals.map(async (p) => {
        const [contact] = await db
          .select({ firstName: crmContacts.firstName, lastName: crmContacts.lastName, email: crmContacts.email, companyId: crmContacts.companyId })
          .from(crmContacts)
          .where(eq(crmContacts.id, p.contactId))
          .limit(1);
        const msgCount = await db
          .select()
          .from(portalMessages)
          .where(eq(portalMessages.portalId, p.id));
        const unread = msgCount.filter((m) => m.senderType === "client" && !m.readAt).length;
        return { ...p, contact: contact ?? null, unreadMessages: unread };
      })
    );
    return enriched;
  }),

  // ─── Specter: create portal for a contact ───────────────────────────────
  create: protectedProcedure
    .input(
      z.object({
        contactId: z.number(),
        allowInvoices: z.boolean().default(true),
        allowBooking: z.boolean().default(true),
        allowMessages: z.boolean().default(true),
        allowContracts: z.boolean().default(false),
        expiresInDays: z.number().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const token = randomBytes(32).toString("hex");
      const expiresAt = input.expiresInDays
        ? new Date(Date.now() + input.expiresInDays * 86400000)
        : null;
      const [result] = await db.insert(clientPortals).values({
        userId: ctx.user.id,
        contactId: input.contactId,
        accessToken: token,
        allowInvoices: input.allowInvoices,
        allowBooking: input.allowBooking,
        allowMessages: input.allowMessages,
        allowContracts: input.allowContracts,
        expiresAt: expiresAt ?? undefined,
      });
      return { id: (result as any).insertId as number, accessToken: token };
    }),

  // ─── Specter: revoke portal ──────────────────────────────────────────────
  revoke: protectedProcedure
    .input(z.object({ id: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db
        .update(clientPortals)
        .set({ status: "revoked" })
        .where(and(eq(clientPortals.id, input.id), eq(clientPortals.userId, ctx.user.id)));
      return { ok: true };
    }),

  // ─── Specter: get messages for a portal ─────────────────────────────────
  getMessages: protectedProcedure
    .input(z.object({ portalId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      // Verify ownership
      const [portal] = await db
        .select()
        .from(clientPortals)
        .where(and(eq(clientPortals.id, input.portalId), eq(clientPortals.userId, ctx.user.id)))
        .limit(1);
      if (!portal) throw new Error("Portal not found");
      // Mark client messages as read
      await db
        .update(portalMessages)
        .set({ readAt: new Date() })
        .where(
          and(
            eq(portalMessages.portalId, input.portalId),
            eq(portalMessages.senderType, "client")
          )
        );
      return db
        .select()
        .from(portalMessages)
        .where(eq(portalMessages.portalId, input.portalId))
        .orderBy(portalMessages.createdAt);
    }),

  // ─── Specter: send message to client ────────────────────────────────────
  sendMessage: protectedProcedure
    .input(z.object({ portalId: z.number(), content: z.string().min(1) }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [portal] = await db
        .select()
        .from(clientPortals)
        .where(and(eq(clientPortals.id, input.portalId), eq(clientPortals.userId, ctx.user.id)))
        .limit(1);
      if (!portal) throw new Error("Portal not found");
      await db.insert(portalMessages).values({
        portalId: input.portalId,
        senderType: "operator",
        content: input.content,
      });
      return { ok: true };
    }),

  // ─── Specter: add document to portal ────────────────────────────────────
  addDocument: protectedProcedure
    .input(
      z.object({
        portalId: z.number(),
        title: z.string().min(1),
        type: z.enum(["invoice", "contract", "proposal", "report", "other"]),
        fileUrl: z.string().optional(),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      await db.insert(portalDocuments).values({
        portalId: input.portalId,
        userId: ctx.user.id,
        title: input.title,
        type: input.type,
        fileUrl: input.fileUrl,
      });
      return { ok: true };
    }),

  // ─── Public: access portal by token ──────────────────────────────────────
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [portal] = await db
        .select()
        .from(clientPortals)
        .where(and(eq(clientPortals.accessToken, input.token), eq(clientPortals.status, "active")))
        .limit(1);
      if (!portal) throw new Error("Invalid or expired portal link");
      if (portal.expiresAt && portal.expiresAt < new Date()) throw new Error("Portal link has expired");

      // Update last accessed
      await db
        .update(clientPortals)
        .set({ lastAccessedAt: new Date() })
        .where(eq(clientPortals.id, portal.id));

      const [contact] = await db
        .select()
        .from(crmContacts)
        .where(eq(crmContacts.id, portal.contactId))
        .limit(1);

      const messages = await db
        .select()
        .from(portalMessages)
        .where(eq(portalMessages.portalId, portal.id))
        .orderBy(portalMessages.createdAt);

      const documents = await db
        .select()
        .from(portalDocuments)
        .where(eq(portalDocuments.portalId, portal.id))
        .orderBy(desc(portalDocuments.createdAt));

      return {
        portal: {
          id: portal.id,
          allowInvoices: portal.allowInvoices,
          allowBooking: portal.allowBooking,
          allowMessages: portal.allowMessages,
          allowContracts: portal.allowContracts,
        },
        contact: contact ?? null,
        messages,
        documents,
      };
    }),

  // ─── Public: client sends message ────────────────────────────────────────
  clientSendMessage: publicProcedure
    .input(z.object({ token: z.string(), content: z.string().min(1) }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [portal] = await db
        .select()
        .from(clientPortals)
        .where(and(eq(clientPortals.accessToken, input.token), eq(clientPortals.status, "active")))
        .limit(1);
      if (!portal) throw new Error("Invalid portal");
      await db.insert(portalMessages).values({
        portalId: portal.id,
        senderType: "client",
        content: input.content,
      });
      return { ok: true };
    }),

  // ─── Booking email: send confirmation ────────────────────────────────────
  sendBookingConfirmation: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [booking] = await db
        .select()
        .from(bookings)
        .where(and(eq(bookings.id, input.bookingId), eq(bookings.userId, ctx.user.id)))
        .limit(1);
      if (!booking) throw new Error("Booking not found");
      if (!booking.bookedByEmail) throw new Error("No guest email on booking");

      const [mt] = await db
        .select()
        .from(meetingTypes)
        .where(eq(meetingTypes.id, booking.meetingTypeId))
        .limit(1);

      await sendBookingEmail("confirmation", booking.bookedByEmail, {
        guestName: booking.bookedByName,
        meetingTitle: mt?.name ?? "Meeting",
        startTime: booking.startTime,
        
      });

      await db.insert(bookingEmailLogs).values({
        bookingId: booking.id,
        type: "confirmation",
        sentTo: booking.bookedByEmail,
        status: "sent",
      });

      return { ok: true };
    }),

  // ─── Booking email: send reminder ─────────────────────────────────────────
  sendBookingReminder: protectedProcedure
    .input(
      z.object({
        bookingId: z.number(),
        type: z.enum(["reminder_24h", "reminder_1h"]),
      })
    )
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [booking] = await db
        .select()
        .from(bookings)
        .where(and(eq(bookings.id, input.bookingId), eq(bookings.userId, ctx.user.id)))
        .limit(1);
      if (!booking) throw new Error("Booking not found");
      if (!booking.bookedByEmail) throw new Error("No guest email");

      const [mt] = await db
        .select()
        .from(meetingTypes)
        .where(eq(meetingTypes.id, booking.meetingTypeId))
        .limit(1);

      await sendBookingEmail(input.type, booking.bookedByEmail, {
        guestName: booking.bookedByName,
        meetingTitle: mt?.name ?? "Meeting",
        startTime: booking.startTime,
        
      });

      await db.insert(bookingEmailLogs).values({
        bookingId: booking.id,
        type: input.type,
        sentTo: booking.bookedByEmail,
        status: "sent",
      });

      return { ok: true };
    }),

  // ─── Booking email: send cancellation ────────────────────────────────────
  sendBookingCancellation: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new Error("DB unavailable");
      const [booking] = await db
        .select()
        .from(bookings)
        .where(and(eq(bookings.id, input.bookingId), eq(bookings.userId, ctx.user.id)))
        .limit(1);
      if (!booking) throw new Error("Booking not found");
      if (!booking.bookedByEmail) throw new Error("No guest email");

      const [mt] = await db
        .select()
        .from(meetingTypes)
        .where(eq(meetingTypes.id, booking.meetingTypeId))
        .limit(1);

      await sendBookingEmail("cancellation", booking.bookedByEmail, {
        guestName: booking.bookedByName,
        meetingTitle: mt?.name ?? "Meeting",
        startTime: booking.startTime,
      });

      await db.insert(bookingEmailLogs).values({
        bookingId: booking.id,
        type: "cancellation",
        sentTo: booking.bookedByEmail,
        status: "sent",
      });

      return { ok: true };
    }),

  // ─── Booking email logs ───────────────────────────────────────────────────
  getEmailLogs: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      return db
        .select()
        .from(bookingEmailLogs)
        .where(eq(bookingEmailLogs.bookingId, input.bookingId))
        .orderBy(desc(bookingEmailLogs.sentAt));
    }),
});
