import { Toaster } from "@/components/ui/sonner";
import { toast } from "sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useState, useEffect } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import OHSplash from "./components/OHSplash";
import { useAuth } from "./_core/hooks/useAuth";
import OnboardingFlow from "./components/OnboardingFlow";
import OfflineBanner from "./components/OfflineBanner";
import { ThemeProvider } from "./contexts/ThemeContext";
import { IntroReplayProvider, useIntroReplay } from "./contexts/IntroReplayContext";
import Dashboard from "./pages/Dashboard";
import LeadIntel from "./pages/LeadIntel";
import Pipeline from "./pages/Pipeline";
import StrategyGen from "./pages/StrategyGen";
import Vault from "./pages/Vault";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Tasks from "./pages/Tasks";
import About from "./pages/About";
import Home from "./pages/Home";
import Privacy from "./pages/Privacy";
import Terms from "./pages/Terms";
import Pricing from "./pages/Pricing";
import Pulse from "./pages/Pulse";
import EmailSequences from "./pages/EmailSequences";
import CallCenter from "./pages/CallCenter";
import SMS from "./pages/SMS";
import VoiceAgents from "./pages/VoiceAgents";
import CRM from "./pages/CRM";
import ContactProfile from "./pages/ContactProfile";
import Invoicing from "./pages/Invoicing";
import BookingPage from "./pages/Booking";
import PublicBooking from "./pages/PublicBooking";
import FunnelsPage from "./pages/Funnels";
import FunnelEditor from "./pages/FunnelEditor";
import Social from "./pages/Social";
import Automations from "./pages/Automations";
import WorkflowEditor from "./pages/WorkflowEditor";
import ClientPortalPage from "./pages/ClientPortal";
import PublicPortal from "./pages/PublicPortal";
import ContractsPage from "./pages/Contracts";
import SignContract from "./pages/SignContract";
import Reputation from "./pages/Reputation";
import ReviewForm from "./pages/ReviewForm";
import Team from "./pages/Team";
import JoinTeam from "./pages/JoinTeam";
import Integrations from "./pages/Integrations";
import Audit from "./pages/Audit";
import Prospecting from "./pages/Prospecting";
import ApolloSearch from "./pages/ApolloSearch";
import LinkedInOutreach from "./pages/LinkedInOutreach";
import PublicFunnel from "./pages/PublicFunnel";
import { SpectreChatbot } from "./components/SpectreChatbot";
import { trpc } from "./lib/trpc";
import Apply from "./pages/Apply";
import Redeem from "./pages/Redeem";
import InviteRedeem from "./pages/InviteRedeem";
import BillingSetup from "./pages/BillingSetup";
import AdminCodes from "./pages/AdminCodes";

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route path="/apply" component={Apply} />
      <Route path="/redeem" component={Redeem} />
      <Route path="/invite/:code" component={InviteRedeem} />
      <Route path="/billing-setup" component={BillingSetup} />
      <Route path="/admin/codes" component={AdminCodes} />
      <Route path="/dashboard" component={Dashboard} />
      <Route path="/leads" component={LeadIntel} />
      <Route path="/pipeline" component={Pipeline} />
      <Route path="/strategy" component={StrategyGen} />
      <Route path="/vault" component={Vault} />
      <Route path="/analytics" component={Analytics} />
      <Route path="/settings" component={Settings} />
      <Route path="/tasks" component={Tasks} />
      <Route path="/about" component={About} />
      <Route path="/pricing" component={Pricing} />
      <Route path="/pulse" component={Pulse} />
      <Route path="/email-sequences" component={EmailSequences} />
      <Route path="/call-center" component={CallCenter} />
      <Route path="/sms" component={SMS} />
      <Route path="/voice-agents" component={VoiceAgents} />
      <Route path="/crm" component={CRM} />
      <Route path="/crm/:id" component={ContactProfile} />
      <Route path="/invoicing" component={Invoicing} />
      <Route path="/booking" component={BookingPage} />
      <Route path="/book/:slug" component={PublicBooking} />
      <Route path="/funnels" component={FunnelsPage} />
      <Route path="/funnels/:id/edit" component={FunnelEditor} />
      <Route path="/social" component={Social} />
      <Route path="/automations" component={Automations} />
      <Route path="/automations/:id/edit" component={WorkflowEditor} />
      <Route path="/portal" component={ClientPortalPage} />
      <Route path="/portal/:token" component={PublicPortal} />
      <Route path="/contracts" component={ContractsPage} />
      <Route path="/sign/:token" component={SignContract} />
      <Route path="/reputation" component={Reputation} />
      <Route path="/review/:token" component={ReviewForm} />
      <Route path="/team" component={Team} />
        <Route path="/integrations" component={Integrations} />
      <Route path="/prospecting" component={Prospecting} />
      <Route path="/apollo" component={ApolloSearch} />
      <Route path="/linkedin" component={LinkedInOutreach} />
      <Route path="/join-team/:token" component={JoinTeam} />
      <Route path="/f/:slug" component={PublicFunnel} />
      <Route path="/audit" component={Audit} />
      <Route path="/privacy" component={Privacy} />
      <Route path="/terms" component={Terms} />
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

