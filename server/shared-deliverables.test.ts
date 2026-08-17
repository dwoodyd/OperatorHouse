import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("shareable deliverable safeguards", () => {
  const router = readFileSync(resolve(process.cwd(), "server/routers/sharedDeliverables.ts"), "utf8");
  const schema = readFileSync(resolve(process.cwd(), "drizzle/schema.ts"), "utf8");

  it("uses a hashed random token, freezes selected content, and returns a minimal public payload", () => {
    expect(router).toContain("randomBytes(32).toString(\"base64url\")");
    expect(router).toContain('createHash("sha256")');
    expect(router).toContain("strategyContent: strategy.content.slice");
    expect(router).toContain("sourceExcerpt:");
    expect(router).toContain("eq(sharedDeliverables.status, \"active\")");
    expect(router).toContain("expiresAt <= new Date()");
    expect(router).toContain("status: \"revoked\"");
    expect(router).not.toContain("userId: sharedDeliverables.userId");
    expect(schema).toContain("export const sharedDeliverables");
    expect(schema).toContain("export const sharedDeliverableSources");
  });
});
