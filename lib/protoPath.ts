import { Euler, Matrix4, Vector3 } from "three";

/* ------------------------------------------------------------------
   The journey, as discrete stops.

   There is no continuous flight path any more. Each stop is an
   explicit camera position and target, and the scroll moves between
   them one at a time. That is what makes the camera genuinely still
   while a section is read: consecutive stops that share a position do
   not drift, orbit, or wander — they are the same numbers.
------------------------------------------------------------------ */

export const BODIES = {
  blackHole: new Vector3(0, 0, 0),
  about: new Vector3(6, 1, -30),
  services: new Vector3(-7, -2, -65),
  projects: new Vector3(5, 2, -105),
  contact: new Vector3(-3, 0, -145),
};

export const PROJECT_RING = { inner: 5.5, outer: 13, tilt: 0.35, roll: 0.12 };
export const MARKER_RADIUS = (PROJECT_RING.inner + PROJECT_RING.outer) / 2;
export const HORIZON_RADIUS = 2.6;

export const CAPABILITY_COUNT = 5;
export const PROJECT_COUNT = 3;

export type Phase = "signal" | "about" | "capabilities" | "projects" | "contact";

export interface Stop {
  phase: Phase;
  capability: number;
  project: number;
  pos: Vector3;
  /** The body itself, dead centre. Framing is applied on top of it. */
  look: Vector3;
  /**
   * How far to slide the aim sideways on a wide screen, so the body
   * sits on the right and the copy has the left half to itself. On a
   * phone the copy is below the body, so this is scaled to zero and
   * the body ends up centred — which is the only framing that works
   * on every handset width.
   */
  side: number;
  /**
   * Whether the camera may be pulled back to fit a narrow viewport.
   * False for the crossing, where the position is the whole point:
   * the camera has to end up inside the horizon, not near it.
   */
  fit: boolean;
  /**
   * Radius of the thing this stop is looking at, in world units —
   * the planet plus whatever glow has to stay inside the frame. The
   * camera pulls back until a circle this big fits the band of screen
   * the layout has left free, which is what keeps a body whole on a
   * 320px phone and cinematic on a monitor without a single
   * breakpoint being involved.
   */
  radius: number;
}

/* ------------------------------------------------------------------
   Ring markers — one source of truth for where a project sits, used
   both to draw it and to aim the camera at it.
------------------------------------------------------------------ */

const ringBasis = new Matrix4().makeRotationFromEuler(
  new Euler(PROJECT_RING.tilt, 0, PROJECT_RING.roll),
);

/* ------------------------------------------------------------------
   The projects arc.

   One set of numbers decides both where a project's point of light
   sits on the ring and where the camera stands to read it, because
   the two only make sense together.

   `centre` faces the direction the gas giant is lit from, so every
   project is read off the sunlit side. Spreading the three cameras
   evenly around the whole ring instead — which is what tying each
   camera to its own marker used to do — puts them 120° apart, and no
   single light can face all three: one project came out a black
   silhouette. A narrow sweep keeps every one of them lit and still
   gives each its own parallax on the ring.

   The markers lead the camera by `lead` and are spaced by `step`, so
   each one sits out on the near side of the ring where it can be seen
   and, on a pointer, clicked.
------------------------------------------------------------------ */
const PROJECT_ARC = {
  /**
   * Bearing at the middle of the sweep, in radians around the ring.
   *
   * The worlds of this journey are strung along one corridor in z,
   * so a camera that looks up or down that corridor has one of them
   * behind its subject — which is how the neutron star ended up as a
   * white disc beside a project. Looking across the corridor instead
   * puts every other body at least 55° off axis, out of frame at any
   * aspect ratio including an ultrawide, and still catches the gas
   * giant's light from the side rather than behind it.
   */
  centre: 0,
  /** How far the camera moves from one project to the next. */
  sweep: 0.3,
  /**
   * Where a project's marker sits relative to its camera. Negative,
   * which puts the markers on the half of the ring that falls to the
   * right of frame — the copy column is on the left at every width,
   * and a point of light crossing a paragraph is a point of light in
   * the way.
   */
  lead: -0.95,
  /** How far apart the markers are along the ring. */
  step: 0.6,
} as const;