/**
 * Handles both the first-run gate AND the replay overlay.
 * Must be rendered inside IntroReplayProvider.
 */


// ── PWA post-install toast + push subscription ────────────────────────────
function usePWAFeatures() {
  const { user } = useAuth();
  const vapidKeyQuery = trpc.push.vapidKey.useQuery(undefined, {
    enabled: !!user && 'serviceWorker' in navigator && 'PushManager' in window,
    staleTime: Infinity,
  });
  const subscribeMutation = trpc.push.subscribe.useMutation();

  // 1. Post-install standalone welcome toast
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (!isStandalone) return;
    const key = 'oh_pwa_welcomed';
    try {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, '1');
    } catch { /* private mode */ }
    setTimeout(() => toast("You're in the House.", {
      description: "Tap the icon anytime to return.",
      duration: 5000,
    }), 1200);
  }, []);

  // 2. Subscribe to push notifications — only after the user has already
  //    granted permission (e.g. from Settings). We never call
  //    Notification.requestPermission() silently here; that must be triggered
  //    by an explicit user action to comply with browser permission UX guidelines.
  useEffect(() => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    const publicKey = vapidKeyQuery.data?.publicKey;
    if (!publicKey) return;

    // Only proceed if the user has already granted permission
    if (Notification.permission !== 'granted') return;

    try { if (localStorage.getItem('oh_push_subscribed')) return; } catch { /* private mode */ }

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        const existing = await reg.pushManager.getSubscription();
        if (existing) {
          try { localStorage.setItem('oh_push_subscribed', '1'); } catch {}
          return;
        }
        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        });
        const { endpoint, keys } = sub.toJSON() as any;
        await subscribeMutation.mutateAsync({ endpoint, p256dh: keys.p256dh, auth: keys.auth });
        try { localStorage.setItem('oh_push_subscribed', '1'); } catch {}
      } catch (e) {
        console.warn('[PWA] push subscription failed', e);
      }
    })();
  }, [user, vapidKeyQuery.data]);
}

