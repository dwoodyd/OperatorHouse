/**
 * OHSplash — Premium entry animation for Operator House
 *
 * Concept: A private chamber door opening.
 * The diagonal separator between O and H rotates open like a refined architectural flap,
 * revealing the full mark before handing off to the interface.
 *
 * Motion spec:
 * - Duration: ~1.0s total
 * - Easing: cubic-bezier(0.4, 0, 0.2, 1) — smooth ease-in-out
 * - No bounce, no overshoot, no particles, no glow
 * - Dark luxury: obsidian background, gold mark
 */

import { useEffect, useState } from "react";

// CDN URLs for the official brand assets
const OH_SYMBOL_GOLD =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp";
const OH_FULL_LOCKUP =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-full-lockup_7d7e8984.webp";

interface OHSplashProps {
  onComplete: () => void;
  duration?: number; // ms, default 2400
}

export default function OHSplash({ onComplete, duration = 2400 }: OHSplashProps) {
  const [phase, setPhase] = useState<"closed" | "opening" | "open" | "reveal" | "exit">("closed");

  useEffect(() => {
    // Phase timeline:
    // 0ms      — closed (logo assembled, still)
    // 200ms    — opening (diagonal segment begins to rotate)
    // 800ms    — open (segment fully open, mark revealed)
    // 1400ms   — reveal (full lockup fades in briefly)
    // 2000ms   — exit (fade out entire splash)
    // 2400ms   — onComplete called

    const t1 = setTimeout(() => setPhase("opening"), 200);
    const t2 = setTimeout(() => setPhase("open"), 800);
    const t3 = setTimeout(() => setPhase("reveal"), 1400);
    const t4 = setTimeout(() => setPhase("exit"), 2000);
    const t5 = setTimeout(() => onComplete(), duration);

    return () => {
      clearTimeout(t1);
      clearTimeout(t2);
      clearTimeout(t3);
      clearTimeout(t4);
      clearTimeout(t5);
    };
  }, [onComplete, duration]);

  const isExiting = phase === "exit";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        backgroundColor: "#0d0d0d",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: "32px",
        transition: "opacity 0.4s cubic-bezier(0.4, 0, 0.2, 1)",
        opacity: isExiting ? 0 : 1,
        pointerEvents: isExiting ? "none" : "all",
      }}
    >
      {/* Symbol mark with door-open animation */}
      <div
        style={{
          position: "relative",
          width: "120px",
          height: "120px",
          transition: "transform 0.6s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.6s cubic-bezier(0.4, 0, 0.2, 1)",
          transform: phase === "closed" ? "scale(0.92)" : "scale(1)",
          opacity: phase === "closed" ? 0 : 1,
        }}
      >
        {/* The OH symbol mark — gold on dark */}
        <img
          src={OH_SYMBOL_GOLD}
          alt="Operator House"
          style={{
            width: "120px",
            height: "120px",
            objectFit: "contain",
            display: "block",
          }}
        />

        {/* Animated diagonal overlay — the "door" segment */}
        {/* This is an SVG overlay that recreates the diagonal slash geometry
            and rotates it open like a door flap, then fades out */}
        <svg
          viewBox="0 0 120 120"
          style={{
            position: "absolute",
            inset: 0,
            width: "120px",
            height: "120px",
            overflow: "visible",
          }}
        >
          {/* The diagonal door segment — pivots from top-center */}
          <g
            style={{
              transformOrigin: "60px 20px",
              transition: "transform 0.7s cubic-bezier(0.4, 0, 0.2, 1), opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
              transform:
                phase === "closed" || phase === "opening"
                  ? "rotate(0deg)"
                  : phase === "open"
                    ? "rotate(-22deg)"
                    : "rotate(-22deg)",
              opacity: phase === "open" || phase === "reveal" || phase === "exit" ? 0 : 1,
            }}
          >
            {/* Thin diagonal line matching the logo's slash geometry */}
            <line
              x1="58"
              y1="18"
              x2="72"
              y2="102"
              stroke="#b8975a"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
          </g>
        </svg>
      </div>

      {/* Full lockup — fades in during reveal phase */}
      <div
        style={{
          transition: "opacity 0.5s cubic-bezier(0.4, 0, 0.2, 1), transform 0.5s cubic-bezier(0.4, 0, 0.2, 1)",
          opacity: phase === "reveal" ? 1 : 0,
          transform: phase === "reveal" ? "translateY(0)" : "translateY(8px)",
        }}
      >
        <img
          src={OH_FULL_LOCKUP}
          alt="Operator House — Your Operator HQ"
          style={{
            height: "56px",
            objectFit: "contain",
            display: "block",
          }}
        />
      </div>

      {/* Subtle loading indicator — three dots */}
      <div
        style={{
          display: "flex",
          gap: "6px",
          transition: "opacity 0.4s",
          opacity: phase === "reveal" || phase === "exit" ? 0 : 0.4,
        }}
      >
        {[0, 1, 2].map((i) => (
          <div
            key={i}
            style={{
              width: "4px",
              height: "4px",
              borderRadius: "50%",
              backgroundColor: "#b8975a",
              animation: `ohPulse 1.2s ease-in-out ${i * 0.2}s infinite`,
            }}
          />
        ))}
      </div>

      <style>{`
        @keyframes ohPulse {
          0%, 80%, 100% { opacity: 0.2; transform: scale(0.8); }
          40% { opacity: 1; transform: scale(1); }
        }
      `}</style>
    </div>
  );
}
