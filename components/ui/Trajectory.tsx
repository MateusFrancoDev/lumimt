"use client";

import { useEffect, useState, type CSSProperties } from "react";

import { navItems } from "@/lib/content";

/**
 * The journey made visible: a trajectory down the side of the frame,
 * one node per destination. Nodes stay lit once reached, so the rail
 * reads as a route travelled rather than as a progress bar.
 *
 * Purely an indicator — the header carries the real navigation, so
 * this is hidden from assistive technology instead of duplicating it.
 */
export function Trajectory() {
  const [progress, setProgress] = useState(0);
  const [reached, setReached] = useState(-1);
  const [active, setActive] = useState(-1);

  useEffect(() => {
    let frame = 0;

    const read = () => {
      frame = 0;
      const scrollable = document.documentElement.scrollHeight - window.innerHeight;
      setProgress(scrollable > 0 ? window.scrollY / scrollable : 0);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });

    const sections = navItems
      .map((item) => document.querySelector<HTMLElement>(item.href))
      .filter((element): element is HTMLElement => Boolean(element));

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          const index = sections.indexOf(entry.target as HTMLElement);
          if (index < 0) continue;
          if (entry.isIntersecting) {
            setActive(index);
            setReached((current) => Math.max(current, index));
          }
        }
      },
      { rootMargin: "-45% 0px -45% 0px" },
    );

    for (const section of sections) observer.observe(section);

    return () => {
      if (frame) cancelAnimationFrame(frame);
      window.removeEventListener("scroll", onScroll);
      observer.disconnect();
    };
  }, []);

  return (
    <div className="trajectory" aria-hidden="true">
      <span className="trajectory__line" />
      <span
        className="trajectory__craft"
        style={{ "--journey": progress.toFixed(4) } as CSSProperties}
      />
      {navItems.map((item, index) => (
        <span
          key={item.id}
          className="trajectory__node"
          data-reached={index <= reached}
          data-active={index === active}
          style={{ "--i": index } as CSSProperties}
        />
      ))}
    </div>
  );
}
