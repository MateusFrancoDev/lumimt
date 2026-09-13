export const smoothstep = (t: number) => t * t * (3 - 2 * t);

/* ------------------------------------------------------------------
   Chapters.

   Pure data with no three.js import, and that is the whole point: the
   store and the HTML overlay need these, and importing them must not
   drag the entire 3D engine into the first load.
------------------------------------------------------------------ */
export type ChapterId =
  | "entry"
  | "approach"
  | "horizon"
  | "arrival"
  | "about"
  | "capabilities"
  | "work"
  | "contact";

export const CHAPTERS: { id: ChapterId; from: number; to: number }[] = [
  { id: "entry", from: 0, to: 0.15 },
  { id: "approach", from: 0.15, to: 0.28 },
  { id: "horizon", from: 0.28, to: 0.38 },
  { id: "arrival", from: 0.38, to: 0.45 },
  { id: "about", from: 0.45, to: 0.57 },
  { id: "capabilities", from: 0.57, to: 0.7 },
  { id: "work", from: 0.7, to: 0.88 },
  { id: "contact", from: 0.88, to: 1.0001 },
];

export function chapterAt(progress: number): ChapterId {
  for (const chapter of CHAPTERS) {
    if (progress >= chapter.from && progress < chapter.to) return chapter.id;
  }
  return "contact";
}

/** 0 → 1 within the given chapter. */
export function chapterProgress(progress: number, id: ChapterId): number {
  const chapter = CHAPTERS.find((entry) => entry.id === id);
  if (!chapter) return 0;
  return Math.min(1, Math.max(0, (progress - chapter.from) / (chapter.to - chapter.from)));
}

/** Which moon (0–4) is in the observation slot, and which project marker. */
export const MOON_STOPS = [0.6, 0.625, 0.65, 0.672, 0.692];
export const PROJECT_STOPS = [0.755, 0.795, 0.833, 0.868];
