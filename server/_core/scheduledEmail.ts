import type { Express, Request, Response } from "express";
import { runEmailCronJob, processScheduledSequences } from "../emailCron";
import { sdk } from "./sdk";

async function authenticateCron(req: Request, res: Response) {
  const user = await sdk.authenticateRequest(req);
  if (!user.isCron || !user.taskUid) {
    res.status(403).json({ error: "cron-only" });
    return null;
  }
  return user;
}

function reportFailure(res: Response, error: unknown, taskUid?: string) {
  const message = error instanceof Error ? error.message : String(error);
  console.error("[ScheduledEmail] Dispatch failed", { taskUid, message });
  res.status(500).json({
    error: message,
    context: { taskUid: taskUid ?? "unknown" },
    timestamp: new Date().toISOString(),
  });
}

/**
 * Durable email-dispatch callbacks. These routes are only reachable by
 * Manus Heartbeat identities and are idempotent at the underlying send-log
 * level, so platform retries do not create duplicate onboarding sends.
 */
export function registerScheduledEmailRoutes(app: Express) {
  app.post("/api/scheduled/onboarding-email", async (req, res) => {
    let taskUid: string | undefined;
    try {
      const user = await authenticateCron(req, res);
      if (!user) return;
      taskUid = user.taskUid;
      await runEmailCronJob();
      res.json({ ok: true, taskUid });
    } catch (error) {
      reportFailure(res, error, taskUid);
    }
  });

  app.post("/api/scheduled/sequence-email", async (req, res) => {
    let taskUid: string | undefined;
    try {
      const user = await authenticateCron(req, res);
      if (!user) return;
      taskUid = user.taskUid;
      await processScheduledSequences();
      res.json({ ok: true, taskUid });
    } catch (error) {
      reportFailure(res, error, taskUid);
    }
  });
}
