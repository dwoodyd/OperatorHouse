/* =============================================================================
   Operator House — Cinematic Onboarding Walkthrough
   3 fullscreen cards. Two-phase animation: exit completes before content swaps.
   Last card (card 3) has no auto-advance and a slower enter animation.
   Gated by sessionStorage flag 'oh_onboarding_shown' — first login only.
   ============================================================================= */
import { useState, useEffect, useCallback, useRef } from "react";
import { ArrowRight, ArrowLeft, X } from "lucide-react";
import { trpc } from "@/lib/trpc";

const OH_SYMBOL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp";

interface OnboardingFlowProps {
  onComplete: () => void;
  /** When true, skips the server-side onboarding.complete mutation (used for replay) */
  isReplay?: boolean;
}

/* ── Abstract SVG visuals ───────────────────────────────────────────────────── */

function DoorVisual() {
  return (
    <svg viewBox="0 0 320 260" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <ellipse cx="160" cy="210" rx="140" ry="18" fill="rgba(245,166,35,0.04)" />
      <rect x="95" y="48" width="130" height="170" rx="2" stroke="rgba(245,166,35,0.18)" strokeWidth="1.5" fill="rgba(245,166,35,0.03)" />
      <path d="M95 48 L95 218 L175 200 L175 66 Z" fill="rgba(245,166,35,0.06)" stroke="rgba(245,166,35,0.25)" strokeWidth="1.2" />
      <line x1="95" y1="48" x2="175" y2="66" stroke="rgba(245,166,35,0.5)" strokeWidth="1.5" strokeLinecap="round" />
      <path d="M95 48 L40 30 L40 230 L95 218 Z" fill="rgba(245,166,35,0.035)" />
      <line x1="60" y1="218" x2="240" y2="218" stroke="rgba(245,166,35,0.12)" strokeWidth="1" />
      <circle cx="168" cy="138" r="4" fill="rgba(245,166,35,0.4)" />
      <circle cx="168" cy="138" r="6" stroke="rgba(245,166,35,0.2)" strokeWidth="1" fill="none" />
      <ellipse cx="68" cy="130" rx="30" ry="60" fill="rgba(245,166,35,0.04)" />
    </svg>
  );
}

function PipelineVisual() {
  const stages = ["Discovery", "Analysis", "Strategy", "Proposal", "Closed"];
  const colors = ["#6B7280", "#F5A623", "#F59E0B", "#4ADE80", "#22C55E"];
  const counts = [3, 2, 2, 1, 1];
  return (
    <svg viewBox="0 0 340 240" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      {stages.map((stage, i) => {
        const x = 20 + i * 64;
        const color = colors[i];
        const count = counts[i];
        return (
          <g key={stage}>
            <rect x={x} y={20} width={56} height={18} rx="3" fill={`${color}18`} stroke={`${color}30`} strokeWidth="1" />
            <text x={x + 28} y={32} textAnchor="middle" fill={color} fontSize="7" fontFamily="Fira Code, monospace" letterSpacing="0.05em">
              {stage.toUpperCase()}
            </text>
            {Array.from({ length: count }).map((_, j) => (
              <g key={j}>
                <rect x={x + 2} y={46 + j * 38} width={52} height={30} rx="3" fill={`${color}08`} stroke={`${color}20`} strokeWidth="1" />
                <rect x={x + 8} y={52 + j * 38} width={28} height={5} rx="2" fill={`${color}30`} />
                <rect x={x + 8} y={61 + j * 38} width={20} height={4} rx="2" fill={`${color}18`} />
              </g>
            ))}
            {i < stages.length - 1 && (
              <path d={`M${x + 58} 130 L${x + 64} 130`} stroke="rgba(245,166,35,0.15)" strokeWidth="1" markerEnd="url(#arr)" />
            )}
          </g>
        );
      })}
      <defs>
        <marker id="arr" markerWidth="4" markerHeight="4" refX="2" refY="2" orient="auto">
          <path d="M0 0 L4 2 L0 4 Z" fill="rgba(245,166,35,0.3)" />
        </marker>
      </defs>
      <line x1="20" y1="220" x2="320" y2="220" stroke="rgba(245,166,35,0.08)" strokeWidth="1" />
    </svg>
  );
}

