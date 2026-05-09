/* =============================================================================
   Operator House — Admin: Invite Codes & Applications
   Protected, admin-role only. Accessed at /admin/codes.
   ============================================================================= */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { toast } from "sonner";
import { useLocation } from "wouter";
import {
  Copy,
  Plus,
  CheckCircle,
  XCircle,
  Clock,
  RefreshCw,
  Loader2,
  ChevronDown,
  ChevronUp,
} from "lucide-react";
import DashboardLayout from "@/components/DashboardLayout";

// ── Types ─────────────────────────────────────────────────────────────────────

type TabId = "codes" | "applications";

// ── Component ─────────────────────────────────────────────────────────────────

export default function AdminCodes() {
  const { user, isAuthenticated, loading } = useAuth();
  const [, navigate] = useLocation();
  const [tab, setTab] = useState<TabId>("applications");
  const [genCount, setGenCount] = useState(1);
  const [genLabel, setGenLabel] = useState("");
  const [showGenForm, setShowGenForm] = useState(false);

  // Redirect non-admins
  if (!loading && (!isAuthenticated || user?.role !== "admin")) {
    navigate("/");
    return null;
  }

  return (
    <DashboardLayout>
      <div style={{ maxWidth: "900px", margin: "0 auto", padding: "0 0 80px" }}>
        {/* ── Header ──────────────────────────────────────────────────────── */}
        <div style={{ marginBottom: "32px" }}>
          <p style={eyebrowStyle}>Admin</p>
          <h1 style={h1Style}>Invite Codes & Applications</h1>
          <p style={subtitleStyle}>
            Review founding member applications, generate invite codes, and track redemptions.
          </p>
        </div>

        {/* ── Tabs ────────────────────────────────────────────────────────── */}
        <div style={{ display: "flex", gap: "4px", marginBottom: "28px", borderBottom: "1px solid rgba(245,166,35,0.15)", paddingBottom: "0" }}>
          {(["applications", "codes"] as TabId[]).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              style={{
                padding: "10px 20px",
                background: "none",
                border: "none",
                borderBottom: tab === t ? "2px solid #F5A623" : "2px solid transparent",
                color: tab === t ? "#F5A623" : "rgba(232,228,217,0.5)",
                fontSize: "13px",
                fontWeight: 600,
                letterSpacing: "0.05em",
                textTransform: "uppercase",
                cursor: "pointer",
                transition: "color 200ms",
                marginBottom: "-1px",
              }}
            >
              {t === "applications" ? "Applications" : "Invite Codes"}
            </button>
          ))}
        </div>

        {tab === "applications" ? (
          <ApplicationsTab />
        ) : (
          <CodesTab
            genCount={genCount}
            setGenCount={setGenCount}
            genLabel={genLabel}
            setGenLabel={setGenLabel}
            showGenForm={showGenForm}
            setShowGenForm={setShowGenForm}
          />
        )}
      </div>
    </DashboardLayout>
  );
}

// ── Applications Tab ──────────────────────────────────────────────────────────

function ApplicationsTab() {
  const { data: apps, isLoading, refetch } = trpc.funnel.listApplications.useQuery();

  const approve = trpc.funnel.approveApplication.useMutation({
    onSuccess: (data) => {
      toast.success(`Approved — code generated: ${data.code}`);
      navigator.clipboard.writeText(data.code).catch(() => {});
      refetch();
    },
    onError: (err) => toast.error(err.message),
  });

  const reject = trpc.funnel.rejectApplication.useMutation({
    onSuccess: () => { toast.success("Application rejected."); refetch(); },
    onError: (err) => toast.error(err.message),
  });

  if (isLoading) return <LoadingState />;
  if (!apps?.length) return <EmptyState message="No applications yet." />;

  const pending = apps.filter((a) => a.status === "pending");
  const reviewed = apps.filter((a) => a.status !== "pending");

  return (
    <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
      {pending.length > 0 && (
        <p style={{ fontSize: "11px", letterSpacing: "0.1em", color: "#F5A623", fontWeight: 700, textTransform: "uppercase", marginBottom: "4px" }}>
          Pending ({pending.length})
        </p>
      )}
      {pending.map((app) => (
        <ApplicationCard
          key={app.id}
          app={app}
          onApprove={() => approve.mutate({ applicationId: app.id })}
          onReject={() => reject.mutate({ applicationId: app.id })}
          approving={approve.isPending}
          rejecting={reject.isPending}
        />
      ))}
      {reviewed.length > 0 && (
        <>
          <p style={{ fontSize: "11px", letterSpacing: "0.1em", color: "rgba(232,228,217,0.4)", fontWeight: 700, textTransform: "uppercase", marginTop: "16px", marginBottom: "4px" }}>
            Reviewed ({reviewed.length})
          </p>
          {reviewed.map((app) => (
            <ApplicationCard key={app.id} app={app} readonly />
          ))}
        </>
      )}
    </div>
  );
}

