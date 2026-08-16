/**
 * Rate limiting middleware for AI endpoints.
 * Prevents API budget exhaustion from rapid-fire requests.
 *
 * Uses IP-based rate limiting (simple and reliable).
 * In production with REDIS_URL set, all limiters share a distributed Redis store
 * so limits are enforced consistently across multiple server replicas.
 */
import { rateLimit, Options } from "express-rate-limit";
import { ENV } from "./env";

// Build a Redis store if REDIS_URL is available, otherwise fall back to in-memory.
function buildStore(): Partial<Options> {
  const redisUrl = process.env.REDIS_URL;
  if (!redisUrl) return {};

  try {
    // Dynamic require so the server still starts without ioredis in dev
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const { RedisStore } = require("rate-limit-redis");
    // eslint-disable-next-line @typescript-eslint/no-require-imports
    const Redis = require("ioredis");
    const client = new Redis(redisUrl);
    client.on("error", (err: Error) =>
      console.error("[RateLimiter] Redis error:", err.message)
    );
    return { store: new RedisStore({ sendCommand: (...args: string[]) => client.call(...args) }) };
  } catch (e) {
    console.warn("[RateLimiter] Redis store unavailable, using in-memory:", (e as Error).message);
    return {};
  }
}

const redisStore = buildStore();

/**
 * Auth rate limiter — 5 attempts per 15 minutes per IP.
 * Applied to the OAuth callback to prevent brute-force token exchange.
 */
export const authRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  message: {
    error: {
      message: "Too many login attempts. Please wait 15 minutes before trying again.",
      code: "AUTH_RATE_LIMITED",
    },
  },
  ...redisStore,
});

/**
 * AI rate limiter — 20 requests per 10 minutes per IP.
 * Applied to all AI-heavy tRPC procedures.
 */
export const aiRateLimiter = rateLimit({
  windowMs: 10 * 60 * 1000, // 10 minutes
  max: 20, // 20 AI calls per window
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => !ENV.isProduction,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        message: "Too many AI requests. Please wait a moment before trying again.",
        code: "RATE_LIMITED",
      },
    });
  },
  ...redisStore,
});

/**
 * Strict AI rate limiter — 5 requests per 2 minutes per IP.
 * For the most expensive endpoints (strategy generation, lead audit).
 */
export const strictAiRateLimiter = rateLimit({
  windowMs: 2 * 60 * 1000, // 2 minutes
  max: 5,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => !ENV.isProduction,
  handler: (_req, res) => {
    res.status(429).json({
      error: {
        message: "Rate limit reached for AI generation. Please wait 2 minutes.",
        code: "RATE_LIMITED_STRICT",
      },
    });
  },
  ...redisStore,
});

/**
 * Client-error reporting limiter — allows enough room for genuine recovery
 * reports while preventing public log-ingestion abuse.
 */
export const clientErrorRateLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 30,
  standardHeaders: "draft-7",
  legacyHeaders: false,
  skip: () => !ENV.isProduction,
  message: { error: { message: "Too many reports", code: "CLIENT_ERROR_RATE_LIMITED" } },
  ...redisStore,
});
