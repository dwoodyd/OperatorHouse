/**
 * Adds AppLayout wrapper to internal pages that are missing it.
 * Each page gets:
 *   - import AppLayout from "@/components/AppLayout"; (if not present)
 *   - The main return wrapped in <AppLayout>...</AppLayout>
 */
import fs from "fs";
import path from "path";

const PAGES_DIR = path.resolve("client/src/pages");

// Pages to fix: internal app pages that need the nav/header
const PAGES_TO_FIX = [
  "EmailSequences.tsx",
  "CRM.tsx",
  "Invoicing.tsx",
  "SMS.tsx",
  "Social.tsx",
  "Automations.tsx",
  "Team.tsx",
  "Reputation.tsx",
  "Booking.tsx",
  "Contracts.tsx",
  "LinkedInOutreach.tsx",
  "VoiceAgents.tsx",
  "Funnels.tsx",
];

for (const filename of PAGES_TO_FIX) {
  const filePath = path.join(PAGES_DIR, filename);
  if (!fs.existsSync(filePath)) {
    console.log(`SKIP (not found): ${filename}`);
    continue;
  }

  let content = fs.readFileSync(filePath, "utf8");

  // Skip if already has AppLayout
  if (content.includes("AppLayout")) {
    console.log(`SKIP (already has AppLayout): ${filename}`);
    continue;
  }

  // 1. Add AppLayout import after the last import line
  const lastImportIdx = content.lastIndexOf("\nimport ");
  const endOfLastImport = content.indexOf("\n", lastImportIdx + 1);
  if (lastImportIdx === -1) {
    console.log(`SKIP (no imports found): ${filename}`);
    continue;
  }
  content =
    content.slice(0, endOfLastImport + 1) +
    `import AppLayout from "@/components/AppLayout";\n` +
    content.slice(endOfLastImport + 1);

  // 2. Find the LAST "return (" in the file (the main component return)
  // We need to wrap its JSX in <AppLayout>
  const lines = content.split("\n");
  
  // Find the last top-level "return (" (2-space indent = component body)
  let mainReturnLine = -1;
  for (let i = lines.length - 1; i >= 0; i--) {
    if (/^  return \(/.test(lines[i])) {
      mainReturnLine = i;
      break;
    }
  }

  if (mainReturnLine === -1) {
    console.log(`SKIP (no return found): ${filename}`);
    continue;
  }

  // Find the closing ); of that return block
  // Walk forward from mainReturnLine, tracking brace/paren depth
  let depth = 0;
  let closingLine = -1;
  for (let i = mainReturnLine; i < lines.length; i++) {
    const line = lines[i];
    for (const ch of line) {
      if (ch === "(" || ch === "<") depth++;
      if (ch === ")" || ch === ">") depth--;
    }
    // The closing ); line has depth back to 0 or below after the return (
    if (i > mainReturnLine && /^\s*\);/.test(lines[i])) {
      closingLine = i;
      break;
    }
  }

  if (closingLine === -1) {
    console.log(`SKIP (no closing ); found): ${filename}`);
    continue;
  }

  // Insert <AppLayout> after "return (" and </AppLayout> before ");"
  lines[mainReturnLine] = lines[mainReturnLine].replace("return (", "return (\n    <AppLayout>");
  lines[closingLine] = lines[closingLine].replace(");", "    </AppLayout>\n  );");

  const newContent = lines.join("\n");
  fs.writeFileSync(filePath, newContent, "utf8");
  console.log(`FIXED: ${filename}`);
}

console.log("\nDone.");
