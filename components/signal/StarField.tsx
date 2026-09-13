import type { CSSProperties } from "react";

import { starLayers } from "@/lib/stars";

/**
 * Three depths of quiet points, generated deterministically so the
 * server and the client agree. Rendered on the server: no runtime
 * cost beyond the elements themselves, no canvas, no WebGL.
 */
export function StarField() {
  return (
    <div aria-hidden="true">
      {starLayers.map((layer) => (
        <div key={layer.name} className={`field field--${layer.name}`}>
          {layer.points.map((point, index) => (
            <span
              key={`${layer.name}-${index}`}
              className="star-point"
              style={
                {
                  left: `${point.x}%`,
                  top: `${point.y}%`,
                  width: `${point.size.toFixed(2)}px`,
                  height: `${point.size.toFixed(2)}px`,
                  "--pt-op": point.opacity.toFixed(3),
                  "--pt-dur": `${point.duration.toFixed(1)}s`,
                  "--pt-delay": `${point.delay.toFixed(1)}s`,
                } as CSSProperties
              }
            />
          ))}
        </div>
      ))}
    </div>
  );
}
