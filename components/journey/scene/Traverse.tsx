"use client";

import { useMemo, useRef } from "react";
import { useFrame } from "@react-three/fiber";
import type { ShaderMaterial } from "three";
import { AdditiveBlending } from "three";

/* ------------------------------------------------------------------
   The traverse — the inside of the crossing.

   Explicitly not the hyperspace cliché: no full-length white streaks
   across the frame. These are short, thin, dim filaments that only
   elongate as the camera accelerates, tinted very slightly apart from
   each other so the light reads as split rather than as coloured.
------------------------------------------------------------------ */

const VERTEX = /* glsl */ `
  uniform float uStretch;
  attribute float aSide;
  attribute float aLength;
  attribute float aTone;
  varying float vTone;
  varying float vSide;

  void main() {
    vTone = aTone;
    vSide = aSide;
    vec3 p = position;
    // the trailing end falls further behind the harder we are pulled
    p.z += aSide * aLength * uStretch;
    // a whisker of dispersion, different for each filament
    p.x += (aTone - 0.5) * uStretch * 0.35;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(p, 1.0);
  }
`;

const FRAGMENT = /* glsl */ `
  uniform float uOpacity;
  varying float vTone;
  varying float vSide;

  void main() {
    vec3 cool = vec3(0.45, 0.61, 0.73);
    vec3 warm = vec3(0.82, 0.84, 0.84);
    vec3 colour = mix(cool, warm, vTone);
    // fades along its own length, so nothing has a hard end
    float fade = 1.0 - vSide;
    gl_FragColor = vec4(colour, uOpacity * fade * 0.5);
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

/** z range over which the filaments exist and are visible. */
const Z_START = 10;
const Z_END = -110;

export function Traverse({ count }: { count: number }) {
  const materialRef = useRef<ShaderMaterial>(null);

  const { positions, sides, lengths, tones } = useMemo(() => {
    const rand = hash(50331);
    const positions = new Float32Array(count * 6);
    const sides = new Float32Array(count * 2);
    const lengths = new Float32Array(count * 2);
    const tones = new Float32Array(count * 2);

    for (let i = 0; i < count; i += 1) {
      const angle = rand() * Math.PI * 2;
      // hollow: nothing right on the axis, or it would fly into the lens
      const radius = 3 + Math.pow(rand(), 0.65) * 24;
      const x = Math.cos(angle) * radius;
      const y = Math.sin(angle) * radius * 0.8;
      const z = Z_START - rand() * (Z_START - Z_END);
      const length = 1 + rand() * 4.5;
      const tone = rand();

      positions[i * 6] = x;
      positions[i * 6 + 1] = y;
      positions[i * 6 + 2] = z;
      positions[i * 6 + 3] = x;
      positions[i * 6 + 4] = y;
      positions[i * 6 + 5] = z;

      sides[i * 2] = 0;
      sides[i * 2 + 1] = 1;
      lengths[i * 2] = length;
      lengths[i * 2 + 1] = length;
      tones[i * 2] = tone;
      tones[i * 2 + 1] = tone;
    }

    return { positions, sides, lengths, tones };
  }, [count]);

  const uniforms = useMemo(
    () => ({ uStretch: { value: 0 }, uOpacity: { value: 0 } }),
    [],
  );

  useFrame((state) => {
    const material = materialRef.current;
    if (!material) return;

    // Present only while the camera is actually inside the crossing.
    const z = state.camera.position.z;
    const inside = z < Z_START && z > Z_END;
    const depth = inside ? (Z_START - z) / (Z_START - Z_END) : 0;
    // rises on entry, holds, then releases as the far side opens up
    const envelope = inside
      ? Math.min(1, depth / 0.18) * Math.min(1, (1 - depth) / 0.35)
      : 0;

    material.uniforms.uOpacity.value += (envelope - material.uniforms.uOpacity.value) * 0.12;
    material.uniforms.uStretch.value += (envelope * 5.5 - material.uniforms.uStretch.value) * 0.08;
  });

  return (
    <lineSegments frustumCulled={false}>
      <bufferGeometry>
        <bufferAttribute attach="attributes-position" args={[positions, 3]} />
        <bufferAttribute attach="attributes-aSide" args={[sides, 1]} />
        <bufferAttribute attach="attributes-aLength" args={[lengths, 1]} />
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
    </lineSegments>
  );
}
