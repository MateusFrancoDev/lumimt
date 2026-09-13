"use client";

import { useEffect, useState } from "react";

/** True once the document has scrolled past `threshold` px.
 *  rAF-throttled: the listener never does work more than once a frame. */
export function useScrolledPast(threshold = 24): boolean {
  const [past, setPast] = useState(false);

  useEffect(() => {
    let frame = 0;

    const read = () => {
      frame = 0;
      setPast(window.scrollY > threshold);
    };

    const onScroll = () => {
      if (frame) return;
      frame = requestAnimationFrame(read);
    };

    read();
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      if (frame) cancelAnimationFrame(frame);
    };
  }, [threshold]);

  return past;
}
