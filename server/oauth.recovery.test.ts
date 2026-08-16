import express from "express";
import type { Server } from "node:http";
import { afterEach, describe, expect, it } from "vitest";
import { registerOAuthRoutes } from "./_core/oauth";

describe("OAuth recovery routing", () => {
  let server: Server | undefined;

  afterEach(async () => {
    if (!server) return;
    await new Promise<void>((resolve, reject) => {
      server?.close((error) => (error ? reject(error) : resolve()));
    });
    server = undefined;
  });

  it("redirects an incomplete callback to the branded recovery screen", async () => {
    const app = express();
    registerOAuthRoutes(app);
    server = app.listen(0);
    await new Promise<void>((resolve) => server?.once("listening", resolve));

    const address = server.address();
    if (!address || typeof address === "string") throw new Error("Expected a TCP listener");

    const response = await fetch(`http://127.0.0.1:${address.port}/api/oauth/callback`, {
      redirect: "manual",
    });

    expect(response.status).toBe(302);
    expect(response.headers.get("location")).toBe("/auth/recovery?reason=missing");
  });
});
