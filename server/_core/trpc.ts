import { NOT_ADMIN_ERR_MSG, UNAUTHED_ERR_MSG } from '@shared/const';
import { initTRPC, TRPCError } from "@trpc/server";
import superjson from "superjson";
import type { TrpcContext } from "./context";

const t = initTRPC.context<TrpcContext>().create({
  transformer: superjson,
  // Sanitize error messages — never leak raw SQL, DB internals, or stack traces to the client
  errorFormatter: ({ shape, error }) => {
    const isDev = process.env.NODE_ENV === 'development';

    // Detect raw DB errors from Drizzle ORM, MySQL driver, or connection issues
    const causeMsg = error.cause instanceof Error ? error.cause.message : '';
    const isDbError =
      causeMsg.startsWith('Failed query:') ||
      causeMsg.includes('ER_') ||
      causeMsg.includes('ECONNREFUSED') ||
      causeMsg.includes('Access denied') ||
      shape.message.startsWith('Failed query:');

    if (isDbError) {
      // Log full details server-side for debugging
      console.error('[tRPC DB Error]', causeMsg || shape.message);
    }

    const safeMessage = isDbError
      ? "Specter couldn't reach the data layer. We've logged this — please try again in a moment."
      : shape.message;

    return {
      ...shape,
      message: safeMessage,
      data: {
        ...shape.data,
        stack: isDev ? error.stack : undefined,
      },
    };
  },
});

export const router = t.router;
export const publicProcedure = t.procedure;

const requireUser = t.middleware(async opts => {
  const { ctx, next } = opts;

  if (!ctx.user) {
    throw new TRPCError({ code: "UNAUTHORIZED", message: UNAUTHED_ERR_MSG });
  }

  return next({
    ctx: {
      ...ctx,
      user: ctx.user,
    },
  });
});

export const protectedProcedure = t.procedure.use(requireUser);

export const adminProcedure = t.procedure.use(
  t.middleware(async opts => {
    const { ctx, next } = opts;

    if (!ctx.user || ctx.user.role !== 'admin') {
      throw new TRPCError({ code: "FORBIDDEN", message: NOT_ADMIN_ERR_MSG });
    }

    return next({
      ctx: {
        ...ctx,
        user: ctx.user,
      },
    });
  }),
);
