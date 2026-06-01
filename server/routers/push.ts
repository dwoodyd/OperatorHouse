/**
 * Push notification tRPC router
 *
 * Procedures:
 *   push.vapidKey   — public, returns the VAPID public key for client subscription
 *   push.subscribe  — protected, saves a push subscription for the current user
 *   push.unsubscribe — protected, removes a push subscription by endpoint
 */
import { z } from "zod";
import { protectedProcedure, publicProcedure, router } from "../_core/trpc";
import { savePushSubscription, deletePushSubscription } from "../db";

export const pushRouter = router({
  /** Returns the VAPID public key so the browser can create a PushSubscription. */
  vapidKey: publicProcedure.query(() => {
    const publicKey = process.env.VAPID_PUBLIC_KEY ?? null;
    return { publicKey };
  }),

  /** Saves a browser PushSubscription for the authenticated user. */
  subscribe: protectedProcedure
    .input(z.object({
      endpoint: z.string().url(),
      p256dh: z.string(),
      auth: z.string(),
    }))
    .mutation(async ({ ctx, input }) => {
      await savePushSubscription(ctx.user.id, {
        endpoint: input.endpoint,
        p256dh: input.p256dh,
        auth: input.auth,
      });
      return { success: true };
    }),

  /** Removes a push subscription by endpoint (e.g. when the user revokes permission). */
  unsubscribe: protectedProcedure
    .input(z.object({ endpoint: z.string() }))
    .mutation(async ({ ctx, input }) => {
      await deletePushSubscription(ctx.user.id, input.endpoint);
      return { success: true };
    }),
});
