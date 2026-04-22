/* =============================================================================
   StateUI — Global loading, skeleton, and empty-state primitives
   All animations use transform/opacity only (GPU-composited, no layout thrash).
   ============================================================================= */
import type { LucideIcon } from "lucide-react";
import { Loader2 } from "lucide-react";
import { SpectreWidget } from "@/components/SpectreWidget";

/* ── Shimmer skeleton row ───────────────────────────────────────────────── */
interface SkeletonRowsProps {
  rows?: number;
  /** height of each bar in px, defaults to 13 */
  h?: number;
  /** second bar width fraction, defaults to 0.55 */
  w2?: number;
}
export function SkeletonRows({ rows = 4, h = 13, w2 = 0.55 }: SkeletonRowsProps) {
  return (
    <div className="flex flex-col gap-3">
      {Array.from({ length: rows }).map((_, i) => (
        <div key={i} className="glass-panel p-4 flex flex-col gap-2">
          <div className="skeleton" style={{ height: h, width: "65%", borderRadius: 4 }} />
          <div className="skeleton" style={{ height: h - 2, width: `${w2 * 100}%`, borderRadius: 4, opacity: 0.6 }} />
        </div>
      ))}
    </div>
  );
}

/* ── Card grid skeleton ─────────────────────────────────────────────────── */
export function SkeletonCards({ count = 6 }: { count?: number }) {
  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
      {Array.from({ length: count }).map((_, i) => (
        <div key={i} className="glass-panel p-5 flex flex-col gap-3">
          <div className="skeleton" style={{ height: 12, width: "40%", borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 15, width: "75%", borderRadius: 4 }} />
          <div className="skeleton" style={{ height: 11, width: "55%", borderRadius: 4, opacity: 0.5 }} />
        </div>
      ))}
    </div>
  );
}

/* ── Kanban column skeleton ─────────────────────────────────────────────── */
export function SkeletonKanban({ cols = 5 }: { cols?: number }) {
  return (
    <div className="flex gap-4 overflow-x-auto pb-4">
      {Array.from({ length: cols }).map((_, i) => (
        <div key={i} className="flex-shrink-0 w-56 flex flex-col gap-3">
          <div className="skeleton" style={{ height: 14, width: "60%", borderRadius: 4 }} />
          {Array.from({ length: 2 }).map((_, j) => (
            <div key={j} className="glass-panel p-3 flex flex-col gap-2">
              <div className="skeleton" style={{ height: 12, width: "80%", borderRadius: 3 }} />
              <div className="skeleton" style={{ height: 10, width: "50%", borderRadius: 3, opacity: 0.5 }} />
            </div>
          ))}
        </div>
      ))}
    </div>
  );
}

/* ── Full-page loader (replaces raw Loader2 spinners) ───────────────────── */
export function PageLoader({ label }: { label?: string }) {
  return (
    <div
      className="flex flex-col items-center justify-center py-24 gap-4"
      style={{ willChange: "opacity" }}
    >
      <div
        style={{
          width: 36,
          height: 36,
          border: "2px solid rgba(245,166,35,0.15)",
          borderTop: "2px solid var(--amber)",
          borderRadius: "50%",
          animation: "oh-spin 700ms linear infinite",
          willChange: "transform",
        }}
      />
      {label && (
        <span
          style={{
            fontFamily: "Fira Code, monospace",
            fontSize: 11,
            letterSpacing: "0.2em",
            textTransform: "uppercase",
            color: "var(--text-muted)",
            animation: "oh-fade-pulse 1.8s ease-in-out infinite",
            willChange: "opacity",
          }}
        >
          {label}
        </span>
      )}
    </div>
  );
}

/* ── Inline loader (for buttons / inline states) ────────────────────────── */
export function InlineLoader({ size = 14 }: { size?: number }) {
  return (
    <Loader2
      size={size}
      style={{ color: "var(--amber)", willChange: "transform", animation: "oh-spin 700ms linear infinite" }}
    />
  );
}

/* ── Empty state ────────────────────────────────────────────────────────── */
interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  body?: string;
  action?: React.ReactNode;
}
export function EmptyState({ icon: Icon, title, body, action }: EmptyStateProps) {
  return (
    <div
      className="flex flex-col items-center justify-center py-20 gap-4 text-center"
      style={{
        animation: "oh-fade-up 300ms ease both",
        willChange: "transform, opacity",
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          borderRadius: "50%",
          background: "rgba(245,166,35,0.06)",
          border: "1px solid rgba(245,166,35,0.12)",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
        }}
      >
        <Icon size={22} style={{ color: "var(--amber)", opacity: 0.55 }} />
      </div>
      <div>
        <p style={{ color: "var(--text-primary)", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{title}</p>
        {body && <p style={{ color: "var(--text-muted)", fontSize: 13, lineHeight: 1.6, maxWidth: 340 }}>{body}</p>}
      </div>
      {action && <div>{action}</div>}
    </div>
  );
}

/* ── Specter Empty State — branded mascot variant ───────────────────────── */
interface SpectreEmptyStateProps {
  /** Short headline, e.g. "No leads yet." */
  title: string;
  /** Specter's spoken one-liner — shows in speech bubble */
  spectreQuote: string;
  /** Optional body copy below the title */
  body?: string;
  /** Optional CTA button / link */
  action?: React.ReactNode;
  /** Extra vertical padding override (defaults to py-16) */
  compact?: boolean;
}

/**
 * SpectreEmptyState — replaces generic empty states with The Specter mascot.
 * The mascot floats with an idle animation and shows a contextual speech bubble.
 */
export function SpectreEmptyState({
  title,
  spectreQuote,
  body,
  action,
  compact = false,
}: SpectreEmptyStateProps) {
  return (
    <div
      className={`flex flex-col items-center justify-center gap-5 text-center ${
        compact ? "py-10" : "py-16"
      }`}
      style={{
        animation: "oh-fade-up 400ms ease both",
        willChange: "transform, opacity",
      }}
    >
      {/* Specter figure with speech bubble */}
      <div style={{ position: "relative", display: "inline-flex", justifyContent: "center" }}>
        <SpectreWidget
          size="corner"
          message={spectreQuote}
          showMessage={true}
        />
      </div>

      {/* Text block */}
      <div style={{ maxWidth: 360 }}>
        <p
          style={{
            fontFamily: "Playfair Display, serif",
            fontSize: 16,
            fontWeight: 600,
            color: "var(--text-primary)",
            marginBottom: 6,
          }}
        >
          {title}
        </p>
        {body && (
          <p
            style={{
              color: "var(--text-muted)",
              fontSize: 13,
              lineHeight: 1.65,
            }}
          >
            {body}
          </p>
        )}
      </div>

      {action && <div>{action}</div>}
    </div>
  );
}
