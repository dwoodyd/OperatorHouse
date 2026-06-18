/**
 * OHSymbol — inline SVG replacement for the broken CloudFront oh-symbol-gold image.
 * Use this everywhere instead of the external image URL.
 */
export function OHSymbol({ size = 40, className }: { size?: number; className?: string }) {
  return (
    <svg
      width={size}
      height={size}
      viewBox="0 0 40 40"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className={className}
      style={{ display: "block", flexShrink: 0 }}
    >
      <rect width="40" height="40" rx="8" fill="#C9A84C" />
      <text
        x="20"
        y="27"
        fontFamily="serif"
        fontSize="18"
        fontWeight="bold"
        fill="#0a0a0a"
        textAnchor="middle"
      >
        OH
      </text>
    </svg>
  );
}

/**
 * Inline SVG string — use when you need the raw SVG (e.g. as a background or in a non-JSX context).
 */
export const OH_SYMBOL_SVG = `<svg width="40" height="40" viewBox="0 0 40 40" fill="none" xmlns="http://www.w3.org/2000/svg"><rect width="40" height="40" rx="8" fill="#C9A84C"/><text x="20" y="27" font-family="serif" font-size="18" font-weight="bold" fill="#0a0a0a" text-anchor="middle">OH</text></svg>`;
