"use client";

import { useCallback, useEffect, useRef, useState, type FormEvent } from "react";

import { useLanguage } from "@/components/i18n/LanguageProvider";
import { site } from "@/lib/content";

export type Phase = "signal" | "about" | "capabilities" | "projects" | "contact";

interface ProtoOverlayProps {
  phase: Phase;
  capability: number;
  project: number;
  /**
   * The scroll invitation. "start" is the loud one, on the first
   * frame, where nothing else says the page is twelve viewports deep;
   * "more" is the quiet mark that keeps saying there is further to
   * go; "end" is the last stop, where there is not.
   */
  hint: "start" | "more" | "end";
}

const EMAIL = /^[^\s@]+@[^\s@]+\.[^\s@]{2,}$/;

/** The address as a person would say it, for the link's label. */
function domainOf(href: string) {
  try {
    return new URL(href).host.replace(/^www\./, "");
  } catch {
    return href;
  }
}

/**
 * Scroll snapping and a sticky stage do not survive a soft keyboard
 * opening: the viewport shrinks, every svh-based length changes, and
 * the page re-snaps to a different stop with the form half typed —
 * which is exactly what made sending a message unusable on a phone.
 * Snapping is therefore suspended for as long as a field is focused.
 */
function useSnapPause() {
  const held = useRef(0);

  const pause = useCallback(() => {
    held.current += 1;
    document.documentElement.classList.add("form-focus");
  }, []);

  const resume = useCallback(() => {
    held.current = Math.max(0, held.current - 1);
    if (held.current === 0) document.documentElement.classList.remove("form-focus");
  }, []);

  useEffect(() => () => document.documentElement.classList.remove("form-focus"), []);

  return { pause, resume };
}

type SendState = "idle" | "sending" | "sent";

/** Sent through Formspree's JSON endpoint with a plain fetch rather
 *  than its React hook: the form already owns its validation, and the
 *  messages a visitor reads have to come from the dictionary, not from
 *  a service that only speaks English. The address stays on screen and
 *  copyable, so a failed request is never a dead end. */
function ContactForm() {
  const { t } = useLanguage();
  const [error, setError] = useState("");
  const [state, setState] = useState<SendState>("idle");
  const [copied, setCopied] = useState(false);
  const { pause, resume } = useSnapPause();

  const onSubmit = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    if (state === "sending") return;

    const form = event.currentTarget;
    const data = new FormData(form);
    const name = String(data.get("name") ?? "").trim();
    const from = String(data.get("email") ?? "").trim();
    const idea = String(data.get("message") ?? "").trim();

    if (!idea) {
      setError(t.contact.missing);
      return;
    }
    // without a mail client in the loop, this is the only way back
    if (!from) {
      setError(t.contact.missingEmail);
      return;
    }
    if (!EMAIL.test(from)) {
      setError(t.contact.invalidEmail);
      return;
    }
    setError("");
    setState("sending");

    data.set("name", name);
    data.set("email", from);
    data.set("message", idea);
    data.set("_subject", `${t.contact.send} — Lumimt${name ? ` — ${name}` : ""}`);

    try {
      const response = await fetch(site.formEndpoint, {
        method: "POST",
        body: data,
        headers: { Accept: "application/json" },
      });

      if (response.ok) {
        form.reset();
        setState("sent");
        return;
      }

      const result: { errors?: { field?: string }[] } = await response.json().catch(() => ({}));
      setError(
        result.errors?.some((entry) => entry.field === "email")
          ? t.contact.invalidEmail
          : t.contact.failed,
      );
    } catch {
      setError(t.contact.failed);
    }
    setState("idle");
  };

  const copy = async () => {
    try {
      await navigator.clipboard.writeText(site.email);
      setCopied(true);
      window.setTimeout(() => setCopied(false), 2400);
    } catch {
      // clipboard blocked: the address is on screen either way
    }
  };

  return (
    <form
      className="pov__form"
      action={site.formEndpoint}
      method="POST"
      onSubmit={onSubmit}
      aria-busy={state === "sending"}
      noValidate
    >
      {/* Formspree's honeypot: invisible to people, filled in by bots */}
      <input
        type="text"
        name="_gotcha"
        tabIndex={-1}
        autoComplete="off"
        aria-hidden="true"
        className="pov__trap"
      />

      <div className="pov__row">
        <label className="pov__field">
          <span className="mono-sm">{t.contact.name}</span>
          <input name="name" type="text" autoComplete="name" onFocus={pause} onBlur={resume} />
        </label>
        <label className="pov__field">
          <span className="mono-sm">{t.contact.email}</span>
          <input
            name="email"
            type="email"
            autoComplete="email"
            inputMode="email"
            required
            onFocus={pause}
            onBlur={resume}
          />
        </label>
      </div>

      <label className="pov__field">
        <span className="mono-sm">{t.contact.message}</span>
        <textarea
          name="message"
          rows={3}
          placeholder={t.contact.placeholder}
          required
          onFocus={pause}
          onBlur={resume}
        />
      </label>

      {error ? (
        <p className="pov__error mono-sm" role="alert">
          {error}
        </p>
      ) : null}

      <div className="pov__send">
        <button type="submit" className="link" disabled={state === "sending"}>
          <span className="link__label mono">
            {state === "sending" ? `${t.contact.sending}…` : t.contact.send}
          </span>
          <span className="link__track" aria-hidden="true" />
          <span className="link__arrow" aria-hidden="true">
            ↗
          </span>
        </button>
        <span className="mono-sm faint">{t.contact.note}</span>
      </div>

      {state === "sent" ? (
        <p className="pov__sent mono-sm" role="status">
          {t.contact.sent}
        </p>
      ) : null}

      <div className="pov__direct mono-sm">
        <span className="faint">{t.contact.direct}</span>
        <a href={`mailto:${site.email}`}>{site.email}</a>
        <button type="button" className="pov__copy" onClick={copy}>
          {copied ? t.common.copied : t.common.copy}
        </button>
      </div>
    </form>
  );
}

