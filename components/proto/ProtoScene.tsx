"use client";

import { Suspense, useMemo, useRef, useState, type MutableRefObject } from "react";
import { useFrame } from "@react-three/fiber";
import { useTexture } from "@react-three/drei";
import {
  AdditiveBlending,
  Color,
  Group,
  Mesh,
  MeshBasicMaterial,
  PointLight,
  Points,
  ShaderMaterial,
  Texture,
  Vector3,
} from "three";

import {
  DEBRIS_FRAGMENT,
  DEBRIS_VERTEX,
  M87_FRAGMENT,
  SHADOW_FRAGMENT,
  STARS_FRAGMENT,
  STARS_VERTEX,
  GAS_FRAGMENT,
  GLOW_FRAGMENT,
  GLOW_VERTEX,
  ICE_WORLD_FRAGMENT,
  SURFACE_FRAGMENT,
  SURFACE_VERTEX,
} from "@/components/proto/shaders";
import {
  BODIES,
  HORIZON_RADIUS,
  PROJECT_RING,
  CONTACT_LIT_FROM,
  REVEAL_PROGRESS,
  STOP_COUNT,
  DEFAULT_FRAME,
  cameraAt,
  markerPosition,
  type Frame,
} from "@/lib/protoPath";

export interface ProtoReadout {
  progress: number;
  x: number;
  y: number;
  z: number;
  /** 0 outside the event horizon, 1 at the centre of it. */
  inside: number;
  /** The band the camera is framing into, as fractions of the frame. */
  bandTop: number;
  bandBottom: number;
}

/** Eased progress, shared with the bodies that react to it. */
const live = { progress: 0, depth: 1e4 };

/** What the layout measured, in fractions of the drawing surface. */
export interface MeasuredFrame {
  side: number;
  top: number;
  bottom: number;
}

interface RigProps {
  target: MutableRefObject<number>;
  /** The band of screen the copy and the header have left free. */
  frame: MutableRefObject<MeasuredFrame>;
  onReadout: (r: ProtoReadout) => void;
}

function CameraRig({ target, frame, onReadout }: RigProps) {
  const current = useRef(0);
  const lookAt = useMemo(() => new Vector3(), []);
  /** The band the camera is framing against right now, eased toward
   *  the one the layout last measured. */
  const now = useMemo<Frame>(() => ({ ...DEFAULT_FRAME }), []);
  const settled = useRef(false);

  useFrame(({ camera, size }, delta) => {
    const k = 1 - Math.pow(0.0001, delta);
    current.current += (target.current - current.current) * k;
    if (Math.abs(target.current - current.current) < 0.00005) {
      current.current = target.current;
    }

    /* The band changes when the copy changes — a new section, a new
       language, a rotated phone. Easing into it turns that into a
       camera move rather than a cut, and costs nothing when the band
       has not moved. */
    // the first frame takes the measurement whole: easing into it from
    // a default would show a swing the visitor never asked for
    const ease = settled.current ? 1 - Math.pow(0.004, delta) : 1;
    settled.current = true;
    const wanted = frame.current;
    now.side += (wanted.side - now.side) * ease;
    now.bandTop += (wanted.top - now.bandTop) * ease;
    now.bandBottom += (wanted.bottom - now.bandBottom) * ease;
    now.aspect = size.width / Math.max(size.height, 1);
    if ("fov" in camera) now.fov = ((camera.fov as number) * Math.PI) / 180;

    const p = current.current;
    live.progress = p;

    cameraAt(p, camera.position, lookAt, now);
    camera.lookAt(lookAt);

    const depth = camera.position.distanceTo(BODIES.blackHole);
    live.depth = depth;
    onReadout({
      progress: p,
      x: camera.position.x,
      y: camera.position.y,
      z: camera.position.z,
      inside: Math.min(1, Math.max(0, 1 - depth / HORIZON_RADIUS)),
      bandTop: now.bandTop,
      bandBottom: now.bandBottom,
    });
  });

  return null;
}

