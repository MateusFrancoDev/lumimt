"use client";

import { useLanguage } from "@/components/i18n/LanguageProvider";

/** Shows the language you would switch TO, which is what people look for. */
export function LanguageToggle() {
  const { locale, t, toggle } = useLanguage();

  return (
    <button
      type="button"
      className="lang mono"
      onClick={toggle}
      aria-label={t.common.switchTo}
      title={t.common.switchTo}
    >
      <span className="lang__on">{locale === "pt" ? "PT" : "EN"}</span>
      <span className="lang__sep" aria-hidden="true" />
      <span className="lang__off">{locale === "pt" ? "EN" : "PT"}</span>
    </button>
  );
}
