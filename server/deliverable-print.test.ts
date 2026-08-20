import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("client deliverable print export", () => {
  const page = readFileSync(resolve(process.cwd(), "client/src/pages/PublicDeliverable.tsx"), "utf8");

  it("offers a browser-native print/PDF path and protects the document layout in print styles", () => {
    expect(page).toContain("window.print()");
    expect(page).toContain("Print / PDF");
    expect(page).toContain("@media print");
    expect(page).toContain(".print-hidden { display: none");
    expect(page).toContain(".print-source");
    expect(page).toContain("window.document.title");
  });
});
