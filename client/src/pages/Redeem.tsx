/* =============================================================================
   Operator House — Redeem Invite Code
   Public page. User enters their code, we validate it, then send them through
   Manus OAuth. After OAuth completes, the code is marked as redeemed.
   ============================================================================= */
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Loader2, Key } from "lucide-react";
import { Link, useLocation } from "wouter";
import { getLoginUrl } from "@/const";
import { useAuth } from "@/_core/hooks/useAuth";

const OH_SYMBOL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp";

export default function Redeem() {
  const [code, setCode] = useState("");
  const [validated, setValidated] = useState<{ valid: boolean; label?: string | null } | null>(null);
  const [, navigate] = useLocation();
  const { user, isAuthenticated } = useAuth();

  // If user just came back from OAuth and has a pending code in sessionStorage, redeem it
  const pendingCode = typeof window !== "undefined" ? sessionStorage.getItem("oh_pending_code") : null;

  const redeemMutation = trpc.funnel.redeemCode.useMutation({
    onSuccess: () => {
      sessionStorage.removeItem("oh_pending_code");
      toast.success("Code redeemed — welcome to Operator House.");
      navigate("/");
    },
    onError: (err) => {
      sessionStorage.removeItem("oh_pending_code");
      toast.error(err.message || "Could not redeem code.");
    },
  });

  // Auto-redeem after OAuth return
  useEffect(() => {
    if (isAuthenticated && pendingCode && !redeemMutation.isPending) {
      redeemMutation.mutate({ code: pendingCode });
    }
  }, [isAuthenticated, pendingCode]);

  const validateQuery = trpc.funnel.validateCode.useQuery(
    { code: code.trim().toUpperCase() },
    {
      enabled: false, // triggered manually
    }
  );

  const handleValidate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!code.trim()) {
      toast.error("Please enter your invite code.");
      return;
    }
    const result = await validateQuery.refetch();
    if (result.data) {
      setValidated(result.data);
      if (!result.data.valid) {
        toast.error(result.data.reason || "Invalid code.");
      }
    }
  };

  const handleProceed = () => {
    // Store code in sessionStorage so we can redeem after OAuth
    sessionStorage.setItem("oh_pending_code", code.trim().toUpperCase());
    if (isAuthenticated) {
      // Already logged in — redeem immediately
      redeemMutation.mutate({ code: code.trim().toUpperCase() });
    } else {
      // Send through OAuth, return to /redeem
      window.location.href = getLoginUrl();
    }
  };

  // Show auto-redeem spinner
  if (isAuthenticated && pendingCode) {
    return (
      <div style={pageStyle}>
        <div style={{ textAlign: "center" }}>
          <Loader2 size={40} style={{ color: "#F5A623", animation: "spin 1s linear infinite", marginBottom: "16px" }} />
          <p style={{ color: "rgba(232,228,217,0.6)", fontSize: "15px" }}>Activating your access…</p>
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
      <nav style={navStyle}>
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <img src={OH_SYMBOL} alt="OH" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
            <span style={{ fontFamily: "Playfair Display, serif", fontSize: "15px", fontWeight: 700, color: "#E8E4D9" }}>
              Operator House
            </span>
          </div>
        </Link>
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "rgba(232,228,217,0.5)", fontSize: "13px", cursor: "pointer" }}>
            <ArrowLeft size={14} />
            Back
          </div>
        </Link>
      </nav>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main style={mainStyle}>
        <div style={{ maxWidth: "440px", width: "100%", animation: "oh-fade-up 0.5s ease both" }}>
          {/* Icon */}
          <div style={{ marginBottom: "32px", display: "flex", justifyContent: "center" }}>
            <div
              style={{
                width: "64px",
                height: "64px",
                borderRadius: "50%",
                background: "rgba(245,166,35,0.1)",
                border: "1px solid rgba(245,166,35,0.3)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <Key size={28} style={{ color: "#F5A623" }} />
            </div>
          </div>

          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: "40px" }}>
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: "clamp(26px, 5vw, 38px)", fontWeight: 700, lineHeight: 1.2, marginBottom: "12px" }}>
              Redeem your invite.
            </h1>
            <p style={{ color: "rgba(232,228,217,0.6)", fontSize: "15px", lineHeight: 1.7 }}>
              Enter the code from your invitation email to activate your founding access.
            </p>
          </div>

          {/* Code form */}
          {!validated?.valid ? (
            <form onSubmit={handleValidate} style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
              <input
                type="text"
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.toUpperCase());
                  setValidated(null);
                }}
                placeholder="OH-XXXXXXXX"
                maxLength={12}
                style={{
                  ...inputStyle,
                  textAlign: "center",
                  fontSize: "22px",
                  letterSpacing: "0.15em",
                  fontWeight: 700,
                  padding: "16px",
                  ...(validated && !validated.valid ? { borderColor: "rgba(239,68,68,0.5)" } : {}),
                }}
              />
              {validated && !validated.valid && (
                <p style={{ color: "#EF4444", fontSize: "13px", textAlign: "center" }}>
                  {(validated as any).reason || "Invalid code."}
                </p>
              )}
              <button
                type="submit"
                disabled={validateQuery.isFetching}
                style={primaryBtnStyle(validateQuery.isFetching)}
              >
                {validateQuery.isFetching && <Loader2 size={16} className="animate-spin" />}
                {validateQuery.isFetching ? "Checking…" : "Verify Code →"}
              </button>
            </form>
          ) : (
            /* ── Code valid — proceed to auth ──────────────────────────── */
            <div style={{ display: "flex", flexDirection: "column", gap: "20px", textAlign: "center" }}>
              <div
                style={{
                  padding: "20px",
                  background: "rgba(245,166,35,0.08)",
                  border: "1px solid rgba(245,166,35,0.3)",
                  borderRadius: "8px",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                }}
              >
                <CheckCircle size={20} style={{ color: "#F5A623", flexShrink: 0 }} />
                <div style={{ textAlign: "left" }}>
                  <p style={{ fontWeight: 700, fontSize: "14px", marginBottom: "2px" }}>Code verified.</p>
                  {validated.label && (
                    <p style={{ fontSize: "12px", color: "rgba(232,228,217,0.5)" }}>Reserved for: {validated.label}</p>
                  )}
                </div>
              </div>
              <p style={{ color: "rgba(232,228,217,0.55)", fontSize: "14px", lineHeight: 1.6 }}>
                {isAuthenticated
                  ? "Click below to activate your founding access."
                  : "You'll be asked to sign in or create your account. Your code will be activated automatically."}
              </p>
              <button
                onClick={handleProceed}
                disabled={redeemMutation.isPending}
                style={primaryBtnStyle(redeemMutation.isPending)}
              >
                {redeemMutation.isPending && <Loader2 size={16} className="animate-spin" />}
                {redeemMutation.isPending
                  ? "Activating…"
                  : isAuthenticated
                  ? "Activate Access →"
                  : "Create Account →"}
              </button>
              <button
                onClick={() => { setValidated(null); setCode(""); }}
                style={{ background: "none", border: "none", color: "rgba(232,228,217,0.4)", fontSize: "13px", cursor: "pointer" }}
              >
                Use a different code
              </button>
            </div>
          )}

          {/* Footer link */}
          <p style={{ textAlign: "center", marginTop: "32px", fontSize: "13px", color: "rgba(232,228,217,0.35)" }}>
            Don't have a code?{" "}
            <Link href="/apply">
              <span style={{ color: "#F5A623", cursor: "pointer" }}>Apply for founding access →</span>
            </Link>
          </p>
        </div>
      </main>
    </div>
  );
}

// ── Shared styles ─────────────────────────────────────────────────────────────

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

const inputStyle: React.CSSProperties = {
  width: "100%",
  padding: "12px 16px",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(245,166,35,0.2)",
  borderRadius: "6px",
  color: "#E8E4D9",
  fontSize: "15px",
  fontFamily: "DM Sans, sans-serif",
  outline: "none",
  boxSizing: "border-box",
};

const primaryBtnStyle = (disabled: boolean): React.CSSProperties => ({
  padding: "14px 32px",
  background: disabled
    ? "rgba(245,166,35,0.4)"
    : "linear-gradient(135deg, #F5A623 0%, #E8940F 100%)",
  border: "none",
  borderRadius: "6px",
  color: "#0A0A0B",
  fontSize: "14px",
  fontWeight: 700,
  cursor: disabled ? "not-allowed" : "pointer",
  letterSpacing: "0.04em",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
  transition: "opacity 200ms",
  width: "100%",
});
