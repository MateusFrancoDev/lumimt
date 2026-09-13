"use client";

import { useSyncExternalStore } from "react";

import { LightCurve } from "@/components/ui/LightCurve";
import { LumimtLink } from "@/components/ui/LumimtLink";
import { capabilities, projects, site } from "@/lib/content";
import { getServerSnapshot, getSnapshot, subscribe } from "@/lib/journeyStore";

/**
 * Everything readable is HTML sitting above the canvas — never a
 * texture inside it. That keeps the type crisp at any DPI, keeps the
 * copy indexable and selectable, and lets the whole site still be read
 * top to bottom by a screen reader as an ordinary document.
 *
 * Panels stay in the DOM at all times and are revealed by chapter, so
 * nothing here is created or destroyed while the camera is moving.
 */
export function JourneyOverlay() {
  const { chapter, moon, project } = useSyncExternalStore(
    subscribe,
    getSnapshot,
    getServerSnapshot,
  );

  const activeCapability = capabilities[moon] ?? capabilities[0];
  const activeProject = projects[project] ?? projects[0];

  return (
    <div className="journey__overlay" data-chapter={chapter}>
      <div className="journey__rail" aria-hidden="true">
        {["about", "capabilities", "work", "contact"].map((id) => (
          <span key={id} className="journey__rail-node" data-on={chapter === id} />
        ))}
      </div>

      <div className="shell journey__frame">
        {/* ---------- 00 entry ---------- */}
        <section className="panel panel--entry">
          <p className="journey__signal mono">
            <span className="signal" aria-hidden="true" />
            Signal detected
          </p>
          <h1 className="journey__display">
            Beyond
            <br />
            the known.
          </h1>
          <div className="journey__foot">
            <div className="hero__meta mono">
              <span>{site.role}</span>
              <span>
                {site.city} — {site.country}
              </span>
              <span>Est. {site.year}</span>
            </div>
            <p className="hero__desc">
              We design and build digital products for what comes next.
            </p>
          </div>
          <span className="cue mono-sm">
            <span className="cue__track" aria-hidden="true" />
            Scroll to travel
          </span>
        </section>

        {/* ---------- 01 approach ---------- */}
        <section className="panel panel--approach">
          <p className="mono dim">Signal 001 — source unresolved</p>
        </section>

        {/* ---------- 03 arrival ---------- */}
        <section className="panel panel--arrival">
          <p className="journey__signal mono">
            <span className="signal" aria-hidden="true" />
            System detected
          </p>
          <p className="mono dim">Lumimt / 001</p>
        </section>

        {/* ---------- 04 about ---------- */}
        <section className="panel panel--about" id="about-panel">
          <p className="mono journey__marker">
            <span className="journey__marker-id">01</span> Lumimt
          </p>
          <h2 className="journey__statement">Every product starts as a signal.</h2>
          <div className="journey__copy">
            <p>
              Long before there is a product there is a disturbance. A process that costs too
              much, a number nobody can explain, an idea with no shape yet. Faint, easy to
              ignore, and the only evidence that something is there.
            </p>
            <p>
              Lumimt is a software house. We design and engineer digital products for companies
              that have outgrown off-the-shelf software — and we stay accountable from the first
              conversation to the version running in production.
            </p>
          </div>
        </section>

        {/* ---------- 05 capabilities ---------- */}
        <section className="panel panel--capabilities">
          <p className="mono journey__marker">
            <span className="journey__marker-id">02</span> Capabilities
          </p>
          <p className="mono dim journey__sub">
            Signal 02-{String.fromCharCode(65 + moon)}
          </p>
          <h2 className="journey__title">{activeCapability.title}</h2>
          <p className="journey__lead">{activeCapability.description}</p>
          <ol className="journey__index mono-sm">
            {capabilities.map((capability, index) => (
              <li key={capability.id} data-on={index === moon}>
                <span>{capability.id}</span>
                {capability.title}
              </li>
            ))}
          </ol>
        </section>

        {/* ---------- 06 work ---------- */}
        <section className="panel panel--work">
          <p className="mono journey__marker">
            <span className="journey__marker-id">03</span> Work
          </p>
          <div className="journey__project">
            <div>
              <p className="mono dim journey__sub">{activeProject.id}</p>
              <h2 className="journey__title">{activeProject.name}</h2>
              <div className="work__meta mono-sm">
                <span>{activeProject.sector}</span>
                <span>{activeProject.kind}</span>
                <span>{activeProject.year}</span>
              </div>
              <p className="journey__lead">{activeProject.description}</p>
              <div className="work__meta mono-sm">
                {activeProject.stack.map((item) => (
                  <span key={item}>{item}</span>
                ))}
              </div>
            </div>
            <div className="journey__curve">
              <LightCurve
                shape={activeProject.curve}
                label={activeProject.name}
                left="Light curve"
                right={`${activeProject.name} — ${activeProject.year}`}
              />
            </div>
          </div>
        </section>

        {/* ---------- 07 contact ---------- */}
        <section className="panel panel--contact">
          <p className="mono journey__marker">
            <span className="journey__marker-id">04</span> Contact
          </p>
          <h2 className="journey__statement">Let&rsquo;s build what&rsquo;s next.</h2>
          <p className="journey__lead">
            You came all this way on a signal. Send us yours — the problem, the constraint, or
            the half-formed idea — and we will come back with what it could become.
          </p>
          <div className="journey__cta">
            <LumimtLink label="Send a signal" href={`mailto:${site.email}?subject=New%20signal`} />
            <a className="mono dim journey__email" href={`mailto:${site.email}`}>
              {site.email}
            </a>
          </div>
        </section>
      </div>
    </div>
  );
}
