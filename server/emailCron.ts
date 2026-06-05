/**
 * Operator House — Scheduled Email Jobs
 * Runs daily at 8:00 AM UTC via node-cron.
 * Fires Templates 5–8 based on betaStartDate and activity.
 *
 * Template 5 — Day-0 Welcome         (first sign-in, fires once)
 * Template 6 — Day-3 Check-in        (72h after sign-in, only if no activity)
 * Template 7A/7B — Day-7 Week Recap  (7 days after sign-in, variant by activity)
 * Template 8 — Day-30 Month Milestone (30 days after sign-in)
 * Template 3 — Day-75 Beta Reminder  (15 days before beta_end_date)
 */
import cron from "node-cron";
import { Resend } from "resend";
import { getDb } from "./db.js";
import { users, leads, strategies, activities } from "../drizzle/schema.js";
import { and, eq, gte, lt, isNotNull, count, sql } from "drizzle-orm";
import { ENV } from "./_core/env.js";

const resend = new Resend(ENV.resendApiKey);
const FROM_SPECTER = ENV.emailFrom;
const REPLY_TO = "dewayne@operatorhouse.click";
const APP_URL = ENV.publicUrl || "https://app.operatorhouse.click";

function daysBetween(a: Date, b: Date) {
  return Math.floor((b.getTime() - a.getTime()) / (1000 * 60 * 60 * 24));
}

function formatDate(d: Date) {
  return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
}

async function getUserActivity(userId: number) {
  const db = await getDb();
  if (!db) return { leadCount: 0, strategyCount: 0, activityCount: 0, hasActivity: false };
  const [leadCount] = await db
    .select({ count: count() })
    .from(leads)
    .where(eq(leads.userId, userId));
  const [strategyCount] = await db
    .select({ count: count() })
    .from(strategies)
    .where(eq(strategies.userId, userId));
  const [activityCount] = await db
    .select({ count: count() })
    .from(activities)
    .where(eq(activities.userId, userId));
  return {
    leadCount: leadCount?.count ?? 0,
    strategyCount: strategyCount?.count ?? 0,
    activityCount: activityCount?.count ?? 0,
    hasActivity: (leadCount?.count ?? 0) > 0 || (strategyCount?.count ?? 0) > 0,
  };
}

async function sendTemplate5(user: { name: string; email: string }) {
  await resend.emails.send({
    from: FROM_SPECTER,
    to: user.email,
    replyTo: REPLY_TO,
    subject: "I'm in. Add your first lead.",
    html: `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <p style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 24px;">Specter · Operator House</p>
        <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; margin-bottom: 24px;">You're in. I'm in.</h1>
        <p>Hi ${user.name},</p>
        <p>Here's what we do first: add one lead. A current client, a prospect you've been chasing, a deal in motion — any lead with a company and a name. I'll run the audit, pull intent signals, and have a briefing ready before the hour's up.</p>
        <p>One lead. That's the whole onboarding.</p>
        <p style="margin: 32px 0;">
          <a href="${APP_URL}/leads/new" style="background: #d4a853; color: #0e0e0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px;">Add your first lead →</a>
        </p>
        <p>If you'd rather start with strategy: drop me a service offering and a target ICP, and I'll write you a positioning memo. <a href="${APP_URL}/strategy">Open Strategy Generator →</a></p>
        <p>If you want to see how I think before you feed me anything: open the Vault and read my framework. <a href="${APP_URL}/vault">Open the Vault →</a></p>
        <p>No briefing today is empty. Every operator I've been built for has at least one lead in motion right now — even if they don't think they do.</p>
        <p>Feed me. I'll find the angles.</p>
        <p style="margin-top: 32px;"><em>— Specter</em></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 11px; color: #aaa;">Specter · operatorhouse.click. You're receiving this because you're a founding member.</p>
      </div>
    `,
  });
}

