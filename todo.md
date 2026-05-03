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
- [x] Email Sequences page at /email-sequences (sequence builder + step editor + enrollees panel)
- [x] 5 pre-built sequence templates with realistic content (cold outreach, follow-up, re-engagement, discovery, win-back)
- [x] Automation trigger rules (pipeline stage change → auto-enroll)
- [x] Resend API integration for email delivery + webhook tracking
- [x] RESEND_API_KEY secret validated and injected

## Outreach Suite — Phase 4: Call Center
- [x] Call Center page at /call-center (Queue / Log / Scripts tabs)
- [x] Call queue with priority sorting (high/medium/low), disposition quick-log form (6 dispositions)
- [x] Call script builder with Ghost AI generation (structured JSON schema, objection handlers)
- [x] 3 pre-built scripts auto-seeded (Discovery, Follow-Up, Win-Back)
- [x] Email link fallback for mobile (tel: ready when phone field added to clients)

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

## Outreach Suite — Phase 2: Client Pulse (2026-04-30)
- [x] pulseRouter: calculateScores, getClientScores, getClientTimeline, addTimelineEvent, getAtRiskClients, getSummary
- [x] Health score formula: recency 40% + deal velocity 20% + responsiveness 30% + sentiment 10%
- [x] Pulse.tsx: health score rings, trend icons, at-risk alert strip, unified timeline, log interaction dialog
- [x] /pulse route registered in App.tsx
- [x] Sidebar OUTREACH section links to /pulse (Client Pulse)
- [x] Sidebar GROWTH/OPERATIONS/ENTERPRISE sections added with tier gating
- [x] Resend API key validated and injected

## Outreach Suite — Phase 5: SMS Outreach
- [x] SMS page at /sms (iMessage-style conversation UI, contact list sidebar)
- [x] 6 pre-built SMS templates (intro, follow-up, appointment, check-in, re-engage, close)
- [x] Twilio send/receive integration + webhook handler at /api/twilio/sms (queued when unconfigured)
- [x] Conversation threading per contact, opt-in status badge, timestamp display
- [x] Template quick-insert in compose bar

## Outreach Suite — Phase 6: AI Voice Agents
- [x] Voice Agents page at /voice-agents (agent cards + config form)
- [x] 4 pre-built agent templates (Discovery, Follow-Up, Appointment, Re-Engagement) auto-seeded
- [x] Vault knowledge base linking per agent (link/unlink dialog)
- [x] Vapi.ai integration stubs (deploy, activate/deactivate, update greeting)
- [x] Call transcript viewer with sentiment tags and outcome badges

## Phase 7 — CRM Suite (Business Tier)
- [ ] DB schema: contacts, companies, contact_tags, segments, custom_field_defs tables
- [ ] Push DB migration
- [ ] tRPC crmRouter: contacts CRUD, companies CRUD, segments, custom fields, import/export
- [ ] CRM page at /crm (contacts table with search/filter, lifecycle stage badges)
- [ ] Contact profile page at /crm/:id (editable fields + activity timeline)
- [ ] Companies tab at /crm/companies (table + company profile at /crm/companies/:id)
- [ ] Segments tab at /crm/segments (rule builder, live count preview, bulk actions)
- [ ] Custom Fields in Settings at /settings/custom-fields
- [ ] CSV import with column mapping + duplicate handling
- [ ] CSV export of filtered contacts view
- [ ] Wire CRM to sidebar GROWTH section

## Phase 8 — Invoicing & Payments (Business Tier)
- [ ] DB schema: invoices, invoice_line_items, payment_records tables
- [ ] Push DB migration
- [ ] tRPC invoicingRouter: invoice CRUD, Stripe checkout, status tracking, revenue stats
- [ ] Invoicing page at /invoicing (invoice table, status badges, revenue summary cards)
- [ ] Invoice builder (create/edit: client picker, line items, tax, discounts, payment terms)
- [ ] Invoice detail view with send, mark paid, download actions
- [ ] Stripe Checkout integration for online payment links
- [ ] Revenue dashboard (MRR, outstanding, revenue by client, monthly chart)
- [ ] Wire Invoicing to sidebar OPERATIONS section

## Phase 9 — Booking & Scheduling (Business Tier)

