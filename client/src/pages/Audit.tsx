/* =============================================================================
   Operator Audit — Book a 15-Minute Discovery Call
   Public page — no auth required.
   Embeds the Calendly inline widget for dwoodyd/15-min-operator-house-discovery-call
   ============================================================================= */
import { useEffect, useState } from "react";
import { useLocation } from "wouter";

const OH_SYMBOL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp";

const CALENDLY_URL =
  "https://calendly.com/dwoodyd/15-min-operator-house-discovery-call";

export default function Audit() {
  const [, setLocation] = useLocation();
  const [visible, setVisible] = useState(false);

  // Fade in
  useEffect(() => {
    const t = setTimeout(() => setVisible(true), 60);
    return () => clearTimeout(t);
  }, []);

  // Inject Calendly widget script once
  useEffect(() => {
    const scriptId = "calendly-widget-script";
    if (document.getElementById(scriptId)) return;
    const script = document.createElement("script");
    script.id = scriptId;
    script.src = "https://assets.calendly.com/assets/external/widget.js";
    script.async = true;
    document.head.appendChild(script);
    return () => {
      // Leave script in DOM — removing it breaks the widget on re-mount
    };
  }, []);

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08080D",
        color: "#E8E4D9",
        fontFamily: "DM Sans, sans-serif",
        opacity: visible ? 1 : 0,
        transition: "opacity 500ms ease",
        overflowX: "hidden",
      }}
    >
      {/* ── Top nav ──────────────────────────────────────────────────────── */}
      <nav
        style={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: 100,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          padding: "16px 32px",
          background: "rgba(8,8,13,0.92)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(245,166,35,0.1)",
        }}
      >
        <button
          onClick={() => setLocation("/")}
          style={{
            display: "flex",
            alignItems: "center",
            gap: "10px",
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
          }}
        >
          <img
            src={OH_SYMBOL}
            alt="OH"
            style={{ width: "28px", height: "28px", objectFit: "contain" }}
          />
          <span
            style={{
              fontFamily: "Playfair Display, serif",
              fontSize: "15px",
              fontWeight: 700,
              color: "#E8E4D9",
            }}
          >
            Operator House
          </span>
        </button>
        <button
          onClick={() => setLocation("/")}
          style={{
            background: "none",
            border: "1px solid rgba(245,166,35,0.25)",
            borderRadius: "6px",
            padding: "7px 16px",
            color: "rgba(245,166,35,0.7)",
            fontSize: "12px",
            fontFamily: "Fira Code, monospace",
            cursor: "pointer",
            letterSpacing: "0.04em",
          }}
        >
          ← Back
        </button>
      </nav>

      {/* ── Header ───────────────────────────────────────────────────────── */}
      <div
        style={{
          paddingTop: "100px",
          paddingBottom: "32px",
          textAlign: "center",
          padding: "100px 24px 32px",
        }}
      >
        {/* Ambient glow */}
        <div
          style={{
            position: "absolute",
            top: "80px",
            left: "50%",
            transform: "translateX(-50%)",
            width: "500px",
            height: "300px",
            background:
              "radial-gradient(ellipse, rgba(245,166,35,0.06) 0%, transparent 70%)",
            pointerEvents: "none",
          }}
        />

        <div
          style={{
            fontFamily: "Fira Code, monospace",
            fontSize: "10px",
            letterSpacing: "0.3em",
            textTransform: "uppercase",
            color: "rgba(245,166,35,0.55)",
            marginBottom: "16px",
            position: "relative",
          }}
        >
          Free · 15 Minutes · No Pitch
        </div>

        <h1
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "clamp(28px, 4vw, 48px)",
            fontWeight: 700,
            lineHeight: 1.15,
            marginBottom: "16px",
            maxWidth: "640px",
            margin: "0 auto 16px",
            position: "relative",
          }}
        >
          Book Your Free{" "}
          <span style={{ color: "#F5A623" }}>Operator Audit</span>
        </h1>

        <p
          style={{
            fontSize: "clamp(14px, 1.8vw, 16px)",
            color: "rgba(232,228,217,0.55)",
            lineHeight: 1.7,
            maxWidth: "480px",
            margin: "0 auto 8px",
            position: "relative",
          }}
        >
          In 15 minutes we'll map your current ops, identify the biggest
          bottlenecks, and show you exactly how Operator House closes the gaps.
          No slides. No pitch deck. Just clarity.
        </p>

        {/* Three promise pills */}
        <div
          style={{
            display: "flex",
            gap: "10px",
            justifyContent: "center",
            flexWrap: "wrap",
            marginTop: "20px",
            marginBottom: "8px",
          }}
        >
          {[
            "Ops gap analysis",
            "Live product walkthrough",
            "Your next 3 moves",
          ].map((label) => (
            <span
              key={label}
              style={{
                padding: "5px 14px",
                background: "rgba(245,166,35,0.07)",
                border: "1px solid rgba(245,166,35,0.2)",
                borderRadius: "20px",
                fontSize: "11px",
                color: "rgba(245,166,35,0.75)",
                fontFamily: "Fira Code, monospace",
                letterSpacing: "0.04em",
              }}
            >
              {label}
            </span>
          ))}
        </div>
      </div>

      {/* ── Calendly Inline Widget ────────────────────────────────────────── */}
      <div
        style={{
          maxWidth: "900px",
          margin: "0 auto",
          padding: "0 16px 80px",
        }}
      >
        <div
          className="calendly-inline-widget"
          data-url={`${CALENDLY_URL}?hide_gdpr_banner=1&background_color=0d0d12&text_color=e8e4d9&primary_color=f5a623`}
          style={{
            minWidth: "320px",
            height: "700px",
            borderRadius: "12px",
            overflow: "hidden",
            border: "1px solid rgba(245,166,35,0.12)",
          }}
        />
      </div>

      {/* ── Footer note ──────────────────────────────────────────────────── */}
      <div
        style={{
          textAlign: "center",
          paddingBottom: "48px",
          fontSize: "11px",
          color: "rgba(232,228,217,0.2)",
          fontFamily: "Fira Code, monospace",
          letterSpacing: "0.06em",
        }}
      >
        Powered by Calendly · Operator House © {new Date().getFullYear()}
      </div>
    </div>
  );
}
