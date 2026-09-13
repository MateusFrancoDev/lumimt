"use client";

import { useEffect, useMemo, useState } from "react";
import { Canvas } from "@react-three/fiber";

import { Scene } from "@/components/journey/scene/Scene";

/**
 * Quality is chosen from the viewport, not from a user-agent string.
 * A narrow window on a laptop deserves the cheap scene just as much as
 * a phone does, and it is the honest signal for how many pixels we are
 * actually being asked to fill.
 */
function tierFor(width: number) {
  if (width < 768) {
    return {
      stars: 520,
      ring: 2600,
      filaments: 240,
      dpr: [1, 1.25] as [number, number],
      fov: 55,
      antialias: false,
    };
  }
  if (width < 1280) {
    return {
      stars: 900,
      ring: 4800,
      filaments: 400,
      dpr: [1, 1.5] as [number, number],
      fov: 48,
      antialias: true,
    };
  }
  return {
    stars: 1400,
    ring: 7000,
    filaments: 560,
    dpr: [1, 1.75] as [number, number],
    fov: 45,
    antialias: true,
  };
}

interface JourneyCanvasProps {
  /** false while the journey is off screen: nothing is rendered at all */
  active: boolean;
}

export function JourneyCanvas({ active }: JourneyCanvasProps) {
  const [width, setWidth] = useState(() =>
    typeof window === "undefined" ? 1440 : window.innerWidth,
  );

  useEffect(() => {
    let frame = 0;
    const onResize = () => {
      if (frame) return;
      frame = requestAnimationFrame(() => {
        frame = 0;
        setWidth(window.innerWidth);
      });
    };
    window.addEventListener("resize", onResize, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("resize", onResize);
    };
  }, []);

  const tier = useMemo(() => tierFor(width), [width]);
  const quality = useMemo(
    () => ({ stars: tier.stars, ring: tier.ring, filaments: tier.filaments }),
    [tier],
  );

  return (
    <Canvas
      className="journey__canvas"
      // Rendering stops entirely once the journey scrolls out of view.
      frameloop={active ? "always" : "never"}
      dpr={tier.dpr}
      gl={{
        antialias: tier.antialias,
        powerPreference: "high-performance",
        alpha: false,
        stencil: false,
        depth: true,
      }}
      camera={{ fov: tier.fov, near: 0.1, far: 2600, position: [6, 9, 200] }}
    >
      <color attach="background" args={["#08090c"]} />
      <Scene quality={quality} />
    </Canvas>
  );
}
