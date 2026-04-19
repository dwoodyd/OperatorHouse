/* =============================================================================
   Operator House — Entry Splash Screen (v3)

   Animation arc:
   1. Mark fades in (0–800ms)
   2. Door line rotates open, shine sweeps (800–2000ms)
   3. Hold open (2000–2800ms)
   4. Cross-fade to Welcome Moment — full-screen dark overlay with time-of-day
      greeting, OH lockup, and slow ambient light sweep (2800–4800ms)
   5. Welcome Moment fades out → onComplete fires (4800–5300ms)
   ============================================================================= */
import React, { useEffect, useState } from "react";

const OH_SYMBOL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp";

function getGreeting(name?: string | null) {
  const who = name ? name.split(" ")[0] : "Operator";
  const h = new Date().getHours();
  if (h >= 5 && h < 12) return `Good morning, ${who}.`;
  if (h >= 12 && h < 17) return `Good afternoon, ${who}.`;
  if (h >= 17 && h < 21) return `Good evening, ${who}.`;
  return `The House is ready, ${who}.`;
}

interface OHSplashProps {
  onComplete: () => void;
  userName?: string | null;
}


// Ambient particle canvas for the welcome moment
function SplashParticles() {
  const ref = React.useRef<HTMLCanvasElement>(null);
  React.useEffect(() => {
    const canvas = ref.current; if (!canvas) return;
    const ctx = canvas.getContext('2d'); if (!ctx) return;
    let raf: number;
    const resize = () => { canvas.width = window.innerWidth; canvas.height = window.innerHeight; };
    resize(); window.addEventListener('resize', resize);
    const pts = Array.from({ length: 40 }, () => ({
      x: Math.random() * canvas.width, y: Math.random() * canvas.height,
      r: Math.random() * 1.2 + 0.3,
      vx: (Math.random() - 0.5) * 0.15, vy: (Math.random() - 0.5) * 0.15,
      o: Math.random() * 0.35 + 0.08,
    }));
    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height);
      pts.forEach(p => {
        ctx.beginPath(); ctx.arc(p.x, p.y, p.r, 0, Math.PI * 2);
        ctx.fillStyle = `rgba(216,168,90,${p.o})`; ctx.fill();
        p.x += p.vx; p.y += p.vy;
        if (p.x < 0) p.x = canvas.width; if (p.x > canvas.width) p.x = 0;
        if (p.y < 0) p.y = canvas.height; if (p.y > canvas.height) p.y = 0;
      });
      raf = requestAnimationFrame(draw);
    };
    draw();
    return () => { cancelAnimationFrame(raf); window.removeEventListener('resize', resize); };
  }, []);
  return <canvas ref={ref} style={{ position: 'absolute', inset: 0, pointerEvents: 'none', opacity: 0.5 }} />;
}