/** Signed distance of `index` from the middle of the set. */
function fromCentre(index: number, count: number) {
  return index - (count - 1) / 2;
}

export function markerAngle(index: number, count: number) {
  return (
    PROJECT_ARC.centre + PROJECT_ARC.lead + fromCentre(index, count) * PROJECT_ARC.step
  );
}

/** Bearing the camera stands at to read project `index`. */
export function cameraBearing(index: number, count: number) {
  return PROJECT_ARC.centre + fromCentre(index, count) * PROJECT_ARC.sweep;
}

export function markerPosition(index: number, count: number, out: Vector3): Vector3 {
  const angle = markerAngle(index, count);
  return out
    .set(Math.cos(angle) * MARKER_RADIUS, 0, Math.sin(angle) * MARKER_RADIUS)
    .applyMatrix4(ringBasis)
    .add(BODIES.projects);
}

/** A body, lifted a touch so it does not sit dead on the horizon line. */
function centre(body: Vector3) {
  return new Vector3(body.x, body.y + 0.3, body.z);
}

/* ------------------------------------------------------------------
   The seat every project is read from.

   One configuration, one function, and deliberately no per-index
   numbers. The camera used to be built inside the ring's own tilted
   basis and aimed at the marker it belonged to, which meant both its
   height and its aim were a function of where that project happened
   to sit on a tilted circle: the three stops came out at +0.3, -2.6
   and +9.0 world units above the planet, and the fit pull-back for a
   narrow viewport multiplied that last one to +20. That is why the
   third project's planet climbed into the header while the other two
   sat still.

   So the seat is built in world axes instead. `elevation` and
   `distance` are constants, and `look` is the same point for every
   project, so the vertical composition is identical by construction
   rather than by tuning — there is no arithmetic left that could make
   one project differ from another. The only thing an index changes is
   the bearing: which side of the planet the camera stands on, which
   rotates the ring and brings that project's own marker round to the
   near edge.
------------------------------------------------------------------ */
export const PROJECT_VIEW = {
  /** How far from the planet the camera stands, in world units. */
  distance: 19.4,
  /** How far above the planet's centre. Positive, so the ring is read
   *  slightly from above and stays a ring rather than a line. */
  elevation: 1.5,
  /** The planet plus enough ring to read as a ring. */
  radius: 5.2,
  /** How far the aim slides on a wide screen, to free the left column. */
  side: 2.6,
} as const;

/** The one point every project stop looks at. */
export const PROJECT_LOOK = centre(BODIES.projects);

/** Where the camera stands to read project `index`. */
export function projectCamera(index: number, out: Vector3): Vector3 {
  const bearing = cameraBearing(index, PROJECT_COUNT);
  return out
    .set(
      Math.cos(bearing) * PROJECT_VIEW.distance,
      PROJECT_VIEW.elevation,
      Math.sin(bearing) * PROJECT_VIEW.distance,
    )
    .add(BODIES.projects);
}

function projectStop(index: number): Stop {
  return {
    phase: "projects",
    capability: 0,
    project: index,
    pos: projectCamera(index, new Vector3()),
    look: PROJECT_LOOK.clone(),
    side: PROJECT_VIEW.side,
    fit: true,
    radius: PROJECT_VIEW.radius,
  };
}

/* ------------------------------------------------------------------
   The stops, in order. One scroll moves between two of them.
------------------------------------------------------------------ */

const CAPABILITY_POS = new Vector3(-8, 0.5, -48.5);
const CAPABILITY_LOOK = centre(BODIES.services);

