# Operator House — Pre-Marketplace Security Audit Report

**Date:** April 12, 2026  
**Scope:** Full-stack tRPC + MySQL + Manus Auth + Express codebase  
**Result:** All actionable findings resolved. Zero critical vulnerabilities remaining in application code.

---

## Summary Table

| # | Category | Item | Status | Severity |
|---|---|---|---|---|
| 1 | Secrets | No hardcoded API keys or secrets in client code | PASS | Critical |
| 2 | Secrets | `.env` files never committed to git | PASS | Critical |
| 3 | Secrets | All secrets injected via platform env vars | PASS | High |
| 4 | Auth | JWT session tokens signed with platform-injected `JWT_SECRET` | PASS | High |
| 5 | Auth | Session cookie: `httpOnly: true`, `sameSite: none`, `secure: true` in production | PASS | High |
| 6 | Auth | Session expiry: 1-year token with `maxAge` enforced | PASS | Medium |
| 7 | Auth | OAuth callback rate limited: 5 attempts / 15 min per IP | **FIXED** | High |
| 8 | Auth | tRPC error formatter strips stack traces from client responses in production | **FIXED** | Medium |
| 9 | AuthZ | All data-reading procedures use `protectedProcedure` | PASS | Critical |
| 10 | AuthZ | All mutations scope writes to `ctx.user.id` via Drizzle `where` clauses | PASS | Critical |
| 11 | AuthZ | All deletes use `and(eq(table.id, input.id), eq(table.userId, ctx.user.id))` — no IDOR | PASS | Critical |
| 12 | Data | No raw SQL string concatenation — all queries use Drizzle ORM parameterized queries | PASS | Critical |
| 13 | Data | No file upload endpoints exposed without auth | PASS | High |
| 14 | Data | Server-side Zod validation on all tRPC procedure inputs | PASS | High |
| 15 | Network | No explicit CORS config — Express serves same-origin only; no wildcard `Access-Control-Allow-Origin` | PASS | High |
| 16 | Network | HTTPS enforced via `x-forwarded-proto` check in `getSessionCookieOptions` | PASS | High |
| 17 | Network | Server does not run as root in production container | PASS | Medium |
| 18 | Network | Database port not exposed publicly (TiDB connection via `DATABASE_URL` env only) | PASS | High |
| 19 | Deps | **axios upgraded 1.12.2 → 1.15.0** (2 critical SSRF CVEs resolved) | **FIXED** | Critical |
| 20 | Redirects | OAuth callback redirects only to `/` (hardcoded) — no open redirect risk | PASS | High |

---

## Fixes Applied This Session

### Fix 1 — OAuth Callback Rate Limiting (Item 7)
**File:** `server/_core/rateLimiter.ts`, `server/_core/index.ts`  
Added `authRateLimiter` (5 req / 15 min per IP) applied to `/api/oauth/callback` before the OAuth handler. Prevents brute-force token exchange attacks.

### Fix 2 — tRPC Error Formatter (Item 8)
**File:** `server/_core/trpc.ts`  
Added `errorFormatter` to `initTRPC.create()` that strips `error.stack` from client-facing responses in production. Full stack traces still log server-side via the `onError` handler in `index.ts`.

### Fix 3 — Axios SSRF CVEs (Item 19)
**File:** `package.json` / `pnpm-lock.yaml`  
Upgraded `axios` from `1.12.2` to `1.15.0`, resolving:
- `GHSA-w7fw-mjwx-w883` — NO_PROXY Hostname Normalization Bypass leading to SSRF (Critical)
- Axios Unrestricted Cloud Metadata Exfiltration via Header Injection Chain (Critical)
- Axios DoS via `__proto__` key in `mergeConfig` (High)

---

## Remaining Non-Actionable Findings

| Package | Severity | Reason Not Fixed |
|---|---|---|
| `pnpm` (tool) | High | Package manager vulnerability, not in deployed app bundle. Managed by platform. |
| `tar` (devDep via `@tailwindcss/oxide`) | High | Dev-only build tool transitive dep, not in production runtime. |
| Moderate vulnerabilities (24) | Moderate | All in devDependencies or transitive build-tool deps not present in production bundle. |

---

## Architecture Security Notes

**Why no RLS is needed:** This app uses tRPC (server-side only) with Drizzle ORM. Every query is scoped to `ctx.user.id` at the procedure level — equivalent to row-level security enforced in application code rather than the database engine. The database is not directly accessible from the client.

**Why no CORS config is needed:** The Express server serves both the API and the frontend from the same origin. There is no cross-origin API access pattern, so no `Access-Control-Allow-Origin` header is required or set.

**Session security model:** Sessions use JWTs signed with a platform-injected secret, stored in `httpOnly` cookies. The cookie is never accessible to JavaScript. `sameSite: none` is required for the Manus OAuth proxy flow (cross-origin redirect); `secure: true` is enforced in production via the `x-forwarded-proto` header check.
