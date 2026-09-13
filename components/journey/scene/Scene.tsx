"use client";

import { useMemo, useRef } from "react";
import { useFrame, useThree } from "@react-three/fiber";
import { Vector3 } from "three";

import { BlackHole } from "@/components/journey/scene/BlackHole";
import { DeepField } from "@/components/journey/scene/DeepField";
import { Traverse } from "@/components/journey/scene/Traverse";
import { Worlds } from "@/components/journey/scene/Worlds";
import { cameraCurve, cameraTarget, progressToT } from "@/lib/journey";
import { journey, publish } from "@/lib/journeyStore";

/**
 * The camera rig.
 *
 * This is the whole motion system: ease the eased value toward what
 * the scroll asked for, read a position off the curve, read a look-at
 * target from the focus windows, and point the camera. Because the
 * easing is a fraction of the remaining distance, the camera stops
 * when the scroll stops and reverses when the scroll reverses.
 */
function CameraRig() {
  const { camera } = useThree();
  const target = useMemo(() => new Vector3(), []);
  const settled = useRef(false);

  useFrame((_, delta) => {
    const damping = 1 - Math.pow(0.0015, delta);
    journey.value += (journey.target - journey.value) * damping;

    // stop doing work once we are within a rounding error of the target
    const distance = Math.abs(journey.target - journey.value);
    if (distance < 0.00002) {
      if (settled.current) return;
      journey.value = journey.target;
      settled.current = true;
    } else {
      settled.current = false;
    }

    const progress = journey.value;
    const t = progressToT(progress);

    cameraCurve.getPoint(t, camera.position);
    cameraTarget(progress, t, camera.position, target);
    camera.lookAt(target);

    // A whisper of roll. Enough to feel hand-held, far too little to
    // read as an effect.
    camera.rotateZ(Math.sin(progress * 7.3) * 0.018);

    publish(progress);
  });

  return null;
}

interface SceneProps {
  quality: {
    stars: number;
    ring: number;
    filaments: number;
  };
}

export function Scene({ quality }: SceneProps) {
  return (
    <>
      <CameraRig />
      <DeepField count={quality.stars} />
      <BlackHole />
      <Traverse count={quality.filaments} />
      <Worlds ringCount={quality.ring} />
    </>
  );
}