function StarField({ count = 2600 }: { count?: number }) {
  const material = useRef<ShaderMaterial>(null);

  const { positions, sizes, temps } = useMemo(() => {
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const temps = new Float32Array(count);
    let seed = 1337;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };

    for (let i = 0; i < count; i += 1) {
      // A third of the sky sits in a band, the way the galactic plane
      // does — a uniform scatter is the thing that reads as fake.
      const inBand = rand() < 0.38;
      const x = (rand() - 0.5) * 240;
      const y = inBand ? (rand() - 0.5) * 26 + (x * 0.18 - 6) : (rand() - 0.5) * 170;

      positions[i * 3] = x;
      positions[i * 3 + 1] = y;
      positions[i * 3 + 2] = 30 - rand() * 240;

      // magnitudes: many faint, few bright
      const m = rand();
      sizes[i] = 0.25 + Math.pow(m, 3.2) * 1.5;
      temps[i] = rand();
    }

    return { positions, sizes, temps };
  }, [count]);

  const uniforms = useMemo(() => ({ uScale: { value: 1 } }), []);

  useFrame((state) => {
    uniforms.uScale.value = state.size.height / 900;
  });

  return (
    <points frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aTemp" args={[temps, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={material}
        uniforms={uniforms}
        vertexShader={STARS_VERTEX}
        fragmentShader={STARS_FRAGMENT}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}

/** A soft glow that always faces the camera. */
function Glow({
  size,
  colour,
  intensity,
  power = 2.6,
  fade,
}: {
  size: number;
  colour: string;
  intensity: number;
  power?: number;
  /** Multiplies the intensity every frame. A ref rather than a prop
   *  so a body can dim without rebuilding its material each frame. */
  fade?: MutableRefObject<number>;
}) {
  const ref = useRef<Group>(null);
  const uniforms = useMemo(
    () => ({
      uColour: { value: new Color(colour) },
      uIntensity: { value: intensity },
      uPower: { value: power },
    }),
    [colour, intensity, power],
  );

  useFrame(({ camera }) => {
    if (ref.current) ref.current.quaternion.copy(camera.quaternion);
    if (fade) uniforms.uIntensity.value = intensity * fade.current;
  });

  return (
    <group ref={ref}>
      <mesh>
        <planeGeometry args={[size, size]} />
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={GLOW_VERTEX}
          fragmentShader={GLOW_FRAGMENT}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>
    </group>
  );
}

/* ------------------------------------------------------------------
   M87* — the black hole as it was actually imaged
------------------------------------------------------------------ */

/** Where the peak of the ring sits, as a fraction of the plane's half
 *  width. Everything else in the shader is expressed against it. */
const M87_PLANE = HORIZON_RADIUS * 14;