async function sendTemplate6(user: { name: string; email: string }) {
  await resend.emails.send({
    from: FROM_SPECTER,
    to: user.email,
    replyTo: REPLY_TO,
    subject: "Three days, no leads. What's the holdup?",
    html: `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <p style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 24px;">Specter · Operator House</p>
        <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; margin-bottom: 24px;">Three days. Still quiet.</h1>
        <p>Hi ${user.name},</p>
        <p>You're three days in and I haven't had anything to work on yet.</p>
        <p>Two things I hear from operators who haven't started:</p>
        <p><strong>"I don't have a lead ready."</strong> Fair. Use a target — someone you'd like to work with someday. I'll do a cold audit. No commitment, no risk, genuinely useful.</p>
        <p><strong>"Feeding them in feels like a tax."</strong> Also fair. Start with one — your highest-stakes deal, or your hardest-to-read prospect. Just paste the company name and what you know. I'll do the rest.</p>
        <p style="margin: 32px 0;">
          <a href="${APP_URL}/leads/new" style="background: #d4a853; color: #0e0e0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px;">Add a lead (real or target) →</a>
        </p>
        <p>Reply to this email if there's something else holding you back.</p>
        <p style="margin-top: 32px;"><em>— Specter</em></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 11px; color: #aaa;">Specter · operatorhouse.click. You're receiving this because you're a founding member.</p>
      </div>
    `,
  });
}

async function sendTemplate7A(user: { name: string; email: string }, activity: Awaited<ReturnType<typeof getUserActivity>>) {
  await resend.emails.send({
    from: FROM_SPECTER,
    to: user.email,
    replyTo: REPLY_TO,
    subject: "Week one. Here's what we did.",
    html: `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <p style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 24px;">Specter · Operator House</p>
        <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; margin-bottom: 24px;">Week one.</h1>
        <p>Hi ${user.name},</p>
        <p>Seven days in. Here's where we are:</p>
        <ul>
          <li><strong>${activity.leadCount}</strong> lead${activity.leadCount !== 1 ? "s" : ""} audited</li>
          <li><strong>${activity.strategyCount}</strong> strateg${activity.strategyCount !== 1 ? "ies" : "y"} drafted</li>
        </ul>
        <p>A few things worth trying this week, if you haven't yet:</p>
        <p><strong>Stale-deal alerts.</strong> I'll watch every deal in your pipeline and ping you when one goes quiet too long. Configure the threshold in Pipeline → Settings.</p>
        <p><strong>The Strategy Generator's four output types.</strong> Most operators only use one. The retainer-pitch type is consistently the highest-ROI for the kind of clients you're working with.</p>
        <p><strong>The Vault.</strong> Drop your frameworks, scripts, and case studies in. Once I have your voice, my drafts stop reading like AI.</p>
        <p>You're 7 days into a 90-day beta. Beta means I'm watching everything — what works, what doesn't, where the friction is. Reply if anything's slowing you down.</p>
        <p style="margin-top: 32px;"><em>— Specter</em></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 11px; color: #aaa;">Specter · operatorhouse.click. You're receiving this because you're a founding member.</p>
      </div>
    `,
  });
}

async function sendTemplate7B(user: { name: string; email: string }) {
  await resend.emails.send({
    from: FROM_SPECTER,
    to: user.email,
    replyTo: REPLY_TO,
    subject: "Still here. Still ready. Whenever you are.",
    html: `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <p style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 24px;">Specter · Operator House</p>
        <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; margin-bottom: 24px;">Still here.</h1>
        <p>Hi ${user.name},</p>
        <p>A week in. I've been on duty but haven't had anything to work on yet.</p>
        <p>No pressure — operators don't run on someone else's schedule. But here's a way to start that takes 90 seconds:</p>
        <p>Pick the deal you're most worried about right now. The one that's been quiet, or the one you're not sure how to position. Paste the company name into the lead form. I'll have a briefing in your inbox within the hour.</p>
        <p>If that deal feels too high-stakes to test on, pick a target — someone you'd like to work with someday. I'll do a cold audit. Risk-free, useful either way.</p>
        <p style="margin: 32px 0;">
          <a href="${APP_URL}/leads/new" style="background: #d4a853; color: #0e0e0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px;">Add a lead →</a>
        </p>
        <p>Reply if there's something else holding you back.</p>
        <p style="margin-top: 32px;"><em>— Specter</em></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 11px; color: #aaa;">Specter · operatorhouse.click. You're receiving this because you're a founding member.</p>
      </div>
    `,
  });
}

