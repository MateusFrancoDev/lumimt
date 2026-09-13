import { CatmullRomCurve3, Vector3 } from "three";

import { smoothstep } from "@/lib/journeyChapters";

/* ------------------------------------------------------------------
   The world.

   One continuous corridor running along -Z. The camera never cuts;
   it flies this corridor once, and every destination is a real body
   placed off to one side of the track. Distances are chosen so that a
   body fills roughly half the frame at closest approach: with a 45°
   vertical FOV that means a perpendicular distance of about five
   times its radius.
------------------------------------------------------------------ */

export const BLACK_HOLE = {
  position: new Vector3(0, 0, 0),
  radius: 4,
  diskInner: 6.5,
  diskOuter: 17,
};

export interface Destination {
  id: string;
  index: string;
  position: Vector3;
  radius: number;
  /** progress window during which this body is the one being observed */
  range: [number, number];
}

export const DESTINATIONS: Destination[] = [
  {
    id: "about",
    index: "01",
    position: new Vector3(38, 2, -160),
    radius: 8,
    range: [0.45, 0.57],
  },
  {
    id: "capabilities",
    index: "02",
    position: new Vector3(-34, 5, -300),
    radius: 7,
    range: [0.57, 0.7],
  },
  {
    id: "work",
    index: "03",
    position: new Vector3(44, -4, -450),
    radius: 10,
    range: [0.7, 0.88],
  },
  {
    id: "contact",
    index: "04",
    position: new Vector3(-40, -12, -740),
    radius: 16,
    range: [0.88, 1],
  },
];

export const [ABOUT, CAPABILITIES, WORK, CONTACT] = DESTINATIONS;

/** Moons of the capabilities planet — one per capability. */
export const MOON_ORBIT = { radius: 22, tilt: 0.42, moonRadius: 1.15 };

/** Rings of the work planet. The camera flies inside this annulus. */
export const WORK_RING = { inner: 18, outer: 40, tilt: 0.18 };
/** Radius at which project markers sit — just outside the camera track. */
export const WORK_MARKER_RADIUS = 36;
/** Radius the camera itself travels at while inside the rings. */
export const WORK_CAMERA_RADIUS = 30;

/** The distant light that backs the final planet. */
export const FINAL_LIGHT = new Vector3(-124, 22, -880);

/* ------------------------------------------------------------------
   The camera path.

   Two things are separated on purpose: where the camera IS (this
   curve) and where it LOOKS (derived below). That separation is what
   allows the camera to keep flying forward while turning to watch a
   body go past — the difference between a fly-by and a slideshow.
------------------------------------------------------------------ */

const WAYPOINTS: [number, number, number][] = [
  [6, 30, 200], // 00 — deep space, the hole is a speck, seen from above
  [6, 22, 128],
  [7, 13, 62], // 02 — approach, descending toward the disk plane
  [5, 4.5, 22],
  [2.2, 0.2, 7.5], // 04 — grazing the horizon
  [-1.2, -0.5, -9], // 05 — inside
  [-2.4, 0.2, -34], // 06 — the traverse
  [-1.4, 2, -72],
  [1, 5, -112], // 08 — a new system resolves
  [4, 5.5, -142],
  [2, 4, -178], // 10 — passing the first world
  [-2, 4, -214],
  [-4, 5, -252], // 12
  [0, 6, -292], // 13 — passing the moon system
  [4, 5, -336],
  [2, 3, -382], // 15
  [10, 0.5, -414], // 16 — turning toward the rings
  [20, -3, -436],
  [18, -4.4, -462], // 18 — inside the ring system
  [30, -4.2, -482], // 19
  [40, -3, -502], // 20 — leaving the rings
  [30, 2, -540],
  [14, 4, -580], // 22 — the long empty stretch
  [2, 0, -616],
  [-6, -2, -652], // 24 — the last approach
  [-10, -4, -682], // 25 — the end of the journey
];

