/* =============================================================================
   Operator House — About & Features Page
   Six module deep-dives + How It Works three-step flow
   ============================================================================= */
import { useLocation } from "wouter";
import {
  Search, GitBranch, FileText, Archive, BarChart3, CheckSquare,
  ArrowRight, Zap, Shield, Brain, ChevronRight,
} from "lucide-react";
import AppLayout from "@/components/AppLayout";

/* ── Module data ─────────────────────────────────────────────────────────── */
const MODULES = [
  {
    icon: Search,
    number: "01",
    name: "Lead Intelligence",
    tagline: "AI-powered prospect audits in seconds.",
    color: "#F5A623",
    description:
      "Paste a prospect's name, company, and URL. Specter's AI engine runs a full Specter audit — scoring intent, surfacing pain points, mapping decision-maker dynamics, and recommending your exact next move. Every analysis is saved to your lead history and can be pushed directly into your pipeline with one click.",
    capabilities: [
      "Intent scoring (0–100) with reasoning",
      "Pain point extraction from public signals",
      "Decision-maker mapping",
      "Next Beat recommendation",
      "One-click Push to Pipeline",
    ],
  },
  {
    icon: GitBranch,
    number: "02",
    name: "Client Pipeline",
    tagline: "Visual deal flow from Discovery to Closed.",
    color: "#7C6FCD",
    description:
      "A Kanban-style pipeline with five stages: Discovery, Analysis, Strategy, Proposal, and Closed. Drag deals between stages, track deal value, and get automatic stale-deal alerts when a prospect goes quiet for more than seven days. Every deal links back to its originating lead audit and generated strategy.",
    capabilities: [
      "Five-stage Kanban pipeline",
      "Deal value tracking and pipeline total",
      "Stale-deal detection (7-day inactivity flag)",
      "Linked lead audit and strategy per deal",
      "Activity log per deal",
    ],
  },
  {
    icon: FileText,
    number: "03",
    name: "Strategy Generator",
    tagline: "Bespoke client strategies written by AI.",
    color: "#3ECFCF",
    description:
      "Select a client and deal, choose a strategy type (Outreach, Proposal, Retention, or Custom), and the AI generates a full consultant-grade strategy document grounded in your Vault context. Each strategy cites the vault items it drew from, so you always know what intelligence informed the output.",
    capabilities: [
      "Four strategy types: Outreach, Proposal, Retention, Custom",
      "Grounded in your Vault knowledge base",
      "Vault citation references in every output",
      "Saved to strategy history per client",
      "Markdown-rendered, copy-ready output",
    ],
  },
  {
    icon: Archive,
    number: "04",
    name: "The Vault",
    tagline: "Your private knowledge base for every engagement.",
    color: "#E8940F",
    description:
      "Store case studies, frameworks, pricing templates, objection scripts, and any intelligence that makes your work better. The Vault feeds directly into Lead Intelligence and Strategy Generator — the AI reads your vault context before every analysis, so your outputs reflect your actual methodology, not generic advice.",
    capabilities: [
      "Unlimited vault items with category tagging",
      "Full-text search across all items",
      "Automatic injection into AI context",
      "Supports case studies, frameworks, scripts, pricing",
      "Filterable by category",
    ],
  },
  {
    icon: BarChart3,
    number: "05",
    name: "Analytics",
    tagline: "Real-time visibility into your operator metrics.",
    color: "#4CAF82",
    description:
      "A live dashboard of your key performance indicators: total leads analyzed, strategies generated, pipeline value, win rate, and AI usage over time. Spot which lead sources convert, which strategy types close fastest, and where deals are stalling — all from a single screen.",
    capabilities: [
      "Pipeline value and deal count by stage",
      "Lead analysis volume over time",
      "Strategy generation metrics",
      "Win rate tracking",
      "AI call usage summary",
    ],
  },
  {
    icon: CheckSquare,
    number: "06",
    name: "Tasks",
    tagline: "Prioritized action items tied to your pipeline.",
    color: "#F56565",
    description:
      "A lightweight task manager built for operators who move fast. Create tasks with priority levels (Critical, High, Medium, Low), link them to clients or deals, and track completion. The Command Center's Next Best Action engine surfaces your highest-priority open tasks automatically so nothing falls through the cracks.",
    capabilities: [
      "Four priority levels with color coding",
      "Optimistic updates for instant feedback",
      "Linked to clients and pipeline deals",
      "Surfaced in Next Best Action engine",
      "Completion tracking with history",
    ],
  },
];

