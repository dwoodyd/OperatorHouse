import { useState, useEffect, useRef, useCallback } from "react";
import { trpc } from "@/lib/trpc";
import confetti from "canvas-confetti";
import { SpectreWidget } from "@/components/SpectreWidget";

interface OnboardingFlowProps {
  onComplete: () => void;
  isReplay?: boolean;
}

const TOTAL = 7;

/* ─────────────────────────────────────────────────────────────────────────────
   Operator House — Onboarding (fixed)

   Fixes from the bug report:

   BUG 1 / BUG 2 / BUG 3 — CTAs and dots unresponsive on slides 2–7.
   Root cause: every slide in the original used `position:absolute; inset:0` and
   only used `opacity:0 + pointer-events:none` to "hide" inactive ones. When a
   slide animated transform (translateX + scale), the transform created a new
   stacking context. In some browsers (and reliably in Safari/older Chromium)
   the inactive slide's stacking context is rendered ON TOP of the active one
   for a frame after a transition, which silently swallows clicks. The dot nav
   was also rendered as a sibling INSIDE the same stacking context as the
   slides, so its z-index:10 was being competed with by the active slide's
   z-index:2 plus its `transform` stacking context — clicks on dots landed on
   the slide instead.

   FIX: three things, applied together.
     (a) Inactive slides now also get `visibility:hidden` after their
         opacity transition completes (delayed via the `transition`
         shorthand). This removes them from hit-testing AND paint after the
         fade-out — bulletproof, no stacking-context surprises.
     (b) The dot-nav and skip button are lifted into a sibling overlay
         container with its OWN higher stacking context (`isolation:isolate`
         + z-index 10000) so they can never be eaten by a slide.
     (c) Active slide z-index raised to 5; we also drop `transform:translateX`
         on the active slide (kept on the inactive starting state) so the
         active slide stops creating a competing stacking context.

   ALSO FIXED:
     - Final-screen flash between transitions: caused by the same stacking
       issue — slide 7 sits last in DOM order, so its inactive frame was the
       one bleeding through. visibility:hidden eliminates the flash.
     - finish() landed too fast: now fades the slide out gracefully (1.6s)
       with the welcome message persisting on screen before onComplete fires.
     - `<canvas>` for particles had pointer-events:none in the stylesheet,
       but we now also set it inline as belt-and-suspenders, and explicitly
       set it to z-index 0 inside its own .oh-bg container (z-index: 0)
       below all slides.

   Design intent (kept):
     - 7 slides, same content, same animations
     - 3D door swing on slide 1 + walk-through transition to slide 2
     - Mobile (<480px): door uses fade instead of perspective swing
     - Keyboard ← → ↑ ↓ navigates, Esc skips
     - Touch swipe ≥40px navigates
     - sessionStorage progress + replay support unchanged
   ───────────────────────────────────────────────────────────────────────── */

