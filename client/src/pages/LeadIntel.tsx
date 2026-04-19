/* =============================================================================
   Operator House — Lead Intelligence
   Obsidian Intelligence: AI-powered Operator lead audit — real AI
   ============================================================================= */
import { useState } from "react";
import { leadInputSchema } from "@/lib/schemas";
import AppLayout from "@/components/AppLayout";
import { trpc } from "@/lib/trpc";
import {
  Target, Loader2, Trash2, ChevronDown, ChevronUp,
  Brain, AlertTriangle, Map, Star, Music, GitMerge, CheckCircle2
} from "lucide-react";
import { SkeletonRows, EmptyState } from "@/components/StateUI";
import { toast } from "sonner";

const SCORE_COLOR = (score: number) => {
  if (score >= 8) return "#4ADE80";
  if (score >= 6) return "#F5A623";
  return "#6B6B7A";
};

const SECTION_META = [
  { key: "vibeCheck", label: "Vibe Check", icon: Brain, color: "#F5A623" },
  { key: "painPoints", label: "Pain Points", icon: AlertTriangle, color: "#F472B6" },
  { key: "engineeringMap", label: "Engineering Map", icon: Map, color: "#60A5FA" },
  { key: "legacyPlay", label: "Legacy Play", icon: Star, color: "#A78BFA" },
  { key: "nextBeat", label: "Next Beat", icon: Music, color: "#4ADE80" },
];

