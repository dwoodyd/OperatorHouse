/* =============================================================================
   Operator House — Deal Slide-Over
   Right-side panel showing deal details, activity log, linked lead, quick-edit
   ============================================================================= */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { X, DollarSign, TrendingUp, Clock, FileText, Activity, ChevronRight } from "lucide-react";
import { toast } from "sonner";

type Stage = "Discovery" | "Analysis" | "Strategy" | "Proposal" | "Closed";
const STAGES: Stage[] = ["Discovery", "Analysis", "Strategy", "Proposal", "Closed"];
const STAGE_COLORS: Record<Stage, string> = {
  Discovery: "#6B6B7A",
  Analysis: "#F5A623",
  Strategy: "#60A5FA",
  Proposal: "#A78BFA",
  Closed: "#4ADE80",
};

interface Deal {
  id: number;
  title: string;
  stage: Stage;
  value?: number | null;
  intentScore?: number | null;
  notes?: string | null;
  tags?: string[] | null;
  closeProbability?: number | null;
  createdAt: Date;
  updatedAt: Date;
}

interface Props {
  deal: Deal | null;
  onClose: () => void;
}

export default function DealSlideOver({ deal, onClose }: Props) {
  const utils = trpc.useUtils();
  const [editNotes, setEditNotes] = useState("");
  const [editValue, setEditValue] = useState("");
  const [editStage, setEditStage] = useState<Stage>("Discovery");
  const [saving, setSaving] = useState(false);

  const { data: activities } = trpc.dashboard.activities.useQuery(
    { limit: 50 },
    { enabled: !!deal }
  );
  const { data: leads } = trpc.leads.list.useQuery(undefined, { enabled: !!deal });

  const updateDeal = trpc.pipeline.update.useMutation({
    onSuccess: () => {
      utils.pipeline.list.invalidate();
      utils.dashboard.metrics.invalidate();
      toast.success("Deal updated");
      setSaving(false);
    },
    onError: () => { toast.error("Failed to update deal"); setSaving(false); },
  });

  // Sync local state when deal changes
  useEffect(() => {
    if (deal) {
      setEditNotes(deal.notes ?? "");
      setEditValue(deal.value != null ? String(deal.value) : "");
      setEditStage(deal.stage);
    }
  }, [deal?.id]);

  if (!deal) return null;

  // Filter activities relevant to this deal title
  const dealActivities = (activities ?? []).filter(
    (a) => a.summary?.toLowerCase().includes(deal.title.toLowerCase()) ||
           a.activityType === "deal_created" ||
           a.activityType === "deal_stage_changed"
  ).slice(0, 8);

  // Find a linked lead by title match — name/company live inside analysisJson
  const linkedLead = (leads ?? []).find((l) => {
    const aj = l.analysisJson as { name?: string; company?: string } | null;
    if (!aj) return false;
    return deal.title.toLowerCase().includes((aj.company ?? "").toLowerCase()) ||
           deal.title.toLowerCase().includes((aj.name ?? "").toLowerCase());
  });

  const handleSave = () => {
    setSaving(true);
    updateDeal.mutate({
      id: deal.id,
      notes: editNotes,
      value: editValue ? parseFloat(editValue) : undefined,
      stage: editStage,
    });
  };

  const isDirty =
    editNotes !== (deal.notes ?? "") ||
    editValue !== (deal.value != null ? String(deal.value) : "") ||
    editStage !== deal.stage;

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(10,10,15,0.6)", backdropFilter: "blur(2px)" }}
        onClick={onClose}
      />

      {/* Panel */}
      <div
        className="fixed right-0 top-0 bottom-0 z-50 flex flex-col"
        style={{
          width: "min(480px, 100vw)",
          background: "var(--surface)",
          borderLeft: "1px solid var(--border-subtle)",
          transform: "translateX(0)",
          willChange: "transform",
        }}
      >
        {/* Header */}
        <div
          className="flex items-start justify-between px-5 py-4 flex-shrink-0"
          style={{ borderBottom: "1px solid var(--border-subtle)" }}
        >
          <div className="flex-1 min-w-0 pr-3">
            <div
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "18px",
                fontWeight: 700,
                color: "var(--ivory)",
                lineHeight: 1.3,
              }}
              className="truncate"
            >
              {deal.title}
            </div>
            <div className="flex items-center gap-2 mt-1">
              <span
                style={{
                  display: "inline-block",
                  width: "7px",
                  height: "7px",
                  borderRadius: "50%",
                  background: STAGE_COLORS[deal.stage],
                  flexShrink: 0,
                }}
              />
              <span
                style={{
                  fontFamily: "Fira Code, monospace",
                  fontSize: "11px",
                  color: STAGE_COLORS[deal.stage],
                }}
              >
                {deal.stage}
              </span>
              <span style={{ color: "var(--border-subtle)" }}>·</span>
              <span
                style={{
                  fontFamily: "Fira Code, monospace",
                  fontSize: "11px",
                  color: "var(--text-muted)",
                }}
              >
                {new Date(deal.createdAt).toLocaleDateString()}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="flex-shrink-0 p-1 rounded"
            style={{ color: "var(--text-muted)" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Scrollable body */}
        <div className="flex-1 overflow-y-auto px-5 py-4 space-y-5">
          {/* Metrics row */}
          <div className="grid grid-cols-3 gap-3">
            {[
              {
                icon: <DollarSign size={13} />,
                label: "Value",
                value: deal.value != null ? `$${deal.value.toLocaleString()}` : "—",
                color: "var(--amber)",
              },
              {
                icon: <TrendingUp size={13} />,
                label: "Intent",
                value: deal.intentScore != null ? `${deal.intentScore.toFixed(1)}/10` : "—",
                color: deal.intentScore != null && deal.intentScore >= 7 ? "#4ADE80" : "var(--text-muted)",
              },
              {
                icon: <Clock size={13} />,
                label: "Close %",
                value: deal.closeProbability != null ? `${deal.closeProbability}%` : "—",
                color: "var(--text-secondary)",
              },
            ].map(({ icon, label, value, color }) => (
              <div
                key={label}
                className="rounded-lg p-3 text-center"
                style={{ background: "var(--obsidian)", border: "1px solid var(--border-subtle)" }}
              >
                <div style={{ color: "var(--text-muted)", marginBottom: "4px" }}>{icon}</div>
                <div style={{ fontFamily: "Fira Code, monospace", fontSize: "13px", fontWeight: 700, color }}>
                  {value}
                </div>
                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "10px", color: "var(--text-muted)", marginTop: "2px" }}>
                  {label}
                </div>
              </div>
            ))}
          </div>

          {/* Quick Edit */}
          <div>
            <div
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "10px",
              }}
            >
              Quick Edit
            </div>
            <div className="space-y-3">
              {/* Stage */}
              <div>
                <label
                  style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}
                >
                  Stage
                </label>
                <select
                  value={editStage}
                  onChange={(e) => setEditStage(e.target.value as Stage)}
                  style={{
                    width: "100%",
                    background: "var(--obsidian)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    padding: "7px 10px",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "13px",
                    color: STAGE_COLORS[editStage],
                    outline: "none",
                  }}
                >
                  {STAGES.map((s) => (
                    <option key={s} value={s} style={{ color: STAGE_COLORS[s] }}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              {/* Value */}
              <div>
                <label
                  style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}
                >
                  Deal Value ($)
                </label>
                <input
                  type="number"
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  placeholder="0"
                  style={{
                    width: "100%",
                    background: "var(--obsidian)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    padding: "7px 10px",
                    fontFamily: "Fira Code, monospace",
                    fontSize: "13px",
                    color: "var(--amber)",
                    outline: "none",
                  }}
                />
              </div>
              {/* Notes */}
              <div>
                <label
                  style={{ fontFamily: "DM Sans, sans-serif", fontSize: "12px", color: "var(--text-secondary)", display: "block", marginBottom: "4px" }}
                >
                  Notes
                </label>
                <textarea
                  value={editNotes}
                  onChange={(e) => setEditNotes(e.target.value)}
                  rows={3}
                  placeholder="Add notes about this deal..."
                  style={{
                    width: "100%",
                    background: "var(--obsidian)",
                    border: "1px solid var(--border-subtle)",
                    borderRadius: "6px",
                    padding: "7px 10px",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "13px",
                    color: "var(--text-primary)",
                    outline: "none",
                    resize: "vertical",
                  }}
                />
              </div>
              {isDirty && (
                <button
                  onClick={handleSave}
                  disabled={saving}
                  className="w-full flex items-center justify-center gap-2 rounded-lg py-2"
                  style={{
                    background: "var(--amber)",
                    color: "#0A0A0F",
                    fontFamily: "DM Sans, sans-serif",
                    fontSize: "13px",
                    fontWeight: 600,
                    opacity: saving ? 0.7 : 1,
                    transition: "opacity 0.15s ease",
                  }}
                >
                  {saving ? "Saving…" : "Save Changes"}
                </button>
              )}
            </div>
          </div>

          {/* Linked Lead */}
          {linkedLead && (
            <div>
              <div
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "10px",
                }}
              >
                Linked Lead
              </div>
              <div
                className="rounded-lg p-3 flex items-center justify-between"
                style={{ background: "var(--obsidian)", border: "1px solid var(--border-subtle)" }}
              >
                <div>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "13px", fontWeight: 600, color: "var(--ivory)" }}>
                    {(linkedLead.analysisJson as { name?: string } | null)?.name ?? "Lead"}
                  </div>
                  <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: "11px", color: "var(--text-muted)", marginTop: "2px" }}>
                    {(linkedLead.analysisJson as { company?: string } | null)?.company ?? ""} · Intent {linkedLead.intentScore?.toFixed(1) ?? "—"}/10
                  </div>
                </div>
                <ChevronRight size={14} style={{ color: "var(--text-muted)" }} />
              </div>
            </div>
          )}

          {/* Tags */}
          {deal.tags && deal.tags.length > 0 && (
            <div>
              <div
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "8px",
                }}
              >
                Tags
              </div>
              <div className="flex flex-wrap gap-2">
                {deal.tags.map((tag) => (
                  <span
                    key={tag}
                    className="px-2 py-1 rounded"
                    style={{
                      fontFamily: "Fira Code, monospace",
                      fontSize: "11px",
                      color: "var(--amber)",
                      background: "rgba(245,166,35,0.1)",
                      border: "1px solid rgba(245,166,35,0.2)",
                    }}
                  >
                    {tag}
                  </span>
                ))}
              </div>
            </div>
          )}

          {/* Activity Log */}
          <div>
            <div
              className="flex items-center gap-2"
              style={{
                fontFamily: "DM Sans, sans-serif",
                fontSize: "11px",
                fontWeight: 600,
                color: "var(--text-muted)",
                textTransform: "uppercase",
                letterSpacing: "0.08em",
                marginBottom: "10px",
              }}
            >
              <Activity size={11} />
              Activity Log
            </div>
            {dealActivities.length === 0 ? (
              <div
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "12px",
                  color: "var(--text-muted)",
                  padding: "12px",
                  textAlign: "center",
                  background: "var(--obsidian)",
                  borderRadius: "8px",
                  border: "1px solid var(--border-subtle)",
                }}
              >
                No activity yet
              </div>
            ) : (
              <div className="space-y-2">
                {dealActivities.map((a) => (
                  <div
                    key={a.id}
                    className="flex items-start gap-3 rounded-lg p-3"
                    style={{ background: "var(--obsidian)", border: "1px solid var(--border-subtle)" }}
                  >
                    <div
                      style={{
                        width: "6px",
                        height: "6px",
                        borderRadius: "50%",
                        background: "var(--amber)",
                        flexShrink: 0,
                        marginTop: "5px",
                      }}
                    />
                    <div className="flex-1 min-w-0">
                      <div
                        style={{
                          fontFamily: "DM Sans, sans-serif",
                          fontSize: "12px",
                          color: "var(--text-secondary)",
                          lineHeight: 1.4,
                        }}
                      >
                        {a.summary ?? a.activityType}
                      </div>
                      <div
                        style={{
                          fontFamily: "Fira Code, monospace",
                          fontSize: "10px",
                          color: "var(--text-muted)",
                          marginTop: "2px",
                        }}
                      >
                        {new Date(a.createdAt).toLocaleString()}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Notes display (read-only view if not editing) */}
          {deal.notes && editNotes === deal.notes && (
            <div>
              <div
                style={{
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "11px",
                  fontWeight: 600,
                  color: "var(--text-muted)",
                  textTransform: "uppercase",
                  letterSpacing: "0.08em",
                  marginBottom: "8px",
                }}
              >
                <FileText size={11} style={{ display: "inline", marginRight: "4px" }} />
                Notes
              </div>
              <div
                className="rounded-lg p-3"
                style={{
                  background: "var(--obsidian)",
                  border: "1px solid var(--border-subtle)",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: "13px",
                  color: "var(--text-secondary)",
                  lineHeight: 1.6,
                }}
              >
                {deal.notes}
              </div>
            </div>
          )}
        </div>
      </div>
    </>
  );
}