- [ ] meetingTypes, availability, bookings, blockedDates tables in schema.ts
- [ ] Run pnpm db:push for Phase 9 tables
- [ ] booking tRPC router: listMeetingTypes, createMeetingType, updateMeetingType, deleteMeetingType
- [ ] booking router: getAvailability, setAvailability, blockDate, unblockDate
- [ ] booking router: createBooking (public), listBookings, updateBookingStatus, getPublicSlots
- [ ] Booking main page at /booking (meeting types + upcoming bookings + availability)
- [ ] Public booking page at /book/:slug (no auth required)
- [ ] Wire /booking and /book/:slug routes in App.tsx

## Phase 10 — Funnel Builder (Business Tier)

- [ ] funnels, funnelPages, funnelSubmissions, funnelAnalytics tables in schema.ts
- [ ] Run pnpm db:push for Phase 10 tables
- [ ] funnels tRPC router: listFunnels, createFunnel, updateFunnel, deleteFunnel
- [ ] funnels router: listPages, createPage, updatePage, deletePage, reorderPages
- [ ] funnels router: submitForm (public), getSubmissions, getAnalytics
- [ ] Funnels main page at /funnels (funnel cards grid + create modal with 5 templates)
- [ ] Funnel page editor at /funnels/:id/edit (section builder + live preview)
- [ ] Public funnel page renderer at /f/:slug (no auth required)
- [ ] Wire /funnels, /funnels/:id/edit, /f/:slug routes in App.tsx

## Phase 11 — Social Media Agents (Business Tier)
- [ ] DB schema: socialAccounts, socialPosts, contentLibrary, socialStrategies tables
- [ ] tRPC router: connectAccount, listAccounts, createPost, schedulePost, generateWithAI
- [ ] tRPC router: listPosts, updatePost, deletePost, getCalendar, approvePost
- [ ] tRPC router: createStrategy, getStrategy, generateWeeklyContent
- [ ] tRPC router: saveToLibrary, listLibrary
- [ ] Frontend: Social page (platform cards, content calendar week view, create post modal)
- [ ] Frontend: AI Ghost generator tab (prompt, repurpose, tone, 3 variations)
- [ ] Frontend: Strategy page (/social/strategy — autonomous mode config + approval queue)
- [ ] Sidebar nav: Social Media Agents already in GROWTH section

## Phase 12 — Workflow Automations (Business Tier)
- [ ] DB schema: workflows, workflowNodes, workflowExecutions, workflowExecutionLogs tables
- [ ] tRPC router: createWorkflow, updateWorkflow, deleteWorkflow, listWorkflows
- [ ] tRPC router: saveNodes, getNodes, activateWorkflow, pauseWorkflow
- [ ] tRPC router: triggerManual, listExecutions, getExecutionDetail
- [ ] Frontend: Automations page (workflow cards grid, templates modal, status toggle)
- [ ] Frontend: Workflow editor (/automations/:id/edit — node canvas, toolbox, config panel)
- [ ] Frontend: Execution history tab (per-workflow run log with step status)
- [ ] Sidebar nav: Automations already in GROWTH section

## Phase 16 — Team & Permissions
- [x] teamMembers and teamInvites DB tables migrated
- [x] Team tRPC router: invite, accept, list, updateRole, updateStatus, remove, revokeInvite, myMembership
- [x] Team management page with member list, role badges, suspend/remove actions
- [x] Pending invites section with revoke button
- [x] JoinTeam public page for accepting invites
- [x] Team & Permissions sidebar nav item (business tier)
- [x] Routes: /team, /join-team/:token

## Phase 18 — Integrations Hub (Enterprise)
- [ ] Schema: api_keys, integration_configs, integration_logs tables
- [ ] tRPC: API key CRUD, integration config save/test, Slack webhook, Google Calendar stub, QuickBooks CSV export
- [ ] Frontend: Integrations Hub page (API Keys panel, Connected Apps, Webhook config)
- [ ] Wire routes and sidebar nav

## Phase 18 — Integrations Hub (Enterprise)
- [x] api_keys table migrated
- [x] integration_configs table migrated
- [x] integration_logs table migrated
- [x] integrations tRPC router: API key CRUD, integration config, Slack webhook, Google Calendar stub, QuickBooks CSV export
- [x] Integrations Hub frontend page (API Keys panel, Connected Apps, Webhook config, QuickBooks export)
- [x] Route /integrations wired in App.tsx
- [x] Sidebar nav item wired (business tier)

