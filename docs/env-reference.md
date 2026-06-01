# Operator House — Environment Variable Reference

Copy the block below to `.env` and fill in the values.  
Variables prefixed `VITE_` are exposed to the browser bundle — **never put secrets in a `VITE_` var**.

```bash
# ── Core / runtime ────────────────────────────────────────────────────────────
NODE_ENV=development
PORT=3000
# Canonical public origin. REQUIRED in production (boot fails without it) —
# used to build links in outgoing email (e-sign, review, team invite).
PUBLIC_URL=https://app.operatorhouse.click

# ── Database ──────────────────────────────────────────────────────────────────
DATABASE_URL=mysql://user:password@host:3306/operatorhouse

# ── Session / auth (REQUIRED — fixes the "stuck at Manus" login) ─────────────
# Secret used to sign the JWT session cookie this server issues.
JWT_SECRET=change-me-to-a-long-random-string
# Manus app id for THIS project. Must match the project registered on Manus.
# IMPORTANT: set BOTH. VITE_APP_ID is baked into the browser build; APP_ID is
# read by the server at runtime. If the server only has VITE_APP_ID at build
# time (not at runtime), sessions are signed with an empty appId and every
# request after login fails -> infinite redirect to Manus. APP_ID prevents that.
APP_ID=UYrVyz2BYHYzFAx4PneEpK
VITE_APP_ID=UYrVyz2BYHYzFAx4PneEpK
# Browser-facing OAuth portal the login button redirects to.
VITE_OAUTH_PORTAL_URL=https://manus.im
# Server-to-server OAuth API that exchanges the auth code for a token.
OAUTH_SERVER_URL=https://api.manus.im
# openId of the workspace owner (grants admin capabilities).
OWNER_OPEN_ID=

# NOTE on login: the redirect URI is computed at runtime as
#   <origin>/api/oauth/callback
# That exact URI MUST be whitelisted on the Manus project for VITE_APP_ID,
# otherwise Manus shows its portal and then dead-ends (the reported bug).

# ── Manus "forge" storage proxy (serves the onboarding videos /manus-storage) ─
BUILT_IN_FORGE_API_URL=
BUILT_IN_FORGE_API_KEY=
# Frontend-side forge access (browser bundle)
VITE_FRONTEND_FORGE_API_URL=
VITE_FRONTEND_FORGE_API_KEY=

# ── Redis (rate limiting; optional in dev) ────────────────────────────────────
REDIS_URL=redis://localhost:6379

# ── Email (Resend) ────────────────────────────────────────────────────────────
RESEND_API_KEY=
EMAIL_FROM=Operator House <no-reply@operatorhouse.click>

# ── Web Push (VAPID) — generate with: npx web-push generate-vapid-keys ────────
VAPID_PUBLIC_KEY=
VAPID_PRIVATE_KEY=

# ── Billing: Stripe ─────────────────────────────────────────────────────────
STRIPE_SECRET_KEY=
STRIPE_MONTHLY_PRICE_ID=
STRIPE_ANNUAL_PRICE_ID=

# ── Billing: PayPal ───────────────────────────────────────────────────────────
PAYPAL_ENV=sandbox
PAYPAL_BASE_URL=https://api-m.sandbox.paypal.com
PAYPAL_CLIENT_ID=
PAYPAL_CLIENT_SECRET=
PAYPAL_PLAN_OPERATOR=
PAYPAL_PLAN_OPERATOR_PRO=

# ── Telephony / voice (Twilio + Vapi) ─────────────────────────────────────────
TWILIO_ACCOUNT_SID=
TWILIO_AUTH_TOKEN=
TWILIO_PHONE_NUMBER=
VAPI_API_KEY=

# ── Social integrations ───────────────────────────────────────────────────────
LINKEDIN_CLIENT_ID=
LINKEDIN_CLIENT_SECRET=
TWITTER_API_KEY=
TWITTER_API_SECRET=
```

## Required for production boot

The server will throw at startup if any of these are missing in `NODE_ENV=production`:

| Variable | Purpose |
|---|---|
| `PUBLIC_URL` | Builds absolute URLs in emails |
| `DATABASE_URL` | MySQL/TiDB connection |
| `JWT_SECRET` | Signs session cookies |
| `APP_ID` | Manus OAuth app identifier (server runtime) |
| `VITE_APP_ID` | Manus OAuth app identifier (browser build) |
| `OAUTH_SERVER_URL` | Manus OAuth token exchange |
| `BUILT_IN_FORGE_API_URL` | Manus storage proxy (onboarding videos) |
| `BUILT_IN_FORGE_API_KEY` | Manus storage proxy auth |
| `VAPID_PUBLIC_KEY` | Web push subscriptions |
| `VAPID_PRIVATE_KEY` | Web push signing |
