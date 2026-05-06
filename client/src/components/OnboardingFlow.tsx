/**
 * OnboardingFlow v3.1 — Cinematic Full-Bleed (Level-Up Edition)
 *
 * Changes from v3:
 * 1. Slide 1 headline is now "Operator House" — brand name as the hero
 * 2. Skip button replaced with a ✕ icon (no label, no apology)
 * 3. Mobile: collapses to 3 slides (1, 3, 7) via CSS + JS mobile detection
 * 4. Mobile: CTA/controls move to bottom-center, thumb-zone friendly
 * 5. "Continue" replaced with → arrow only (no text label)
 */

import { useCallback, useEffect, useRef, useState } from "react";
import { trpc } from "@/lib/trpc";
import type { SpectreState } from "@/components/SpectreVideoPlayer";

interface OnboardingFlowProps {
  onComplete: () => void;
  isReplay?: boolean;
}

// ─── Slide data ───────────────────────────────────────────────────────────────

interface SlideData {
  id: number;
  clip: SpectreState;
  /** Clip is portrait 9:16 — use contain + bottom anchor */
  portrait?: boolean;
  eyebrow: string;
  headline: string;
  body: string;
  cta?: string;
  /** ms delay before first word appears after slide enters */
  textDelay?: number;
  /** Show on mobile (collapsed 3-slide flow). Default true. */
  mobile?: boolean;
}

const SLIDES: SlideData[] = [
  {
    id: 1,
    clip: "inviting_smiling",
    portrait: true,
    eyebrow: "Welcome",
    headline: "Operator\nHouse.",
    body: "Your intelligence layer, your pipeline, your strategy — all in one place. Built for operators who move fast.",
    textDelay: 600,
    mobile: true,
  },
  {
    id: 2,
    clip: "talking",
    portrait: true,
    eyebrow: "Your Intelligence Layer",
    headline: "Know every\nlead before\nyou speak.",
    body: "Specter runs a deep audit on every prospect — intent signals, pain profile, objection map — so you walk into every conversation already ahead.",
    textDelay: 400,
    mobile: false,
  },
  {
    id: 3,
    clip: "data_video",
    portrait: false,
    eyebrow: "The Pipeline",
    headline: "See the whole\nboard at once.",
    body: "Every deal, every stage, every stale opportunity — surfaced and tracked. Specter flags what needs your attention so nothing slips through.",
    textDelay: 400,
    mobile: true, // middle slide in the 3-slide mobile flow
  },
  {
    id: 4,
    clip: "cast",
    portrait: true,
    eyebrow: "Strategy on Demand",
    headline: "Your next\nmove, written\nin seconds.",
    body: "Describe a deal. Specter generates a full outreach strategy — messaging, positioning, objection handling — grounded in your vault of knowledge.",
    textDelay: 500,
    mobile: false,
  },
  {
    id: 5,
    clip: "typing",
    portrait: true,
    eyebrow: "The Vault",
    headline: "Everything\nyou know,\nalways on call.",
    body: "Store your frameworks, scripts, case studies, and intel. Specter pulls from your vault when generating strategies — your knowledge compounds.",
    textDelay: 400,
    mobile: false,
  },
  {
    id: 6,
    clip: "heart_to_yours",
    portrait: true,
    eyebrow: "Daily Briefings",
    headline: "Start every\nday with a\nclear picture.",
    body: "Each morning, Specter synthesizes your pipeline, flags stale deals, and delivers a briefing tailored to where you actually are — not where you wish you were.",
    textDelay: 500,
    mobile: false,
  },
  {
    id: 7,
    clip: "bowing",
    portrait: true,
    eyebrow: "The House is yours",
    headline: "Specter is\nready to\nwork.",
    body: "Everything is set. Your operator is standing by. The only thing left is your first move.",
    cta: "Enter the House →",
    textDelay: 700,
    mobile: true,
  },
];

// CDN base — must match SpectreVideoPlayer
const BASE = "/manus-storage";