export default function OHSplash({ onComplete, userName }: OHSplashProps) {
  const [phase, setPhase] = useState<"idle" | "open" | "shine" | "exit" | "welcome" | "welcomeExit">("idle");
  const greeting = getGreeting(userName);

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("open"),        800);
    const t2 = setTimeout(() => setPhase("shine"),       1100);
    const t3 = setTimeout(() => setPhase("exit"),        2800);
    const t4 = setTimeout(() => setPhase("welcome"),     3200);  // welcome moment in
    const t5 = setTimeout(() => setPhase("welcomeExit"), 4800);  // welcome fades out
    const t6 = setTimeout(() => onComplete(),            5400);  // unmount
    return () => { [t1,t2,t3,t4,t5,t6].forEach(clearTimeout); };
  }, [onComplete]);

  const doorExited = phase === "exit" || phase === "welcome" || phase === "welcomeExit";
  const welcomeVisible = phase === "welcome" || phase === "welcomeExit";
  const welcomeIn = phase === "welcome";

  return (
    <>
      {/* ── Door Phase ─────────────────────────────────────────────────────── */}
      <div
        style={{
          position: "fixed", inset: 0, zIndex: 9999,
          background: "#08080D",
          display: "flex", alignItems: "center", justifyContent: "center",
          opacity: doorExited ? 0 : 1,
          transition: doorExited ? "opacity 400ms cubic-bezier(0.4,0,0.2,1)" : "none",
          pointerEvents: doorExited ? "none" : "all",
        }}
      >
        {/* Ambient glow */}
        <div style={{
          position: "absolute", width: 500, height: 500, borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)",
          opacity: phase === "idle" ? 0 : 1,
          transform: phase === "idle" ? "scale(0.6)" : "scale(1)",
          transition: "opacity 800ms ease, transform 800ms ease",
          pointerEvents: "none",
        }} />

        {/* Symbol */}
        <div style={{
          position: "relative", width: 200, height: 200,
          opacity: phase === "idle" ? 0 : 1,
          transform: phase === "idle" ? "scale(0.88)" : "scale(1)",
          transition: "opacity 600ms ease, transform 600ms cubic-bezier(0.34,1.2,0.64,1)",
          overflow: "hidden",
        }}>
          <img src={OH_SYMBOL} alt="Operator House" style={{ width: 200, height: 200, objectFit: "contain", display: "block" }} draggable={false} />
          <svg viewBox="0 0 200 200" style={{ position: "absolute", inset: 0, width: 200, height: 200, overflow: "visible", pointerEvents: "none" }}>
            <defs>
              <linearGradient id="shineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
                <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
                <stop offset="45%"  stopColor="rgba(255,220,120,0)" />
                <stop offset="50%"  stopColor="rgba(255,220,120,0.55)" />
                <stop offset="55%"  stopColor="rgba(255,220,120,0)" />
                <stop offset="100%" stopColor="rgba(255,255,255,0)" />
              </linearGradient>
            </defs>
            <g style={{
              transformOrigin: "100px 36px",
              transform: (phase === "open" || phase === "shine" || phase === "exit") ? "rotate(-52deg)" : "rotate(0deg)",
              transition: "transform 1100ms cubic-bezier(0.4,0,0.2,1)",
            }}>
              <line x1="100" y1="36" x2="44" y2="164" stroke="#C9A96E" strokeWidth="2.5" strokeLinecap="round" />
              <line x1="100" y1="36" x2="44" y2="164" stroke="rgba(245,180,60,0.35)" strokeWidth="7" strokeLinecap="round" />
            </g>
            <rect x="-200" y="0" width="200" height="200" fill="url(#shineGrad)"
              style={{
                transform: (phase === "shine" || phase === "exit") ? "translateX(400px)" : "translateX(0px)",
                transition: phase === "shine" ? "transform 900ms cubic-bezier(0.4,0,0.2,1)" : "none",
              }}
            />
          </svg>
        </div>

        <div style={{
          position: "absolute", bottom: "calc(50% - 160px)",
          fontFamily: "Fira Code, monospace", fontSize: 10, letterSpacing: "0.28em",
          textTransform: "uppercase", color: "rgba(245,166,35,0.45)",
          opacity: (phase === "open" || phase === "shine") ? 1 : 0,
          transform: (phase === "open" || phase === "shine") ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 500ms ease 200ms, transform 500ms ease 200ms",
        }}>
          Your Operator HQ
        </div>
      </div>

      {/* ── Welcome Moment ─────────────────────────────────────────────────── */}
      {welcomeVisible && (
        <div
          style={{
            position: "fixed", inset: 0, zIndex: 10000,
            background: "radial-gradient(ellipse at 50% 40%, #0f0d08 0%, #08080D 100%)",
            display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center",
            opacity: welcomeIn ? 1 : 0,
            transition: welcomeIn ? "opacity 600ms cubic-bezier(0.4,0,0.2,1)" : "opacity 500ms cubic-bezier(0.4,0,0.2,1)",
            pointerEvents: "none",
            overflow: "hidden",
          }}
        >
          <SplashParticles />
          {/* Slow ambient light sweep */}
          <div style={{
            position: "absolute", inset: 0, pointerEvents: "none",
            background: "linear-gradient(105deg, transparent 30%, rgba(245,166,35,0.04) 50%, transparent 70%)",
            animation: welcomeIn ? "ambientSweep 3s ease-in-out forwards" : "none",
          }} />

          {/* Radial glow behind lockup */}
          <div style={{
            position: "absolute", width: 600, height: 600, borderRadius: "50%",
            background: "radial-gradient(circle, rgba(245,166,35,0.08) 0%, transparent 65%)",
            opacity: welcomeIn ? 1 : 0,
            transition: "opacity 1s ease",
            pointerEvents: "none",
          }} />

          {/* OH symbol — smaller, centered */}
          <div style={{
            opacity: welcomeIn ? 1 : 0,
            transform: welcomeIn ? "translateY(0) scale(1)" : "translateY(12px) scale(0.95)",
            transition: "opacity 700ms ease 100ms, transform 700ms cubic-bezier(0.34,1.1,0.64,1) 100ms",
          }}>
            <img src={OH_SYMBOL} alt="Operator House" style={{ width: 72, height: 72, objectFit: "contain", display: "block" }} draggable={false} />
          </div>

          {/* Greeting */}
          <div style={{
            marginTop: 28,
            fontFamily: "Playfair Display, serif",
            fontSize: "clamp(26px, 5vw, 42px)",
            fontWeight: 700,
            color: "#f5f0e8",
            letterSpacing: "-0.01em",
            textAlign: "center",
            opacity: welcomeIn ? 1 : 0,
            transform: welcomeIn ? "translateY(0)" : "translateY(10px)",
            transition: "opacity 700ms ease 300ms, transform 700ms ease 300ms",
          }}>
            {greeting.split(' ').map((w, i) => (
              <span key={i} style={{
                display: 'inline-block',
                opacity: welcomeIn ? 1 : 0,
                transform: welcomeIn ? 'translateY(0)' : 'translateY(10px)',
                transition: `opacity 600ms ease ${300 + i * 90}ms, transform 600ms cubic-bezier(0.22,1,0.36,1) ${300 + i * 90}ms`,
                marginRight: i < greeting.split(' ').length - 1 ? '0.28em' : 0,
              }}>{w}</span>
            ))}
          </div>

          {/* Sub-line */}
          <div style={{
            marginTop: 10,
            fontFamily: "Fira Code, monospace",
            fontSize: 11,
            letterSpacing: "0.22em",
            textTransform: "uppercase",
            color: "rgba(245,166,35,0.5)",
            opacity: welcomeIn ? 1 : 0,
            transform: welcomeIn ? "translateY(0)" : "translateY(8px)",
            transition: "opacity 700ms ease 500ms, transform 700ms ease 500ms",
          }}>
            Operator House
          </div>
        </div>
      )}

      <style>{`
        @keyframes ambientSweep {
          0%   { transform: translateX(-100%); }
          100% { transform: translateX(100%); }
        }
      `}</style>
    </>
  );
}
