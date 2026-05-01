import { createConnection } from "mysql2/promise";
import { config } from "dotenv";
config({ path: ".env.local" });

const conn = await createConnection(process.env.DATABASE_URL);

await conn.execute(`CREATE TABLE IF NOT EXISTS \`contracts\` (
  \`id\` int AUTO_INCREMENT NOT NULL,
  \`userId\` int NOT NULL,
  \`contactId\` int,
  \`title\` varchar(255) NOT NULL,
  \`body\` longtext NOT NULL,
  \`status\` enum('draft','sent','viewed','signed','voided') NOT NULL DEFAULT 'draft',
  \`signToken\` varchar(128),
  \`signerName\` varchar(255),
  \`signerEmail\` varchar(320),
  \`signedAt\` timestamp NULL,
  \`signatureData\` text,
  \`sentAt\` timestamp NULL,
  \`viewedAt\` timestamp NULL,
  \`portalDocumentId\` int,
  \`createdAt\` timestamp NOT NULL DEFAULT (now()),
  \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
  CONSTRAINT \`contracts_id\` PRIMARY KEY(\`id\`)
)`);

console.log("✓ contracts table created");
await conn.end();
