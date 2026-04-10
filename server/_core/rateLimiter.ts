/**
 * Rate limiting middleware for AI endpoints.
 * Prevents API budget exhaustion from rapid-fire requests.
 *
 * Uses IP-based rate limiting (simple and reliable).
 * In production, this is sufficient since each user session maps to a consistent IP.
 */
import { rateLimit } from "express-rate-limit";
import { ENV } from "./env";

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
});
