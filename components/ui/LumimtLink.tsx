import type { AnchorHTMLAttributes } from "react";

interface LumimtLinkProps extends AnchorHTMLAttributes<HTMLAnchorElement> {
  label: string;
  /** Shorter track, for secondary destinations. */
  compact?: boolean;
}

function Arrow() {
  return (
    <svg
      className="link__arrow"
      width="11"
      height="11"
      viewBox="0 0 11 11"
      fill="none"
      aria-hidden="true"
      focusable="false"
    >
      <path
        d="M1 10 10 1M10 1H3.6M10 1v6.4"
        stroke="currentColor"
        strokeWidth="1"
        vectorEffect="non-scaling-stroke"
      />
    </svg>
  );
}

/**
 * The CTA. Not a filled rectangle: a label, a track that light runs
 * across, and an arrow held at a distance that steps further away
 * when reached for. Hover and keyboard focus are treated identically.
 */
export function LumimtLink({ label, compact = false, className, ...rest }: LumimtLinkProps) {
  return (
    <a className={["link", compact ? "link--sm" : "", className].filter(Boolean).join(" ")} {...rest}>
      <span className="link__label mono">{label}</span>
      <span className="link__track" aria-hidden="true" />
      <Arrow />
    </a>
  );
}
