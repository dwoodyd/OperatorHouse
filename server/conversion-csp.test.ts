import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("conversion-critical browser policy", () => {
  const server = readFileSync(resolve(process.cwd(), "server/_core/index.ts"), "utf8");
  const apply = readFileSync(resolve(process.cwd(), "client/src/pages/Apply.tsx"), "utf8");
  const css = readFileSync(resolve(process.cwd(), "client/src/index.css"), "utf8");
  const spectreContext = readFileSync(resolve(process.cwd(), "client/src/contexts/SpectreContext.tsx"), "utf8");

  it("permits data fonts and analytics event delivery under the production CSP", () => {
    expect(server).toContain('fontSrc: ["\'self\'", "data:", "https://fonts.gstatic.com"]');
    expect(server).toContain('scriptSrc: ["\'self\'", "\'unsafe-inline\'", "https://manus-analytics.com"]');
    expect(server).toContain('"https://manus-analytics.com"');
  });

  it("keeps application fields focus-visible and disables profile fetches before login", () => {
    expect(apply.match(/className="oh-apply-field"/g)).toHaveLength(3);
    expect(css).toContain(".oh-apply-field:focus-visible");
    expect(spectreContext).toContain("enabled: isAuthenticated");
  });
});
