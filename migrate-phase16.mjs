import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
config({ path: ".env.local" });

const conn = await createConnection(process.env.DATABASE_URL);

await conn.execute(`CREATE TABLE IF NOT EXISTS \`teamMembers\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`ownerId\` int NOT NULL,
  \`memberId\` int NOT NULL,
  \`role\` enum('admin','member','viewer') NOT NULL DEFAULT 'member',
  \`name\` varchar(255),
  \`email\` varchar(320) NOT NULL,
  \`status\` enum('active','suspended') NOT NULL DEFAULT 'active',
  \`joinedAt\` timestamp NOT NULL DEFAULT (now()),
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT \`teamMembers_id\` PRIMARY KEY(\`id\`)
)`);
console.log("✓ teamMembers table created");

await conn.execute(`CREATE TABLE IF NOT EXISTS \`teamInvites\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`ownerId\` int NOT NULL,
  \`email\` varchar(320) NOT NULL,
  \`role\` enum('admin','member','viewer') NOT NULL DEFAULT 'member',
  \`token\` varchar(128) NOT NULL,
  \`status\` enum('pending','accepted','expired','revoked') NOT NULL DEFAULT 'pending',
  \`expiresAt\` timestamp NOT NULL,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  CONSTRAINT \`teamInvites_id\` PRIMARY KEY(\`id\`)
)`);
console.log("✓ teamInvites table created");

await conn.end();