## Integrations Hub Guided Tour
- [x] GuidedTour reusable component (spotlight, tooltip, progress, skip/next/back)
- [x] Tour integrated into Integrations Hub with 6 steps
- [x] Tour auto-starts on first visit, replayable via "Take a Tour" button

## Bug Fix — Onboarding Sample Data
- [ ] Fix "Load Sample Data" button in onboarding — currently does nothing

## Bug Audit Fixes

### Critical
- [x] Remove VAPID private key hardcoded fallback in server/push.ts
- [x] Add push router (vapidKey, subscribe, unsubscribe) to server/routers.ts
- [x] Fix applicationServerKey to use Uint8Array (urlBase64 decode)
- [x] Delete orphan drizzle/0006_stripe_events.sql migration
- [x] Fix Stripe webhook idempotency: insert after success not before
- [x] Wire sign-out button in AppLayout (confirmSignOut/logout already declared)
- [x] Fix sameSite cookie to "lax" in server/_core/cookies.ts
- [x] Add IDOR ownership checks on leads/pipeline/vault/tasks inserts (already enforced at DB layer)
- [x] Delete dead server/index.ts entry point
- [x] Add idempotency key to Stripe checkout session creation

### High
- [x] Fix window.open popup-block in Pricing.tsx and Settings.tsx
- [x] Add onError to completeOnboarding mutation (OnboardingFlow.tsx)
- [x] Gate service worker on import.meta.env.PROD (already gated in index.html)
- [x] Guard getLoginUrl() against missing window (SSR/test context)
- [x] Add UNIQUE index on push_subscriptions.endpoint (varchar + unique constraint migrated)

### Medium
- [x] Add onError to completeOnboarding mutation
- [x] Add .max(20) to operator.chat history (trimmedHistory.slice(-20))
- [x] Fix test typecheck (add missing User keys in mocks — stripeCustomerId, subscriptionId, subscriptionStatus)
- [x] Fix test sameSite assertion to match "lax"

## Operator Audit Booking Flow (Calendly)
- [x] Build /audit page with Calendly inline embed (dwoodyd/15-min-operator-house-discovery-call)
- [x] Wire "Book Free Audit" CTA to landing page hero section
- [x] Add "Not ready? Book a free 15-min Operator Audit first" link to landing page final CTA section
- [x] Add "Book Audit" link to landing page footer
- [x] Add secondary "Not ready? Book a free 15-min Operator Audit" link to OnboardingFlow final slide (slide 7)
- [x] Add "Not sure which plan fits? Book a free 15-min Operator Audit" section to Pricing page
- [x] Register /audit route in App.tsx

## Blocking Pre-Launch Fixes
- [x] Fix goTo ReferenceError crash in OnboardingFlow.tsx — confirmed stale Vite cache, cleared; no code change needed
- [x] Fix sidebar nav path: /sequences → /email-sequences
- [x] Fix sidebar nav path: /calls → /call-center
- [x] Create Stripe products + prices in test sandbox (prod_URXYjMMgEPdT10, $97/mo + $788/yr)
- [ ] Add STRIPE_MONTHLY_PRICE_ID + STRIPE_ANNUAL_PRICE_ID to secrets (user to do when at computer)
- [x] Add Prospecting Engine stub page at /prospecting (no 404)
- [x] Clear stale Vite cache (SpectreEmptyState import error resolved)

## PWA Hardening & Reliability Plan

### Phase 1 — Capability Gating
- [x] Gate SMS Outreach: show "Twilio not connected" banner if TWILIO_ACCOUNT_SID/AUTH_TOKEN/FROM not set
- [x] Gate Call Center: show "Twilio not connected" banner if credentials missing
- [x] Gate Voice Agents: show "VAPI not connected" banner if VAPI_API_KEY not set
- [x] Gate Social Media Agents: show "Not connected" per-platform if OAuth tokens missing
- [x] Gate Email Sequences: show "Email dispatch not configured" if no send worker/credentials

### Phase 2 — PWA Manifest + Service Worker
- [x] Harden manifest.json: proper icons, start_url, display:standalone, theme_color (already solid — confirmed)
- [x] Service worker fetch handler: network-first API, cache-first static, offline fallback (already present — confirmed)
- [x] /offline.html fallback page (already present — confirmed)

