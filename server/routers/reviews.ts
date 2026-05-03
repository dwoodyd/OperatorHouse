/**
 * Phase 15: Reputation & Reviews Router
 */
import { z } from "zod";
import { eq, and, desc, sql } from "drizzle-orm";
import { randomBytes } from "crypto";
import { Resend } from "resend";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { ENV } from "../_core/env";
import { getDb } from "../db";
import { reviews, bookings, crmContacts } from "../../drizzle/schema";

const resend = new Resend(process.env.RESEND_API_KEY);
const FROM = "Operator House <onboarding@resend.dev>";

export const reviewsRouter = router({
  // List all reviews for the operator
  list: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    return db.select().from(reviews)
      .where(eq(reviews.userId, ctx.user.id))
      .orderBy(desc(reviews.createdAt));
  }),

  // Stats summary
  stats: protectedProcedure.query(async ({ ctx }) => {
    const db = (await getDb())!;
    const rows = await db.select().from(reviews)
      .where(and(eq(reviews.userId, ctx.user.id), eq(reviews.status, "published")));
    const total = rows.length;
    const avg = total > 0
      ? rows.reduce((s, r) => s + (r.rating ?? 0), 0) / total
      : 0;
    const byRating = [5, 4, 3, 2, 1].map((r) => ({
      rating: r,
      count: rows.filter((x) => x.rating === r).length,
    }));
    return { total, avg: Math.round(avg * 10) / 10, byRating };
  }),

  // Request a review (sends email to client)
  request: protectedProcedure
    .input(z.object({
      contactId: z.number().optional(),
      bookingId: z.number().optional(),
      reviewerEmail: z.string().email(),
      reviewerName: z.string().min(1),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const token = randomBytes(32).toString("hex");
      const [result] = await db.insert(reviews).values({
        userId: ctx.user.id,
        contactId: input.contactId,
        bookingId: input.bookingId,
        requestToken: token,
        reviewerEmail: input.reviewerEmail,
        reviewerName: input.reviewerName,
        status: "pending",
      });
      const id = (result as any).insertId as number;
      const reviewUrl = `${ENV.publicUrl}/review/${token}`;

      try {
        await resend.emails.send({
          from: FROM,
          to: input.reviewerEmail,
          subject: `How was your experience?`,
          text: `Hi ${input.reviewerName},\n\nThank you for working with us! We'd love to hear your feedback.\n\nLeave a review here: ${reviewUrl}\n\nIt only takes 2 minutes and means a lot to us.`,
        });
      } catch (err) {
        console.error("[Reviews] Email error:", err);
      }
      return { id, token };
    }),

  // Request review from a completed booking (auto-fills contact info)
  requestFromBooking: protectedProcedure
    .input(z.object({ bookingId: z.number() }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      const [booking] = await db.select().from(bookings)
        .where(and(eq(bookings.id, input.bookingId), eq(bookings.userId, ctx.user.id)))
        .limit(1);
      if (!booking) throw new Error("Booking not found");
      const token = randomBytes(32).toString("hex");
      const [result] = await db.insert(reviews).values({
        userId: ctx.user.id,
        bookingId: input.bookingId,
        requestToken: token,
        reviewerEmail: booking.bookedByEmail,
        reviewerName: booking.bookedByName,
        status: "pending",
      });
      const reviewUrl = `${ENV.publicUrl}/review/${token}`;
      try {
        await resend.emails.send({
          from: FROM,
          to: booking.bookedByEmail,
          subject: `How was your session?`,
          text: `Hi ${booking.bookedByName},\n\nThank you for your time! We'd love to hear how it went.\n\nLeave a quick review: ${reviewUrl}\n\nThanks!`,
        });
      } catch (err) {
        console.error("[Reviews] Email error:", err);
      }
      return { id: (result as any).insertId, token };
    }),

  // Publish / archive a review
  updateStatus: protectedProcedure
    .input(z.object({
      id: z.number(),
      status: z.enum(["published", "archived"]),
      isPublic: z.boolean().optional(),
    }))
    .mutation(async ({ ctx, input }) => {
      const db = (await getDb())!;
      await db.update(reviews).set({
        status: input.status,
        isPublic: input.isPublic ?? input.status === "published",
      }).where(and(eq(reviews.id, input.id), eq(reviews.userId, ctx.user.id)));
      return { ok: true };
    }),

  // Public widget — returns published reviews for a user (by userId)
  widget: publicProcedure
    .input(z.object({ userId: z.number() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      return db.select({
        id: reviews.id,
        rating: reviews.rating,
        headline: reviews.headline,
        body: reviews.body,
        reviewerName: reviews.reviewerName,
        reviewerTitle: reviews.reviewerTitle,
        submittedAt: reviews.submittedAt,
      }).from(reviews)
        .where(and(eq(reviews.userId, input.userId), eq(reviews.isPublic, true)))
        .orderBy(desc(reviews.submittedAt))
        .limit(20);
    }),

  // ─── Public: get review form by token ──────────────────────────────────────
  getByToken: publicProcedure
    .input(z.object({ token: z.string() }))
    .query(async ({ input }) => {
      const db = (await getDb())!;
      const [r] = await db.select().from(reviews)
        .where(eq(reviews.requestToken, input.token))
        .limit(1);
      if (!r) throw new Error("Invalid review link");
      if (r.status === "submitted" || r.status === "published") {
        return { alreadySubmitted: true, reviewerName: r.reviewerName };
      }
      return { alreadySubmitted: false, reviewerName: r.reviewerName, reviewerEmail: r.reviewerEmail };
    }),

  // ─── Public: submit review ─────────────────────────────────────────────────
  submit: publicProcedure
    .input(z.object({
      token: z.string(),
      rating: z.number().min(1).max(5),
      headline: z.string().min(1).max(255),
      body: z.string().min(10),
      reviewerName: z.string().min(1),
      reviewerTitle: z.string().optional(),
    }))
    .mutation(async ({ input }) => {
      const db = (await getDb())!;
      const [r] = await db.select().from(reviews)
        .where(eq(reviews.requestToken, input.token))
        .limit(1);
      if (!r) throw new Error("Invalid review link");
      if (r.status === "submitted" || r.status === "published") throw new Error("Already submitted");

      await db.update(reviews).set({
        rating: input.rating,
        headline: input.headline,
        body: input.body,
        reviewerName: input.reviewerName,
        reviewerTitle: input.reviewerTitle,
        status: "submitted",
        submittedAt: new Date(),
      }).where(eq(reviews.id, r.id));

      return { ok: true };
    }),
});
