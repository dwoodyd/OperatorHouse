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
import { SpectreVideoPlayer } from "@/components/SpectreVideoPlayer";
import { useSpectre } from "@/contexts/SpectreContext";

const OH_SYMBOL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp";

const OUTCOMES = [
  { label: "Arrive prepared.", desc: "Every client meeting starts with a full AI briefing — context, stage, next move." },
  { label: "Close faster.", desc: "Your pipeline, proposals, and follow-ups tracked in one room. Nothing falls through." },
  { label: "Think at a higher level.", desc: "Strategies, frameworks, and playbooks generated in seconds, not hours." },
  { label: "Own your intelligence.", desc: "Your Vault compounds over time. Every client, every insight, always accessible." },
];

export default function Pricing() {
  const { spectreHidden } = useSpectre();
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();
  const [billing, setBilling] = useState<"operator" | "operator_pro">("operator");
  const [loading, setLoading] = useState<string | null>(null);

  const { data: paypalData } = trpc.paypal.plans.useQuery();

  const handleCheckout = async (tier: "operator" | "operator_pro") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    const planId = tier === "operator"
      ? paypalData?.plans.operator.planId
      : paypalData?.plans.operator_pro.planId;
    if (!planId) {
      toast.error("Payment plans not yet configured. Please try again shortly.");
      return;
    }
    setLoading(tier);
    toast.info("Opening PayPal checkout…");
    const clientId = paypalData?.clientId ?? "";
    const returnUrl = encodeURIComponent(`${window.location.origin}/dashboard?subscribed=1`);
    const cancelUrl = encodeURIComponent(`${window.location.origin}/pricing?cancelled=1`);
    const paypalUrl = `https://www.paypal.com/webapps/billing/plans/subscribe?plan_id=${planId}&client_id=${clientId}&return_url=${returnUrl}&cancel_url=${cancelUrl}`;
    window.open(paypalUrl, "_blank");
    setLoading(null);
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
          <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10,
            letterSpacing: "0.25em", textTransform: "uppercase",
            color: "rgba(212,168,83,0.55)", marginBottom: 16,
          }}>
            Operator House · Founding Cohort
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
            Specter operators close more<br />
            <span style={{ color: "#d4a853" }}>without working more.</span><br />
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

        {/* Tier toggle */}
        <div style={{ display: "flex", justifyContent: "center", gap: 4, marginBottom: 28 }}>
          {(["operator", "operator_pro"] as const).map((t) => (
            <button
              key={t}
              onClick={() => setBilling(t)}
              style={{
                padding: "8px 18px",
                borderRadius: 20,
                border: "1px solid",
                borderColor: billing === t ? "rgba(212,168,83,0.5)" : "rgba(255,255,255,0.08)",
                background: billing === t ? "rgba(212,168,83,0.1)" : "transparent",
                color: billing === t ? "#d4a853" : "rgba(245,240,232,0.35)",
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13, fontWeight: billing === t ? 600 : 400,
                cursor: "pointer",
                transition: "all 180ms ease",
                display: "flex", alignItems: "center", gap: 6,
              }}
            >
              {t === "operator" ? "Operator" : "Operator Pro"}
              {t === "operator" && (
                <span style={{
                  fontSize: 10, fontFamily: "Fira Code, monospace",
                  background: "rgba(74,222,128,0.15)",
                  color: "#4ADE80",
                  padding: "2px 6px", borderRadius: 10,
                  letterSpacing: "0.05em",
                }}>
                  SAVE 50%
                </span>
              )}
            </button>
          ))}
        </div>

        {/* 90-day trial note */}
        <div style={{ textAlign: "center", marginBottom: 28, padding: "12px 20px", background: "rgba(74,222,128,0.06)", border: "1px solid rgba(74,222,128,0.15)", borderRadius: 8 }}>
          <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "rgba(74,222,128,0.8)", margin: 0, lineHeight: 1.6 }}>
            <strong style={{ color: "#4ADE80" }}>90-day beta — no charge.</strong> Set up billing now, lock your founding rate. First charge at day 91.
          </p>
        </div>

        {/* Plan cards */}
        {/* Operator Pro — full-width featured card */}
        <div style={{ marginBottom: 20 }}>
          <div style={{
            position: "relative",
            background: billing === "operator_pro" ? "rgba(212,168,83,0.06)" : "rgba(255,255,255,0.02)",
            border: `1px solid ${billing === "operator_pro" ? "rgba(212,168,83,0.5)" : "rgba(255,255,255,0.08)"}`,
            borderRadius: 10,
            padding: "28px 28px",
            boxShadow: billing === "operator_pro" ? "0 0 40px rgba(212,168,83,0.08)" : "none",
            cursor: "pointer",
            transition: "all 200ms ease",
          }}
          onClick={() => setBilling("operator_pro")}
          >
            <div style={{
              position: "absolute", top: -11, left: "50%", transform: "translateX(-50%)",
              background: "#d4a853", color: "#0e0e0e",
              fontFamily: "Fira Code, monospace", fontSize: 9,
              letterSpacing: "0.12em", textTransform: "uppercase",
              padding: "3px 10px", borderRadius: 10, fontWeight: 700,
              whiteSpace: "nowrap",
            }}>Operator Pro — Full Outreach Suite</div>
            <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", flexWrap: "wrap", gap: 20 }}>
              <div style={{ flex: 1, minWidth: 200 }}>
                <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,240,232,0.35)", marginBottom: 12 }}>Operator Pro</p>
                <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
                  <span style={{ fontFamily: "Playfair Display, serif", fontSize: 38, fontWeight: 700, color: "#d4a853", lineHeight: 1 }}>$99</span>
                  <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "rgba(245,240,232,0.35)" }}>/mo</span>
                </div>
                <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: "rgba(245,240,232,0.3)", marginBottom: 16 }}>Everything in Operator House + full outreach suite</p>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "6px 20px" }}>
                  {["Client Pulse & Health Scores", "SMS Outreach", "Call Center + AI Scripts", "Email Sequences", "AI Voice Agents", "Priority support"].map(f => (
                    <div key={f} style={{ display: "flex", alignItems: "center", gap: 8 }}>
                      <div style={{ width: 5, height: 5, borderRadius: "50%", background: "#d4a853", flexShrink: 0 }} />
                      <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 12, color: "rgba(245,240,232,0.6)" }}>{f}</span>
                    </div>
                  ))}
                </div>
              </div>
              <button
                onClick={() => handleCheckout("operator_pro")}
                disabled={loading !== null}
                style={{
                  padding: "12px 28px",
                  background: loading ? "rgba(212,168,83,0.5)" : "#d4a853",
                  border: "none", borderRadius: 6,
                  color: "#0e0e0e",
                  fontFamily: "DM Sans, sans-serif",
                  fontSize: 13, fontWeight: 700,
                  cursor: loading ? "default" : "pointer",
                  boxShadow: "0 0 20px rgba(212,168,83,0.3)",
                  whiteSpace: "nowrap",
                  alignSelf: "center",
                  display: "flex", alignItems: "center", gap: 6,
                }}
              >
                {loading === "operator_pro" ? <><Loader2 size={13} className="animate-spin" /> Opening…</> : "Get Operator Pro"}
              </button>
            </div>
          </div>
        </div>
        {/* Operator House base tier — founding rates */}
        <p style={{ fontFamily: "Fira Code, monospace", fontSize: 9, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(212,168,83,0.3)", textAlign: "center", marginBottom: 12 }}>Operator House — Core Intelligence Suite</p>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16, marginBottom: 32 }}>
          {/* Monthly — $99/mo founding */}
          <div
            style={{
              position: "relative",
              background: billing === "operator_pro" ? "rgba(255,255,255,0.02)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${billing === "operator" ? "rgba(212,168,83,0.4)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 10,
              padding: "28px 24px",
              transition: "border-color 200ms ease",
              cursor: "pointer",
            }}
            onClick={() => setBilling("operator")}
          >
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,240,232,0.35)", marginBottom: 12 }}>Monthly</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontFamily: "Playfair Display, serif", fontSize: 38, fontWeight: 700, color: "#f5f0e8", lineHeight: 1 }}>$99</span>
              <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "rgba(245,240,232,0.35)" }}>/mo</span>
            </div>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: "rgba(245,240,232,0.3)", marginBottom: 4 }}>
              <span style={{ textDecoration: "line-through", color: "rgba(245,240,232,0.2)" }}>$197/mo retail</span>
            </p>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 9, color: "#4ADE80", letterSpacing: "0.1em", marginBottom: 16 }}>FOUNDING RATE · LOCKED FOR LIFE</p>
            <button
              onClick={(e) => { e.stopPropagation(); handleCheckout("operator"); }}
              disabled={loading !== null}
              style={{
                width: "100%", padding: "10px 0",
                background: billing === "operator" ? "#d4a853" : "rgba(212,168,83,0.08)",
                border: `1px solid ${billing === "operator" ? "transparent" : "rgba(212,168,83,0.2)"}`,
                borderRadius: 6,
                color: billing === "operator" ? "#0e0e0e" : "#d4a853",
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13, fontWeight: 700,
                cursor: loading ? "default" : "pointer",
                transition: "all 200ms ease",
                display: "flex", alignItems: "center", justifyContent: "center", gap: 6,
              }}
            >
              {loading === "operator" ? <><Loader2 size={13} className="animate-spin" /> Opening…</> : "Get Access"}
            </button>
          </div>

          {/* Annual — $399/yr founding, recommended */}
          <div
            style={{
              position: "relative",
              background: billing === "operator" ? "rgba(212,168,83,0.06)" : "rgba(255,255,255,0.02)",
              border: `1px solid ${billing === "operator" ? "rgba(212,168,83,0.5)" : "rgba(255,255,255,0.08)"}`,
              borderRadius: 10,
              padding: "28px 24px",
              transition: "border-color 200ms ease, background 200ms ease",
              cursor: "pointer",
              boxShadow: billing === "operator" ? "0 0 40px rgba(212,168,83,0.08)" : "none",
            }}
            onClick={() => setBilling("operator")}
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
              Best Value
            </div>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,240,232,0.35)", marginBottom: 12 }}>Annual</p>
            <div style={{ display: "flex", alignItems: "baseline", gap: 4, marginBottom: 4 }}>
              <span style={{ fontFamily: "Playfair Display, serif", fontSize: 38, fontWeight: 700, color: "#d4a853", lineHeight: 1 }}>$399</span>
              <span style={{ fontFamily: "DM Sans, sans-serif", fontSize: 13, color: "rgba(245,240,232,0.35)" }}>/yr</span>
            </div>
            <p style={{ fontFamily: "DM Sans, sans-serif", fontSize: 11, color: "rgba(245,240,232,0.3)", marginBottom: 4 }}>
              <span style={{ textDecoration: "line-through", color: "rgba(245,240,232,0.2)" }}>$797/yr retail</span>
            </p>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 9, color: "#4ADE80", letterSpacing: "0.1em", marginBottom: 16 }}>FOUNDING RATE · LOCKED FOR LIFE</p>
            <button
              onClick={(e) => { e.stopPropagation(); handleCheckout("operator"); }}
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
              {loading === "operator" ? <><Loader2 size={13} className="animate-spin" /> Opening…</> : "Claim Your Seat"}
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
          Secure checkout via PayPal · Cancel anytime · No setup fees
        </p>

        {/* Specter conversion nudge */}
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, marginTop: 40 }}>
          <div style={{
            background: "rgba(18,14,10,0.92)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: 10,
            padding: "10px 16px",
            maxWidth: 280,
            fontSize: 12,
            color: "rgba(232,228,217,0.85)",
            fontStyle: "italic",
            lineHeight: 1.6,
            textAlign: "center",
            boxShadow: "0 4px 20px rgba(0,0,0,0.4)",
            position: "relative",
          }}>
            Those who move fastest win.<br />Claim your seat before the window closes.
            <div style={{ position: "absolute", bottom: -8, left: "50%", transform: "translateX(-50%)", width: 0, height: 0, borderLeft: "7px solid transparent", borderRight: "7px solid transparent", borderTop: "8px solid rgba(212,175,55,0.3)" }} />
          </div>
          {!spectreHidden && <SpectreVideoPlayer state="approval_nod" size="lg" glow />}
        </div>

        {/* Audit CTA — soft conversion for fence-sitters */}
        <div style={{
          marginTop: 48,
          paddingTop: 32,
          borderTop: "1px solid rgba(255,255,255,0.05)",
          textAlign: "center",
        }}>
          <p style={{
            fontFamily: "Fira Code, monospace",
            fontSize: 11,
            letterSpacing: "0.12em",
            textTransform: "uppercase",
            color: "rgba(245,240,232,0.2)",
            marginBottom: 10,
          }}>
            Not sure which plan fits?
          </p>
          <button
            onClick={() => setLocation("/audit")}
            style={{
              background: "none",
              border: "1px solid rgba(245,166,35,0.2)",
              borderRadius: 6,
              padding: "10px 24px",
              cursor: "pointer",
              color: "rgba(245,166,35,0.6)",
              fontFamily: "Fira Code, monospace",
              fontSize: 12,
              letterSpacing: "0.06em",
              transition: "border-color 200ms ease, color 200ms ease",
            }}
            onMouseEnter={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,166,35,0.5)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,166,35,0.9)";
            }}
            onMouseLeave={e => {
              (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(245,166,35,0.2)";
              (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,166,35,0.6)";
            }}
          >
            Book a free 15-min Specter Audit →
          </button>
          <p style={{
            marginTop: 8,
            fontSize: 11,
            color: "rgba(245,240,232,0.15)",
            fontFamily: "DM Sans, sans-serif",
          }}>
            We'll map your ops and show you exactly where Operator House fits.
          </p>
        </div>
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
