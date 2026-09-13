"use client";

import dynamic from "next/dynamic";
import { useEffect, useRef, useState, type ReactNode } from "react";

import { JourneyOverlay } from "@/components/journey/JourneyOverlay";
import { ScrollDriver } from "@/components/journey/ScrollDriver";
import { resetJourney } from "@/lib/journeyStore";

/** The 3D bundle is never part of the first load. */
const JourneyCanvas = dynamic(
  () => import("@/components/journey/JourneyCanvas").then((m) => m.JourneyCanvas),
  { ssr: false },
);

/** Anchor positions, as progress along the journey. */
const ANCHORS: [id: string, progress: number][] = [
  ["about", 0.5],
  ["capabilities", 0.63],
  ["work", 0.78],
  ["contact", 0.94],
];

/** Remembers an explicit opt-in, so choosing the journey once under
 *  reduced motion does not have to be repeated on every visit. */
const OPT_IN_KEY = "lumimt:journey";

function storedOptIn() {
  try {
    return window.localStorage.getItem(OPT_IN_KEY) === "on";
  } catch {
    return false;
  }
}

function rememberOptIn() {
  try {
    window.localStorage.setItem(OPT_IN_KEY, "on");
  } catch {
    // private mode, blocked storage: the choice simply will not persist
  }
}

/**
 * `?journey=1` forces the journey, `?journey=0` forces the document.
 *
 * Read straight off `window.location` inside the effect rather than
 * with `useSearchParams`, which would pull this page out of static
 * rendering and require a Suspense boundary for a value that is only
 * ever needed once, on the client.
 */
function overrideFromUrl(): boolean | null {
  try {
    const value = new URLSearchParams(window.location.search).get("journey");
    if (value === "1" || value === "on") return true;
    if (value === "0" || value === "off") return false;
    return null;
  } catch {
    return null;
  }
}

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(
      window.WebGLRenderingContext &&
        (canvas.getContext("webgl2") || canvas.getContext("webgl")),
    );
  } catch {
    return false;
  }
}

/**
 * Decides which of the two versions of this site a visitor gets.
 *
 * The server always renders the plain document. It is replaced by the
 * journey only once we know the browser can draw it and that the
 * visitor has not asked for less motion — so reduced motion, no JS and
 * no WebGL all land on a complete, readable page rather than on a
 * degraded one.
 */
export function Journey({ fallback }: { fallback: ReactNode }) {
  const [immersive, setImmersive] = useState(false);
  const [offerable, setOfferable] = useState(false);
  const [forced, setForced] = useState(false);

  useEffect(() => {
    const motion = window.matchMedia("(prefers-reduced-motion: reduce)");

    const decide = () => {
      const capable = supportsWebGL();
      const override = overrideFromUrl();

      // An explicit URL override wins over everything, so either version
      // can be previewed on any machine without changing OS settings.
      if (override !== null) {
        setImmersive(capable && override);
        setOfferable(false);
        return;
      }

      const optedIn = storedOptIn();
      // The preference still decides by default. An explicit opt-in
      // overrides it, and is remembered.
      const running = capable && (!motion.matches || optedIn);
      setImmersive(running);
      // Reduced motion is a request not to be moved without asking —
      // not a reason to hide that the other version exists.
      setOfferable(capable && motion.matches && !optedIn);

      // Both reasons to decline are invisible on the page by design.
      // Saying so in development turns "it does not work on my machine"
      // into one line in the console.
      if (process.env.NODE_ENV === "development" && !running) {
        const why = !capable
          ? "WebGL is unavailable in this browser"
          : "the system is asking for reduced motion";
        console.info(
          `[lumimt] Showing the document version because ${why}. Open /check for details, or /?journey=1 to force the journey.`,
        );
      }
    };

    decide();
    motion.addEventListener("change", decide);
    return () => motion.removeEventListener("change", decide);
  }, []);

  if (immersive || forced) return <JourneyStage />;

  return (
    <>
      {fallback}
      {offerable ? (
        <button
          type="button"
          className="journey__enter mono"
          onClick={() => {
            rememberOptIn();
            window.scrollTo(0, 0);
            setForced(true);
          }}
        >
          <span className="journey__enter-label">Enter the journey</span>
          <span className="link__track" aria-hidden="true" />
          <span aria-hidden="true">↗</span>
        </button>
      ) : null}
    </>
  );
}

function JourneyStage() {
  const sectionRef = useRef<HTMLElement>(null);
  const [active, setActive] = useState(true);

  useEffect(() => {
    resetJourney();
    const section = sectionRef.current;
    if (!section) return;

    // Rendering is suspended the moment the journey leaves the screen.
    const observer = new IntersectionObserver(
      ([entry]) => setActive(entry.isIntersecting),
      { rootMargin: "10% 0px" },
    );
    observer.observe(section);
    return () => observer.disconnect();
  }, []);

  return (
    <main id="main" className="journey" ref={sectionRef}>
      <div className="journey__stage">
        <JourneyCanvas active={active} />
        <JourneyOverlay />
      </div>

      <ScrollDriver sectionRef={sectionRef} />

      {/* Real anchors at the scroll offsets that correspond to each
          destination, so the header navigation still works and each
          chapter remains a linkable place. */}
      {ANCHORS.map(([id, progress]) => (
        <span
          key={id}
          id={id}
          className="journey__anchor"
          style={{ top: `calc(${progress} * (100% - 100vh))` }}
        />
      ))}
    </main>
  );
}
