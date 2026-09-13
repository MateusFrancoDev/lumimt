"use client";

import { useEffect, useRef, type ReactNode } from "react";

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * The journey, expressed as positions along the scroll.
 *
 *   0.00  darkness, identity only
 *   0.10  the approach: light behind an unseen mass starts to bend
 *   0.44  the horizon: everything is taken
 *   0.54  emergence on the far side
 *   0.66  a body crosses the light
 *   0.82  the signal is named
 */
const APPROACH = 0.1;
const HORIZON = 0.44;
const EMERGENCE = 0.54;
const TRANSIT_IN = 0.66;
const TRANSIT_OUT = 0.8;
const RESOLVED = 0.82;

/** Radius of the transiting body, as a fraction of the star's radius. */
const BODY_RATIO = 0.075;
/** How far the light drops. Small on purpose — it has to be felt, not watched. */
const DIP = 0.075;

interface HeroStageProps {
  children: ReactNode;
}

/**
 * Drives the entire hero from one rAF-throttled scroll read, writing a
 * handful of custom properties. Every visual consequence lives in CSS
 * (styles/hero.css), so this never touches layout and never paints.
 */
export function HeroStage({ children }: HeroStageProps) {
  const sectionRef = useRef<HTMLElement>(null);
  const stageRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const section = sectionRef.current;
    const stage = stageRef.current;
    if (!section || !stage) return;

    const root = document.documentElement;
    const motionQuery = window.matchMedia("(prefers-reduced-motion: reduce)");

    let base = 0;
    let reach = 0;
    let frame = 0;
    let phase = -1;

    const measure = () => {
      const smallest = Math.min(window.innerWidth, window.innerHeight);
      base = Math.min(smallest * 0.42, 360);
      // the horizon never grows past a fraction of the frame
      reach = smallest * 0.42;
    };

    const setPhase = (next: number) => {
      if (next === phase) return;
      phase = next;
      stage.dataset.phase = String(next);
    };

    const set = (name: string, value: string) => stage.style.setProperty(name, value);

    const apply = (p: number) => {
      /* ---- the approach ---- */
      const lp = clamp(p / HORIZON, 0, 1);
      // The horizon stays small: it is meant to read as an absence inside
      // light, never as a body filling the frame.
      const core = Math.pow(lp, 3) * reach;
      // the arc peaks just before the horizon, then goes with everything else
      const arc = clamp((lp - 0.25) / 0.3, 0, 1) * clamp((1 - lp) / 0.12, 0, 1);
      // the frame closes over the last stretch of the approach
      const vignette = 115 - 107 * Math.pow(clamp((lp - 0.6) / 0.4, 0, 1), 1.6);

      set("--lp", lp.toFixed(4));
      set("--lens-core", `${core.toFixed(1)}px`);
      set("--lens-arc", arc.toFixed(3));
      set("--vignette", vignette.toFixed(2));
      set("--blackout", clamp((lp - 0.93) / 0.07, 0, 1).toFixed(3));
      set("--lens-op", (1 - clamp((p - HORIZON) / 0.14, 0, 1)).toFixed(3));

      /* ---- the far side ---- */
      const emerge = clamp((p - EMERGENCE + 0.04) / 0.3, 0, 1);
      const growth = clamp((p - EMERGENCE + 0.04) / 0.28, 0, 1);
      const overshoot = 1 + clamp((p - 0.78) / 0.22, 0, 1) * 0.16;
      const diameter = (3.4 + (base - 3.4) * Math.pow(growth, 1.9)) * overshoot;
      const radius = diameter / 2;

      set("--sky", clamp((p - EMERGENCE) / 0.16, 0, 1).toFixed(3));
      set("--emerge", emerge.toFixed(3));
      set("--p", p.toFixed(4));
      set("--star-d", `${diameter.toFixed(2)}px`);
      set("--halo", (0.12 + emerge * 0.88).toFixed(3));

      /* ---- the transit ---- */
      const progress = clamp((p - TRANSIT_IN) / (TRANSIT_OUT - TRANSIT_IN), 0, 1);
      const offset = (progress * 2 - 1) * 1.35;
      const distance = Math.abs(offset);

      // only visible while silhouetted against the light
      set("--transit-x", `${(offset * radius).toFixed(2)}px`);
      set("--transit-op", clamp((1.25 - distance) / 0.35, 0, 1).toFixed(3));

      // flat-bottomed light curve: full occlusion while fully inside
      let coverage = 0;
      if (distance <= 1 - BODY_RATIO) coverage = 1;
      else if (distance < 1 + BODY_RATIO)
        coverage = (1 + BODY_RATIO - distance) / (2 * BODY_RATIO);

      // Luminance is global: the dip is felt by the logo and by every lit
      // surface further down the page, not only inside the hero.
      root.style.setProperty("--lum", (1 - DIP * coverage).toFixed(4));
      root.style.setProperty("--ambient", clamp((p - 0.86) / 0.14, 0, 1).toFixed(3));

      if (p < APPROACH) setPhase(0);
      else if (p < HORIZON) setPhase(1);
      else if (p < EMERGENCE) setPhase(2);
      else if (p < RESOLVED) setPhase(3);
      else setPhase(4);
    };

    /** Reduced motion: no journey. The page opens on the far side. */
    const applyStatic = () => {
      set("--lp", "0");
      set("--lens-core", "0px");
      set("--lens-arc", "0");
      set("--vignette", "115");
      set("--blackout", "0");
      set("--lens-op", "0");
      set("--sky", "1");
      set("--emerge", "1");
      set("--p", "1");
      set("--star-d", `${base.toFixed(2)}px`);
      set("--halo", "0.9");
      set("--transit-x", `${(-base * 0.2).toFixed(2)}px`);
      set("--transit-op", "1");
      root.style.setProperty("--lum", String(1 - DIP));
      root.style.setProperty("--ambient", "1");
      setPhase(4);
    };

    const read = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const range = rect.height - window.innerHeight;
      apply(range > 0 ? clamp(-rect.top / range, 0, 1) : 1);
    };

    const schedule = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };

    const start = () => {
      measure();
      if (motionQuery.matches) {
        applyStatic();
        window.removeEventListener("scroll", schedule);
      } else {
        read();
        window.addEventListener("scroll", schedule, { passive: true });
      }
    };

    const onResize = () => {
      measure();
      if (motionQuery.matches) applyStatic();
      else schedule();
    };

    start();
    window.addEventListener("resize", onResize, { passive: true });
    motionQuery.addEventListener("change", start);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", schedule);
      window.removeEventListener("resize", onResize);
      motionQuery.removeEventListener("change", start);
      root.style.removeProperty("--lum");
      root.style.removeProperty("--ambient");
    };
  }, []);

  return (
    <section id="top" ref={sectionRef} className="hero" aria-label="Lumimt — signal detected">
      <div ref={stageRef} className="hero__stage" data-phase="0">
        {children}
      </div>
    </section>
  );
}
