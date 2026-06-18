/**
 * Operator House AI Service Layer
 * Centralized prompts, structured output types, and AI invocation helpers.
 * All AI calls go through this file. Version prompts here.
 */

import { invokeLLM } from "./_core/llm";

// ─── AI Timeout Wrapper ───────────────────────────────────────────────────────
const AI_TIMEOUT_MS = 45_000; // 45 second timeout for all AI calls

/**
 * Wraps an AI call with a timeout. If the call takes longer than AI_TIMEOUT_MS,
 * it throws a user-friendly error instead of hanging indefinitely.
 */
async function withAiTimeout<T>(fn: () => Promise<T>, label: string): Promise<T> {
  let timeoutId: ReturnType<typeof setTimeout> | undefined;
  const timeoutPromise = new Promise<never>((_, reject) => {
    timeoutId = setTimeout(() => {
      reject(new Error(`AI ${label} timed out after ${AI_TIMEOUT_MS / 1000}s. Please try again.`));
    }, AI_TIMEOUT_MS);
  });
  try {
    const result = await Promise.race([fn(), timeoutPromise]);
    clearTimeout(timeoutId);
    return result;
  } catch (err) {
    clearTimeout(timeoutId);
    throw err;
  }
}

// ─── Prompt Versions ──────────────────────────────────────────────────────────
export const PROMPT_VERSIONS = {
  leadAudit: "v2.0",
  strategyFull: "v2.0",
  strategyQuick: "v2.0",
  strategyEmail: "v2.0",
  strategyDeck: "v2.0",
} as const;

// ─── Structured Output Types ──────────────────────────────────────────────────
export interface LeadAuditOutput {
  name: string;
  company: string;
  intentScore: number; // 1–10
  vibeCheck: string;
  painPoints: string;
  engineeringMap: string;
  legacyPlay: string;
  nextBeat: string;
  sourcesUsed: string[]; // vault item titles referenced
  missingContext: string | null; // what would improve the analysis
}

export interface StrategyOutput {
  title: string;
  outputType: "full" | "quick" | "deck" | "email";
  promptVersion: string;
  modelName: string;
  content: string; // full markdown content
  structuredSections: {
    vibeCheck?: string;
    engineeringMap?: string;
    legacyPlay?: string;
    nextBeat?: string;
    painPoints?: string;
    solutions?: string[];
    emailSubject?: string;
    emailBody?: string;
    slides?: Array<{ title: string; bullets: string[] }>;
  };
  citations: Array<{ type: "vault" | "client" | "deal"; id: number; title: string }>;
  missingContext: string | null;
}

// ─── Lead Audit ───────────────────────────────────────────────────────────────
export interface LeadAuditInput {
  rawInput: string;
  vaultContext?: Array<{ title: string; content: string | null; type: string }>;
  clientContext?: { name: string; company: string | null; industry: string | null; summary: string | null } | null;
}