function ApplicationCard({
  app,
  onApprove,
  onReject,
  approving,
  rejecting,
  readonly,
}: {
  app: any;
  onApprove?: () => void;
  onReject?: () => void;
  approving?: boolean;
  rejecting?: boolean;
  readonly?: boolean;
}) {
  const [expanded, setExpanded] = useState(false);
  const statusColor = app.status === "approved" ? "#4ADE80" : app.status === "rejected" ? "#EF4444" : "#F5A623";

  return (
    <div
      style={{
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(245,166,35,0.12)",
        borderRadius: "8px",
        padding: "16px 20px",
      }}
    >
      <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: "12px" }}>
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "4px" }}>
            <span style={{ fontWeight: 700, fontSize: "15px", color: "#E8E4D9" }}>{app.name}</span>
            <span
              style={{
                fontSize: "10px",
                fontWeight: 700,
                letterSpacing: "0.08em",
                textTransform: "uppercase",
                color: statusColor,
                background: `${statusColor}18`,
                padding: "2px 8px",
                borderRadius: "4px",
              }}
            >
              {app.status}
            </span>
          </div>
          <p style={{ fontSize: "13px", color: "rgba(232,228,217,0.5)", marginBottom: "6px" }}>{app.email}</p>
          <p style={{ fontSize: "12px", color: "rgba(232,228,217,0.35)" }}>
            {new Date(app.createdAt).toLocaleDateString("en-US", { month: "short", day: "numeric", year: "numeric" })}
          </p>
        </div>
        <button
          onClick={() => setExpanded((x) => !x)}
          style={{ background: "none", border: "none", color: "rgba(232,228,217,0.4)", cursor: "pointer", padding: "4px", flexShrink: 0 }}
        >
          {expanded ? <ChevronUp size={16} /> : <ChevronDown size={16} />}
        </button>
      </div>

      {expanded && (
        <div style={{ marginTop: "12px", paddingTop: "12px", borderTop: "1px solid rgba(245,166,35,0.1)" }}>
          <p style={{ fontSize: "14px", color: "rgba(232,228,217,0.7)", lineHeight: 1.7, marginBottom: "16px" }}>
            {app.reason}
          </p>
          {!readonly && app.status === "pending" && (
            <div style={{ display: "flex", gap: "10px" }}>
              <button
                onClick={onApprove}
                disabled={approving}
                style={{ ...actionBtnStyle, background: "rgba(74,222,128,0.15)", border: "1px solid rgba(74,222,128,0.3)", color: "#4ADE80" }}
              >
                {approving ? <Loader2 size={14} className="animate-spin" /> : <CheckCircle size={14} />}
                Approve & Generate Code
              </button>
              <button
                onClick={onReject}
                disabled={rejecting}
                style={{ ...actionBtnStyle, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.25)", color: "#EF4444" }}
              >
                {rejecting ? <Loader2 size={14} className="animate-spin" /> : <XCircle size={14} />}
                Reject
              </button>
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ── Codes Tab ─────────────────────────────────────────────────────────────────

function CodesTab({
  genCount, setGenCount, genLabel, setGenLabel, showGenForm, setShowGenForm,
}: {
  genCount: number;
  setGenCount: (n: number) => void;
  genLabel: string;
  setGenLabel: (s: string) => void;
  showGenForm: boolean;
  setShowGenForm: (b: boolean) => void;
}) {
  const { data: codes, isLoading, refetch } = trpc.funnel.listCodes.useQuery();
  const [newCodes, setNewCodes] = useState<string[]>([]);

  const generate = trpc.funnel.generateCodes.useMutation({
    onSuccess: (data) => {
      setNewCodes(data.codes);
      toast.success(`${data.codes.length} code${data.codes.length > 1 ? "s" : ""} generated.`);
      refetch();
      setShowGenForm(false);
    },
    onError: (err) => toast.error(err.message),
  });

  const handleGenerate = (e: React.FormEvent) => {
    e.preventDefault();
    generate.mutate({ count: genCount, label: genLabel || undefined });
  };

  if (isLoading) return <LoadingState />;

  const available = codes?.filter((c) => !c.redeemedByUserId) ?? [];
  const redeemed = codes?.filter((c) => c.redeemedByUserId) ?? [];

  return (
    <div>
      {/* New codes banner */}
      {newCodes.length > 0 && (
        <div
          style={{
            background: "rgba(74,222,128,0.08)",
            border: "1px solid rgba(74,222,128,0.25)",
            borderRadius: "8px",
            padding: "16px 20px",
            marginBottom: "20px",
          }}
        >
          <p style={{ fontSize: "12px", fontWeight: 700, color: "#4ADE80", letterSpacing: "0.08em", textTransform: "uppercase", marginBottom: "10px" }}>
            New codes — copy and send these:
          </p>
          <div style={{ display: "flex", flexWrap: "wrap", gap: "8px" }}>
            {newCodes.map((c) => (
              <CodePill key={c} code={c} />
            ))}
          </div>
        </div>
      )}

      {/* Generate form toggle */}
      <div style={{ marginBottom: "24px" }}>
        <button
          onClick={() => setShowGenForm(!showGenForm)}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "8px",
            padding: "10px 20px",
            background: "rgba(245,166,35,0.1)",
            border: "1px solid rgba(245,166,35,0.3)",
            borderRadius: "6px",
            color: "#F5A623",
            fontSize: "13px",
            fontWeight: 700,
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          <Plus size={14} />
          Generate Codes
        </button>

        {showGenForm && (
          <form
            onSubmit={handleGenerate}
            style={{
              marginTop: "12px",
              padding: "20px",
              background: "rgba(255,255,255,0.03)",
              border: "1px solid rgba(245,166,35,0.15)",
              borderRadius: "8px",
              display: "flex",
              gap: "12px",
              flexWrap: "wrap",
              alignItems: "flex-end",
            }}
          >
            <div>
              <label style={miniLabelStyle}>Count</label>
              <input
                type="number"
                min={1}
                max={50}
                value={genCount}
                onChange={(e) => setGenCount(Number(e.target.value))}
                style={{ ...miniInputStyle, width: "70px" }}
              />
            </div>
            <div>
              <label style={miniLabelStyle}>Label (optional)</label>
              <input
                type="text"
                value={genLabel}
                onChange={(e) => setGenLabel(e.target.value)}
                placeholder="e.g. batch-may-2026"
                style={{ ...miniInputStyle, width: "200px" }}
              />
            </div>
            <button
              type="submit"
              disabled={generate.isPending}
              style={{
                padding: "9px 20px",
                background: generate.isPending ? "rgba(245,166,35,0.4)" : "linear-gradient(135deg, #F5A623, #E8940F)",
                border: "none",
                borderRadius: "6px",
                color: "#0A0A0B",
                fontSize: "13px",
                fontWeight: 700,
                cursor: generate.isPending ? "not-allowed" : "pointer",
                display: "flex",
                alignItems: "center",
                gap: "6px",
              }}
            >
              {generate.isPending ? <Loader2 size={14} className="animate-spin" /> : <RefreshCw size={14} />}
              Generate
            </button>
          </form>
        )}
      </div>

      {/* Stats */}
      <div style={{ display: "flex", gap: "16px", marginBottom: "24px", flexWrap: "wrap" }}>
        <StatChip label="Available" value={available.length} color="#F5A623" />
        <StatChip label="Redeemed" value={redeemed.length} color="#4ADE80" />
        <StatChip label="Total" value={codes?.length ?? 0} color="rgba(232,228,217,0.4)" />
      </div>

      {/* Code list */}
      {!codes?.length ? (
        <EmptyState message="No codes generated yet." />
      ) : (
        <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
          {codes.map((c) => (
            <div
              key={c.id}
              style={{
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                padding: "12px 16px",
                background: "rgba(255,255,255,0.03)",
                border: `1px solid ${c.redeemedByUserId ? "rgba(74,222,128,0.15)" : "rgba(245,166,35,0.12)"}`,
                borderRadius: "6px",
                gap: "12px",
                flexWrap: "wrap",
              }}
            >
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                <span
                  style={{
                    fontFamily: "monospace",
                    fontSize: "16px",
                    fontWeight: 700,
                    letterSpacing: "0.1em",
                    color: c.redeemedByUserId ? "rgba(232,228,217,0.4)" : "#E8E4D9",
                  }}
                >
                  {c.code}
                </span>
                {c.label && (
                  <span style={{ fontSize: "12px", color: "rgba(232,228,217,0.4)" }}>{c.label}</span>
                )}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                {c.redeemedByUserId ? (
                  <span style={{ fontSize: "11px", color: "#4ADE80", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                    Redeemed
                  </span>
                ) : (
                  <>
                    <span style={{ fontSize: "11px", color: "#F5A623", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase" }}>
                      Available
                    </span>
                    <button
                      onClick={() => { navigator.clipboard.writeText(c.code); toast.success("Copied!"); }}
                      style={{ background: "none", border: "none", color: "rgba(232,228,217,0.4)", cursor: "pointer", padding: "4px" }}
                    >
                      <Copy size={14} />
                    </button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ── Small helpers ─────────────────────────────────────────────────────────────

function CodePill({ code }: { code: string }) {
  return (
    <button
      onClick={() => { navigator.clipboard.writeText(code); toast.success("Copied!"); }}
      style={{
        fontFamily: "monospace",
        fontSize: "15px",
        fontWeight: 700,
        letterSpacing: "0.1em",
        padding: "6px 14px",
        background: "rgba(74,222,128,0.1)",
        border: "1px solid rgba(74,222,128,0.3)",
        borderRadius: "6px",
        color: "#4ADE80",
        cursor: "pointer",
        display: "flex",
        alignItems: "center",
        gap: "8px",
      }}
    >
      {code}
      <Copy size={12} />
    </button>
  );
}

function StatChip({ label, value, color }: { label: string; value: number; color: string }) {
  return (
    <div
      style={{
        padding: "10px 16px",
        background: "rgba(255,255,255,0.03)",
        border: "1px solid rgba(245,166,35,0.1)",
        borderRadius: "6px",
        textAlign: "center",
      }}
    >
      <p style={{ fontSize: "22px", fontWeight: 700, color, marginBottom: "2px" }}>{value}</p>
      <p style={{ fontSize: "11px", color: "rgba(232,228,217,0.4)", letterSpacing: "0.06em", textTransform: "uppercase" }}>{label}</p>
    </div>
  );
}

function LoadingState() {
  return (
    <div style={{ display: "flex", justifyContent: "center", padding: "60px 0" }}>
      <Loader2 size={28} style={{ color: "#F5A623", animation: "spin 1s linear infinite" }} />
    </div>
  );
}

function EmptyState({ message }: { message: string }) {
  return (
    <div style={{ textAlign: "center", padding: "60px 0", color: "rgba(232,228,217,0.35)", fontSize: "14px" }}>
      {message}
    </div>
  );
}

// ── Style constants ───────────────────────────────────────────────────────────

const eyebrowStyle: React.CSSProperties = {
  fontSize: "11px",
  letterSpacing: "0.15em",
  color: "#F5A623",
  fontWeight: 700,
  textTransform: "uppercase",
  marginBottom: "8px",
};

const h1Style: React.CSSProperties = {
  fontFamily: "Playfair Display, serif",
  fontSize: "clamp(24px, 4vw, 36px)",
  fontWeight: 700,
  lineHeight: 1.2,
  marginBottom: "8px",
  color: "#E8E4D9",
};

const subtitleStyle: React.CSSProperties = {
  color: "rgba(232,228,217,0.55)",
  fontSize: "14px",
  lineHeight: 1.7,
};

const actionBtnStyle: React.CSSProperties = {
  padding: "8px 16px",
  borderRadius: "6px",
  fontSize: "13px",
  fontWeight: 600,
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  gap: "6px",
};

const miniLabelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "11px",
  letterSpacing: "0.08em",
  color: "rgba(232,228,217,0.45)",
  fontWeight: 600,
  textTransform: "uppercase",
  marginBottom: "6px",
};

const miniInputStyle: React.CSSProperties = {
  padding: "8px 12px",
  background: "rgba(255,255,255,0.05)",
  border: "1px solid rgba(245,166,35,0.2)",
  borderRadius: "6px",
  color: "#E8E4D9",
  fontSize: "14px",
  fontFamily: "DM Sans, sans-serif",
  outline: "none",
};
