import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("client delivery note", () => {
  const helper = readFileSync(resolve(process.cwd(), "client/src/lib/deliverableNote.ts"), "utf8");
  const strategy = readFileSync(resolve(process.cwd(), "client/src/pages/StrategyGen.tsx"), "utf8");
  const management = readFileSync(resolve(process.cwd(), "client/src/pages/Deliverables.tsx"), "utf8");

  it("generates copy-only, operator-reviewed delivery language without sending an email", () => {
    expect(helper).toContain("buildClientDeliveryNote");
    expect(helper).toContain("selected source trail");
    expect(helper).toContain("private workspace");
    expect(helper).not.toContain("fetch(");
    expect(strategy).toContain("Copy client note");
    expect(management).toContain("Copy client note");
  });
});
