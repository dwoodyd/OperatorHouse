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
