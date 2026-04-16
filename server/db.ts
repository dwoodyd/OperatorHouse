import { and, desc, eq, sql } from "drizzle-orm";
import { drizzle } from "drizzle-orm/mysql2";
import {
  activities, briefings, clients, leads, pipelineDeals,
  strategies, tasks, userProfiles, users, vaultItems,
  InsertActivity, InsertBriefing, InsertClient, InsertLead,
  InsertPipelineDeal, InsertStrategy, InsertTask, InsertUser,
  InsertUserProfile, InsertVaultItem,
} from "../drizzle/schema";
import { ENV } from "./_core/env";

let _db: ReturnType<typeof drizzle> | null = null;

export async function getDb() {
  if (!_db && process.env.DATABASE_URL) {
    try { _db = drizzle(process.env.DATABASE_URL); }
    catch (error) { console.warn("[Database] Failed to connect:", error); _db = null; }
  }
  return _db;
}

// ─── Users ────────────────────────────────────────────────────────────────────
export async function upsertUser(user: InsertUser): Promise<void> {
  if (!user.openId) throw new Error("User openId is required for upsert");
  const db = await getDb();
  if (!db) return;
  const values: InsertUser = { openId: user.openId };
  const updateSet: Record<string, unknown> = {};
  const textFields = ["name", "email", "loginMethod"] as const;
  textFields.forEach((field) => {
    const value = user[field];
    if (value === undefined) return;
    values[field] = value ?? null;
    updateSet[field] = value ?? null;
  });
  if (user.lastSignedIn !== undefined) { values.lastSignedIn = user.lastSignedIn; updateSet.lastSignedIn = user.lastSignedIn; }
  if (user.role !== undefined) { values.role = user.role; updateSet.role = user.role; }
  else if (user.openId === ENV.ownerOpenId) { values.role = "admin"; updateSet.role = "admin"; }
  if (!values.lastSignedIn) values.lastSignedIn = new Date();
  if (Object.keys(updateSet).length === 0) updateSet.lastSignedIn = new Date();
  await db.insert(users).values(values).onDuplicateKeyUpdate({ set: updateSet });
}

export async function getUserByOpenId(openId: string) {
  const db = await getDb();
  if (!db) return undefined;
  const result = await db.select().from(users).where(eq(users.openId, openId)).limit(1);
  return result[0];
}

// ─── User Profiles ────────────────────────────────────────────────────────────
export async function getUserProfile(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(userProfiles).where(eq(userProfiles.userId, userId)).limit(1);
  return result[0] ?? null;
}

export async function upsertUserProfile(data: InsertUserProfile) {
  const db = await getDb();
  if (!db) return;
  await db.insert(userProfiles).values(data).onDuplicateKeyUpdate({
    set: { companyName: data.companyName, timezone: data.timezone },
  });
}

// ─── Clients ──────────────────────────────────────────────────────────────────
export async function getClients(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(clients).where(eq(clients.userId, userId)).orderBy(desc(clients.updatedAt));
}

export async function createClient(data: InsertClient) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(clients).values(data);
}

export async function updateClient(id: number, userId: number, data: Partial<InsertClient>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(clients).set(data).where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

export async function deleteClient(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(clients).where(and(eq(clients.id, id), eq(clients.userId, userId)));
}

// ─── Leads ────────────────────────────────────────────────────────────────────
export async function getLeads(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(leads).where(eq(leads.userId, userId)).orderBy(desc(leads.createdAt));
}

export async function createLead(data: InsertLead) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(leads).values(data);
}

export async function updateLead(id: number, userId: number, data: Partial<InsertLead>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(leads).set(data).where(and(eq(leads.id, id), eq(leads.userId, userId)));
}

export async function deleteLead(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(leads).where(and(eq(leads.id, id), eq(leads.userId, userId)));
}

// ─── Pipeline Deals ───────────────────────────────────────────────────────────
export async function getPipelineDeals(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(pipelineDeals).where(eq(pipelineDeals.userId, userId)).orderBy(desc(pipelineDeals.updatedAt));
}

export async function createDeal(data: InsertPipelineDeal) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(pipelineDeals).values(data);
}

