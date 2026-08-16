import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { describe, expect, it } from "vitest";

describe("global error recovery", () => {
  const boundary = readFileSync(resolve(process.cwd(), "client/src/components/AppErrorBoundary.tsx"), "utf8");
  const entry = readFileSync(resolve(process.cwd(), "client/src/main.tsx"), "utf8");
  const server = readFileSync(resolve(process.cwd(), "server/_core/index.ts"), "utf8");

  it("renders a branded recovery choice and wraps the application root", () => {
    expect(boundary).toContain("Specter recovery");
    expect(boundary).toContain("Try again");
    expect(boundary).toContain("Welcome page");
    expect(boundary).toContain("oh_last_render_error");
    expect(boundary).toContain('fetch("/api/client-error"');
    expect(entry).toContain("<AppErrorBoundary>");
    expect(server).toContain('app.post("/api/client-error"');
    expect(server).toContain("[API] ${req.method}");
  });
});
