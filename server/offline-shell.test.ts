import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("offline PWA shell", () => {
  const source = readFileSync(resolve(process.cwd(), "client/public/offline.html"), "utf8");

  it("does not depend on a remote image and respects device safe areas and reduced motion", () => {
    expect(source).toContain('aria-label="Operator House"');
    expect(source).toContain("safe-area-inset-top");
    expect(source).toContain("prefers-reduced-motion: reduce");
    expect(source).not.toContain("cloudfront.net");
  });
});
