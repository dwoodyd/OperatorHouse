import { createConnection } from "mysql2/promise";
import * as dotenv from "dotenv";
dotenv.config({ path: ".env.local" });
dotenv.config({ path: ".env" });

const db = await createConnection(process.env.DATABASE_URL);

const tables = [
  `CREATE TABLE IF NOT EXISTS api_keys (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    name VARCHAR(255) NOT NULL,
    keyHash VARCHAR(255) NOT NULL,
    keyPrefix VARCHAR(16) NOT NULL,
    scopes TEXT NOT NULL,
    lastUsedAt DATETIME NULL,
    expiresAt DATETIME NULL,
    isActive TINYINT(1) NOT NULL DEFAULT 1,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
  `CREATE TABLE IF NOT EXISTS integration_configs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    provider VARCHAR(64) NOT NULL,
    config TEXT NOT NULL,
    isEnabled TINYINT(1) NOT NULL DEFAULT 0,
    lastTestedAt DATETIME NULL,
    lastTestStatus VARCHAR(32) NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP,
    updatedAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    UNIQUE KEY uq_user_provider (userId, provider)
  )`,
  `CREATE TABLE IF NOT EXISTS integration_logs (
    id INT AUTO_INCREMENT PRIMARY KEY,
    userId INT NOT NULL,
    provider VARCHAR(64) NOT NULL,
    event VARCHAR(128) NOT NULL,
    status VARCHAR(32) NOT NULL DEFAULT 'success',
    payload TEXT NULL,
    error TEXT NULL,
    createdAt DATETIME NOT NULL DEFAULT CURRENT_TIMESTAMP
  )`,
];

for (const sql of tables) {
  await db.execute(sql);
  const name = sql.match(/CREATE TABLE IF NOT EXISTS (\w+)/)?.[1];
  console.log(`✓ ${name}`);
}

await db.end();
console.log("Phase 18 migration complete");
