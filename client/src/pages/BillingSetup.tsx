/* =============================================================================
   Operator House — Billing Setup (Pattern B)
   Shown after invite code redemption. User selects a tier and sets up a PayPal
   subscription with 90-day trial. No charge during beta.
   ============================================================================= */
import { useState, useEffect, useRef } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { CheckCircle, Loader2, Shield } from "lucide-react";
import { useAuth } from "@/_core/hooks/useAuth";

const OH_SYMBOL =
  "https://d2xsxph8kpxj0f.cloudfront.net/310519663270045694/UYrVyz2BYHYzFAx4PneEpK/oh-symbol-gold_7639fe83.webp";

declare global {
  interface Window {
    paypal?: any;
  }
}

export default function BillingSetup() {
  const [location, navigate] = useLocation();
  const { user } = useAuth();
  const [selectedTier, setSelectedTier] = useState<"operator" | "operator_pro">(() =>
    new URLSearchParams(location.split("?")[1]).get("tier") === "operator_pro" ? "operator_pro" : "operator"
  );
  const [sdkLoaded, setSdkLoaded] = useState(false);
  const [subscriptionDone, setSubscriptionDone] = useState(false);
  const buttonContainerRef = useRef<HTMLDivElement>(null);
  const renderedTierRef = useRef<string | null>(null);

  const plansQuery = trpc.paypal.plans.useQuery();
  const captureSubscription = trpc.paypal.captureSubscription.useMutation({
    onSuccess: (data) => {
      setSubscriptionDone(true);
      toast.success("Founding access activated — welcome to Operator House.");
      setTimeout(() => navigate("/dashboard"), 1500);
    },
    onError: (err) => {
      toast.error(err.message || "Could not activate subscription.");
    },
  });

  // Load PayPal SDK
  useEffect(() => {
    if (!plansQuery.data?.clientId) return;
    if (window.paypal) { setSdkLoaded(true); return; }
    const script = document.createElement("script");
    script.src = `https://www.paypal.com/sdk/js?client-id=${plansQuery.data.clientId}&vault=true&intent=subscription`;
    script.setAttribute("data-sdk-integration-source", "button-factory");
    script.onload = () => setSdkLoaded(true);
    script.onerror = () => toast.error("Could not load PayPal. Please refresh.");
    document.head.appendChild(script);
  }, [plansQuery.data?.clientId]);

  useEffect(() => {
    const requestedTier = new URLSearchParams(location.split("?")[1]).get("tier");
    if (requestedTier === "operator" || requestedTier === "operator_pro") setSelectedTier(requestedTier);
  }, [location]);

  // Render PayPal button when SDK ready and tier selected
  useEffect(() => {
    if (!sdkLoaded || !plansQuery.data || !buttonContainerRef.current) return;
    if (renderedTierRef.current === selectedTier) return; // already rendered for this tier

    const planId = selectedTier === "operator"
      ? plansQuery.data.plans.operator.planId
      : plansQuery.data.plans.operator_pro.planId;

    if (!planId) {
      toast.error("Plan configuration error. Please contact support.");
      return;
    }

    // Clear previous button
    if (buttonContainerRef.current) {
      buttonContainerRef.current.innerHTML = "";
    }
    renderedTierRef.current = selectedTier;

    window.paypal.Buttons({
      style: {
        shape: "rect",
        color: "gold",
        layout: "vertical",
        label: "subscribe",
      },
      createSubscription: (_data: any, actions: any) => {
        return actions.subscription.create({
          plan_id: planId,
          subscriber: {
            name: { given_name: user?.name ?? "" },
            email_address: user?.email ?? "",
          },
          application_context: {
            shipping_preference: "NO_SHIPPING",
            user_action: "SUBSCRIBE_NOW",
          },
        });
      },
      onApprove: async (data: { subscriptionID: string }) => {
        try {
          await captureSubscription.mutateAsync({
            subscriptionId: data.subscriptionID,
            tier: selectedTier,
          });
        } catch {
          // The mutation callback provides the branded recovery toast.
        }
      },
      onError: (err: any) => {
        console.error("[PayPal] Subscription error:", err);
        toast.error("Something went wrong with PayPal. Please try again.");
      },
      onCancel: () => {
        toast.info("Subscription setup cancelled. You can set this up later in Settings.");
      },
    }).render(buttonContainerRef.current);
  }, [sdkLoaded, selectedTier, plansQuery.data]);

  // Re-render button on tier change
  useEffect(() => {
    if (renderedTierRef.current && renderedTierRef.current !== selectedTier) {
      renderedTierRef.current = null; // force re-render
    }
  }, [selectedTier]);

  if (subscriptionDone) {
    return (
      <div style={{ ...pageStyle, alignItems: "center", justifyContent: "center" }}>
        <div style={{ textAlign: "center", display: "flex", flexDirection: "column", alignItems: "center", gap: 16 }}>
          <CheckCircle size={48} style={{ color: "#F5A623" }} />
          <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, color: "#E8E4D9", margin: 0 }}>
            Founding access activated.
          </h1>
          <p style={{ color: "rgba(232,228,217,0.5)", fontSize: 14 }}>Taking you to your dashboard…</p>
          <Loader2 size={20} style={{ color: "#F5A623", animation: "spin 1s linear infinite" }} />
        </div>
      </div>
    );
  }

  return (
    <div style={pageStyle}>
      {/* Nav */}
      <nav style={navStyle}>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <img src={OH_SYMBOL} alt="Operator House" style={{ height: 32, width: 32 }} />
          <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, letterSpacing: "0.15em", color: "rgba(245,166,35,0.7)", textTransform: "uppercase" }}>Operator House</span>
        </div>
        <button onClick={() => navigate("/pricing")} style={{ background: "none", border: "none", color: "rgba(232,228,217,0.58)", cursor: "pointer", fontSize: 12, textDecoration: "underline" }}>Back to pricing</button>
      </nav>

      <main style={mainStyle}>
        <div style={{ width: "100%", maxWidth: 520 }}>
          {/* Header */}
          <div style={{ textAlign: "center", marginBottom: 32 }}>
            <p style={{ fontFamily: "Fira Code, monospace", fontSize: 10, letterSpacing: "0.2em", textTransform: "uppercase", color: "rgba(245,166,35,0.6)", marginBottom: 8 }}>
              Step 2 of 2 — Billing Setup
            </p>
            <h1 style={{ fontFamily: "Playfair Display, serif", fontSize: 28, fontWeight: 700, color: "#E8E4D9", margin: "0 0 12px" }}>
              Lock in your founding rate.
            </h1>
            <p style={{ color: "rgba(232,228,217,0.55)", fontSize: 14, lineHeight: 1.7, maxWidth: 400, margin: "0 auto" }}>
              Set up a card on file now. <strong style={{ color: "#E8E4D9" }}>You won't be charged during your 90-day beta.</strong> At day 91, your locked founding rate kicks in — cancel anytime before then with one click.
            </p>
          </div>

          {/* Tier selector */}
          <div role="radiogroup" aria-label="Founding subscription tier" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(210px, 1fr))", gap: 12, marginBottom: 24 }}>
            {(["operator", "operator_pro"] as const).map((tier) => {
              const plan = plansQuery.data?.plans[tier];
              const isSelected = selectedTier === tier;
              return (
                <button
                  key={tier}
                  onClick={() => setSelectedTier(tier)}
                  role="radio"
                  aria-checked={isSelected}
                  style={{
                    padding: "20px 16px",
                    background: isSelected ? "rgba(245,166,35,0.08)" : "rgba(255,255,255,0.02)",
                    border: `1px solid ${isSelected ? "rgba(245,166,35,0.5)" : "rgba(255,255,255,0.08)"}`,
                    borderRadius: 8,
                    cursor: "pointer",
                    textAlign: "left",
                    transition: "all 200ms",
                  }}
                >
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 8 }}>
                    <span style={{ fontFamily: "Fira Code, monospace", fontSize: 11, letterSpacing: "0.1em", textTransform: "uppercase", color: isSelected ? "#F5A623" : "rgba(232,228,217,0.5)" }}>
                      {plan?.label ?? tier}
                    </span>
                    {isSelected && <CheckCircle size={14} style={{ color: "#F5A623", flexShrink: 0 }} />}
                  </div>
                  <div style={{ fontSize: 20, fontWeight: 700, color: "#E8E4D9", marginBottom: 2 }}>
                    {plan?.founding ?? "—"}
                  </div>
                  <div style={{ fontSize: 11, color: "rgba(232,228,217,0.35)", textDecoration: "line-through" }}>
                    retail {plan?.retail ?? ""}
                  </div>
                  <p style={{ fontSize: 11, color: "rgba(232,228,217,0.4)", marginTop: 8, lineHeight: 1.5 }}>
                    {plan?.description ?? ""}
                  </p>
                </button>
              );
            })}
          </div>

          {/* PayPal button */}
          <div style={{ marginBottom: 16 }}>
            {plansQuery.isError ? (
              <div role="alert" style={{ padding: "16px", border: "1px solid rgba(248,113,113,0.35)", borderRadius: 8, color: "rgba(254,202,202,0.9)", fontSize: 13, textAlign: "center" }}>
                Billing plans are temporarily unavailable. Please retry, or contact support if the issue continues.
              </div>
            ) : !sdkLoaded ? (
              <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, padding: "16px", color: "rgba(232,228,217,0.4)", fontSize: 13 }}>
                <Loader2 size={16} style={{ animation: "spin 1s linear infinite" }} />
                Loading PayPal…
              </div>
            ) : (
              <div ref={buttonContainerRef} />
            )}
          </div>

          {/* Trust note */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "center", gap: 8, color: "rgba(232,228,217,0.35)", fontSize: 12 }}>
            <Shield size={13} />
            <span>No charge for 90 days. Cancel anytime before day 91 — nothing fires.</span>
          </div>

          {/* Skip link */}
          <div style={{ textAlign: "center", marginTop: 20 }}>
            <button
              onClick={() => navigate("/dashboard")}
              style={{ background: "none", border: "none", color: "rgba(232,228,217,0.3)", fontSize: 12, cursor: "pointer", textDecoration: "underline" }}
            >
              Skip for now — set up billing in Settings later
            </button>
            <p style={{ margin: "12px 0 0", fontSize: 11, color: "rgba(232,228,217,0.3)" }}>By continuing, you can review the <a href="/terms" style={{ color: "inherit" }}>Terms</a> and <a href="/privacy" style={{ color: "inherit" }}>Privacy Policy</a>.</p>
          </div>
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
