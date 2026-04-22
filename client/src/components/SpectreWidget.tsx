import { useState, useEffect, useRef } from "react";
import { X } from "lucide-react";

const SPECTER_FULL = "/manus-storage/specter_full_body_daedd04f.png";
const SPECTER_SPEAKING = "/manus-storage/specter_speaking_b42bfdde.png";
const SPECTER_ICON = "/manus-storage/specter_icon_ce569ea5.png";

export type SpectreSize = "full" | "corner" | "icon";

interface SpectreWidgetProps {
  size?: SpectreSize;
  message?: string;
  /** If true, shows the speech bubble immediately */
  showMessage?: boolean;
  /** If true, shows the speech bubble on hover (overrides showMessage while hovered) */
  showOnHover?: boolean;
  /** If true, switches to the deeper idle-drift animation (user is inactive) */
  idle?: boolean;
  /** Called when the user dismisses the widget */
  onDismiss?: () => void;
  className?: string;
}

/**
 * The Specter — Operator House mascot.
 *
 * Sizes:
 *  - "full"   → tall full-body figure (onboarding slides)
 *  - "corner" → medium speaking pose (dashboard bottom-right widget)
 *  - "icon"   → small bust icon (sidebar / inline)
 */
export function SpectreWidget({
  size = "corner",
  message,
  showMessage = false,
  showOnHover = false,
  idle = false,
  onDismiss,
  className = "",
}: SpectreWidgetProps) {
  const [bubbleVisible, setBubbleVisible] = useState(showMessage);
  const [dismissed, setDismissed] = useState(false);
  const [hovered, setHovered] = useState(false);
  const timerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    setBubbleVisible(showMessage);
  }, [showMessage]);

  // Auto-hide bubble after 8s
  useEffect(() => {
    if (bubbleVisible && message) {
      timerRef.current = setTimeout(() => setBubbleVisible(false), 8000);
    }
    return () => {
      if (timerRef.current) clearTimeout(timerRef.current);
    };
  }, [bubbleVisible, message]);

  if (dismissed) return null;

  const src =
    size === "full"
      ? SPECTER_FULL
      : size === "corner"
        ? SPECTER_SPEAKING
        : SPECTER_ICON;

  const sizeClass =
    size === "full"
      ? "h-[340px] w-auto"
      : size === "corner"
        ? "h-[180px] w-auto"
        : "h-[40px] w-auto";

  return (
    <div
      className={`relative select-none ${className}`}
      style={{ display: "inline-flex", flexDirection: "column", alignItems: "center" }}
    >
      {/* Speech bubble */}
      {message && bubbleVisible && (
        <div
          className="specter-bubble"
          style={{
            position: "absolute",
            bottom: size === "full" ? "calc(100% - 60px)" : "calc(100% + 8px)",
            left: "50%",
            transform: "translateX(-50%)",
            background: "rgba(18,14,10,0.96)",
            border: "1px solid rgba(212,175,55,0.4)",
            borderRadius: "12px",
            padding: "10px 14px",
            maxWidth: "220px",
            minWidth: "160px",
            fontSize: "0.78rem",
            lineHeight: "1.5",
            color: "rgba(255,255,255,0.88)",
            boxShadow: "0 0 24px rgba(212,175,55,0.15)",
            zIndex: 50,
            animation: "specter-bubble-in 0.35s cubic-bezier(0.34,1.56,0.64,1) both",
            whiteSpace: "pre-wrap",
          }}
        >
          <button
            onClick={() => setBubbleVisible(false)}
            style={{
              position: "absolute",
              top: 4,
              right: 6,
              background: "none",
              border: "none",
              cursor: "pointer",
              color: "rgba(255,255,255,0.4)",
              padding: 0,
              lineHeight: 1,
            }}
            aria-label="Dismiss message"
          >
            <X size={10} />
          </button>
          {message}
          {/* Tail */}
          <span
            style={{
              position: "absolute",
              bottom: -7,
              left: "50%",
              transform: "translateX(-50%)",
              width: 0,
              height: 0,
              borderLeft: "7px solid transparent",
              borderRight: "7px solid transparent",
              borderTop: "7px solid rgba(212,175,55,0.4)",
            }}
          />
        </div>
      )}

      {/* Character image */}
      <div
        className="specter-figure"
        onMouseEnter={() => {
          setHovered(true);
          if (showOnHover && message) setBubbleVisible(true);
        }}
        onMouseLeave={() => {
          setHovered(false);
          if (showOnHover) setBubbleVisible(false);
        }}
        onClick={() => {
          if (message && !showOnHover) setBubbleVisible((v) => !v);
        }}
        style={{
          cursor: message ? "pointer" : "default",
          animation: idle
            ? "specter-drift 6s ease-in-out infinite"
            : "specter-idle 4s ease-in-out infinite",
          filter: hovered
            ? "drop-shadow(0 0 22px rgba(212,175,55,0.7)) brightness(1.12)"
            : idle
              ? "drop-shadow(0 0 16px rgba(212,175,55,0.45)) brightness(1.04)"
              : "drop-shadow(0 0 10px rgba(212,175,55,0.25))",
          transition: "filter 0.6s ease, animation-duration 1s ease",
        }}
      >
        <img
          src={src}
          alt="The Specter"
          className={sizeClass}
          style={{ objectFit: "contain" }}
          draggable={false}
        />
        {/* Eye glow overlay */}
        <div
          style={{
            position: "absolute",
            inset: 0,
            pointerEvents: "none",
            animation: idle ? "specter-eye-pulse 1.8s ease-in-out infinite" : "specter-eye-pulse 3s ease-in-out infinite",
            background:
              "radial-gradient(ellipse 20px 10px at 50% 18%, rgba(212,175,55,0.18) 0%, transparent 70%)",
          }}
        />
      </div>

      {/* Dismiss button for corner widget */}
      {onDismiss && size === "corner" && (
        <button
          onClick={() => {
            setDismissed(true);
            onDismiss();
          }}
          style={{
            position: "absolute",
            top: -8,
            right: -8,
            background: "rgba(18,14,10,0.9)",
            border: "1px solid rgba(212,175,55,0.3)",
            borderRadius: "50%",
            width: 20,
            height: 20,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            cursor: "pointer",
            color: "rgba(255,255,255,0.5)",
            zIndex: 10,
          }}
          aria-label="Dismiss Specter"
        >
          <X size={10} />
        </button>
      )}

      <style>{`
        @keyframes specter-idle {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50%       { transform: translateY(-6px) rotate(0.5deg); }
        }
        @keyframes specter-drift {
          0%   { transform: translateY(0px) rotate(0deg) translateX(0px); }
          20%  { transform: translateY(-10px) rotate(1.2deg) translateX(3px); }
          45%  { transform: translateY(-14px) rotate(-0.8deg) translateX(-2px); }
          70%  { transform: translateY(-8px) rotate(1deg) translateX(4px); }
          100% { transform: translateY(0px) rotate(0deg) translateX(0px); }
        }
        @keyframes specter-eye-pulse {
          0%, 100% { opacity: 0.4; }
          50%       { opacity: 1; }
        }
        @keyframes specter-bubble-in {
          from { opacity: 0; transform: translateX(-50%) scale(0.85); }
          to   { opacity: 1; transform: translateX(-50%) scale(1); }
        }
      `}</style>
    </div>
  );
}

