import "dotenv/config";
import express from "express";
import helmet from "helmet";
import cors from "cors";
import { createServer } from "http";
import net from "net";
import { createExpressMiddleware } from "@trpc/server/adapters/express";
import { registerStorageProxy } from "./storageProxy";
import { registerOAuthRoutes } from "./oauth";
import { appRouter } from "../routers";
import { createContext } from "./context";
import { serveStatic, setupVite } from "./vite";
import { strictAiRateLimiter, aiRateLimiter, authRateLimiter } from "./rateLimiter";

// Allowed origins: Manus preview domains + production domains
const ALLOWED_ORIGINS = [
  /\.manus\.computer$/,
  /\.manus\.space$/,
  "https://operatorhouse.click",
  "https://www.operatorhouse.click",
  "https://operatorhousehq.manus.space",
  "https://ghostdesk-uyrvyz2b.manus.space",
];

function isPortAvailable(port: number): Promise<boolean> {
  return new Promise(resolve => {
    const server = net.createServer();
    server.listen(port, () => {
      server.close(() => resolve(true));
    });
    server.on("error", () => resolve(false));
  });
}

async function findAvailablePort(startPort: number = 3000): Promise<number> {
  for (let port = startPort; port < startPort + 20; port++) {
    if (await isPortAvailable(port)) {
      return port;
    }
  }
  throw new Error(`No available port found starting from ${startPort}`);
}

async function startServer() {
  const app = express();
  const server = createServer(app);

  // Security headers (CSP, HSTS, X-Frame-Options, etc.)
  app.use(
    helmet({
      // Allow inline scripts/styles needed by Vite HMR in dev
      contentSecurityPolicy: process.env.NODE_ENV === "production",
    })
  );

  // CORS — restrict to known origins in production; open in dev
  app.use(
    cors({
      origin: (origin, callback) => {
        // Allow same-origin requests (no Origin header) and dev
        if (!origin || process.env.NODE_ENV !== "production") {
          return callback(null, true);
        }
        const allowed = ALLOWED_ORIGINS.some(pattern =>
          pattern instanceof RegExp ? pattern.test(origin) : pattern === origin
        );
        callback(allowed ? null : new Error("CORS: origin not allowed"), allowed);
      },
      credentials: true,
    })
  );

  // Stripe webhook MUST use raw body — register BEFORE express.json()
  app.post("/api/stripe/webhook", express.raw({ type: "application/json" }), async (req, res) => {
    const sig = req.headers["stripe-signature"] as string;
    try {
      const { handleStripeWebhook } = await import("../stripe");
      const result = await handleStripeWebhook(req.body as Buffer, sig);
      res.json(result);
    } catch (err: unknown) {
      const isStripeSigError =
        err !== null &&
        typeof err === "object" &&
        (err as { type?: string }).type === "StripeSignatureVerificationError";
      const clientMsg = isStripeSigError
        ? (err as Error).message
        : "Webhook processing failed";
      console.error("[Stripe Webhook]", err instanceof Error ? err.message : err);
      res.status(400).json({ error: clientMsg });
    }
  });

  // Configure body parser with larger size limit for file uploads
  app.use(express.json({ limit: "50mb" }));
  app.use(express.urlencoded({ limit: "50mb", extended: true }));

  // Auth rate limiting — 5 attempts per 15 min per IP (brute-force protection)
  app.use("/api/oauth/callback", authRateLimiter);

  // OAuth callback under /api/oauth/callback
  registerStorageProxy(app);
  registerOAuthRoutes(app);

  // Rate limiting for expensive AI endpoints (strategy generation, lead audit)
  app.use("/api/trpc/leads.analyze", strictAiRateLimiter);
  app.use("/api/trpc/strategies.generate", strictAiRateLimiter);
  // Lighter rate limit for operator chat (more frequent, less expensive)
  app.use("/api/trpc/operator.chat", aiRateLimiter);
  // Also limit briefing generation
  app.use("/api/trpc/briefings.generate", aiRateLimiter);

  // tRPC API — onError logs full details server-side only; stack traces never reach the client
  app.use(
    "/api/trpc",
    createExpressMiddleware({
      router: appRouter,
      createContext,
      onError: ({ error, path }) => {
        if (error.code === "INTERNAL_SERVER_ERROR") {
          console.error(`[tRPC error] ${path ?? "unknown"}:`, error.message, error.cause);
        }
      },
    })
  );

  // development mode uses Vite, production mode uses static files
  if (process.env.NODE_ENV === "development") {
    await setupVite(app, server);
  } else {
    serveStatic(app);
  }

  const preferredPort = parseInt(process.env.PORT || "3000");
  const port = await findAvailablePort(preferredPort);

  if (port !== preferredPort) {
    console.log(`Port ${preferredPort} is busy, using port ${port} instead`);
  }

  server.listen(port, () => {
    console.log(`Server running on http://localhost:${port}/`);
  });
}

startServer().catch(console.error);
