"use client";

import { useEffect } from "react";

/**
 * TEMPORARY — development only. Remove once the footer jump is fixed.
 *
 * The page jumps back to the top when a touchpad reaches the footer,
 * and no simulated input reproduces it. This keeps a short record of
 * what happened just before, and when the document leaps upwards it
 * prints that record to the console — which `next dev` forwards to
 * .next/dev/logs/next-development.log.
 */
export function ScrollJumpProbe() {
  useEffect(() => {
    const started = performance.now();
    const trail: string[] = [];
    const note = (entry: string) => {
      trail.push(`${Math.round(performance.now() - started)}ms y=${Math.round(scrollY)} ${entry}`);
      if (trail.length > 60) trail.shift();
    };
    const caller = () => (new Error().stack ?? "").split("\n").slice(3, 7).map((l) => l.trim()).join(" < ");

    const restore: (() => void)[] = [];
    const wrap = <T extends object>(target: T, key: keyof T & string, label: string) => {
      const original = target[key] as unknown as (...args: unknown[]) => unknown;
      (target as Record<string, unknown>)[key] = function (this: unknown, ...args: unknown[]) {
        const who = this instanceof Element ? `${this.tagName.toLowerCase()}.${this.className}` : "";
        note(`${label}(${JSON.stringify(args)}) ${who} from ${caller()}`);
        return original.apply(this, args);
      };
      restore.push(() => {
        (target as Record<string, unknown>)[key] = original;
      });
    };
    wrap(window, "scrollTo", "window.scrollTo");
    wrap(window, "scroll", "window.scroll");
    wrap(window, "scrollBy", "window.scrollBy");
    wrap(Element.prototype, "scrollIntoView", "scrollIntoView");
    wrap(HTMLElement.prototype, "focus", "focus");

    const root = document.documentElement;
    const scrollTopDescriptor = Object.getOwnPropertyDescriptor(Element.prototype, "scrollTop");
    if (scrollTopDescriptor?.set) {
      Object.defineProperty(Element.prototype, "scrollTop", {
        ...scrollTopDescriptor,
        set(value: number) {
          if (this === root || this === document.body) note(`scrollTop=${value} from ${caller()}`);
          scrollTopDescriptor.set!.call(this, value);
        },
      });
      restore.push(() => Object.defineProperty(Element.prototype, "scrollTop", scrollTopDescriptor));
    }

    let wheelBurst = { count: 0, sum: 0, last: 0 };
    const flushWheel = () => {
      if (wheelBurst.count) note(`wheel x${wheelBurst.count} ΣdeltaY=${Math.round(wheelBurst.sum)}`);
      wheelBurst = { count: 0, sum: 0, last: 0 };
    };

    let previous = scrollY;
    const listeners: [EventTarget, string, EventListener][] = [
      [window, "wheel", (e) => {
        const w = e as WheelEvent;
        if (w.timeStamp - wheelBurst.last > 120) flushWheel();
        wheelBurst.count += 1;
        wheelBurst.sum += w.deltaY;
        wheelBurst.last = w.timeStamp;
      }],
      [window, "scroll", () => {
        const y = scrollY;
        const max = root.scrollHeight - innerHeight;
        if (Math.abs(y - previous) > 150) note(`scroll ${Math.round(previous)} -> ${Math.round(y)}`);
        if (previous - y > Math.max(600, max * 0.3)) {
          flushWheel();
          console.warn(
            `[scroll-jump] ${Math.round(previous)} -> ${Math.round(y)} | max=${max} viewport=${innerWidth}x${innerHeight} dpr=${devicePixelRatio} ` +
              `html.class="${root.className}" active=${document.activeElement?.tagName} hash="${location.hash}"\n` +
              trail.join("\n"),
          );
        }
        previous = y;
      }],
      [window, "scrollend", () => { flushWheel(); note("scrollend"); }],
      [window, "resize", () => note(`resize ${innerWidth}x${innerHeight}`)],
      [window, "hashchange", () => note(`hashchange ${location.hash}`)],
      [window, "popstate", () => note("popstate")],
      [document, "visibilitychange", () => note(`visibility ${document.visibilityState}`)],
      [document, "keydown", (e) => note(`key ${(e as KeyboardEvent).key}`)],
      [document, "pointerdown", (e) => {
        const p = e as PointerEvent;
        note(`pointerdown ${p.pointerType} on ${(p.target as Element)?.tagName?.toLowerCase()}.${(p.target as Element)?.className}`);
      }],
      [document, "click", (e) => note(`click on ${(e.target as Element)?.tagName?.toLowerCase()}.${(e.target as Element)?.className}`)],
      [document, "focusin", (e) => note(`focusin ${(e.target as Element)?.tagName?.toLowerCase()}`)],
    ];
    for (const [target, type, fn] of listeners) target.addEventListener(type, fn, { passive: true, capture: true });

    const classes = new MutationObserver(() => note(`html.class="${root.className}"`));
    classes.observe(root, { attributes: true, attributeFilter: ["class", "style"] });

    console.info("[scroll-jump] probe armed");

    return () => {
      for (const [target, type, fn] of listeners) target.removeEventListener(type, fn, { capture: true });
      classes.disconnect();
      restore.forEach((undo) => undo());
    };
  }, []);

  return null;
}
