import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { TRPCError } from "@trpc/server";
import { getDb } from "../db";
import {
  meetingTypes, bookings, availability, blockedDates, crmContacts,
} from "../../drizzle/schema";
import { eq, and, gte, lte, desc, asc } from "drizzle-orm";

// ─── Helpers ──────────────────────────────────────────────────────────────────
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-|-$/g, "")
    .substring(0, 80);
}

function generateSlot(dateStr: string, startTime: string, durationMinutes: number) {
  const [h, m] = startTime.split(":").map(Number);
  const start = new Date(`${dateStr}T${startTime}:00`);
  const end = new Date(start.getTime() + durationMinutes * 60_000);
  return { start, end };
}

// ─── Router ───────────────────────────────────────────────────────────────────
export const bookingRouter = router({
  // ── Meeting Types ──────────────────────────────────────────────────────────
  listMeetingTypes: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db
      .select()
      .from(meetingTypes)
      .where(eq(meetingTypes.userId, ctx.user.id))
      .orderBy(asc(meetingTypes.createdAt));
  }),

  createMeetingType: protectedProcedure
    .input(z.object({
      name: z.string().min(1).max(255),
      description: z.string().optional(),
      durationMinutes: z.number().int().min(5).max(480).default(30),
      color: z.string().default("#f5c842"),
      bufferBeforeMinutes: z.number().int().min(0).max(60).default(0),
      bufferAfterMinutes: z.number().int().min(0).max(60).default(0),
      intakeQuestions: z.array(z.object({
        label: z.string(),
        type: z.enum(["text", "textarea", "dropdown", "checkbox"]),
        required: z.boolean().default(false),
        options: z.array(z.string()).optional(),
      })).optional(),
      maxBookingsPerDay: z.number().int().min(1).optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      // Ensure unique slug per user
      let slug = slugify(input.name);
      const existing = await db.select({ slug: meetingTypes.slug })
        .from(meetingTypes)
        .where(and(eq(meetingTypes.userId, ctx.user.id), eq(meetingTypes.slug, slug)));
      if (existing.length > 0) slug = `${slug}-${Date.now()}`;

      const [result] = await db.insert(meetingTypes).values({
        userId: ctx.user.id,
        name: input.name,
        slug,
        description: input.description,
        durationMinutes: input.durationMinutes,
        color: input.color,
        bufferBeforeMinutes: input.bufferBeforeMinutes,
        bufferAfterMinutes: input.bufferAfterMinutes,
        intakeQuestions: input.intakeQuestions ?? [],
        maxBookingsPerDay: input.maxBookingsPerDay,
        isActive: true,
      });
      return { id: (result as any).insertId as number, slug };
    }),

  updateMeetingType: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      name: z.string().min(1).max(255).optional(),
      description: z.string().optional(),
      durationMinutes: z.number().int().min(5).max(480).optional(),
      color: z.string().optional(),
      bufferBeforeMinutes: z.number().int().min(0).max(60).optional(),
      bufferAfterMinutes: z.number().int().min(0).max(60).optional(),
      intakeQuestions: z.array(z.object({
        label: z.string(),
        type: z.enum(["text", "textarea", "dropdown", "checkbox"]),
        required: z.boolean().default(false),
        options: z.array(z.string()).optional(),
      })).optional(),
      maxBookingsPerDay: z.number().int().min(1).nullable().optional(),
      isActive: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...fields } = input;
      await db.update(meetingTypes)
        .set({ ...fields, updatedAt: new Date() })
        .where(and(eq(meetingTypes.id, id), eq(meetingTypes.userId, ctx.user.id)));
      return { ok: true };
    }),

  deleteMeetingType: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(meetingTypes)
        .where(and(eq(meetingTypes.id, input.id), eq(meetingTypes.userId, ctx.user.id)));
      return { ok: true };
    }),

  // ── Availability ───────────────────────────────────────────────────────────
  getAvailability: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    const rows = await db.select().from(availability)
      .where(eq(availability.userId, ctx.user.id))
      .orderBy(asc(availability.dayOfWeek));

    // If no rows, return default Mon-Fri 9-5
    if (rows.length === 0) {
      return [1, 2, 3, 4, 5].map((day) => ({
        id: 0, userId: ctx.user.id, dayOfWeek: day,
        startTime: "09:00", endTime: "17:00", isAvailable: true,
      }));
    }
    return rows;
  }),

  setAvailability: protectedProcedure
    .input(z.array(z.object({
      dayOfWeek: z.number().int().min(0).max(6),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      endTime: z.string().regex(/^\d{2}:\d{2}$/),
      isAvailable: z.boolean(),
    })))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      // Delete existing and re-insert
      await db.delete(availability).where(eq(availability.userId, ctx.user.id));
      if (input.length > 0) {
        await db.insert(availability).values(
          input.map((row) => ({ ...row, userId: ctx.user.id }))
        );
      }
      return { ok: true };
    }),

  // ── Blocked Dates ──────────────────────────────────────────────────────────
  getBlockedDates: protectedProcedure.query(async ({ ctx }) => {
    const db = await getDb();
    if (!db) return [];
    return db.select().from(blockedDates)
      .where(eq(blockedDates.userId, ctx.user.id))
      .orderBy(asc(blockedDates.date));
  }),

  blockDate: protectedProcedure
    .input(z.object({
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      reason: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.insert(blockedDates).values({ userId: ctx.user.id, ...input });
      return { ok: true };
    }),

  unblockDate: protectedProcedure
    .input(z.object({ id: z.number().int() }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      await db.delete(blockedDates)
        .where(and(eq(blockedDates.id, input.id), eq(blockedDates.userId, ctx.user.id)));
      return { ok: true };
    }),

  // ── Bookings ───────────────────────────────────────────────────────────────
  listBookings: protectedProcedure
    .input(z.object({
      status: z.enum(["confirmed", "cancelled", "completed", "no_show"]).optional(),
      upcoming: z.boolean().optional(),
    }).optional())
    .query(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) return [];
      const conditions = [eq(bookings.userId, ctx.user.id)];
      if (input?.status) conditions.push(eq(bookings.status, input.status));
      if (input?.upcoming) conditions.push(gte(bookings.startTime, new Date()));

      const rows = await db.select().from(bookings)
        .where(and(...conditions))
        .orderBy(asc(bookings.startTime))
        .limit(200);

      // Enrich with meeting type name
      const mtIds = Array.from(new Set(rows.map((r) => r.meetingTypeId)));
      const mtRows = mtIds.length > 0
        ? await db.select({ id: meetingTypes.id, name: meetingTypes.name, color: meetingTypes.color, durationMinutes: meetingTypes.durationMinutes })
            .from(meetingTypes)
            .where(eq(meetingTypes.userId, ctx.user.id))
        : [];
      const mtMap = new Map(mtRows.map((m) => [m.id, m]));

      return rows.map((b) => ({ ...b, meetingType: mtMap.get(b.meetingTypeId) ?? null }));
    }),

  updateBookingStatus: protectedProcedure
    .input(z.object({
      id: z.number().int(),
      status: z.enum(["confirmed", "cancelled", "completed", "no_show"]),
      cancelReason: z.string().optional(),
      notes: z.string().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });
      const { id, ...fields } = input;
      await db.update(bookings)
        .set({ ...fields, updatedAt: new Date() })
        .where(and(eq(bookings.id, id), eq(bookings.userId, ctx.user.id)));
      return { ok: true };
    }),

  // ── Public: Get Available Slots ────────────────────────────────────────────
  getPublicSlots: publicProcedure
    .input(z.object({
      slug: z.string(),
      daysAhead: z.number().int().min(1).max(60).default(14),
    }))
    .query(async ({ input }) => {
      const db = await getDb();
      if (!db) return { meetingType: null, slots: [] };

      // Find meeting type by slug
      const [mt] = await db.select().from(meetingTypes)
        .where(and(eq(meetingTypes.slug, input.slug), eq(meetingTypes.isActive, true)));
      if (!mt) return { meetingType: null, slots: [] };

      // Get operator's availability
      const avail = await db.select().from(availability)
        .where(eq(availability.userId, mt.userId));

      // Get blocked dates
      const today = new Date();
      const maxDate = new Date(today.getTime() + input.daysAhead * 86400_000);
      const blocked = await db.select({ date: blockedDates.date })
        .from(blockedDates)
        .where(eq(blockedDates.userId, mt.userId));
      const blockedSet = new Set(blocked.map((b) => b.date));

      // Get existing bookings in range
      const existingBookings = await db.select({
        startTime: bookings.startTime,
        endTime: bookings.endTime,
      }).from(bookings).where(
        and(
          eq(bookings.userId, mt.userId),
          eq(bookings.status, "confirmed"),
          gte(bookings.startTime, today),
          lte(bookings.startTime, maxDate),
        )
      );

      // Build slots
      const slots: { date: string; startTime: string; endTime: string }[] = [];
      const availMap = new Map(avail.map((a) => [a.dayOfWeek, a]));

      for (let d = 0; d < input.daysAhead; d++) {
        const date = new Date(today.getTime() + d * 86400_000);
        const dateStr = date.toISOString().split("T")[0];
        const dow = date.getDay();

        if (blockedSet.has(dateStr)) continue;
        const dayAvail = availMap.get(dow);
        if (!dayAvail || !dayAvail.isAvailable) continue;

        // Generate 30-min slots within availability window
        const [sh, sm] = dayAvail.startTime.split(":").map(Number);
        const [eh, em] = dayAvail.endTime.split(":").map(Number);
        const windowStart = sh * 60 + sm;
        const windowEnd = eh * 60 - mt.durationMinutes - mt.bufferAfterMinutes;

        for (let t = windowStart; t <= windowEnd; t += 30) {
          const slotH = Math.floor(t / 60).toString().padStart(2, "0");
          const slotM = (t % 60).toString().padStart(2, "0");
          const slotStart = new Date(`${dateStr}T${slotH}:${slotM}:00`);
          const slotEnd = new Date(slotStart.getTime() + mt.durationMinutes * 60_000);

          // Check for conflicts with existing bookings
          const conflict = existingBookings.some((b) => {
            const bStart = new Date(b.startTime).getTime();
            const bEnd = new Date(b.endTime).getTime();
            const bufferStart = slotStart.getTime() - mt.bufferBeforeMinutes * 60_000;
            const bufferEnd = slotEnd.getTime() + mt.bufferAfterMinutes * 60_000;
            return bufferStart < bEnd && bufferEnd > bStart;
          });

          if (!conflict && slotStart > today) {
            slots.push({
              date: dateStr,
              startTime: `${slotH}:${slotM}`,
              endTime: `${Math.floor((t + mt.durationMinutes) / 60).toString().padStart(2, "0")}:${((t + mt.durationMinutes) % 60).toString().padStart(2, "0")}`,
            });
          }
        }
      }

      return {
        meetingType: {
          id: mt.id,
          name: mt.name,
          description: mt.description,
          durationMinutes: mt.durationMinutes,
          color: mt.color,
          intakeQuestions: mt.intakeQuestions,
        },
        slots,
      };
    }),

  // ── Public: Create Booking ─────────────────────────────────────────────────
  createBooking: publicProcedure
    .input(z.object({
      slug: z.string(),
      date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
      startTime: z.string().regex(/^\d{2}:\d{2}$/),
      name: z.string().min(1).max(255),
      email: z.string().email(),
      phone: z.string().optional(),
      intakeResponses: z.record(z.string(), z.string()).optional(),
    }))
    .mutation(async ({ input }) => {
      const db = await getDb();
      if (!db) throw new TRPCError({ code: "INTERNAL_SERVER_ERROR" });

      const [mt] = await db.select().from(meetingTypes)
        .where(and(eq(meetingTypes.slug, input.slug), eq(meetingTypes.isActive, true)));
      if (!mt) throw new TRPCError({ code: "NOT_FOUND", message: "Meeting type not found" });

      const startTime = new Date(`${input.date}T${input.startTime}:00`);
      const endTime = new Date(startTime.getTime() + mt.durationMinutes * 60_000);

      // Check for conflicts
      const conflicts = await db.select({ id: bookings.id }).from(bookings).where(
        and(
          eq(bookings.userId, mt.userId),
          eq(bookings.status, "confirmed"),
          lte(bookings.startTime, endTime),
          gte(bookings.endTime, startTime),
        )
      );
      if (conflicts.length > 0) {
        throw new TRPCError({ code: "CONFLICT", message: "This time slot is no longer available" });
      }

      // Auto-create or match CRM contact
      let contactId: number | null = null;
      const [existingContact] = await db.select({ id: crmContacts.id })
        .from(crmContacts)
        .where(and(eq(crmContacts.userId, mt.userId), eq(crmContacts.email, input.email)));

      if (existingContact) {
        contactId = existingContact.id;
      } else {
        const nameParts = input.name.split(" ");
        const [newContact] = await db.insert(crmContacts).values({
          userId: mt.userId,
          firstName: nameParts[0] ?? input.name,
          lastName: nameParts.slice(1).join(" ") || "",
          email: input.email,
          phone: input.phone,
          lifecycleStage: "lead",
          source: "manual",
        });
        contactId = (newContact as any).insertId as number;
      }

      const [result] = await db.insert(bookings).values({
        userId: mt.userId,
        meetingTypeId: mt.id,
        contactId,
        bookedByName: input.name,
        bookedByEmail: input.email,
        bookedByPhone: input.phone,
        startTime,
        endTime,
        status: "confirmed",
        intakeResponses: input.intakeResponses ?? {},
        confirmationSent: false,
        reminderSent: false,
      });

      return {
        id: (result as any).insertId as number,
        startTime,
        endTime,
        meetingName: mt.name,
        durationMinutes: mt.durationMinutes,
      };
    }),
});