// ── PWA Install Banner ────────────────────────────────────────────────────────
function PWAInstallBanner() {
  const [prompt, setPrompt] = useState<any>(null);
  const [dismissed, setDismissed] = useState(() => {
    try { return localStorage.getItem("oh_pwa_dismissed") === "1"; } catch { return false; }
  });

  useEffect(() => {
    const handler = (e: Event) => { e.preventDefault(); setPrompt(e); };
    window.addEventListener("beforeinstallprompt", handler as EventListener);
    return () => window.removeEventListener("beforeinstallprompt", handler as EventListener);
  }, []);

  if (!prompt || dismissed) return null;

  const install = async () => {
    prompt.prompt();
    const { outcome } = await prompt.userChoice;
    if (outcome === "accepted" || outcome === "dismissed") {
      setPrompt(null);
      if (outcome === "dismissed") {
        try { localStorage.setItem("oh_pwa_dismissed", "1"); } catch {}
        setDismissed(true);
      }
    }
  };

  const dismiss = () => {
    try { localStorage.setItem("oh_pwa_dismissed", "1"); } catch {}
    setDismissed(true);
    setPrompt(null);
  };

  return (
    <div style={{
      position: "fixed", bottom: "1.2rem", left: "50%", transform: "translateX(-50%)",
      zIndex: 500, display: "flex", alignItems: "center", gap: "0.8rem",
      background: "rgba(14,12,9,0.95)", border: "1px solid rgba(216,168,90,0.35)",
      borderRadius: "100px", padding: "0.55rem 0.8rem 0.55rem 1.1rem",
      boxShadow: "0 8px 40px rgba(0,0,0,0.55), 0 0 0 1px rgba(216,168,90,0.08)",
      backdropFilter: "blur(20px)",
      fontFamily: "'JetBrains Mono','Fira Code',monospace",
    }}>
      <span style={{ fontSize: "0.72rem", color: "rgba(240,234,216,0.75)", letterSpacing: "0.04em", whiteSpace: "nowrap" }}>
        Install Operator House
      </span>
      <button onClick={install} style={{
        background: "rgba(216,168,90,0.9)", color: "#0e0c09", border: "none",
        borderRadius: "100px", padding: "0.3rem 0.85rem",
        fontSize: "0.7rem", fontWeight: 700, cursor: "pointer",
        fontFamily: "inherit", letterSpacing: "0.06em",
        transition: "background 200ms",
      }}>Add to Home</button>
      <button onClick={dismiss} style={{
        background: "transparent", border: "none", color: "rgba(255,255,255,0.3)",
        cursor: "pointer", fontSize: "0.9rem", lineHeight: 1, padding: "0 0.2rem",
      }}>×</button>
    </div>
  );
}

/**
 * Authenticated intro layer — only mounts when user is logged in.
 * Safe to call protectedProcedure mutations here.
 */
function AuthenticatedIntroLayer({
  user,
  _replayPhase,
  _onSplashComplete,
  _onOnboardingComplete,
}: {
  user: NonNullable<ReturnType<typeof useAuth>["user"]>;
  _replayPhase: string | null;
  _onSplashComplete: () => void;
  _onOnboardingComplete: () => void;
}) {
  const [splashDone, setSplashDone] = useState(() => {
    try {
      return sessionStorage.getItem("oh_splash_shown") === "true";
    } catch {
      return false;
    }
  });
  const markIntroSeen = trpc.paypal.markIntroSeen.useMutation();

  const handleOnboardingComplete = () => {
    localStorage.setItem("oh_onboarding_complete", "true");
    markIntroSeen.mutate();
  };
  const handleSplashComplete = () => {
    sessionStorage.setItem("oh_splash_shown", "true");
    setSplashDone(true);
  };

  if (_replayPhase === "splash") {
    return <OHSplash onComplete={_onSplashComplete} userName={user.name} />;
  }
  if (_replayPhase === "onboarding") {
    return <OnboardingFlow onComplete={_onOnboardingComplete} isReplay />;
  }

  // First-run: DB flag is the source of truth for authenticated users
  if ((user as any).needsIntro === true) {
    return <OnboardingFlow onComplete={handleOnboardingComplete} isAuthenticated />;
  }
  // Each new session: brief splash
  if (!splashDone) {
    return <OHSplash onComplete={handleSplashComplete} userName={user.name} />;
  }
  return null;
}

/**
 * Visitor (unauthenticated) intro layer — NO tRPC mutations, pure localStorage.
 * Safe to render for any visitor on the marketing site.
 */