### Phase 3 — Server-Side Preferences + LLM Safety
- [x] Migrate notification preferences from localStorage to server-side user_notification_preferences table
- [x] Update Settings.tsx NotificationPrefsSection to use tRPC (getPrefs/updatePrefs)
- [x] Update NotificationBell to read from server-side preferences
- [x] briefings.generate JSON.parse already in try/catch (confirmed — no change needed)

### Phase 4 — Observability
- [ ] Add global React ErrorBoundary with error reporting (log to server via tRPC) — deferred
- [ ] Add server-side error logging endpoint (trpc.system.logClientError) — deferred
- [ ] Add API latency/error rate logging middleware on Express — deferred

## Desktop Command Center Hardening

### Power-User Ergonomics
- [x] Build global command palette (Cmd+K / Ctrl+K) — CommandPalette.tsx with nav, Vault search, Specter shortcut
- [x] Wire CommandPaletteProvider in main.tsx
- [x] Update AppLayout: free Cmd+K for palette, add search button to topbar, Specter opens via oh:open-specter event
- [x] Keyboard navigation for Pipeline kanban (tabIndex, Enter/Space to open deal, focus ring)
- [x] Keyboard navigation for Tasks (tabIndex, Enter/Space to toggle done, Delete to remove)

### Rendering Performance
- [x] useTransition for Vault search and filter (opacity fade during transition)
- [x] useTransition for CRM contacts search and stage filter
- [x] @tanstack/react-virtual installed (available for future virtualization)
- [x] CRM uses server-side filtering with limit:100 (correct architecture — no DOM virtualization needed)

### Stale Data Management
- [x] Configure React Query: refetchOnWindowFocus: true, staleTime: 30s, gcTime: 5min globally
- [x] Notifications query: refetchInterval: 60000 for live badge updates

## Next Steps (Session 3)
- [ ] Configure STRIPE_MONTHLY_PRICE_ID and STRIPE_ANNUAL_PRICE_ID secrets
- [ ] Build observability layer: trpc.system.logClientError + wire into ErrorBoundary
- [ ] Add "Book Audit" link to AppLayout sidebar INTEL section

## Specter Character Video Integration (21 MP4 clips) — COMPLETE
- [x] Upload all 21 Specter MP4 clips to CDN via manus-upload-file --webdev
- [x] Build SpectreVideoPlayer component with state machine + crossfade transitions
- [x] Map clips to UI states: idle_breathing, welcoming, processing, thinking, triumph, pointing, bow, hologram, formal_bow
- [x] Integrate Specter videos into OnboardingFlow slides (one clip per slide with crossfade)
- [x] Add Specter idle video widget to AppLayout sidebar (bottom of nav, idle_breathing loop)
- [x] Wire Specter thinking state to LeadIntel AI processing (analyzeLead.isPending)
- [x] Wire Specter triumph state to StrategyGen on successful generation (4s flash)
- [x] Add Specter to landing page hero section (welcoming state, right side)
- [x] Add Specter to /audit booking page (hand_on_heart, fixed left side)

## New Specter Asset Integration (May 3)
- [x] Upload new mp_(1).mp4 video clip to CDN and register in SpectreVideoPlayer
- [x] Upload 6 UI state images (completion, dashboard_reveal, loading, onboarding, recommendation, warning) to CDN
- [x] Upload 11 gesture still images to CDN and export SPECTER_STILLS registry
- [x] Increase Specter size to 2xl on all 7 onboarding slides
- [x] Add UI context stills as subtle background panels on slides 1, 2, and 7
- [x] Add "Meet Specter" first-hover tooltip on sidebar idle widget (switches to welcoming on hover)
- [x] Wire Specter triumph to Pipeline Closed Won column drop (4.5s overlay + Deal Closed label)
- [x] Wire Specter triumph to Briefings Generate button (4.5s overlay + "Briefing Ready. ✨" label)

## Specter Video & Branding Pass (May 3 — Round 2)
- [x] Switch SpectreVideoPlayer mix-blend-mode from multiply to screen (remove black background)
- [x] Remove still images from all onboarding slides
- [x] Rename "Operator" to "Specter" throughout onboarding slides and key UI copy (slides 1, 4, 7; Dashboard Specter Briefing; sidebar tooltip)