export async function updateDeal(id: number, userId: number, data: Partial<InsertPipelineDeal>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(pipelineDeals).set(data).where(and(eq(pipelineDeals.id, id), eq(pipelineDeals.userId, userId)));
}

export async function deleteDeal(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(pipelineDeals).where(and(eq(pipelineDeals.id, id), eq(pipelineDeals.userId, userId)));
}

// ─── Vault Items ──────────────────────────────────────────────────────────────
export async function getVaultItems(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(vaultItems).where(eq(vaultItems.userId, userId)).orderBy(desc(vaultItems.updatedAt));
}

export async function createVaultItem(data: InsertVaultItem) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(vaultItems).values(data);
}

export async function updateVaultItem(id: number, userId: number, data: Partial<InsertVaultItem>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(vaultItems).set(data).where(and(eq(vaultItems.id, id), eq(vaultItems.userId, userId)));
}

export async function deleteVaultItem(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(vaultItems).where(and(eq(vaultItems.id, id), eq(vaultItems.userId, userId)));
}

// ─── Strategies ───────────────────────────────────────────────────────────────
export async function getStrategies(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(strategies).where(eq(strategies.userId, userId)).orderBy(desc(strategies.createdAt));
}

export async function createStrategy(data: InsertStrategy) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(strategies).values(data);
}

export async function updateStrategy(id: number, userId: number, data: Partial<InsertStrategy>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(strategies).set(data).where(and(eq(strategies.id, id), eq(strategies.userId, userId)));
}

// ─── Activities ───────────────────────────────────────────────────────────────
export async function getActivities(userId: number, limit = 20) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.createdAt)).limit(limit);
}

export async function logActivity(data: InsertActivity) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activities).values(data);
}

// ─── Tasks ────────────────────────────────────────────────────────────────────
export async function getTasks(userId: number) {
  const db = await getDb();
  if (!db) return [];
  return db.select().from(tasks).where(eq(tasks.userId, userId)).orderBy(desc(tasks.createdAt));
}

export async function createTask(data: InsertTask) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(tasks).values(data);
}

export async function updateTask(id: number, userId: number, data: Partial<InsertTask>) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.update(tasks).set(data).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

export async function deleteTask(id: number, userId: number) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  await db.delete(tasks).where(and(eq(tasks.id, id), eq(tasks.userId, userId)));
}

// ─── Briefings ────────────────────────────────────────────────────────────────
export async function getLatestBriefing(userId: number) {
  const db = await getDb();
  if (!db) return null;
  const result = await db.select().from(briefings).where(eq(briefings.userId, userId)).orderBy(desc(briefings.createdAt)).limit(1);
  return result[0] ?? null;
}

export async function createBriefing(data: InsertBriefing) {
  const db = await getDb();
  if (!db) throw new Error("DB unavailable");
  return db.insert(briefings).values(data);
}

// ─── Dashboard Metrics ────────────────────────────────────────────────────────
export async function getDashboardMetrics(userId: number) {
  const db = await getDb();
  if (!db) return { totalLeads: 0, activeDeals: 0, pipelineValue: 0, strategiesGenerated: 0, recentActivities: [] };

  const [leadsCount, dealsResult, strategiesCount, recentActivitiesResult] = await Promise.all([
    db.select({ count: sql<number>`count(*)` }).from(leads).where(eq(leads.userId, userId)),
    db.select({ count: sql<number>`count(*)`, totalValue: sql<number>`sum(value)` }).from(pipelineDeals).where(eq(pipelineDeals.userId, userId)),
    db.select({ count: sql<number>`count(*)` }).from(strategies).where(eq(strategies.userId, userId)),
    db.select().from(activities).where(eq(activities.userId, userId)).orderBy(desc(activities.createdAt)).limit(10),
  ]);

  return {
    totalLeads: Number(leadsCount[0]?.count ?? 0),
    activeDeals: Number(dealsResult[0]?.count ?? 0),
    pipelineValue: Number(dealsResult[0]?.totalValue ?? 0),
    strategiesGenerated: Number(strategiesCount[0]?.count ?? 0),
    recentActivities: recentActivitiesResult,
  };
}