export const cameraCurve = new CatmullRomCurve3(
  WAYPOINTS.map(([x, y, z]) => new Vector3(x, y, z)),
  false,
  "catmullrom",
  0.35,
);

/* ------------------------------------------------------------------
   Pacing.

   Scroll progress is NOT the curve parameter. Mapping them directly
   would make the camera move at a constant rate, which is exactly
   what makes scroll-driven 3D feel like a conveyor belt. This table
   spends a lot of scroll on very little travel near the bodies and
   very little scroll on a lot of travel between them.
------------------------------------------------------------------ */

const PACING: [progress: number, t: number][] = [
  [0, 0],
  [0.15, 0.085], // entry: slow drift, the hole barely grows
  [0.28, 0.165], // approach: accelerating toward the horizon
  [0.38, 0.235], // through it
  [0.45, 0.31], // out the other side
  [0.57, 0.45], // observing the first world
  [0.7, 0.58], // observing the moon system
  [0.78, 0.7], // committing to the rings
  [0.88, 0.8], // inside the rings
  [1, 1],
];

/** Maps scroll progress onto the curve, with the pacing above. */
export function progressToT(progress: number): number {
  const p = Math.min(1, Math.max(0, progress));
  for (let i = 0; i < PACING.length - 1; i += 1) {
    const [p0, t0] = PACING[i];
    const [p1, t1] = PACING[i + 1];
    if (p <= p1) {
      const local = (p - p0) / (p1 - p0);
      return t0 + (t1 - t0) * smoothstep(local);
    }
  }
  return 1;
}

/* ------------------------------------------------------------------
   Where the camera looks.

   Default: a point further along its own path, so it always faces
   the direction of travel. Near a destination that target is blended
   toward the body itself, which produces the detect → approach →
   observe → leave arc without any of it being keyframed by hand.
------------------------------------------------------------------ */

const FOCUS_WINDOWS: { point: Vector3; from: number; to: number; hold: number }[] = [
  { point: BLACK_HOLE.position, from: -0.12, to: 0.32, hold: 1 },
  { point: ABOUT.position, from: 0.42, to: 0.6, hold: 0.9 },
  { point: CAPABILITIES.position, from: 0.55, to: 0.72, hold: 0.9 },
  { point: WORK.position, from: 0.68, to: 0.9, hold: 0.95 },
  { point: CONTACT.position, from: 0.85, to: 1, hold: 1 },
];

const EDGE = 0.28;

/** Weight of a focus window at a given progress: rises, holds, falls. */
function windowWeight(progress: number, from: number, to: number) {
  if (progress <= from || progress >= to) return 0;
  const local = (progress - from) / (to - from);
  if (local < EDGE) return smoothstep(local / EDGE);
  if (local > 1 - EDGE) return smoothstep((1 - local) / EDGE);
  return 1;
}

const scratchAhead = new Vector3();
const scratchTarget = new Vector3();

export function cameraTarget(
  progress: number,
  t: number,
  position: Vector3,
  out: Vector3,
): Vector3 {
  cameraCurve.getPoint(Math.min(1, t + 0.045), scratchAhead);
  out.copy(scratchAhead);

  for (const focus of FOCUS_WINDOWS) {
    const weight = windowWeight(progress, focus.from, focus.to) * focus.hold;
    if (weight <= 0) continue;
    scratchTarget.copy(focus.point);
    out.lerp(scratchTarget, weight);
  }

  // Framing, not aiming: looking slightly below and to the left of the
  // hole lifts it into the upper right of the frame, off the headline.
  // Offsets scale with distance so the composition holds at any range.
  // Full strength from the very first frame, released as the hole
  // grows to fill the frame and the headline has gone.
  const opening = 1 - smoothstep(Math.min(1, Math.max(0, (progress - 0.14) / 0.16)));
  if (opening > 0.001) {
    const distance = position.distanceTo(out);
    out.y -= distance * 0.15 * opening;
    out.x -= distance * 0.07 * opening;
  }

  return out;
}
