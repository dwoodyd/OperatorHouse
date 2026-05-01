import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
config({ path: ".env.local" });

const conn = await createConnection(process.env.DATABASE_URL);

await conn.execute(`CREATE TABLE IF NOT EXISTS \`reviews\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`userId\` int NOT NULL,
  \`contactId\` int,
  \`bookingId\` int,
  \`requestToken\` varchar(128),
  \`status\` enum('pending','submitted','published','archived') NOT NULL DEFAULT 'pending',
  \`rating\` int,
  \`headline\` varchar(255),
  \`body\` text,
  \`reviewerName\` varchar(255),
  \`reviewerEmail\` varchar(320),
  \`reviewerTitle\` varchar(255),
  \`isPublic\` boolean NOT NULL DEFAULT false,
  \`requestedAt\` timestamp NOT NULL DEFAULT (now()),
  \`submittedAt\` timestamp NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT \`reviews_id\` PRIMARY KEY(\`id\`)
)`);
console.log("✓ reviews table created");
await conn.end();
