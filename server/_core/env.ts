// ─────────────────────────────────────────────────────────────────────────────
// Single source of truth for all environment variables consumed by the server.
// Every process.env access in server code MUST go through this object.
// NEVER import this file from client/ — it is server-only.
// ─────────────────────────────────────────────────────────────────────────────

export const ENV = {
  // ── Runtime ────────────────────────────────────────────────────────────────
  isProduction: process.env.NODE_ENV === "production",
  port: parseInt(process.env.PORT || "3000", 10),

  // ── Auth / session ─────────────────────────────────────────────────────────
  // Server runtime may not receive VITE_-prefixed vars (those are injected at
  // client build time). Accept a plain APP_ID as the primary source.
  appId: process.env.APP_ID ?? process.env.VITE_APP_ID ?? "",
  cookieSecret: process.env.JWT_SECRET ?? "",
  oAuthServerUrl: process.env.OAUTH_SERVER_URL ?? "",
  ownerOpenId: process.env.OWNER_OPEN_ID ?? "",

  // ── Database ───────────────────────────────────────────────────────────────
  databaseUrl: process.env.DATABASE_URL ?? "",

  // ── Manus forge (storage proxy, LLM, maps) ─────────────────────────────────
  forgeApiUrl: process.env.BUILT_IN_FORGE_API_URL ?? "",
  forgeApiKey: process.env.BUILT_IN_FORGE_API_KEY ?? "",

  // ── Public origin ──────────────────────────────────────────────────────────
  publicUrl: process.env.PUBLIC_URL ?? "",

  // ── Email (Resend) ─────────────────────────────────────────────────────────
  resendApiKey: process.env.RESEND_API_KEY ?? "",
  emailFrom: process.env.EMAIL_FROM ?? "Operator House <ops@mail.operatorhouse.click>",

  // ── Web Push (VAPID) ───────────────────────────────────────────────────────
  // VAPID_PUBLIC_KEY is intentionally non-secret (sent to browsers for push
  // subscription). VAPID_PRIVATE_KEY is secret and must never reach the client.
  vapidPublicKey: process.env.VAPID_PUBLIC_KEY ?? "",
  vapidPrivateKey: process.env.VAPID_PRIVATE_KEY ?? "",

  // ── Billing: PayPal ────────────────────────────────────────────────────────
  paypalEnv: (process.env.PAYPAL_ENV ?? "sandbox") as "sandbox" | "live",
  paypalClientId: process.env.PAYPAL_CLIENT_ID ?? "",
  paypalClientSecret: process.env.PAYPAL_CLIENT_SECRET ?? "",
  paypalPlanOperator: process.env.PAYPAL_PLAN_OPERATOR ?? "",
  paypalPlanOperatorPro: process.env.PAYPAL_PLAN_OPERATOR_PRO ?? "",

  // ── Billing: Stripe ────────────────────────────────────────────────────────
  stripeSecretKey: process.env.STRIPE_SECRET_KEY ?? "",
  stripeMonthlyPriceId: process.env.STRIPE_MONTHLY_PRICE_ID ?? "",
  stripeAnnualPriceId: process.env.STRIPE_ANNUAL_PRICE_ID ?? "",

  // ── Telephony: Twilio ──────────────────────────────────────────────────────
  twilioAccountSid: process.env.TWILIO_ACCOUNT_SID ?? "",
  twilioAuthToken: process.env.TWILIO_AUTH_TOKEN ?? "",
  twilioPhoneNumber: process.env.TWILIO_PHONE_NUMBER ?? "",

  // ── Voice AI: Vapi ─────────────────────────────────────────────────────────
  vapiApiKey: process.env.VAPI_API_KEY ?? "",

  // ── Social: LinkedIn ───────────────────────────────────────────────────────
  linkedinClientId: process.env.LINKEDIN_CLIENT_ID ?? "",
  linkedinClientSecret: process.env.LINKEDIN_CLIENT_SECRET ?? "",

  // ── Social: Twitter / X ────────────────────────────────────────────────────
  twitterApiKey: process.env.TWITTER_API_KEY ?? "",
  twitterApiSecret: process.env.TWITTER_API_SECRET ?? "",

  // ── Redis (rate limiting) ──────────────────────────────────────────────────
  redisUrl: process.env.REDIS_URL ?? "",

  // ── Apollo.io (B2B lead search) ─────────────────────────────────────────────
  apolloApiKey: process.env.APOLLO_API_KEY ?? "",
};

// ─────────────────────────────────────────────────────────────────────────────
// Boot-time guards — fail fast in production rather than silently misbehaving.
// ─────────────────────────────────────────────────────────────────────────────
if (ENV.isProduction) {
  const required: Array<[string, string]> = [
    ["PUBLIC_URL", ENV.publicUrl],
    ["DATABASE_URL", ENV.databaseUrl],
    ["JWT_SECRET", ENV.cookieSecret],
    ["OAUTH_SERVER_URL", ENV.oAuthServerUrl],
    ["BUILT_IN_FORGE_API_URL", ENV.forgeApiUrl],
    ["BUILT_IN_FORGE_API_KEY", ENV.forgeApiKey],
  ];

  const missing = required.filter(([, v]) => !v).map(([k]) => k);
  if (missing.length > 0) {
    throw new Error(
      `[boot] Missing required environment variables in production: ${missing.join(", ")}. ` +
      "See docs/env-reference.md for the full list."
    );
  }
}
