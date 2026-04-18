# GhostDesk TODO

## Phase 1 — Foundation (Full-Stack Upgrade)
- [x] Upgrade from static to full-stack (tRPC + MySQL + Manus Auth)
- [x] Design database schema: 10 tables (users, leads, pipeline_deals, strategies, vault_items, clients, tasks, activities, briefings, user_profiles)
- [x] Run db:push to migrate schema to production database
- [x] Build full server/db.ts query helpers for all tables
- [x] Build full tRPC routers for all modules (dashboard, leads, pipeline, vault, strategies, analytics, briefings, profile)
- [x] Add AI-powered leads.analyze procedure (real LLM via Ghost Consultant prompt)
- [x] Wire Dashboard to real tRPC data (metrics, activity log, pipeline overview)
- [x] Wire Lead Intelligence to real AI backend (LLM Soul Engineer Audit)
- [x] Wire Pipeline to real CRUD (create, update stage, delete deals)
- [x] Wire Vault to real CRUD (create, filter, delete vault items)
- [x] Wire Analytics to real metrics from DB
- [x] Wire Settings to real profile upsert
- [x] Add Settings page with Ghost OS status panel
- [x] Add /settings route to App.tsx
- [x] Fix all TypeScript errors (0 errors confirmed)

## Phase 2 — Real Intelligence Layer
- [x] Build centralized AI service layer (server/ai.ts) with versioned prompts
- [x] Lead Intelligence: real structured JSON analysis from LLM, grounded in vault/client context
- [x] Lead Intelligence: save analysis to leads table, retry/error states, remove all mock data
- [x] Strategy Generator: real AI generation from client+deal+vault context
- [x] Strategy Generator: save to strategies table, structured output, no fake typewriter
- [x] Remove all hardcoded demo arrays and fallback mock data from completed modules
- [x] Add citations field: reference vault items used in strategy generation

## Phase 3 — Premium UI/UX + Retention Layer
- [x] Upgrade global CSS design system (glassmorphism, depth, premium tokens, micro-animations)
- [x] Upgrade AppLayout sidebar (gradient logo, active state glow, user avatar, frosted topbar)
- [x] Upgrade metric cards (glass surface, animated number counters, subtle glow borders)
- [x] Upgrade Dashboard with login re-entry Ghost Briefing panel (AI-generated)
- [x] Add Next-Best-Action engine panel (derived from real pipeline/lead state)
- [x] Add stale pipeline detection (deals with no activity > 7 days flagged amber)
- [x] Apply glass-panel and fade-in-up entrance animations to all inner pages
- [x] Build Tasks page with full CRUD, priority system, optimistic updates
- [x] Add Tasks to sidebar navigation (8 nav items total)
- [x] briefings.generate procedure wired to real LLM
- [x] briefings.staleDeals procedure returning live data

## Bug Fixes
- [x] Fix pipeline_deals table missing from production DB (query errors on dashboard)
- [x] Verify all 10 tables exist in production DB after migration
- [x] Fix duplicate className attributes across all pages after glass-panel upgrade

## Pending — Phase 4 (Revenue + Scale)
- [ ] Add AI Chat Assistant panel (floating ghost chat sidebar)
- [ ] Add Voice Briefing feature (text-to-speech on lead audits)
- [x] Add "Push to Pipeline" button from Lead Intelligence (cross-module flow — real deal creation)
- [ ] Add client detail view (click client → full profile)
- [ ] Add public-facing landing page (/landing route)
- [ ] Add Stripe subscription checkout
- [ ] Add notification system (owner alerts on new leads/deals)
- [ ] Add onboarding flow for first-time users
- [ ] Add tiered pricing page
- [ ] Add usage analytics (track AI calls, leads analyzed, strategies generated)
- [ ] Add team/multi-user support
- [ ] Add white-label option for resellers
- [ ] Add export options (PDF/Markdown for strategies, CSV for pipeline)

## Rebrand + Chat Sidebar
- [x] Rename app from GhostDesk to Operator House: Your Operator HQ
- [x] Update sidebar logo, title, and subtitle copy
- [x] Update all page titles, subtitles, and in-app copy
- [x] Rename "Ghost" references to Operator-brand equivalents
- [x] Update VITE_APP_TITLE secret to "Operator House" (built-in, updated via index.html title)
- [x] Build AI chat sidebar (The Operator / Command Line) wired to real LLM
- [x] Add chat sidebar toggle button to topbar (CMD button in topbar)
- [x] Wire chat to context-aware system prompt using user's pipeline/lead data

