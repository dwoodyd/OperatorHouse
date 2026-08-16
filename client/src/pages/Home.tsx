/* =============================================================================
   Operator House — Public Landing Page
   Pre-login marketing page. Authenticated users are redirected to /dashboard.
   ============================================================================= */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl, getStoredAuthReturnPath } from "@/const";
import { Search, GitBranch, FileText, Archive, BarChart3, CheckSquare, ArrowRight, Zap, Shield, Brain, BookOpenCheck, Send } from "lucide-react";
import { SpectreVideoPlayer } from "@/components/SpectreVideoPlayer";
import { useSpectre } from "@/contexts/SpectreContext";

const OH_SYMBOL = "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp";

const FEATURES = [
  { icon: Search,      color: "#F5A623", name: "Lead Intelligence",    desc: "AI-powered prospect audits — intent score, pain points, and your exact next move." },
  { icon: GitBranch,   color: "#7C6FCD", name: "Client Pipeline",      desc: "Five-stage Kanban from Discovery to Closed with stale-deal alerts." },
  { icon: FileText,    color: "#3ECFCF", name: "Strategy Generator",   desc: "Bespoke consultant-grade strategies grounded in your own Vault knowledge." },
  { icon: Archive,     color: "#E8940F", name: "The Vault",            desc: "Your private knowledge base — frameworks, scripts, and pricing that feed every AI output." },
  { icon: BarChart3,   color: "#4CAF82", name: "Analytics",            desc: "Live KPIs: pipeline value, win rate, lead volume, and AI usage at a glance." },
  { icon: CheckSquare, color: "#F56565", name: "Tasks",                desc: "Priority-linked action items surfaced automatically by the Next Best Action engine." },
];

