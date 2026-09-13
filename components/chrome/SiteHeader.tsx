"use client";

import { useCallback, useEffect, useRef, useState } from "react";

import { useScrolledPast } from "@/hooks/useScrolledPast";
import { LanguageToggle } from "@/components/i18n/LanguageToggle";
import { useLanguage } from "@/components/i18n/LanguageProvider";
import { navItems, site } from "@/lib/content";

/**
 * One menu, at every width.
 *
 * The header used to carry a horizontal nav on desktop and a separate
 * index on phones, which meant two behaviours to keep in step and only
 * one of them ever reachable. There is now a single fullscreen overlay
 * and a single way in, so what is tested on a phone is what ships on a
 * monitor.
 */
export function SiteHeader() {
  const scrolled = useScrolledPast(40);
  const [open, setOpen] = useState(false);
  const { t } = useLanguage();

  const panel = useRef<HTMLDivElement>(null);
  const trigger = useRef<HTMLButtonElement>(null);

  const labels = [t.nav.about, t.nav.capabilities, t.nav.work, t.nav.contact];

  const close = useCallback(() => setOpen(false), []);

  useEffect(() => {
    if (!open) return;

    /* The journey scrolls the document element and it scroll-snaps.
       Hiding overflow on <body> left both running underneath the open
       menu; the lock has to land on <html>. */
    const root = document.documentElement;
    root.classList.add("nav-locked");

    const opener = trigger.current;
    panel.current?.querySelector<HTMLElement>("a, button")?.focus();

    const onKey = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setOpen(false);
        return;
      }
      if (event.key !== "Tab") return;

      // a fullscreen dialog that lets focus wander behind it is a
      // dialog only for people using a mouse
      const focusable = panel.current?.querySelectorAll<HTMLElement>("a[href], button");
      if (!focusable || focusable.length === 0) return;
      const first = focusable[0];
      const last = focusable[focusable.length - 1];
      if (event.shiftKey && document.activeElement === first) {
        event.preventDefault();
        last.focus();
      } else if (!event.shiftKey && document.activeElement === last) {
        event.preventDefault();
        first.focus();
      }
    };

    document.addEventListener("keydown", onKey);

    return () => {
      root.classList.remove("nav-locked");
      document.removeEventListener("keydown", onKey);
      opener?.focus();
    };
  }, [open]);

  /**
   * The journey is one scroll-snapping section, so a native hash jump
   * lands wherever snapping decides afterwards. Scrolling to the
   * anchor's measured offset ourselves — after the menu has closed and
   * the scroll lock is off — is what makes every entry land on its own
   * stop.
   */
  const goTo = (href: string) => (event: React.MouseEvent<HTMLAnchorElement>) => {
    if (!href.startsWith("#")) return;
    event.preventDefault();
    setOpen(false);

    const id = href.slice(1);
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        const target = id === "top" ? null : document.getElementById(id);
        const top = target ? target.getBoundingClientRect().top + window.scrollY : 0;
        window.scrollTo({ top, behavior: "auto" });
        history.replaceState(null, "", id === "top" ? location.pathname : href);
      });
    });
  };

  /* The overlay is a sibling of the header, not a child of it.
     `backdrop-filter` on the scrolled header turns that header into
     the containing block for any `position: fixed` descendant — so
     the moment you scrolled far enough for the header to go solid,
     the menu stopped filling the viewport and collapsed into the
     header's own 98px strip, with the top bar sitting on top of its
     links. That was the bug. Outside the header it cannot recur. */
  return (
    <>
      <header className="header" data-scrolled={scrolled} data-open={open}>
        <div className="shell header__inner">
          <a className="wordmark" href="#top" aria-label={t.common.toTop} onClick={goTo("#top")}>
            {site.name}
            <span className="wordmark__signal" aria-hidden="true" />
          </a>

          {/* Desktop keeps its horizontal index; the fullscreen overlay
              is the phone's menu and only the phone's. */}
          <nav className="nav" aria-label={t.common.sections}>
            {navItems.map((item, index) => (
              <a
                className="nav__item mono"
                key={item.id}
                href={item.href}
                onClick={goTo(item.href)}
              >
                <span className="nav__num">{item.id}</span>
                {labels[index] ?? item.label}
              </a>
            ))}
            <LanguageToggle />
          </nav>

          <div className="header__tools">
            <LanguageToggle />

            <button
              ref={trigger}
              type="button"
              className="menu-btn mono"
              data-open={open}
              aria-expanded={open}
              aria-controls="site-menu"
              onClick={() => setOpen((value) => !value)}
            >
              <span className="menu-btn__label">{open ? t.common.close : t.common.index}</span>
              <span className="menu-btn__glyph" aria-hidden="true">
                <span />
                <span />
              </span>
            </button>
          </div>
        </div>
      </header>

      <div
        id="site-menu"
        ref={panel}
        className="menu"
        data-open={open}
        role="dialog"
        aria-modal={open || undefined}
        aria-label={t.common.sections}
        inert={!open || undefined}
      >
        <div className="shell menu__inner">
          <nav aria-label={t.common.sections}>
            <ul className="menu__list">
              {navItems.map((item, index) => (
                <li key={item.id} style={{ "--i": index } as React.CSSProperties}>
                  <a className="menu__link" href={item.href} onClick={goTo(item.href)}>
                    <span className="menu__num mono-sm">{item.id}</span>
                    <span className="menu__word">{labels[index] ?? item.label}</span>
                    <span className="menu__rule" aria-hidden="true" />
                  </a>
                </li>
              ))}
            </ul>
          </nav>

          <div className="menu__foot mono-sm">
            <span>{t.common.place}</span>
            <a href={`mailto:${site.email}`} onClick={close}>
              {site.email}
            </a>
            <span className="faint">{site.coordinates}</span>
          </div>
        </div>
      </div>
    </>
  );
}
