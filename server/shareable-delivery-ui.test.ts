import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("shareable client delivery UI", () => {
  const strategy = readFileSync(resolve(process.cwd(), "client/src/pages/StrategyGen.tsx"), "utf8");
  const publicPage = readFileSync(resolve(process.cwd(), "client/src/pages/PublicDeliverable.tsx"), "utf8");
  const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

  it("lets an operator select sources, create/revoke links, and exposes a distinct public route", () => {
    expect(strategy).toContain("sharedDeliverables.create.useMutation");
    expect(strategy).toContain("sharedDeliverables.revoke.useMutation");
    expect(strategy).toContain("Select client-visible source excerpts");
    expect(strategy).toContain("Your logo URL");
    expect(strategy).toContain("Deliverable accent color");
    expect(strategy).toContain("consultantLogoUrl: consultantLogoUrl.trim()");
    expect(strategy).toContain("Client link revoked");
    expect(publicPage).toContain("Private strategy deliverable");
    expect(publicPage).toContain("Evidence selected for this strategy");
    expect(app).toContain('path="/shared/:token"');
    expect(app).toContain('location.startsWith("/shared/")');
  });
});