export default function Home() {
  const { isAuthenticated, loading } = useAuth();
  const { spectreHidden } = useSpectre();
  const [, setLocation] = useLocation();
  const [visible, setVisible] = useState(false);

  // Redirect authenticated users straight to dashboard
  useEffect(() => {
    if (!loading && isAuthenticated) {
      const returnPath = getStoredAuthReturnPath();
      setLocation(returnPath !== "/" ? returnPath : "/dashboard");
    }
  }, [loading, isAuthenticated, setLocation]);

  // Fade in after mount
  useEffect(() => { const t = setTimeout(() => setVisible(true), 60); return () => clearTimeout(t); }, []);

  if (loading || isAuthenticated) return null;

  return (
    <div style={{
      minHeight: "100vh",
      background: "#08080D",
      color: "#E8E4D9",
      fontFamily: "DM Sans, sans-serif",
      opacity: visible ? 1 : 0,
      transition: "opacity 500ms ease",
      overflowX: "hidden",
    }}>

      {/* ── Top nav ─────────────────────────────────────────────────────── */}
      <nav style={{
        position: "fixed", top: 0, left: 0, right: 0, zIndex: 100,
        display: "flex", alignItems: "center", justifyContent: "space-between",
        padding: "16px 32px",
        background: "rgba(8,8,13,0.85)",
        backdropFilter: "blur(12px)",
        borderBottom: "1px solid rgba(245,166,35,0.1)",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
          <img src={OH_SYMBOL} alt="OH" style={{ width: "32px", height: "32px", objectFit: "contain" }} />
          <span style={{ fontFamily: "Playfair Display, serif", fontSize: "16px", fontWeight: 700, color: "#E8E4D9" }}>
            Operator House
          </span>
        </div>
        <a
          href={getLoginUrl()}
          style={{
            padding: "8px 20px",
            background: "linear-gradient(135deg, #F5A623 0%, #E8940F 100%)",
            borderRadius: "6px",
            color: "#0A0A0B",
            fontSize: "13px",
            fontWeight: 700,
            textDecoration: "none",
            letterSpacing: "0.02em",
          }}
        >
          Sign In →
        </a>
      </nav>

      {/* ── Hero ────────────────────────────────────────────────────────── */}
      <section style={{
        minHeight: "100vh",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        textAlign: "center",
        padding: "120px 24px 80px",
        position: "relative",
      }}>
        {/* Ambient glow */}
        <div style={{
          position: "absolute", top: "20%", left: "50%", transform: "translateX(-50%)",
          width: "600px", height: "400px",
          background: "radial-gradient(ellipse, rgba(245,166,35,0.07) 0%, transparent 70%)",
          pointerEvents: "none",
        }} />

        {/* Specter — welcoming, right side of hero, fades in with page */}
        <div style={{
          position: "absolute",
          right: "clamp(0px, 4vw, 60px)",
          bottom: 0,
          zIndex: 1,
          pointerEvents: "none",
          opacity: visible ? 0.9 : 0,
          transition: "opacity 1.4s ease 0.6s",
        }}>
          {!spectreHidden && <SpectreVideoPlayer state="happy_greeting" size="2xl" glow />}
        </div>

        <img src={OH_SYMBOL} alt="Operator House" style={{ width: "88px", height: "88px", objectFit: "contain", marginBottom: "28px", position: "relative" }} />

        <div style={{
          fontFamily: "Fira Code, monospace", fontSize: "10px",
          letterSpacing: "0.3em", textTransform: "uppercase",
          color: "rgba(245,166,35,0.6)", marginBottom: "20px",
        }}>
          Your Specter HQ
        </div>

        <h1 style={{
          fontFamily: "Playfair Display, serif",
          fontSize: "clamp(36px, 6vw, 72px)",
          fontWeight: 700,
          lineHeight: 1.1,
          marginBottom: "24px",
          maxWidth: "800px",
          position: "relative",
        }}>
          Run your practice like{" "}
          <span style={{ color: "#F5A623" }}>a Specter operator.</span>
        </h1>

        <p style={{
          fontSize: "clamp(15px, 2vw, 18px)",
          color: "rgba(232,228,217,0.65)",
          lineHeight: 1.7,
          maxWidth: "560px",
          marginBottom: "40px",
          position: "relative",
        }}>
          Operator House is an AI command center for independent consultants and fractional operators.
          Lead intelligence, pipeline management, and strategy generation — all in one workspace.
        </p>

        <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", justifyContent: "center", position: "relative" }}>
          <a
            href="/apply"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "14px 28px",
              background: "linear-gradient(135deg, #F5A623 0%, #E8940F 100%)",
              borderRadius: "6px",
              color: "#0A0A0B",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
              letterSpacing: "0.02em",
            }}
          >
            Apply for Access <ArrowRight size={15} />
          </a>
          <button
            onClick={() => setLocation("/about")}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "14px 28px",
              background: "transparent",
              border: "1px solid rgba(245,166,35,0.3)",
              borderRadius: "6px",
              color: "rgba(245,166,35,0.85)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            See the modules
          </button>
          <button
            onClick={() => setLocation("/pricing")}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "14px 28px",
              background: "transparent",
              border: "1px solid rgba(255,255,255,0.1)",
              borderRadius: "6px",
              color: "rgba(232,228,217,0.45)",
              fontSize: "14px",
              fontWeight: 500,
              cursor: "pointer",
            }}
          >
            Pricing
          </button>
          <button
            onClick={() => setLocation("/audit")}
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "14px 28px",
              background: "transparent",
              border: "1px solid rgba(245,166,35,0.18)",
              borderRadius: "6px",
              color: "rgba(245,166,35,0.6)",
              fontSize: "13px",
              fontWeight: 500,
              cursor: "pointer",
              fontFamily: "Fira Code, monospace",
              letterSpacing: "0.02em",
            }}
          >
            Book Free Audit
          </button>
        </div>

        {/* Trust badges */}
        <div style={{ display: "flex", gap: "24px", marginTop: "48px", flexWrap: "wrap", justifyContent: "center" }}>
          {[{ icon: Zap, label: "AI-Powered" }, { icon: Shield, label: "Private Workspace" }, { icon: Brain, label: "Vault-Grounded" }].map(({ icon: Icon, label }) => (
            <div key={label} style={{ display: "flex", alignItems: "center", gap: "6px" }}>
              <Icon size={13} style={{ color: "#F5A623" }} />
              <span style={{ fontSize: "12px", color: "rgba(232,228,217,0.45)", fontFamily: "Fira Code, monospace", letterSpacing: "0.08em" }}>{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* ── Trust & control ─────────────────────────────────────────────── */}
      <section style={{ padding: "0 24px 80px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ borderTop: "1px solid rgba(255,255,255,0.06)", borderBottom: "1px solid rgba(255,255,255,0.06)", padding: "clamp(28px, 5vw, 48px) 0" }}>
          <div style={{ display: "flex", alignItems: "end", justifyContent: "space-between", gap: 24, flexWrap: "wrap", marginBottom: 28 }}>
            <div>
              <div style={{ fontFamily: "Fira Code, monospace", fontSize: 10, letterSpacing: "0.22em", textTransform: "uppercase", color: "rgba(245,166,35,0.55)", marginBottom: 10 }}>Built for client work</div>
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(22px, 3vw, 32px)", color: "#E8E4D9", margin: 0 }}>Trust should be visible in the workflow.</h2>
            </div>
            <button onClick={() => setLocation("/privacy")} style={{ background: "transparent", border: "1px solid rgba(245,166,35,0.28)", color: "rgba(245,166,35,0.85)", borderRadius: 6, padding: "10px 14px", cursor: "pointer", fontFamily: "Fira Code, monospace", fontSize: 11, letterSpacing: "0.05em" }}>
              Read privacy & data handling →
            </button>
          </div>
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(230px, 1fr))", gap: 16 }}>
            {[
              { icon: Shield, title: "Authenticated workspace", body: "Your Vault, client records, and operating history live inside your signed-in Operator House workspace." },
              { icon: BookOpenCheck, title: "Visible grounding", body: "Strategy output surfaces the Vault sources Specter used, so recommendations are inspectable rather than black-box." },
              { icon: Send, title: "Human-controlled outreach", body: "You decide when to activate a sequence, enroll a contact, and send a message. Automation supports your judgment." },
            ].map(({ icon: Icon, title, body }) => (
              <article key={title} style={{ padding: 20, background: "rgba(255,255,255,0.018)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: 8 }}>
                <Icon size={16} style={{ color: "#F5A623", marginBottom: 14 }} aria-hidden="true" />
                <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: 16, color: "#E8E4D9", margin: "0 0 8px" }}>{title}</h3>
                <p style={{ fontSize: 13, lineHeight: 1.65, color: "rgba(232,228,217,0.55)", margin: 0 }}>{body}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      {/* ── Six Features ────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px", maxWidth: "1100px", margin: "0 auto" }}>
        <div style={{ textAlign: "center", marginBottom: "48px" }}>
          <div style={{ fontFamily: "Fira Code, monospace", fontSize: "10px", letterSpacing: "0.28em", textTransform: "uppercase", color: "rgba(245,166,35,0.5)", marginBottom: "12px" }}>
            Six Modules
          </div>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(24px, 3.5vw, 36px)", fontWeight: 700, color: "#E8E4D9" }}>
            One intelligent workspace.
          </h2>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(300px, 1fr))", gap: "16px" }}>
          {FEATURES.map((f) => (
            <div
              key={f.name}
              style={{
                padding: "24px",
                background: "rgba(255,255,255,0.02)",
                border: "1px solid rgba(255,255,255,0.06)",
                borderLeft: `3px solid ${f.color}`,
                borderRadius: "8px",
                transition: "background 200ms",
              }}
              onMouseEnter={e => (e.currentTarget.style.background = "rgba(255,255,255,0.04)")}
              onMouseLeave={e => (e.currentTarget.style.background = "rgba(255,255,255,0.02)")}
            >
              <div style={{
                width: "36px", height: "36px", borderRadius: "8px",
                background: `${f.color}15`, border: `1px solid ${f.color}30`,
                display: "flex", alignItems: "center", justifyContent: "center",
                marginBottom: "14px",
              }}>
                <f.icon size={16} style={{ color: f.color }} />
              </div>
              <h3 style={{ fontFamily: "Playfair Display, serif", fontSize: "16px", fontWeight: 700, color: "#E8E4D9", marginBottom: "8px" }}>{f.name}</h3>
              <p style={{ fontSize: "13px", color: "rgba(232,228,217,0.55)", lineHeight: 1.65 }}>{f.desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* ── Final CTA ───────────────────────────────────────────────────── */}
      <section style={{ padding: "80px 24px 120px", textAlign: "center" }}>
        <div style={{
          maxWidth: "600px", margin: "0 auto",
          padding: "48px 40px",
          background: "rgba(245,166,35,0.04)",
          border: "1px solid rgba(245,166,35,0.15)",
          borderRadius: "12px",
        }}>
          <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(22px, 3vw, 30px)", fontWeight: 700, color: "#E8E4D9", marginBottom: "12px" }}>
            Founding cohort. 25 seats.
          </h2>
          <p style={{ fontSize: "14px", color: "rgba(232,228,217,0.55)", marginBottom: "28px", lineHeight: 1.65 }}>
            Applications are reviewed personally. If you’re selected, you’ll receive an invite code within 48 hours.
          </p>
          <a
            href="/apply"
            style={{
              display: "inline-flex", alignItems: "center", gap: "8px",
              padding: "14px 32px",
              background: "linear-gradient(135deg, #F5A623 0%, #E8940F 100%)",
              borderRadius: "6px",
              color: "#0A0A0B",
              fontSize: "14px",
              fontWeight: 700,
              textDecoration: "none",
            }}
          >
            Apply for Access <ArrowRight size={15} />
          </a>
          <div style={{ marginTop: "16px" }}>
            <button
              onClick={() => setLocation("/audit")}
              style={{
                background: "none", border: "none", cursor: "pointer",
                fontSize: "12px",
                color: "rgba(245,166,35,0.5)",
                fontFamily: "Fira Code, monospace",
                letterSpacing: "0.06em",
                textDecoration: "underline",
                textUnderlineOffset: "3px",
              }}
            >
              Not ready? Book a free 15-min Specter Audit first →
            </button>
          </div>
        </div>
      </section>

      {/* ── Footer ──────────────────────────────────────────────────────── */}
      <footer style={{
        borderTop: "1px solid rgba(255,255,255,0.05)",
        padding: "24px 32px",
        display: "flex", alignItems: "center", justifyContent: "space-between", flexWrap: "wrap", gap: "12px",
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <img src={OH_SYMBOL} alt="OH" style={{ width: "20px", height: "20px", objectFit: "contain", opacity: 0.6 }} />
          <span style={{ fontSize: "12px", color: "rgba(232,228,217,0.3)", fontFamily: "Fira Code, monospace" }}>
            Operator House © {new Date().getFullYear()}
          </span>
        </div>
        <div style={{ display: "flex", gap: "16px" }}>
          <button onClick={() => setLocation("/about")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "rgba(232,228,217,0.3)", fontFamily: "Fira Code, monospace" }}>About & Features</button>
          <button onClick={() => setLocation("/pricing")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "rgba(232,228,217,0.3)", fontFamily: "Fira Code, monospace" }}>Pricing</button>
          <button onClick={() => setLocation("/privacy")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "rgba(232,228,217,0.3)", fontFamily: "Fira Code, monospace" }}>Privacy</button>
          <button onClick={() => setLocation("/terms")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "rgba(232,228,217,0.3)", fontFamily: "Fira Code, monospace" }}>Terms</button>
          <button onClick={() => setLocation("/audit")} style={{ background: "none", border: "none", cursor: "pointer", fontSize: "12px", color: "rgba(245,166,35,0.35)", fontFamily: "Fira Code, monospace" }}>Book Audit</button>
        </div>
      </footer>
    </div>
  );
}
