/* =============================================================================
   IntroReplayContext
   Provides a single `replayIntro()` function that any component can call to
   re-run the full splash → onboarding sequence, regardless of sessionStorage.
   ============================================================================= */
import { createContext, useContext, useState, useCallback, ReactNode } from "react";

interface IntroReplayContextValue {
  /** True while the replay sequence is running */
  isReplaying: boolean;
  /** Call this to start the replay from scratch */
  replayIntro: () => void;
  /** Internal: splash done callback */
  _onSplashComplete: () => void;
  /** Internal: onboarding done callback */
  _onOnboardingComplete: () => void;
  /** Internal: which phase of replay we're in */
  _replayPhase: "idle" | "splash" | "onboarding";
}

const IntroReplayContext = createContext<IntroReplayContextValue | null>(null);

export function IntroReplayProvider({ children }: { children: ReactNode }) {
  const [replayPhase, setReplayPhase] = useState<"idle" | "splash" | "onboarding">("idle");

  const replayIntro = useCallback(() => {
    // Clear the session flags so the normal gate would also show them
    sessionStorage.removeItem("oh_splash_shown");
    sessionStorage.removeItem("oh_onboarding_shown");
    setReplayPhase("splash");
  }, []);

  const _onSplashComplete = useCallback(() => {
    setReplayPhase("onboarding");
  }, []);

  const _onOnboardingComplete = useCallback(() => {
    // Restore the flags so they don't auto-show again on next navigation
    sessionStorage.setItem("oh_splash_shown", "true");
    sessionStorage.setItem("oh_onboarding_shown", "true");
    setReplayPhase("idle");
  }, []);

  return (
    <IntroReplayContext.Provider
      value={{
        isReplaying: replayPhase !== "idle",
        replayIntro,
        _onSplashComplete,
        _onOnboardingComplete,
        _replayPhase: replayPhase,
      }}
    >
      {children}
    </IntroReplayContext.Provider>
  );
}

export function useIntroReplay(): IntroReplayContextValue {
  const ctx = useContext(IntroReplayContext);
  if (!ctx) throw new Error("useIntroReplay must be used inside IntroReplayProvider");
  return ctx;
}
