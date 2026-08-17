/**
 * SpectreContext — global Specter visibility preferences
 *
 * Reads spectreHidden + spectreChatbotEnabled from the user's profile and
 * exposes them to the entire component tree. Also provides optimistic
 * update helpers so the Settings page can toggle without a page reload.
 *
 * Usage:
 *   const { spectreHidden, spectreChatbotEnabled, setSpectreHidden, setSpectreChatbotEnabled } = useSpectre();
 */

import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { trpc } from "@/lib/trpc";
import { useAuth } from "@/_core/hooks/useAuth";

interface SpectreContextValue {
  /** When true, Specter is hidden from all UI contexts except the chatbot */
  spectreHidden: boolean;
  /** When true, the Specter chatbot widget is shown in the bottom-right corner */
  spectreChatbotEnabled: boolean;
  /** Loading state while fetching profile */
  loading: boolean;
  /** Optimistically update spectreHidden and persist to server */
  setSpectreHidden: (hidden: boolean) => void;
  /** Optimistically update spectreChatbotEnabled and persist to server */
  setSpectreChatbotEnabled: (enabled: boolean) => void;
}

const SpectreContext = createContext<SpectreContextValue>({
  spectreHidden: false,
  spectreChatbotEnabled: true,
  loading: true,
  setSpectreHidden: () => {},
  setSpectreChatbotEnabled: () => {},
});

export function SpectreProvider({ children }: { children: ReactNode }) {
  const { isAuthenticated, loading: authLoading } = useAuth();
  const { data: profile, isLoading } = trpc.profile.get.useQuery(undefined, {
    staleTime: 5 * 60 * 1000, // 5 min
    enabled: isAuthenticated,
  });

  const [spectreHidden, setSpectreHiddenLocal] = useState(false);
  const [spectreChatbotEnabled, setSpectreChatbotEnabledLocal] = useState(true);

  // Sync from server once loaded
  useEffect(() => {
    if (profile) {
      setSpectreHiddenLocal(profile.spectreHidden ?? false);
      setSpectreChatbotEnabledLocal(profile.spectreChatbotEnabled ?? true);
    }
  }, [profile]);

  const updatePrefs = trpc.profile.updateSpectrePrefs.useMutation();
  const utils = trpc.useUtils();

  const setSpectreHidden = (hidden: boolean) => {
    setSpectreHiddenLocal(hidden);
    updatePrefs.mutate(
      { spectreHidden: hidden },
      { onSuccess: () => utils.profile.get.invalidate() }
    );
  };

  const setSpectreChatbotEnabled = (enabled: boolean) => {
    setSpectreChatbotEnabledLocal(enabled);
    updatePrefs.mutate(
      { spectreChatbotEnabled: enabled },
      { onSuccess: () => utils.profile.get.invalidate() }
    );
  };

  return (
    <SpectreContext.Provider
      value={{
        spectreHidden,
        spectreChatbotEnabled,
        loading: authLoading || (isAuthenticated && isLoading),
        setSpectreHidden,
        setSpectreChatbotEnabled,
      }}
    >
      {children}
    </SpectreContext.Provider>
  );
}

export function useSpectre() {
  return useContext(SpectreContext);
}
