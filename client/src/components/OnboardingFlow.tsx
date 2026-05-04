import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import { SpectreVideoPlayer } from "@/components/SpectreVideoPlayer";

interface OnboardingFlowProps {
  onComplete: () => void;
  isReplay?: boolean;
}

/* ─────────────────────────────────────────────────────────────────────────────
   Operator House — Cinematic Onboarding v2

   Design principles (from reference app analysis):
   - Specter is FIXED on the right 42% of screen at all times, changing state
   - Text content slides left-out / right-in independently of Specter
   - Full-bleed dark background — no cards, no borders, no containers
   - Thin gold progress bar at top (not dots)
   - Word-by-word text animation per slide (Specter is "speaking")
   - "Labor illusion" calibration screen before final CTA
   - Specter's state changes match the slide narrative
   - Skip tucked top-right, minimal
   ───────────────────────────────────────────────────────────────────────── */

const TOTAL_SLIDES = 7;

interface SlideData {
  id: number;
  spectreState: "welcoming" | "presenting" | "pointing" | "thinking" | "typing" | "thoughtful" | "determined" | "bow" | "hologram" | "triumph";
  eyebrow: string;
  headline: string;
  body: string;
  cta?: string;
}

const SLIDES: SlideData[] = [
  {
    id: 1,
    spectreState: "welcoming",
    eyebrow: "Welcome to Operator House",
    headline: "The House\nis ready.",
    body: "Specter has been standing by. Your intelligence layer, your pipeline, your strategy — all in one place. Built for operators who move fast.",
  },
  {
    id: 2,
    spectreState: "presenting",
    eyebrow: "Your Intelligence Layer",
    headline: "Know every\nlead before\nyou speak.",
    body: "Specter runs a deep audit on every prospect — intent signals, pain profile, objection map — so you walk into every conversation already ahead.",
  },
  {
    id: 3,
    spectreState: "hologram",
    eyebrow: "The Pipeline",
    headline: "See the whole\nboard at once.",
    body: "Every deal, every stage, every stale opportunity — surfaced and tracked. Specter flags what needs your attention so nothing slips through.",
  },
  {
    id: 4,
    spectreState: "typing",
    eyebrow: "Strategy on Demand",
    headline: "Your next\nmove, written\nin seconds.",
    body: "Describe a deal. Specter generates a full outreach strategy — messaging, positioning, objection handling — grounded in your vault of knowledge.",
  },
  {
    id: 5,
    spectreState: "thoughtful",
    eyebrow: "The Vault",
    headline: "Everything\nyou know,\nalways on call.",
    body: "Store your frameworks, scripts, case studies, and intel. Specter pulls from your vault when generating strategies — your knowledge compounds.",
  },
  {
    id: 6,
    spectreState: "determined",
    eyebrow: "Daily Briefings",
    headline: "Start every\nday with a\nclear picture.",
    body: "Each morning, Specter synthesizes your pipeline, flags stale deals, and delivers a briefing tailored to where you actually are — not where you wish you were.",
  },
  {
    id: 7,
    spectreState: "bow",
    eyebrow: "The House is yours",
    headline: "Specter is\nready to\nwork.",
    body: "Everything is set. Your operator is standing by. The only thing left is your first move.",
    cta: "Enter the House →",
  },
];

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Inter:wght@300;400;500&display=swap');

  .oh2-root {
    --bg: #060504;
    --ink: #f2ead6;
    --muted: #7a6e5e;
    --quiet: #3a342a;
    --gold: #c9a04a;
    --gold-bright: #e8c06a;
    --gold-dim: rgba(201,160,74,0.18);
    font-family: 'Inter', system-ui, sans-serif;
    background: var(--bg);
    color: var(--ink);
    overflow: hidden;
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 9000;
    -webkit-font-smoothing: antialiased;
    display: flex;
    flex-direction: column;
  }

  /* ── Progress bar ── */
  .oh2-progress {
    position: absolute;
    top: 0; left: 0; right: 0;
    height: 2px;
    background: rgba(255,255,255,0.06);
    z-index: 100;
  }
  .oh2-progress-fill {
    height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--gold-bright));
    transition: width 0.6s cubic-bezier(0.4,0,0.2,1);
    box-shadow: 0 0 8px rgba(201,160,74,0.5);
  }

  /* ── Skip button ── */
  .oh2-skip {
    position: absolute;
    top: 20px; right: 24px;
    z-index: 200;
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    color: var(--muted);
    background: none;
    border: none;
    cursor: pointer;
    padding: 8px 4px;
    transition: color 0.2s;
  }
  .oh2-skip:hover { color: var(--ink); }

  /* ── Layout ── */
  .oh2-layout {
    display: flex;
    flex: 1 1 0;
    width: 100%;
    min-height: 0;
  }

  /* ── Left: text panel ── */
  .oh2-text-panel {
    flex: 0 0 58%;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 6% 0 8%;
    position: relative;
    overflow: hidden;
    min-height: 0;
  }
  /* Subtle left-edge gold accent */
  .oh2-text-panel::before {
    content: '';
    position: absolute;
    left: 0;
    top: 20%;
    bottom: 20%;
    width: 1px;
    background: linear-gradient(to bottom, transparent, var(--gold-dim) 30%, var(--gold-dim) 70%, transparent);
  }

  /* ── Right: Specter panel ── */
  .oh2-specter-panel {
    flex: 0 0 42%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
    position: relative;
    overflow: hidden;
    padding-bottom: 0;
    min-height: 0;
  }

  /* Specter video container — fills the full panel height */
  .oh2-specter-video {
    width: 100%;
    height: 100%;
    display: flex;
    align-items: flex-end;
    justify-content: center;
  }
  /* Override SpectreVideoPlayer size preset — let Specter fill the panel */
  .oh2-specter-video > div {
    width: 100% !important;
    height: 100% !important;
    max-width: none !important;
  }
  .oh2-specter-video > div video {
    width: 100% !important;
    height: 100% !important;
    object-fit: contain;
    object-position: bottom center;
  }

  /* ── Slide content wrapper ── */
  .oh2-slide-content {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 6% 0 8%;
  }

  .oh2-slide-content.entering {
    animation: oh2-slide-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
  }
  .oh2-slide-content.exiting {
    animation: oh2-slide-out 0.4s cubic-bezier(0.4,0,1,1) forwards;
  }

  @keyframes oh2-slide-in {
    from { opacity: 0; transform: translateX(32px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes oh2-slide-out {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(-28px); }
  }

  /* ── Eyebrow ── */
  .oh2-eyebrow {
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 500;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
    margin-bottom: 20px;
    opacity: 0;
    animation: oh2-fade-up 0.5s 0.1s cubic-bezier(0.22,1,0.36,1) forwards;
  }

  /* ── Headline ── */
  .oh2-headline {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(42px, 6vw, 72px);
    font-weight: 300;
    line-height: 1.08;
    letter-spacing: -0.01em;
    color: var(--ink);
    margin-bottom: 28px;
    white-space: pre-line;
    opacity: 0;
    animation: oh2-fade-up 0.6s 0.2s cubic-bezier(0.22,1,0.36,1) forwards;
  }

  .oh2-headline em {
    font-style: italic;
    color: var(--gold-bright);
  }

  /* ── Body ── */
  .oh2-body {
    font-family: 'Inter', sans-serif;
    font-size: clamp(13px, 1.4vw, 15px);
    font-weight: 300;
    line-height: 1.75;
    color: var(--muted);
    max-width: 400px;
    margin-bottom: 40px;
    opacity: 0;
    animation: oh2-fade-up 0.6s 0.35s cubic-bezier(0.22,1,0.36,1) forwards;
  }

  /* ── CTA button ── */
  .oh2-cta {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 14px 28px;
    background: var(--gold);
    color: #0a0806;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 500;
    letter-spacing: 0.06em;
    border: none;
    border-radius: 2px;
    cursor: pointer;
    transition: background 0.2s, transform 0.15s, box-shadow 0.2s;
    opacity: 0;
    animation: oh2-fade-up 0.6s 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
    position: relative;
    overflow: hidden;
  }
  .oh2-cta::after {
    content: '';
    position: absolute;
    inset: 0;
    background: rgba(255,255,255,0);
    transition: background 0.2s;
  }
  .oh2-cta:hover {
    background: var(--gold-bright);
    transform: translateY(-1px);
    box-shadow: 0 8px 32px rgba(201,160,74,0.35);
  }
  .oh2-cta:hover::after {
    background: rgba(255,255,255,0.06);
  }
  .oh2-cta:active { transform: translateY(0); }
  .oh2-cta-pulse {
    position: absolute;
    inset: -1px;
    border-radius: 2px;
    background: transparent;
    border: 1px solid var(--gold);
    animation: oh2-cta-ring 2.4s ease-in-out 1.2s infinite;
    pointer-events: none;
  }
  @keyframes oh2-cta-ring {
    0%   { opacity: 0.6; transform: scale(1); }
    60%  { opacity: 0; transform: scale(1.08); }
    100% { opacity: 0; transform: scale(1.08); }
  }

  /* ── Next arrow (slides 1-6) ── */
  .oh2-next {
    display: inline-flex;
    align-items: center;
    gap: 10px;
    padding: 12px 0;
    background: none;
    border: none;
    color: var(--muted);
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 400;
    letter-spacing: 0.12em;
    text-transform: uppercase;
    cursor: pointer;
    transition: color 0.2s, gap 0.2s;
    opacity: 0;
    animation: oh2-fade-up 0.6s 0.5s cubic-bezier(0.22,1,0.36,1) forwards;
  }
  .oh2-next:hover {
    color: var(--ink);
    gap: 16px;
  }
  .oh2-next-arrow {
    width: 28px;
    height: 1px;
    background: currentColor;
    position: relative;
    transition: width 0.2s;
  }
  .oh2-next-arrow::after {
    content: '';
    position: absolute;
    right: 0; top: -3px;
    width: 7px; height: 7px;
    border-right: 1px solid currentColor;
    border-top: 1px solid currentColor;
    transform: rotate(45deg);
  }
  .oh2-next:hover .oh2-next-arrow { width: 36px; }

  /* ── Calibration screen ── */
  .oh2-calibration {
    position: absolute;
    inset: 0;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 32px;
    z-index: 50;
    background: var(--bg);
    animation: oh2-fade-in 0.6s ease forwards;
  }
  .oh2-cal-label {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.2em;
    text-transform: uppercase;
    color: var(--gold);
  }
  .oh2-cal-bar-track {
    width: 240px;
    height: 1px;
    background: var(--quiet);
    position: relative;
    overflow: hidden;
  }
  .oh2-cal-bar-fill {
    position: absolute;
    top: 0; left: 0; height: 100%;
    background: linear-gradient(90deg, var(--gold), var(--gold-bright));
    box-shadow: 0 0 6px rgba(201,160,74,0.6);
    animation: oh2-cal-progress 2.2s cubic-bezier(0.4,0,0.2,1) forwards;
  }
  @keyframes oh2-cal-progress {
    from { width: 0%; }
    to   { width: 100%; }
  }
  .oh2-cal-items {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }
  .oh2-cal-item {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 300;
    color: var(--muted);
    opacity: 0;
    transform: translateY(6px);
  }
  .oh2-cal-item.visible {
    animation: oh2-fade-up 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
  }

  /* ── Specter ambient glow ── */
  .oh2-specter-glow {
    position: absolute;
    bottom: -10%;
    left: 50%;
    transform: translateX(-50%);
    width: 80%;
    height: 50%;
    background: radial-gradient(ellipse at center, rgba(201,160,74,0.12) 0%, rgba(201,160,74,0.04) 40%, transparent 70%);
    pointer-events: none;
    animation: oh2-glow-pulse 4s ease-in-out infinite;
  }
  @keyframes oh2-glow-pulse {
    0%, 100% { opacity: 0.7; }
    50% { opacity: 1; }
  }

  /* ── Film grain overlay ── */
  .oh2-root::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 9999;
    pointer-events: none;
    opacity: 0.025;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 128px 128px;
  }

  /* ── Scanlines on Specter panel ── */
  .oh2-specter-panel::before {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 2;
    pointer-events: none;
    background: repeating-linear-gradient(
      0deg,
      transparent,
      transparent 2px,
      rgba(0,0,0,0.06) 2px,
      rgba(0,0,0,0.06) 4px
    );
  }

  /* ── Specter entrance on first slide ── */
  .oh2-specter-video {
    animation: oh2-specter-enter 1.2s cubic-bezier(0.22,1,0.36,1) forwards;
  }
  @keyframes oh2-specter-enter {
    from { opacity: 0; transform: translateY(24px) scale(0.97); }
    to   { opacity: 1; transform: translateY(0) scale(1); }
  }

  /* ── Slide counter ── */
  .oh2-counter {
    position: absolute;
    bottom: 28px;
    left: 8%;
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.15em;
    color: var(--quiet);
    z-index: 100;
  }

  /* ── Vertical line divider ── */
  .oh2-divider {
    position: absolute;
    top: 15%;
    bottom: 15%;
    left: 58%;
    width: 1px;
    background: linear-gradient(to bottom, transparent, var(--quiet) 30%, var(--quiet) 70%, transparent);
    opacity: 0.4;
  }

  @keyframes oh2-fade-up {
    from { opacity: 0; transform: translateY(12px); }
    to   { opacity: 1; transform: translateY(0); }
  }
  @keyframes oh2-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }

  /* ── Mobile ── */
  @media (max-width: 640px) {
    .oh2-layout {
      flex-direction: column-reverse;
    }
    .oh2-text-panel {
      flex: 0 0 55%;
      padding: 0 6% 8% 6%;
      justify-content: flex-start;
      padding-top: 16px;
    }
    .oh2-specter-panel {
      flex: 0 0 45%;
    }
    .oh2-headline {
      font-size: clamp(32px, 8vw, 48px);
    }
    .oh2-divider { display: none; }
    .oh2-counter { bottom: 16px; left: 6%; }
  }