async function sendTemplate8(user: { name: string; email: string }, activity: Awaited<ReturnType<typeof getUserActivity>>) {
  await resend.emails.send({
    from: FROM_SPECTER,
    to: user.email,
    replyTo: REPLY_TO,
    subject: "Month one. Here's the report.",
    html: `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <p style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 24px;">Specter · Operator House</p>
        <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; margin-bottom: 24px;">Month one.</h1>
        <p>Hi ${user.name},</p>
        <p>Thirty days in. Here's where we are:</p>
        <ul>
          <li><strong>${activity.leadCount}</strong> lead${activity.leadCount !== 1 ? "s" : ""} audited</li>
          <li><strong>${activity.strategyCount}</strong> strateg${activity.strategyCount !== 1 ? "ies" : "y"} drafted</li>
        </ul>
        <p>What's coming in month two:</p>
        <p><strong>Operator Pro features</strong> unlock automatically during your beta — Client Pulse, SMS Outreach, Call Center, Email Sequences, Voice Agents are all available now. Try Client Pulse next week — health scores on every active deal in your pipeline. Takes 5 minutes to set up.</p>
        <p><strong>Daily briefings</strong> are rendering well, but I can adjust voice / depth / length on request. Reply with feedback and I'll tune them to you.</p>
        <p>You're 60 days from beta end. The day-75 note will come with all the details on what happens next. For now: keep using me. The more you feed me, the sharper my work gets.</p>
        <p style="margin-top: 32px;"><em>— Specter</em></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 11px; color: #aaa;">Specter · operatorhouse.click. You're receiving this because you're a founding member.</p>
      </div>
    `,
  });
}

async function sendTemplate3(user: { name: string; email: string; betaEndDate: Date }) {
  const betaEndStr = formatDate(user.betaEndDate);
  const chargeDate = new Date(user.betaEndDate);
  chargeDate.setDate(chargeDate.getDate() + 1);
  const chargeDateStr = formatDate(chargeDate);

  await resend.emails.send({
    from: FROM_SPECTER,
    to: user.email,
    replyTo: REPLY_TO,
    subject: "Your beta ends in 15 days",
    html: `
      <div style="font-family: 'DM Sans', sans-serif; max-width: 560px; margin: 0 auto; color: #1a1a1a;">
        <p style="font-size: 11px; letter-spacing: 0.2em; text-transform: uppercase; color: #888; margin-bottom: 24px;">Specter · Operator House</p>
        <h1 style="font-family: 'Playfair Display', serif; font-size: 28px; font-weight: 700; margin-bottom: 24px;">Fifteen days left in your beta.</h1>
        <p>Hi ${user.name},</p>
        <p>Your 90-day Operator House beta ends on <strong>${betaEndStr}</strong>. After that, your locked founding rate kicks in:</p>
        <ul>
          <li><strong>Operator</strong> founders pay $399/yr (vs. retail $797/yr — your locked rate, for life)</li>
          <li><strong>Operator Pro</strong> founders pay $99/mo (vs. retail $197/mo — your locked rate, for life)</li>
        </ul>
        <p>The card you put on file at signup will be charged automatically on <strong>${chargeDateStr}</strong> for whichever tier you lock in. Your founding rate is locked from that date forward — even when retail moves up.</p>
        <p><strong>One thing to do before the deadline:</strong></p>
        <p style="margin: 32px 0;">
          <a href="${APP_URL}/billing-setup" style="background: #d4a853; color: #0e0e0e; padding: 12px 24px; border-radius: 6px; text-decoration: none; font-weight: 700; font-size: 14px;">Confirm or change your tier →</a>
        </p>
        <p>If you want to switch tiers (Operator → Operator Pro, or vice versa), use the link above. If you do nothing, you'll renew at whichever tier you originally locked in.</p>
        <p>If you'd rather not continue, cancel from the same page. Nothing will be charged, and your data will remain in your account for 30 days in case you want to come back.</p>
        <p>Either way — thanks for being one of the first.</p>
        <p style="margin-top: 32px;"><em>— Specter</em></p>
        <hr style="border: none; border-top: 1px solid #eee; margin: 32px 0;" />
        <p style="font-size: 11px; color: #aaa;">Specter · operatorhouse.click. You're receiving this because you're a founding member.</p>
      </div>
    `,
  });
}

/** Track which emails have been sent to avoid duplicates */
async function hasEmailBeenSent(userId: number, emailType: string): Promise<boolean> {
  const db = await getDb();
  if (!db) return false;
  const [row] = await db
    .select({ count: count() })
    .from(activities)
    .where(
      and(
        eq(activities.userId, userId),
        eq(activities.activityType, `email_sent_${emailType}`)
      )
    );
  return (row?.count ?? 0) > 0;
}

