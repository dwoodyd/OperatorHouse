import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("product and AI identity language", () => {
  const dashboard = readFileSync(resolve(process.cwd(), "client/src/pages/Dashboard.tsx"), "utf8");
  const layout = readFileSync(resolve(process.cwd(), "client/src/components/AppLayout.tsx"), "utf8");
  const onboarding = readFileSync(resolve(process.cwd(), "client/src/components/OnboardingFlow.tsx"), "utf8");

  it("addresses a person as an operator and reserves Specter for the AI role", () => {
    expect(dashboard).toContain("?? 'Operator'");
    expect(dashboard).toContain("Your AI operator is working.");
    expect(dashboard).toContain("Specter applies these three operating lenses");
    expect(layout).toContain("Operator House");
    expect(layout).not.toContain("Specter HQ");
    expect(onboarding).toContain("Specter is your AI operator inside Operator House");
    expect(onboarding).not.toContain("Specter is the room.");
  });
});
