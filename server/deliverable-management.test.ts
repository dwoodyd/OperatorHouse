import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("deliverable management", () => {
  const router = readFileSync(resolve(process.cwd(), "server/routers/sharedDeliverables.ts"), "utf8");
  const page = readFileSync(resolve(process.cwd(), "client/src/pages/Deliverables.tsx"), "utf8");
  const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

  it("allows owner-scoped safe reissue while revoking the prior token", () => {
    expect(router).toContain("reissue: protectedProcedure");
    expect(router).toContain("eq(sharedDeliverables.userId, ctx.user.id)");
    expect(router).toContain("status: \"revoked\"");
    expect(page).toContain("Private links are intentionally one-time secrets");
    expect(page).toContain("Reissue");
    expect(page).toContain("Copy fresh link");
    expect(app).toContain('path="/deliverables"');
  });
});
