import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("durable email scheduling", () => {
  const cron = readFileSync(resolve(process.cwd(), "server/emailCron.ts"), "utf8");
  const routes = readFileSync(resolve(process.cwd(), "server/_core/scheduledEmail.ts"), "utf8");
  const server = readFileSync(resolve(process.cwd(), "server/_core/index.ts"), "utf8");

  it("uses cron-authenticated callbacks instead of in-process node-cron timers", () => {
    expect(cron).not.toContain('from "node-cron"');
    expect(cron).not.toContain("cron.schedule(");
    expect(cron).toContain("export async function processScheduledSequences");
    expect(routes).toContain('"/api/scheduled/onboarding-email"');
    expect(routes).toContain('"/api/scheduled/sequence-email"');
    expect(routes).toContain("user.isCron");
    expect(server).toContain("registerScheduledEmailRoutes(app)");
  });
});
