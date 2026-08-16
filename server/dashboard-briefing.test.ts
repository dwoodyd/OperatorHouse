import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("Specter morning briefing", () => {
  const source = readFileSync(resolve(process.cwd(), "client/src/pages/Dashboard.tsx"), "utf8");

  it("connects confirmed upcoming bookings to a pre-call audit and exposes a next move", () => {
    expect(source).toContain('trpc.booking.listBookings.useQuery({ upcoming: true })');
    expect(source).toContain("Prepare pre-call audit");
    expect(source).toContain("saveLeadInputPrefill(context)");
    expect(source).toContain("Specter Morning Briefing");
    expect(source).toContain("Audit a lead");
  });
});
