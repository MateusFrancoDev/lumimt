"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import { Canvas } from "@react-three/fiber";

import { ProtoOverlay, type Phase } from "@/components/proto/ProtoOverlay";
import {
  ProtoScene,
  type MeasuredFrame,
  type ProtoReadout,
} from "@/components/proto/ProtoScene";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { ANCHOR_STOPS, STOP_COUNT, sideFor, stopAt } from "@/lib/protoPath";

/** The body never gets less than this much of the screen, even when a
 *  panel is tall enough to want the lot. Below it the scene stops
 *  being a scene, and the copy has a scrim behind it anyway. */
const MIN_BAND = 0.26;

function supportsWebGL() {
  try {
    const canvas = document.createElement("canvas");
    return Boolean(canvas.getContext("webgl2") ?? canvas.getContext("webgl"));
  } catch {
    return false;
  }
}



/**
 * Where each menu entry lands, as a stop index.
 *
 * Steps, not a percentage of the section: a step is the unit the
 * scroll snaps to, so an anchor placed at a whole number of steps is
 * guaranteed to be a snap position. The indices come from the path
 * itself, so changing the number of projects moves them automatically.
 */
const ANCHORS: [id: string, step: number][] = [
  ["about", ANCHOR_STOPS.about],
  ["capabilities", ANCHOR_STOPS.capabilities],
  ["work", ANCHOR_STOPS.work],
  ["contact", ANCHOR_STOPS.contact],
];

/**
 * Scroll-driven camera journey.
 *
 * Unconditional by design: no reduced-motion branch and no silent
 * swap to another page. If WebGL is missing it says so on screen,
 * because a silent fallback is what made this impossible to diagnose.
 */
