import { Toaster } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import NotFound from "@/pages/NotFound";
import { useState } from "react";
import { Route, Switch } from "wouter";
import ErrorBoundary from "./components/ErrorBoundary";
import OHSplash from "./components/OHSplash";
import { ThemeProvider } from "./contexts/ThemeContext";
import Dashboard from "./pages/Dashboard";
import LeadIntel from "./pages/LeadIntel";
import Pipeline from "./pages/Pipeline";
import StrategyGen from "./pages/StrategyGen";
import Vault from "./pages/Vault";
import Analytics from "./pages/Analytics";
import Settings from "./pages/Settings";
import Tasks from "./pages/Tasks";
import Home from "./pages/Home";
function Router() {
  // make sure to consider if you need authentication for certain routes
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
      <Route path="/404" component={NotFound} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  // Show splash only on first load per session
  const [splashDone, setSplashDone] = useState(() => {
    return sessionStorage.getItem("oh_splash_shown") === "true";
  });

  const handleSplashComplete = () => {
    sessionStorage.setItem("oh_splash_shown", "true");
    setSplashDone(true);
  };

  return (
    <ErrorBoundary>
      <ThemeProvider defaultTheme="dark">
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
          {!splashDone && <OHSplash onComplete={handleSplashComplete} />}
          <Router />
        </TooltipProvider>
      </ThemeProvider>
    </ErrorBoundary>
  );
}

export default App;
