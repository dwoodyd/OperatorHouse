import {
  int,
  json,
  mysqlEnum,
  mysqlTable,
  text,
  timestamp,
  varchar,
  float,
  boolean,
} from "drizzle-orm/mysql-core";

/**
 * Core user table backing auth flow.
 * Extend this file with additional tables as your product grows.
 * Columns use camelCase to match both database fields and generated types.
 */
export const users = mysqlTable("users", {
  /**
   * Surrogate primary key. Auto-incremented numeric value managed by the database.
   * Use this for relations between tables.
   */
  id: int("id").autoincrement().primaryKey(),
  /** Manus OAuth identifier (openId) returned from the OAuth callback. Unique per user. */
  openId: varchar("openId", { length: 64 }).notNull().unique(),
  name: text("name"),
  email: varchar("email", { length: 320 }),
  loginMethod: varchar("loginMethod", { length: 64 }),
  role: mysqlEnum("role", ["user", "admin"]).default("user").notNull(),
  stripeCustomerId: varchar("stripeCustomerId", { length: 255 }),
  subscriptionStatus: varchar("subscriptionStatus", { length: 50 }).default("inactive"),
  subscriptionId: varchar("subscriptionId", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
  lastSignedIn: timestamp("lastSignedIn").defaultNow().notNull(),
});

export type User = typeof users.$inferSelect;
export type InsertUser = typeof users.$inferInsert;

// ─── Clients ──────────────────────────────────────────────────────────────────
export const clients = mysqlTable("clients", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  company: varchar("company", { length: 255 }),
  website: varchar("website", { length: 500 }),
  linkedinUrl: varchar("linkedinUrl", { length: 500 }),
  email: varchar("email", { length: 320 }),
  industry: varchar("industry", { length: 100 }),
  summary: text("summary"),
  status: mysqlEnum("status", ["active", "inactive", "prospect"]).default("prospect").notNull(),
  lastContactAt: timestamp("lastContactAt"),
  nextStep: text("nextStep"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Client = typeof clients.$inferSelect;
export type InsertClient = typeof clients.$inferInsert;

// ─── Leads ────────────────────────────────────────────────────────────────────
export const leads = mysqlTable("leads", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId"),
  sourceType: mysqlEnum("sourceType", ["linkedin", "email", "url", "twitter", "reddit", "manual"]).default("manual").notNull(),
  sourceValue: varchar("sourceValue", { length: 1000 }),
  rawInput: text("rawInput"),
  analysisJson: json("analysisJson"),
  intentScore: float("intentScore"),
  status: mysqlEnum("status", ["new", "review", "analysis", "ready", "sent", "closed"]).default("new").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Lead = typeof leads.$inferSelect;
export type InsertLead = typeof leads.$inferInsert;

// ─── Pipeline Deals ───────────────────────────────────────────────────────────
export const pipelineDeals = mysqlTable("pipeline_deals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId"),
  title: varchar("title", { length: 255 }).notNull(),
  stage: mysqlEnum("stage", ["Discovery", "Analysis", "Strategy", "Proposal", "Closed"]).default("Discovery").notNull(),
  value: float("value").default(0),
  intentScore: float("intentScore"),
  tags: json("tags").$type<string[]>(),
  notes: text("notes"),
  closeProbability: float("closeProbability"),
  expectedCloseDate: timestamp("expectedCloseDate"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type PipelineDeal = typeof pipelineDeals.$inferSelect;
export type InsertPipelineDeal = typeof pipelineDeals.$inferInsert;

// ─── Vault Items ──────────────────────────────────────────────────────────────
export const vaultItems = mysqlTable("vault_items", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId"),
  type: mysqlEnum("type", ["framework", "case_study", "voice_note", "template", "research", "note"]).default("note").notNull(),
  title: varchar("title", { length: 500 }).notNull(),
  content: text("content"),
  textContent: text("textContent"),
  filePath: varchar("filePath", { length: 1000 }),
  tags: json("tags").$type<string[]>(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VaultItem = typeof vaultItems.$inferSelect;
export type InsertVaultItem = typeof vaultItems.$inferInsert;

// ─── Strategies ───────────────────────────────────────────────────────────────
export const strategies = mysqlTable("strategies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId"),
  outputType: mysqlEnum("outputType", ["full", "quick", "deck", "email"]).default("full").notNull(),
  inputContext: json("inputContext"),
  content: text("content"),
  structuredOutput: json("structuredOutput"),
  promptVersion: varchar("promptVersion", { length: 32 }).default("v1"),
  modelName: varchar("modelName", { length: 64 }),
  status: mysqlEnum("status", ["generating", "complete", "failed"]).default("generating").notNull(),
  citations: json("citations"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Strategy = typeof strategies.$inferSelect;
export type InsertStrategy = typeof strategies.$inferInsert;

// ─── Activities ───────────────────────────────────────────────────────────────
export const activities = mysqlTable("activities", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId"),
  dealId: int("dealId"),
  activityType: varchar("activityType", { length: 64 }).notNull(),
  summary: varchar("summary", { length: 500 }),
  payload: json("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Activity = typeof activities.$inferSelect;
export type InsertActivity = typeof activities.$inferInsert;

// ─── Tasks ────────────────────────────────────────────────────────────────────
export const tasks = mysqlTable("tasks", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  clientId: int("clientId"),
  dealId: int("dealId"),
  title: varchar("title", { length: 500 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["pending", "in_progress", "done", "cancelled"]).default("pending").notNull(),
  priority: mysqlEnum("priority", ["low", "medium", "high", "urgent"]).default("medium").notNull(),
  dueAt: timestamp("dueAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Task = typeof tasks.$inferSelect;
export type InsertTask = typeof tasks.$inferInsert;

// ─── Briefings ────────────────────────────────────────────────────────────────
export const briefings = mysqlTable("briefings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  briefingType: mysqlEnum("briefingType", ["login", "daily", "weekly", "session"]).default("login").notNull(),
  content: text("content"),
  payload: json("payload"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Briefing = typeof briefings.$inferSelect;
export type InsertBriefing = typeof briefings.$inferInsert;

// Also add companyName + timezone to users
export const userProfiles = mysqlTable("user_profiles", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  companyName: varchar("companyName", { length: 255 }),
  timezone: varchar("timezone", { length: 64 }).default("America/New_York"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserProfile = typeof userProfiles.$inferSelect;
export type InsertUserProfile = typeof userProfiles.$inferInsert;

// ─── Notifications ────────────────────────────────────────────────────────────
export const notifications = mysqlTable("notifications", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  type: mysqlEnum("type", ["new_client", "deal_moved", "payment", "briefing_ready", "system"]).default("system").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body"),
  isRead: boolean("isRead").default(false).notNull(),
  metadata: json("metadata"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Notification = typeof notifications.$inferSelect;
export type InsertNotification = typeof notifications.$inferInsert;
// ─── Stripe Event Ledger (idempotency) ────────────────────────────────────────
export const stripeEvents = mysqlTable("stripe_events", {
  eventId: varchar("eventId", { length: 255 }).primaryKey(),
  eventType: varchar("eventType", { length: 100 }).notNull(),
  processedAt: timestamp("processedAt").defaultNow().notNull(),
});
export type StripeEvent = typeof stripeEvents.$inferSelect;
export type InsertStripeEvent = typeof stripeEvents.$inferInsert;

export const pushSubscriptions = mysqlTable('push_subscriptions', {
  id: int('id').primaryKey().autoincrement(),
  userId: int('user_id').notNull(),
  endpoint: text('endpoint').notNull(),
  p256dh: text('p256dh').notNull(),
  auth: text('auth').notNull(),
  createdAt: timestamp('created_at').defaultNow().notNull(),
});

// ═══════════════════════════════════════════════════════════════════════════════
// OUTREACH SUITE — Phase 1 Schema
// ═══════════════════════════════════════════════════════════════════════════════

// ─── User Subscriptions (tier tracking) ───────────────────────────────────────
export const userSubscriptions = mysqlTable("user_subscriptions", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull().unique(),
  tier: mysqlEnum("tier", ["operator", "operator_pro"]).default("operator").notNull(),
  stripeSubscriptionId: varchar("stripeSubscriptionId", { length: 255 }),
  currentPeriodEnd: timestamp("currentPeriodEnd"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type UserSubscription = typeof userSubscriptions.$inferSelect;
export type InsertUserSubscription = typeof userSubscriptions.$inferInsert;

// ─── Client Outreach Profiles ─────────────────────────────────────────────────
export const clientOutreachProfiles = mysqlTable("client_outreach_profiles", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull().unique(),
  userId: int("userId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 30 }),
  outreachStatus: mysqlEnum("outreachStatus", ["not_started", "active", "paused", "completed"]).default("not_started").notNull(),
  healthScore: int("healthScore").default(50),
  lastContactedAt: timestamp("lastContactedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type ClientOutreachProfile = typeof clientOutreachProfiles.$inferSelect;
export type InsertClientOutreachProfile = typeof clientOutreachProfiles.$inferInsert;

// ─── Client Health Scores ─────────────────────────────────────────────────────
export const clientHealthScores = mysqlTable("client_health_scores", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  score: int("score").default(50).notNull(),
  factors: json("factors"),
  trend: mysqlEnum("trend", ["improving", "stable", "declining"]).default("stable").notNull(),
  calculatedAt: timestamp("calculatedAt").defaultNow().notNull(),
});
export type ClientHealthScore = typeof clientHealthScores.$inferSelect;
export type InsertClientHealthScore = typeof clientHealthScores.$inferInsert;

// ─── Client Timeline Events ───────────────────────────────────────────────────
export const clientTimelineEvents = mysqlTable("client_timeline_events", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  eventType: mysqlEnum("eventType", ["sms", "call", "email", "voice_agent", "pipeline_change", "strategy_delivered", "note"]).notNull(),
  eventId: int("eventId"),
  summary: varchar("summary", { length: 1000 }),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  occurredAt: timestamp("occurredAt").defaultNow().notNull(),
});
export type ClientTimelineEvent = typeof clientTimelineEvents.$inferSelect;
export type InsertClientTimelineEvent = typeof clientTimelineEvents.$inferInsert;

// ─── SMS Conversations ────────────────────────────────────────────────────────
export const smsConversations = mysqlTable("sms_conversations", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 30 }).notNull(),
  optInStatus: mysqlEnum("optInStatus", ["opted_in", "opted_out", "pending"]).default("pending").notNull(),
  optInDate: timestamp("optInDate"),
  lastMessageAt: timestamp("lastMessageAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SmsConversation = typeof smsConversations.$inferSelect;
export type InsertSmsConversation = typeof smsConversations.$inferInsert;

// ─── SMS Messages ─────────────────────────────────────────────────────────────
export const smsMessages = mysqlTable("sms_messages", {
  id: int("id").autoincrement().primaryKey(),
  conversationId: int("conversationId").notNull(),
  userId: int("userId").notNull(),
  direction: mysqlEnum("direction", ["inbound", "outbound"]).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["queued", "sent", "delivered", "failed", "read"]).default("queued").notNull(),
  twilioSid: varchar("twilioSid", { length: 64 }),
  templateId: int("templateId"),
  scheduledFor: timestamp("scheduledFor"),
  sentAt: timestamp("sentAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SmsMessage = typeof smsMessages.$inferSelect;
export type InsertSmsMessage = typeof smsMessages.$inferInsert;

// ─── SMS Templates ────────────────────────────────────────────────────────────
export const smsTemplates = mysqlTable("sms_templates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  body: text("body").notNull(),
  category: mysqlEnum("category", ["follow_up", "reminder", "check_in", "celebration", "re_engagement", "referral", "custom"]).default("custom").notNull(),
  isBuiltIn: boolean("isBuiltIn").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SmsTemplate = typeof smsTemplates.$inferSelect;
export type InsertSmsTemplate = typeof smsTemplates.$inferInsert;

// ─── Calls ────────────────────────────────────────────────────────────────────
export const calls = mysqlTable("calls", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  phoneNumber: varchar("phoneNumber", { length: 30 }),
  direction: mysqlEnum("direction", ["outbound", "inbound"]).default("outbound").notNull(),
  disposition: mysqlEnum("disposition", ["connected", "voicemail", "no_answer", "wrong_number", "busy"]),
  durationSeconds: int("durationSeconds"),
  notes: text("notes"),
  scriptId: int("scriptId"),
  followUpDate: timestamp("followUpDate"),
  recorded: boolean("recorded").default(false).notNull(),
  recordingUrl: varchar("recordingUrl", { length: 1000 }),
  calledAt: timestamp("calledAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Call = typeof calls.$inferSelect;
export type InsertCall = typeof calls.$inferInsert;

// ─── Call Scripts ─────────────────────────────────────────────────────────────
export const callScripts = mysqlTable("call_scripts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  pipelineStage: mysqlEnum("pipelineStage", ["Discovery", "Analysis", "Strategy", "Proposal", "Closed", "nurture"]).notNull(),
  openingLines: text("openingLines"),
  talkingPoints: json("talkingPoints"),
  objectionHandlers: json("objectionHandlers"),
  closingLines: text("closingLines"),
  isAiGenerated: boolean("isAiGenerated").default(false).notNull(),
  isBuiltIn: boolean("isBuiltIn").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CallScript = typeof callScripts.$inferSelect;
export type InsertCallScript = typeof callScripts.$inferInsert;

// ─── Call Queue ───────────────────────────────────────────────────────────────
export const callQueue = mysqlTable("call_queue", {
  id: int("id").autoincrement().primaryKey(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  priority: mysqlEnum("priority", ["high", "medium", "low"]).default("medium").notNull(),
  reason: mysqlEnum("reason", ["new_lead", "follow_up", "stale_deal", "scheduled"]).default("follow_up").notNull(),
  scheduledFor: timestamp("scheduledFor"),
  completed: boolean("completed").default(false).notNull(),
  completedAt: timestamp("completedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CallQueueItem = typeof callQueue.$inferSelect;
export type InsertCallQueueItem = typeof callQueue.$inferInsert;

// ─── Email Sequences ──────────────────────────────────────────────────────────
export const emailSequences = mysqlTable("email_sequences", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  triggerType: mysqlEnum("triggerType", ["manual", "pipeline_stage_change", "deal_closed", "deal_stale", "scheduled"]).default("manual").notNull(),
  triggerConfig: json("triggerConfig"),
  status: mysqlEnum("status", ["active", "paused", "draft"]).default("draft").notNull(),
  isBuiltIn: boolean("isBuiltIn").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type EmailSequence = typeof emailSequences.$inferSelect;
export type InsertEmailSequence = typeof emailSequences.$inferInsert;

// ─── Email Sequence Steps ─────────────────────────────────────────────────────
export const emailSequenceSteps = mysqlTable("email_sequence_steps", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull(),
  stepOrder: int("stepOrder").notNull(),
  delayDays: int("delayDays").default(0).notNull(),
  subjectTemplate: varchar("subjectTemplate", { length: 500 }).notNull(),
  bodyTemplate: text("bodyTemplate").notNull(),
  sendTimePreference: mysqlEnum("sendTimePreference", ["morning", "afternoon", "best_time"]).default("morning").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailSequenceStep = typeof emailSequenceSteps.$inferSelect;
export type InsertEmailSequenceStep = typeof emailSequenceSteps.$inferInsert;

// ─── Email Sequence Enrollments ───────────────────────────────────────────────
export const emailSequenceEnrollments = mysqlTable("email_sequence_enrollments", {
  id: int("id").autoincrement().primaryKey(),
  sequenceId: int("sequenceId").notNull(),
  clientId: int("clientId").notNull(),
  userId: int("userId").notNull(),
  currentStep: int("currentStep").default(0).notNull(),
  status: mysqlEnum("status", ["active", "completed", "paused", "unsubscribed"]).default("active").notNull(),
  enrolledAt: timestamp("enrolledAt").defaultNow().notNull(),
  lastEmailSentAt: timestamp("lastEmailSentAt"),
});
export type EmailSequenceEnrollment = typeof emailSequenceEnrollments.$inferSelect;
export type InsertEmailSequenceEnrollment = typeof emailSequenceEnrollments.$inferInsert;

// ─── Email Sends ──────────────────────────────────────────────────────────────
export const emailSends = mysqlTable("email_sends", {
  id: int("id").autoincrement().primaryKey(),
  enrollmentId: int("enrollmentId").notNull(),
  stepId: int("stepId").notNull(),
  userId: int("userId").notNull(),
  subject: varchar("subject", { length: 500 }).notNull(),
  body: text("body").notNull(),
  toEmail: varchar("toEmail", { length: 320 }).notNull(),
  resendId: varchar("resendId", { length: 255 }),
  status: mysqlEnum("status", ["queued", "sent", "delivered", "opened", "clicked", "replied", "bounced", "failed"]).default("queued").notNull(),
  sentAt: timestamp("sentAt"),
  openedAt: timestamp("openedAt"),
  clickedAt: timestamp("clickedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type EmailSend = typeof emailSends.$inferSelect;
export type InsertEmailSend = typeof emailSends.$inferInsert;

// ─── Voice Agents ─────────────────────────────────────────────────────────────
export const voiceAgents = mysqlTable("voice_agents", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  voiceId: varchar("voiceId", { length: 255 }),
  personality: mysqlEnum("personality", ["professional", "warm", "concise", "custom"]).default("professional").notNull(),
  greetingScript: text("greetingScript"),
  fallbackAction: mysqlEnum("fallbackAction", ["voicemail", "transfer", "schedule_callback"]).default("voicemail").notNull(),
  isActive: boolean("isActive").default(false).notNull(),
  phoneNumber: varchar("phoneNumber", { length: 30 }),
  vapiAgentId: varchar("vapiAgentId", { length: 255 }),
  isBuiltIn: boolean("isBuiltIn").default(false).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type VoiceAgent = typeof voiceAgents.$inferSelect;
export type InsertVoiceAgent = typeof voiceAgents.$inferInsert;

// ─── Voice Agent Calls ────────────────────────────────────────────────────────
export const voiceAgentCalls = mysqlTable("voice_agent_calls", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  userId: int("userId").notNull(),
  clientId: int("clientId"),
  callerPhone: varchar("callerPhone", { length: 30 }),
  durationSeconds: int("durationSeconds"),
  transcript: text("transcript"),
  summary: text("summary"),
  sentiment: mysqlEnum("sentiment", ["positive", "neutral", "negative"]),
  outcome: mysqlEnum("outcome", ["resolved", "transferred", "callback_scheduled", "voicemail"]),
  vapiCallId: varchar("vapiCallId", { length: 255 }),
  handledAt: timestamp("handledAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type VoiceAgentCall = typeof voiceAgentCalls.$inferSelect;
export type InsertVoiceAgentCall = typeof voiceAgentCalls.$inferInsert;

// ─── Voice Agent Knowledge (Vault links) ─────────────────────────────────────
export const voiceAgentKnowledge = mysqlTable("voice_agent_knowledge", {
  id: int("id").autoincrement().primaryKey(),
  agentId: int("agentId").notNull(),
  vaultItemId: int("vaultItemId").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type VoiceAgentKnowledge = typeof voiceAgentKnowledge.$inferSelect;
export type InsertVoiceAgentKnowledge = typeof voiceAgentKnowledge.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 7 — CRM SUITE (Business Tier)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── CRM Contacts ─────────────────────────────────────────────────────────────
export const crmContacts = mysqlTable("crm_contacts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  firstName: varchar("firstName", { length: 255 }).notNull(),
  lastName: varchar("lastName", { length: 255 }).default("").notNull(),
  email: varchar("email", { length: 320 }),
  phone: varchar("phone", { length: 30 }),
  secondaryEmail: varchar("secondaryEmail", { length: 320 }),
  companyId: int("companyId"),
  title: varchar("title", { length: 255 }),
  lifecycleStage: mysqlEnum("lifecycleStage", ["lead", "prospect", "client", "past_client", "partner"]).default("lead").notNull(),
  source: mysqlEnum("source", ["manual", "funnel", "import", "prospecting", "referral", "social"]).default("manual").notNull(),
  tags: json("tags").$type<string[]>(),
  customFields: json("customFields").$type<Record<string, unknown>>(),
  avatarUrl: varchar("avatarUrl", { length: 1000 }),
  timezone: varchar("timezone", { length: 64 }),
  optedInSms: boolean("optedInSms").default(false).notNull(),
  optedInEmail: boolean("optedInEmail").default(true).notNull(),
  healthScore: int("healthScore").default(50),
  lastContactedAt: timestamp("lastContactedAt"),
  linkedClientId: int("linkedClientId"),
  notes: text("notes"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmContact = typeof crmContacts.$inferSelect;
export type InsertCrmContact = typeof crmContacts.$inferInsert;

// ─── CRM Companies ────────────────────────────────────────────────────────────
export const crmCompanies = mysqlTable("crm_companies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  industry: varchar("industry", { length: 100 }),
  size: mysqlEnum("size", ["solo", "small", "medium", "large", "enterprise"]).default("small").notNull(),
  website: varchar("website", { length: 500 }),
  description: text("description"),
  tags: json("tags").$type<string[]>(),
  customFields: json("customFields").$type<Record<string, unknown>>(),
  totalPipelineValue: float("totalPipelineValue").default(0),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmCompany = typeof crmCompanies.$inferSelect;
export type InsertCrmCompany = typeof crmCompanies.$inferInsert;

// ─── CRM Contact Tags ─────────────────────────────────────────────────────────
export const crmContactTags = mysqlTable("crm_contact_tags", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 100 }).notNull(),
  color: varchar("color", { length: 20 }).default("#6366f1").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CrmContactTag = typeof crmContactTags.$inferSelect;
export type InsertCrmContactTag = typeof crmContactTags.$inferInsert;

// ─── CRM Segments ─────────────────────────────────────────────────────────────
export const crmSegments = mysqlTable("crm_segments", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  filterRules: json("filterRules").notNull(),
  contactCount: int("contactCount").default(0),
  isDynamic: boolean("isDynamic").default(true).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type CrmSegment = typeof crmSegments.$inferSelect;
export type InsertCrmSegment = typeof crmSegments.$inferInsert;

// ─── CRM Custom Field Definitions ─────────────────────────────────────────────
export const crmCustomFieldDefs = mysqlTable("crm_custom_field_defs", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  entityType: mysqlEnum("entityType", ["contact", "company"]).notNull(),
  fieldName: varchar("fieldName", { length: 100 }).notNull(),
  label: varchar("label", { length: 255 }).notNull(),
  fieldType: mysqlEnum("fieldType", ["text", "number", "date", "dropdown", "checkbox", "url", "long_text"]).notNull(),
  options: json("options").$type<string[]>(),
  isRequired: boolean("isRequired").default(false).notNull(),
  sortOrder: int("sortOrder").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CrmCustomFieldDef = typeof crmCustomFieldDefs.$inferSelect;
export type InsertCrmCustomFieldDef = typeof crmCustomFieldDefs.$inferInsert;

// ─── CRM Activity Notes ───────────────────────────────────────────────────────
export const crmActivityNotes = mysqlTable("crm_activity_notes", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId").notNull(),
  note: text("note").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type CrmActivityNote = typeof crmActivityNotes.$inferSelect;
export type InsertCrmActivityNote = typeof crmActivityNotes.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 8 — INVOICING & PAYMENTS (Business Tier)
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Invoices ─────────────────────────────────────────────────────────────────
export const invoices = mysqlTable("invoices", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  invoiceNumber: varchar("invoiceNumber", { length: 50 }).notNull(),
  contactId: int("contactId"),
  companyId: int("companyId"),
  clientName: varchar("clientName", { length: 255 }).notNull(),
  clientEmail: varchar("clientEmail", { length: 320 }),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "paid", "overdue", "cancelled"]).default("draft").notNull(),
  lineItems: json("lineItems").notNull(),
  subtotal: float("subtotal").default(0).notNull(),
  taxRate: float("taxRate").default(0).notNull(),
  taxAmount: float("taxAmount").default(0).notNull(),
  discountAmount: float("discountAmount").default(0).notNull(),
  total: float("total").default(0).notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  paymentTerms: mysqlEnum("paymentTerms", ["due_on_receipt", "net_15", "net_30", "net_60"]).default("net_30").notNull(),
  dueDate: timestamp("dueDate"),
  paidAt: timestamp("paidAt"),
  paymentMethod: varchar("paymentMethod", { length: 50 }),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  stripeInvoiceId: varchar("stripeInvoiceId", { length: 255 }),
  stripePaymentLinkId: varchar("stripePaymentLinkId", { length: 255 }),
  notes: text("notes"),
  isRecurring: boolean("isRecurring").default(false).notNull(),
  recurringInterval: mysqlEnum("recurringInterval", ["weekly", "monthly", "quarterly", "yearly"]),
  recurringNextDate: timestamp("recurringNextDate"),
  sentAt: timestamp("sentAt"),
  viewedAt: timestamp("viewedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Invoice = typeof invoices.$inferSelect;
export type InsertInvoice = typeof invoices.$inferInsert;

// ─── Invoice Counter (auto-increment number per user) ─────────────────────────
export const invoiceCounters = mysqlTable("invoice_counters", {
  userId: int("userId").primaryKey(),
  lastNumber: int("lastNumber").default(0).notNull(),
});
export type InvoiceCounter = typeof invoiceCounters.$inferSelect;

// ─── Payment Records ──────────────────────────────────────────────────────────
export const paymentRecords = mysqlTable("payment_records", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  invoiceId: int("invoiceId").notNull(),
  amount: float("amount").notNull(),
  currency: varchar("currency", { length: 3 }).default("USD").notNull(),
  method: mysqlEnum("method", ["stripe", "bank_transfer", "cash", "check", "other"]).default("stripe").notNull(),
  stripePaymentIntentId: varchar("stripePaymentIntentId", { length: 255 }),
  notes: text("notes"),
  paidAt: timestamp("paidAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PaymentRecord = typeof paymentRecords.$inferSelect;
export type InsertPaymentRecord = typeof paymentRecords.$inferInsert;


// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 9 — BOOKING & SCHEDULING
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Meeting Types ────────────────────────────────────────────────────────────
export const meetingTypes = mysqlTable("meeting_types", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  description: text("description"),
  durationMinutes: int("durationMinutes").default(30).notNull(),
  color: varchar("color", { length: 20 }).default("#f5c842").notNull(),
  bufferBeforeMinutes: int("bufferBeforeMinutes").default(0).notNull(),
  bufferAfterMinutes: int("bufferAfterMinutes").default(0).notNull(),
  intakeQuestions: json("intakeQuestions"),
  isActive: boolean("isActive").default(true).notNull(),
  maxBookingsPerDay: int("maxBookingsPerDay"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type MeetingType = typeof meetingTypes.$inferSelect;
export type InsertMeetingType = typeof meetingTypes.$inferInsert;

// ─── Availability (weekly schedule) ──────────────────────────────────────────
export const availability = mysqlTable("availability", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  dayOfWeek: int("dayOfWeek").notNull(),
  startTime: varchar("startTime", { length: 5 }).notNull(),
  endTime: varchar("endTime", { length: 5 }).notNull(),
  isAvailable: boolean("isAvailable").default(true).notNull(),
});
export type Availability = typeof availability.$inferSelect;
export type InsertAvailability = typeof availability.$inferInsert;

// ─── Blocked Dates ────────────────────────────────────────────────────────────
export const blockedDates = mysqlTable("blocked_dates", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  date: varchar("date", { length: 10 }).notNull(),
  reason: varchar("reason", { length: 255 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type BlockedDate = typeof blockedDates.$inferSelect;
export type InsertBlockedDate = typeof blockedDates.$inferInsert;

// ─── Bookings ─────────────────────────────────────────────────────────────────
export const bookings = mysqlTable("bookings", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  meetingTypeId: int("meetingTypeId").notNull(),
  contactId: int("contactId"),
  bookedByName: varchar("bookedByName", { length: 255 }).notNull(),
  bookedByEmail: varchar("bookedByEmail", { length: 320 }).notNull(),
  bookedByPhone: varchar("bookedByPhone", { length: 50 }),
  startTime: timestamp("startTime").notNull(),
  endTime: timestamp("endTime").notNull(),
  status: mysqlEnum("status", ["confirmed", "cancelled", "completed", "no_show"]).default("confirmed").notNull(),
  intakeResponses: json("intakeResponses"),
  calendarEventId: varchar("calendarEventId", { length: 255 }),
  confirmationSent: boolean("confirmationSent").default(false).notNull(),
  reminderSent: boolean("reminderSent").default(false).notNull(),
  notes: text("notes"),
  cancelReason: varchar("cancelReason", { length: 500 }),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Booking = typeof bookings.$inferSelect;
export type InsertBooking = typeof bookings.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 10 — FUNNEL BUILDER
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Funnels ──────────────────────────────────────────────────────────────────
export const funnels = mysqlTable("funnels", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["draft", "published", "archived"]).default("draft").notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  templateType: varchar("templateType", { length: 50 }),
  totalViews: int("totalViews").default(0).notNull(),
  totalSubmissions: int("totalSubmissions").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Funnel = typeof funnels.$inferSelect;
export type InsertFunnel = typeof funnels.$inferInsert;

// ─── Funnel Pages ─────────────────────────────────────────────────────────────
export const funnelPages = mysqlTable("funnel_pages", {
  id: int("id").autoincrement().primaryKey(),
  funnelId: int("funnelId").notNull(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  slug: varchar("slug", { length: 100 }).notNull(),
  pageOrder: int("pageOrder").default(0).notNull(),
  sections: json("sections").notNull(),
  formConfig: json("formConfig"),
  seoTitle: varchar("seoTitle", { length: 255 }),
  seoDescription: text("seoDescription"),
  isPublished: boolean("isPublished").default(false).notNull(),
  views: int("views").default(0).notNull(),
  submissions: int("submissions").default(0).notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type FunnelPage = typeof funnelPages.$inferSelect;
export type InsertFunnelPage = typeof funnelPages.$inferInsert;

// ─── Funnel Submissions ───────────────────────────────────────────────────────
export const funnelSubmissions = mysqlTable("funnel_submissions", {
  id: int("id").autoincrement().primaryKey(),
  funnelPageId: int("funnelPageId").notNull(),
  funnelId: int("funnelId").notNull(),
  userId: int("userId").notNull(),
  contactId: int("contactId"),
  formData: json("formData").notNull(),
  sourceUrl: varchar("sourceUrl", { length: 1000 }),
  utmSource: varchar("utmSource", { length: 255 }),
  utmMedium: varchar("utmMedium", { length: 255 }),
  utmCampaign: varchar("utmCampaign", { length: 255 }),
  ipAddress: varchar("ipAddress", { length: 45 }),
  submittedAt: timestamp("submittedAt").defaultNow().notNull(),
});
export type FunnelSubmission = typeof funnelSubmissions.$inferSelect;
export type InsertFunnelSubmission = typeof funnelSubmissions.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 11 — SOCIAL MEDIA AGENTS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Social Accounts ──────────────────────────────────────────────────────────
export const socialAccounts = mysqlTable("social_accounts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  platform: mysqlEnum("platform", ["linkedin", "twitter", "instagram", "facebook"]).notNull(),
  accountName: varchar("accountName", { length: 255 }).notNull(),
  accountHandle: varchar("accountHandle", { length: 255 }),
  accountId: varchar("accountId", { length: 255 }),
  accessToken: text("accessToken"),
  refreshToken: text("refreshToken"),
  tokenExpiresAt: timestamp("tokenExpiresAt"),
  followerCount: int("followerCount").default(0),
  isConnected: boolean("isConnected").default(false).notNull(),
  connectedAt: timestamp("connectedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SocialAccount = typeof socialAccounts.$inferSelect;
export type InsertSocialAccount = typeof socialAccounts.$inferInsert;

// ─── Social Posts ─────────────────────────────────────────────────────────────
export const socialPosts = mysqlTable("social_posts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  accountId: int("accountId"),
  platform: mysqlEnum("platform", ["linkedin", "twitter", "instagram", "facebook"]).notNull(),
  content: text("content").notNull(),
  mediaUrls: json("mediaUrls").$type<string[]>().default([]),
  hashtags: json("hashtags").$type<string[]>().default([]),
  status: mysqlEnum("status", ["draft", "scheduled", "published", "failed", "pending_approval"]).default("draft").notNull(),
  approvalStatus: mysqlEnum("approvalStatus", ["pending", "approved", "rejected"]).default("approved"),
  scheduledFor: timestamp("scheduledFor"),
  publishedAt: timestamp("publishedAt"),
  platformPostId: varchar("platformPostId", { length: 255 }),
  aiGenerated: boolean("aiGenerated").default(false).notNull(),
  aiPrompt: text("aiPrompt"),
  metrics: json("metrics").$type<{ impressions?: number; engagement?: number; clicks?: number; shares?: number; comments?: number }>(),
  strategyId: int("strategyId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type SocialPost = typeof socialPosts.$inferSelect;
export type InsertSocialPost = typeof socialPosts.$inferInsert;

// ─── Content Library ──────────────────────────────────────────────────────────
export const contentLibrary = mysqlTable("content_library", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  content: text("content").notNull(),
  category: mysqlEnum("category", ["tips", "case_study", "promotion", "thought_leadership", "custom"]).default("custom").notNull(),
  mediaUrls: json("mediaUrls").$type<string[]>().default([]),
  hashtagSets: json("hashtagSets").$type<string[][]>().default([]),
  platformVariants: json("platformVariants").$type<Record<string, string>>(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ContentLibraryItem = typeof contentLibrary.$inferSelect;
export type InsertContentLibraryItem = typeof contentLibrary.$inferInsert;

// ─── Social Strategies ────────────────────────────────────────────────────────
export const socialStrategies = mysqlTable("social_strategies", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  platforms: json("platforms").$type<string[]>().default([]),
  topics: json("topics").$type<string[]>().default([]),
  tone: mysqlEnum("tone", ["professional", "casual", "thought_leader", "educational"]).default("professional").notNull(),
  postsPerWeek: int("postsPerWeek").default(5).notNull(),
  preferredTimes: json("preferredTimes").$type<Record<string, string[]>>(),
  vaultContextIds: json("vaultContextIds").$type<number[]>().default([]),
  isActive: boolean("isActive").default(false).notNull(),
  lastGeneratedAt: timestamp("lastGeneratedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type SocialStrategy = typeof socialStrategies.$inferSelect;
export type InsertSocialStrategy = typeof socialStrategies.$inferInsert;

// ═══════════════════════════════════════════════════════════════════════════════
// PHASE 12 — WORKFLOW AUTOMATIONS
// ═══════════════════════════════════════════════════════════════════════════════

// ─── Workflows ────────────────────────────────────────────────────────────────
export const workflows = mysqlTable("workflows", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  name: varchar("name", { length: 255 }).notNull(),
  description: text("description"),
  status: mysqlEnum("status", ["active", "paused", "draft"]).default("draft").notNull(),
  triggerType: varchar("triggerType", { length: 100 }).notNull(),
  triggerConfig: json("triggerConfig").$type<Record<string, unknown>>(),
  executionCount: int("executionCount").default(0).notNull(),
  successCount: int("successCount").default(0).notNull(),
  failureCount: int("failureCount").default(0).notNull(),
  lastExecutedAt: timestamp("lastExecutedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Workflow = typeof workflows.$inferSelect;
export type InsertWorkflow = typeof workflows.$inferInsert;

// ─── Workflow Nodes ───────────────────────────────────────────────────────────
export const workflowNodes = mysqlTable("workflow_nodes", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  nodeType: mysqlEnum("nodeType", ["trigger", "action", "condition", "delay"]).notNull(),
  actionType: varchar("actionType", { length: 100 }),
  label: varchar("label", { length: 255 }),
  config: json("config").$type<Record<string, unknown>>(),
  positionX: int("positionX").default(0).notNull(),
  positionY: int("positionY").default(0).notNull(),
  nextNodeId: int("nextNodeId"),
  trueBranchNodeId: int("trueBranchNodeId"),
  falseBranchNodeId: int("falseBranchNodeId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type WorkflowNode = typeof workflowNodes.$inferSelect;
export type InsertWorkflowNode = typeof workflowNodes.$inferInsert;

// ─── Workflow Executions ──────────────────────────────────────────────────────
export const workflowExecutions = mysqlTable("workflow_executions", {
  id: int("id").autoincrement().primaryKey(),
  workflowId: int("workflowId").notNull(),
  userId: int("userId").notNull(),
  contactId: int("contactId"),
  status: mysqlEnum("status", ["running", "completed", "failed", "paused"]).default("running").notNull(),
  currentNodeId: int("currentNodeId"),
  triggerData: json("triggerData").$type<Record<string, unknown>>(),
  errorMessage: text("errorMessage"),
  startedAt: timestamp("startedAt").defaultNow().notNull(),
  completedAt: timestamp("completedAt"),
});
export type WorkflowExecution = typeof workflowExecutions.$inferSelect;
export type InsertWorkflowExecution = typeof workflowExecutions.$inferInsert;

// ─── Workflow Execution Logs ──────────────────────────────────────────────────
export const workflowExecutionLogs = mysqlTable("workflow_execution_logs", {
  id: int("id").autoincrement().primaryKey(),
  executionId: int("executionId").notNull(),
  nodeId: int("nodeId"),
  actionType: varchar("actionType", { length: 100 }),
  result: mysqlEnum("result", ["success", "failed", "skipped", "pending"]).default("pending").notNull(),
  details: json("details").$type<Record<string, unknown>>(),
  executedAt: timestamp("executedAt").defaultNow().notNull(),
});
export type WorkflowExecutionLog = typeof workflowExecutionLogs.$inferSelect;
export type InsertWorkflowExecutionLog = typeof workflowExecutionLogs.$inferInsert;

// ─── Phase 13: Client Portal ──────────────────────────────────────────────────
export const clientPortals = mysqlTable("clientPortals", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId").notNull(),
  accessToken: varchar("accessToken", { length: 128 }).notNull().unique(),
  status: mysqlEnum("status", ["active", "revoked"]).default("active").notNull(),
  allowInvoices: boolean("allowInvoices").default(true).notNull(),
  allowBooking: boolean("allowBooking").default(true).notNull(),
  allowMessages: boolean("allowMessages").default(true).notNull(),
  allowContracts: boolean("allowContracts").default(false).notNull(),
  lastAccessedAt: timestamp("lastAccessedAt"),
  expiresAt: timestamp("expiresAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type ClientPortal = typeof clientPortals.$inferSelect;
export type InsertClientPortal = typeof clientPortals.$inferInsert;

export const portalMessages = mysqlTable("portalMessages", {
  id: int("id").autoincrement().primaryKey(),
  portalId: int("portalId").notNull(),
  senderType: mysqlEnum("senderType", ["operator", "client"]).notNull(),
  content: text("content").notNull(),
  readAt: timestamp("readAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PortalMessage = typeof portalMessages.$inferSelect;
export type InsertPortalMessage = typeof portalMessages.$inferInsert;

export const portalDocuments = mysqlTable("portalDocuments", {
  id: int("id").autoincrement().primaryKey(),
  portalId: int("portalId").notNull(),
  userId: int("userId").notNull(),
  title: varchar("title", { length: 255 }).notNull(),
  type: mysqlEnum("type", ["invoice", "contract", "proposal", "report", "other"]).default("other").notNull(),
  fileUrl: text("fileUrl"),
  status: mysqlEnum("status", ["pending", "viewed", "signed", "approved"]).default("pending").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type PortalDocument = typeof portalDocuments.$inferSelect;
export type InsertPortalDocument = typeof portalDocuments.$inferInsert;

// ─── Booking Email Logs ───────────────────────────────────────────────────────
export const bookingEmailLogs = mysqlTable("bookingEmailLogs", {
  id: int("id").autoincrement().primaryKey(),
  bookingId: int("bookingId").notNull(),
  type: mysqlEnum("type", ["confirmation", "reminder_24h", "reminder_1h", "cancellation", "reschedule"]).notNull(),
  sentTo: varchar("sentTo", { length: 255 }).notNull(),
  sentAt: timestamp("sentAt").defaultNow().notNull(),
  status: mysqlEnum("status", ["sent", "failed"]).default("sent").notNull(),
  errorMessage: text("errorMessage"),
});
export type BookingEmailLog = typeof bookingEmailLogs.$inferSelect;

// ─── Phase 14: Contracts & E-Sign ─────────────────────────────────────────────
export const contracts = mysqlTable("contracts", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId"),
  title: varchar("title", { length: 255 }).notNull(),
  body: text("body").notNull(),
  status: mysqlEnum("status", ["draft", "sent", "viewed", "signed", "voided"]).default("draft").notNull(),
  signToken: varchar("signToken", { length: 128 }),
  signerName: varchar("signerName", { length: 255 }),
  signerEmail: varchar("signerEmail", { length: 320 }),
  signedAt: timestamp("signedAt"),
  signatureData: text("signatureData"),
  sentAt: timestamp("sentAt"),
  viewedAt: timestamp("viewedAt"),
  portalDocumentId: int("portalDocumentId"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
  updatedAt: timestamp("updatedAt").defaultNow().onUpdateNow().notNull(),
});
export type Contract = typeof contracts.$inferSelect;
export type InsertContract = typeof contracts.$inferInsert;

// ─── Phase 15: Reputation & Reviews ──────────────────────────────────────────
export const reviews = mysqlTable("reviews", {
  id: int("id").autoincrement().primaryKey(),
  userId: int("userId").notNull(),
  contactId: int("contactId"),
  bookingId: int("bookingId"),
  requestToken: varchar("requestToken", { length: 128 }),
  status: mysqlEnum("status", ["pending", "submitted", "published", "archived"]).default("pending").notNull(),
  rating: int("rating"),
  headline: varchar("headline", { length: 255 }),
  body: text("body"),
  reviewerName: varchar("reviewerName", { length: 255 }),
  reviewerEmail: varchar("reviewerEmail", { length: 320 }),
  reviewerTitle: varchar("reviewerTitle", { length: 255 }),
  isPublic: boolean("isPublic").default(false).notNull(),
  requestedAt: timestamp("requestedAt").defaultNow().notNull(),
  submittedAt: timestamp("submittedAt"),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type Review = typeof reviews.$inferSelect;
export type InsertReview = typeof reviews.$inferInsert;

// ─── Phase 16: Team & Permissions ────────────────────────────────────────────
export const teamMembers = mysqlTable("teamMembers", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),       // the workspace owner's userId
  memberId: int("memberId").notNull(),     // the invited user's userId
  role: mysqlEnum("role", ["admin", "member", "viewer"]).default("member").notNull(),
  name: varchar("name", { length: 255 }),
  email: varchar("email", { length: 320 }).notNull(),
  status: mysqlEnum("status", ["active", "suspended"]).default("active").notNull(),
  joinedAt: timestamp("joinedAt").defaultNow().notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TeamMember = typeof teamMembers.$inferSelect;

export const teamInvites = mysqlTable("teamInvites", {
  id: int("id").autoincrement().primaryKey(),
  ownerId: int("ownerId").notNull(),
  email: varchar("email", { length: 320 }).notNull(),
  role: mysqlEnum("role", ["admin", "member", "viewer"]).default("member").notNull(),
  token: varchar("token", { length: 128 }).notNull(),
  status: mysqlEnum("status", ["pending", "accepted", "expired", "revoked"]).default("pending").notNull(),
  expiresAt: timestamp("expiresAt").notNull(),
  createdAt: timestamp("createdAt").defaultNow().notNull(),
});
export type TeamInvite = typeof teamInvites.$inferInsert;