// Map each clip state to its CDN URL (first URL from SpectreVideoPlayer CLIPS registry)
const CLIP_URLS: Record<SpectreState, string> = {
  idle:              `${BASE}/hf_20260503_000541_7cfe329e-91e6-41d4-8584-f98f722ef3da_6c095791.mp4`,
  idle_neutral:      `${BASE}/hf_20260503_003626_b5c13543-ddb2-40ee-b19d-2c2371d16946_0308c250.mp4`,
  idle_hologram:     `${BASE}/hf_20260502_211341_4ac80b83-1c05-4b01-a6ad-3da9c4301f83_b88dac25.mp4`,
  idle_holding:      `${BASE}/hf_20260502_212916_e47ec533-68de-4ec9-894a-a8ac0b666b55_d7c6ce08.mp4`,
  welcoming:         `${BASE}/hf_20260502_203044_dd378993-612b-426a-9361-ba88ac5cd9e2_22eb71c6.mp4`,
  presenting:        `${BASE}/hf_20260502_203849_a8f8de64-ff0e-4ff9-b10a-bd9fa90f8fcf_2c81370b.mp4`,
  pointing:          `${BASE}/hf_20260502_210103_006c0c69-eee5-42c3-a844-f5a0263262c5_545601c0.mp4`,
  thinking:          `${BASE}/hf_20260502_235500_5e9803e2-9521-491c-963b-0239e50e2721_f5031812.mp4`,
  typing:            `${BASE}/hf_20260502_210704_d39721a7-dbc8-47cc-84a1-6c7c64371d80_f84ef751.mp4`,
  thoughtful:        `${BASE}/hf_20260503_003219_517286cd-52ec-44c7-b00a-12ec1ee7807a_4d573ab3.mp4`,
  cast:              `${BASE}/hf_20260502_204413_0386e184-d326-433f-8ef6-2c6a23476aa0_3be547a5.mp4`,
  hologram:          `${BASE}/hf_20260503_004223_02f6a896-5e88-4d9e-9b2d-2a82dc1d39c6_5769b801.mp4`,
  hand_on_heart:     `${BASE}/hf_20260502_211821_a0046d06-816a-4584-8da1-ed990b173964_2729c527.mp4`,
  bow:               `${BASE}/hf_20260502_205345_137b645e-3e27-46d2-b134-769ec6f03a25_6f86149d.mp4`,
  wave:              `${BASE}/hf_20260502_214102_5c78de5f-a0aa-42de-a9a5-4605e13569e4_d6f014e7.mp4`,
  determined:        `${BASE}/hf_20260502_234831_90ab3ebb-1d16-4ea3-b6b8-38a0f1c057f9_745f7c13.mp4`,
  triumph:           `${BASE}/mp__3d1f90ea.mp4`,
  power_up:          `${BASE}/Restrained_triumph_The_charac_6a346f6b.mp4`,
  welcome_pleasant:  `${BASE}/specter_welcome_pleasant_51c6fad6.mp4`,
  offering_pleasant: `${BASE}/specter_offering_pleasant_26f0d8dc.mp4`,
  inviting_pleasant: `${BASE}/specter_inviting_pleasant_049a7dd1.mp4`,
  search_hologram:   `${BASE}/specter_search_hologram_8e32bcda.mp4`,
  gear_hologram:     `${BASE}/specter_gear_hologram_e6735037.mp4`,
  sincere_pleasant:  `${BASE}/specter_sincere_pleasant_fd64bd09.mp4`,
  bow_pleasant:      `${BASE}/specter_bow_nobg_1ec3bba7.webm`,
  vault_lock:        `${BASE}/specter_vault_lock_16e573ea.mp4`,
  inviting_smiling:  `${BASE}/SpectorInvitingSmiling_92a14245.mp4`,
  talking:           `${BASE}/SpectorTalking_c166a610.mp4`,
  this_way:          `${BASE}/SpectorThisWay_32888b15.mp4`,
  heart_to_yours:    `${BASE}/SpectorHearttoYours_c1a0c2c6.mp4`,
  bowing:            `${BASE}/specter_bowing_cropped_39485b8b.mp4`,
  celebration:       `${BASE}/SpectorCelebration_195be803.mp4`,
  approval:          `${BASE}/SpectorApproval_fdf9628b.mp4`,
  approval_nod:      `${BASE}/SpectorApprovalNod_78496d10.mp4`,
  happy:             `${BASE}/SpectorHappy_b40303f1.mp4`,
  happy_greeting:    `${BASE}/SpectorHappyGreeting_2857a01f.mp4`,
  gesturing:         `${BASE}/SpectorGesturing_e1ab809c.mp4`,
  flipping_magic:    `${BASE}/SpectorFlippingMagic_f55402cd.mp4`,
  digital_trails:    `${BASE}/SpectorDigitalTrails_a375c572.mp4`,
  idol_breathing:    `${BASE}/SpectorIdolBreathing_ef95ba2b.mp4`,
  majorly_confused:  `${BASE}/SpectorMajorlyConfused_27f15ceb.mp4`,
  waiting_confused:  `${BASE}/SpectorWaitingConfused_305f40fa.mp4`,
  waiting:           `${BASE}/SpectorWaiting2_3d7b5780.mp4`,
  ui_loading:        `${BASE}/SpectorUILoading_85cd0594.mp4`,
  data_video:        `${BASE}/specter_datavideo_cropped_e63779d0.mp4`,
};