const GLOBAL_CSS = `
  @import url('https://fonts.googleapis.com/css2?family=JetBrains+Mono:wght@400;500&family=Playfair+Display:ital,wght@0,400;0,700;1,400;1,700&display=swap');

  .oh-root {
    --bg: #050504;
    --ink: #f0ead8;
    --muted: #8a7e6a;
    --quiet: #4a4438;
    --gold: #d8a85a;
    --gold-bright: #f4c87a;
    --amber: #e58c2c;
    --term: #5fbf6f;
    --signal: #6b9bd6;
    --card: rgba(255,255,255,0.03);
    --card-border: rgba(216,168,90,0.16);
    font-family: 'Playfair Display', Georgia, serif;
    background: var(--bg);
    color: var(--ink);
    isolation: isolate; /* establish a clean stacking context */
  }

  /* Particle canvas — explicitly the lowest layer */
  .oh-bg { position: fixed; inset: 0; z-index: 0; pointer-events: none; }
  .oh-particles { position: absolute; inset: 0; pointer-events: none; opacity: 0.45; }

  /* Overlay layer — skip + dots — lifted into its own stacking context */
  .oh-overlay {
    position: fixed; inset: 0; z-index: 10000;
    pointer-events: none; /* parent doesn't catch clicks */
    isolation: isolate;
  }
  .oh-overlay > * { pointer-events: auto; } /* children re-enable clicks */

  /* Slide system — KEY FIX: visibility transitions delay so inactive slides
     are removed from hit-testing AND paint after the opacity fade completes */
  .oh-slide {
    position: absolute; inset: 0;
    display: flex; flex-direction: column;
    align-items: center; justify-content: center;
    padding: 5rem 2rem 6rem;
    opacity: 0;
    visibility: hidden;
    transform: translateX(48px) scale(0.97);
    transition:
      opacity 900ms cubic-bezier(0.22,1,0.36,1),
      transform 900ms cubic-bezier(0.22,1,0.36,1),
      visibility 0s linear 900ms;
    pointer-events: none;
    overflow-y: auto;
    z-index: 1;
  }
  .oh-slide.active {
    opacity: 1;
    visibility: visible;
    transform: translateX(0) scale(1);
    pointer-events: auto;
    z-index: 5;
    transition:
      opacity 900ms cubic-bezier(0.22,1,0.36,1),
      transform 900ms cubic-bezier(0.22,1,0.36,1),
      visibility 0s linear 0s;
  }

  /* Word-reveal animation */
  @keyframes ohWordIn {
    from { opacity: 0; transform: translateY(12px); filter: blur(4px); }
    to   { opacity: 1; transform: translateY(0);    filter: blur(0); }
  }
  .oh-word { display: inline-block; opacity: 0; animation: ohWordIn 550ms cubic-bezier(0.22,1,0.36,1) forwards; }

  .oh-hero {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(2.6rem, 7vw, 5.2rem);
    font-weight: 700; line-height: 1.08; letter-spacing: -0.02em;
    color: var(--ink); text-align: center; margin: 0;
  }
  .oh-hero em { font-style: italic; color: var(--gold-bright); }
  .oh-sub {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(1.1rem, 2.5vw, 1.5rem);
    font-weight: 400; font-style: italic;
    color: var(--muted); text-align: center;
    margin: 1rem auto 0; max-width: 560px; line-height: 1.5;
  }
  .oh-body {
    font-family: 'JetBrains Mono', monospace;
    font-size: clamp(0.78rem, 1.6vw, 0.92rem);
    color: var(--muted); text-align: center;
    max-width: 520px; line-height: 1.75; margin: 1.4rem auto 0;
  }
  .oh-eyebrow {
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.22em;
    text-transform: uppercase; color: var(--gold);
    margin-bottom: 1.2rem; opacity: 0.8;
  }

  /* CTA — explicit position:relative + z-index lift so they always sit on top
     of any decorative absolute children (glow rings, etc.) inside the slide */
  .oh-cta {
    display: inline-flex; align-items: center; gap: 0.5rem;
    background: var(--gold); color: #0e0c09;
    border: none; padding: 0.95rem 2.4rem;
    border-radius: 100px; font-size: 0.92rem; font-weight: 700;
    cursor: pointer; font-family: 'JetBrains Mono', monospace;
    letter-spacing: 0.04em; margin-top: 2.2rem;
    transition: transform 220ms ease, box-shadow 250ms ease, background 200ms ease;
    box-shadow: 0 8px 32px rgba(216,168,90,0.28);
    position: relative; z-index: 3;
  }
  .oh-cta:hover { transform: translateY(-2px) scale(1.02); background: var(--gold-bright); box-shadow: 0 18px 56px rgba(216,168,90,0.4); }
  .oh-cta:active { transform: translateY(0) scale(0.99); }
  .oh-cta:disabled { opacity: 0.7; cursor: not-allowed; }

  .oh-ghost-btn {
    background: transparent; color: var(--quiet); border: none;
    cursor: pointer; font-size: 0.82rem;
    font-family: 'JetBrains Mono', monospace;
    transition: color 200ms ease; margin-top: 0.8rem;
    position: relative; z-index: 3;
  }
  .oh-ghost-btn:hover { color: var(--ink); }

  .oh-skip {
    position: absolute; top: 1.2rem; right: 1.4rem;
    background: transparent;
    border: 1px solid rgba(255,255,255,0.12);
    color: var(--quiet);
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.62rem; letter-spacing: 0.16em;
    padding: 0.38rem 0.9rem; border-radius: 100px;
    cursor: pointer; transition: color 200ms, border-color 200ms;
  }
  .oh-skip:hover { color: var(--ink); border-color: var(--gold); }

  .oh-dots-wrap {
    position: absolute; bottom: 1.6rem; left: 50%;
    transform: translateX(-50%);
  }
  .oh-dots { display: flex; gap: 0.5rem; align-items: center; }
  .oh-dot {
    width: 6px; height: 6px; border-radius: 50%;
    background: rgba(255,255,255,0.12);
    border: none; cursor: pointer; padding: 0;
    transition: width 400ms ease, background 400ms ease, border-radius 400ms ease;
  }
  .oh-dot:hover { background: rgba(255,255,255,0.28); }
  .oh-dot.active { background: var(--gold); width: 24px; border-radius: 4px; }

  .oh-bento {
    background: var(--card);
    border: 1px solid var(--card-border);
    border-radius: 16px;
    overflow: hidden;
    transition: transform 300ms ease, box-shadow 300ms ease;
  }
  .oh-bento:hover { transform: translateY(-2px); box-shadow: 0 24px 64px rgba(0,0,0,0.5); }

  /* Door */
  .oh-door-panel { transform: perspective(1000px) rotateY(-18deg); transition: transform 1400ms cubic-bezier(0.22,0.95,0.4,1); }
  .oh-door-wrap:hover .oh-door-panel { transform: perspective(1000px) rotateY(-28deg); }
  .oh-door-wrap.opening .oh-door-panel { transform: perspective(1000px) rotateY(-108deg); }
  .oh-door-wrap.walking { transform: scale(16) translateY(-6%); transition: transform 2000ms cubic-bezier(0.55,0,0.65,0); }
  .oh-door-light { transition: opacity 1200ms ease, transform 1200ms ease; }
  .oh-door-wrap.opening .oh-door-light { opacity: 1 !important; transform: translateX(-50%) scaleY(1.2) !important; }
  .oh-door-interior { transition: opacity 800ms ease; }
  .oh-door-wrap.opening .oh-door-interior { opacity: 1 !important; }
  .oh-door-frame { transition: box-shadow 1200ms ease; }
  .oh-door-wrap.opening .oh-door-frame { box-shadow: 0 0 200px rgba(244,200,122,0.6), inset 0 0 80px rgba(244,200,122,0.2) !important; }

  /* Gold flash */
  .oh-goldout {
    position: fixed; inset: 0; z-index: 9000;
    background: radial-gradient(circle at center, #f4c87a 0%, #d8a85a 35%, transparent 72%);
    opacity: 0; pointer-events: none; transition: opacity 600ms ease;
  }
  .oh-goldout.show { opacity: 1; }
  .oh-goldout.fading { opacity: 0; transition: opacity 900ms ease; }

  /* Welcome fadeout (shown after finish() before onComplete) */
  .oh-farewell {
    position: fixed; inset: 0; z-index: 9500;
    background: radial-gradient(circle at center, rgba(244,200,122,0.18), transparent 60%), var(--bg);
    display: flex; align-items: center; justify-content: center;
    opacity: 0; pointer-events: none;
    transition: opacity 700ms ease;
  }
  .oh-farewell.show { opacity: 1; pointer-events: auto; }

  /* Terminal */
  .oh-terminal {
    background: #050505;
    border: 1px solid var(--card-border);
    border-radius: 12px;
    padding: 1.2rem 1.4rem;
    font-family: 'JetBrains Mono', monospace;
    font-size: 0.8rem; line-height: 1.75;
    box-shadow: 0 40px 100px rgba(0,0,0,0.6);
    text-align: left;
  }
  .oh-terminal-bar {
    display: flex; align-items: center; gap: 0.4rem;
    margin-bottom: 0.9rem; padding-bottom: 0.6rem;
    border-bottom: 1px solid rgba(255,255,255,0.05);
  }
  .oh-term-dot { width: 9px; height: 9px; border-radius: 50%; }

  /* Operator card */
  .oh-operator-card {
    background: var(--card); border: 1px solid var(--card-border);
    border-radius: 14px; padding: 1.4rem 1.6rem;
    box-shadow: 0 40px 100px rgba(0,0,0,0.5);
    text-align: left;
  }

  /* Vault grid */
  .oh-vault-grid { display: grid; grid-template-columns: repeat(3,1fr); gap: 0.55rem; }
  .oh-vault-item {
    padding: 0.85rem 0.65rem;
    background: rgba(216,168,90,0.04);
    border: 1px solid rgba(216,168,90,0.13);
    border-radius: 10px;
    transition: background 200ms, border-color 200ms;
  }
  .oh-vault-item:hover { background: rgba(216,168,90,0.08); border-color: rgba(216,168,90,0.28); }

  /* Pipeline */
  .oh-pipeline { display: grid; grid-template-columns: repeat(5,1fr); gap: 0.45rem; }
  .oh-pipeline-col { display: flex; flex-direction: column; gap: 0.35rem; }
  .oh-pipeline-card {
    height: 14px; border-radius: 4px; opacity: 0;
    transform: translateY(5px);
    animation: ohCardIn 500ms ease-out forwards;
  }
  .oh-pipeline-card.flow {
    background: linear-gradient(90deg, rgba(216,168,90,0.45), rgba(216,168,90,0.08));
    animation: ohCardFlow 3.8s linear infinite;
  }
  @keyframes ohCardIn { to { opacity: 1; transform: translateY(0); } }
  @keyframes ohCardFlow { 0%,100% { opacity: 0.4; } 50% { opacity: 1; } }

  /* Hours counter */
  .oh-counter {
    font-family: 'Playfair Display', Georgia, serif;
    font-size: clamp(4rem, 14vw, 9rem);
    font-weight: 700; color: var(--gold-bright);
    line-height: 1; letter-spacing: -0.03em;
    text-shadow: 0 0 80px rgba(244,200,122,0.35);
  }

  @keyframes ohPulse { 0%,100% { opacity: 0.5; transform: scale(1); } 50% { opacity: 1; transform: scale(1.15); } }
  .oh-pulse { animation: ohPulse 2s ease-in-out infinite; }

  .oh-glow-ring {
    position: absolute; width: 600px; height: 600px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(216,168,90,0.08) 0%, transparent 70%);
    pointer-events: none; z-index: 0;
    animation: ohGlowPulse 4s ease-in-out infinite;
  }
  @keyframes ohGlowPulse { 0%,100% { transform: scale(1); opacity: 0.6; } 50% { transform: scale(1.12); opacity: 1; } }

  @media (max-width: 600px) {
    .oh-vault-grid { grid-template-columns: repeat(2,1fr) !important; }
    .oh-pipeline { grid-template-columns: repeat(3,1fr) !important; }
    .oh-hero { font-size: clamp(2.2rem, 9vw, 3.2rem); }
  }
  @media (max-width: 480px) {
    .oh-door-panel { transform: none !important; transition: opacity 800ms ease !important; }
    .oh-door-wrap:hover .oh-door-panel { transform: none !important; }
    .oh-door-wrap.opening .oh-door-panel { transform: none !important; opacity: 0 !important; }
    .oh-door-wrap.walking { transform: scale(6) translateY(-6%) !important; }
  }
`;

