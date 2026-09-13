"use client";

import { useEffect, type RefObject } from "react";

import { journey } from "@/lib/journeyStore";

/**
 * The only thing that connects the page to the journey.
 *
 * A GSAP timeline scrubbed by ScrollTrigger writes a single number.
 * It never touches React and never touches the scene directly: the
 * render loop reads that number and eases toward it. Scroll stops, the
 * number stops, the camera settles. Scroll back, it runs in reverse.
 */
export function ScrollDriver({ sectionRef }: { sectionRef: RefObject<HTMLElement | null> }) {
  useEffect(() => {
    const section = sectionRef.current;
    if (!section) return;

    let disposed = false;
    let cleanup: (() => void) | undefined;

    (async () => {
      const [{ gsap }, { ScrollTrigger }] = await Promise.all([
        import("gsap"),
        import("gsap/ScrollTrigger"),
      ]);
      if (disposed) return;

      gsap.registerPlugin(ScrollTrigger);

      const proxy = { p: 0 };
      const tween = gsap.to(proxy, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: 0.55,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          journey.target = proxy.p;
        },
      });

      cleanup = () => {
        tween.scrollTrigger?.kill();
        tween.kill();
      };
    })();

    return () => {
      disposed = true;
      cleanup?.();
    };
  }, [sectionRef]);

  return null;
}
