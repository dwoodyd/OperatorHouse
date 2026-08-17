import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("operator-approved strategy capture", () => {
  const router = readFileSync(resolve(process.cwd(), "server/routers/operatorLearning.ts"), "utf8");
  const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");
  const strategy = readFileSync(resolve(process.cwd(), "client/src/pages/StrategyGen.tsx"), "utf8");

  it("requires an explicit owner action and prevents duplicate derived Vault entries", () => {
    expect(router).toContain("captureStrategyToVault: protectedProcedure");
    expect(router).toContain("eq(strategies.userId, ctx.user.id)");
    expect(router).toContain("eq(vaultItems.sourceStrategyId, strategy.id)");
    expect(router).toContain("created: false");
    expect(router).toContain("operator_approved_strategy_capture");
    expect(schema).toContain("sourceStrategyId: int(\"sourceStrategyId\")");
    expect(schema).toContain("vault_items_user_source_strategy_unique");
    expect(strategy).toContain("captureStrategyToVault.useMutation");
    expect(strategy).toContain("Save to Vault");
  });
});
