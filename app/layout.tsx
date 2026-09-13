import type { Metadata, Viewport } from "next";
import { Archivo, IBM_Plex_Mono } from "next/font/google";

import { SiteFooter } from "@/components/chrome/SiteFooter";
import { SiteHeader } from "@/components/chrome/SiteHeader";
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
        {/* Without JS the approach cannot run, so everything it would
            have revealed is simply shown. */}
        <noscript>
          <style>{`
            .hero { height: 100svh; }
            .lens { display: none; }
            .hero__stage { --sky: 1; --emerge: 1; --star-d: 26vmin; --halo: 0.9; }
            .layer, .reveal { opacity: 1 !important; translate: none !important; }
            .words span { opacity: 1 !important; translate: none !important; }
            .hero__headline { clip-path: none !important; }
            .work__visual { opacity: 1 !important; clip-path: none !important; }
          `}</style>
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
        </LanguageProvider>
      </body>
    </html>
  );
}
