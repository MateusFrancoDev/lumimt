import type { CSSProperties } from "react";

import { lensRings } from "@/lib/lens";

/**
 * The approach. Rendered on the server as static DOM; the only thing
 * that changes at runtime is --lp, which every transform here reads.
 */
export function LensField() {
  return (
    <div className="lens" aria-hidden="true">
      <div className="lens__rings">
        {lensRings.map((ring, index) => (
          <div
            key={ring.radius}
            className="ring"
            style={
              {
                "--spin": ring.spin,
                "--scd": ring.scaleDelta,
                "--fade": ring.fade,
                "--bo": ring.boost,
              } as CSSProperties
            }
          >
            {ring.points.map((point, i) => (
              <span
                key={`${index}-${i}`}
                className="ring-star"
                style={
                  {
                    "--a": `${point.angle.toFixed(2)}deg`,
                    "--d": `${point.distance.toFixed(2)}vmin`,
                    "--s": `${point.size.toFixed(2)}px`,
                    "--o": point.opacity.toFixed(3),
                    "--st": ring.stretch,
                  } as CSSProperties
                }
              />
            ))}
          </div>
        ))}
      </div>

      {/* What is actually there: nothing. Legible only because the
          light around it is not. */}
      <div className="lens__core" />

      {/* The Einstein arc — deliberately incomplete, so it reads as
          light being bent rather than as a glowing ring. */}
      <div className="lens__arc" />

      {/* Crossing the horizon: the frame closes rather than the shape
          growing, so nothing ever reads as a giant sphere. */}
      <div className="lens__void" />
      <div className="lens__blackout" />
    </div>
  );
}