function CommandVisual() {
  const lines = [
    { prompt: "> ", cmd: "analyze lead acme-corp", color: "rgba(245,166,35,0.9)" },
    { prompt: "  ", cmd: "Running Operator Audit…", color: "rgba(245,166,35,0.35)", italic: true },
    { prompt: "  ", cmd: "Intent score: 87 · Stage: Proposal", color: "rgba(74,222,128,0.7)" },
    { prompt: "> ", cmd: "generate strategy Q3-retainer", color: "rgba(245,166,35,0.9)" },
    { prompt: "  ", cmd: "Drafting engagement playbook…", color: "rgba(245,166,35,0.35)", italic: true },
    { prompt: "  ", cmd: "Strategy ready · 4 sections", color: "rgba(96,165,250,0.7)" },
    { prompt: "> ", cmd: "briefing today", color: "rgba(245,166,35,0.9)" },
    { prompt: "  ", cmd: "3 clients · 2 proposals · 1 stale deal", color: "rgba(245,166,35,0.55)" },
  ];
  return (
    <svg viewBox="0 0 340 230" fill="none" xmlns="http://www.w3.org/2000/svg" style={{ width: "100%", height: "100%" }}>
      <rect x="20" y="16" width="300" height="198" rx="6" fill="rgba(8,8,13,0.85)" stroke="rgba(245,166,35,0.15)" strokeWidth="1" />
      <rect x="20" y="16" width="300" height="24" rx="6" fill="rgba(245,166,35,0.06)" />
      <rect x="20" y="28" width="300" height="12" fill="rgba(245,166,35,0.06)" />
      <circle cx="36" cy="28" r="4" fill="rgba(255,100,100,0.4)" />
      <circle cx="50" cy="28" r="4" fill="rgba(255,200,50,0.4)" />
      <circle cx="64" cy="28" r="4" fill="rgba(74,222,128,0.4)" />
      <text x="160" y="32" textAnchor="middle" fill="rgba(245,166,35,0.3)" fontSize="7" fontFamily="Fira Code, monospace">operator — cmd</text>
      {lines.map((line, i) => (
        <text key={i} x="30" y={58 + i * 19} fill={line.color} fontSize="8.5" fontFamily="Fira Code, monospace"
          fontStyle={(line as { italic?: boolean }).italic ? "italic" : "normal"}>
          {line.prompt}{line.cmd}
        </text>
      ))}
      <rect x="30" y="207" width="7" height="10" rx="1" fill="rgba(245,166,35,0.7)">
        <animate attributeName="opacity" values="1;0;1" dur="1.2s" repeatCount="indefinite" />
      </rect>
    </svg>
  );
}

/* ── Card data ──────────────────────────────────────────────────────────────── */
const CARDS = [
  {
    visual: DoorVisual,
    headline: "You run the practice.",
    headlineAccent: "We run the prep.",
    copy: "Lead research, strategy, and client briefings — handled autonomously before you arrive.",
    accent: "#d4a853",
  },
  {
    visual: PipelineVisual,
    headline: "Every client. Every stage.",
    headlineAccent: "One room.",
    copy: "Your pipeline, vault, and next moves — always in view, always in context.",
    accent: "#4ADE80",
  },
  {
    visual: CommandVisual,
    headline: "One command.",
    headlineAccent: "Any answer.",
    copy: "Ask anything about your clients, deals, or strategy. Get a briefing in seconds.",
    accent: "#60A5FA",
  },
];

