import type { LensRing } from "@/types/content";

function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * A black hole is the least visible object there is — nobody has ever
 * seen one. What is observable is what it does to the light behind it:
 * dragged, stretched into arcs, swallowed at the centre.
 *
 * So the approach is built out of concentric rings of light rather than
 * a glowing disc. Inner rings spiral in and are consumed; outer rings
 * sweep outward past the viewer, which is what moving forward looks
 * like. Every ring is one element with a CSS transform driven by --lp,
 * so the whole effect costs six transforms per frame, not seventy.
 */
const RING_SPECS = [
  { radius: 11, count: 14, spin: 300, scaleDelta: -0.52, stretch: 22, fade: -0.2, boost: 2.2 },
  { radius: 17, count: 16, spin: 242, scaleDelta: -0.3, stretch: 18, fade: -0.1, boost: 1.8 },
  { radius: 25, count: 18, spin: 188, scaleDelta: 0.18, stretch: 14, fade: 0.15, boost: 1.1 },
  { radius: 35, count: 20, spin: 146, scaleDelta: 0.9, stretch: 10, fade: 0.35, boost: 0.5 },
  { radius: 47, count: 22, spin: 112, scaleDelta: 1.9, stretch: 7.5, fade: 0.5, boost: 0.2 },
  { radius: 61, count: 24, spin: 84, scaleDelta: 3.3, stretch: 5, fade: 0.6, boost: 0 },
];

export const lensRings: LensRing[] = RING_SPECS.map((spec, index) => {
  const rand = mulberry32(9001 + index * 617);
  const step = 360 / spec.count;

  return {
    ...spec,
    points: Array.from({ length: spec.count }, (_, i) => ({
      // even spacing with jitter: a perfectly regular ring reads as a
      // loading spinner, an uneven one reads as sky
      angle: i * step + (rand() - 0.5) * step * 0.7,
      distance: spec.radius * (0.88 + rand() * 0.24),
      size: 1.3 + rand() * 1.2,
      opacity: 0.26 + rand() * 0.3,
    })),
  };
});
