import type { StarPoint } from "@/types/content";

/** Deterministic PRNG. The field must be identical on the server and
 *  on the client — a random starfield would hydrate mismatched. */
function mulberry32(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

interface FieldOptions {
  count: number;
  seed: number;
  size: [number, number];
  opacity: [number, number];
  /** Fraction of points pulled into clusters. A uniform scatter reads
   *  as generated; real skies are uneven. */
  clustering?: number;
}

export function generateField({
  count,
  seed,
  size,
  opacity,
  clustering = 0.62,
}: FieldOptions): StarPoint[] {
  const rand = mulberry32(seed);
  const centres = Array.from({ length: 4 }, () => ({
    x: 8 + rand() * 84,
    y: 6 + rand() * 88,
  }));

  return Array.from({ length: count }, () => {
    const clustered = rand() < clustering;
    let x: number;
    let y: number;

    if (clustered) {
      const c = centres[Math.floor(rand() * centres.length)];
      const spread = 10 + rand() * 16;
      x = c.x + (rand() - 0.5) * spread * 2;
      y = c.y + (rand() - 0.5) * spread * 1.5;
    } else {
      x = rand() * 100;
      y = rand() * 100;
    }

    return {
      x: Math.min(99.5, Math.max(0.5, x)),
      y: Math.min(99.5, Math.max(0.5, y)),
      size: size[0] + rand() * (size[1] - size[0]),
      opacity: opacity[0] + rand() * (opacity[1] - opacity[0]),
      // long, unsynced cycles — breathing, never blinking
      duration: 11 + rand() * 13,
      delay: -rand() * 18,
    };
  });
}

/** Three depths. Density stays low on purpose: the emptiness is the
 *  point, and one star has to be able to matter. */
export const starLayers = [
  {
    name: "far" as const,
    points: generateField({ count: 34, seed: 20374, size: [0.8, 1.4], opacity: [0.1, 0.2] }),
  },
  {
    name: "mid" as const,
    points: generateField({ count: 20, seed: 547913, size: [1.2, 2], opacity: [0.16, 0.3] }),
  },
  {
    name: "near" as const,
    points: generateField({ count: 11, seed: 88113, size: [1.9, 3], opacity: [0.24, 0.44] }),
  },
];
