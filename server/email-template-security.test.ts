import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("scheduled email HTML safety", () => {
  const source = readFileSync(resolve(process.cwd(), "server/emailCron.ts"), "utf8");

  it("escapes dynamic recipient names before inserting them into HTML templates", () => {
    expect(source).toContain("function escapeHtml(value: string)");
    expect(source).toContain("const recipientName = escapeHtml(user.name)");
    expect(source).not.toContain("Hi ${user.name}");
  });
});
