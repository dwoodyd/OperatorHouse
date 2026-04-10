import { Ghost, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function NotFound() {
  const [, setLocation] = useLocation();

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: "var(--obsidian)" }}
    >
      <div className="text-center max-w-md fade-in-scale" style={{ opacity: 0 }}>
        <div
          className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-6"
          style={{ background: "rgba(245,166,35,0.08)", border: "1px solid rgba(245,166,35,0.2)" }}
        >
          <Ghost size={28} style={{ color: "var(--amber)" }} />
        </div>

        <div
          style={{
            fontFamily: "Fira Code, monospace",
            fontSize: "72px",
            fontWeight: 700,
            color: "var(--amber)",
            lineHeight: 1,
            textShadow: "0 0 40px rgba(245,166,35,0.3)",
            marginBottom: "12px",
          }}
        >
          404
        </div>

        <h2
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "20px",
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: "8px",
          }}
        >
          Room not found
        </h2>

        <p
          style={{
            fontSize: "14px",
            color: "var(--text-muted)",
            lineHeight: 1.6,
            marginBottom: "32px",
          }}
        >
          The Operator couldn't locate this page. It may have been moved or never existed.
        </p>

        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 px-5 py-2.5 mx-auto"
          style={{
            background: "var(--amber)",
            color: "#0A0A0F",
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 600,
            fontSize: "13px",
            borderRadius: "6px",
            transition: "opacity 180ms ease",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.85")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <ArrowLeft size={14} />
          Return to HQ
        </button>
      </div>
    </div>
  );
}