// ─── Analytics ────────────────────────────────────────────────────────────────
export async function getAnalyticsData(userId: number) {
  const db = await getDb();
  if (!db) return { dealsByStage: [], leadsBySource: [], recentDeals: [], monthlyData: [], weeklyActivity: [] };

  const now = new Date();
  // Build last-6-months labels dynamically
  const months: { label: string; year: number; month: number }[] = [];
  for (let i = 5; i >= 0; i--) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    months.push({ label: d.toLocaleString('en-US', { month: 'short' }), year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  const dayNames = ['Sun','Mon','Tue','Wed','Thu','Fri','Sat'];

  const [dealsByStage, leadsBySource, recentDeals, allLeads, allDeals, allStrategies, allBriefings] = await Promise.all([
    db.select({ stage: pipelineDeals.stage, count: sql<number>`count(*)`, totalValue: sql<number>`sum(value)` })
      .from(pipelineDeals).where(eq(pipelineDeals.userId, userId)).groupBy(pipelineDeals.stage),
    db.select({ sourceType: leads.sourceType, count: sql<number>`count(*)` })
      .from(leads).where(eq(leads.userId, userId)).groupBy(leads.sourceType),
    db.select().from(pipelineDeals).where(eq(pipelineDeals.userId, userId)).orderBy(desc(pipelineDeals.createdAt)).limit(5),
    db.select({ createdAt: leads.createdAt }).from(leads).where(eq(leads.userId, userId)),
    db.select({ createdAt: pipelineDeals.createdAt, value: pipelineDeals.value, stage: pipelineDeals.stage }).from(pipelineDeals).where(eq(pipelineDeals.userId, userId)),
    db.select({ createdAt: strategies.createdAt }).from(strategies).where(eq(strategies.userId, userId)),
    db.select({ createdAt: briefings.createdAt }).from(briefings).where(eq(briefings.userId, userId)),
  ]);

  const monthlyData = months.map(({ label, year, month }) => {
    const leadsCount = allLeads.filter(l => { const d = new Date(l.createdAt); return d.getFullYear() === year && d.getMonth() + 1 === month; }).length;
    const closedDeals = allDeals.filter(d => { const dt = new Date(d.createdAt); return dt.getFullYear() === year && dt.getMonth() + 1 === month && d.stage === 'Closed'; });
    const revenue = closedDeals.reduce((sum, d) => sum + (d.value ?? 0), 0);
    return { month: label, revenue, leads: leadsCount, closed: closedDeals.length };
  });

  const weeklyActivity = Array.from({ length: 7 }, (_, i) => {
    const d = new Date(now); d.setDate(now.getDate() - (6 - i));
    const y = d.getFullYear(), mo = d.getMonth() + 1, day = d.getDate();
    const match = (dt: Date) => dt.getFullYear() === y && dt.getMonth() + 1 === mo && dt.getDate() === day;
    return {
      day: dayNames[d.getDay()],
      leads: allLeads.filter(l => match(new Date(l.createdAt))).length,
      strategies: allStrategies.filter(s => match(new Date(s.createdAt))).length,
      briefings: allBriefings.filter(b => match(new Date(b.createdAt))).length,
    };
  });

  return { dealsByStage, leadsBySource, recentDeals, monthlyData, weeklyActivity };
}

// ─── Account Deletion ─────────────────────────────────────────────────────────
export async function deleteAllUserData(userId: number): Promise<void> {
  const db = await getDb();
  if (!db) throw new Error("Database unavailable");
  // Delete in dependency order (children before parent user row)
  await db.delete(activities).where(eq(activities.userId, userId));
  await db.delete(briefings).where(eq(briefings.userId, userId));
  await db.delete(tasks).where(eq(tasks.userId, userId));
  await db.delete(strategies).where(eq(strategies.userId, userId));
  await db.delete(vaultItems).where(eq(vaultItems.userId, userId));
  await db.delete(pipelineDeals).where(eq(pipelineDeals.userId, userId));
  await db.delete(leads).where(eq(leads.userId, userId));
  await db.delete(clients).where(eq(clients.userId, userId));
  await db.delete(userProfiles).where(eq(userProfiles.userId, userId));
  await db.delete(users).where(eq(users.id, userId));
}
