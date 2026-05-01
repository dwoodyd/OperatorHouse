import mysql from "mysql2/promise";
import { createRequire } from "module";
const require = createRequire(import.meta.url);
try { require("dotenv").config(); } catch {}

const dbUrl = process.env.DATABASE_URL;

const conn = await mysql.createConnection(dbUrl);

const tables = [
  {
    name: "content_library",
    sql: `CREATE TABLE IF NOT EXISTS \`content_library\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`title\` varchar(255) NOT NULL,
      \`content\` text NOT NULL,
      \`category\` enum('tips','case_study','promotion','thought_leadership','custom') NOT NULL DEFAULT 'custom',
      \`mediaUrls\` json,
      \`hashtagSets\` json,
      \`platformVariants\` json,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`content_library_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "social_accounts",
    sql: `CREATE TABLE IF NOT EXISTS \`social_accounts\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`platform\` enum('linkedin','twitter','instagram','facebook') NOT NULL,
      \`accountName\` varchar(255) NOT NULL,
      \`accountHandle\` varchar(255),
      \`accountId\` varchar(255),
      \`accessToken\` text,
      \`refreshToken\` text,
      \`tokenExpiresAt\` timestamp,
      \`followerCount\` int DEFAULT 0,
      \`isConnected\` boolean NOT NULL DEFAULT false,
      \`connectedAt\` timestamp,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`social_accounts_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "social_posts",
    sql: `CREATE TABLE IF NOT EXISTS \`social_posts\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`accountId\` int,
      \`platform\` enum('linkedin','twitter','instagram','facebook') NOT NULL,
      \`content\` text NOT NULL,
      \`mediaUrls\` json,
      \`hashtags\` json,
      \`status\` enum('draft','scheduled','published','failed','pending_approval') NOT NULL DEFAULT 'draft',
      \`approvalStatus\` enum('pending','approved','rejected') DEFAULT 'approved',
      \`scheduledFor\` timestamp,
      \`publishedAt\` timestamp,
      \`platformPostId\` varchar(255),
      \`aiGenerated\` boolean NOT NULL DEFAULT false,
      \`aiPrompt\` text,
      \`metrics\` json,
      \`strategyId\` int,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`social_posts_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "social_strategies",
    sql: `CREATE TABLE IF NOT EXISTS \`social_strategies\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`platforms\` json,
      \`topics\` json,
      \`tone\` enum('professional','casual','thought_leader','educational') NOT NULL DEFAULT 'professional',
      \`postsPerWeek\` int NOT NULL DEFAULT 5,
      \`preferredTimes\` json,
      \`vaultContextIds\` json,
      \`isActive\` boolean NOT NULL DEFAULT false,
      \`lastGeneratedAt\` timestamp,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`social_strategies_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "workflows",
    sql: `CREATE TABLE IF NOT EXISTS \`workflows\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`userId\` int NOT NULL,
      \`name\` varchar(255) NOT NULL,
      \`description\` text,
      \`status\` enum('active','paused','draft') NOT NULL DEFAULT 'draft',
      \`triggerType\` varchar(100) NOT NULL,
      \`triggerConfig\` json,
      \`executionCount\` int NOT NULL DEFAULT 0,
      \`successCount\` int NOT NULL DEFAULT 0,
      \`failureCount\` int NOT NULL DEFAULT 0,
      \`lastExecutedAt\` timestamp,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      \`updatedAt\` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
      CONSTRAINT \`workflows_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "workflow_nodes",
    sql: `CREATE TABLE IF NOT EXISTS \`workflow_nodes\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`workflowId\` int NOT NULL,
      \`nodeType\` enum('trigger','action','condition','delay') NOT NULL,
      \`actionType\` varchar(100),
      \`label\` varchar(255),
      \`config\` json,
      \`positionX\` int NOT NULL DEFAULT 0,
      \`positionY\` int NOT NULL DEFAULT 0,
      \`nextNodeId\` int,
      \`trueBranchNodeId\` int,
      \`falseBranchNodeId\` int,
      \`createdAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`workflow_nodes_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "workflow_executions",
    sql: `CREATE TABLE IF NOT EXISTS \`workflow_executions\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`workflowId\` int NOT NULL,
      \`userId\` int NOT NULL,
      \`contactId\` int,
      \`status\` enum('running','completed','failed','paused') NOT NULL DEFAULT 'running',
      \`currentNodeId\` int,
      \`triggerData\` json,
      \`errorMessage\` text,
      \`startedAt\` timestamp NOT NULL DEFAULT (now()),
      \`completedAt\` timestamp,
      CONSTRAINT \`workflow_executions_id\` PRIMARY KEY(\`id\`)
    )`,
  },
  {
    name: "workflow_execution_logs",
    sql: `CREATE TABLE IF NOT EXISTS \`workflow_execution_logs\` (
      \`id\` int AUTO_INCREMENT NOT NULL,
      \`executionId\` int NOT NULL,
      \`nodeId\` int,
      \`actionType\` varchar(100),
      \`result\` enum('success','failed','skipped','pending') NOT NULL DEFAULT 'pending',
      \`details\` json,
      \`executedAt\` timestamp NOT NULL DEFAULT (now()),
      CONSTRAINT \`workflow_execution_logs_id\` PRIMARY KEY(\`id\`)
    )`,
  },
];

for (const { name, sql } of tables) {
  try {
    await conn.execute(sql);
    console.log(`✓ ${name}`);
  } catch (e) {
    console.error(`✗ ${name}:`, e.message.slice(0, 120));
  }
}

await conn.end();
console.log("Migration complete.");