export function SpaceProto() {
  const sectionRef = useRef<HTMLElement>(null);
  const progress = useRef(0);

  const progressOut = useRef<HTMLSpanElement>(null);
  const xOut = useRef<HTMLSpanElement>(null);
  const yOut = useRef<HTMLSpanElement>(null);
  const zOut = useRef<HTMLSpanElement>(null);
  const bandOut = useRef<HTMLSpanElement>(null);
  const blackout = useRef<HTMLDivElement>(null);

  const { t } = useLanguage();
  const capabilityCount = t.capabilities.items.length;
  const projectCount = t.work.items.length;

  /* What the layout has left free for the scene. Read every frame by
     the camera rig, written only when something actually moves. */
  const frame = useRef<MeasuredFrame>({ side: 1, top: 0, bottom: 1 });

  const [webgl, setWebgl] = useState<boolean | null>(null);
  /** Loud at the start, quiet in the middle, gone at the last stop. */
  const [hint, setHint] = useState<"start" | "more" | "end">("start");
  const hintRef = useRef<"start" | "more" | "end">("start");
  const [debug, setDebug] = useState(false);
  const [view, setView] = useState<{ phase: Phase; capability: number; project: number }>({
    phase: "signal",
    capability: 0,
    project: 0,
  });
  const viewRef = useRef(view);
  const countsRef = useRef({ capabilities: capabilityCount, projects: projectCount });
  countsRef.current = { capabilities: capabilityCount, projects: projectCount };

  /** A clicked marker wins over the scroll-derived one, until the
   *  journey leaves the projects stretch. */
  const [picked, setPicked] = useState<number | null>(null);
  const pickedRef = useRef<number | null>(null);

  useEffect(() => {
    setWebgl(supportsWebGL());
    // the readout is a diagnostic, not chrome: ?debug puts it back
    setDebug(new URLSearchParams(window.location.search).has("debug"));
  }, []);

  /**
   * Measure the band of screen the body may use: below the header,
   * above the copy.
   *
   * This is the whole fix for bodies sitting too high. Nothing is
   * positioned against the viewport any more — the camera is aimed at
   * the gap this stop's own section leaves, so a tall panel gets a
   * smaller, lower body and a short one gets a big, high body, on any
   * screen, with no breakpoint deciding it.
   */
  const measure = useCallback(() => {
    const stage = sectionRef.current?.querySelector<HTMLElement>(".proto__stage");
    if (!stage) return;

    const { width, height } = stage.getBoundingClientRect();
    if (height <= 0 || width <= 0) return;

    const bar = document.querySelector<HTMLElement>(".header__inner");
    const headerBottom = bar ? bar.getBoundingClientRect().bottom : 0;

    const panel = document.querySelector<HTMLElement>('.pov__panel[data-on="true"]');
    const copy = panel?.getBoundingClientRect();

    /* Wide layouts put the copy in a column beside the body, so the
       body keeps the full height and slides sideways instead. */
    const beside = !copy || copy.width < width * 0.62;

    /* Breathing room at both ends of the band. Generous, because the
       body is a lit sphere with a glow around it: framing it flush
       against what is below reads as that thing cutting into it. */
    const gap = Math.min(46, height * 0.052);
    const top = Math.min(0.4, (headerBottom + gap) / height);

    let bottom = 1;
    if (!beside) {
      /* The copy is a soft ceiling: it has a scrim behind it, so a
         body may reach under it rather than shrink away to nothing. */
      const soft = copy ? (copy.top - gap) / height : 1;
      bottom = Math.max(Math.min(1, soft), top + MIN_BAND);
    }

    frame.current = {
      side: beside ? sideFor(width / Math.max(height, 1)) : 0,
      top,
      bottom,
    };
  }, []);

  /* Re-measure whenever the copy on screen changes shape: a new
     section, a different project, a language switch. */
  useEffect(() => {
    /* Two frames, not one: the first lets React commit the new phase,
       the second lets the grid settle with it — the projects stop
       adds a row and the image row changes shape with the project, so
       measuring a frame early reads the previous layout. */
    let second = 0;
    const first = requestAnimationFrame(() => {
      second = requestAnimationFrame(measure);
    });
    return () => {
      cancelAnimationFrame(first);
      cancelAnimationFrame(second);
    };
  }, [measure, webgl, view.phase, view.capability, view.project, t]);

  useEffect(() => {
    if (webgl !== true) return;

    const observer = new ResizeObserver(() => measure());
    const stage = sectionRef.current?.querySelector(".proto__stage");
    if (stage) observer.observe(stage);
    const bar = document.querySelector(".header__inner");
    if (bar) observer.observe(bar);
    document.querySelectorAll(".pov__panel").forEach((el) => observer.observe(el));

    window.addEventListener("resize", measure);
    window.addEventListener("orientationchange", measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
      window.removeEventListener("orientationchange", measure);
    };
  }, [measure, webgl]);

  /* Start at the top, then turn snapping on. Doing it in this order
     avoids the browser resolving a snap position against a document
     that is about to grow by twelve viewports. */
  useEffect(() => {
    if (webgl !== true) return;

    if ("scrollRestoration" in history) history.scrollRestoration = "manual";

    const root = document.documentElement;
    const previous = root.style.scrollBehavior;
    root.style.scrollBehavior = "auto";
    window.scrollTo(0, 0);

    const id = window.setTimeout(() => {
      window.scrollTo(0, 0);
      root.classList.add("snap-ready");
      root.style.scrollBehavior = previous;
    }, 120);

    return () => {
      window.clearTimeout(id);
      root.classList.remove("snap-ready");
    };
  }, [webgl]);

  /* --- scroll → progress. The only input to the whole journey. --- */
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

      const state = { p: 0 };
      const tween = gsap.to(state, {
        p: 1,
        ease: "none",
        scrollTrigger: {
          trigger: section,
          start: "top top",
          end: "bottom bottom",
          scrub: true,
          invalidateOnRefresh: true,
        },
        onUpdate: () => {
          progress.current = state.p;
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
  }, []);

  /**
   * Runs every frame. Numbers go straight to the DOM; React state is
   * only touched when a discrete value actually changes, so the copy
   * swapping never costs a re-render per frame.
   */
  const handleReadout = useCallback((r: ProtoReadout) => {
    if (progressOut.current) progressOut.current.textContent = r.progress.toFixed(3);
    if (xOut.current) xOut.current.textContent = r.x.toFixed(2);
    if (yOut.current) yOut.current.textContent = r.y.toFixed(2);
    if (zOut.current) zOut.current.textContent = r.z.toFixed(2);
    if (bandOut.current) {
      bandOut.current.textContent = `${r.bandTop.toFixed(3)} → ${r.bandBottom.toFixed(3)}`;
    }

    // the crossing: driven by real distance to the horizon, not by a
    // progress threshold, so the darkness cannot drift out of sync
    if (blackout.current) blackout.current.style.opacity = r.inside.toFixed(3);

    const nextHint = r.progress < 0.012 ? "start" : r.progress > 0.985 ? "end" : "more";
    if (nextHint !== hintRef.current) {
      hintRef.current = nextHint;
      setHint(nextHint);
    }

    const stop = stopAt(r.progress);

    // leaving the projects stretch releases a clicked marker
    if (stop.phase !== "projects" && pickedRef.current !== null) {
      pickedRef.current = null;
      setPicked(null);
    }

    const next = {
      phase: stop.phase as Phase,
      capability: Math.min(countsRef.current.capabilities - 1, stop.capability),
      project: pickedRef.current ?? Math.min(countsRef.current.projects - 1, stop.project),
    };
    const prev = viewRef.current;
    if (
      next.phase !== prev.phase ||
      next.capability !== prev.capability ||
      next.project !== prev.project
    ) {
      viewRef.current = next;
      setView(next);
    }
  }, []);

  const selectProject = useCallback((index: number) => {
    pickedRef.current = index;
    setPicked(index);
    setView((current) => ({ ...current, project: index }));
    viewRef.current = { ...viewRef.current, project: index };
  }, []);

  return (
    <section
      ref={sectionRef}
      className="proto"
      /* The section is one viewport per stop plus the gaps between
         them. Declared from the path so the page cannot get out of
         step with it. */
      style={{ "--gaps": STOP_COUNT - 1 } as React.CSSProperties}
    >
      <div className="proto__stage">
        {webgl === false ? (
          <div className="proto__error">
            <p className="mono">WebGL</p>
            <p>
              Este navegador não consegue desenhar a cena. Ligue a aceleração de hardware em{" "}
              <code>chrome://settings/system</code>, ou veja <code>chrome://gpu</code> para o
              motivo do bloqueio.
            </p>
          </div>
        ) : null}

        {webgl ? (
          <Canvas
            className="proto__canvas"
            camera={{ position: [0, 0, 15], fov: 50, near: 0.1, far: 600 }}
            gl={{ antialias: true, powerPreference: "high-performance" }}
          >
            <color attach="background" args={["#05070a"]} />
            <ProtoScene
              target={progress}
              frame={frame}
              onReadout={handleReadout}
              projectCount={projectCount}
              selectedProject={picked ?? view.project}
              onSelectProject={selectProject}
            />
          </Canvas>
        ) : null}

        {/* inside the event horizon there is nothing to see */}
        <div ref={blackout} className="proto__blackout" aria-hidden="true" />

        <ProtoOverlay
          phase={view.phase}
          capability={view.capability}
          project={view.project}
          hint={hint}
        />

        {/* The camera readout. Kept, because it is the only way to see
            what the journey is actually doing — but off unless ?debug
            is on the URL, so visitors do not get a telemetry panel. */}
        {debug ? (
          <div className="proto__hud mono">
            <div>
              SCROLL PROGRESS: <span ref={progressOut}>0.000</span>
            </div>
            <div>
              CAMERA X: <span ref={xOut}>0.00</span>
            </div>
            <div>
              CAMERA Y: <span ref={yOut}>0.00</span>
            </div>
            <div>
              CAMERA Z: <span ref={zOut}>0.00</span>
            </div>
            <div>
              BAND: <span ref={bandOut}>—</span>
            </div>
          </div>
        ) : null}
      </div>

      {/* One snap target per stop. `scroll-snap-stop: always` is what
          turns a scroll gesture into exactly one section. */}
      <div className="proto__steps" aria-hidden="true">
        {Array.from({ length: STOP_COUNT }, (_, i) => (
          <div key={i} className="proto__step" />
        ))}
      </div>

      {ANCHORS.map(([id, step]) => (
        <span
          key={id}
          id={id}
          className="proto__anchor"
          style={{ top: `calc(${step} * var(--step))` }}
        />
      ))}
    </section>
  );
}