/** Fixed bottom-right corner widget for the dashboard */
export function SpectreCornerWidget({
  message,
  autoShow = true,
  idleAfterMs = 60000,
}: {
  message?: string;
  autoShow?: boolean;
  /** Milliseconds of inactivity before switching to idle-drift mode. Default 60s. */
  idleAfterMs?: number;
}) {
  const [visible, setVisible] = useState(false);
  const [isIdle, setIsIdle] = useState(false);
  const [idleWhispered, setIdleWhispered] = useState(false);
  const [dismissed, setDismissed] = useState(() => {
    try {
      return localStorage.getItem("oh_specter_dismissed") === "1";
    } catch {
      return false;
    }
  });
  const idleTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const whisperTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Fade in after mount
  useEffect(() => {
    if (dismissed) return;
    const t = setTimeout(() => setVisible(true), 2200);
    return () => clearTimeout(t);
  }, [dismissed]);

  // Idle detection — listen for any user activity to reset the timer
  useEffect(() => {
    if (dismissed) return;
    const resetIdle = () => {
      setIsIdle(false);
      setIdleWhispered(false);
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (whisperTimerRef.current) clearTimeout(whisperTimerRef.current);
      idleTimerRef.current = setTimeout(() => {
        setIsIdle(true);
        // Auto-whisper 4s after entering idle drift
        whisperTimerRef.current = setTimeout(() => {
          setIdleWhispered(true);
          // Auto-dismiss whisper after 8s
          setTimeout(() => setIdleWhispered(false), 8000);
        }, 4000);
      }, idleAfterMs);
    };
    const events = ["mousemove", "keydown", "mousedown", "touchstart", "scroll"];
    events.forEach((e) => window.addEventListener(e, resetIdle, { passive: true }));
    resetIdle(); // start the timer immediately
    return () => {
      events.forEach((e) => window.removeEventListener(e, resetIdle));
      if (idleTimerRef.current) clearTimeout(idleTimerRef.current);
      if (whisperTimerRef.current) clearTimeout(whisperTimerRef.current);
    };
  }, [dismissed, idleAfterMs]);

  if (dismissed) return null;

  return (
    <div
      style={{
        position: "fixed",
        bottom: 24,
        right: 24,
        zIndex: 40,
        opacity: visible ? 1 : 0,
        transform: visible ? "translateY(0)" : "translateY(20px)",
        transition: "opacity 0.6s ease, transform 0.6s ease",
        pointerEvents: visible ? "auto" : "none",
      }}
    >
      <SpectreWidget
        size="corner"
        message={message}
        showMessage={idleWhispered}
        showOnHover={!!message && !idleWhispered}
        idle={isIdle}
        onDismiss={() => {
          setDismissed(true);
          try {
            localStorage.setItem("oh_specter_dismissed", "1");
          } catch {}
        }}
      />
    </div>
  );
}