/* ── How It Works steps ──────────────────────────────────────────────────── */
const STEPS = [
  {
    step: "01",
    icon: Archive,
    title: "Build Your Vault",
    description:
      "Start by loading The Vault with your best frameworks, case studies, pricing logic, and objection scripts. This is the intelligence layer that makes every AI output specific to your practice — not generic.",
  },
  {
    step: "02",
    icon: Search,
    title: "Analyze & Qualify Leads",
    description:
      "When a new prospect appears, run a Lead Intelligence audit. The AI scores their intent, surfaces pain points, and tells you exactly how to open the conversation. High-scoring leads get pushed to your pipeline in one click.",
  },
  {
    step: "03",
    icon: Brain,
    title: "Generate & Close",
    description:
      "As deals move through your pipeline, generate bespoke strategies for each stage. The AI draws from your Vault and the lead audit to write proposals, outreach sequences, and retention plans that sound like you — because they're built from your own intelligence.",
  },
];

/* ── Component ───────────────────────────────────────────────────────────── */
export default function About() {
  const [, setLocation] = useLocation();

  return (
    <AppLayout title="About & Features" subtitle="Everything Operator House does for you">
      <div style={{ maxWidth: "960px", margin: "0 auto", padding: "40px 24px 80px" }}>

        {/* ── Hero ─────────────────────────────────────────────────────── */}
        <div
          className="glass-panel fade-in-up"
          style={{
            padding: "48px 40px",
            marginBottom: "48px",
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(245,166,35,0.06) 0%, rgba(14,14,22,0.8) 60%)",
            border: "1px solid rgba(245,166,35,0.2)",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* Background glow */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "radial-gradient(ellipse 60% 40% at 50% 0%, rgba(245,166,35,0.08) 0%, transparent 70%)",
          }} />

          <img
            src="https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp"
            alt="Operator House"
            style={{ width: "72px", height: "72px", objectFit: "contain", margin: "0 auto 20px", display: "block", position: "relative" }}
          />
          <h1
            className="text-amber-gradient"
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "clamp(28px, 4vw, 40px)",
              fontWeight: 700,
              lineHeight: 1.2,
              marginBottom: "16px",
              position: "relative",
            }}
          >
            Your Operator House
          </h1>
          <p style={{
            fontSize: "16px",
            color: "var(--text-secondary)",
            lineHeight: 1.7,
            maxWidth: "600px",
            margin: "0 auto 28px",
            position: "relative",
          }}>
            Operator House is an AI-powered command center for independent consultants and fractional operators.
            It replaces the scattered stack of CRMs, docs, and spreadsheets with a single intelligent workspace
            that thinks like your best associate.
          </p>
          <div className="flex items-center justify-center gap-3" style={{ flexWrap: "wrap" }}>
            {[
              { icon: Zap, label: "AI-Powered" },
              { icon: Shield, label: "Private & Secure" },
              { icon: Brain, label: "Context-Aware" },
            ].map(({ icon: Icon, label }) => (
              <div
                key={label}
                className="flex items-center gap-2"
                style={{
                  padding: "6px 14px",
                  background: "rgba(245,166,35,0.07)",
                  border: "1px solid rgba(245,166,35,0.18)",
                  borderRadius: "20px",
                }}
              >
                <Icon size={12} style={{ color: "var(--amber)" }} />
                <span style={{ fontSize: "12px", color: "var(--amber)", fontFamily: "Fira Code, monospace", letterSpacing: "0.08em" }}>
                  {label}
                </span>
              </div>
            ))}
          </div>
        </div>

        {/* ── How It Works ─────────────────────────────────────────────── */}
        <section style={{ marginBottom: "56px" }}>
          <div style={{ marginBottom: "28px" }}>
            <div className="data-label" style={{ marginBottom: "8px" }}>THE SYSTEM</div>
            <h2 style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "clamp(22px, 3vw, 28px)",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}>
              How It Works
            </h2>
          </div>

          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: "16px" }}>
            {STEPS.map((s, i) => (
              <div
                key={s.step}
                className="glass-panel fade-in-up"
                style={{
                  padding: "28px 24px",
                  animationDelay: `${i * 80}ms`,
                  position: "relative",
                  overflow: "hidden",
                }}
              >
                {/* Step number watermark */}
                <div style={{
                  position: "absolute", top: "12px", right: "16px",
                  fontFamily: "Playfair Display, serif",
                  fontSize: "56px", fontWeight: 700, lineHeight: 1,
                  color: "rgba(245,166,35,0.06)",
                  pointerEvents: "none",
                }}>
                  {s.step}
                </div>

                <div
                  className="flex items-center justify-center"
                  style={{
                    width: "40px", height: "40px", borderRadius: "10px",
                    background: "rgba(245,166,35,0.1)",
                    border: "1px solid rgba(245,166,35,0.2)",
                    marginBottom: "16px",
                  }}
                >
                  <s.icon size={18} style={{ color: "var(--amber)" }} />
                </div>

                <div className="data-label" style={{ marginBottom: "6px", color: "rgba(245,166,35,0.6)" }}>
                  STEP {s.step}
                </div>
                <h3 style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "17px", fontWeight: 700,
                  color: "var(--text-primary)", marginBottom: "10px",
                }}>
                  {s.title}
                </h3>
                <p style={{ fontSize: "13px", color: "var(--text-secondary)", lineHeight: 1.65 }}>
                  {s.description}
                </p>

                {/* Connector arrow — not on last */}
                {i < STEPS.length - 1 && (
                  <div style={{
                    position: "absolute", right: "-8px", top: "50%",
                    transform: "translateY(-50%)",
                    zIndex: 2,
                    display: "none", // hidden on mobile, shown via grid gap
                  }} />
                )}
              </div>
            ))}
          </div>
        </section>

        {/* ── Six Modules ──────────────────────────────────────────────── */}
        <section>
          <div style={{ marginBottom: "28px" }}>
            <div className="data-label" style={{ marginBottom: "8px" }}>THE MODULES</div>
            <h2 style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "clamp(22px, 3vw, 28px)",
              fontWeight: 700,
              color: "var(--text-primary)",
            }}>
              Six Tools. One Workspace.
            </h2>
          </div>

          <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
            {MODULES.map((mod, i) => (
              <div
                key={mod.number}
                className="glass-panel fade-in-up"
                style={{
                  padding: "28px 28px 28px 24px",
                  animationDelay: `${i * 60}ms`,
                  borderLeft: `3px solid ${mod.color}`,
                  display: "grid",
                  gridTemplateColumns: "1fr auto",
                  gap: "24px",
                  alignItems: "start",
                }}
              >
                <div>
                  {/* Header */}
                  <div className="flex items-center gap-3" style={{ marginBottom: "10px" }}>
                    <div
                      className="flex items-center justify-center flex-shrink-0"
                      style={{
                        width: "36px", height: "36px", borderRadius: "8px",
                        background: `${mod.color}15`,
                        border: `1px solid ${mod.color}30`,
                      }}
                    >
                      <mod.icon size={16} style={{ color: mod.color }} />
                    </div>
                    <div>
                      <div style={{
                        fontFamily: "Fira Code, monospace", fontSize: "9px",
                        letterSpacing: "0.18em", textTransform: "uppercase",
                        color: mod.color, opacity: 0.7, marginBottom: "2px",
                      }}>
                        MODULE {mod.number}
                      </div>
                      <h3 style={{
                        fontFamily: "Playfair Display, serif",
                        fontSize: "18px", fontWeight: 700,
                        color: "var(--text-primary)", lineHeight: 1.2,
                      }}>
                        {mod.name}
                      </h3>
                    </div>
                  </div>

                  {/* Tagline */}
                  <p style={{
                    fontSize: "13px", fontWeight: 500,
                    color: mod.color, marginBottom: "10px",
                    fontFamily: "DM Sans, sans-serif",
                  }}>
                    {mod.tagline}
                  </p>

                  {/* Description */}
                  <p style={{
                    fontSize: "13px", color: "var(--text-secondary)",
                    lineHeight: 1.7, marginBottom: "16px",
                    maxWidth: "580px",
                  }}>
                    {mod.description}
                  </p>

                  {/* Capability list */}
                  <ul style={{ listStyle: "none", padding: 0, margin: 0, display: "flex", flexDirection: "column", gap: "5px" }}>
                    {mod.capabilities.map((cap) => (
                      <li key={cap} className="flex items-center gap-2">
                        <ChevronRight size={11} style={{ color: mod.color, flexShrink: 0 }} />
                        <span style={{ fontSize: "12px", color: "var(--text-secondary)" }}>{cap}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                {/* Module number watermark */}
                <div style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "64px", fontWeight: 700, lineHeight: 1,
                  color: `${mod.color}08`,
                  userSelect: "none",
                  alignSelf: "center",
                  flexShrink: 0,
                }}>
                  {mod.number}
                </div>
              </div>
            ))}
          </div>
        </section>

        {/* ── CTA ──────────────────────────────────────────────────────── */}
        <div
          className="glass-panel fade-in-up"
          style={{
            marginTop: "48px",
            padding: "40px",
            textAlign: "center",
            background: "linear-gradient(135deg, rgba(245,166,35,0.05) 0%, rgba(14,14,22,0.8) 100%)",
            border: "1px solid rgba(245,166,35,0.18)",
          }}
        >
          <h3 style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "22px", fontWeight: 700,
            color: "var(--text-primary)", marginBottom: "10px",
          }}>
            Ready to run your practice like a Specter operator?
          </h3>
          <p style={{ fontSize: "14px", color: "var(--text-secondary)", marginBottom: "24px" }}>
            Start with The Vault — load your best frameworks and the AI does the rest.
          </p>
          <div className="flex items-center justify-center gap-3" style={{ flexWrap: "wrap" }}>
            <button
              onClick={() => setLocation("/vault")}
              className="flex items-center gap-2"
              style={{
                padding: "10px 22px",
                background: "linear-gradient(135deg, var(--amber) 0%, #E8940F 100%)",
                border: "none",
                borderRadius: "6px",
                color: "#0A0A0B",
                fontSize: "13px",
                fontWeight: 700,
                fontFamily: "DM Sans, sans-serif",
                cursor: "pointer",
                letterSpacing: "0.02em",
              }}
            >
              <Archive size={14} />
              Open The Vault
            </button>
            <button
              onClick={() => setLocation("/leads")}
              className="flex items-center gap-2"
              style={{
                padding: "10px 22px",
                background: "transparent",
                border: "1px solid var(--border-amber)",
                borderRadius: "6px",
                color: "var(--amber)",
                fontSize: "13px",
                fontWeight: 500,
                fontFamily: "DM Sans, sans-serif",
                cursor: "pointer",
              }}
            >
              <Search size={14} />
              Analyze a Lead
              <ArrowRight size={13} />
            </button>
          </div>
        </div>

      </div>
    </AppLayout>
  );
}
