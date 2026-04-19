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