// ─── CSS ──────────────────────────────────────────────────────────────────────

const CSS = `
  @import url('https://fonts.googleapis.com/css2?family=Cormorant+Garamond:ital,wght@0,300;0,400;0,600;1,300;1,400&family=Inter:wght@300;400;500&display=swap');

  /* ── Root: full-bleed fixed layer ── */
  .oh3-root {
    position: fixed;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 9000;
    overflow: hidden;
    background: #060504;
    font-family: 'Inter', system-ui, sans-serif;
    -webkit-font-smoothing: antialiased;
  }

  /* ── Video layer: Specter IS the background ── */
  .oh3-video-layer {
    position: absolute;
    inset: 0;
    width: 100%;
    height: 100%;
    z-index: 1;
  }
  .oh3-video-layer video {
    width: 100%;
    height: 100%;
    object-fit: cover;
    object-position: center bottom;
    display: block;
  }
  /* Portrait clips: contain + bottom anchor so head is always visible */
  .oh3-video-layer.portrait video {
    object-fit: contain;
    object-position: center bottom;
    background: #060504;
  }

  /* ── Gradient overlay: text side is darker, Specter side is lighter ── */
  .oh3-overlay {
    position: absolute;
    inset: 0;
    z-index: 2;
    background:
      linear-gradient(
        to right,
        rgba(6,5,4,0.92) 0%,
        rgba(6,5,4,0.85) 35%,
        rgba(6,5,4,0.45) 58%,
        rgba(6,5,4,0.10) 75%,
        rgba(6,5,4,0.0) 100%
      ),
      linear-gradient(
        to top,
        rgba(6,5,4,0.7) 0%,
        transparent 30%
      );
    pointer-events: none;
  }

  /* ── Text panel: floats over the video on the left ── */
  .oh3-text-panel {
    position: absolute;
    left: 0;
    top: 0;
    bottom: 0;
    width: 55%;
    z-index: 3;
    display: flex;
    flex-direction: column;
    justify-content: center;
    padding: 0 5% 0 8%;
  }

  /* ── Eyebrow ── */
  .oh3-eyebrow {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #c9a04a;
    margin-bottom: 20px;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.5s ease, transform 0.5s ease;
  }
  .oh3-eyebrow.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── Headline ── */
  .oh3-headline {
    font-family: 'Cormorant Garamond', Georgia, serif;
    font-size: clamp(44px, 5.5vw, 80px);
    font-weight: 300;
    line-height: 1.05;
    letter-spacing: -0.01em;
    color: #f2ead6;
    margin: 0 0 28px 0;
    white-space: pre-line;
  }

  /* ── Word-by-word reveal ── */
  .oh3-word {
    display: inline;
    opacity: 0;
    filter: blur(4px);
    transition: opacity 0.35s ease, filter 0.35s ease;
  }
  .oh3-word.visible {
    opacity: 1;
    filter: blur(0);
  }
  /* Space between words */
  .oh3-word + .oh3-word::before {
    content: ' ';
  }

  /* ── Body text ── */
  .oh3-body {
    font-family: 'Inter', sans-serif;
    font-size: clamp(14px, 1.4vw, 17px);
    font-weight: 300;
    line-height: 1.65;
    color: rgba(242,234,214,0.65);
    max-width: 440px;
    margin: 0 0 40px 0;
    opacity: 0;
    transform: translateY(10px);
    transition: opacity 0.6s ease 0.1s, transform 0.6s ease 0.1s;
  }
  .oh3-body.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* ── Navigation controls ── */
  .oh3-controls {
    display: flex;
    align-items: center;
    gap: 20px;
    opacity: 0;
    transform: translateY(8px);
    transition: opacity 0.5s ease 0.2s, transform 0.5s ease 0.2s;
  }
  .oh3-controls.visible {
    opacity: 1;
    transform: translateY(0);
  }

  /* Next button — arrow only, no label */
  .oh3-next {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 48px;
    height: 48px;
    background: none;
    border: 1px solid rgba(242,234,214,0.18);
    border-radius: 50%;
    cursor: pointer;
    color: rgba(242,234,214,0.55);
    font-size: 20px;
    line-height: 1;
    padding: 0;
    transition: border-color 0.2s, color 0.2s, background 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .oh3-next:hover {
    border-color: rgba(242,234,214,0.45);
    color: #f2ead6;
    background: rgba(242,234,214,0.05);
  }

  /* CTA button — final slide */
  .oh3-cta {
    position: relative;
    display: inline-flex;
    align-items: center;
    gap: 12px;
    background: none;
    border: 1px solid rgba(201,160,74,0.5);
    cursor: pointer;
    font-family: 'Inter', sans-serif;
    font-size: 13px;
    font-weight: 400;
    letter-spacing: 0.16em;
    text-transform: uppercase;
    color: #c9a04a;
    padding: 14px 28px;
    transition: border-color 0.25s, color 0.25s, background 0.25s;
    overflow: hidden;
    -webkit-tap-highlight-color: transparent;
  }
  .oh3-cta:hover {
    border-color: rgba(201,160,74,0.9);
    color: #e8c06a;
    background: rgba(201,160,74,0.06);
  }
  /* Pulse ring */
  .oh3-cta::before {
    content: '';
    position: absolute;
    inset: -4px;
    border: 1px solid rgba(201,160,74,0.25);
    animation: oh3-pulse 2.5s ease-in-out infinite;
  }
  @keyframes oh3-pulse {
    0%, 100% { opacity: 0; transform: scale(1); }
    50% { opacity: 1; transform: scale(1.04); }
  }

  /* ── Skip button — ✕ icon only, no label ── */
  .oh3-skip {
    position: absolute;
    top: 18px;
    right: 22px;
    z-index: 10;
    width: 36px;
    height: 36px;
    display: flex;
    align-items: center;
    justify-content: center;
    background: none;
    border: none;
    cursor: pointer;
    color: rgba(242,234,214,0.22);
    font-size: 18px;
    line-height: 1;
    padding: 0;
    transition: color 0.2s;
    -webkit-tap-highlight-color: transparent;
  }
  .oh3-skip:hover { color: rgba(242,234,214,0.55); }

  /* ── Slide counter ── */
  .oh3-counter {
    position: absolute;
    bottom: 28px;
    left: 8%;
    z-index: 10;
    font-family: 'Inter', sans-serif;
    font-size: 10px;
    font-weight: 400;
    letter-spacing: 0.15em;
    color: rgba(242,234,214,0.2);
  }

  /* ── Calibration screen ── */
  .oh3-calibration {
    position: absolute;
    inset: 0;
    z-index: 20;
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    gap: 32px;
    background: #060504;
    animation: oh3-fade-in 0.5s ease forwards;
  }
  .oh3-cal-label {
    font-family: 'Inter', sans-serif;
    font-size: 11px;
    font-weight: 400;
    letter-spacing: 0.22em;
    text-transform: uppercase;
    color: #c9a04a;
  }
  .oh3-cal-track {
    width: 220px;
    height: 1px;
    background: rgba(242,234,214,0.08);
    position: relative;
    overflow: hidden;
  }
  .oh3-cal-fill {
    position: absolute;
    top: 0; left: 0; height: 100%;
    background: linear-gradient(90deg, #c9a04a, #e8c06a);
    box-shadow: 0 0 6px rgba(201,160,74,0.6);
    animation: oh3-cal-progress 2.2s cubic-bezier(0.4,0,0.2,1) forwards;
  }
  @keyframes oh3-cal-progress { from { width: 0% } to { width: 100% } }
  .oh3-cal-items {
    display: flex;
    flex-direction: column;
    gap: 10px;
    align-items: center;
  }
  .oh3-cal-item {
    font-family: 'Inter', sans-serif;
    font-size: 12px;
    font-weight: 300;
    color: rgba(242,234,214,0.35);
    opacity: 0;
    transform: translateY(6px);
  }
  .oh3-cal-item.visible {
    animation: oh3-fade-up 0.4s cubic-bezier(0.22,1,0.36,1) forwards;
  }

  /* ── Dissolve-to-dashboard transition ── */
  .oh3-dissolve {
    position: absolute;
    inset: 0;
    z-index: 50;
    background: #f2ead6;
    opacity: 0;
    pointer-events: none;
    transition: opacity 0.8s ease;
  }
  .oh3-dissolve.active {
    opacity: 1;
    pointer-events: all;
  }

  /* ── Film grain ── */
  .oh3-root::after {
    content: '';
    position: absolute;
    inset: 0;
    z-index: 8;
    pointer-events: none;
    opacity: 0.022;
    background-image: url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noise'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.9' numOctaves='4' stitchTiles='stitch'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noise)'/%3E%3C/svg%3E");
    background-size: 128px 128px;
  }

  /* ── Slide transition ── */
  .oh3-slide-enter {
    animation: oh3-slide-in 0.55s cubic-bezier(0.22,1,0.36,1) forwards;
  }
  .oh3-slide-exit {
    animation: oh3-slide-out 0.35s cubic-bezier(0.4,0,1,1) forwards;
  }
  @keyframes oh3-slide-in {
    from { opacity: 0; transform: translateX(20px); }
    to   { opacity: 1; transform: translateX(0); }
  }
  @keyframes oh3-slide-out {
    from { opacity: 1; transform: translateX(0); }
    to   { opacity: 0; transform: translateX(-20px); }
  }

  /* ── Video crossfade ── */
  .oh3-video-layer {
    transition: opacity 0.6s ease;
  }
  .oh3-video-layer.fading {
    opacity: 0;
  }

  /* ── Animations ── */
  @keyframes oh3-fade-in {
    from { opacity: 0; }
    to   { opacity: 1; }
  }
  @keyframes oh3-fade-up {
    from { opacity: 0; transform: translateY(6px); }
    to   { opacity: 1; transform: translateY(0); }
  }

  /* ── Mobile ── */
  @media (max-width: 640px) {
    .oh3-text-panel {
      width: 100%;
      top: auto;
      bottom: 0;
      justify-content: flex-end;
      padding: 0 6% 10% 6%;
      background: linear-gradient(to top, rgba(6,5,4,0.97) 0%, rgba(6,5,4,0.75) 55%, transparent 100%);
    }
    .oh3-overlay {
      background: rgba(6,5,4,0.35);
    }
    .oh3-headline {
      font-size: clamp(40px, 10vw, 56px);
    }
    .oh3-body {
      max-width: 100%;
      font-size: 15px;
    }
    .oh3-counter { display: none; }
    /* Controls bottom-center on mobile */
    .oh3-controls {
      justify-content: center;
    }
    /* CTA full-width pill on mobile */
    .oh3-cta {
      width: 100%;
      justify-content: center;
      padding: 16px 28px;
      font-size: 14px;
    }
    /* Arrow button larger touch target on mobile */
    .oh3-next {
      width: 56px;
      height: 56px;
      font-size: 22px;
    }
  }

  /* ── Haptic tap animation ── */
  .oh3-next.tapped {
    animation: oh3-tap-pulse 0.28s cubic-bezier(0.22,1,0.36,1) forwards;
  }
  @keyframes oh3-tap-pulse {
    0%   { transform: scale(1); }
    40%  { transform: scale(0.88); }
    100% { transform: scale(1); }
  }
`;