export const STOPS: Stop[] = [
  // 00 — the hole, far off, nothing else in the sky
  {
    phase: "signal",
    capability: 0,
    project: 0,
    pos: new Vector3(0, 1.2, 30),
    look: centre(BODIES.blackHole),
    side: 6.5,
    fit: true,
    // the emission ring, out to where the skirt fades
    radius: 4.8,
  },
  // 01 — inside it. One scroll from the start.
  {
    phase: "signal",
    capability: 0,
    project: 0,
    pos: new Vector3(0, 0, 0),
    look: new Vector3(0, 0, -16),
    side: 0,
    fit: false,
    radius: 0,
  },
  // 02 — the Earth-like world
  {
    phase: "about",
    capability: 0,
    project: 0,
    pos: new Vector3(4, 3.5, -15),
    look: centre(BODIES.about),
    side: 4.5,
    fit: true,
    radius: 3.7,
  },
  // 03..07 — five eras, identical camera: parked and centred
  ...Array.from({ length: CAPABILITY_COUNT }, (_, i) => ({
    phase: "capabilities" as const,
    capability: i,
    project: 0,
    pos: CAPABILITY_POS.clone(),
    look: CAPABILITY_LOOK.clone(),
    side: 4.8,
    fit: true,
    radius: 3.9,
  })),
  // 08..11 — one stop per project, each centred on its own marker
  ...Array.from({ length: PROJECT_COUNT }, (_, i) => projectStop(i)),
  // 12 — the neutron star
  {
    phase: "contact",
    capability: 0,
    project: PROJECT_COUNT - 1,
    pos: new Vector3(-4, 1, -133),
    look: centre(BODIES.contact),
    side: 4.5,
    fit: true,
    // the core is small; it is the bloom around it that has to fit
    radius: 4.2,
  },
];

export const STOP_COUNT = STOPS.length;

/**
 * Which stop each menu entry lands on. Derived, never typed twice:
 * adding or removing a project moves the contact stop, and every
 * number that depends on it has to move with it — the section height,
 * the anchors, the snap targets.
 */
export const ANCHOR_STOPS = {
  about: 2,
  capabilities: 3,
  work: 3 + CAPABILITY_COUNT,
  contact: STOPS.length - 1,
} as const;

/** Progress at which each stop sits. */
export function stopProgress(index: number) {
  return index / (STOP_COUNT - 1);
}

/**
 * The far side of the hole only exists once we have been inside it.
 * Keyed to progress rather than to a camera position so the switch is
 * guaranteed to land while stop 01 still has the frame black.
 */
export const REVEAL_PROGRESS = stopProgress(1) + 0.012;

/**
 * Where the neutron star starts to light up.
 *
 * Every world of this journey is strung along one corridor, so from
 * the projects the last body of all is 43 units behind the planet
 * being read about — and at full brightness it turned up as a white
 * disc beside it on any screen wide enough to reach it. Distance
 * cannot separate the two cases: the contact stop itself is framed
 * from 40 units away on a phone.
 *
 * Progress can, and it is the same rule the far side of the hole
 * already follows — a body that the journey has not arrived at yet is
 * not lit yet. It comes up over the last stop's worth of scroll,
 * which reads as an approach rather than a switch.
 */
export const CONTACT_LIT_FROM = stopProgress(STOPS.length - 2) + 0.04;

const smoothstep = (t: number) => {
  const x = Math.min(1, Math.max(0, t));
  return x * x * (3 - 2 * x);
};

/** The stop whose content should be on screen. */
export function stopAt(progress: number): Stop {
  const index = Math.round(
    Math.min(1, Math.max(0, progress)) * (STOP_COUNT - 1),
  );
  return STOPS[Math.min(STOP_COUNT - 1, Math.max(0, index))];
}

/* ------------------------------------------------------------------
   Framing.

   The camera used to be aimed by numbers guessed against a viewport
   ratio: pull back this much below that aspect, lift the aim by that
   fraction of the frame. It worked on the phone it was tuned on and
   nowhere else, because it knew nothing about the two things that
   actually decide where a body can go — how tall the fixed header is,
   and how much of the screen this stop's copy is using. A stop whose
   panel is a whole contact form has far less room than one whose
   panel is a headline, and no constant can be right for both.

   So the layout measures itself and hands the camera a band: the
   strip of screen between the header and the copy that the body is
   allowed to occupy. The camera then does two things with it — pull
   back until the body fits inside the band, and aim so the body sits
   in the middle of it. That is the 3D equivalent of a planet
   belonging to its own section rather than floating over the page,
   and it is why there is not a single hard-coded offset left.
------------------------------------------------------------------ */

export interface Frame {
  /** 0 = body dead centre, 1 = body pushed aside for a side-by-side layout. */
  side: number;
  /** Top of the free band, as a fraction of the frame (0 = top edge). */
  bandTop: number;
  /** Bottom of the free band, same units. */
  bandBottom: number;
  /** Vertical field of view, in radians. */
  fov: number;
  /** width / height of the drawing surface. */
  aspect: number;
}

