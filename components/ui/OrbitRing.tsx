"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

interface OrbitNode {
  id: string;
  name: string;
}

interface OrbitRingProps {
  nodes: OrbitNode[];
}

const clamp = (value: number, min: number, max: number) => Math.min(max, Math.max(min, value));

/**
 * The ring. Not Saturn: an orbital index, seen edge-on, where each
 * project is a body on the same path. Scrolling the section turns the
 * orbit, and whatever is at the front is the one being read.
 *
 * Decorative by design — the rows below carry every piece of
 * information, so nothing here is required to understand the work.
 */
export function OrbitRing({ nodes }: OrbitRingProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [rotation, setRotation] = useState(-90);

  useEffect(() => {
    const element = ref.current;
    const section = element?.closest("section");
    if (!element || !section) return;

    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    let frame = 0;

    const read = () => {
      frame = 0;
      const rect = section.getBoundingClientRect();
      const range = rect.height + window.innerHeight;
      const progress = clamp((window.innerHeight - rect.top) / range, 0, 1);
      setRotation(-90 + progress * 280);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
    };
  }, []);

  const placed = nodes.map((node, index) => {
    const angle = ((index / nodes.length) * 360 + rotation) * (Math.PI / 180);
    // depth: 1 at the front of the orbit, 0 at the back
    const depth = (Math.sin(angle) + 1) / 2;
    return {
      ...node,
      x: 50 + Math.cos(angle) * 44,
      y: 50 + Math.sin(angle) * 30,
      depth,
    };
  });

  const front = placed.reduce((a, b) => (a.depth > b.depth ? a : b));

  return (
    <div className="orbit" ref={ref} aria-hidden="true">
      {/* Two arcs rather than one ellipse: the far side of the orbit is
          further away, so it carries less light than the near side. */}
      <svg className="orbit__path" viewBox="0 0 100 100" preserveAspectRatio="none">
        <path className="orbit__arc orbit__arc--far" d="M6,50 A44,30 0 0,1 94,50" />
        <path className="orbit__arc orbit__arc--near" d="M94,50 A44,30 0 0,1 6,50" />
      </svg>

      {/* Lumimt at the focus of the orbit */}
      <span className="orbit__focus" />

      {placed.map((node) => (
        <span
          key={node.id}
          className="orbit__node"
          style={
            {
              left: `${node.x.toFixed(2)}%`,
              top: `${node.y.toFixed(2)}%`,
              "--depth": node.depth.toFixed(3),
            } as CSSProperties
          }
        />
      ))}

      <span className="orbit__label mono-sm">{front.name}</span>
    </div>
  );
}
