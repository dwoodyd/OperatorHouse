const HERO_HANDOFF_KEY = "oh_hero_workflow_handoff";
const LEAD_PREFILL_KEY = "oh_lead_input_prefill";
const HERO_HANDOFF_MAX_AGE_MS = 60 * 60 * 1000;

export type HeroWorkflowHandoff = {
  source: "lead-audit" | "strategy";
  leadId?: number;
  clientName: string;
  company: string;
  industry?: string;
  context: string;
  createdAt: number;
};

export function saveHeroWorkflowHandoff(handoff: Omit<HeroWorkflowHandoff, "createdAt">) {
  if (typeof window === "undefined") return;
  try {
    sessionStorage.setItem(HERO_HANDOFF_KEY, JSON.stringify({ ...handoff, createdAt: Date.now() }));
  } catch {
    // The corresponding page can still be opened when storage is unavailable.
  }
}

export function consumeHeroWorkflowHandoff(): HeroWorkflowHandoff | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(HERO_HANDOFF_KEY);
    sessionStorage.removeItem(HERO_HANDOFF_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as HeroWorkflowHandoff;
    if (!value.createdAt || Date.now() - value.createdAt > HERO_HANDOFF_MAX_AGE_MS) return null;
    if (!value.clientName || !value.context || !["lead-audit", "strategy"].includes(value.source)) return null;
    return value;
  } catch {
    return null;
  }
}

export function saveLeadInputPrefill(input: string) {
  if (typeof window === "undefined" || !input.trim()) return;
  try {
    sessionStorage.setItem(LEAD_PREFILL_KEY, JSON.stringify({ input: input.trim(), createdAt: Date.now() }));
  } catch {
    // The destination still opens even when browser session storage is unavailable.
  }
}

export function consumeLeadInputPrefill() {
  if (typeof window === "undefined") return null;
  try {
    const raw = sessionStorage.getItem(LEAD_PREFILL_KEY);
    sessionStorage.removeItem(LEAD_PREFILL_KEY);
    if (!raw) return null;
    const value = JSON.parse(raw) as { input?: string; createdAt?: number };
    if (!value.input || !value.createdAt || Date.now() - value.createdAt > HERO_HANDOFF_MAX_AGE_MS) return null;
    return value.input;
  } catch {
    return null;
  }
}