export async function runLeadAudit(input: LeadAuditInput): Promise<LeadAuditOutput> {
  const vaultSnippet = input.vaultContext?.length
    ? `\n\nRelevant vault context:\n${input.vaultContext.map(v => `[${v.type.toUpperCase()}] ${v.title}: ${(v.content ?? "").slice(0, 300)}`).join("\n")}`
    : "";

  const clientSnippet = input.clientContext
    ? `\n\nExisting client record: ${input.clientContext.name} at ${input.clientContext.company ?? "unknown company"}, industry: ${input.clientContext.industry ?? "unknown"}, notes: ${input.clientContext.summary ?? "none"}`
    : "";

  const systemPrompt = `You are Specter, an elite AI strategist operating through the Specter framework.
Your job: analyze leads and produce structured, consultant-grade intelligence.
Rules:
- Never invent facts. If context is missing, note it in missingContext.
- Ground analysis in provided vault context and client records where available.
- Be specific, direct, and actionable. No generic filler.
- Return ONLY valid JSON matching the exact schema provided.`;

  const userPrompt = `Analyze this lead and return a structured Specter Audit.

Lead Input: ${input.rawInput}${clientSnippet}${vaultSnippet}

TONE GUIDANCE — write these fields like a real analyst, not a robot:

vibeCheck: Real, human read. Like a colleague who just got off the phone with this person and is telling you what they picked up. Not a personality profile. Not clinical language. Just honest intuition: what kind of person are they, what energy do they bring, what does the context suggest?
BAD: "High-energy founder, recently raised Series A. Actively looking to scale GTM without adding headcount."
GOOD: "Marcus is moving fast — Series A in the bank, momentum at his back, but you can feel the pressure to turn that into a system before it all depends on him again. He's the kind of person who responds well to someone who comes with a plan, not just questions."

engineeringMap: Concrete and specific. Your read on what they actually need, in plain terms. Not consultant-speak. Not jargon. Just: here's the problem, here's what I'd do about it.
BAD: "Build a fractional GTM system: ICP definition, outbound sequence, pipeline cadence, and weekly deal reviews."
GOOD: "The immediate problem is that every deal runs through Marcus personally — which worked when he had 5 prospects, not 50. He needs a way to qualify faster, hand off earlier, and have a consistent cadence that doesn't require him in every conversation. That's the thing to build first."

nextBeat: What to do next, and why. Specific enough to actually do. Written like a friend who knows your work gave you a nudge.
BAD: "Send a 3-slide diagnostic deck showing the gap between current ARR velocity and Series B readiness."
GOOD: "Send him something concrete in the next 48 hours — not a pitch, but a short doc that names the problem the way he named it and shows him you were listening. People like Marcus don't go cold slowly. They move fast in one direction or another."

Return ONLY valid JSON with this exact schema:
{
  "name": "person or company name",
  "company": "company name",
  "intentScore": <1-10 integer>,
  "vibeCheck": "2-3 sentence assessment of current state, energy, and readiness",
  "painPoints": "specific pain points and structural problems identified",
  "engineeringMap": "specific AI/automation solutions mapped to their situation",
  "legacyPlay": "long-term positioning and legacy opportunity",
  "nextBeat": "specific next action to take with this lead",
  "sourcesUsed": ["vault item titles referenced, or empty array"],
  "missingContext": "what additional info would improve this analysis, or null"
}`;

  const response = await withAiTimeout(
    () => invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
    "Lead Audit"
  );

  const raw = response.choices[0]?.message?.content ?? "{}";
  let parsed: Partial<LeadAuditOutput>;
  try {
    parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
  } catch {
    throw new Error("AI returned malformed JSON. Please retry.");
  }

  return {
    name: String(parsed.name ?? "Unknown"),
    company: String(parsed.company ?? "Unknown"),
    intentScore: typeof parsed.intentScore === "number" ? Math.min(10, Math.max(1, parsed.intentScore)) : 5,
    vibeCheck: String(parsed.vibeCheck ?? ""),
    painPoints: String(parsed.painPoints ?? ""),
    engineeringMap: String(parsed.engineeringMap ?? ""),
    legacyPlay: String(parsed.legacyPlay ?? ""),
    nextBeat: String(parsed.nextBeat ?? ""),
    sourcesUsed: Array.isArray(parsed.sourcesUsed) ? parsed.sourcesUsed.map(String) : [],
    missingContext: parsed.missingContext ? String(parsed.missingContext) : null,
  };
}

// ─── Strategy Generation ──────────────────────────────────────────────────────
export interface StrategyGenInput {
  outputType: "full" | "quick" | "deck" | "email";
  clientName: string;
  company: string;
  industry?: string;
  context: string; // user-provided notes
  vaultItems?: Array<{ id: number; title: string; content: string | null; type: string }>;
  clientRecord?: { id: number; summary: string | null; nextStep: string | null } | null;
  dealRecord?: { id: number; title: string; stage: string; notes: string | null } | null;
}

