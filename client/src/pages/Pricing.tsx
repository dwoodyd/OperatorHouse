import { useState } from "react";
import { useLocation } from "wouter";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";
import { getLoginUrl } from "@/const";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import { Check, Zap, Shield, Brain, ChevronLeft } from "lucide-react";

const FEATURES = [
  "The Vault — IP & knowledge base",
  "Lead Intelligence — AI Operator Audit",
  "Pipeline — deal tracking & slide-over",
  "Strategy Generator — AI playbooks",
  "Command Line — AI strategist chat",
  "Briefings — client context cards",
  "Tasks & activity log",
  "Owner push notifications",
  "Mobile-ready (Capacitor-ready)",
];

export default function Pricing() {
  const [, setLocation] = useLocation();
  const { user, isAuthenticated } = useAuth();
  const [billing, setBilling] = useState<"monthly" | "annual">("annual");
  const [loading, setLoading] = useState<string | null>(null);

  const createCheckout = trpc.stripe.createCheckout.useMutation();

  const handleCheckout = async (plan: "monthly" | "annual") => {
    if (!isAuthenticated) {
      window.location.href = getLoginUrl();
      return;
    }
    setLoading(plan);
    try {
      const result = await createCheckout.mutateAsync({
        plan,
        origin: window.location.origin,
      });
      if (result.url) {
        toast.success("Redirecting to checkout…", { description: "Opening Stripe in a new tab." });
        window.open(result.url, "_blank");
      }
    } catch (err: unknown) {
      const msg = err instanceof Error ? err.message : "Checkout failed";
      toast.error(msg);
    } finally {
      setLoading(null);
    }
  };

  return (
    <div className="min-h-screen bg-[#1a1a1a] text-[#f5f0e8]">
      {/* Nav */}
      <nav className="fixed top-0 left-0 right-0 z-50 flex items-center justify-between px-6 py-4 border-b border-white/10 bg-[#1a1a1a]/95 backdrop-blur-sm">
        <button
          onClick={() => setLocation("/")}
          className="flex items-center gap-2 text-sm text-[#f5f0e8]/60 hover:text-[#f5f0e8] transition-colors"
        >
          <ChevronLeft className="w-4 h-4" />
          Back
        </button>
        <span className="text-sm font-semibold tracking-widest uppercase text-[#f5f0e8]/40">
          Operator House
        </span>
        {isAuthenticated ? (
          <button
            onClick={() => setLocation("/dashboard")}
            className="text-sm text-[#c9a84c] hover:text-[#e8c96a] transition-colors"
          >
            Dashboard →
          </button>
        ) : (
          <a href={getLoginUrl()} className="text-sm text-[#c9a84c] hover:text-[#e8c96a] transition-colors">
            Sign in
          </a>
        )}
      </nav>

      <div className="pt-28 pb-24 px-6 max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-12">
          <Badge className="mb-4 bg-[#c9a84c]/15 text-[#c9a84c] border-[#c9a84c]/30 text-xs tracking-widest uppercase">
            Beta Access
          </Badge>
          <h1 className="text-4xl md:text-5xl font-bold mb-4 tracking-tight">
            One plan. Full access.
          </h1>
          <p className="text-[#f5f0e8]/60 text-lg max-w-xl mx-auto">
            Everything you need to run your consulting practice like an Operator — AI-powered, context-aware, and built for closers.
          </p>

          {/* Billing toggle */}
          <div className="flex items-center justify-center gap-3 mt-8">
            <button
              onClick={() => setBilling("monthly")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                billing === "monthly"
                  ? "bg-[#c9a84c] text-[#1a1a1a]"
                  : "text-[#f5f0e8]/50 hover:text-[#f5f0e8]"
              }`}
            >
              Monthly
            </button>
            <button
              onClick={() => setBilling("annual")}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                billing === "annual"
                  ? "bg-[#c9a84c] text-[#1a1a1a]"
                  : "text-[#f5f0e8]/50 hover:text-[#f5f0e8]"
              }`}
            >
              Annual
              <span className="ml-2 text-xs bg-green-500/20 text-green-400 px-1.5 py-0.5 rounded">
                Save 32%
              </span>
            </button>
          </div>
        </div>

        {/* Plan card */}
        <div className="relative max-w-md mx-auto">
          <div className="absolute -inset-px rounded-2xl bg-gradient-to-b from-[#c9a84c]/40 to-transparent" />
          <div className="relative bg-[#242424] rounded-2xl p-8 border border-[#c9a84c]/20">
            <div className="flex items-start justify-between mb-6">
              <div>
                <p className="text-xs tracking-widest uppercase text-[#c9a84c] mb-1">Operator</p>
                <div className="flex items-baseline gap-1">
                  <span className="text-5xl font-bold">
                    {billing === "annual" ? "$66" : "$97"}
                  </span>
                  <span className="text-[#f5f0e8]/40 text-sm">/month</span>
                </div>
                {billing === "annual" && (
                  <p className="text-xs text-[#f5f0e8]/40 mt-1">Billed $797/year</p>
                )}
              </div>
              <div className="flex gap-2">
                <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
                  <Brain className="w-4 h-4 text-[#c9a84c]" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
                  <Shield className="w-4 h-4 text-[#c9a84c]" />
                </div>
                <div className="w-8 h-8 rounded-lg bg-[#c9a84c]/10 flex items-center justify-center">
                  <Zap className="w-4 h-4 text-[#c9a84c]" />
                </div>
              </div>
            </div>

            <ul className="space-y-3 mb-8">
              {FEATURES.map((f) => (
                <li key={f} className="flex items-center gap-3 text-sm text-[#f5f0e8]/80">
                  <Check className="w-4 h-4 text-[#c9a84c] shrink-0" />
                  {f}
                </li>
              ))}
            </ul>

            <Button
              onClick={() => handleCheckout(billing)}
              disabled={loading !== null}
              className="w-full bg-[#c9a84c] hover:bg-[#e8c96a] text-[#1a1a1a] font-semibold py-3 rounded-xl transition-colors"
            >
              {loading === billing
                ? "Opening checkout…"
                : `Get Access — ${billing === "annual" ? "$797/year" : "$97/month"}`}
            </Button>

            <p className="text-center text-xs text-[#f5f0e8]/30 mt-4">
              Test card: 4242 4242 4242 4242 · Secure checkout via Stripe
            </p>
          </div>
        </div>

        {/* Trust line */}
        <p className="text-center text-xs text-[#f5f0e8]/30 mt-10">
          Cancel anytime · No setup fees · Promotion codes accepted at checkout
        </p>
      </div>
    </div>
  );
}
