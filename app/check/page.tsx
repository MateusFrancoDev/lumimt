import type { Metadata } from "next";

import { Diagnostics } from "@/components/diagnostics/Diagnostics";

export const metadata: Metadata = {
  title: "Diagnostic",
  robots: { index: false, follow: false },
};

/**
 * Not part of the site: a tool for whoever is running it. Both of the
 * reasons the journey can decline to start are invisible on the real
 * page, which makes "it does not work on my machine" impossible to
 * answer remotely. This answers it.
 */
export default function CheckPage() {
  return (
    <main id="main" className="check">
      <div className="shell check__inner">
        <p className="mono dim">Lumimt — diagnostic</p>
        <h1 className="check__title">What this browser gets</h1>
        <Diagnostics />
        <a className="link link--sm check__back" href="/">
          <span className="link__label mono">Back to the site</span>
          <span className="link__track" aria-hidden="true" />
          <span className="link__arrow" aria-hidden="true">↗</span>
        </a>
      </div>
    </main>
  );
}
