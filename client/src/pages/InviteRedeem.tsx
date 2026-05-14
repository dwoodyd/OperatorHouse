/* =============================================================================
   Operator House — Magic Link Invite Redemption
   Handles /invite/:code — pre-fills code from URL, auto-validates, then routes
   through Manus OAuth. After OAuth, code is redeemed and user goes to /billing-setup.
   ============================================================================= */
import { useEffect, useState } from "react";
import { useParams, useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, CheckCircle, AlertCircle } from "lucide-react";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

const OH_SYMBOL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp";

export default function InviteRedeem() {
  const { code: rawCode } = useParams<{ code: string }>();
  const code = rawCode?.trim().toUpperCase() ?? "";
  const [, navigate] = useLocation();
  const { isAuthenticated } = useAuth();
  const [status, setStatus] = useState<"validating" | "valid" | "invalid" | "redeeming" | "done">("validating");
  const [errorMsg, setErrorMsg] = useState("");

  const validateQuery = trpc.funnel.validateCode.useQuery(
    { code },
    { enabled: !!code, retry: false }
  );

  const redeemMutation = trpc.funnel.redeemCode.useMutation({
    onSuccess: () => {
      sessionStorage.removeItem("oh_pending_code");
      setStatus("done");
      navigate("/billing-setup");
    },
    onError: (err) => {
      sessionStorage.removeItem("oh_pending_code");
      setErrorMsg(err.message || "Could not redeem code.");
      setStatus("invalid");
    },
  });

  // Step 1: validate on mount
  useEffect(() => {
    if (!code) {
      setErrorMsg("No invite code found in this link.");
      setStatus("invalid");
    }
  }, [code]);

  useEffect(() => {
    if (!validateQuery.data) return;
    if (validateQuery.data.valid) {
      setStatus("valid");
    } else {
      setErrorMsg(validateQuery.data.reason || "This invite code is not valid.");
      setStatus("invalid");
    }
  }, [validateQuery.data]);

  // Step 2: if valid and already authenticated, redeem immediately
  useEffect(() => {
    if (status === "valid" && isAuthenticated) {
      setStatus("redeeming");
      redeemMutation.mutate({ code });
    }
  }, [status, isAuthenticated]);

  // Step 3: after OAuth return, auto-redeem pending code
  useEffect(() => {
    const pending = sessionStorage.getItem("oh_pending_code");
    if (isAuthenticated && pending && status !== "redeeming" && status !== "done") {
      setStatus("redeeming");
      redeemMutation.mutate({ code: pending });
    }
  }, [isAuthenticated]);

  const handleProceed = () => {
    sessionStorage.setItem("oh_pending_code", code);
    window.location.href = getLoginUrl();
  };

  return (
    <div style={pageStyle}>
      {/* Nav */}
      <nav style={navStyle}>
        <img src={OH_SYMBOL} alt="Operator House" style={{ height: 32, width: 32 }} />
        <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, letterSpacing: "0.15em", color: "rgba(245,166,35,0.7)", textTransform: "uppercase" }}>
          Operator House
        </span>
      </nav>

      <main style={mainStyle}>
        <div style={cardStyle}>
          {/* Validating */}
          {(status === "validating" || validateQuery.isLoading) && (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <Loader2 size={32} style={{ color: "#F5A623", animation: "spin 1s linear infinite" }} />
              <p style={{ color: "rgba(232,228,217,0.6)", fontSize: 14 }}>Verifying your invite…</p>
            </div>
          )}

          {/* Valid — not yet authenticated */}
          {status === "valid" && !isAuthenticated && (
            <div style={{ display: "flex", flexDirection: "column", gap: 20, textAlign: "center" }}>
              <div style={{ display: "flex", flexDirection: "column", alignItems: "center", gap: 12 }}>
                <CheckCircle size={36} style={{ color: "#F5A623" }} />
                <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 26, fontWeight: 700, color: "#E8E4D9", margin: 0 }}>
                  You're in.
                </h1>
                <p style={{ color: "rgba(232,228,217,0.55)", fontSize: 14, lineHeight: 1.6, maxWidth: 320 }}>
                  Your founding seat is confirmed. Sign in to activate your access and set up your account.
                </p>
              </div>
              <div style={{ padding: "16px 20px", background: "rgba(245,166,35,0.06)", border: "1px solid rgba(245,166,35,0.2)", borderRadius: 8 }}>
                <p style={{ fontFamily: "Fira Code, monospace", fontSize: 13, color: "#F5A623", margin: 0, letterSpacing: "0.1em" }}>
                  {code}
                </p>
                <p style={{ fontSize: 11, color: "rgba(232,228,217,0.35)", margin: "4px 0 0" }}>Your invite code</p>
              </div>
              <button onClick={handleProceed} style={primaryBtnStyle(false)}>
                Activate Founding Access →
              </button>
            </div>
          )}

          {/* Redeeming */}
          {(status === "redeeming") && (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <Loader2 size={32} style={{ color: "#F5A623", animation: "spin 1s linear infinite" }} />
              <p style={{ color: "rgba(232,228,217,0.6)", fontSize: 14 }}>Activating your founding access…</p>
            </div>
          )}

          {/* Invalid */}
          {status === "invalid" && (
            <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
              <AlertCircle size={32} style={{ color: "#EF4444" }} />
              <h2 style={{ fontFamily: "Playfair Display, serif", fontSize: 22, color: "#E8E4D9", margin: 0 }}>
                This link isn't valid
              </h2>
              <p style={{ color: "rgba(232,228,217,0.5)", fontSize: 14, lineHeight: 1.6, maxWidth: 320 }}>
                {errorMsg || "This invite code may have expired or already been used."}
              </p>
              <a href="/redeem" style={{ ...primaryBtnStyle(false), textDecoration: "none", display: "inline-flex", alignItems: "center", justifyContent: "center" }}>
                Enter Code Manually →
              </a>
              <a href="/apply" style={{ color: "rgba(245,166,35,0.7)", fontSize: 13, textDecoration: "none" }}>
                Apply for a founding seat
              </a>
            </div>
          )}
        </div>
      </main>
    </div>
  );
}

const pageStyle: React.CSSProperties = {
  minHeight: "100vh",
  background: "#08080D",
  color: "#E8E4D9",
  fontFamily: "DM Sans, sans-serif",
  display: "flex",
  flexDirection: "column",
};
const navStyle: React.CSSProperties = {
  position: "fixed",
  top: 0,
  left: 0,
  right: 0,
  zIndex: 100,
  display: "flex",
  alignItems: "center",
  justifyContent: "space-between",
  padding: "16px 32px",
  background: "rgba(8,8,13,0.9)",
  backdropFilter: "blur(12px)",
  borderBottom: "1px solid rgba(245,166,35,0.1)",
};
const mainStyle: React.CSSProperties = {
  flex: 1,
  display: "flex",
  flexDirection: "column",
  alignItems: "center",
  justifyContent: "center",
  padding: "100px 24px 80px",
};
const cardStyle: React.CSSProperties = {
  width: "100%",
  maxWidth: 420,
  padding: "40px 32px",
  background: "rgba(255,255,255,0.02)",
  border: "1px solid rgba(245,166,35,0.12)",
  borderRadius: 12,
};
const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: "14px 32px",
  background: disabled
    ? "rgba(245,166,35,0.4)"
    : "linear-gradient(135deg, #F5A623 0%, #E8940F 100%)",
  border: "none",
  borderRadius: 6,
  color: "#0A0A0B",
  fontSize: 14,
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  letterSpacing: "0.04em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: 8,
  width: "100%",
});
