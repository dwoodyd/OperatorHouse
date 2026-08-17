import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("legal and data-handling surfaces", () => {
  const privacy = readFileSync(resolve(process.cwd(), "client/src/pages/Privacy.tsx"), "utf8");
  const terms = readFileSync(resolve(process.cwd(), "client/src/pages/Terms.tsx"), "utf8");
  const app = readFileSync(resolve(process.cwd(), "client/src/App.tsx"), "utf8");

  it("keeps public legal routes and factual processor disclosures available", () => {
    expect(app).toContain('path="/privacy"');
    expect(app).toContain('path="/terms"');
    expect(privacy).toContain("PayPal for subscription setup and payment processing");
    expect(privacy).toContain("Resend for application email delivery");
    expect(privacy).toContain("Manus AI service");
    expect(terms).toContain("90-day no-charge trial");
    expect(terms).toContain("hello@mail.operatorhouse.click");
  });
});
