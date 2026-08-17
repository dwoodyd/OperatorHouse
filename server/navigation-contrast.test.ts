import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("navigation and secondary-label accessibility", () => {
  const layout = readFileSync(resolve(process.cwd(), "client/src/components/AppLayout.tsx"), "utf8");
  const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");

  it("keeps the audit escape route visible and avoids the prior low-contrast muted token", () => {
    expect(layout).toContain('label: "Book an Audit", path: "/audit"');
    expect(css).toContain("--text-muted: #6D6D7E");
    expect(css).toContain("--text-secondary: #9191A1");
    expect(css).not.toContain("--text-muted: #4A4A5A");
  });
});
