/* =============================================================================
   Operator House — Claim Your Seat (Pricing v2)
   Identity/aspiration framing. No feature table. Outcome promises only.
   Dark centered layout, OH symbol prominent, Stripe checkout wired.
   ============================================================================= */
import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { toast } from "sonner";
import { ChevronLeft, Loader2 } from "lucide-react";

const OH_SYMBOL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp";

const OUTCOMES = [
  { label: "Arrive prepared.", desc: "Every client meeting starts with a full AI briefing — context, stage, next move." },
  { label: "Close faster.", desc: "Your pipeline, proposals, and follow-ups tracked in one room. Nothing falls through." },
  { label: "Think at a higher level.", desc: "Strategies, frameworks, and playbooks generated in seconds, not hours." },
  { label: "Own your intelligence.", desc: "Your Vault compounds over time. Every client, every insight, always accessible." },
];

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState<string | null>(null);

  const createCheckout = trpc.stripe.createCheckout.useMutation();

  const handleCheckout = async (plan: "monthly" | "annual") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setLoading(plan);
    try {
      const result = await createCheckout.mutateAsync({ plan, origin: window.location.origin });
      if (result.url) {
        toast.success("Redirecting to checkout…", { description: "Opening Stripe in a new tab." });
        window.open(result.url, "_blank");
      }
    } catch (err: unknown) {
      toast.error(err instanceof Error ? err.message : "Checkout failed");
    } finally {
      setLoading(null);
    }
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "radial-gradient(ellipse at 50% 0%, #0f0d08 0%, #08080D 60%)",
        color: "#f5f0e8",
        overflowX: "hidden",
      }}
    >
      {/* Nav */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 50,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 24px",
        borderBottom: "1px solid rgba(255,255,255,0.06)",
        background: "rgba(8,8,13,0.92)",
        backdropFilter: "blur(12px)",
      }}>
        <button
          onClick={() => setLocation("/")}
          style={{
            display: "flex", alignItems: "center", gap: 6,
            background: "none", border: "none",
            color: "rgba(245,240,232,0.45)", fontSize: 13,
            cursor: "pointer", fontFamily: "DM Sans, sans-serif",
            transition: "color 180ms ease",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,240,232,0.9)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,240,232,0.45)"; }}
        >
          <ChevronLeft size={14} /> Back
        </button>
        <img src={OH_SYMBOL} alt="Operator House" style={{ width: 24, height: 24, objectFit: "contain", opacity: 0.7 }} draggable={false} />
        {isAuthenticated ? (
          <button onClick={() => setLocation("/dashboard")} style={{ background: "none", border: "none", color: "#d4a853", fontSize: 13, cursor: "pointer", fontFamily: "DM Sans, sans-serif" }}>
            Dashboard →
          </button>
        ) : (
          <a href={getLoginUrl()} style={{ color: "#d4a853", fontSize: 13, textDecoration: "none", fontFamily: "DM Sans, sans-serif" }}>
            Sign in
          </a>
        )}
      </nav>

      <div style={{ paddingTop: 120, paddingBottom: 96, maxWidth: 640, margin: "0 auto", padding: "120px 24px 96px" }}>

        {/* OH Symbol */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: 36 }}>
          <div style={{ position: "relative" }}>
            <div style={{
              position: "absolute", inset: -20,
              borderRadius: "50%",
              background: "radial-gradient(circle, rgba(212,168,83,0.15) 0%, transparent 70%)",
              pointerEvents: "none",
            }} />
            <img src={OH_SYMBOL} alt="" style={{ width: 64, height: 64, objectFit: "contain", display: "block", position: "relative" }} draggable={false} />
          </div>
        </div>

        {/* Headline */}
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <p style={{
            fontFamily: "Fira Code, monospace", fontSize: 10,
            letterSpacing: "0.25em", textTransform: "uppercase",
            color: "rgba(212,168,83,0.55)", marginBottom: 16,
          }}>
            Operator House · Beta Access
          </p>
          <h1 style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "clamp(26px, 5vw, 40px)",
            fontWeight: 700,
            color: "#f5f0e8",
            lineHeight: 1.25,
            marginBottom: 16,
            maxWidth: 520,
            margin: "0 auto 16px",
          }}>
            Operators who close more<br />
            <span style={{ color: "#d4a853" }}>don't work more.</span><br />
            They work prepared.
          </h1>
          <p style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: 16,
            color: "rgba(245,240,232,0.45)",
            lineHeight: 1.65,
            maxWidth: 420,
            margin: "0 auto",
          }}>
            Operator House is the HQ for consultants who want every client interaction to start from a position of intelligence.
          </p>
        </div>

        {/* Outcome promises */}
        <div style={{ marginBottom: 52 }}>
          {OUTCOMES.map((o, i) => (
            <div
              key={i}
              style={{
                display: "flex", alignItems: "flex-start", gap: 16,
                padding: "18px 0",
                borderBottom: i < OUTCOMES.length - 1 ? "1px solid rgba(255,255,255,0.06)" : "none",
                animation: `outcomeIn 0.5s ease ${i * 80}ms both`,
              }}
            >
              <div style={{
                width: 6, height: 6, borderRadius: "50%",
                background: "#d4a853",
                boxShadow: "0 0 8px rgba(212,168,83,0.5)",
                marginTop: 7, flexShrink: 0,
              }} />
              <div>
                <div style={{ fontFamily: "Playfair Display, serif", fontSize: 16, fontWeight: 600, color: "#f5f0e8", marginBottom: 4 }}>
                  {o.label}
                </div>
                <div style={{ fontFamily: "DM Sans, sans-serif", fontSize: 14, color: "rgba(245,240,232,0.45)", lineHeight: 1.6 }}>
                  {o.desc}
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Billing toggle */}
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 28 }}>
          {(["monthly", "annual"] as const).map((b) => (
            <button
              key={b}
              onClick={() => setBilling(b)}
              style={{
                padding: "8px 18px",
                borderRadius: 20,
                border: "1px solid",
                borderColor: billing === b ? "rgba(212,168,83,0.5)" : "rgba(255,255,255,0.08)",
                background: billing === b ? "rgba(212,168,83,0.1)" : "transparent",
                color: billing === b ? "#d4a853" : "rgba(245,240,232,0.35)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13, fontWeight: billing === b ? 600 : 400,
                cursor: "pointer",
                transition: "all 180ms ease",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {b === "monthly" ? "Monthly" : "Annual"}
              {b === "annual" && (
                <span style={{
                  fontSize: 10, fontFamily: "Fira Code, monospace",
                  background: "rgba(74,222,128,0.15)",
                  color: "#4ADE80",
                  padding: "2px 6px", borderRadius: 10,
                  letterSpacing: "0.05em",
                }}>
                  SAVE 32%
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Plan cards */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          {/* Monthly */}
          <div
            style={{
              position: "relative",
              background: "rgba(255,255,255,0.02)",
              border: `1px solid ${billing === "monthly" ? "rgba(212,168,83,0.4)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 10,
              padding: "28px 24px",
              transition: "border-color 200ms ease",
              cursor: "pointer",
            }}
            onClick={() => setBilling("monthly")}
          >
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,240,232,0.35)", marginBottom: 12 }}>Monthly</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 20 }}>
              <span style={{ fontFamily: "Playfair Display, serif", fontSize: 38, fontWeight: 700, color: "#f5f0e8", lineHeight: 1 }}>$97</span>
              <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "rgba(245,240,232,0.35)" }}>/mo</span>
            </div>
            <button
              onClick={(e) => { e.stopPropagation(); handleCheckout("monthly"); }}
              disabled={loading !== null}
              style={{
                width: "100%", padding: "10px 0",
                background: billing === "monthly" ? "#d4a853" : "rgba(212,168,83,0.08)",
                border: `1px solid ${billing === "monthly" ? "transparent" : "rgba(212,168,83,0.2)"}`,
                borderRadius: 6,
                color: billing === "monthly" ? "#0e0e0e" : "#d4a853",
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13, fontWeight: 700,
                cursor: loading ? "default" : "pointer",
                transition: "all 200ms ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {loading === "monthly" ? <><Loader2 size={13} className="animate-spin" /> Opening…</> : "Get Access"}
            </button>
          </div>

          {/* Annual — recommended */}
          <div
            style={{
              position: "relative",
              background: billing === "annual" ? "rgba(212,168,83,0.06)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${billing === "annual" ? "rgba(212,168,83,0.5)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 10,
              padding: "28px 24px",
              transition: "border-color 200ms ease, background 200ms ease",
              cursor: "pointer",
              boxShadow: billing === "annual" ? "0 0 40px rgba(212,168,83,0.08)" : "none",
            }}
            onClick={() => setBilling("annual")}
          >
            {/* Recommended badge */}
            <div style={{
              position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
              background: "#d4a853", color: "#0e0e0e",
              fontFamily: "Fira Code, monospace", fontSize: 9,
              letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "3px 10px", borderRadius: 10, fontWeight: 700,
              whiteSpace: "nowrap",
            }}>
              Recommended
            </div>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,240,232,0.35)", marginBottom: 12 }}>Annual</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontFamily: "Playfair Display, serif", fontSize: 38, fontWeight: 700, color: "#d4a853", lineHeight: 1 }}>$66</span>
              <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "rgba(245,240,232,0.35)" }}>/mo</span>
            </div>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: "rgba(245,240,232,0.3)", marginBottom: 20 }}>Billed $797/year</p>
            <button
              onClick={(e) => { e.stopPropagation(); handleCheckout("annual"); }}
              disabled={loading !== null}
              style={{
                width: "100%", padding: "10px 0",
                background: "#d4a853",
                border: "none", borderRadius: 6,
                color: "#0e0e0e",
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13, fontWeight: 700,
                cursor: loading ? "default" : "pointer",
                boxShadow: "0 0 20px rgba(212,168,83,0.3)",
                transition: "box-shadow 200ms ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 32px rgba(212,168,83,0.5)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 20px rgba(212,168,83,0.3)"; }}
            >
              {loading === "annual" ? <><Loader2 size={13} className="animate-spin" /> Opening…</> : "Claim Your Seat"}
            </button>
          </div>
        </div>

        {/* Trust line */}
        <p style={{
          textAlign: "center",
          fontFamily: "DM Sans, sans-serif",
          fontSize: 12,
          color: "rgba(245,240,232,0.2)",
          lineHeight: 1.7,
        }}>
          Secure checkout via Stripe · Cancel anytime · No setup fees
        </p>
      </div>

      <style>{`
        @keyframes outcomeIn {
          from { opacity: 0; transform: translateX(-10px); }
          to   { opacity: 1; transform: translateX(0); }
        }
      `}</style>
    </div>
  );
}
