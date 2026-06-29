"""
Adds AppLayout wrapper to internal pages missing it.
Uses Python for reliable multi-line import detection.
"""
import re
import os

PAGES_DIR = "client/src/pages"
IMPORT_LINE = 'import AppLayout from "@/components/AppLayout";\n'

PAGES_TO_FIX = [
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
]

def find_last_import_end(lines):
    """Find the line index AFTER the last import statement (handles multi-line imports)."""
    last_import_end = -1
    i = 0
    while i < len(lines):
        line = lines[i]
        if line.startswith("import "):
            # Check if this is a multi-line import (has { but no })
            if "{" in line and "}" not in line:
                # Find the closing }
                while i < len(lines) and "}" not in lines[i]:
                    i += 1
            last_import_end = i + 1
        i += 1
    return last_import_end

def find_main_return(lines):
    """Find the last top-level 'return (' in the file (2-space indent)."""
    for i in range(len(lines) - 1, -1, -1):
        if re.match(r'^  return \(', lines[i]):
            return i
    return -1

def find_closing_paren(lines, start):
    """Find the closing ); of a return block starting at `start`."""
    # Walk forward looking for a line that is just '  );' at the right indent
    for i in range(start + 1, len(lines)):
        if re.match(r'^  \);', lines[i]):
            return i
    return -1

for filename in PAGES_TO_FIX:
    filepath = os.path.join(PAGES_DIR, filename)
    if not os.path.exists(filepath):
        print(f"SKIP (not found): {filename}")
        continue

    with open(filepath, "r") as f:
        content = f.read()

    if "AppLayout" in content:
        print(f"SKIP (already has AppLayout): {filename}")
        continue

    lines = content.split("\n")

    # 1. Find where to insert the import (after last import block)
    import_insert_idx = find_last_import_end(lines)
    if import_insert_idx == -1:
        print(f"SKIP (no imports): {filename}")
        continue

    # 2. Insert import line
    lines.insert(import_insert_idx, 'import AppLayout from "@/components/AppLayout";')

    # 3. Find main return ( after import insertion
    return_idx = find_main_return(lines)
    if return_idx == -1:
        print(f"SKIP (no return): {filename}")
        continue

    # 4. Find closing );
    close_idx = find_closing_paren(lines, return_idx)
    if close_idx == -1:
        print(f"SKIP (no closing): {filename}")
        continue

    # 5. Insert </AppLayout> before the closing );
    lines.insert(close_idx, "    </AppLayout>")

    # 6. Insert <AppLayout> after the return (
    lines.insert(return_idx + 1, "    <AppLayout>")

    new_content = "\n".join(lines)
    with open(filepath, "w") as f:
        f.write(new_content)
    print(f"FIXED: {filename}")

print("\nDone.")