`;

export default function OnboardingFlow({ onComplete, isReplay = false }: OnboardingFlowProps) {
  const [slide, setSlide] = useState(1);
  const [animState, setAnimState] = useState<"idle" | "exiting" | "entering">("idle");
  const [showCalibration, setShowCalibration] = useState(false);
  const [calStep, setCalStep] = useState(0);
  const [done, setDone] = useState(false);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const completeOnboarding = trpc.onboarding.complete.useMutation();

  // Inject global CSS once
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    styleRef.current = el;
    return () => { el.remove(); };
  }, []);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") advance();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") retreat();
      if (e.key === "Escape") handleSkip();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  }, [slide, animState, showCalibration]);

  // Touch swipe
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 44) { dx > 0 ? advance() : retreat(); }
  };

  const advance = useCallback(() => {
    if (animState !== "idle" || showCalibration) return;
    if (slide === TOTAL_SLIDES) { handleEnter(); return; }
    // Show calibration before last slide
    if (slide === TOTAL_SLIDES - 1) {
      triggerCalibration();
      return;
    }
    goTo(slide + 1);
  }, [slide, animState, showCalibration]);

  const retreat = useCallback(() => {
    if (animState !== "idle" || showCalibration || slide <= 1) return;
    goTo(slide - 1);
  }, [slide, animState, showCalibration]);

  const goTo = (target: number) => {
    if (animState !== "idle") return;
    setAnimState("exiting");
    setTimeout(() => {
      setSlide(target);
      setAnimState("entering");
      setTimeout(() => setAnimState("idle"), 600);
    }, 380);
  };

  const triggerCalibration = () => {
    setShowCalibration(true);
    setCalStep(0);
    const steps = [0, 1, 2, 3];
    steps.forEach((s, i) => {
      setTimeout(() => setCalStep(s + 1), 400 + i * 480);
    });
    setTimeout(() => {
      setShowCalibration(false);
      goTo(TOTAL_SLIDES);
    }, 2600);
  };

  const handleEnter = () => {
    if (done) return;
    setDone(true);
    if (!isReplay) {
      completeOnboarding.mutate(undefined, {
        onSettled: () => { setTimeout(onComplete, 400); },
      });
    } else {
      setTimeout(onComplete, 400);
    }
  };

  const handleSkip = () => {
    if (!isReplay) {
      completeOnboarding.mutate(undefined, { onSettled: onComplete });
    } else {
      onComplete();
    }
  };

  const currentSlide = SLIDES[slide - 1];
  const progress = (slide / TOTAL_SLIDES) * 100;

  const CAL_ITEMS = [
    "Mapping your pipeline intelligence",
    "Loading Specter's strategy engine",
    "Calibrating your operator profile",
    "The House is ready",
  ];

  return (
    <div
      className="oh2-root"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
    >
      {/* Progress bar */}
      <div className="oh2-progress">
        <div className="oh2-progress-fill" style={{ width: `${progress}%` }} />
      </div>

      {/* Skip */}
      {!showCalibration && (
        <button className="oh2-skip" onClick={handleSkip}>
          Skip intro
        </button>
      )}

      {/* Calibration overlay */}
      {showCalibration && (
        <div className="oh2-calibration">
          <div className="oh2-cal-label">Specter is calibrating your House</div>
          <div className="oh2-cal-bar-track">
            <div className="oh2-cal-bar-fill" />
          </div>
          <div className="oh2-cal-items">
            {CAL_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`oh2-cal-item${calStep > i ? " visible" : ""}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {calStep > i ? "✓ " : ""}{item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Main layout */}
      {!showCalibration && (
        <div className="oh2-layout">
          {/* Left: text panel */}
          <div className="oh2-text-panel">
            <div
              key={`slide-${slide}`}
              className={`oh2-slide-content${animState === "entering" ? " entering" : animState === "exiting" ? " exiting" : ""}`}
            >
              <div className="oh2-eyebrow">{currentSlide.eyebrow}</div>
              <h1 className="oh2-headline">{currentSlide.headline}</h1>
              <p className="oh2-body">{currentSlide.body}</p>

              {currentSlide.cta ? (
                <button className="oh2-cta" onClick={handleEnter}>
                  <span className="oh2-cta-pulse" />
                  {currentSlide.cta}
                </button>
              ) : (
                <button className="oh2-next" onClick={advance}>
                  <span className="oh2-next-arrow" />
                  Continue
                </button>
              )}
            </div>
          </div>

          {/* Vertical divider */}
          <div className="oh2-divider" />

          {/* Right: Specter panel */}
          <div className="oh2-specter-panel">
            <div className="oh2-specter-glow" />
            <div className="oh2-specter-video">
              <SpectreVideoPlayer
                state={currentSlide.spectreState}
                size="2xl"
                className="!w-full !h-full"
              />
            </div>
          </div>
        </div>
      )}

      {/* Slide counter */}
      {!showCalibration && (
        <div className="oh2-counter">
          {String(slide).padStart(2, "0")} / {String(TOTAL_SLIDES).padStart(2, "0")}
        </div>
      )}
    </div>
  );
}
