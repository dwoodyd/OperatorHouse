import { Component, type ErrorInfo, type ReactNode } from "react";
import { AlertTriangle, ArrowRight, RefreshCw } from "lucide-react";

type Props = { children: ReactNode };
type State = { hasError: boolean; reference: string };

export class AppErrorBoundary extends Component<Props, State> {
  state: State = { hasError: false, reference: "" };

  static getDerivedStateFromError() {
    return { hasError: true, reference: `OH-${Date.now().toString(36).toUpperCase()}` };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error("[Operator House] Client render failure", error, info.componentStack);
    const report = {
      reference: this.state.reference,
      message: error.message.slice(0, 500),
      path: `${window.location.pathname}${window.location.search}`,
    };
    fetch("/api/client-error", {
      method: "POST",
      credentials: "include",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(report),
    }).catch(() => undefined);
    try {
      sessionStorage.setItem("oh_last_render_error", JSON.stringify({
        message: error.message,
        reference: this.state.reference,
        at: new Date().toISOString(),
      }));
    } catch {
      // Browsers in restricted storage modes can still use the recovery screen.
    }
  }

  render() {
    if (!this.state.hasError) return this.props.children;

    return (
      <main
        role="main"
        style={{
          minHeight: "100dvh", display: "grid", placeItems: "center", padding: 24,
          background: "radial-gradient(ellipse at 50% 0%, #171108 0%, #08080D 60%)", color: "#E8E4D9",
        }}
      >
        <section style={{ width: "min(100%, 560px)", padding: "clamp(28px, 6vw, 48px)", borderRadius: 12, background: "rgba(14,14,22,0.96)", border: "1px solid rgba(245,166,35,0.24)", boxShadow: "0 20px 70px rgba(0,0,0,0.45)" }}>
          <div style={{ width: 42, height: 42, display: "grid", placeItems: "center", borderRadius: 10, background: "rgba(245,166,35,0.12)", border: "1px solid rgba(245,166,35,0.26)", color: "#F5A623", marginBottom: 24 }}>
            <AlertTriangle size={19} aria-hidden="true" />
          </div>
          <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, letterSpacing: "0.18em", textTransform: "uppercase", color: "rgba(245,166,35,0.64)", margin: "0 0 12px" }}>Specter recovery</p>
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(26px, 5vw, 38px)", lineHeight: 1.15, margin: "0 0 14px", color: "#F5F0E8" }}>A page lost its footing.</h1>
          <p style={{ color: "rgba(232,228,217,0.64)", lineHeight: 1.65, fontSize: 15, margin: "0 0 24px" }}>
            Your workspace is still here. Refresh to try again, or return to the welcome page and continue from a clean route.
          </p>
          <div style={{ display: "flex", gap: 10, flexWrap: "wrap" }}>
            <button type="button" onClick={() => window.location.reload()} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 16px", border: "none", borderRadius: 7, cursor: "pointer", background: "#F5A623", color: "#0A0A0B", fontWeight: 700, fontFamily: "DM Sans, sans-serif" }}>
              <RefreshCw size={14} /> Try again
            </button>
            <button type="button" onClick={() => window.location.assign("/")} style={{ display: "inline-flex", alignItems: "center", gap: 8, padding: "11px 16px", borderRadius: 7, cursor: "pointer", background: "transparent", border: "1px solid rgba(245,166,35,0.3)", color: "#F5A623", fontWeight: 600, fontFamily: "DM Sans, sans-serif" }}>
              Welcome page <ArrowRight size={14} />
            </button>
          </div>
          <p style={{ margin: "22px 0 0", color: "rgba(232,228,217,0.35)", fontFamily: "Fira Code, monospace", fontSize: 10 }}>Reference: {this.state.reference || "OH-RECOVERY"}</p>
        </section>
      </main>
    );
  }
}