/* ── Timing constants ───────────────────────────────────────────────────────── */
// User-triggered slide: fast and responsive
const USER_EXIT_MS = 280;
const USER_ENTER_MS = 380;
// Last card enters slower — more to absorb
const LAST_CARD_ENTER_MS = 700;
// Auto/finish fade: slow and cinematic
const AUTO_FADE_MS = 700;
// Auto-advance idle time (only on cards 0 and 1 — card 2 never auto-advances)
const AUTO_ADVANCE_MS = 9000;

/* ── Component ──────────────────────────────────────────────────────────────── */
export default function OnboardingFlow({ onComplete, isReplay = false }: OnboardingFlowProps) {
  const completeOnboarding = trpc.onboarding.complete.useMutation();

  // `displayCard` = what is currently rendered in the DOM (never changes mid-animation)
  // `phase` = "idle" | "exiting" | "entering"
  // `slideDir` = which direction the exit/enter moves
  const [displayCard, setDisplayCard] = useState(0);
  const [phase, setPhase] = useState<"idle" | "exiting" | "entering">("idle");
  const [slideDir, setSlideDir] = useState<"left" | "right">("right");

  // Track the "logical" current card separately so nav buttons update immediately
  const logicalCard = useRef(0);

  // Overall overlay visibility
  const [visible, setVisible] = useState(false);
  const [exiting, setExiting] = useState(false);

  // Prevent double-clicks during transition
  const transitioning = useRef(false);
  // Auto-advance: pause when user hovers or interacts
  const paused = useRef(false);
  const autoTimer = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fade in on mount
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Two-phase transition: exiting → (swap content) → entering
  // Uses a local `from` snapshot so stale closure never causes wrong card
  const goTo = useCallback((next: number, dir: "left" | "right") => {
    if (transitioning.current) return;
    if (next === logicalCard.current) return;
    if (next < 0 || next >= CARDS.length) return;

    transitioning.current = true;
    logicalCard.current = next;

    setSlideDir(dir);
    setPhase("exiting");

    const isLastCard = next === CARDS.length - 1;
    const enterMs = isLastCard ? LAST_CARD_ENTER_MS : USER_ENTER_MS;

    // Phase 1: exit animation plays
    setTimeout(() => {
      // Swap content — invisible at this point (opacity:0 from exit anim)
      setDisplayCard(next);
      setPhase("entering");

      // Phase 2: enter animation plays
      setTimeout(() => {
        setPhase("idle");
        transitioning.current = false;
      }, enterMs);
    }, USER_EXIT_MS);
  }, []);

  const next = () => {
    const cur = logicalCard.current;
    if (cur < CARDS.length - 1) goTo(cur + 1, "right");
  };
  const prev = () => {
    const cur = logicalCard.current;
    if (cur > 0) goTo(cur - 1, "left");
  };

  // Auto-advance after idle — only on cards 0 and 1, never on last card
  const scheduleAutoAdvance = useCallback(() => {
    if (autoTimer.current) clearTimeout(autoTimer.current);
    if (logicalCard.current >= CARDS.length - 1) return; // no auto-advance on last card
    autoTimer.current = setTimeout(() => {
      if (!paused.current && !transitioning.current && logicalCard.current < CARDS.length - 1) {
        goTo(logicalCard.current + 1, "right");
      }
    }, AUTO_ADVANCE_MS);
  }, [goTo]);

  useEffect(() => {
    scheduleAutoAdvance();
    return () => { if (autoTimer.current) clearTimeout(autoTimer.current); };
  }, [displayCard, scheduleAutoAdvance]);

  const finish = () => {
    if (exiting) return;
    setExiting(true);
    if (!isReplay) completeOnboarding.mutate();
    setTimeout(() => {
      sessionStorage.setItem("oh_onboarding_shown", "true");
      onComplete();
    }, AUTO_FADE_MS + 80);
  };

  const c = CARDS[displayCard];
  const Visual = c.visual;
  const isLastCard = displayCard === CARDS.length - 1;
  const enterMs = isLastCard ? LAST_CARD_ENTER_MS : USER_ENTER_MS;

  // Use displayCard for dot/label rendering so they stay in sync with visible content
  const shownCard = displayCard;

  return (
    <>
      {/* Inject keyframes once */}
      <style>{`
        @keyframes oh-slide-in-right {
          from { opacity: 0; transform: translateX(52px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes oh-slide-in-left {
          from { opacity: 0; transform: translateX(-52px); }
          to   { opacity: 1; transform: translateX(0); }
        }
        @keyframes oh-slide-out-left {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(-52px); }
        }
        @keyframes oh-slide-out-right {
          from { opacity: 1; transform: translateX(0); }
          to   { opacity: 0; transform: translateX(52px); }
        }
        @keyframes oh-fade-in-up {
          from { opacity: 0; transform: translateY(18px); }
          to   { opacity: 1; transform: translateY(0); }
        }
      `}</style>

      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9998,
          background: "#08080D",
          display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
          opacity: exiting ? 0 : visible ? 1 : 0,
          transition: exiting
            ? `opacity ${AUTO_FADE_MS}ms cubic-bezier(0.4,0,0.2,1)`
            : "opacity 500ms ease",
          pointerEvents: exiting ? "none" : "all",
        }}
        onMouseEnter={() => { paused.current = true; }}
        onMouseLeave={() => {
          paused.current = false;
          scheduleAutoAdvance();
        }}
      >
        {/* Skip */}
        <button
          onClick={finish}
          aria-label="Skip onboarding"
          style={{
            position: "absolute", top: 20, right: 20,
            display: "flex", alignItems: "center", gap: 6,
            padding: "6px 12px",
            background: "rgba(255,255,255,0.04)",
            border: "1px solid rgba(255,255,255,0.08)",
            borderRadius: 20,
            color: "rgba(245,240,232,0.4)",
            fontSize: 12, fontFamily: "DM Sans, sans-serif",
            cursor: "pointer",
            transition: "color 200ms ease, border-color 200ms ease",
          }}
          onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,240,232,0.8)"; }}
          onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.color = "rgba(245,240,232,0.4)"; }}
        >
          <X size={12} /> Skip
        </button>

        {/* OH symbol — stays fixed, doesn't animate with cards */}
        <div style={{ marginBottom: 24, opacity: 0.6 }}>
          <img src={OH_SYMBOL} alt="" style={{ width: 32, height: 32, objectFit: "contain" }} draggable={false} />
        </div>

        {/* Animated card content — keyed so React remounts on card change */}
        <div
          key={`card-${displayCard}`}
          style={{
            width: "100%", maxWidth: 480, padding: "0 32px", textAlign: "center",
            animation: phase === "exiting"
              ? `${slideDir === "right" ? "oh-slide-out-left" : "oh-slide-out-right"} ${USER_EXIT_MS}ms ease forwards`
              : phase === "entering"
              ? isLastCard
                ? `oh-fade-in-up ${enterMs}ms cubic-bezier(0.16,1,0.3,1) forwards`
                : `${slideDir === "right" ? "oh-slide-in-right" : "oh-slide-in-left"} ${enterMs}ms cubic-bezier(0.22,1,0.36,1) forwards`
              : "none",
          }}
        >
          {/* Visual */}
          <div style={{ width: "100%", height: 200, marginBottom: 32, display: "flex", alignItems: "center", justifyContent: "center" }}>
            <Visual />
          </div>

          {/* Headline */}
          <h2 style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "clamp(24px, 5vw, 34px)",
            fontWeight: 700,
            color: "#f5f0e8",
            lineHeight: 1.25,
            marginBottom: 6,
          }}>
            {c.headline}{" "}
            <span style={{ color: c.accent }}>{c.headlineAccent}</span>
          </h2>

          {/* Copy */}
          <p style={{
            fontFamily: "DM Sans, sans-serif",
            fontSize: 15,
            color: "rgba(245,240,232,0.55)",
            lineHeight: 1.65,
            maxWidth: 380,
            margin: "0 auto",
          }}>
            {c.copy}
          </p>
        </div>

        {/* Navigation — always visible, not animated with card */}
        <div style={{ display: "flex", alignItems: "center", gap: 20, marginTop: 40 }}>
          {/* Prev */}
          <button
            onClick={prev}
            disabled={shownCard === 0}
            aria-label="Previous"
            style={{
              width: 40, height: 40, borderRadius: "50%",
              background: "rgba(255,255,255,0.04)",
              border: "1px solid rgba(255,255,255,0.08)",
              display: "flex", alignItems: "center", justifyContent: "center",
              color: "rgba(245,240,232,0.4)",
              cursor: shownCard === 0 ? "default" : "pointer",
              opacity: shownCard === 0 ? 0.3 : 1,
              transition: "opacity 200ms ease",
            }}
          >
            <ArrowLeft size={14} />
          </button>

          {/* Progress label + Dots */}
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 8 }}>
            <span style={{
              fontFamily: "Fira Code, monospace",
              fontSize: 10,
              letterSpacing: "0.12em",
              color: "rgba(245,240,232,0.3)",
              userSelect: "none",
            }}>{shownCard + 1} / {CARDS.length}</span>
            <div style={{ display: "flex", gap: 8 }}>
              {CARDS.map((_, i) => (
                <button
                  key={i}
                  onClick={() => {
                    if (i !== logicalCard.current) goTo(i, i > logicalCard.current ? "right" : "left");
                  }}
                  aria-label={`Go to card ${i + 1}`}
                  style={{
                    width: i === shownCard ? 20 : 6,
                    height: 6, borderRadius: 3,
                    background: i === shownCard ? c.accent : "rgba(245,240,232,0.2)",
                    border: "none", cursor: "pointer",
                    transition: "width 350ms ease, background 350ms ease",
                  }}
                />
              ))}
            </div>
          </div>

          {/* Next / Enter the House */}
          {shownCard < CARDS.length - 1 ? (
            <button
              onClick={next}
              aria-label="Next"
              style={{
                width: 40, height: 40, borderRadius: "50%",
                background: "rgba(245,166,35,0.12)",
                border: "1px solid rgba(245,166,35,0.25)",
                display: "flex", alignItems: "center", justifyContent: "center",
                color: "#d4a853",
                cursor: "pointer",
                transition: "background 200ms ease",
              }}
              onMouseEnter={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,166,35,0.22)"; }}
              onMouseLeave={e => { (e.currentTarget as HTMLButtonElement).style.background = "rgba(245,166,35,0.12)"; }}
            >
              <ArrowRight size={14} />
            </button>
          ) : (
            <button
              onClick={finish}
              style={{
                display: "flex", alignItems: "center", gap: 8,
                padding: "10px 22px",
                background: "#d4a853",
                border: "none", borderRadius: 6,
                color: "#0e0e0e",
                fontFamily: "DM Sans, sans-serif",
                fontSize: 13, fontWeight: 700,
                cursor: "pointer",
                boxShadow: "0 0 24px rgba(212,168,83,0.35)",
                transition: "box-shadow 200ms ease, transform 200ms ease",
              }}
              onMouseEnter={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 40px rgba(212,168,83,0.6)";
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1.03)";
              }}
              onMouseLeave={e => {
                (e.currentTarget as HTMLButtonElement).style.boxShadow = "0 0 24px rgba(212,168,83,0.35)";
                (e.currentTarget as HTMLButtonElement).style.transform = "scale(1)";
              }}
            >
              Enter the House <ArrowRight size={13} />
            </button>
          )}
        </div>
      </div>
    </>
  );
}
