import { useLocation } from "wouter";
import { useAuth } from "@/_core/hooks/useAuth";
import { SpectreVideoPlayer } from "@/components/SpectreVideoPlayer";
import { LayoutDashboard, Home, ArrowLeft } from "lucide-react";

export default function NotFound() {
  const [, setLocation] = useLocation();
  const { isAuthenticated } = useAuth();

  // Smart recovery: authenticated users go to Dashboard, guests go to Home
  const primaryDest = isAuthenticated ? "/dashboard" : "/";
  const primaryLabel = isAuthenticated ? "Back to Command Center" : "Back to Home";
  const PrimaryIcon = isAuthenticated ? LayoutDashboard : Home;

  return (
    <div
      className="min-h-screen flex flex-col items-center justify-center p-8"
      style={{ background: "var(--obsidian)" }}
    >
      <div
        className="text-center max-w-sm fade-in-scale"
        style={{ opacity: 0 }}
      >
        {/* Specter mascot */}
        <div className="flex justify-center mb-6">
          <SpectreVideoPlayer state="thoughtful" size="lg" glow />
        </div>

        {/* Ambient 404 label */}
        <div
          style={{
            fontFamily: "Fira Code, monospace",
            fontSize: "11px",
            letterSpacing: "0.25em",
            color: "rgba(245,166,35,0.35)",
            textTransform: "uppercase",
            marginBottom: "16px",
          }}
        >
          Signal lost — 404
        </div>

        <h2
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: "22px",
            fontWeight: 700,
            color: "var(--text-primary)",
            marginBottom: "10px",
            lineHeight: 1.3,
          }}
        >
          This room doesn't exist.
        </h2>

        <p
          style={{
            fontSize: "13px",
            color: "var(--text-muted)",
            lineHeight: 1.65,
            marginBottom: "32px",
            fontStyle: "italic",
          }}
        >
          "Or maybe it does — and I'm just not telling you."
        </p>

        {/* Primary CTA — smart destination */}
        <button
          onClick={() => setLocation(primaryDest)}
          className="flex items-center gap-2 px-6 py-3 mx-auto mb-3 w-full justify-center"
          style={{
            background: "linear-gradient(135deg, #F5A623 0%, #E8940F 100%)",
            color: "#0A0A0F",
            fontFamily: "DM Sans, sans-serif",
            fontWeight: 700,
            fontSize: "13px",
            borderRadius: "7px",
            border: "none",
            cursor: "pointer",
            transition: "opacity 180ms ease",
            maxWidth: "280px",
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = "0.88")}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = "1")}
        >
          <PrimaryIcon size={14} />
          {primaryLabel}
        </button>

        {/* Secondary: go back in history */}
        <button
          onClick={() =>
            window.history.length > 1
              ? window.history.back()
              : setLocation(primaryDest)
          }
          className="flex items-center gap-1.5 mx-auto"
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: "12px",
            color: "var(--text-muted)",
            fontFamily: "DM Sans, sans-serif",
            padding: "6px 12px",
            transition: "color 150ms ease",
          }}
          onMouseEnter={(e) =>
            (e.currentTarget.style.color = "var(--text-secondary)")
          }
          onMouseLeave={(e) =>
            (e.currentTarget.style.color = "var(--text-muted)")
          }
        >
          <ArrowLeft size={12} />
          Go back
        </button>
      </div>
    </div>
  );
}
