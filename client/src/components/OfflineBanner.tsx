/* =============================================================================
   Operator House — Offline Banner
   Slides down from the top when the connection is lost.
   Slides back up and shows a brief "Back online" confirmation on reconnect.
   ============================================================================= */
import { useState, useEffect } from "react";
import { WifiOff, Wifi } from "lucide-react";
import { useOnlineStatus } from "@/hooks/useOnlineStatus";

export default function OfflineBanner() {
  const isOnline = useOnlineStatus();
  const [visible, setVisible] = useState(false);
  const [showReconnected, setShowReconnected] = useState(false);
  const [wasOffline, setWasOffline] = useState(false);

  useEffect(() => {
    if (!isOnline) {
      setVisible(true);
      setShowReconnected(false);
      setWasOffline(true);
    } else if (wasOffline) {
      // Coming back online — swap to "reconnected" state briefly
      setShowReconnected(true);
      const timer = setTimeout(() => {
        setVisible(false);
        setShowReconnected(false);
        setWasOffline(false);
      }, 2500);
      return () => clearTimeout(timer);
    }
  }, [isOnline, wasOffline]);

  if (!visible) return null;

  return (
    <div
      role="alert"
      aria-live="assertive"
      style={{
        position: "fixed",
        top: 0,
        left: 0,
        right: 0,
        zIndex: 9999,
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        gap: "10px",
        padding: "10px 20px",
        background: showReconnected
          ? "rgba(74, 222, 128, 0.12)"
          : "rgba(10, 10, 15, 0.95)",
        borderBottom: `1px solid ${showReconnected ? "rgba(74,222,128,0.3)" : "rgba(245,166,35,0.3)"}`,
        backdropFilter: "blur(8px)",
        transform: visible ? "translateY(0)" : "translateY(-100%)",
        transition: "transform 0.3s cubic-bezier(0.4, 0, 0.2, 1), background 0.4s ease, border-color 0.4s ease",
        willChange: "transform",
      }}
    >
      {showReconnected ? (
        <>
          <Wifi size={14} style={{ color: "#4ADE80", flexShrink: 0 }} />
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              color: "#4ADE80",
              letterSpacing: "0.01em",
            }}
          >
            Connection restored — Operator House is back online.
          </span>
        </>
      ) : (
        <>
          <WifiOff size={14} style={{ color: "var(--amber)", flexShrink: 0 }} />
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "13px",
              fontWeight: 500,
              color: "var(--ivory)",
              letterSpacing: "0.01em",
            }}
          >
            You're offline.
          </span>
          <span
            style={{
              fontFamily: "DM Sans, sans-serif",
              fontSize: "12px",
              color: "var(--text-muted)",
            }}
          >
            Changes will sync when your connection returns.
          </span>
        </>
      )}
    </div>
  );
}