/**
 * The readable layer. Plain HTML above the canvas — never a texture
 * inside it — so the copy stays crisp, selectable and indexable, and
 * every string comes from the dictionary rather than the markup.
 */
export function ProtoOverlay({ phase, capability, project, hint }: ProtoOverlayProps) {
  const { t } = useLanguage();

  return (
    <div className="pov" data-phase={phase} data-hint={hint}>
      {/* The room a planet is allowed to occupy at this width.

          Empty on purpose. The camera measures this element and frames
          its body into it, which is how the scene ends up answering to
          the layout instead of to the viewport — and how a planet ends
          up belonging to its section rather than floating over the
          page. See `.pov__band` in proto.css. */}
      <div className="pov__band" aria-hidden="true" />

      {/* ---------- 00 ---------- */}
      <section className="pov__panel pov__panel--signal" data-on={phase === "signal"}>
        <p className="pov__marker mono">
          <span className="pov__id">00</span> {t.signal.marker}
        </p>
        <h1 className="pov__display">
          {t.signal.headline[0]}
          <br />
          {t.signal.headline[1]}
        </h1>
        <div className="pov__meta mono">
          <span>{t.signal.role}</span>
          <span>{t.signal.place}</span>
          <span>{t.signal.since}</span>
        </div>
        <p className="pov__lead">{t.signal.lead}</p>
      </section>

      {/* ---------- 01 ---------- */}
      <section className="pov__panel pov__panel--about" data-on={phase === "about"}>
        <p className="pov__marker mono">
          <span className="pov__id">01</span> {t.about.marker}
        </p>
        <h2 className="pov__statement">{t.about.statement}</h2>
        {t.about.paragraphs.map((paragraph) => (
          <p className="pov__lead" key={paragraph.slice(0, 24)}>
            {paragraph}
          </p>
        ))}
      </section>

      {/* ---------- 02 ---------- */}
      <section className="pov__panel pov__panel--capabilities" data-on={phase === "capabilities"}>
        <p className="pov__marker mono">
          <span className="pov__id">02</span> {t.capabilities.marker}
        </p>
        {/* Every era is rendered, one is shown. The panel is then as
            tall as the longest of them whichever is on screen, so the
            band below it does not move as the scroll walks the list. */}
        <div className="pov__slides">
          {t.capabilities.items.map((item, index) => (
            <div
              className="pov__slide"
              key={item.id}
              data-on={index === capability}
              inert={index !== capability || undefined}
            >
              <p className="pov__sub mono">{item.era}</p>
              <p className="pov__note">{item.note}</p>
              <h2 className="pov__title">{item.title}</h2>
              <p className="pov__lead">{item.description}</p>
            </div>
          ))}
        </div>
        <ol className="pov__index mono-sm">
          {t.capabilities.items.map((item, index) => (
            <li key={item.id} data-on={index === capability}>
              <span>{item.id}</span>
              {item.title}
            </li>
          ))}
        </ol>
      </section>

      {/* ---------- 03 ---------- */}
      <section className="pov__panel pov__panel--projects" data-on={phase === "projects"}>
        <p className="pov__marker mono">
          <span className="pov__id">03</span> {t.work.marker}
        </p>
        {/* The three projects are stacked in one cell rather than
            swapped in and out. Their descriptions differ by a line,
            and rendered one at a time that difference became the
            height of the panel, the size of the band under it and the
            position of the planet — which is why the last project's
            planet used to sit higher than the other two. */}
        <div className="pov__slides">
          {t.work.items.map((item, index) => (
            <div
              className="pov__slide"
              key={item.id}
              data-on={index === project}
              inert={index !== project || undefined}
            >
              <p className="pov__sub mono">
                {[item.id, item.sector, item.kind, item.year].filter(Boolean).join(" / ")}
              </p>
              <h2 className="pov__title">{item.name}</h2>
              <p className="pov__lead">{item.description}</p>
              <div className="pov__stack mono-sm">
                {item.stack.map((entry) => (
                  <span key={entry}>{entry}</span>
                ))}
              </div>

              {/* The project itself, live — better evidence than a
                  picture of it, and it leaves the scene to the scene. */}
              <a
                className="link link--sm pov__visit"
                href={item.href}
                target="_blank"
                rel="noopener noreferrer"
                title={t.work.visit}
              >
                <span className="link__label mono">{domainOf(item.href)}</span>
                <span className="link__track" aria-hidden="true" />
                <span className="link__arrow" aria-hidden="true">
                  ↗
                </span>
              </a>
            </div>
          ))}
        </div>

        <p className="pov__hint mono-sm">{t.work.hint}</p>
      </section>

      {/* ---------- 04 ---------- */}
      <section className="pov__panel pov__panel--contact" data-on={phase === "contact"}>
        <p className="pov__marker mono">
          <span className="pov__id">04</span> {t.contact.marker}
        </p>
        <h2 className="pov__statement">{t.contact.statement}</h2>
        <p className="pov__lead">{t.contact.lead}</p>
        <ContactForm />
      </section>

      {/* ----- the invitation to scroll -----
          The journey has no other affordance: nothing on the first
          frame says the page is twelve viewports deep. This is the
          only thing that does, and it leaves as soon as it is obeyed. */}
      <div className="pov__scroll" aria-hidden={hint !== "start"}>
        <span className="pov__scroll-label mono-sm">{t.common.scroll}</span>
        <span className="pov__rail" aria-hidden="true">
          <span className="pov__pulse" />
        </span>
      </div>

    </div>
  );
}
