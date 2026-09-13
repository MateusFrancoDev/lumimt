"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { Points, ShaderMaterial } from "three";
import { AdditiveBlending, Vector3 } from "three";

import { BLACK_HOLE } from "@/lib/journey";

/* ------------------------------------------------------------------
   The deep field.

   Sparse, not a wall of glitter: the emptiness is the point. One draw
   call for the whole sky.

   The gravitational lensing is done here, in the vertex shader, by
   displacing each star away from the black hole in view space by an
   amount proportional to 1/angle. That is the actual behaviour of
   light near a mass, and it means the bending is real geometry rather
   than a full-screen post effect — no render targets, no extra pass,
   and it costs nothing when the hole is far away.
------------------------------------------------------------------ */

const VERTEX = /* glsl */ `
  uniform float uStrength;
  uniform vec3 uHole;
  uniform float uSize;
  attribute float aSize;
  attribute float aTone;
  varying float vTone;
  varying float vStretch;

  void main() {
    vTone = aTone;
    vStretch = 0.0;

    vec4 view = modelViewMatrix * vec4(position, 1.0);
    vec3 hole = (viewMatrix * vec4(uHole, 1.0)).xyz;

    if (uStrength > 0.0001 && view.z < 0.0) {
      // angular offset of this star from the hole, as seen by the camera
      vec2 star = view.xy / max(-view.z, 0.001);
      vec2 centre = hole.xy / max(-hole.z, 0.001);
      vec2 offset = star - centre;
      float angle = max(length(offset), 0.015);

      // only light passing behind the mass is deflected
      float behind = smoothstep(0.0, 60.0, (-view.z) - (-hole.z));
      float deflection = (uStrength / angle) * behind;
      vStretch = clamp(deflection * 6.0, 0.0, 1.0);

      view.xy += normalize(offset) * deflection * (-view.z);
    }

    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp(uSize * aSize * (1.0 + vStretch * 1.6) * (260.0 / max(-view.z, 1.0)), 0.4, 7.0);
  }
`;

const FRAGMENT = /* glsl */ `
  varying float vTone;
  varying float vStretch;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.5, 0.0, d);
    core *= core;

    // silver by default, cooling toward the signature blue
    vec3 silver = vec3(0.77, 0.79, 0.79);
    vec3 blue = vec3(0.55, 0.69, 0.78);
    vec3 colour = mix(silver, blue, vTone * 0.85 + vStretch * 0.15);

    gl_FragColor = vec4(colour, core * (0.36 + vTone * 0.42));
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

interface DeepFieldProps {
  count: number;
}

export function DeepField({ count }: DeepFieldProps) {
  const materialRef = useRef<ShaderMaterial>(null);
  const pointsRef = useRef<Points>(null);

  const { positions, sizes, tones } = useMemo(() => {
    const rand = hash(20374);
    const positions = new Float32Array(count * 3);
    const sizes = new Float32Array(count);
    const tones = new Float32Array(count);

    for (let i = 0; i < count; i += 1) {
      // a long, wide volume around the corridor the camera flies down
      positions[i * 3] = (rand() - 0.5) * 900;
      positions[i * 3 + 1] = (rand() - 0.5) * 620;
      positions[i * 3 + 2] = 320 - rand() * 1500;
      sizes[i] = 0.35 + rand() * 0.9;
      tones[i] = rand();
    }

    return { positions, sizes, tones };
  }, [count]);

  const uniforms = useMemo(
    () => ({
      uStrength: { value: 0 },
      uHole: { value: new Vector3().copy(BLACK_HOLE.position) },
      uSize: { value: 1 },
    }),
    [],
  );

  useFrame((state) => {
    const material = materialRef.current;
    if (!material) return;

    // Deflection scales with how close the camera is to the mass, and
    // dies off completely once it is behind us.
    const distance = state.camera.position.distanceTo(BLACK_HOLE.position);
    const ahead = state.camera.position.z > BLACK_HOLE.position.z - 30;
    const strength = ahead ? Math.min(0.22, 5.5 / Math.max(distance, 4)) : 0;
    material.uniforms.uStrength.value += (strength - material.uniforms.uStrength.value) * 0.1;
    material.uniforms.uSize.value = state.size.height / 900;

    if (pointsRef.current) {
      // an extremely slow drift, so the sky is never dead
      pointsRef.current.rotation.z = state.clock.elapsedTime * 0.0012;
    }
  });

  return (
    <points ref={pointsRef} frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSize" args={[sizes, 1]} />
        <bufferAttribute attach="attributes-aTone" args={[tones, 1]} />
      </bufferGeometry>
      <shaderMaterial
        ref={materialRef}
        uniforms={uniforms}
        vertexShader={VERTEX}
        fragmentShader={FRAGMENT}
        transparent
        depthWrite={false}
        blending={AdditiveBlending}
      />
    </points>
  );
}
