import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("close-reason learning", () => {
  const router = readFileSync(resolve(process.cwd(), "server/routers/operatorLearning.ts"), "utf8");
  const pipeline = readFileSync(resolve(process.cwd(), "client/src/pages/Pipeline.tsx"), "utf8");
  const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");

  it("requires owner-scoped lost outcomes to include a concise reason while allowing wins without one", () => {
    expect(router).toContain("recordDealClose: protectedProcedure");
    expect(router).toContain("eq(pipelineDeals.userId, ctx.user.id)");
    expect(router).toContain("outcome === \"won\" || !!value.reason");
    expect(router).toContain("closeReasonInsights: protectedProcedure");
    expect(pipeline).toContain("Closed Won");
    expect(pipeline).toContain("Closed Lost");
    expect(pipeline).toContain("CLOSE-LOST SIGNALS");
    expect(schema).toContain("closeOutcome: mysqlEnum");
    expect(schema).toContain("closeReason: varchar");
  });
});