function BlackHole() {
  const halo = useRef<Group>(null);

  /* One ring radius and one fade, shared by the shadow and the light
     that surrounds it: they are two passes over the same picture, and
     nothing good happens if they can drift apart. */
  const uRing = useMemo(() => ({ value: 0.16 }), []);
  const uFade = useMemo(() => ({ value: 1 }), []);

  const ring = useMemo(
    () => ({
      uRing,
      uWidth: { value: 0.046 },
      // the bright side is the southern one, as in the published image
      uBeam: { value: -1.75 },
      uFade,
      uTime: { value: 0 },
    }),
    [uRing, uFade],
  );
  const shadow = useMemo(() => ({ uRing, uFade }), [uRing, uFade]);

  useFrame(({ camera }, delta) => {
    ring.uTime.value += delta;

    /* The reconstruction is a face-on image, so it is billboarded.
       Once the camera is close enough to be swallowed it fades out
       instead of splitting across the near plane. */
    const d = live.depth;
    uFade.value = Math.min(
      1,
      Math.max(0, (d - HORIZON_RADIUS * 0.15) / (HORIZON_RADIUS * 0.8)),
    );

    if (halo.current) halo.current.quaternion.copy(camera.quaternion);
  });

  return (
    <group position={BODIES.blackHole}>
      <group ref={halo}>
        {/* the shadow: stars go out inside it, with a soft edge */}
        <mesh renderOrder={1}>
          <planeGeometry args={[M87_PLANE, M87_PLANE]} />
          <shaderMaterial
            uniforms={shadow}
            vertexShader={GLOW_VERTEX}
            fragmentShader={SHADOW_FRAGMENT}
            transparent
            depthWrite={false}
            depthTest={false}
            toneMapped={false}
          />
        </mesh>

        {/* and the light bent around it, on top */}
        <mesh renderOrder={2}>
          <planeGeometry args={[M87_PLANE, M87_PLANE]} />
          <shaderMaterial
            uniforms={ring}
            vertexShader={GLOW_VERTEX}
            fragmentShader={M87_FRAGMENT}
            transparent
            depthWrite={false}
            depthTest={false}
            blending={AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>

      <pointLight intensity={260} color="#ff9a3c" distance={80} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------------------
   Surface worlds
------------------------------------------------------------------ */

interface SurfaceParams {
  landTint: string;
  seaTint: string;
  atmo: string;
  /** 0 keeps the real colour map, 1 fully repaints it. */
  landMix: number;
  seaMix: number;
  iceLatitude: number;
  iceStrength: number;
  city: number;
}

/**
 * The five eras. Each one repaints the same real geography rather than
 * replacing it, so the continents are always the actual continents —
 * only the climate changes.
 */
const ERAS: SurfaceParams[] = [
  {
    // Pangaea — hot, dry, a young ocean
    landTint: "#9a6b3a",
    seaTint: "#16323f",
    atmo: "#c99a5e",
    landMix: 0.92,
    seaMix: 0.72,
    iceLatitude: 0.99,
    iceStrength: 0,
    city: 0,
  },
  {
    // Age of oceans
    landTint: "#47654f",
    seaTint: "#0b3a5a",
    atmo: "#7fb2d8",
    landMix: 0.6,
    seaMix: 0.62,
    iceLatitude: 0.93,
    iceStrength: 0.3,
    city: 0,
  },
  {
    // Ice age — caps most of the way to the equator
    landTint: "#c3d4da",
    seaTint: "#3b6a82",
    atmo: "#bcdcf0",
    landMix: 0.88,
    seaMix: 0.55,
    iceLatitude: 0.26,
    iceStrength: 0.95,
    city: 0,
  },
  {
    // Age of life — close to the world as it is
    landTint: "#3f8043",
    seaTint: "#0d4560",
    atmo: "#84c48f",
    landMix: 0.32,
    seaMix: 0.28,
    iceLatitude: 0.88,
    iceStrength: 0.4,
    city: 0,
  },
  {
    // Age of cities — lit on the night side
    landTint: "#4c5763",
    seaTint: "#0f2a3a",
    atmo: "#8db1c7",
    landMix: 0.42,
    seaMix: 0.45,
    iceLatitude: 0.9,
    iceStrength: 0.3,
    city: 1.7,
  },
];

interface EarthMaps {
  map: Texture;
  ocean: Texture;
  night: Texture;
}

function useEarthMaps(): EarthMaps {
  const [map, ocean, night] = useTexture([
    "/textures/earth_atmos_2048.jpg",
    "/textures/earth_specular_2048.jpg",
    "/textures/earth_lights_2048.png",
  ]);
  return { map, ocean, night };
}

function surfaceUniforms(params: SurfaceParams, light: Vector3, maps: EarthMaps) {
  return {
    uMap: { value: maps.map },
    uOcean: { value: maps.ocean },
    uNight: { value: maps.night },
    uLight: { value: light.clone().normalize() },
    uLandTint: { value: new Color(params.landTint) },
    uSeaTint: { value: new Color(params.seaTint) },
    uAtmo: { value: new Color(params.atmo) },
    uLandMix: { value: params.landMix },
    uSeaMix: { value: params.seaMix },
    uIceLatitude: { value: params.iceLatitude },
    uIceStrength: { value: params.iceStrength },
    uCity: { value: params.city },
  };
}

/**
 * LHS 1140 b, for the section about the company: a world that is
 * known only from the light it takes away. It is tidally locked, so
 * it does not spin — the eye has to stay under the star — and what
 * moves is the pack ice at the edge of the open water.
 */
function IceWorld() {
  const uniforms = useMemo(
    () => ({
      uLight: { value: new Vector3(-0.85, 0.45, 0.7).normalize() },
      uIce: { value: new Color("#bccad2") },
      uIceShadow: { value: new Color("#6d8494") },
      uSea: { value: new Color("#6b92aa") },
      uSeaDeep: { value: new Color("#1d3a52") },
      uAtmo: { value: new Color("#8db1c7") },
      uEye: { value: 0.86 },
      uTime: { value: 0 },
    }),
    [],
  );

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
  });

  return (
    <group position={BODIES.about}>
      <group rotation={[0.4, 0, 0.41]}>
        <mesh>
          <sphereGeometry args={[3, 96, 64]} />
          <shaderMaterial
            uniforms={uniforms}
            vertexShader={SURFACE_VERTEX}
            fragmentShader={ICE_WORLD_FRAGMENT}
          />
        </mesh>
      </group>
      <Glow size={11} colour="#8db1c7" intensity={0.18} power={3.2} />
    </group>
  );
}

/** The same world, aged. The era is a continuous value driven by scroll. */
function ErasPlanet() {
  const spin = useRef<Group>(null);
  const maps = useEarthMaps();
  const uniforms = useMemo(
    () => surfaceUniforms(ERAS[0], new Vector3(0.85, 0.45, 0.7), maps),
    [maps],
  );
  const a = useMemo(() => new Color(), []);
  const b = useMemo(() => new Color(), []);

  useFrame((_, delta) => {
    if (spin.current) spin.current.rotation.y += delta * 0.04;

    // the capability stops are indices 3..7 of the journey
    const x = live.progress * (STOP_COUNT - 1);
    const era = Math.min(ERAS.length - 1, Math.max(0, x - 3));
    const low = Math.floor(era);
    const high = Math.min(ERAS.length - 1, low + 1);
    const k = era - low;
    const one = ERAS[low];
    const two = ERAS[high];

    uniforms.uLandTint.value.copy(a.set(one.landTint)).lerp(b.set(two.landTint), k);
    uniforms.uSeaTint.value.copy(a.set(one.seaTint)).lerp(b.set(two.seaTint), k);
    uniforms.uAtmo.value.copy(a.set(one.atmo)).lerp(b.set(two.atmo), k);
    uniforms.uLandMix.value = one.landMix + (two.landMix - one.landMix) * k;
    uniforms.uSeaMix.value = one.seaMix + (two.seaMix - one.seaMix) * k;
    uniforms.uIceLatitude.value =
      one.iceLatitude + (two.iceLatitude - one.iceLatitude) * k;
    uniforms.uIceStrength.value =
      one.iceStrength + (two.iceStrength - one.iceStrength) * k;
    uniforms.uCity.value = one.city + (two.city - one.city) * k;
  });

  return (
    <group position={BODIES.services}>
      <group ref={spin} rotation={[0.3, 0, 0.32]}>
        <mesh>
          <sphereGeometry args={[3.2, 96, 64]} />
          <shaderMaterial
            uniforms={uniforms}
            vertexShader={SURFACE_VERTEX}
            fragmentShader={SURFACE_FRAGMENT}
          />
        </mesh>
      </group>
      <Glow size={12} colour="#8db1c7" intensity={0.2} power={3.2} />
    </group>
  );
}

/* ------------------------------------------------------------------
   The gas giant and its ring of projects
------------------------------------------------------------------ */

interface RingProps {
  count: number;
  selected: number;
  onSelect: (index: number) => void;
}

/**
 * Every project is one point of light on the ring. Adding a project
 * adds a point — there is no per-project geometry to author, which is
 * the whole reason the projects live on a ring rather than on separate
 * bodies.
 */
function ProjectMarkers({ count, selected, onSelect }: RingProps) {
  const markers = useRef<(Group | null)[]>([]);
  const [hovered, setHovered] = useState(-1);

  const layout = useMemo(
    () =>
      Array.from({ length: count }, (_, i) => {
        const position = markerPosition(i, count, new Vector3());
        return [position.x, position.y, position.z] as [number, number, number];
      }),
    [count],
  );

  useFrame(({ camera, clock }) => {
    markers.current.forEach((marker, i) => {
      if (!marker) return;
      marker.quaternion.copy(camera.quaternion);
      const pulse = 1 + Math.sin(clock.elapsedTime * 1.6 + i) * 0.08;
      const emphasis = i === selected ? 1.55 : i === hovered ? 1.3 : 1;
      const wanted = pulse * emphasis;
      marker.scale.setScalar(marker.scale.x + (wanted - marker.scale.x) * 0.15);
    });
  });

  return (
    <>
      {layout.map((position, i) => (
        <group key={i} position={position}>
          <group
            ref={(node) => {
              markers.current[i] = node;
            }}
            onClick={(event) => {
              event.stopPropagation();
              onSelect(i);
            }}
            onPointerOver={(event) => {
              event.stopPropagation();
              setHovered(i);
              document.body.style.cursor = "pointer";
            }}
            onPointerOut={() => {
              setHovered(-1);
              document.body.style.cursor = "";
            }}
          >
            {/* a generous invisible hit area — the visible dot is tiny */}
            <mesh visible={false}>
              <planeGeometry args={[2.2, 2.2]} />
            </mesh>
            <mesh>
              <circleGeometry args={[0.12, 20]} />
              <meshBasicMaterial color="#ffffff" toneMapped={false} />
            </mesh>
            <mesh>
              <planeGeometry args={[1.5, 1.5]} />
              <shaderMaterial
                uniforms={{
                  uColour: { value: new Color(i === selected ? "#ffd79a" : "#9fd0ea") },
                  uIntensity: { value: 0.95 },
                  uPower: { value: 2.4 },
                }}
                vertexShader={GLOW_VERTEX}
                fragmentShader={GLOW_FRAGMENT}
                transparent
                depthWrite={false}
                blending={AdditiveBlending}
                toneMapped={false}
              />
            </mesh>
          </group>
        </group>
      ))}
    </>
  );
}

function GasGiant() {
  const spin = useRef<Group>(null);
  const debris = useRef<Points>(null);

  const uniforms = useMemo(
    () => ({
      uBandA: { value: new Color("#3f6076") },
      uBandB: { value: new Color("#9db2c0") },
      uBandC: { value: new Color("#d8c49a") },
      uAtmo: { value: new Color("#8db1c7") },
      uLight: { value: new Vector3(0.55, 0.5, 0.95).normalize() },
      uTime: { value: 0 },
    }),
    [],
  );

  const debrisUniforms = useMemo(
    () => ({ uScale: { value: 1 }, uColour: { value: new Color("#cfe0ec") } }),
    [],
  );

  const particles = useMemo(() => {
    const total = 2600;
    const array = new Float32Array(total * 3);
    let seed = 99;
    const rand = () => {
      seed = (seed * 1664525 + 1013904223) % 4294967296;
      return seed / 4294967296;
    };
    for (let i = 0; i < total; i += 1) {
      const radius = PROJECT_RING.inner + rand() * (PROJECT_RING.outer - PROJECT_RING.inner);
      const angle = rand() * Math.PI * 2;
      array[i * 3] = Math.cos(angle) * radius;
      array[i * 3 + 1] = (rand() - 0.5) * 0.7;
      array[i * 3 + 2] = Math.sin(angle) * radius;
    }
    return array;
  }, []);

  useFrame((_, delta) => {
    uniforms.uTime.value += delta;
    if (spin.current) spin.current.rotation.y += delta * 0.05;
    if (debris.current) debris.current.rotation.y += delta * 0.03;
  });

  return (
    <group position={BODIES.projects} rotation={[PROJECT_RING.tilt, 0, 0.12]}>
      <group ref={spin}>
        <mesh>
          <sphereGeometry args={[3.4, 96, 64]} />
          <shaderMaterial
            uniforms={uniforms}
            vertexShader={SURFACE_VERTEX}
            fragmentShader={GAS_FRAGMENT}
          />
        </mesh>
      </group>

      <points ref={debris} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[particles, 3]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={debrisUniforms}
          vertexShader={DEBRIS_VERTEX}
          fragmentShader={DEBRIS_FRAGMENT}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>

    </group>
  );
}

/* ------------------------------------------------------------------
   The neutron star
------------------------------------------------------------------ */

function NeutronStar() {
  const core = useRef<Mesh>(null);
  const skin = useRef<MeshBasicMaterial>(null);
  const light = useRef<PointLight>(null);
  /** 0 while the journey is still elsewhere, 1 on arrival. */
  const lit = useRef(0);

  useFrame(({ clock }) => {
    // a slow pulse, and nothing else: no jets, no rays
    if (core.current) core.current.scale.setScalar(1 + Math.sin(clock.elapsedTime * 2.4) * 0.025);

    /* This is the last body on the corridor every other body is
       strung along, so from the projects it sits right behind the
       planet being read about. It is lit by arrival rather than by
       being in frame — see CONTACT_LIT_FROM. */
    const t = (live.progress - CONTACT_LIT_FROM) / (1 - CONTACT_LIT_FROM);
    lit.current = Math.min(1, Math.max(0, t));
    const eased = lit.current * lit.current * (3 - 2 * lit.current);

    if (skin.current) skin.current.opacity = eased;
    if (light.current) light.current.intensity = 2200 * eased;
  });

  return (
    <group position={BODIES.contact}>
      <mesh ref={core}>
        <sphereGeometry args={[1.7, 48, 32]} />
        <meshBasicMaterial
          ref={skin}
          color="#ffffff"
          toneMapped={false}
          transparent
          opacity={0}
          depthWrite={false}
        />
      </mesh>

      <Glow size={14} colour="#eaf4ff" intensity={0.85} power={3.4} fade={lit} />
      <Glow size={34} colour="#9fc8e8" intensity={0.3} power={2.8} fade={lit} />
      {/* The outermost halo used to wash a phone screen from edge to
          edge, taking the contact form with it. */}
      <Glow size={62} colour="#5f8fb8" intensity={0.1} power={2.3} fade={lit} />
      <pointLight ref={light} intensity={0} color="#dceeff" distance={200} decay={2} />
    </group>
  );
}

/* ------------------------------------------------------------------ */

interface SceneProps extends RigProps {
  projectCount: number;
  selectedProject: number;
  onSelectProject: (index: number) => void;
}

export function ProtoScene({
  target,
  frame,
  onReadout,
  projectCount,
  selectedProject,
  onSelectProject,
}: SceneProps) {
  const farSide = useRef<Group>(null);

  // Nothing on the far side is visible from this side of the hole. The
  // switch happens while the camera is inside the horizon and the frame
  // is black, so there is nothing to see appearing.
  useFrame(() => {
    if (farSide.current) farSide.current.visible = live.progress > REVEAL_PROGRESS;
  });

  return (
    <>
      <CameraRig target={target} frame={frame} onReadout={onReadout} />

      <ambientLight intensity={0.22} />
      <directionalLight position={[14, 16, 12]} intensity={1.5} />

      <StarField />
      <BlackHole />

      <Suspense fallback={null}>
        <group ref={farSide} visible={false}>
        <IceWorld />
        <ErasPlanet />
        <GasGiant />
        <ProjectMarkers
          count={projectCount}
          selected={selectedProject}
          onSelect={onSelectProject}
        />
          <NeutronStar />
        </group>
      </Suspense>
    </>
  );
}