## Logo & Brand Asset Integration
- [x] Upload OH symbol SVG and full lockup PNG to CDN
- [ ] Build premium door-open entry animation (SVG-based, splash screen)
- [x] Replace sidebar logo placeholder with OH symbol mark (CDN asset)
- [ ] Replace topbar/login with full lockup where appropriate
- [x] Update favicon with OH symbol mark
- [x] Update app title to Operator House in index.html

## P0 Beta-Readiness
- [x] Add rate limiting middleware on AI tRPC endpoints (express-rate-limit, 10 req/min per IP)
- [x] Add 45s AI timeout wrapper on all LLM calls (briefings, operator chat, lead audit, strategy)
- [x] Push to Pipeline button on Lead Intelligence (real deal creation, Discovery stage, intent score)
- [x] Mobile responsive sidebar (hamburger overlay drawer on mobile, collapsible on desktop)
- [x] Overflow-x hidden on main content area to prevent horizontal scroll on mobile

## Splash Screen Rework
- [x] Rewrite OHSplash: only OH symbol (no lockup), much larger (200px), door-open diagonal line animation with shine sweep
- [x] Upsize sidebar logo from 36px to 48px
- [x] Upsize home screen icon reference (sidebar logo upsized)

## About & Features Page
- [x] Build About.tsx with six module cards and How It Works section
- [x] Wire /about route in App.tsx
- [x] Add About to AppLayout sidebar nav

## Beta Readiness — Remaining
- [x] Public landing page (pre-login marketing page at /)
- [x] Vitest smoke tests: auth.me, leads.create, pipeline.create (8/8 passing)
- [ ] New-user onboarding redirect to /about on first login (deferred)

## UI Optimization (Tailwind + Animations + State Patterns)
- [x] Add GPU-accelerated keyframes to index.css (oh-spin, oh-fade-up, oh-fade-pulse)
- [x] Replace all transition:all with GPU-safe property-specific transitions across all pages
- [x] Build shared StateUI components: SkeletonRows, SkeletonCards, SkeletonKanban, EmptyState, PageLoader
- [x] Apply SkeletonRows to Tasks and LeadIntel loading states
- [x] Apply SkeletonCards to Vault loading state
- [x] Apply SkeletonKanban to Pipeline loading state
- [x] Apply PageLoader to Analytics loading state
- [x] Apply EmptyState to Tasks, LeadIntel, Vault empty states
- [x] Restyle NotFound page to match charcoal/ivory OH aesthetic
- [x] Upgrade Settings loading skeleton to match OH design system

