import { createConnection } from "mysql2/promise";
import { readFileSync } from "fs";
import { config } from "dotenv";
config({ path: ".env.local" });

const url = process.env.DATABASE_URL;
if (!url) throw new Error("DATABASE_URL not set");

const conn = await createConnection(url);

const sqls = [
  `CREATE TABLE IF NOT EXISTS \`bookingEmailLogs\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`bookingId\` int NOT NULL,
    \`type\` enum('confirmation','reminder_24h','reminder_1h','cancellation','reschedule') NOT NULL,
    \`sentTo\` varchar(255) NOT NULL,
    \`sentAt\` timestamp NOT NULL DEFAULT (now()),
    \`status\` enum('sent','failed') NOT NULL DEFAULT 'sent',
    \`errorMessage\` text,
    CONSTRAINT \`bookingEmailLogs_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`clientPortals\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`userId\` int NOT NULL,
    \`contactId\` int NOT NULL,
    \`accessToken\` varchar(128) NOT NULL,
    \`status\` enum('active','revoked') NOT NULL DEFAULT 'active',
    \`allowInvoices\` boolean NOT NULL DEFAULT true,
    \`allowBooking\` boolean NOT NULL DEFAULT true,
    \`allowMessages\` boolean NOT NULL DEFAULT true,
    \`allowContracts\` boolean NOT NULL DEFAULT false,
    \`lastAccessedAt\` timestamp NULL,
    \`expiresAt\` timestamp NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`clientPortals_id\` PRIMARY KEY(\`id\`),
    CONSTRAINT \`clientPortals_accessToken_unique\` UNIQUE(\`accessToken\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`portalMessages\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`portalId\` int NOT NULL,
    \`senderType\` enum('operator','client') NOT NULL,
    \`content\` text NOT NULL,
    \`readAt\` timestamp NULL,
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`portalMessages_id\` PRIMARY KEY(\`id\`)
  )`,
  `CREATE TABLE IF NOT EXISTS \`portalDocuments\` (
    \`id\` int AUTO_INCREMENT NOT NULL,
    \`portalId\` int NOT NULL,
    \`userId\` int NOT NULL,
    \`title\` varchar(255) NOT NULL,
    \`type\` enum('invoice','contract','proposal','report','other') NOT NULL DEFAULT 'other',
    \`fileUrl\` text,
    \`status\` enum('pending','viewed','signed','approved') NOT NULL DEFAULT 'pending',
    \`createdAt\` timestamp NOT NULL DEFAULT (now()),
    CONSTRAINT \`portalDocuments_id\` PRIMARY KEY(\`id\`)
  )`,
];

for (const sql of sqls) {
  try {
    await conn.execute(sql);
    const name = sql.match(/TABLE IF NOT EXISTS `(\w+)`/)?.[1];
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error("Error:", e.message);
  }
}

await conn.end();
console.log("Migration complete");
