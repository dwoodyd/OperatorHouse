/* =============================================================================
   Operator House — First Mission
   Replaces the empty dashboard state for brand-new users who have zero vault
   items, zero leads, and zero deals. A single focused prompt that initiates
   the operator into the House.
   ============================================================================= */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowRight, Loader2 } from "lucide-react";

const OH_SYMBOL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp";

interface FirstMissionProps {
  onComplete: () => void;
}

export default function FirstMission({ onComplete }: FirstMissionProps) {
  const [name, setName] = useState("");
  const [activated, setActivated] = useState(false);
  const [flash, setFlash] = useState(false);

  const utils = trpc.useUtils();
  const createClient = trpc.clients.create.useMutation({
    onSuccess: () => {
      utils.clients.list.invalidate();
      utils.dashboard.metrics.invalidate();
      setFlash(true);
      setTimeout(() => {
        setActivated(true);
        setTimeout(onComplete, 1800);
      }, 600);
    },
    onError: (err: { message?: string }) => {
      toast.error(err.message ?? "Could not add client");
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = name.trim();
    if (!trimmed) return;
    createClient.mutate({ name: trimmed });
  };

  /* ── Activated state ────────────────────────────────────────────────────── */
  if (activated) {
    return (
      <div
        style={{
          display: "flex", flexDirection: "column", alignItems: "center",
          justifyContent: "center", minHeight: 320, padding: "48px 24px",
          textAlign: "center",
          animation: "missionFadeIn 0.5s ease forwards",
        }}
      >
        <div style={{
          width: 56, height: 56, borderRadius: "50%",
          background: "rgba(74,222,128,0.12)",
          border: "1px solid rgba(74,222,128,0.3)",
          display: "flex", alignItems: "center", justifyContent: "center",
          marginBottom: 20,
          animation: "missionPop 0.4s cubic-bezier(0.34,1.4,0.64,1) forwards",
        }}>
          <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
            <path d="M4 11.5L9 16.5L18 6" stroke="#4ADE80" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>
        <h3 style={{
          fontFamily: "Playfair Display, serif", fontSize: 22, fontWeight: 700,
          color: "#f5f0e8", marginBottom: 8,
        }}>
          The House is now active.
        </h3>
        <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "rgba(245,240,232,0.5)" }}>
          Your first client is in the Vault. The Command Line is ready.
        </p>
      </div>
    );
  }

  return (
    <div
      style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, rgba(14,14,22,0.97) 0%, rgba(20,20,32,0.92) 100%)",
        border: "1px solid rgba(245,166,35,0.15)",
        borderRadius: 10,
        padding: "40px 36px",
        maxWidth: 560,
        margin: "0 auto",
        boxShadow: "0 0 60px rgba(245,166,35,0.05), inset 0 1px 0 rgba(245,166,35,0.08)",
        animation: "missionFadeIn 0.6s ease forwards",
      }}
    >
      {/* Gold flash overlay */}
      {flash && (
        <div style={{
          position: "absolute", inset: 0, borderRadius: 10,
          background: "rgba(212,168,83,0.12)",
          animation: "goldFlash 600ms ease forwards",
          pointerEvents: "none",
        }} />
      )}

      {/* Top accent line */}
      <div style={{
        position: "absolute", top: 0, left: 0, right: 0, height: 1,
        background: "linear-gradient(90deg, #d4a853 0%, rgba(212,168,83,0.15) 50%, transparent 100%)",
      }} />

      {/* Ambient glow */}
      <div style={{
        position: "absolute", top: -60, right: -60, width: 240, height: 240,
        borderRadius: "50%",
        background: "radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)",
        pointerEvents: "none",
      }} />

      {/* OH symbol */}
      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <img src={OH_SYMBOL} alt="" style={{ width: 28, height: 28, objectFit: "contain", opacity: 0.8 }} draggable={false} />
        <span style={{
          fontFamily: "Fira Code, monospace", fontSize: 10,
          letterSpacing: "0.22em", textTransform: "uppercase",
          color: "rgba(212,168,83,0.6)",
        }}>
          First Mission
        </span>
      </div>

      <h2 style={{
        fontFamily: "Playfair Display, serif",
        fontSize: "clamp(20px, 3.5vw, 26px)",
        fontWeight: 700,
        color: "#f5f0e8",
        lineHeight: 1.3,
        marginBottom: 10,
      }}>
        Add your first client to the Vault<br />
        <span style={{ color: "#d4a853" }}>to unlock your Command Line.</span>
      </h2>

      <p style={{
        fontFamily: "DM Sans, sans-serif", fontSize: 14,
        color: "rgba(245,240,232,0.45)", lineHeight: 1.6,
        marginBottom: 28, maxWidth: 400,
      }}>
        The Vault is your private client intelligence base. Every lead, deal, and strategy connects back to it.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", gap: 10, alignItems: "stretch" }}>
        <input
          type="text"
          value={name}
          onChange={e => setName(e.target.value)}
          placeholder="Client or company name…"
          autoFocus
          disabled={createClient.isPending}
          style={{
            flex: 1,
            padding: "11px 14px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(245,166,35,0.2)",
            borderRadius: 6,
            color: "#f5f0e8",
            fontFamily: "DM Sans, sans-serif",
            fontSize: 14,
            outline: "none",
            transition: "border-color 180ms ease",
          }}
          onFocus={e => { e.currentTarget.style.borderColor = "rgba(245,166,35,0.5)"; }}
          onBlur={e => { e.currentTarget.style.borderColor = "rgba(245,166,35,0.2)"; }}
        />
        <button
          type="submit"
          disabled={createClient.isPending || !name.trim()}
          style={{
            display: "flex", alignItems: "center", gap: 7,
            padding: "11px 18px",
            background: name.trim() ? "#d4a853" : "rgba(212,168,83,0.2)",
            border: "none", borderRadius: 6,
            color: name.trim() ? "#0e0e0e" : "rgba(212,168,83,0.4)",
            fontFamily: "DM Sans, sans-serif",
            fontSize: 13, fontWeight: 700,
            cursor: name.trim() && !createClient.isPending ? "pointer" : "default",
            transition: "background 200ms ease, color 200ms ease, box-shadow 200ms ease",
            boxShadow: name.trim() ? "0 0 20px rgba(212,168,83,0.25)" : "none",
            whiteSpace: "nowrap",
          }}
        >
          {createClient.isPending
            ? <><Loader2 size={13} className="animate-spin" /> Adding…</>
            : <>Add Client <ArrowRight size={13} /></>
          }
        </button>
      </form>

      <style>{`
        @keyframes missionFadeIn {
          from { opacity: 0; transform: translateY(12px); }
          to   { opacity: 1; transform: translateY(0); }
        }
        @keyframes missionPop {
          from { transform: scale(0.7); opacity: 0; }
          to   { transform: scale(1);   opacity: 1; }
        }
        @keyframes goldFlash {
          0%   { opacity: 0; }
          30%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