## Compliance & App Store Readiness
- [x] Add users.deleteAccount tRPC procedure (cascading wipe of all user data)
- [x] Upgrade Settings page: Delete Account section with confirmation modal
- [x] Add Privacy Policy link, Terms of Service link, and About/version section to Settings
- [x] Write App Store and Play Store metadata document (descriptions, keywords, What's New)

## Legal Pages & Notifications
- [x] Build /privacy page (Privacy Policy)
- [x] Build /terms page (Terms of Service)
- [x] Wire /privacy and /terms routes in App.tsx
- [x] Add notifyOwner to leads.analyze procedure (fire-and-forget, non-blocking)

## Client Detail & Optimistic Updates
- [x] Build DealSlideOver component (activity log, linked lead audit, quick-edit fields)
- [x] Wire DealSlideOver into Pipeline page on deal card click
- [x] Optimistic updates + rollback on Pipeline deal mutations (move stage, delete)
- [x] Optimistic updates + rollback on Vault item mutations (add, delete)
- [x] Optimistic updates + rollback on Tasks mutations (toggle complete, delete — already had onMutate)

## Capacitor/Mobile Readiness
- [x] Audit browser-specific calls and produce Capacitor compatibility report
- [x] Build useOnlineStatus hook with navigator.onLine + online/offline events
- [x] Build OfflineBanner component (charcoal/ivory aesthetic, slide-down animation)
- [x] Wire OfflineBanner into App.tsx root (covers all pages including public)
- [x] Wire OfflineBanner into public pages (handled at App.tsx root level)

## Security & Validation Hardening
- [x] Ownership audit: all update/delete helpers confirmed to use userId WHERE clause at DB layer (no separate guard needed)
- [x] Frontend Zod validation: schemas.ts created, validation added to LeadIntel, Vault, Pipeline, Tasks, StrategyGen
- [x] Stripe integration: stripe.ts, webhook handler, checkout session, subscriptionStatus procedure
- [x] Schema migration: stripeCustomerId, subscriptionStatus, subscriptionId added to users table
- [x] Pricing page at /pricing with monthly/annual toggle and Stripe checkout
- [x] Pricing link added to Home hero CTA and footer nav
- [x] Stripe webhook route wired before express.json in server index.ts

## QA Review Fixes (B- → A-)
### Critical
- [x] Fix Analytics: replace fake/hardcoded chart data with real DB data or empty states
- [x] Fix Analytics: dynamic date (current month, not hardcoded March 2026)
- [x] Remove Stripe test card text from Pricing page
- [x] Clear Strategy Generator pre-filled test data (Marcus Chen / TechFlow Solutions)
### Medium
- [x] Notification bell: add dropdown panel with "No notifications yet" empty state
- [x] Sidebar nav: replace button elements with proper anchor/Link elements (QA v2 HIGH)
- [x] Add ARIA roles: role="navigation", role="main", role="banner", role="complementary" throughout (QA v2 HIGH)
- [x] Add tablet breakpoint (768–1024px): sidebar auto-collapses to icon-only on tablet (QA v2 MEDIUM)
- [x] Fix savings % consistency on Pricing page (confirmed 32%)
### Nice-to-Have
- [x] Cmd+K keyboard shortcut to open Command Line panel
- [x] Add manifest.json for PWA support
- [x] Register service worker (sw.js): cache-first static, network-first API, offline fallback (QA v2 MEDIUM)
- [x] Analytics scripts: single Umami tracker confirmed, no redundant scripts (QA v2 MEDIUM)
- [x] Add aria-label to all icon-only buttons: hamburger, close drawer, collapse/expand, notifications (QA v2 HIGH)

## Onboarding Upgrades (Cinematic / Conversion-Optimized)
- [x] Phase 1: Extend OHSplash with time-of-day welcome moment (greeting + OH lockup + ambient sweep, 5.4s total arc)
- [x] Phase 2: OnboardingFlow component — 3-card cinematic walkthrough (door/pipeline/command visuals, skip + Enter the House CTA, sessionStorage gated)
- [x] Phase 2: Wire OnboardingFlow into App.tsx after splash, first-login only (oh_onboarding_shown flag)
- [x] Phase 3: FirstMission component — guided first action replacing empty Dashboard state (add first client, gold flash, "The House is now active")
- [x] Phase 3: Wire FirstMission into Dashboard.tsx with zero-data detection (no leads, no deals, no clients)
- [x] Phase 4: Rewrite Pricing.tsx as "Claim Your Seat" — identity/aspiration framing, outcome promises, no feature table, two plan cards, Stripe checkout wired

## Follow-Up Batch (6 items)
- [x] Onboarding email trigger: notifyOwner fires on onboarding.complete (name + email, fire-and-forget)
- [x] Onboarding completion tracking: logActivity 'onboarding_completed' row on Enter the House
- [x] OnboardingFlow wired to trpc.onboarding.complete.useMutation on finish()
- [x] Pricing social proof: 3 operator testimonials (M.R., D.K., T.A.) above plan cards
- [x] Social proof styled: italic quote, gold dot + monospace name, muted role label
- [x] Zero TS errors confirmed after all 6 changes

## Animation Fix
- [x] OnboardingFlow: two-phase exit/enter (no flash), slower auto fades, smooth final exit
- [x] Progress label (1 / 3) above dots
- [x] Auto-advance after 8s idle, pauses on hover/touch

## Fix Batch — SW + Onboarding Last Card
- [x] Disable SW registration in dev/preview domains to stop stale chunk errors
- [x] Slow last card enter animation significantly (longer dwell, less info rush)
- [x] Disable auto-advance on card 3 (last card should stay until user acts)