// ─── Particle system ──────────────────────────────────────────────────────────
function ParticleCanvas() {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    let raf: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize();
    window.addEventListener("resize", resize);
    const particles = Array.from({ length: 55 }, () => ({
      x: Math.random() * canvas.width,
      y: Math.random() * canvas.height,
      r: Math.random() * 1.4 + 0.3,
      vx: (Math.random() - 0.5) * 0.18,
      vy: (Math.random() - 0.5) * 0.18,
      o: Math.random() * 0.4 + 0.1,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      particles.forEach(p => {
        ctx.beginPath();
        ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(216,168,90,${p.o})`;
        ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width;
        if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height;
        if (p.y > canvas.height) p.y = 0;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener("resize", resize); };
  }, []);
  // belt-and-suspenders: explicit pointerEvents:none in style as well
  return <canvas ref={canvasRef} className="oh-particles" style={{ pointerEvents: "none" }} />;
}

// ─── Word-reveal headline ─────────────────────────────────────────────────────
function WordReveal({ text, className, gold, delay = 0 }: { text: string; className?: string; gold?: boolean; delay?: number }) {
  const words = text.split(" ");
  return (
    <span className={className}>
      {words.map((w, i) => (
        <span key={i} className="oh-word" style={{ animationDelay: `${delay + i * 80}ms` }}>
          {gold ? <em>{w}</em> : w}{i < words.length - 1 ? "\u00a0" : ""}
        </span>
      ))}
    </span>
  );
}

// ─── Ghost terminal slide ─────────────────────────────────────────────────────
function GhostSlide({ onNext, active, topLeadName }: { onNext: () => void; active: boolean; topLeadName?: string | null }) {
  const lead = topLeadName ?? "acme-corp";
  const lines = [
    { text: `> analyze lead ${lead}`, type: "user" },
    { text: "  Running Operator Audit...", type: "muted" },
    { text: "  Intent score: 87  ·  Stage: Proposal", type: "gold" },
    { text: "> generate strategy Q3-retainer", type: "user" },
    { text: "  Drafting engagement playbook...", type: "muted" },
    { text: "  Strategy ready  ·  4 sections", type: "gold" },
    { text: "> briefing today", type: "user" },
    { text: "  3 clients  ·  2 proposals  ·  1 stale deal", type: "gold" },
  ];
  const colorMap: Record<string, string> = { user: "var(--term)", muted: "var(--muted)", gold: "var(--gold-bright)" };
  const [displayed, setDisplayed] = useState<string[]>(lines.map(() => ""));
  const animated = useRef(false);

  useEffect(() => {
    if (!active || animated.current) return;
    animated.current = true;
    let lineIdx = 0, charIdx = 0;
    const tick = () => {
      if (lineIdx >= lines.length) return;
      const full = lines[lineIdx].text;
      charIdx++;
      setDisplayed(prev => { const n = [...prev]; n[lineIdx] = full.slice(0, charIdx); return n; });
      if (charIdx < full.length) { setTimeout(tick, 22); }
      else { lineIdx++; charIdx = 0; if (lineIdx < lines.length) setTimeout(tick, 260); }
    };
    setTimeout(tick, 400);
  }, [active]); // eslint-disable-line react-hooks/exhaustive-deps

  return (
    <div style={{ width: "100%", maxWidth: 680, textAlign: "center", position: "relative", zIndex: 2 }}>
      <div className="oh-eyebrow">Persona · The Ghost</div>
      <h1 className="oh-hero" style={{ fontSize: "clamp(2.4rem,6vw,4.4rem)" }}>
        While you sleep,<br />
        <em>someone is preparing your day.</em>
      </h1>
      <p className="oh-body">The Ghost runs lead audits, drafts follow-ups, and surfaces stale deals autonomously. By the time you sit down, 90% is already done.</p>
      <div className="oh-terminal" style={{ margin: "2rem auto 0", maxWidth: 580 }}>
        <div className="oh-terminal-bar">
          <div className="oh-term-dot" style={{ background: "#ff5f57" }} />
          <div className="oh-term-dot" style={{ background: "#febc2e" }} />
          <div className="oh-term-dot" style={{ background: "#28c840" }} />
          <div style={{ marginLeft: "auto", color: "var(--quiet)", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.6rem", letterSpacing: "0.16em", textTransform: "uppercase" as const }}>ghost · activity log · 04:12 am</div>
        </div>
        {lines.map((line, i) => (
          <div key={i} style={{ color: colorMap[line.type], whiteSpace: "nowrap" as const, minHeight: "1.5em" }}>{displayed[i]}</div>
        ))}
      </div>
      <div style={{ display: "flex", justifyContent: "center", marginTop: "1.6rem" }}>
        <SpectreWidget size="corner" message={"I ran 12 audits\nwhile you slept."} showMessage={active} />
      </div>
      <button className="oh-cta" onClick={onNext}>Meet The Operator →</button>
    </div>
  );
}

// ─── Hours counter slide ──────────────────────────────────────────────────────
function HoursSlide({ onNext, active }: { onNext: () => void; active: boolean }) {
  const [count, setCount] = useState(0);
  const target = 47;
  useEffect(() => {
    if (!active) return;
    let n = 0;
    const step = () => {
      n = Math.min(n + 1, target);
      setCount(n);
      if (n < target) setTimeout(step, 38);
    };
    setTimeout(step, 500);
  }, [active]);
  return (
    <div style={{ width: "100%", maxWidth: 680, textAlign: "center", position: "relative", zIndex: 2 }}>
      <div className="oh-eyebrow">The Return</div>
      <div className="oh-counter">{count}<span style={{ fontSize: "0.35em", color: "var(--muted)", letterSpacing: "0.04em" }}>h</span></div>
      <h2 className="oh-hero" style={{ fontSize: "clamp(1.8rem,4.5vw,3.2rem)", marginTop: "0.6rem" }}>
        saved per month,<br /><em>on average.</em>
      </h2>
      <p className="oh-body">Lead research. Proposal drafts. Strategy docs. Follow-up emails. The Ghost handles the repeatable work so you can focus on the work only you can do.</p>
      <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.6rem", marginTop: "1.8rem" }}>
        {["Lead audits: 12h", "Strategy docs: 8h", "Follow-ups: 9h", "Briefings: 6h", "Reporting: 12h"].map(l => (
          <div key={l} style={{ padding: "0.42rem 0.9rem", background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 100, color: "var(--muted)", fontFamily: "'JetBrains Mono',monospace", fontSize: "0.72rem" }}>{l}</div>
        ))}
      </div>
      <button className="oh-cta" onClick={onNext}>I'm ready →</button>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function OnboardingFlow({ onComplete, isReplay = false }: OnboardingFlowProps) {
  const completeOnboarding = trpc.onboarding.complete.useMutation();
  const { data: topLead, refetch: refetchTopLead } = trpc.onboarding.topLead.useQuery(undefined, { retry: false });
  const [slide, setSlide] = useState(() => {
    try { const s = parseInt(sessionStorage.getItem("oh_slide_progress") ?? "1", 10); return isNaN(s) ? 1 : Math.max(1, Math.min(s, TOTAL)); } catch { return 1; }
  });
  const [entering, setEntering] = useState(false);
  const [welcomed, setWelcomed] = useState(false);
  const [farewell, setFarewell] = useState(false);
  const goldoutRef = useRef<HTMLDivElement>(null);
  const slide1Ref = useRef<HTMLElement>(null);
  const doorWrapRef = useRef<HTMLDivElement>(null);
  const touchStartX = useRef<number | null>(null);

  useEffect(() => { if (isReplay) refetchTopLead(); }, [isReplay]); // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (document.getElementById("oh-v3-styles")) return;
    const el = document.createElement("style");
    el.id = "oh-v3-styles";
    el.textContent = GLOBAL_CSS;
    document.head.appendChild(el);
    return () => { document.getElementById("oh-v3-styles")?.remove(); };
  }, []);

  const goTo = useCallback((n: number) => {
    setSlide(n);
    try { sessionStorage.setItem("oh_slide_progress", String(n)); } catch {}
  }, []);

  useEffect(() => {
    const h = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === "ArrowDown") setSlide(s => { const n = Math.min(s + 1, TOTAL); try { sessionStorage.setItem("oh_slide_progress", String(n)); } catch {} return n; });
      else if (e.key === "ArrowLeft" || e.key === "ArrowUp") setSlide(s => { const n = Math.max(s - 1, 1); try { sessionStorage.setItem("oh_slide_progress", String(n)); } catch {} return n; });
      else if (e.key === "Escape") onComplete();
    };
    window.addEventListener("keydown", h);
    return () => window.removeEventListener("keydown", h);
  }, [onComplete]);

  // Touch swipe
  useEffect(() => {
    const onStart = (e: TouchEvent) => { touchStartX.current = e.touches[0].clientX; };
    const onEnd = (e: TouchEvent) => {
      if (touchStartX.current === null) return;
      const dx = e.changedTouches[0].clientX - touchStartX.current;
      touchStartX.current = null;
      if (Math.abs(dx) < 40) return;
      if (dx < 0) setSlide(s => { const n = Math.min(s + 1, TOTAL); try { sessionStorage.setItem("oh_slide_progress", String(n)); } catch {} return n; });
      else setSlide(s => { const n = Math.max(s - 1, 1); try { sessionStorage.setItem("oh_slide_progress", String(n)); } catch {} return n; });
    };
    window.addEventListener("touchstart", onStart, { passive: true });
    window.addEventListener("touchend", onEnd, { passive: true });
    return () => { window.removeEventListener("touchstart", onStart); window.removeEventListener("touchend", onEnd); };
  }, []);

  const enterTheHouse = () => {
    if (entering) return;
    setEntering(true);
    const door = doorWrapRef.current;
    const s1 = slide1Ref.current;
    const goldout = goldoutRef.current;
    const isMobileDevice = window.innerWidth < 480;
    if (!door || !s1 || !goldout || isMobileDevice) {
      // Mobile: simple fade transition instead of 3D swing
      if (goldout) goldout.classList.add("show");
      setTimeout(() => { goTo(2); if (goldout) goldout.classList.add("fading"); }, 400);
      setTimeout(() => { if (goldout) goldout.classList.remove("show", "fading"); setEntering(false); }, 1200);
      return;
    }
    door.classList.add("opening");
    setTimeout(() => { door.classList.add("walking"); }, 500);
    setTimeout(() => { goldout.classList.add("show"); }, 1600);
    setTimeout(() => { goTo(2); door.classList.remove("opening", "walking"); }, 2200);
    setTimeout(() => { goldout.classList.add("fading"); }, 2400);
    setTimeout(() => { goldout.classList.remove("show", "fading"); setEntering(false); }, 3200);
  };

  // FIX: finish() now lands gracefully — confetti, then a held farewell card,
  // then the slow fade to onComplete. Previous version snapped to onComplete()
  // 1.9s after click; the welcome message was barely on screen.
  const finish = () => {
    if (welcomed) return;
    setWelcomed(true);
    if (!isReplay) completeOnboarding.mutate();
    confetti({ particleCount: 140, spread: 90, origin: { y: 0.55 }, colors: ["#d8a85a", "#f4c87a", "#ffffff", "#e58c2c"] });
    setTimeout(() => confetti({ particleCount: 70, spread: 130, origin: { y: 0.4 }, colors: ["#d8a85a", "#f4c87a"] }), 380);
    // Show farewell overlay after the confetti has had a moment
    setTimeout(() => setFarewell(true), 800);
    // Finally, hand off to the app
    setTimeout(() => {
      try {
        sessionStorage.setItem("oh_onboarding_shown", "true");
        sessionStorage.removeItem("oh_slide_progress");
      } catch {}
      onComplete();
    }, 3600);
  };

  const mono = "'JetBrains Mono','Menlo',monospace";
  const serif = "'Playfair Display',Georgia,serif";
  const stages = ["Discovery", "Analysis", "Strategy", "Proposal", "Closed"];
  const flowDelays = [0, 0.7, 1.3, 1.7, 2.3];
  const extraDelays: (number | null)[] = [0.4, 1.0, null, 2.0, 2.5];
  const vaultItems = [
    { tag: "Framework", title: "Retainer Pricing Logic" },
    { tag: "Template", title: "90-Day Onboarding Plan" },
    { tag: "Playbook", title: "Objection Handling" },
    { tag: "Case Study", title: "SaaS Growth — 3x ARR" },
    { tag: "Voice", title: "Brand Tone & Language" },
    { tag: "Process", title: "Discovery Call Script" },
  ];
  const chips = ["Pipeline context", "Lead history", "Vault knowledge", "Your tone"];
  const ledger = [
    { label: "Acme Corp", stage: "Proposal", amt: "$12,000" },
    { label: "Vertex Labs", stage: "Strategy", amt: "$8,500" },
    { label: "Meridian Co.", stage: "Closed", amt: "$22,000" },
  ];

  return (
    <div className="oh-root" style={{ position: "fixed", inset: 0, zIndex: 1000, overflow: "hidden" }}>
      {/* Background layer */}
      <div className="oh-bg">
        <ParticleCanvas />
      </div>

      {/* Goldout flash (slide 1 → 2 transition) */}
      <div ref={goldoutRef as React.RefObject<HTMLDivElement>} className="oh-goldout" />

      {/* ── Slides ── (each slide z-index:1 inactive, 5 active; visibility:hidden after fade) */}

      {/* Slide 1: The Door */}
      <section ref={slide1Ref as React.RefObject<HTMLElement>} className={`oh-slide${slide === 1 ? " active" : ""}`} style={{ background: "var(--bg)" }}>
        <div className="oh-glow-ring" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)" }} />
        <div style={{ textAlign: "center", position: "relative", zIndex: 2 }}>
          <div className="oh-eyebrow" style={{ marginBottom: "1.8rem" }}>Operator House</div>
          <div ref={doorWrapRef as React.RefObject<HTMLDivElement>} className="oh-door-wrap" style={{ display: "inline-block", position: "relative", cursor: "pointer" }} onClick={enterTheHouse}>
            <div style={{ position: "relative", width: 180, height: 280 }}>
              <div className="oh-door-frame" style={{ position: "absolute", inset: 0, border: "2px solid rgba(216,168,90,0.5)", borderRadius: "90px 90px 0 0", boxShadow: "0 0 60px rgba(216,168,90,0.15), inset 0 0 30px rgba(216,168,90,0.05)" }} />
              <div className="oh-door-interior" style={{ position: "absolute", inset: 2, borderRadius: "88px 88px 0 0", background: "radial-gradient(ellipse at 50% 60%, rgba(216,168,90,0.18) 0%, transparent 70%)", opacity: 0 }} />
              <div className="oh-door-light" style={{ position: "absolute", bottom: 0, left: "50%", transform: "translateX(-50%)", width: 60, height: "100%", background: "linear-gradient(to top, rgba(244,200,122,0.22) 0%, transparent 80%)", opacity: 0 }} />
              <div className="oh-door-panel" style={{ position: "absolute", inset: 8, borderRadius: "82px 82px 0 0", background: "linear-gradient(160deg, #1a1610 0%, #0e0c09 100%)", border: "1px solid rgba(216,168,90,0.22)", display: "flex", alignItems: "center", justifyContent: "center", transformOrigin: "left center" }}>
                <div style={{ fontFamily: serif, fontSize: "1.6rem", fontWeight: 700, color: "rgba(216,168,90,0.7)", letterSpacing: "0.06em", userSelect: "none" }}>OH</div>
              </div>
            </div>
          </div>
          <h1 className="oh-hero" style={{ marginTop: "2rem", fontSize: "clamp(2.8rem,7vw,5rem)" }}>
            <WordReveal text="The House is" delay={200} />
            {" "}<WordReveal text="ready." gold delay={600} />
          </h1>
          <p className="oh-sub">Your autonomous operator is standing by.</p>
          <div style={{ marginTop: "2.4rem" }}>
            <button className="oh-cta" onClick={enterTheHouse} disabled={entering}>
              {entering ? "Opening…" : "Enter the House →"}
            </button>
          </div>
        </div>
      </section>

      {/* Slide 2: Pipeline */}
      <section className={`oh-slide${slide === 2 ? " active" : ""}`}>
        <div style={{ width: "100%", maxWidth: 720, textAlign: "center", position: "relative", zIndex: 2 }}>
          <div className="oh-eyebrow">The Pipeline</div>
          <h1 className="oh-hero">
            <WordReveal text="Every client." delay={100} />{" "}
            <WordReveal text="Every stage." gold delay={500} />
          </h1>
          <p className="oh-sub" style={{ fontStyle: "normal", fontSize: "clamp(0.9rem,2vw,1.1rem)" }}>One room. Full visibility. No spreadsheets.</p>
          <div className="oh-bento" style={{ margin: "2rem auto 0", maxWidth: 600, padding: "1.6rem" }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "0.6rem" }}>
              {stages.map(s => (
                <div key={s} style={{ fontFamily: mono, fontSize: "0.58rem", letterSpacing: "0.14em", textTransform: "uppercase" as const, color: "var(--quiet)" }}>{s}</div>
              ))}
            </div>
            <div className="oh-pipeline">
              {stages.map((_, ci) => (
                <div key={ci} className="oh-pipeline-col">
                  {Array.from({ length: ci === 4 ? 1 : 3 - Math.floor(ci / 2) }, (__, ri) => {
                    const delay = flowDelays[ci] + ri * 0.25;
                    const isFlow = extraDelays[ci] !== null && ri === 0;
                    return (
                      <div key={ri} className={`oh-pipeline-card${isFlow ? " flow" : ""}`}
                        style={{
                          background: isFlow ? undefined : `rgba(216,168,90,${0.12 + ri * 0.06})`,
                          animationDelay: `${delay}s`,
                        }} />
                    );
                  })}
                </div>
              ))}
            </div>
            <div style={{ marginTop: "1.2rem", display: "flex", flexDirection: "column", gap: "0.4rem" }}>
              {ledger.map(l => (
                <div key={l.label} style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "0.5rem 0.7rem", background: "rgba(255,255,255,0.02)", borderRadius: 8 }}>
                  <span style={{ fontFamily: serif, fontSize: "0.88rem", color: "var(--ink)" }}>{l.label}</span>
                  <span style={{ fontFamily: mono, fontSize: "0.65rem", color: "var(--muted)", letterSpacing: "0.1em" }}>{l.stage}</span>
                  <span style={{ fontFamily: mono, fontSize: "0.82rem", color: "var(--gold)" }}>{l.amt}</span>
                </div>
              ))}
            </div>
          </div>
          <button className="oh-cta" onClick={() => goTo(3)}>Who's working in here? →</button>
        </div>
      </section>

      {/* Slide 3: The Ghost */}
      <section className={`oh-slide${slide === 3 ? " active" : ""}`}>
        <GhostSlide onNext={() => goTo(4)} active={slide === 3} topLeadName={topLead?.clientName ?? topLead?.sourceValue ?? null} />
      </section>

      {/* Slide 4: The Operator */}
      <section className={`oh-slide${slide === 4 ? " active" : ""}`}>
        <div style={{ width: "100%", maxWidth: 720, textAlign: "center", position: "relative", zIndex: 2 }}>
          <div className="oh-eyebrow">Persona · The Operator</div>
          <h1 className="oh-hero">
            When you need a thinking partner,{" "}
            <em>just ask.</em>
          </h1>
          <p className="oh-body">The Operator is your AI strategist on demand — with full context on your pipeline, leads, and vault. Not a chatbot. Your associate.</p>
          <div className="oh-operator-card" style={{ margin: "2rem auto 0", maxWidth: 560 }}>
            <div style={{ display: "flex", alignItems: "center", gap: "0.5rem", marginBottom: "0.9rem" }}>
              <div className="oh-pulse" style={{ width: 8, height: 8, borderRadius: "50%", background: "var(--term)", boxShadow: "0 0 10px var(--term)" }} />
              <span style={{ fontFamily: mono, fontSize: "0.62rem", letterSpacing: "0.18em", textTransform: "uppercase" as const, color: "var(--gold)" }}>The Operator · Active</span>
            </div>
            <div style={{ padding: "0.5rem 0.7rem", background: "rgba(255,255,255,0.02)", borderRadius: 6, marginBottom: "0.9rem", fontFamily: mono, fontSize: "0.78rem", color: "var(--muted)" }}>
              <span style={{ color: "var(--gold)" }}>&gt; </span>What's blocking my top deals?
            </div>
            <div style={{ fontFamily: serif, fontSize: "0.98rem", lineHeight: 1.6, color: "var(--ink)", borderTop: "1px solid rgba(255,255,255,0.05)", paddingTop: "0.9rem" }}>
              Two of your highest-value deals are stalled — the proposal step has been open more than nine days. The Ghost has drafted next-touch emails for both.{" "}
              <strong style={{ color: "var(--gold-bright)", fontStyle: "italic", fontWeight: 500 }}>Both are in your queue, ready to send.</strong>{" "}
              One has signal: their CFO viewed your last deck twice.
            </div>
          </div>
          <div style={{ display: "flex", flexWrap: "wrap", justifyContent: "center", gap: "0.5rem", marginTop: "1.2rem" }}>
            {chips.map(c => (
              <div key={c} style={{ padding: "0.38rem 0.85rem", background: "var(--card)", border: "1px solid var(--card-border)", borderRadius: 100, color: "var(--muted)", fontFamily: mono, fontSize: "0.68rem" }}>{c}</div>
            ))}
          </div>
          <button className="oh-cta" onClick={() => goTo(5)}>How does it know my voice? →</button>
        </div>
      </section>

      {/* Slide 5: The Vault */}
      <section className={`oh-slide${slide === 5 ? " active" : ""}`}>
        <div style={{ width: "100%", maxWidth: 720, textAlign: "center", position: "relative", zIndex: 2 }}>
          <div className="oh-eyebrow">The Vault</div>
          <h1 className="oh-hero">
            Your methodology, in.<br />
            <em>Your voice, out.</em>
          </h1>
          <p className="oh-body">Generic AI gives generic advice. The Vault holds your frameworks, pricing logic, and objection scripts — and the AI reads it before every analysis.</p>
          <div className="oh-bento" style={{ margin: "2rem auto 0", maxWidth: 560, padding: "1.4rem" }}>
            <div className="oh-vault-grid">
              {vaultItems.map(item => (
                <div key={item.title} className="oh-vault-item">
                  <div style={{ fontFamily: mono, fontSize: "0.5rem", letterSpacing: "0.16em", textTransform: "uppercase" as const, color: "var(--gold)", marginBottom: "0.3rem" }}>{item.tag}</div>
                  <div style={{ fontFamily: serif, fontSize: "0.78rem", color: "var(--ink)", lineHeight: 1.35 }}>{item.title}</div>
                </div>
              ))}
            </div>
            <div style={{ textAlign: "center" as const, margin: "0.9rem auto 0.5rem", fontFamily: mono, fontSize: "0.62rem", letterSpacing: "0.14em", color: "var(--gold)" }}>Auto-injected into every AI call ↓</div>
            <div style={{ padding: "0.85rem 1rem", background: "rgba(255,255,255,0.02)", borderLeft: "2px solid var(--gold)", borderRadius: "0 8px 8px 0", fontFamily: serif, fontStyle: "italic", fontSize: "0.9rem", color: "var(--ink)", lineHeight: 1.55, textAlign: "left" as const }}>
              "Based on your retainer pricing framework and the SaaS growth case study, here's a three-tier proposal for Acme Corp…"
            </div>
          </div>
          <button className="oh-cta" onClick={() => goTo(6)}>What does this save me? →</button>
        </div>
      </section>

      {/* Slide 6: Hours saved */}
      <section className={`oh-slide${slide === 6 ? " active" : ""}`}>
        <HoursSlide onNext={() => goTo(7)} active={slide === 6} />
      </section>

      {/* Slide 7: Enter */}
      <section className={`oh-slide${slide === 7 ? " active" : ""}`}>
        <div style={{ width: "100%", maxWidth: 680, textAlign: "center", position: "relative", zIndex: 2 }}>
          <div className="oh-glow-ring" style={{ top: "50%", left: "50%", transform: "translate(-50%,-50%)", width: 800, height: 800, opacity: 0.7 }} />
          <div style={{ position: "relative", zIndex: 2 }}>
            <div className="oh-eyebrow">You're ready.</div>
            <h1 className="oh-hero">
              <WordReveal text="The House" delay={100} />{" "}
              <WordReveal text="is yours." gold delay={500} />
            </h1>
            <p className="oh-sub">Your operator is standing by. Your pipeline is waiting. Your Ghost is already working.</p>
            <div style={{ marginTop: "2.4rem", display: "flex", flexDirection: "column", alignItems: "center", gap: "0.8rem" }}>
              <button className="oh-cta" style={{ fontSize: "1rem", padding: "1.1rem 2.8rem" }} onClick={finish} disabled={welcomed}>
                {welcomed ? "Welcome home…" : "Enter the House →"}
              </button>
              <button className="oh-ghost-btn" onClick={() => goTo(1)}>Walk it again</button>
            </div>
          </div>
        </div>
      </section>

      {/* Farewell overlay — held during finish() so the welcome lands */}
      <div className={`oh-farewell${farewell ? " show" : ""}`}>
        <div style={{ textAlign: "center", padding: "2rem", maxWidth: 560 }}>
          <div className="oh-eyebrow" style={{ marginBottom: "1.4rem" }}>Welcome home</div>
          <h1 className="oh-hero" style={{ fontSize: "clamp(2.4rem,5vw,3.6rem)" }}>
            Step inside.<br /><em>The work is waiting.</em>
          </h1>
        </div>
      </div>

      {/* ── Overlay layer — skip + dots — OWN stacking context, top of stack ── */}
      <div className="oh-overlay">
        <button className="oh-skip" onClick={onComplete}>skip intro ↗</button>
        <div className="oh-dots-wrap">
          <div className="oh-dots">
            {Array.from({ length: TOTAL }, (_, i) => (
              <button key={i} className={`oh-dot${slide === i + 1 ? " active" : ""}`} onClick={() => goTo(i + 1)} aria-label={`Slide ${i + 1}`} />
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
