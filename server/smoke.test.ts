/* =============================================================================
   Operator House — Smoke Tests
   Covers the three highest-risk server procedures before beta:
     1. auth.me          — returns user when authenticated, null when not
     2. leads.create     — creates a lead record for an authenticated user
     3. pipeline.create  — creates a pipeline deal for an authenticated user

   NOTE: leads.analyze is intentionally excluded from smoke tests because it
   calls invokeLLM (an external service). Unit-testing it would require mocking
   the LLM helper; that belongs in an integration test suite. Instead we test
   leads.create which exercises the same DB path without the LLM call.
   ============================================================================= */
import { describe, expect, it, vi, beforeEach } from "vitest";
import { appRouter } from "./routers";
import type { TrpcContext } from "./_core/context";

/* ── Shared mock for DB helpers ─────────────────────────────────────────── */
vi.mock("./db", () => ({
  getLeads:          vi.fn().mockResolvedValue([]),
  createLead:        vi.fn().mockResolvedValue({ id: 1 }),
  updateLead:        vi.fn().mockResolvedValue(undefined),
  deleteLead:        vi.fn().mockResolvedValue(undefined),
  getPipelineDeals:  vi.fn().mockResolvedValue([]),
  createDeal:        vi.fn().mockResolvedValue({ id: 1 }),
  updateDeal:        vi.fn().mockResolvedValue(undefined),
  deleteDeal:        vi.fn().mockResolvedValue(undefined),
  getClients:        vi.fn().mockResolvedValue([]),
  createClient:      vi.fn().mockResolvedValue({ id: 1 }),
  updateClient:      vi.fn().mockResolvedValue(undefined),
  deleteClient:      vi.fn().mockResolvedValue(undefined),
  getVaultItems:     vi.fn().mockResolvedValue([]),
  createVaultItem:   vi.fn().mockResolvedValue({ id: 1 }),
  updateVaultItem:   vi.fn().mockResolvedValue(undefined),
  deleteVaultItem:   vi.fn().mockResolvedValue(undefined),
  getStrategies:     vi.fn().mockResolvedValue([]),
  createStrategy:    vi.fn().mockResolvedValue({ id: 1 }),
  getTasks:          vi.fn().mockResolvedValue([]),
  createTask:        vi.fn().mockResolvedValue({ id: 1 }),
  updateTask:        vi.fn().mockResolvedValue(undefined),
  deleteTask:        vi.fn().mockResolvedValue(undefined),
  getUserProfile:    vi.fn().mockResolvedValue(null),
  upsertUserProfile: vi.fn().mockResolvedValue(undefined),
  getDashboardMetrics: vi.fn().mockResolvedValue({ totalLeads: 0, totalStrategies: 0, pipelineValue: 0, activeDeals: 0 }),
  getActivities:     vi.fn().mockResolvedValue([]),
  logActivity:       vi.fn().mockResolvedValue(undefined),
}));

/* ── Context factories ──────────────────────────────────────────────────── */
import type { User } from "../drizzle/schema";

function makeUser(overrides?: Partial<User>): User {
  return {
    id: 42,
    openId: "test-open-id",
    email: "operator@example.com",
    name: "Test Operator",
    loginMethod: "manus" as const,
    role: "user" as const,
    createdAt: new Date("2025-01-01"),
    updatedAt: new Date("2025-01-01"),
    lastSignedIn: new Date("2025-01-01"),
    ...overrides,
  };
}

function makeCtx(user: AuthenticatedUser | null = null): TrpcContext {
  return {
    user,
    req: { protocol: "https", headers: {} } as TrpcContext["req"],
    res: { clearCookie: vi.fn() } as unknown as TrpcContext["res"],
  };
}

/* ── 1. auth.me ─────────────────────────────────────────────────────────── */
describe("auth.me", () => {
  it("returns null when no session exists", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    const result = await caller.auth.me();
    expect(result).toBeNull();
  });

  it("returns the authenticated user object", async () => {
    const user = makeUser();
    const caller = appRouter.createCaller(makeCtx(user));
    const result = await caller.auth.me();
    expect(result).not.toBeNull();
    expect(result?.id).toBe(42);
    expect(result?.email).toBe("operator@example.com");
  });
});

/* ── 2. leads.create ────────────────────────────────────────────────────── */
describe("leads.create", () => {
  it("creates a lead and returns success for an authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    const result = await caller.leads.create({
      rawInput: "John Smith, Acme Corp, acme.com",
      sourceType: "manual",
      intentScore: 72,
      status: "new",
    });
    expect(result).toEqual({ success: true });
  });

  it("throws UNAUTHORIZED when called without a session", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.leads.create({ rawInput: "test" })).rejects.toThrow();
  });
});

/* ── 3. pipeline.create ─────────────────────────────────────────────────── */
describe("pipeline.create", () => {
  it("creates a deal and returns success for an authenticated user", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    const result = await caller.pipeline.create({
      title: "Acme Corp — Discovery",
      stage: "Discovery",
      value: 12000,
      intentScore: 72,
      notes: "Pushed from Lead Intelligence",
    });
    expect(result).toEqual({ success: true });
  });

  it("throws when title is missing", async () => {
    const caller = appRouter.createCaller(makeCtx(makeUser()));
    // @ts-expect-error intentional bad input
    await expect(caller.pipeline.create({})).rejects.toThrow();
  });

  it("throws UNAUTHORIZED when called without a session", async () => {
    const caller = appRouter.createCaller(makeCtx(null));
    await expect(caller.pipeline.create({ title: "Test Deal" })).rejects.toThrow();
  });
});