export default function LeadIntel() {
  const utils = trpc.useUtils();
  const { data: leads, isLoading } = trpc.leads.list.useQuery();

  const analyzeLead = trpc.leads.analyze.useMutation({
    onSuccess: () => {
      utils.leads.list.invalidate();
      utils.dashboard.metrics.invalidate();
      toast.success("Operator Audit complete");
      setInput("");
    },
    onError: (err) => {
      const msg = err.message || "Analysis failed";
      toast.error(msg, {
        action: {
          label: "Retry",
          onClick: () => {
            const trimmed = input.trim();
            if (trimmed) analyzeLead.mutate({ input: trimmed });
          },
        },
        duration: 6000,
      });
    },
  });

  const deleteLead = trpc.leads.delete.useMutation({
    onSuccess: () => { utils.leads.list.invalidate(); toast.success("Lead removed"); },
    onError: () => toast.error("Failed to delete lead"),
  });

  const createDeal = trpc.pipeline.create.useMutation({
    onSuccess: (_data, variables, _context) => {
      utils.pipeline.list.invalidate();
      utils.dashboard.metrics.invalidate();
      toast.success("Lead pushed to Pipeline — Discovery stage");
    },
    onError: (err) => toast.error(err.message || "Failed to push to pipeline"),
  });

  const [input, setInput] = useState("");
  const [expanded, setExpanded] = useState<number | null>(null);
  const [expandedSection, setExpandedSection] = useState<string | null>(null);
  const [pushedIds, setPushedIds] = useState<Set<number>>(new Set());

  const handlePushToPipeline = (lead: {
    id: number;
    intentScore: number | null;
    analysisJson: unknown;
  }) => {
    if (pushedIds.has(lead.id)) return;
    const audit = lead.analysisJson as Record<string, string> | null;
    if (!audit) {
      toast.error("No audit data to push");
      return;
    }

    const name = audit.name ?? "Unknown Lead";
    const company = audit.company ?? "";
    const title = company ? `${name} — ${company}` : name;
    const nextBeat = audit.nextBeat ?? "";

    createDeal.mutate(
      {
        title,
        stage: "Discovery",
        intentScore: lead.intentScore ?? undefined,
        notes: nextBeat
          ? `[From Lead Intel]\nNext Beat: ${nextBeat}`
          : "[From Lead Intel]",
      },
      {
        onSuccess: () => {
          setPushedIds((prev) => new Set(Array.from(prev).concat(lead.id)));
        },
      }
    );
  };

  return (
    <AppLayout title="Lead Intelligence" subtitle="Operator Audit — AI-powered lead analysis">
      <div className="p-6 space-y-6">
        {/* Input Panel */}
        <div className="glass-panel p-5 fade-in-up">
          <div
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "16px",
              fontWeight: 600,
              color: "var(--text-primary)",
              marginBottom: "4px",
            }}
          >
            Analyze a New Lead
          </div>
          <div className="data-label mb-4">
            Paste a LinkedIn URL, company URL, email, or describe the prospect
          </div>
          <div className="flex gap-3">
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="e.g. https://linkedin.com/in/marcus-chen — CEO of TechFlow Solutions, B2B SaaS, 50 employees, recently raised Series A..."
              rows={3}
              className="flex-1 px-4 py-3 rounded-lg text-sm outline-none resize-none"
              style={{
                background: "var(--obsidian)",
                color: "var(--text-primary)",
                border: "1px solid var(--border-subtle)",
                fontFamily: "DM Sans, sans-serif",
              }}
            />
            <button
              onClick={() => {
                const trimmed = input.trim();
                if (!trimmed) return toast.error("Please enter a URL, email, or description");
                const result = leadInputSchema.safeParse({ input: trimmed });
                if (!result.success) return toast.error(result.error.issues[0]?.message ?? "Invalid input");
                analyzeLead.mutate(result.data);
              }}
              disabled={analyzeLead.isPending}
              className="flex flex-col items-center justify-center gap-2 px-5 py-3 text-sm font-semibold flex-shrink-0"
              style={{
                background: analyzeLead.isPending ? "var(--surface-raised)" : "var(--amber)",
                color: analyzeLead.isPending ? "var(--text-muted)" : "#0A0A0F",
                fontFamily: "DM Sans, sans-serif",
                minWidth: "120px",
                borderRadius: "8px",
              }}
            >
              {analyzeLead.isPending ? (
                <>
                  <Loader2 size={16} className="animate-spin" />
                  <span style={{ fontSize: "11px" }}>Analyzing...</span>
                </>
              ) : (
                <>
                  <Target size={16} />
                  <span>Analyze</span>
                </>
              )}
            </button>
          </div>
          {analyzeLead.isPending && (
            <div
              className="mt-3 flex items-center gap-2"
              style={{
                color: "var(--amber)",
                fontSize: "12px",
                fontFamily: "Fira Code, monospace",
              }}
            >
              <div
                className="w-1.5 h-1.5 rounded-full animate-pulse"
                style={{ background: "var(--amber)" }}
              />
              Operator is running the Operator Audit...
            </div>
          )}
        </div>

        {/* Leads List */}
        {isLoading ? (
          <SkeletonRows rows={3} />
        ) : !leads?.length ? (
          <EmptyState
            icon={Target}
            title="No leads analyzed yet."
            body="Paste a lead URL or description above to run the first Operator Audit."
          />
        ) : (
          <div className="space-y-3">
            <div className="flex items-center justify-between mb-1">
              <span
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "15px",
                  color: "var(--text-primary)",
                }}
              >
                Recent Audits
              </span>
              <span className="data-label">{leads.length} leads analyzed</span>
            </div>
            {leads.map((lead) => {
              const audit = lead.analysisJson as Record<string, string> | null;
              const isOpen = expanded === lead.id;
              const alreadyPushed = pushedIds.has(lead.id);
              return (
                <div
                  key={lead.id}
                  className="glass-panel overflow-hidden group fade-in-up"
                  style={{
                    background: "var(--surface)",
                    border: `1px solid ${isOpen ? "var(--border-amber)" : "var(--border-subtle)"}`,
                  }}
                >
                  {/* Lead Header */}
                  <div
                    className="flex items-center gap-4 px-5 py-4 cursor-pointer"
                    onClick={() => setExpanded(isOpen ? null : lead.id)}
                  >
                    <div
                      className="flex-shrink-0 w-10 h-10 rounded-lg flex items-center justify-center"
                      style={{
                        background: "var(--obsidian)",
                        border: "1px solid var(--border-subtle)",
                      }}
                    >
                      <Target size={16} style={{ color: "var(--amber)" }} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          fontSize: "14px",
                          fontWeight: 600,
                          color: "var(--text-primary)",
                        }}
                        className="truncate"
                      >
                        {(audit?.name as string) || (lead.rawInput ?? "").slice(0, 60)}
                      </div>
                      {audit?.company && (
                        <div
                          style={{
                            fontSize: "12px",
                            color: "var(--text-secondary)",
                            marginTop: "2px",
                          }}
                        >
                          {audit.company as string}
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-4 flex-shrink-0">
                      {lead.intentScore != null && (
                        <div className="text-center">
                          <div
                            style={{
                              fontFamily: "Fira Code, monospace",
                              fontSize: "20px",
                              fontWeight: 700,
                              color: SCORE_COLOR(lead.intentScore),
                              lineHeight: 1,
                            }}
                          >
                            {lead.intentScore.toFixed(1)}
                          </div>
                          <div className="data-label">Intent</div>
                        </div>
                      )}
                      <button
                        onClick={(e) => {
                          e.stopPropagation();
                          deleteLead.mutate({ id: lead.id });
                        }}
                        className="opacity-0 group-hover:opacity-100 transition-opacity"
                      >
                        <Trash2 size={13} style={{ color: "var(--text-muted)" }} />
                      </button>
                      {isOpen ? (
                        <ChevronUp size={14} style={{ color: "var(--text-muted)" }} />
                      ) : (
                        <ChevronDown size={14} style={{ color: "var(--text-muted)" }} />
                      )}
                    </div>
                  </div>

                  {/* Expanded Audit */}
                  {isOpen && audit && (
                    <div style={{ borderTop: "1px solid var(--border-subtle)" }}>
                      {SECTION_META.map((section) => {
                        const content = audit[section.key];
                        if (!content) return null;
                        const Icon = section.icon;
                        const isSectionOpen =
                          expandedSection === `${lead.id}-${section.key}`;
                        return (
                          <div
                            key={section.key}
                            style={{ borderBottom: "1px solid var(--border-subtle)" }}
                          >
                            <div
                              className="flex items-center gap-3 px-5 py-3 cursor-pointer"
                              onClick={() =>
                                setExpandedSection(
                                  isSectionOpen ? null : `${lead.id}-${section.key}`
                                )
                              }
                              onMouseEnter={(e) =>
                                (e.currentTarget.style.background = "var(--surface-raised)")
                              }
                              onMouseLeave={(e) =>
                                (e.currentTarget.style.background = "transparent")
                              }
                            >
                              <div
                                className="w-6 h-6 rounded flex items-center justify-center flex-shrink-0"
                                style={{ background: section.color + "20" }}
                              >
                                <Icon size={12} style={{ color: section.color }} />
                              </div>
                              <span
                                style={{
                                  fontSize: "12px",
                                  fontWeight: 600,
                                  color: "var(--text-primary)",
                                  fontFamily: "DM Sans, sans-serif",
                                }}
                              >
                                {section.label}
                              </span>
                              <div className="flex-1" />
                              {isSectionOpen ? (
                                <ChevronUp size={12} style={{ color: "var(--text-muted)" }} />
                              ) : (
                                <ChevronDown size={12} style={{ color: "var(--text-muted)" }} />
                              )}
                            </div>
                            {isSectionOpen && (
                              <div className="px-5 pb-4">
                                <p
                                  style={{
                                    fontSize: "13px",
                                    color: "var(--text-secondary)",
                                    lineHeight: 1.7,
                                    whiteSpace: "pre-wrap",
                                  }}
                                >
                                  {content}
                                </p>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* Push to Pipeline CTA */}
                      <div className="px-5 py-3 flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          {alreadyPushed ? (
                            <>
                              <CheckCircle2 size={13} style={{ color: "#4ADE80" }} />
                              <span
                                style={{
                                  fontSize: "12px",
                                  color: "#4ADE80",
                                  fontFamily: "DM Sans, sans-serif",
                                }}
                              >
                                In Pipeline
                              </span>
                            </>
                          ) : (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                handlePushToPipeline(lead);
                              }}
                              disabled={createDeal.isPending}
                              className="flex items-center gap-2 px-3 py-1.5 rounded"
                              style={{
                                background: createDeal.isPending
                                  ? "var(--surface-raised)"
                                  : "rgba(245, 166, 35, 0.12)",
                                border: "1px solid rgba(245, 166, 35, 0.3)",
                                color: createDeal.isPending
                                  ? "var(--text-muted)"
                                  : "var(--amber)",
                                fontFamily: "DM Sans, sans-serif",
                                fontSize: "12px",
                                fontWeight: 600,
                                cursor: createDeal.isPending ? "not-allowed" : "pointer",
                              }}
                            >
                              {createDeal.isPending ? (
                                <>
                                  <Loader2 size={11} className="animate-spin" />
                                  Pushing...
                                </>
                              ) : (
                                <>
                                  <GitMerge size={11} />
                                  Push to Pipeline
                                </>
                              )}
                            </button>
                          )}
                        </div>
                        {audit.nextBeat && (
                          <span
                            style={{
                              fontSize: "11px",
                              color: "var(--text-muted)",
                              fontFamily: "Fira Code, monospace",
                              maxWidth: "300px",
                              overflow: "hidden",
                              textOverflow: "ellipsis",
                              whiteSpace: "nowrap",
                            }}
                          >
                            Next: {audit.nextBeat}
                          </span>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </AppLayout>
  );
}
