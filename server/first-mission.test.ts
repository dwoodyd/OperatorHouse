import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("first mission", () => {
  const source = readFileSync(
    resolve(process.cwd(), "client/src/components/FirstMission.tsx"),
    "utf8",
  );

  it("routes a new operator toward a real lead audit instead of creating placeholder CRM data", () => {
    expect(source).toContain('setLocation("/leads")');
    expect(source).toContain("saveLeadInputPrefill");
    expect(source).not.toContain("trpc.clients.create");
  });
});
