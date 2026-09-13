import { chapterAt, MOON_STOPS, PROJECT_STOPS, type ChapterId } from "@/lib/journeyChapters";

/**
 * A mutable module store, deliberately not React state.
 *
 * ScrollTrigger writes `target` on every scroll tick and the render
 * loop eases `value` toward it, so the camera can update sixty times a
 * second without React re-rendering anything. Only the things that
 * genuinely change discretely — which chapter, which moon, which
 * project — are published to React, and only when they actually
 * change.
 */
export const journey = {
  /** where the scroll says we are */
  target: 0,
  /** where the camera actually is, eased toward target */
  value: 0,
};

export interface JourneySnapshot {
  chapter: ChapterId;
  moon: number;
  project: number;
}

let snapshot: JourneySnapshot = { chapter: "entry", moon: 0, project: 0 };
const listeners = new Set<() => void>();

function indexFor(progress: number, stops: number[]) {
  let index = 0;
  for (let i = 0; i < stops.length; i += 1) {
    if (progress >= stops[i]) index = i;
  }
  return index;
}

/** Called from the scroll driver. Publishes only on a real change. */
export function publish(progress: number) {
  const next: JourneySnapshot = {
    chapter: chapterAt(progress),
    moon: indexFor(progress, MOON_STOPS),
    project: indexFor(progress, PROJECT_STOPS),
  };

  if (
    next.chapter === snapshot.chapter &&
    next.moon === snapshot.moon &&
    next.project === snapshot.project
  ) {
    return;
  }

  snapshot = next;
  for (const listener of listeners) listener();
}

export function subscribe(listener: () => void) {
  listeners.add(listener);
  return () => {
    listeners.delete(listener);
  };
}

export function getSnapshot(): JourneySnapshot {
  return snapshot;
}

const SERVER_SNAPSHOT: JourneySnapshot = { chapter: "entry", moon: 0, project: 0 };

export function getServerSnapshot(): JourneySnapshot {
  return SERVER_SNAPSHOT;
}

export function resetJourney() {
  journey.target = 0;
  journey.value = 0;
  snapshot = { chapter: "entry", moon: 0, project: 0 };
}
