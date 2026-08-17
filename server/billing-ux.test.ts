import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("billing UX", () => {
  const pricing = readFileSync(resolve(process.cwd(), "client/src/pages/Pricing.tsx"), "utf8");
  const billing = readFileSync(resolve(process.cwd(), "client/src/pages/BillingSetup.tsx"), "utf8");

  it("keeps billing reachable, accessible, and responsive", () => {
    expect(pricing).toContain("aria-pressed={billing === t}");
    expect(pricing).toContain("Continue to billing for Operator Pro");
    expect(billing).toContain('navigate("/pricing")');
    expect(billing).toContain('role="radiogroup"');
    expect(billing).toContain('aria-checked={isSelected}');
    expect(billing).toContain("repeat(auto-fit, minmax(210px, 1fr))");
    expect(billing).toContain('href="/privacy"');
  });
});
