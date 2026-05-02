import mysql from "mysql2/promise";
import dotenv from "dotenv";
dotenv.config();

const conn = await mysql.createConnection(process.env.DATABASE_URL);

try {
  // Check if unique constraint already exists
  const [rows] = await conn.execute(`
    SELECT CONSTRAINT_NAME FROM information_schema.TABLE_CONSTRAINTS
    WHERE TABLE_SCHEMA = DATABASE()
      AND TABLE_NAME = 'push_subscriptions'
      AND CONSTRAINT_TYPE = 'UNIQUE'
      AND CONSTRAINT_NAME LIKE '%endpoint%'
  `);

  if (rows.length > 0) {
    console.log("Unique constraint on push_subscriptions.endpoint already exists — skipping.");
  } else {
    // First modify the TEXT column to VARCHAR(2048)
    await conn.execute(`
      ALTER TABLE push_subscriptions
        MODIFY COLUMN endpoint VARCHAR(2048) NOT NULL
    `);
    // Then add unique index
    await conn.execute(`
      ALTER TABLE push_subscriptions
        ADD UNIQUE INDEX uq_push_subscriptions_endpoint (endpoint(768))
    `);
    console.log("✅ Added unique constraint to push_subscriptions.endpoint");
  }
} catch (err) {
  console.error("Migration failed:", err.message);
  process.exit(1);
} finally {
  await conn.end();
}