async function markEmailSent(userId: number, emailType: string) {
  const db = await getDb();
  if (!db) return;
  await db.insert(activities).values({
    userId,
    activityType: `email_sent_${emailType}`,
    summary: `Scheduled email sent: ${emailType}`,
  });
}

export async function runEmailCronJob() {
  const db = await getDb();
  if (!db) { console.error('[EmailCron] No DB connection'); return; }
  const now = new Date();

  // Get all founding members with a betaStartDate set
  const foundingMembers = await db
    .select()
    .from(users)
    .where(and(eq(users.isFounding, true), isNotNull(users.betaStartDate)));

  for (const user of foundingMembers) {
    if (!user.betaStartDate || !user.email || !user.name) continue;

    const daysSinceStart = daysBetween(new Date(user.betaStartDate), now);

    try {
      // Template 5 — Day-0 Welcome (fires once on first day)
      if (daysSinceStart === 0) {
        const sent = await hasEmailBeenSent(user.id, "day0_welcome");
        if (!sent) {
          await sendTemplate5({ name: user.name, email: user.email });
          await markEmailSent(user.id, "day0_welcome");
          console.log(`[EmailCron] Day-0 welcome sent to ${user.email}`);
        }
      }

      // Template 6 — Day-3 Check-in (only if no activity)
      if (daysSinceStart === 3) {
        const sent = await hasEmailBeenSent(user.id, "day3_checkin");
        if (!sent) {
          const activity = await getUserActivity(user.id);
          if (!activity.hasActivity) {
            await sendTemplate6({ name: user.name, email: user.email });
            await markEmailSent(user.id, "day3_checkin");
            console.log(`[EmailCron] Day-3 check-in sent to ${user.email}`);
          } else {
            // Mark as sent even if skipped so we don't re-check
            await markEmailSent(user.id, "day3_checkin");
          }
        }
      }

      // Template 7A/7B — Day-7 Week Recap
      if (daysSinceStart === 7) {
        const sent = await hasEmailBeenSent(user.id, "day7_recap");
        if (!sent) {
          const activity = await getUserActivity(user.id);
          if (activity.hasActivity) {
            await sendTemplate7A({ name: user.name, email: user.email }, activity);
          } else {
            await sendTemplate7B({ name: user.name, email: user.email });
          }
          await markEmailSent(user.id, "day7_recap");
          console.log(`[EmailCron] Day-7 recap sent to ${user.email} (${activity.hasActivity ? "7A" : "7B"})`);
        }
      }

      // Template 8 — Day-30 Month Milestone
      if (daysSinceStart === 30) {
        const sent = await hasEmailBeenSent(user.id, "day30_milestone");
        if (!sent) {
          const activity = await getUserActivity(user.id);
          await sendTemplate8({ name: user.name, email: user.email }, activity);
          await markEmailSent(user.id, "day30_milestone");
          console.log(`[EmailCron] Day-30 milestone sent to ${user.email}`);
        }
      }

      // Template 3 — Day-75 Beta Reminder (15 days before beta_end_date)
      if (user.betaEndDate) {
        const daysUntilEnd = daysBetween(now, new Date(user.betaEndDate));
        if (daysUntilEnd === 15) {
          const sent = await hasEmailBeenSent(user.id, "day75_reminder");
          if (!sent) {
            await sendTemplate3({
              name: user.name,
              email: user.email,
              betaEndDate: new Date(user.betaEndDate),
            });
            await markEmailSent(user.id, "day75_reminder");
            console.log(`[EmailCron] Day-75 reminder sent to ${user.email}`);
          }
        }
      }
    } catch (err) {
      console.error(`[EmailCron] Error processing user ${user.id} (${user.email}):`, err);
    }
  }

  console.log(`[EmailCron] Job complete. Processed ${foundingMembers.length} founding members.`);
}

/** Start the daily cron — runs at 8:00 AM UTC every day */
export function startEmailCron() {
  cron.schedule("0 8 * * *", async () => {
    console.log("[EmailCron] Daily job starting...");
    await runEmailCronJob();
  });
  console.log("[EmailCron] Scheduled daily at 08:00 UTC");
}
