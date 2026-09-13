"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Group, Mesh, ShaderMaterial } from "three";
import { AdditiveBlending, DoubleSide } from "three";

import { BLACK_HOLE } from "@/lib/journey";

/* ------------------------------------------------------------------
   The black hole.

   Three parts, and none of them is a coloured donut:

   1. the horizon — a genuinely black sphere, drawn double-sided so
      that the frame stays black while the camera is inside it;
   2. the accretion disk — a thin annulus in the equatorial plane,
      brighter on the side rotating toward us (relativistic beaming),
      in silver and the signature blue, never orange;
   3. the photon ring — a hairline of light at the last stable orbit,
      billboarded so it reads from any angle.
------------------------------------------------------------------ */

const DISK_VERTEX = /* glsl */ `
  varying vec2 vUv;
  varying vec3 vLocal;

  void main() {
    vUv = uv;
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

const DISK_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uInner;
  uniform float uOuter;
  varying vec3 vLocal;

  float hash(vec2 p) {
    return fract(sin(dot(p, vec2(127.1, 311.7))) * 43758.5453);
  }

  float noise(vec2 p) {
    vec2 i = floor(p);
    vec2 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    float a = hash(i);
    float b = hash(i + vec2(1.0, 0.0));
    float c = hash(i + vec2(0.0, 1.0));
    float d = hash(i + vec2(1.0, 1.0));
    return mix(mix(a, b, f.x), mix(c, d, f.x), f.y);
  }

  void main() {
    float r = length(vLocal.xz);
    float angle = atan(vLocal.z, vLocal.x);

    // normalised position across the annulus
    float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);

    // inner edge is hot and bright, outer edge dissolves
    float radial = smoothstep(0.0, 0.12, t) * smoothstep(1.0, 0.45, t);

    // material shears as it orbits: inner bands move faster
    float shear = uTime * (0.6 / max(r * 0.04, 0.35));
    float bands = noise(vec2(angle * 3.2 + shear, r * 0.42));
    bands = mix(0.55, 1.25, bands);
    float filaments = noise(vec2(angle * 11.0 + shear * 1.7, r * 1.5));
    bands *= mix(0.75, 1.15, filaments);

    // relativistic beaming: the approaching side is brighter
    float beaming = 0.45 + 0.55 * smoothstep(-1.0, 1.0, sin(angle));

    vec3 hot = vec3(0.93, 0.96, 0.98);
    vec3 cool = vec3(0.33, 0.49, 0.62);
    vec3 colour = mix(hot, cool, smoothstep(0.0, 0.7, t));

    float intensity = radial * bands * beaming;
    gl_FragColor = vec4(colour * intensity, intensity * 0.9);
  }
`;

const RING_FRAGMENT = /* glsl */ `
  uniform float uInner;
  uniform float uOuter;
  varying vec3 vLocal;

  void main() {
    // RingGeometry hands us planar UVs, so the radius has to come from
    // the vertex position or the "ring" comes out as a horizontal band.
    float r = length(vLocal.xy);
    float mid = (uInner + uOuter) * 0.5;
    float band = (uOuter - uInner) * 0.5;
    float line = 1.0 - clamp(abs(r - mid) / max(band, 0.0001), 0.0, 1.0);
    line = pow(line, 2.2);
    vec3 colour = mix(vec3(0.55, 0.69, 0.78), vec3(1.0), line);
    gl_FragColor = vec4(colour, line * 0.9);
  }
`;

const RING_VERTEX = /* glsl */ `
  varying vec3 vLocal;
  void main() {
    vLocal = position;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export function BlackHole() {
  const diskRef = useRef<ShaderMaterial>(null);
  const haloRef = useRef<Group>(null);
  const horizonRef = useRef<Mesh>(null);

  const ringUniforms = useMemo(
    () => ({
      uInner: { value: BLACK_HOLE.radius * 1.24 },
      uOuter: { value: BLACK_HOLE.radius * 1.6 },
    }),
    [],
  );

  const diskUniforms = useMemo(
    () => ({
      uTime: { value: 0 },
      uInner: { value: BLACK_HOLE.diskInner },
      uOuter: { value: BLACK_HOLE.diskOuter },
    }),
    [],
  );

  useFrame((state, delta) => {
    if (diskRef.current) diskRef.current.uniforms.uTime.value += delta;

    // The photon ring and the glow always face the camera: seen from
    // any angle, the last orbit of light is a circle.
    if (haloRef.current) haloRef.current.quaternion.copy(state.camera.quaternion);

    // Once the camera is through, the horizon is behind us — let it go
    // rather than leaving a black disc hanging in the new sky.
    if (horizonRef.current) {
      const behind = state.camera.position.z < BLACK_HOLE.position.z - 40;
      horizonRef.current.visible = !behind;
    }
  });

  return (
    <group position={BLACK_HOLE.position}>
      {/* the horizon: black, and black from the inside too */}
      <mesh ref={horizonRef}>
        <sphereGeometry args={[BLACK_HOLE.radius, 48, 32]} />
        <meshBasicMaterial color="#000000" side={DoubleSide} toneMapped={false} />
      </mesh>

      {/* accretion disk, in the equatorial plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]}>
        <ringGeometry args={[BLACK_HOLE.diskInner, BLACK_HOLE.diskOuter, 192, 12]} />
        <shaderMaterial
          ref={diskRef}
          uniforms={diskUniforms}
          vertexShader={DISK_VERTEX}
          fragmentShader={DISK_FRAGMENT}
          transparent
          depthWrite={false}
          side={DoubleSide}
          blending={AdditiveBlending}
          toneMapped={false}
        />
      </mesh>

      <group ref={haloRef}>
        {/* photon ring */}
        <mesh>
          <ringGeometry args={[BLACK_HOLE.radius * 1.24, BLACK_HOLE.radius * 1.6, 128]} />
          <shaderMaterial
            uniforms={ringUniforms}
            vertexShader={RING_VERTEX}
            fragmentShader={RING_FRAGMENT}
            transparent
            depthWrite={false}
            side={DoubleSide}
            blending={AdditiveBlending}
            toneMapped={false}
          />
        </mesh>
      </group>
    </group>
  );
}
