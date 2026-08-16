import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("optional analytics configuration", () => {
  const html = readFileSync(resolve(process.cwd(), "client/index.html"), "utf8");

  it("uses a module script for optional Vite values and avoids unresolved HTML placeholders", () => {
    expect(html).toContain('<script type="module">\n      /* Analytics');
    expect(html).toContain("import.meta.env.VITE_ANALYTICS_ENDPOINT");
    expect(html).not.toContain("%VITE_ANALYTICS_ENDPOINT%");
    expect(html).not.toContain("%VITE_ANALYTICS_WEBSITE_ID%");
  });
});
