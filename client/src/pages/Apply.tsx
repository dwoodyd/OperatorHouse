/* =============================================================================
   Operator House — Apply for Founding Access
   Public page. No auth required. Matches brand identity of Home.tsx.
   ============================================================================= */
import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { ArrowLeft, CheckCircle, Loader2 } from "lucide-react";
import { Link } from "wouter";

const OH_SYMBOL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp";

export default function Apply() {
  const [form, setForm] = useState({ name: "", email: "", reason: "" });
  const [submitted, setSubmitted] = useState(false);

  const submit = trpc.funnel.submitApplication.useMutation({
    onSuccess: () => setSubmitted(true),
    onError: (err) => toast.error(err.message || "Something went wrong. Please try again."),
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.name.trim() || !form.email.trim() || !form.reason.trim()) {
      toast.error("Please fill in all fields.");
      return;
    }
    submit.mutate(form);
  };

  return (
    <div
      style={{
        minHeight: "100vh",
        background: "#08080D",
        color: "#E8E4D9",
        fontFamily: "DM Sans, sans-serif",
        display: "flex",
        flexDirection: "column",
      }}
    >
      {/* ── Nav ─────────────────────────────────────────────────────────────── */}
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
          background: "rgba(8,8,13,0.9)",
          backdropFilter: "blur(12px)",
          borderBottom: "1px solid rgba(245,166,35,0.1)",
        }}
      >
        <Link href="/">
          <div style={{ display: "flex", alignItems: "center", gap: "10px", cursor: "pointer" }}>
            <img src={OH_SYMBOL} alt="OH" style={{ width: "28px", height: "28px", objectFit: "contain" }} />
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
          </div>
        </Link>
        <Link href="/">
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: "6px",
              color: "rgba(232,228,217,0.5)",
              fontSize: "13px",
              cursor: "pointer",
              textDecoration: "none",
            }}
          >
            <ArrowLeft size={14} />
            Back
          </div>
        </Link>
      </nav>

      {/* ── Main ────────────────────────────────────────────────────────────── */}
      <main
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          padding: "120px 24px 80px",
        }}
      >
        {submitted ? (
          /* ── Success state ─────────────────────────────────────────────── */
          <div
            style={{
              maxWidth: "480px",
              width: "100%",
              textAlign: "center",
              animation: "oh-fade-up 0.5s ease both",
            }}
          >
            <CheckCircle
              size={56}
              style={{ color: "#F5A623", marginBottom: "24px" }}
            />
            <h1
              style={{
                fontFamily: "Playfair Display, serif",
                fontSize: "clamp(28px, 5vw, 40px)",
                fontWeight: 700,
                marginBottom: "16px",
                lineHeight: 1.2,
              }}
            >
              Application received.
            </h1>
            <p
              style={{
                color: "rgba(232,228,217,0.65)",
                fontSize: "16px",
                lineHeight: 1.7,
                marginBottom: "40px",
              }}
            >
              We review every application personally. If you're a fit for founding
              access, you'll receive an invite code by email within 24–48 hours.
            </p>
            <Link href="/">
              <button
                style={{
                  padding: "12px 32px",
                  background: "transparent",
                  border: "1px solid rgba(245,166,35,0.4)",
                  borderRadius: "6px",
                  color: "#F5A623",
                  fontSize: "14px",
                  fontWeight: 600,
                  cursor: "pointer",
                  letterSpacing: "0.04em",
                }}
              >
                Return home
              </button>
            </Link>
          </div>
        ) : (
          /* ── Form ──────────────────────────────────────────────────────── */
          <div
            style={{
              maxWidth: "520px",
              width: "100%",
              animation: "oh-fade-up 0.5s ease both",
            }}
          >
            {/* Header */}
            <div style={{ marginBottom: "48px" }}>
              <p
                style={{
                  fontSize: "11px",
                  letterSpacing: "0.15em",
                  color: "#F5A623",
                  fontWeight: 700,
                  textTransform: "uppercase",
                  marginBottom: "12px",
                }}
              >
                Founding Access
              </p>
              <h1
                style={{
                  fontFamily: "Playfair Display, serif",
                  fontSize: "clamp(28px, 5vw, 44px)",
                  fontWeight: 700,
                  lineHeight: 1.15,
                  marginBottom: "16px",
                }}
              >
                Apply for Operator House.
              </h1>
              <p
                style={{
                  color: "rgba(232,228,217,0.6)",
                  fontSize: "15px",
                  lineHeight: 1.7,
                }}
              >
                Founding access is limited and reviewed personally. Tell us who you
                are and why you're ready to operate at this level.
              </p>
            </div>

            {/* Form */}
            <form onSubmit={handleSubmit} style={{ display: "flex", flexDirection: "column", gap: "20px" }}>
              {/* Name */}
              <div>
                <label
                  style={{
                    display: "block",
                    fontSize: "12px",
                    letterSpacing: "0.08em",
                    color: "rgba(232,228,217,0.5)",
                    fontWeight: 600,
                    textTransform: "uppercase",
                    marginBottom: "8px",
                  }}
                >
                  Full Name
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) => setForm((f) => ({ ...f, name: e.target.value }))}
                  placeholder="Your name"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Email */}
              <div>
                <label style={labelStyle}>Email Address</label>
                <input
                  type="email"
                  value={form.email}
                  onChange={(e) => setForm((f) => ({ ...f, email: e.target.value }))}
                  placeholder="you@example.com"
                  required
                  style={inputStyle}
                />
              </div>

              {/* Reason */}
              <div>
                <label style={labelStyle}>Why are you ready for this?</label>
                <textarea
                  value={form.reason}
                  onChange={(e) => setForm((f) => ({ ...f, reason: e.target.value }))}
                  placeholder="Tell us about your consulting practice, who you serve, and what you're trying to build."
                  required
                  rows={5}
                  style={{
                    ...inputStyle,
                    resize: "vertical",
                    minHeight: "120px",
                  }}
                />
                <p
                  style={{
                    fontSize: "12px",
                    color: "rgba(232,228,217,0.35)",
                    marginTop: "6px",
                  }}
                >
                  {form.reason.length}/2000
                </p>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={submit.isPending}
                style={{
                  padding: "14px 32px",
                  background: submit.isPending
                    ? "rgba(245,166,35,0.4)"
                    : "linear-gradient(135deg, #F5A623 0%, #E8940F 100%)",
                  border: "none",
                  borderRadius: "6px",
                  color: "#0A0A0B",
                  fontSize: "14px",
                  fontWeight: 700,
                  cursor: submit.isPending ? "not-allowed" : "pointer",
                  letterSpacing: "0.04em",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  gap: "8px",
                  transition: "opacity 200ms",
                  marginTop: "8px",
                }}
              >
                {submit.isPending && <Loader2 size={16} className="animate-spin" />}
                {submit.isPending ? "Submitting…" : "Submit Application →"}
              </button>

              <p
                style={{
                  fontSize: "12px",
                  color: "rgba(232,228,217,0.35)",
                  textAlign: "center",
                  lineHeight: 1.6,
                }}
              >
                Already have an invite code?{" "}
                <Link href="/redeem">
                  <span style={{ color: "#F5A623", cursor: "pointer" }}>Redeem it here →</span>
                </Link>
              </p>
            </form>
          </div>
        )}
      </main>
    </div>
  );
}

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
  transition: "border-color 200ms",
  boxSizing: "border-box",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontSize: "12px",
  letterSpacing: "0.08em",
  color: "rgba(232,228,217,0.5)",
  fontWeight: 600,
  textTransform: "uppercase",
  marginBottom: "8px",
};