// ─── Component ────────────────────────────────────────────────────────────────

export default function OnboardingFlow({ onComplete, isReplay = false }: OnboardingFlowProps) {
  // Detect mobile to use collapsed 3-slide flow
  const [isMobile, setIsMobile] = useState(() => window.innerWidth <= 640);
  useEffect(() => {
    const handler = () => setIsMobile(window.innerWidth <= 640);
    window.addEventListener("resize", handler);
    return () => window.removeEventListener("resize", handler);
  }, []);

  // Build the active slide list based on viewport
  const activeSlides = isMobile ? SLIDES.filter(s => s.mobile !== false) : SLIDES;
  const TOTAL = activeSlides.length;

  const [slideIdx, setSlideIdx] = useState(0);
  const [phase, setPhase] = useState<"idle" | "exiting" | "entering">("idle");
  const [textActive, setTextActive] = useState(false);
  const [showCalibration, setShowCalibration] = useState(false);
  const [calStep, setCalStep] = useState(0);
  const [dissolving, setDissolving] = useState(false);
  const [videoFading, setVideoFading] = useState(false);
  const [done, setDone] = useState(false);
  const [nextTapped, setNextTapped] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const styleRef = useRef<HTMLStyleElement | null>(null);
  const completeOnboarding = trpc.onboarding.complete.useMutation();

  const currentSlide = activeSlides[slideIdx];

  // Inject CSS once
  useEffect(() => {
    const el = document.createElement("style");
    el.textContent = CSS;
    document.head.appendChild(el);
    styleRef.current = el;
    return () => { el.remove(); };
  }, []);

  // Activate text after slide enters
  useEffect(() => {
    setTextActive(false);
    const t = setTimeout(() => setTextActive(true), (currentSlide.textDelay ?? 400) + 200);
    return () => clearTimeout(t);
  }, [slideIdx, currentSlide.textDelay]);

  // Word reveal for headline
  const headlineWords = currentSlide.headline.replace(/\n/g, " ").split(" ");
  const [headlineVisible, setHeadlineVisible] = useState(0);
  useEffect(() => {
    setHeadlineVisible(0);
    if (!textActive) return;
    const timers: ReturnType<typeof setTimeout>[] = [];
    headlineWords.forEach((_, i) => {
      timers.push(setTimeout(() => setHeadlineVisible(i + 1), i * 110));
    });
    return () => timers.forEach(clearTimeout);
  }, [textActive, slideIdx]);

  // Body + controls appear after headline is done
  const headlineDuration = headlineWords.length * 110;
  const [bodyVisible, setBodyVisible] = useState(false);
  useEffect(() => {
    setBodyVisible(false);
    if (!textActive) return;
    const t = setTimeout(() => setBodyVisible(true), headlineDuration + 200);
    return () => clearTimeout(t);
  }, [textActive, slideIdx, headlineDuration]);

  // Keyboard navigation
  useEffect(() => {
    const handler = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown" || e.key === " ") advance();
      if (e.key === "ArrowLeft" || e.key === "ArrowUp") retreat();
      if (e.key === "Escape") handleSkip();
    };
    window.addEventListener("keydown", handler);
    return () => window.removeEventListener("keydown", handler);
  });

  // Touch swipe
  const touchStartX = useRef(0);
  const handleTouchStart = (e: React.TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
  const handleTouchEnd = (e: React.TouchEvent) => {
    const dx = touchStartX.current - e.changedTouches[0].clientX;
    if (Math.abs(dx) > 44) { dx > 0 ? advance() : retreat(); }
  };

  const goTo = useCallback((target: number) => {
    if (phase !== "idle") return;
    setPhase("exiting");
    setVideoFading(true);
    setTimeout(() => {
      setSlideIdx(target);
      setPhase("entering");
      setVideoFading(false);
      // Load new video
      if (videoRef.current) {
        videoRef.current.src = CLIP_URLS[activeSlides[target].clip];
        videoRef.current.load();
        videoRef.current.play().catch(() => {});
      }
      setTimeout(() => setPhase("idle"), 600);
    }, 380);
  }, [phase, activeSlides]);

  const advance = useCallback(() => {
    if (phase !== "idle" || showCalibration) return;
    if (slideIdx === TOTAL - 1) { handleEnter(); return; }
    // Trigger calibration before last slide (only on desktop 7-slide flow)
    if (!isMobile && slideIdx === TOTAL - 2) { triggerCalibration(); return; }
    goTo(slideIdx + 1);
  }, [slideIdx, phase, showCalibration, goTo, TOTAL, isMobile]);

  const retreat = useCallback(() => {
    if (phase !== "idle" || showCalibration || slideIdx <= 0) return;
    goTo(slideIdx - 1);
  }, [slideIdx, phase, showCalibration, goTo]);

  const triggerCalibration = () => {
    setShowCalibration(true);
    setCalStep(0);
    [0, 1, 2, 3].forEach((_, i) => {
      setTimeout(() => setCalStep(i + 1), 400 + i * 480);
    });
    setTimeout(() => {
      setShowCalibration(false);
      goTo(TOTAL - 1);
    }, 2600);
  };

  const handleEnter = () => {
    if (done) return;
    setDone(true);
    setDissolving(true);
    if (!isReplay) {
      completeOnboarding.mutate(undefined, {
        onSettled: () => setTimeout(onComplete, 900),
      });
    } else {
      setTimeout(onComplete, 900);
    }
  };

  const handleSkip = () => {
    if (done) return;
    setDone(true);
    if (!isReplay) {
      completeOnboarding.mutate(undefined, { onSettled: onComplete });
    } else {
      onComplete();
    }
  };

  const CAL_ITEMS = [
    "Mapping your pipeline intelligence",
    "Loading Specter's strategy engine",
    "Calibrating your operator profile",
    "The House is ready",
  ];

  const slideNum = slideIdx + 1;

  return (
    <div
      className="oh3-root"
      onTouchStart={handleTouchStart}
      onTouchEnd={handleTouchEnd}
      style={done ? { pointerEvents: "none" } : undefined}
    >
      {/* ── Video layer: Specter IS the background ── */}
      <div className={`oh3-video-layer${currentSlide.portrait !== false ? " portrait" : ""}${videoFading ? " fading" : ""}`}>
        <video
          ref={videoRef}
          src={CLIP_URLS[currentSlide.clip]}
          autoPlay
          muted
          loop
          playsInline
          preload="auto"
        />
      </div>

      {/* ── Dark gradient overlay ── */}
      <div className="oh3-overlay" />

      {/* ── Calibration screen ── */}
      {showCalibration && (
        <div className="oh3-calibration">
          <div className="oh3-cal-label">Specter is calibrating your House</div>
          <div className="oh3-cal-track">
            <div className="oh3-cal-fill" />
          </div>
          <div className="oh3-cal-items">
            {CAL_ITEMS.map((item, i) => (
              <div
                key={i}
                className={`oh3-cal-item${calStep > i ? " visible" : ""}`}
                style={{ animationDelay: `${i * 0.08}s` }}
              >
                {calStep > i ? "✓ " : ""}{item}
              </div>
            ))}
          </div>
        </div>
      )}

      {/* ── Text panel: floats over the video ── */}
      {!showCalibration && (
        <div className="oh3-text-panel">
          <div
            key={`slide-${slideIdx}`}
            className={phase === "entering" ? "oh3-slide-enter" : phase === "exiting" ? "oh3-slide-exit" : ""}
          >
            {/* Eyebrow */}
            <div className={`oh3-eyebrow${textActive ? " visible" : ""}`}>
              {currentSlide.eyebrow}
            </div>

            {/* Headline — word by word */}
            <h1 className="oh3-headline">
              {headlineWords.map((word, i) => (
                <span
                  key={i}
                  className={`oh3-word${headlineVisible > i ? " visible" : ""}`}
                >
                  {i > 0 ? " " : ""}{word}
                </span>
              ))}
            </h1>

            {/* Body */}
            <p className={`oh3-body${bodyVisible ? " visible" : ""}`}>
              {currentSlide.body}
            </p>

            {/* Controls */}
            <div className={`oh3-controls${bodyVisible ? " visible" : ""}`}>
              {currentSlide.cta ? (
                <button className="oh3-cta" onClick={handleEnter}>
                  {currentSlide.cta}
                </button>
              ) : (
                <button
                  className={`oh3-next${nextTapped ? " tapped" : ""}`}
                  onClick={() => {
                    setNextTapped(true);
                    setTimeout(() => setNextTapped(false), 300);
                    advance();
                  }}
                  aria-label="Next slide"
                >
                  →
                </button>
              )}
            </div>
          </div>
        </div>
      )}

      {/* ── Skip — ✕ icon only, no label ── */}
      {!showCalibration && slideIdx < TOTAL - 1 && (
        <button className="oh3-skip" onClick={handleSkip} aria-label="Skip intro">
          ✕
        </button>
      )}

      {/* ── Slide counter ── */}
      {!showCalibration && (
        <div className="oh3-counter">
          {String(slideNum).padStart(2, "0")} / {String(TOTAL).padStart(2, "0")}
        </div>
      )}

      {/* ── Dissolve-to-dashboard ── */}
      <div className={`oh3-dissolve${dissolving ? " active" : ""}`} />
    </div>
  );
}
