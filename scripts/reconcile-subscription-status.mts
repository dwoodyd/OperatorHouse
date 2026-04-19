/**
 * One-time backfill: fixes users whose Stripe subscription is active/trialing/past_due
 * but whose DB row shows "inactive" due to the old status-mapping bug.
 *
 * Run once: tsx scripts/reconcile-subscription-status.mts
 */
import { stripe } from "../server/stripe.js";
import { getDb } from "../server/db.js";
import { users } from "../drizzle/schema.js";
import { eq } from "drizzle-orm";

const ACCESS = new Set(["active", "trialing", "past_due"]);
const db = await getDb();
if (!db) throw new Error("no db");

let fixed = 0;
for await (const sub of stripe.subscriptions.list({ status: "all", limit: 100 })) {
  const appStatus = ACCESS.has(sub.status) ? "active" : "inactive";
  const result = await db
    .update(users)
    .set({ subscriptionStatus: appStatus })
    .where(eq(users.stripeCustomerId, sub.customer as string));
  if ((result as unknown as { affectedRows: number }).affectedRows > 0) fixed++;
}
console.log(`Done — ${fixed} rows updated`);