export async function runStrategyGeneration(input: StrategyGenInput): Promise<StrategyOutput> {
  const vaultSnippet = input.vaultItems?.length
    ? `\n\nVault context available:\n${input.vaultItems.map(v => `[${v.type.toUpperCase()} #${v.id}] "${v.title}": ${(v.content ?? "").slice(0, 400)}`).join("\n\n")}`
    : "";

  const clientSnippet = input.clientRecord
    ? `\n\nClient record: summary="${input.clientRecord.summary ?? "none"}", next step="${input.clientRecord.nextStep ?? "none"}"`
    : "";

  const dealSnippet = input.dealRecord
    ? `\n\nActive deal: "${input.dealRecord.title}" (stage: ${input.dealRecord.stage}), notes: ${input.dealRecord.notes ?? "none"}`
    : "";

  const citations: StrategyOutput["citations"] = [];
  if (input.vaultItems) {
    input.vaultItems.forEach(v => citations.push({ type: "vault", id: v.id, title: v.title }));
  }
  if (input.clientRecord) citations.push({ type: "client", id: input.clientRecord.id, title: input.clientName });
  if (input.dealRecord) citations.push({ type: "deal", id: input.dealRecord.id, title: input.dealRecord.title });

  const systemPrompt = `You are Specter, operating through the Specter framework.
Generate consultant-grade strategy documents. Be specific, grounded, and actionable.
Never invent client facts. Use only the provided context.
Return ONLY valid JSON.`;

  let userPrompt: string;
  let schema: string;

  if (input.outputType === "full") {
    schema = `{
  "title": "document title",
  "vibeCheck": "2-3 paragraphs on current state and structural tension",
  "engineeringMap": "3 specific AI/automation solutions with implementation detail",
  "legacyPlay": "long-term positioning opportunity",
  "nextBeat": "specific next action and proposed offer",
  "missingContext": "what would improve this strategy, or null"
}`;
    userPrompt = `Generate a full Specter Strategy Document for:
Client: ${input.clientName} at ${input.company} (${input.industry ?? "industry unknown"})
Context: ${input.context}${clientSnippet}${dealSnippet}${vaultSnippet}

Return JSON matching: ${schema}`;
  } else if (input.outputType === "quick") {
    schema = `{
  "title": "audit title",
  "painPoints": "top 3 pain points as a concise paragraph",
  "solutions": ["solution 1", "solution 2", "solution 3"],
  "nextBeat": "immediate next step",
  "missingContext": "what would improve this, or null"
}`;
    userPrompt = `Generate a Quick Specter Audit for:
Client: ${input.clientName} at ${input.company}
Context: ${input.context}${clientSnippet}${vaultSnippet}

Return JSON matching: ${schema}`;
  } else if (input.outputType === "email") {
    schema = `{
  "title": "email campaign title",
  "emailSubject": "subject line",
  "emailBody": "full email body in consultant voice, 150-200 words",
  "missingContext": "what would improve this, or null"
}`;
    userPrompt = `Generate a personalized first-touch outreach email for:
Client: ${input.clientName} at ${input.company} (${input.industry ?? "industry unknown"})
Context: ${input.context}${clientSnippet}${vaultSnippet}

Return JSON matching: ${schema}`;
  } else {
    // deck
    schema = `{
  "title": "deck title",
  "slides": [
    {"title": "slide title", "bullets": ["bullet 1", "bullet 2", "bullet 3"]},
    {"title": "slide title", "bullets": ["bullet 1", "bullet 2", "bullet 3"]},
    {"title": "slide title", "bullets": ["bullet 1", "bullet 2", "bullet 3"]},
    {"title": "slide title", "bullets": ["bullet 1", "bullet 2", "bullet 3"]},
    {"title": "slide title", "bullets": ["bullet 1", "bullet 2", "bullet 3"]}
  ],
  "missingContext": "what would improve this, or null"
}`;
    userPrompt = `Generate a 5-slide strategy deck shell for:
Client: ${input.clientName} at ${input.company}
Context: ${input.context}${clientSnippet}${vaultSnippet}

Return JSON matching: ${schema}`;
  }

  const response = await withAiTimeout(
    () => invokeLLM({
      messages: [
        { role: "system", content: systemPrompt },
        { role: "user", content: userPrompt },
      ],
      response_format: { type: "json_object" },
    }),
    "Strategy Generation"
  );

  const raw = response.choices[0]?.message?.content ?? "{}";
  let parsed: Record<string, unknown>;
  try {
    parsed = JSON.parse(typeof raw === "string" ? raw : JSON.stringify(raw));
  } catch {
    throw new Error("AI returned malformed JSON. Please retry.");
  }

  // Build markdown content from structured output
  let content = "";
  const title = String(parsed.title ?? `${input.outputType} — ${input.clientName}`);

  if (input.outputType === "full") {
    content = `# ${title}\n\n**Client:** ${input.clientName} — ${input.company}\n**Framework:** Specter v2.0\n\n---\n\n## 01 — The Vibe Check\n\n${parsed.vibeCheck ?? ""}\n\n---\n\n## 02 — The Engineering Map\n\n${parsed.engineeringMap ?? ""}\n\n---\n\n## 03 — The Legacy Play\n\n${parsed.legacyPlay ?? ""}\n\n---\n\n## 04 — The Next Beat\n\n${parsed.nextBeat ?? ""}`;
  } else if (input.outputType === "quick") {
    const solutions = Array.isArray(parsed.solutions) ? parsed.solutions as string[] : [];
    content = `# ${title}\n\n**Client:** ${input.clientName} — ${input.company}\n\n---\n\n## Pain Points\n\n${parsed.painPoints ?? ""}\n\n---\n\n## AI Solutions\n\n${solutions.map((s, i) => `**${i + 1}.** ${s}`).join("\n\n")}\n\n---\n\n## Next Step\n\n${parsed.nextBeat ?? ""}`;
  } else if (input.outputType === "email") {
    content = `**Subject:** ${parsed.emailSubject ?? ""}\n\n---\n\n${parsed.emailBody ?? ""}`;
  } else {
    const slides = Array.isArray(parsed.slides) ? parsed.slides as Array<{ title: string; bullets: string[] }> : [];
    content = `# ${title}\n\n${slides.map((s, i) => `## Slide ${i + 1}: ${s.title}\n\n${(s.bullets ?? []).map(b => `- ${b}`).join("\n")}`).join("\n\n")}`;
  }

  if (citations.length > 0) {
    content += `\n\n---\n\n*Sources: ${citations.map(c => c.title).join(", ")}*`;
  }
  content += `\n\n*Generated by Operator House — Operator Framework*`;

  return {
    title,
    outputType: input.outputType,
    promptVersion: PROMPT_VERSIONS[`strategy${input.outputType.charAt(0).toUpperCase() + input.outputType.slice(1)}` as keyof typeof PROMPT_VERSIONS] ?? "v2.0",
    modelName: "ghost-consultant",
    content,
    structuredSections: {
      vibeCheck: parsed.vibeCheck ? String(parsed.vibeCheck) : undefined,
      engineeringMap: parsed.engineeringMap ? String(parsed.engineeringMap) : undefined,
      legacyPlay: parsed.legacyPlay ? String(parsed.legacyPlay) : undefined,
      nextBeat: parsed.nextBeat ? String(parsed.nextBeat) : undefined,
      painPoints: parsed.painPoints ? String(parsed.painPoints) : undefined,
      solutions: Array.isArray(parsed.solutions) ? (parsed.solutions as string[]).map(String) : undefined,
      emailSubject: parsed.emailSubject ? String(parsed.emailSubject) : undefined,
      emailBody: parsed.emailBody ? String(parsed.emailBody) : undefined,
      slides: Array.isArray(parsed.slides) ? parsed.slides as Array<{ title: string; bullets: string[] }> : undefined,
    },
    citations,
    missingContext: parsed.missingContext ? String(parsed.missingContext) : null,
  };
}
