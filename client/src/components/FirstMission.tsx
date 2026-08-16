/* ============================================================================
   Operator House — First Mission
   Guides a new operator into the real Lead → Audit → Strategy workflow.
   ============================================================================= */
import { useState } from "react";
import { useLocation } from "wouter";
import { toast } from "sonner";
import { ArrowRight, Target } from "lucide-react";
import { saveLeadInputPrefill } from "@/lib/heroWorkflow";

const OH_SYMBOL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp";

interface FirstMissionProps {
  onComplete: () => void;
}

export default function FirstMission({ onComplete }: FirstMissionProps) {
  const [, setLocation] = useLocation();
  const [leadInput, setLeadInput] = useState("");

  const handleSubmit = (event: React.FormEvent) => {
    event.preventDefault();
    const trimmed = leadInput.trim();
    if (!trimmed) return;
    saveLeadInputPrefill(trimmed);
    onComplete();
    toast.success("Lead context loaded — Specter is ready to audit it.");
    setLocation("/leads");
  };

  return (
    <section
      aria-labelledby="first-mission-title"
      style={{
        position: "relative", overflow: "hidden",
        background: "linear-gradient(135deg, rgba(14,14,22,0.98) 0%, rgba(20,20,32,0.94) 100%)",
        border: "1px solid rgba(245,166,35,0.18)", borderRadius: 12,
        padding: "clamp(26px, 5vw, 40px)", maxWidth: 620, margin: "0 auto",
        boxShadow: "0 0 60px rgba(245,166,35,0.05), inset 0 1px 0 rgba(245,166,35,0.08)",
        animation: "missionFadeIn 0.6s ease forwards",
      }}
    >
      <div style={{ position: "absolute", top: 0, left: 0, right: 0, height: 1, background: "linear-gradient(90deg, #d4a853 0%, rgba(212,168,83,0.15) 50%, transparent 100%)" }} />
      <div style={{ position: "absolute", top: -80, right: -80, width: 280, height: 280, borderRadius: "50%", background: "radial-gradient(circle, rgba(245,166,35,0.07) 0%, transparent 70%)", pointerEvents: "none" }} />

      <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 24 }}>
        <img src={OH_SYMBOL} alt="" style={{ width: 28, height: 28, objectFit: "contain", opacity: 0.8 }} draggable={false} />
        <span style={{ fontFamily: "Fira Code, monospace", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(212,168,83,0.7)" }}>
          First Mission · 01
        </span>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 14 }}>
        <div style={{ width: 30, height: 30, borderRadius: 8, display: "grid", placeItems: "center", background: "rgba(245,166,35,0.12)", color: "#f5a623", border: "1px solid rgba(245,166,35,0.25)" }}>
          <Target size={15} aria-hidden="true" />
        </div>
        <span style={{ fontFamily: "Fira Code, monospace", fontSize: 10, letterSpacing: "0.12em", textTransform: "uppercase", color: "rgba(234,232,226,0.5)" }}>Your first win</span>
      </div>

      <h2 id="first-mission-title" style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(24px, 4vw, 32px)", fontWeight: 700, color: "#f5f0e8", lineHeight: 1.22, margin: "0 0 12px" }}>
        Put one real prospect<br />
        <span style={{ color: "#d4a853" }}>through the Specter Audit.</span>
      </h2>
      <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "rgba(245,240,232,0.56)", lineHeight: 1.65, margin: "0 0 24px", maxWidth: 460 }}>
        Paste a company URL, LinkedIn profile, email, or a few facts. Specter will produce the first piece of your real operating system: an audit you can turn into strategy and outreach.
      </p>

      <form onSubmit={handleSubmit} style={{ display: "flex", flexWrap: "wrap", gap: 10, alignItems: "stretch" }}>
        <input
          type="text"
          value={leadInput}
          onChange={(event) => setLeadInput(event.target.value)}
          placeholder="linkedin.com/in/... or company.com"
          autoFocus
          aria-label="Lead to audit"
          style={{ flex: "1 1 280px", minHeight: 46, padding: "11px 14px", background: "rgba(255,255,255,0.04)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 7, color: "#f5f0e8", fontFamily: "DM Sans, sans-serif", fontSize: 14, outline: "none" }}
        />
        <button
          type="submit"
          disabled={!leadInput.trim()}
          style={{ display: "inline-flex", alignItems: "center", justifyContent: "center", gap: 7, minHeight: 46, padding: "11px 18px", background: leadInput.trim() ? "#d4a853" : "rgba(212,168,83,0.2)", border: "none", borderRadius: 7, color: leadInput.trim() ? "#0e0e0e" : "rgba(212,168,83,0.45)", fontFamily: "DM Sans, sans-serif", fontSize: 13, fontWeight: 700, cursor: leadInput.trim() ? "pointer" : "default", boxShadow: leadInput.trim() ? "0 0 20px rgba(212,168,83,0.25)" : "none", whiteSpace: "nowrap" }}
        >
          Start Audit <ArrowRight size={13} />
        </button>
      </form>
      <p style={{ margin: "12px 0 0", color: "rgba(245,240,232,0.35)", fontFamily: "Fira Code, monospace", fontSize: 10, lineHeight: 1.5 }}>
        You stay in control. Nothing sends until you explicitly choose an outreach action.
      </p>

      <style>{`
        @keyframes missionFadeIn { from { opacity: 0; transform: translateY(12px); } to { opacity: 1; transform: translateY(0); } }
      `}</style>
    </section>
  );
}
