import { useEffect, useRef, useState, useCallback } from "react";
import { createPortal } from "react-dom";
import { X, ChevronLeft, ChevronRight, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

export interface TourStep {
  /** CSS selector or element id of the element to spotlight */
  target: string;
  title: string;
  description: string;
  /** Where to place the tooltip relative to the target */
  placement?: "top" | "bottom" | "left" | "right" | "center";
}

interface GuidedTourProps {
  steps: TourStep[];
  isOpen: boolean;
  onClose: () => void;
  /** localStorage key used to remember "tour seen" state */
  storageKey?: string;
}

interface Rect {
  top: number;
  left: number;
  width: number;
  height: number;
}

const PADDING = 12; // spotlight padding around target
const TOOLTIP_W = 320;
const TOOLTIP_H_APPROX = 160;

function getRect(selector: string): Rect | null {
  const el = document.querySelector(selector);
  if (!el) return null;
  const r = el.getBoundingClientRect();
  return { top: r.top, left: r.left, width: r.width, height: r.height };
}

function computeTooltipPos(rect: Rect | null, placement: TourStep["placement"], vw: number, vh: number) {
  if (!rect || placement === "center") {
    return {
      top: vh / 2 - TOOLTIP_H_APPROX / 2,
      left: vw / 2 - TOOLTIP_W / 2,
    };
  }
  const sp = { // spotlight rect with padding
    top: rect.top - PADDING,
    left: rect.left - PADDING,
    right: rect.left + rect.width + PADDING,
    bottom: rect.top + rect.height + PADDING,
  };
  const gap = 16;
  switch (placement) {
    case "bottom":
      return {
        top: Math.min(sp.bottom + gap, vh - TOOLTIP_H_APPROX - 8),
        left: Math.max(8, Math.min(sp.left, vw - TOOLTIP_W - 8)),
      };
    case "top":
      return {
        top: Math.max(8, sp.top - TOOLTIP_H_APPROX - gap),
        left: Math.max(8, Math.min(sp.left, vw - TOOLTIP_W - 8)),
      };
    case "left":
      return {
        top: Math.max(8, sp.top),
        left: Math.max(8, sp.left - TOOLTIP_W - gap),
      };
    case "right":
    default:
      return {
        top: Math.max(8, sp.top),
        left: Math.min(sp.right + gap, vw - TOOLTIP_W - 8),
      };
  }
}

export function GuidedTour({ steps, isOpen, onClose, storageKey }: GuidedTourProps) {
  const [stepIdx, setStepIdx] = useState(0);
  const [rect, setRect] = useState<Rect | null>(null);
  const [vp, setVp] = useState({ w: window.innerWidth, h: window.innerHeight });
  const rafRef = useRef<number | null>(null);

  const step = steps[stepIdx];

  // Measure target element and scroll it into view
  const measure = useCallback(() => {
    if (!step) return;
    const el = document.querySelector(step.target);
    if (el) {
      el.scrollIntoView({ behavior: "smooth", block: "center", inline: "nearest" });
      // Give scroll time to settle before measuring
      setTimeout(() => {
        setRect(getRect(step.target));
        setVp({ w: window.innerWidth, h: window.innerHeight });
      }, 350);
    } else {
      setRect(null);
    }
  }, [step]);

  useEffect(() => {
    if (!isOpen) return;
    setStepIdx(0);
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    measure();
  }, [stepIdx, isOpen, measure]);

  // Re-measure on resize
  useEffect(() => {
    if (!isOpen) return;
    const onResize = () => measure();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, [isOpen, measure]);

  // Animate spotlight with rAF for smooth feel
  const [animRect, setAnimRect] = useState<Rect | null>(null);
  useEffect(() => {
    if (!rect) { setAnimRect(null); return; }
    let start: number | null = null;
    const from = animRect ?? rect;
    const to = rect;
    const duration = 300;
    const animate = (ts: number) => {
      if (!start) start = ts;
      const t = Math.min((ts - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setAnimRect({
        top: from.top + (to.top - from.top) * ease,
        left: from.left + (to.left - from.left) * ease,
        width: from.width + (to.width - from.width) * ease,
        height: from.height + (to.height - from.height) * ease,
      });
      if (t < 1) rafRef.current = requestAnimationFrame(animate);
    };
    rafRef.current = requestAnimationFrame(animate);
    return () => { if (rafRef.current) cancelAnimationFrame(rafRef.current); };
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [rect]);

  const next = () => {
    if (stepIdx < steps.length - 1) setStepIdx(i => i + 1);
    else finish();
  };
  const prev = () => setStepIdx(i => Math.max(0, i - 1));
  const finish = () => {
    if (storageKey) localStorage.setItem(storageKey, "1");
    onClose();
  };

  if (!isOpen || !step) return null;

  const sp = animRect
    ? {
        top: animRect.top - PADDING,
        left: animRect.left - PADDING,
        width: animRect.width + PADDING * 2,
        height: animRect.height + PADDING * 2,
      }
    : null;

  const tooltipPos = computeTooltipPos(animRect, step.placement ?? "bottom", vp.w, vp.h);

  const isLast = stepIdx === steps.length - 1;
  const isFirst = stepIdx === 0;

  return createPortal(
    <div
      className="fixed inset-0 z-[9999] pointer-events-none"
      aria-modal="true"
      role="dialog"
      aria-label={`Guided tour step ${stepIdx + 1} of ${steps.length}: ${step.title}`}
    >
      {/* Dark overlay with cutout */}
      <svg
        className="absolute inset-0 w-full h-full pointer-events-auto"
        style={{ cursor: "default" }}
        onClick={finish}
      >
        <defs>
          <mask id="tour-mask">
            <rect width="100%" height="100%" fill="white" />
            {sp && (
              <rect
                x={sp.left}
                y={sp.top}
                width={sp.width}
                height={sp.height}
                rx={8}
                ry={8}
                fill="black"
              />
            )}
          </mask>
        </defs>
        <rect
          width="100%"
          height="100%"
          fill="rgba(0,0,0,0.72)"
          mask="url(#tour-mask)"
        />
        {/* Spotlight border glow */}
        {sp && (
          <rect
            x={sp.left}
            y={sp.top}
            width={sp.width}
            height={sp.height}
            rx={8}
            ry={8}
            fill="none"
            stroke="rgba(216,168,90,0.7)"
            strokeWidth={2}
          />
        )}
      </svg>

      {/* Tooltip card */}
      <div
        className="absolute pointer-events-auto"
        style={{
          top: tooltipPos.top,
          left: tooltipPos.left,
          width: TOOLTIP_W,
          zIndex: 10000,
        }}
        onClick={e => e.stopPropagation()}
      >
        <div
          className="rounded-xl border shadow-2xl"
          style={{
            background: "rgba(14,12,9,0.97)",
            border: "1px solid rgba(216,168,90,0.35)",
            backdropFilter: "blur(24px)",
            boxShadow: "0 24px 64px rgba(0,0,0,0.7), 0 0 0 1px rgba(216,168,90,0.08)",
          }}
        >
          {/* Header */}
          <div className="flex items-start justify-between p-4 pb-0">
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold shrink-0"
                style={{ background: "rgba(216,168,90,0.15)", color: "#d8a85a", border: "1px solid rgba(216,168,90,0.3)" }}
              >
                {stepIdx + 1}
              </div>
              <span
                className="text-sm font-semibold leading-tight"
                style={{ color: "#f0ead8", fontFamily: "'DM Sans', sans-serif" }}
              >
                {step.title}
              </span>
            </div>
            <button
              onClick={finish}
              className="text-xs rounded-md p-1 transition-colors hover:bg-white/10"
              style={{ color: "rgba(240,234,216,0.4)" }}
              aria-label="Close tour"
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div className="px-4 pt-3 pb-4">
            <p
              className="text-sm leading-relaxed"
              style={{ color: "rgba(240,234,216,0.7)", fontFamily: "'DM Sans', sans-serif" }}
            >
              {step.description}
            </p>
          </div>

          {/* Progress dots */}
          <div className="flex items-center justify-center gap-1.5 pb-3">
            {steps.map((_, i) => (
              <div
                key={i}
                className="rounded-full transition-all duration-300"
                style={{
                  width: i === stepIdx ? 18 : 6,
                  height: 6,
                  background: i === stepIdx ? "#d8a85a" : "rgba(216,168,90,0.25)",
                }}
              />
            ))}
          </div>

          {/* Footer buttons */}
          <div
            className="flex items-center justify-between px-4 py-3 rounded-b-xl"
            style={{ borderTop: "1px solid rgba(216,168,90,0.12)" }}
          >
            <button
              onClick={finish}
              className="text-xs transition-colors"
              style={{ color: "rgba(240,234,216,0.35)", fontFamily: "monospace" }}
            >
              skip tour
            </button>
            <div className="flex items-center gap-2">
              {!isFirst && (
                <Button
                  size="sm"
                  variant="outline"
                  onClick={prev}
                  className="h-8 px-3 text-xs gap-1"
                  style={{ borderColor: "rgba(216,168,90,0.3)", color: "#d8a85a", background: "transparent" }}
                >
                  <ChevronLeft size={13} /> Back
                </Button>
              )}
              <Button
                size="sm"
                onClick={next}
                className="h-8 px-4 text-xs gap-1 font-semibold"
                style={{ background: "#d8a85a", color: "#0e0c09", border: "none" }}
              >
                {isLast ? "Done" : "Next"} {!isLast && <ChevronRight size={13} />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>,
    document.body
  );
}

/** Small "Take a Tour" trigger button */
export function TourTriggerButton({ onClick }: { onClick: () => void }) {
  return (
    <button
      onClick={onClick}
      className="flex items-center gap-1.5 text-xs px-3 py-1.5 rounded-full transition-all duration-200 hover:scale-105"
      style={{
        background: "rgba(216,168,90,0.12)",
        border: "1px solid rgba(216,168,90,0.3)",
        color: "#d8a85a",
        fontFamily: "'DM Sans', sans-serif",
        fontWeight: 600,
        letterSpacing: "0.03em",
      }}
      aria-label="Start guided tour"
    >
      <Compass size={13} />
      Take a Tour
    </button>
  );
}
