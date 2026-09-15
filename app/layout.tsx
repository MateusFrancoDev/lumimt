import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

import { SiteFooter } from "@/components/chrome/SiteFooter";
import { SiteHeader } from "@/components/chrome/SiteHeader";
import { ScrollJumpProbe } from "@/components/diagnostics/ScrollJumpProbe";
import { LanguageProvider } from "@/components/i18n/LanguageProvider";
import { SignalCursor } from "@/components/signal/SignalCursor";
import { site } from "@/lib/content";

import "./globals.css";

const sans = Archivo({
  subsets: ["latin"],
  display: "swap",
  variable: "--font-sans",
});

const mono = IBM_Plex_Mono({
  subsets: ["latin"],
  display: "swap",
  weight: ["400"],
  variable: "--font-mono",
});

export const metadata: Metadata = {
  metadataBase: new URL(site.url),
  title: {
    default: "Lumimt — Software House",
    template: "%s — Lumimt",
  },
  description: site.description,
  applicationName: site.name,
  keywords: [
    "software house",
    "product development",
    "SaaS",
    "web platforms",
    "AI",
    "São Paulo",
  ],
  openGraph: {
    type: "website",
    locale: "en_US",
    url: site.url,
    siteName: site.name,
    title: "Lumimt — Software House",
    description: site.description,
  },
  twitter: {
    card: "summary_large_image",
    title: "Lumimt — Software House",
    description: site.description,
  },
  alternates: { canonical: "/" },
};

export const viewport: Viewport = {
  themeColor: "#08090c",
  colorScheme: "dark",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR" className={`${sans.variable} ${mono.variable}`}>
      <body>
        <LanguageProvider>
        {/* The journey is a WebGL scene mounted on the client, so
            with scripting off there is nothing to reveal — the styles
            that used to be injected here belonged to an approach that
            no longer exists and referenced classes that are no longer
            rendered. What a visitor without JavaScript needs is the
            address, in words. */}
        <noscript>
          <div className="noscript">
            <p className="mono">Lumimt — Software House</p>
            <p>
              Esta página é uma cena 3D e precisa de JavaScript. Enquanto isso, fale
              com a gente em <a href="mailto:lumimt.tech@gmail.com">lumimt.tech@gmail.com</a>.
            </p>
          </div>
        </noscript>

          <a className="skip-link mono" href="#main">
            Ir para o conteúdo
          </a>

          <div className="ambient" aria-hidden="true" />
          <div className="grain" aria-hidden="true" />
          <SiteHeader />
          <SignalCursor />
          {children}
          <SiteFooter />
          {/* TEMPORARY: records the footer scroll jump, dev only */}
          {process.env.NODE_ENV === "development" ? <ScrollJumpProbe /> : null}
        </LanguageProvider>
      </body>
    </html>
  );
}