/** Above this aspect the copy sits beside the body, not below it. */
const WIDE_ASPECT = 1.45;

/** How much of the band a body may fill. Under 1 so it never kisses
 *  the header or the first line of copy. */
const FILL = 0.88;

/**
 * How far the camera may retreat past its authored distance.
 *
 * Generous, because one stop genuinely needs it: on a phone the
 * projects stop has to fit a planet, a screenshot and a paragraph on
 * one screen, which leaves the sky a narrow strip. A smaller ceiling
 * there did not make the planet bigger — it made it overflow the
 * strip and get clipped by the image below, which is the failure this
 * whole system exists to prevent. Every other stop has room and never
 * comes near this.
 */
const MAX_PULL = 6;

export const DEFAULT_FRAME: Frame = {
  side: 1,
  bandTop: 0,
  bandBottom: 1,
  fov: (50 * Math.PI) / 180,
  aspect: 16 / 9,
};

/** How far the aim may slide sideways at a given aspect ratio. */
export function sideFor(aspect: number) {
  return smoothstep((aspect - 0.95) / 0.55);
}

const scratchPos = new Vector3();
const scratchLook = new Vector3();

/**
 * Distance this stop needs so its body fits the band, expressed as a
 * multiple of the authored distance.
 */
function pullFor(stop: Stop, frame: Frame, authored: number): number {
  if (!stop.fit || stop.radius <= 0 || authored <= 0) return 1;

  const band = Math.max(0.12, frame.bandBottom - frame.bandTop);
  const tan = Math.tan(frame.fov / 2);

  // visible height needed for the body to fill FILL of the band…
  const byHeight = stop.radius / (band * FILL * tan);
  // …and the same test across, where the band does not apply
  const byWidth = stop.radius / (0.82 * FILL * tan * frame.aspect);

  return Math.min(MAX_PULL, Math.max(1, Math.max(byHeight, byWidth) / authored));
}

/** The stop's camera position, pulled back to fit the band. */
function framedPos(stop: Stop, pull: number, out: Vector3): Vector3 {
  out.copy(stop.pos);
  if (pull <= 1) return out;
  return out.sub(stop.look).multiplyScalar(pull).add(stop.look);
}

/** The stop's aim: the body itself, slid sideways by however much of
 *  a side-by-side layout the viewport is actually wide enough for.
 *  Every stop aims at the thing you are looking at, so there is no
 *  second target that could disagree with the first. */
function framedLook(stop: Stop, side: number, out: Vector3): Vector3 {
  out.copy(stop.look);
  out.x -= stop.side * side;
  return out;
}

/**
 * Camera for a given progress: the current stop, eased toward the
 * next, then framed against the band the layout left free.
 */
export function cameraAt(
  progress: number,
  outPos: Vector3,
  outLook: Vector3,
  frame: Frame = DEFAULT_FRAME,
): void {
  const x = Math.min(1, Math.max(0, progress)) * (STOP_COUNT - 1);
  const index = Math.min(STOP_COUNT - 2, Math.floor(x));
  const k = smoothstep((x - index - 0.12) / 0.76);

  const from = STOPS[index];
  const to = STOPS[index + 1];

  const pullFrom = pullFor(from, frame, from.pos.distanceTo(from.look));
  const pullTo = pullFor(to, frame, to.pos.distanceTo(to.look));

  framedPos(from, pullFrom, outPos).lerp(framedPos(to, pullTo, scratchPos), k);
  framedLook(from, frame.side, outLook).lerp(
    framedLook(to, frame.side, scratchLook),
    k,
  );

  /* Centre the body in the band. Aiming below it lifts it up the
     frame; the offset is in world units, so it scales with how far
     away the camera ended up. The crossing is exempt — there the
     camera has to arrive exactly where it was authored to arrive. */
  const settled = (from.fit ? 1 - k : 0) + (to.fit ? k : 0);
  if (settled <= 0) return;

  const bandCentre = (frame.bandTop + frame.bandBottom) / 2;
  const visible = 2 * outPos.distanceTo(outLook) * Math.tan(frame.fov / 2);
  outLook.y -= (0.5 - bandCentre) * visible * settled;
}
