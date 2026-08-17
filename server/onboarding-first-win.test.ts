import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("onboarding first win", () => {
  const onboarding = readFileSync(resolve(process.cwd(), "client/src/components/OnboardingFlow.tsx"), "utf8");
  const firstMission = readFileSync(resolve(process.cwd(), "client/src/components/FirstMission.tsx"), "utf8");

  it("does not expose a stale sample-data action and routes operators into a real lead workflow", () => {
    expect(onboarding).not.toContain("Load Sample Data");
    expect(onboarding).not.toContain("loadSampleData");
    expect(onboarding).toContain('getLoginUrl("/leads")');
    expect(firstMission).toContain('setLocation("/leads")');
    expect(firstMission).toContain("saveLeadInputPrefill");
  });
});
