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

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
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
      <Route path="/join-team/:token" component={JoinTeam} />
      <Route path="/f/:slug" component={() => <div>Funnel public page</div>} />
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

  // 1. Post-install standalone welcome toast
  useEffect(() => {
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches
      || (window.navigator as any).standalone === true;
    if (!isStandalone) return;
    const key = 'oh_pwa_welcomed';
    if (localStorage.getItem(key)) return;
    localStorage.setItem(key, '1');
    setTimeout(() => toast("You're in the House.", {
      description: "Tap the icon anytime to return.",
      duration: 5000,
    }), 1200);
  }, []);

  // 2. Auto-subscribe to push notifications once user is logged in
  useEffect(() => {
    if (!user) return;
    if (!('serviceWorker' in navigator) || !('PushManager' in window)) return;
    if (localStorage.getItem('oh_push_subscribed')) return;

    (async () => {
      try {
        const reg = await navigator.serviceWorker.ready;
        // Fetch VAPID public key
        const res = await fetch('/api/trpc/push.vapidKey?batch=1&input=%7B%220%22%3A%7B%22json%22%3Anull%7D%7D', { credentials: 'include' });
        const json = await res.json();
        const publicKey = json?.[0]?.result?.data?.json?.publicKey;
        if (!publicKey) return;

        const existing = await reg.pushManager.getSubscription();
        if (existing) { localStorage.setItem('oh_push_subscribed', '1'); return; }

        const permission = await Notification.requestPermission();
        if (permission !== 'granted') return;

        const sub = await reg.pushManager.subscribe({
          userVisibleOnly: true,
          applicationServerKey: publicKey,
        });
        const { endpoint, keys } = sub.toJSON() as any;
        await fetch('/api/trpc/push.subscribe', {
          method: 'POST',
          credentials: 'include',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ "0": { json: { endpoint, p256dh: keys.p256dh, auth: keys.auth } } }),
        });
        localStorage.setItem('oh_push_subscribed', '1');
      } catch (e) {
        console.warn('[PWA] push subscription failed', e);
      }
    })();
  }, [user]);
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

function IntroLayer() {
  const { _replayPhase, _onSplashComplete, _onOnboardingComplete } = useIntroReplay();
  const { user } = useAuth();

  // Onboarding slides: shown ONCE ever, gated by localStorage (persists across sessions)
  const [onboardingDone, setOnboardingDone] = useState(() =>
    localStorage.getItem("oh_onboarding_complete") === "true"
  );
  // Splash: shown once per session (brief brand moment, only after onboarding is permanently done)
  const [splashDone, setSplashDone] = useState(() =>
    sessionStorage.getItem("oh_splash_shown") === "true"
  );

  const handleOnboardingComplete = () => {
    localStorage.setItem("oh_onboarding_complete", "true");
    setOnboardingDone(true);
  };
  const handleSplashComplete = () => {
    sessionStorage.setItem("oh_splash_shown", "true");
    setSplashDone(true);
  };

  // Replay takes priority over the first-run gate
  if (_replayPhase === "splash") {
    return <OHSplash onComplete={_onSplashComplete} userName={user?.name} />;
  }
  if (_replayPhase === "onboarding") {
    return <OnboardingFlow onComplete={_onOnboardingComplete} isReplay />;
  }

  // Step 1: New visitor — show onboarding slides FIRST (before welcome/sign-in page)
  if (!onboardingDone) return <OnboardingFlow onComplete={handleOnboardingComplete} />;
  // Step 2: Each new session — brief splash after onboarding is permanently done
  if (!splashDone) return <OHSplash onComplete={handleSplashComplete} userName={user?.name} />;
  // Step 3: Returning user — nothing to show, Router renders Home or app normally
  return null;
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
          </TooltipProvider>
        </IntroReplayProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
