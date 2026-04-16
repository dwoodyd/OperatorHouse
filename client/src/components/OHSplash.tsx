/* =============================================================================
   Operator House — Entry Splash Screen (v2)

   The OH mark is a square frame with the O and H inside it. Between the O and H
   is a diagonal line that runs from the top-center of the frame down to the
   bottom-left — it looks exactly like a door on a hinge.

   Animation concept:
   1. Mark fades in large and still (0–800ms)
   2. The diagonal "door" line rotates open on its top pivot, swinging left like
      a door opening inward, revealing warm light behind it (800–2000ms)
   3. A gold shine sweeps across the mark as the door opens (1100–1800ms)
   4. Hold open (2000–2800ms)
   5. Screen fades out (2800–3500ms) → onComplete fires

   Only the OH symbol is shown — no lockup, no wordmark.
   Plays once per session via sessionStorage flag (set in App.tsx).
   ============================================================================= */
import { useEffect, useState } from "react";

const OH_SYMBOL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp";

interface OHSplashProps {
  onComplete: () => void;
}

export default function OHSplash({ onComplete }: OHSplashProps) {
  const [phase, setPhase] = useState<"idle" | "open" | "shine" | "exit">("idle");

  useEffect(() => {
    const t1 = setTimeout(() => setPhase("open"),  800);   // door starts opening
    const t2 = setTimeout(() => setPhase("shine"), 1100);  // shine sweeps
    const t3 = setTimeout(() => setPhase("exit"),  2800);  // fade out (hold open ~1.7s)
    const t4 = setTimeout(() => onComplete(),      3500);  // unmount
    return () => { clearTimeout(t1); clearTimeout(t2); clearTimeout(t3); clearTimeout(t4); };
  }, [onComplete]);

  const isExit = phase === "exit";

  return (
    <div
      style={{
        position: "fixed",
        inset: 0,
        zIndex: 9999,
        background: "#08080D",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        opacity: isExit ? 0 : 1,
        transition: isExit ? "opacity 500ms cubic-bezier(0.4,0,0.2,1)" : "none",
        pointerEvents: isExit ? "none" : "all",
      }}
    >
      {/* Ambient radial glow that brightens as door opens */}
      <div
        style={{
          position: "absolute",
          width: "500px",
          height: "500px",
          borderRadius: "50%",
          background: "radial-gradient(circle, rgba(245,166,35,0.12) 0%, transparent 70%)",
          opacity: phase === "idle" ? 0 : 1,
          transform: phase === "idle" ? "scale(0.6)" : "scale(1)",
          transition: "opacity 800ms ease, transform 800ms ease",
          pointerEvents: "none",
        }}
      />

      {/* Symbol container */}
      <div
        style={{
          position: "relative",
          width: "200px",
          height: "200px",
          opacity: phase === "idle" ? 0 : 1,
          transform: phase === "idle" ? "scale(0.88)" : "scale(1)",
          transition: "opacity 600ms ease, transform 600ms cubic-bezier(0.34,1.2,0.64,1)",
          overflow: "hidden",
        }}
      >
        {/* The OH symbol image */}
        <img
          src={OH_SYMBOL}
          alt="Operator House"
          style={{ width: "200px", height: "200px", objectFit: "contain", display: "block" }}
          draggable={false}
        />

        {/* ── Door overlay ──────────────────────────────────────────────────
            The diagonal in the logo runs from roughly (50%, 18%) at the top
            to (22%, 82%) at the bottom — top-center of the O down to bottom-left.
            We recreate it as a thin SVG line that rotates open on its top pivot.
            The "door panel" is a filled polygon representing the left half of
            the O section, which swings open on the same pivot.
        ──────────────────────────────────────────────────────────────────── */}
        <svg
          viewBox="0 0 200 200"
          style={{
            position: "absolute",
            inset: 0,
            width: "200px",
            height: "200px",
            overflow: "visible",
            pointerEvents: "none",
          }}
        >
          <defs>
            {/* Shine gradient — sweeps left to right */}
            <linearGradient id="shineGrad" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%"   stopColor="rgba(255,255,255,0)" />
              <stop offset="45%"  stopColor="rgba(255,220,120,0)" />
              <stop offset="50%"  stopColor="rgba(255,220,120,0.55)" />
              <stop offset="55%"  stopColor="rgba(255,220,120,0)" />
              <stop offset="100%" stopColor="rgba(255,255,255,0)" />
            </linearGradient>
          </defs>

          {/* Door panel — the triangular wedge left of the diagonal.
              Pivot point is top of the diagonal: (100, 36).
              In closed state: covers the left-of-diagonal region.
              Rotates -52deg (opens left) when phase === "open". */}
          <g
            style={{
              transformOrigin: "100px 36px",
              transform: phase === "open" || phase === "shine" || phase === "exit"
                ? "rotate(-52deg)"
                : "rotate(0deg)",
              transition: "transform 1100ms cubic-bezier(0.4,0,0.2,1)",
            }}
          >
            {/* Thin door line — the diagonal itself */}
            <line
              x1="100" y1="36"
              x2="44"  y2="164"
              stroke="#C9A96E"
              strokeWidth="2.5"
              strokeLinecap="round"
            />
            {/* Warm light glow on the door edge */}
            <line
              x1="100" y1="36"
              x2="44"  y2="164"
              stroke="rgba(245,180,60,0.35)"
              strokeWidth="7"
              strokeLinecap="round"
            />
          </g>

          {/* Shine sweep — travels across the mark as door opens */}
          <rect
            x="-200" y="0"
            width="200" height="200"
            fill="url(#shineGrad)"
            style={{
              transform: phase === "shine" || phase === "exit"
                ? "translateX(400px)"
                : "translateX(0px)",
              transition: phase === "shine"
                ? "transform 900ms cubic-bezier(0.4,0,0.2,1)"
                : "none",
            }}
          />
        </svg>
      </div>

      {/* Subtle tagline — fades in after door opens */}
      <div
        style={{
          position: "absolute",
          bottom: "calc(50% - 160px)",
          fontFamily: "Fira Code, monospace",
          fontSize: "10px",
          letterSpacing: "0.28em",
          textTransform: "uppercase",
          color: "rgba(245,166,35,0.45)",
          opacity: phase === "open" || phase === "shine" ? 1 : 0,
          transform: phase === "open" || phase === "shine" ? "translateY(0)" : "translateY(6px)",
          transition: "opacity 500ms ease 200ms, transform 500ms ease 200ms",
        }}
      >
        Your Operator HQ
      </div>

      <style>{`
        @keyframes ohDoorGlow {
          0%   { opacity: 0; }
          50%  { opacity: 1; }
          100% { opacity: 0; }
        }
      `}</style>
    </div>
  );
}
