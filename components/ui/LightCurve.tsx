import { buildLightCurve } from "@/lib/curve";
import type { CurveShape } from "@/types/content";

interface LightCurveProps {
  shape: CurveShape;
  label: string;
  left: string;
  right: string;
}

/**
 * A project drawn as the signal that revealed it: a baseline of light
 * with a measurable dip in it.
 *
 * This is the slot where a real project image belongs once cases are
 * photographed — swap this component for next/image and keep the
 * reveal behaviour in WorkSection untouched.
 */
export function LightCurve({ shape, label, left, right }: LightCurveProps) {
  const curve = buildLightCurve(shape);

  return (
    <figure>
      <div className="curve">
        <svg
          viewBox={curve.viewBox}
          role="img"
          aria-label={`Light curve for ${label}: a baseline of light interrupted by a dip.`}
        >
          <line
            className="curve__axis"
            x1="0"
            y1={curve.baseline}
            x2="100"
            y2={curve.baseline}
            strokeDasharray="1 4"
          />
          <line
            className="curve__axis"
            x1={curve.dip.x}
            y1={curve.baseline}
            x2={curve.dip.x}
            y2={curve.dip.y + 4}
          />
          <path className="curve__path" d={curve.path} />
          <circle className="curve__dip" cx={curve.dip.x} cy={curve.dip.y} r="1.1" />
        </svg>
      </div>
      <figcaption className="curve__caption mono-sm">
        <span>{left}</span>
        <span>{right}</span>
      </figcaption>
    </figure>
  );
}
