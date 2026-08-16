import { useLocation } from "wouter";
import { AlertTriangle, ArrowLeft, RefreshCw, ShieldCheck } from "lucide-react";
import { getLoginUrl, getStoredAuthReturnPath } from "@/const";

const RECOVERY_COPY: Record<string, { title: string; body: string }> = {
  missing: {
    title: "That sign-in link was incomplete.",
    body: "No account changes were made. Return to Operator House and try signing in again when you are ready.",
  },
  callback: {
    title: "We could not finish sign-in.",
    body: "Your session was not created. This can happen when a sign-in window expires, a network changes, or cookies are blocked.",
  },
  session: {
    title: "Your session did not stick.",
    body: "Operator House could not retain the secure sign-in cookie. A fresh sign-in usually resolves this; if it does not, try a standard browser window with cookies enabled.",
  },
};

export default function AuthRecovery() {
  const [, setLocation] = useLocation();
  const reason = new URLSearchParams(window.location.search).get("reason") || "callback";
  const copy = RECOVERY_COPY[reason] ?? RECOVERY_COPY.callback;

  const retry = () => {
    window.location.assign(getLoginUrl(getStoredAuthReturnPath() || "/"));
  };

  return (
    <main
      style={{
        minHeight: "100dvh",
        display: "grid",
        placeItems: "center",
        padding: "24px",
        background: "radial-gradient(circle at 50% 25%, rgba(201,160,74,0.12), transparent 34%), #08080D",
        color: "#F5F0E8",
        fontFamily: "DM Sans, sans-serif",
      }}
    >
      <section
        aria-labelledby="auth-recovery-title"
        style={{
          width: "min(100%, 520px)",
          padding: "clamp(28px, 5vw, 48px)",
          border: "1px solid rgba(201,160,74,0.24)",
          borderRadius: "18px",
          background: "rgba(14,14,22,0.88)",
          boxShadow: "0 28px 80px rgba(0,0,0,0.45)",
          backdropFilter: "blur(18px)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "26px", color: "#D3AC58" }}>
          <ShieldCheck size={18} aria-hidden="true" />
          <span style={{ fontFamily: "Fira Code, monospace", fontSize: "11px", letterSpacing: "0.16em", textTransform: "uppercase" }}>
            Operator House · Secure sign-in
          </span>
        </div>

        <div style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: "12px", background: "rgba(245,166,35,0.12)", color: "#F5A623", marginBottom: "22px" }}>
          <AlertTriangle size={22} aria-hidden="true" />
        </div>
        <h1 id="auth-recovery-title" style={{ margin: 0, fontFamily: "Playfair Display, Georgia, serif", fontSize: "clamp(30px, 6vw, 42px)", lineHeight: 1.08, letterSpacing: "-0.025em" }}>
          {copy.title}
        </h1>
        <p style={{ margin: "18px 0 30px", color: "rgba(245,240,232,0.68)", fontSize: "16px", lineHeight: 1.7 }}>
          {copy.body}
        </p>
        <div style={{ display: "grid", gap: "12px" }}>
          <button
            type="button"
            onClick={retry}
            style={{ minHeight: 48, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", border: 0, borderRadius: "8px", background: "linear-gradient(135deg, #F5A623, #E8940F)", color: "#08080D", fontWeight: 800, cursor: "pointer", fontSize: "14px" }}
          >
            <RefreshCw size={15} aria-hidden="true" />
            Try secure sign-in again
          </button>
          <button
            type="button"
            onClick={() => setLocation("/")}
            style={{ minHeight: 44, display: "inline-flex", alignItems: "center", justifyContent: "center", gap: "8px", border: "1px solid rgba(255,255,255,0.14)", borderRadius: "8px", background: "transparent", color: "rgba(245,240,232,0.8)", cursor: "pointer", fontSize: "14px" }}
          >
            <ArrowLeft size={15} aria-hidden="true" />
            Return to Operator House
          </button>
        </div>
      </section>
    </main>
  );
}
