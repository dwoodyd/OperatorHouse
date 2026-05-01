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

## Notification System
- [x] Add notifications table to schema and push DB migration
- [x] Build server-side notification helpers and tRPC procedures
- [x] Wire event triggers (new client, deal moved, payment, briefing ready)
- [x] Bell icon with unread badge in AppLayout header
- [x] Persistent inbox dropdown (mark read, clear all)
- [x] Toast pop-up on new notification

## Replay Intro Feature
- [x] IntroReplayContext: replayIntro() function, phase state, clears sessionStorage flags
- [x] App.tsx: IntroLayer component handles first-run gate and replay overlay; wrapped in IntroReplayProvider
- [x] OnboardingFlow: isReplay prop skips server-side onboarding.complete mutation during replay
- [x] Settings page: Replay Intro button in About section (amber, full-width, PlayCircle icon)
- [x] AppLayout sidebar: Replay Intro button below Settings link (hidden when collapsed)

## Bug Fixes (recorded session 2026-04-19)
- [x] Onboarding CTA buttons unresponsive after slide 1 (goTo not firing)
- [x] Onboarding pagination dots unresponsive
- [x] Lead analyzer: validation error on first attempt + silent failure on second
- [x] Missing sign-out button in sidebar/profile

## The Specter Mascot
- [x] Generate character sheet: full body, idle pose, small icon (transparent PNG)
- [x] Build SpectreWidget React component with CSS idle/breathe/eye-glow animations
- [x] Wire Specter into onboarding slides (appears slide 3+)
- [x] Wire Specter corner widget into dashboard with speech bubble
- [x] SpectreEmptyState component added to StateUI.tsx (mascot + speech bubble + title + body + action)
- [x] Wire SpectreEmptyState into Lead Intelligence (no leads)
- [x] Wire SpectreEmptyState into Tasks (no tasks / no completed tasks)
- [x] Wire SpectreEmptyState into Vault (empty / no filter match)
- [x] Wire SpectreEmptyState into Strategy Generator (output panel + history tab)
- [x] Wire SpectreEmptyState into Analytics (no activity data)
- [x] Wire Specter icon into Pipeline kanban columns (empty column per stage)

## Security Hardening (Audit 2026-04-22)
- [x] Install helmet, cors, rate-limit-redis, ioredis packages
- [x] Apply Helmet HTTP security headers (CSP disabled in dev, enabled in production)
- [x] Apply CORS policy whitelisting operatorhouse.click + manus.space + manus.computer domains
- [x] Upgrade all three rate limiters to use Redis distributed store when REDIS_URL env is present

## Specter + Dashboard Ghost Terminal (2026-04-22)
- [x] Specter on Pricing/paywall page with persuasive line
- [x] Ghost terminal widget on Dashboard (live pipeline one-liner)
- [ ] Publish to operatorhouse.click

## Onboarding Flow Fix (2026-04-22)
- [x] Reorder: onboarding slides shown once BEFORE welcome/sign-in page (localStorage gate)
- [x] Returning users skip slides entirely and go straight to app

## Ghost Terminal + Replay Button (2026-04-22)
- [x] Wire real staleCount from trpc.briefings.staleDeals into GhostTerminalWidget
- [x] Add persistent "Replay Intro" button accessible from inside the app (sidebar + Settings page)

## 404 Recovery Page (2026-04-22)
- [x] Replace generic 404 with branded Specter recovery page (no dead ends, clear path back to app)

## Specter Hover Speech Bubble (2026-04-22)
- [x] Specter corner widget on Dashboard shows speech bubble on hover with live context

## Specter Idle Drift Animation (2026-04-22)
- [x] Specter intensifies float animation when user is idle (60s), auto-whispers, resets on activity

## Review-Driven Fixes — B → A (2026-04-22)
### P0 — Reliability (AI calls silent)
- [x] Fix The Operator chat: server keepAliveTimeout raised to 120s, inline error in chat thread, last message restored on error
- [x] Fix Lead Intelligence Analyze button: auto-expand result on success, improved error message

### P1 — First-session content
- [x] Ship Sample Operator fixture: 3 seeded leads, 5 pipeline deals (one per stage), 5 Vault items, 1 strategy — "Load sample data" button on final onboarding slide

### P2 — Pricing + Polish
- [x] Publish Pricing page (Solo free / Operator $49 / Ghost $129) with in-app nav item (Pricing added to sidebar nav)
- [x] Fix OPERATOR HQ header — it is a non-clickable status label in the sidebar logo area (no change needed)
- [x] Add Ghost Efficiency tooltip explaining the 90% target metric (hover GHOST EFF: 90% in Ghost Terminal)
- [x] Add ⌘K keyboard shortcut hint to CMD button in header (visible on md+ screens)
- [ ] Analytics time-series chart (pipeline velocity / deal trend)
- [ ] Accessibility contrast pass on secondary stat-card labels

## Outreach Suite — Phase 1: Foundation (2026-04-30)
- [ ] Update Pricing page: add Operator Pro tier at $197/mo / $1,997/yr
- [ ] Add OUTREACH sidebar section with 5 new nav items (SMS, Calls, Voice Agents, Email Sequences, Client Pulse)
- [ ] Tier gating: Operator users see greyed-out Pro items with lock + upgrade prompt
- [ ] Add subscription_tier field to users table (operator | operator_pro)
- [ ] Push full Outreach Suite data model (12 new tables)
- [ ] Add phone_number, email, outreach_status, health_score, last_contacted_at to pipeline clients

## Outreach Suite — Phase 2: Client Pulse
- [ ] Client Pulse page at /pulse (health score dashboard + unified timeline)
- [ ] Health score calculator (recency 40%, responsiveness 30%, sentiment 15%, velocity 15%)
- [ ] At-risk alerts feeding into Command Center Next Best Action
- [ ] Dashboard integration: client health summary card

## Outreach Suite — Phase 3: Email Sequences
- [ ] Email Sequences page at /sequences (sequence builder + step editor + enrollees panel)
- [ ] 5 pre-built sequence templates with realistic content
- [ ] Automation trigger rules (pipeline stage change → auto-enroll)
- [ ] Resend API integration for email delivery + webhook tracking
- [ ] RESEND_API_KEY secret

## Outreach Suite — Phase 4: Call Center
- [ ] Call Center page at /calls (Queue / Log / Scripts tabs)
- [ ] Call queue with priority sorting, disposition quick-log form
- [ ] Call script builder with Ghost AI generation
- [ ] 3 pre-built scripts (Discovery, Follow-Up, Win-Back)
- [ ] tel: link fallback for mobile calling

## Outreach Suite — Phase 5: SMS Outreach
- [ ] SMS Outreach page at /sms (iMessage-style conversation UI)
- [ ] Template library with 6 pre-built templates + custom template creator
- [ ] Scheduled send + best-time logic
- [ ] Twilio SMS send/receive integration + webhook handler
- [ ] TCPA opt-out (STOP keyword) handling
- [ ] TWILIO_ACCOUNT_SID, TWILIO_AUTH_TOKEN, TWILIO_PHONE_NUMBER secrets

## Outreach Suite — Phase 6: AI Voice Agents
- [ ] Voice Agents page at /voice-agents (agent cards + create flow)
- [ ] 4 pre-built agent templates (Office Hours, Lead Intake, FAQ, Appointment Setter)
- [ ] Vault knowledge base linking per agent
- [ ] Vapi.ai integration + call transcript storage
- [ ] VAPI_API_KEY secret
