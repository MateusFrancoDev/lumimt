export interface NavItem {
  id: string;
  label: string;
  href: string;
}

export interface MethodStep {
  id: string;
  name: string;
  note: string;
}

export interface Capability {
  id: string;
  title: string;
  description: string;
  tags: string[];
}

/** Shape of the light curve drawn for a project: where the transit
 *  happens (0–1 across the plot), how deep the dip goes (0–1) and how
 *  much baseline scatter the signal carries. */
export interface CurveShape {
  center: number;
  depth: number;
  noise: number;
}

export interface Project {
  id: string;
  name: string;
  sector: string;
  kind: string;
  year: string;
  description: string;
  stack: string[];
  curve: CurveShape;
  href?: string;
}

export interface StarPoint {
  x: number;
  y: number;
  size: number;
  opacity: number;
  duration: number;
  delay: number;
}

export interface LensPoint {
  angle: number;
  distance: number;
  size: number;
  opacity: number;
}

export interface LensRing {
  radius: number;
  count: number;
  /** Degrees of rotation accumulated across the approach. */
  spin: number;
  /** Change in scale at full approach: negative falls in, positive sweeps past. */
  scaleDelta: number;
  /** How far a point stretches tangentially as light is dragged. */
  stretch: number;
  fade: number;
  /** Inner rings brighten as they accelerate inward. */
  boost: number;
  points: LensPoint[];
}
