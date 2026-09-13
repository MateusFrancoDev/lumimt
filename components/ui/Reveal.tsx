"use client";

import { useEffect, useRef, useState, type CSSProperties, type ReactNode } from "react";

interface RevealProps {
  children: ReactNode;
  /** Pass "reveal" for the standard fade-and-rise, or omit it when the
   *  element only needs to publish `data-visible` for its children. */
  className?: string;
  delay?: number;
  threshold?: number;
  style?: CSSProperties;
  id?: string;
}

/**
 * Marks itself `data-visible` the first time it enters the viewport.
 * The content is always in the DOM and always readable: this removes
 * the travel, never the information.
 */
export function Reveal({
  children,
  className,
  delay = 0,
  threshold = 0.18,
  style,
  id,
}: RevealProps) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    if (typeof IntersectionObserver === "undefined") {
      setVisible(true);
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setVisible(true);
            observer.disconnect();
          }
        }
      },
      { threshold, rootMargin: "0px 0px -10% 0px" },
    );

    observer.observe(el);
    return () => observer.disconnect();
  }, [threshold]);

  return (
    <div
      id={id}
      ref={ref}
      className={className}
      data-visible={visible}
      style={{ ...style, ...(delay ? { "--reveal-delay": `${delay}ms` } : {}) } as CSSProperties}
    >
      {children}
    </div>
  );
}
