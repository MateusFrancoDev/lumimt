import type { CurveShape } from "@/types/content";

const VIEW_W = 100;
const BASELINE = 12;
const MAX_DEPTH = 22;

function smoothstep(t: number) {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
}

function seeded(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Builds a transit light curve: a flat baseline carrying scatter, cut
 * by a flat-bottomed dip with real ingress and egress. This is the
 * project rendered the way it was found — as a drop in the light.
 */
export function buildLightCurve({ center, depth, noise }: CurveShape) {
  const rand = seeded(Math.round((center * 977 + depth * 613 + noise * 389) * 100));
  const samples = 84;
  const halfWidth = 0.115;
  const flat = 0.055;
  const bottom = BASELINE + depth * MAX_DEPTH;

  let d = "";
  for (let i = 0; i <= samples; i += 1) {
    const t = i / samples;
    const x = t * VIEW_W;

    const distance = Math.abs(t - center);
    let drop = 0;
    if (distance < halfWidth) {
      const edge = (halfWidth - distance) / (halfWidth - flat);
      drop = smoothstep(edge);
    }

    const scatter = (rand() - 0.5) * noise * 2.4;
    const y = BASELINE + drop * depth * MAX_DEPTH + scatter;

    d += `${i === 0 ? "M" : "L"}${x.toFixed(2)},${y.toFixed(2)} `;
  }

  return {
    path: d.trim(),
    baseline: BASELINE,
    dip: { x: center * VIEW_W, y: bottom },
    viewBox: `0 0 ${VIEW_W} 44`,
  };
}
