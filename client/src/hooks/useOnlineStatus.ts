import { useState, useEffect } from "react";

/**
 * Tracks browser/WebView online status.
 * Uses navigator.onLine as initial value and listens to the
 * window "online" / "offline" events for live updates.
 *
 * Capacitor note: These events fire correctly in Capacitor WebView on both
 * iOS and Android. No plugin swap required.
 */
export function useOnlineStatus(): boolean {
  const [isOnline, setIsOnline] = useState<boolean>(
    typeof navigator !== "undefined" ? navigator.onLine : true
  );

  useEffect(() => {
    const goOnline = () => setIsOnline(true);
    const goOffline = () => setIsOnline(false);

    window.addEventListener("online", goOnline);
    window.addEventListener("offline", goOffline);

    return () => {
      window.removeEventListener("online", goOnline);
      window.removeEventListener("offline", goOffline);
    };
  }, []);

  return isOnline;
}
