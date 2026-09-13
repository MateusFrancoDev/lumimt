"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Points } from "three";
import { AdditiveBlending, Color, Vector3 } from "three";

import {
  ABOUT,
  CAPABILITIES,
  CONTACT,
  FINAL_LIGHT,
  MOON_ORBIT,
  WORK,
  WORK_MARKER_RADIUS,
  WORK_RING,
} from "@/lib/journey";
import { MOON_STOPS, PROJECT_STOPS } from "@/lib/journeyChapters";
import { journey } from "@/lib/journeyStore";

/* ------------------------------------------------------------------
   Worlds.

   Every body is a shaded sphere with no texture at all: the surface,
   the terminator and the rim light are computed in the fragment
   shader. That keeps the whole scene at zero bytes of image payload,
   which is most of why this stays fast on a phone.
------------------------------------------------------------------ */

const PLANET_VERTEX = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vLocal;
  varying vec3 vViewDir;

  void main() {
    vLocal = position;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vViewDir = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

const PLANET_FRAGMENT = /* glsl */ `
  uniform vec3 uLight;
  uniform vec3 uBase;
  uniform vec3 uRim;
  uniform float uRough;
  uniform float uSeed;
  uniform float uRimStrength;

  varying vec3 vNormalW;
  varying vec3 vLocal;
  varying vec3 vViewDir;

  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
          mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
          mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }

  void main() {
    vec3 n = normalize(vNormalW);
    float lambert = smoothstep(-0.25, 0.55, dot(n, normalize(uLight)));

    // surface variation, two octaves, deliberately faint
    vec3 sp = vLocal * 0.14 + uSeed;
    float surface = noise(sp) * 0.62 + noise(sp * 3.1) * 0.38;
    surface = mix(1.0 - uRough, 1.0 + uRough, surface);

    // the lit face, the terminator, and the part we are not meant to see
    vec3 lit = uBase * surface;
    vec3 dark = uBase * 0.07;
    vec3 colour = mix(dark, lit, lambert);

    // rim: the atmosphere catching light from behind
    float fresnel = pow(1.0 - clamp(dot(n, normalize(vViewDir)), 0.0, 1.0), 3.2);
    float backlit = smoothstep(-0.6, 0.35, dot(n, normalize(uLight)));
    colour += uRim * fresnel * (0.25 + backlit * 0.75) * uRimStrength;

    gl_FragColor = vec4(colour, 1.0);
  }
`;

interface PlanetProps {
  position: Vector3;
  radius: number;
  base: string;
  rim: string;
  light: Vector3;
  seed?: number;
  rough?: number;
  spin?: number;
  rimStrength?: number;
}

function Planet({
  position,
  radius,
  base,
  rim,
  light,
  seed = 0,
  rough = 0.35,
  spin = 0.012,
  rimStrength = 1,
}: PlanetProps) {
  const ref = useRef<Group>(null);

  const uniforms = useMemo(
    () => ({
      uLight: { value: new Vector3().copy(light).sub(position).normalize() },
      uBase: { value: new Color(base) },
      uRim: { value: new Color(rim) },
      uRough: { value: rough },
      uSeed: { value: seed },
      uRimStrength: { value: rimStrength },
    }),
    [base, light, position, rim, rimStrength, rough, seed],
  );

  // Nothing in the scene is ever completely still.
  useFrame((_, delta) => {
    if (ref.current) ref.current.rotation.y += delta * spin;
  });

  return (
    <group position={position}>
      <group ref={ref}>
        <mesh>
          <sphereGeometry args={[radius, 64, 48]} />
          <shaderMaterial
            uniforms={uniforms}
            vertexShader={PLANET_VERTEX}
            fragmentShader={PLANET_FRAGMENT}
          />
        </mesh>
      </group>
    </group>
  );
}

/* ------------------------------------------------------------------
   The moon system — one moon per capability.

   The orbit is driven by scroll, not by the clock: each moon is timed
   to arrive at the observation slot exactly when its name appears in
   the overlay.
------------------------------------------------------------------ */

const FRONT_ANGLE = Math.PI * 0.62;

export function MoonSystem({ light }: { light: Vector3 }) {
  const group = useRef<Group>(null);
  const moons = useRef<(Group | null)[]>([]);

  const uniforms = useMemo(
    () => ({
      uLight: { value: new Vector3().copy(light).sub(CAPABILITIES.position).normalize() },
      uBase: { value: new Color("#5c6a75") },
      uRim: { value: new Color("#8db1c7") },
      uRough: { value: 0.5 },
      uSeed: { value: 4.2 },
      uRimStrength: { value: 1 },
    }),
    [light],
  );

  useFrame(() => {
    const p = journey.value;
    const span = MOON_STOPS[MOON_STOPS.length - 1] - MOON_STOPS[0];
    const local = (p - MOON_STOPS[0]) / span;
    const step = (Math.PI * 2) / MOON_STOPS.length;
    // rotation such that moon i sits at FRONT_ANGLE exactly at MOON_STOPS[i]
    const rotation = local * step * (MOON_STOPS.length - 1);

    moons.current.forEach((moon, index) => {
      if (!moon) return;
      const angle = FRONT_ANGLE + index * step - rotation;
      moon.position.set(
        Math.cos(angle) * MOON_ORBIT.radius,
        Math.sin(angle) * MOON_ORBIT.radius * Math.sin(MOON_ORBIT.tilt),
        Math.sin(angle) * MOON_ORBIT.radius * Math.cos(MOON_ORBIT.tilt),
      );
    });
  });

  return (
    <group ref={group} position={CAPABILITIES.position}>
      {MOON_STOPS.map((_, index) => (
        <group
          key={index}
          ref={(node) => {
            moons.current[index] = node;
          }}
        >
          <mesh>
            <sphereGeometry args={[MOON_ORBIT.moonRadius * (index % 2 ? 0.82 : 1), 32, 24]} />
            <shaderMaterial
              uniforms={uniforms}
              vertexShader={PLANET_VERTEX}
              fragmentShader={PLANET_FRAGMENT}
            />
          </mesh>
        </group>
      ))}
    </group>
  );
}

/* ------------------------------------------------------------------
   The rings — the projects.

   Particles rather than a textured band, so the ring can read as
   debris up close and as a solid arc from far away. Half of them are
   dust; a scattered few are brighter fragments that look more like
   data than like rock.
------------------------------------------------------------------ */

const RING_VERTEX = /* glsl */ `
  uniform float uSize;
  attribute float aSize;
  attribute float aTone;
  varying float vTone;
  varying float vNear;

  void main() {
    vTone = aTone;
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    float dist = max(-view.z, 1.0);
    gl_Position = projectionMatrix * view;
    // Clamped: without this, a fragment passing close to the lens turns
    // into a soft blob the size of a fist.
    gl_PointSize = clamp(uSize * aSize * (300.0 / dist), 0.5, 9.0);
    // and it fades out entirely rather than smearing across the frame
    vNear = smoothstep(3.0, 16.0, dist);
  }
`;

const RING_FRAGMENT = /* glsl */ `
  varying float vTone;
  varying float vNear;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.5, 0.05, d);

    vec3 dust = vec3(0.62, 0.65, 0.66);
    vec3 signal = vec3(0.68, 0.82, 0.9);
    vec3 colour = mix(dust, signal, step(0.86, vTone));
    float alpha = core * mix(0.28, 0.95, step(0.86, vTone)) * vNear;

    gl_FragColor = vec4(colour, alpha);
  }
`;

function hash(seed: number) {
  let a = seed >>> 0;
  return () => {
    a = (a + 0x6d2b79f5) >>> 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function RingSystem({ count }: { count: number }) {
  const ref = useRef<Points>(null);

  const { positions, sizes, tones } = useMemo(() => {
    const rand = hash(88117);
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const tones = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      // three bands with gaps between them, like a real ring system
      const band = rand();
      const spread = WORK_RING.outer - WORK_RING.inner;
      let radius = WORK_RING.inner + band * spread;
      if (band > 0.42 && band < 0.5) radius += spread * 0.06; // a division
      const angle = rand() * Math.PI * 2;

      positions[i * 3] = Math.cos(angle) * radius;
      positions[i * 3 + 1] = (rand() - 0.5) * 0.9;
      positions[i * 3 + 2] = Math.sin(angle) * radius;
      sizes[i] = 0.25 + rand() * 0.85;
      tones[i] = rand();
    }

    return { positions, sizes, tones };
  }, [count]);

  const uniforms = useMemo(() => ({ uSize: { value: 1 } }), []);

  useFrame((state, delta) => {
    if (!ref.current) return;
    ref.current.rotation.y += delta * 0.014;
    uniforms.uSize.value = state.size.height / 900;
  });

  return (
    <group position={WORK.position} rotation={[WORK_RING.tilt, 0, 0.06]}>
      <points ref={ref} frustumCulled={false}>
        <bufferGeometry>
          <bufferAttribute attach="attributes-position" args={[positions, 3]} />
          <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
          <bufferAttribute attach="attributes-aTone" args={[tones, 1]} />
        </bufferGeometry>
        <shaderMaterial
          uniforms={uniforms}
          vertexShader={RING_VERTEX}
          fragmentShader={RING_FRAGMENT}
          transparent
          depthWrite={false}
          blending={AdditiveBlending}
        />
      </points>

      <ProjectMarkers />
    </group>
  );
}

/** One light per project, sitting on the ring, lighting as it is read. */
function ProjectMarkers() {
  const markers = useRef<(Group | null)[]>([]);

  useFrame((state) => {
    const p = journey.value;
    markers.current.forEach((marker, index) => {
      if (!marker) return;
      const near = 1 - Math.min(1, Math.abs(p - PROJECT_STOPS[index]) / 0.05);
      const scale = 1 + near * 2.4;
      marker.scale.setScalar(scale);
      marker.quaternion.copy(state.camera.quaternion);
    });
  });

  return (
    <>
      {PROJECT_STOPS.map((_, index) => {
        // spaced around the arc the camera actually flies through
        const angle = Math.PI * (0.86 + index * 0.17);
        return (
          <group
            key={index}
            position={[
              Math.cos(angle) * WORK_MARKER_RADIUS,
              0.4,
              Math.sin(angle) * WORK_MARKER_RADIUS,
            ]}
          >
            <group
              ref={(node) => {
                markers.current[index] = node;
              }}
            >
              <mesh>
                <circleGeometry args={[0.5, 24]} />
                <meshBasicMaterial color="#dbe8f0" transparent opacity={0.95} toneMapped={false} />
              </mesh>
              <mesh>
                <planeGeometry args={[5, 5]} />
                <shaderMaterial
                  uniforms={{
                    uColour: { value: new Color("#8db1c7") },
                    uIntensity: { value: 0.55 },
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
        );
      })}
    </>
  );
}

/* A flat disc with constant alpha reads as a grey sticker. Light has
   to fall off, so the corona gets a radial falloff of its own. */
const GLOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const GLOW_FRAGMENT = /* glsl */ `
  uniform vec3 uColour;
  uniform float uIntensity;
  varying vec2 vUv;

  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float falloff = pow(clamp(1.0 - d, 0.0, 1.0), 2.6);
    gl_FragColor = vec4(uColour, falloff * uIntensity);
  }
`;

/** The distant sun behind the last world, with a corona that always
 *  faces us so it reads as light rather than as a sphere. */
function FinalSun() {
  const halo = useRef<Group>(null);
  const glowUniforms = useMemo(
    () => ({ uColour: { value: new Color("#a8c6d8") }, uIntensity: { value: 0.85 } }),
    [],
  );

  useFrame((state) => {
    if (halo.current) halo.current.quaternion.copy(state.camera.quaternion);
  });

  return (
    <group position={FINAL_LIGHT}>
      <mesh>
        <sphereGeometry args={[3.4, 24, 16]} />
        <meshBasicMaterial color="#f4f9fc" toneMapped={false} />
      </mesh>
      <group ref={halo}>
        <mesh>
          <planeGeometry args={[46, 46]} />
          <shaderMaterial
            uniforms={glowUniforms}
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
  );
}

/* ------------------------------------------------------------------
   The whole system
------------------------------------------------------------------ */

export function Worlds({ ringCount }: { ringCount: number }) {
  const systemLight = useMemo(() => new Vector3(-40, 60, -120), []);
  const aboutLight = useMemo(() => ABOUT.position.clone().add(new Vector3(-160, 120, 90)), []);
  const capsLight = useMemo(
    () => CAPABILITIES.position.clone().add(new Vector3(140, 110, 70)),
    [],
  );
  const workLight = useMemo(() => WORK.position.clone().add(new Vector3(-180, 100, 60)), []);
  const system = useRef<Group>(null);

  // The far side is not visible from the near side. The toggle happens
  // while the camera is inside the horizon and the frame is black, so
  // there is nothing to see popping in.
  useFrame((state) => {
    if (system.current) system.current.visible = state.camera.position.z < -6;
  });

  return (
    <group ref={system}>
      <Planet
        position={ABOUT.position}
        radius={ABOUT.radius}
        base="#33424f"
        rim="#8db1c7"
        light={aboutLight}
        seed={1.7}
        rough={0.4}
      />

      <Planet
        position={CAPABILITIES.position}
        radius={CAPABILITIES.radius}
        base="#2b3a46"
        rim="#8db1c7"
        light={capsLight}
        seed={9.1}
        rough={0.3}
        spin={0.018}
      />
      <MoonSystem light={capsLight} />

      <Planet
        position={WORK.position}
        radius={WORK.radius}
        base="#38434c"
        rim="#a8c6d8"
        light={workLight}
        seed={3.4}
        rough={0.28}
        spin={0.009}
      />
      <RingSystem count={ringCount} />

      {/* The last world: almost unlit, with a distant sun behind it. */}
      <Planet
        position={CONTACT.position}
        radius={CONTACT.radius}
        base="#20272e"
        rim="#c5d6e0"
        light={FINAL_LIGHT}
        seed={6.6}
        rough={0.22}
        spin={0.004}
        rimStrength={2.6}
      />
      <FinalSun />
    </group>
  );
}