function VisitorIntroLayer({
  _replayPhase,
  _onSplashComplete,
  _onOnboardingComplete,
}: {
  _replayPhase: string | null;
  _onSplashComplete: () => void;
  _onOnboardingComplete: () => void;
}) {
  const [localOnboardingDone, setLocalOnboardingDone] = useState(() => {
    try {
      return localStorage.getItem("oh_onboarding_complete") === "true";
    } catch {
      return false;
    }
  });

  // Track whether the visitor splash has been shown this session
  const [visitorSplashDone, setVisitorSplashDone] = useState(() => {
    try {
      return sessionStorage.getItem("oh_visitor_splash_shown") === "true";
    } catch {
      return false;
    }
  });

  const handleVisitorSplashComplete = () => {
    try { sessionStorage.setItem("oh_visitor_splash_shown", "true"); } catch { /* ignore */ }
    setVisitorSplashDone(true);
    _onSplashComplete();
  };

  const handleOnboardingComplete = () => {
    localStorage.setItem("oh_onboarding_complete", "true");
    setLocalOnboardingDone(true);
    _onOnboardingComplete();
  };

  if (_replayPhase === "splash") {
    return <OHSplash onComplete={_onSplashComplete} />;
  }
  if (_replayPhase === "onboarding") {
    return <OnboardingFlow onComplete={_onOnboardingComplete} isReplay />;
  }

  // New visitor: show splash first, then onboarding
  if (!localOnboardingDone) {
    if (!visitorSplashDone) {
      return <OHSplash onComplete={handleVisitorSplashComplete} />;
    }
    return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  }
  return null;
}

function IntroLayer() {
  const { _replayPhase, _onSplashComplete, _onOnboardingComplete } = useIntroReplay();
  const { user, loading: authLoading } = useAuth();

  // Check localStorage immediately — no auth wait needed
  const onboardingAlreadyDone = (() => {
    try { return localStorage.getItem("oh_onboarding_complete") === "true"; } catch { return false; }
  })();

  // If onboarding is not done yet, show VisitorIntroLayer immediately — don't wait for auth.
  // This ensures new visitors see the splash + onboarding the instant the page loads.
  // Once auth resolves and we have a logged-in user with needsIntro=true,
  // AuthenticatedIntroLayer handles the DB-persisted flag via markIntroSeen.
  if (!onboardingAlreadyDone && !user) {
    return (
      <VisitorIntroLayer
        _replayPhase={_replayPhase}
        _onSplashComplete={_onSplashComplete}
        _onOnboardingComplete={_onOnboardingComplete}
      />
    );
  }

  // Auth still loading but onboarding is done — nothing to show yet
  if (authLoading) return null;

  if (user) {
    return (
      <AuthenticatedIntroLayer
        user={user}
        _replayPhase={_replayPhase}
        _onSplashComplete={_onSplashComplete}
        _onOnboardingComplete={_onOnboardingComplete}
      />
    );
  }

  // Unauthenticated visitor who already completed onboarding
  return (
    <VisitorIntroLayer
      _replayPhase={_replayPhase}
      _onSplashComplete={_onSplashComplete}
      _onOnboardingComplete={_onOnboardingComplete}
    />
  );
}

function App() {
  usePWAFeatures();
  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
        <IntroReplayProvider>
          <OfflineBanner />
          <TooltipProvider>
            <Toaster
              theme="dark"
              toastOptions={{
                duration: 4500,
                style: {
                  background: '#18181E',
                  border: '1px solid rgba(245, 166, 35, 0.3)',
                  color: '#E8E6E0',
                  fontFamily: 'DM Sans, sans-serif',
                },
              }}
            />
            <IntroLayer />
            <PWAInstallBanner />
            <Router />
            <SpectreChatbot />
          </TooltipProvider>
        </IntroReplayProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
