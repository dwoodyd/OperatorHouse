import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("landing-page trust surface", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/pages/Home.tsx"), "utf8");

  it("uses specific workflow controls rather than unsupported security claims", () => {
    expect(source).toContain("Authenticated workspace");
    expect(source).toContain("Visible grounding");
    expect(source).toContain("Human-controlled outreach");
    expect(source).toContain('setLocation("/privacy")');
  });
});
