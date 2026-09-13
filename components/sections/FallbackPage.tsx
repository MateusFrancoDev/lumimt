import { AboutSection } from "@/components/sections/AboutSection";
import { CapabilitiesSection } from "@/components/sections/CapabilitiesSection";
import { ContactSection } from "@/components/sections/ContactSection";
import { Hero } from "@/components/sections/Hero";
import { StatementSection } from "@/components/sections/StatementSection";
import { WorkSection } from "@/components/sections/WorkSection";
import { Trajectory } from "@/components/ui/Trajectory";

/**
 * The document version of the site.
 *
 * This is what the server renders, what a crawler reads, what someone
 * with JavaScript off gets, and what someone who asked for reduced
 * motion keeps. It is a complete site in its own right — not a
 * placeholder for the journey.
 */
export function FallbackPage() {
  return (
    <>
      <Trajectory />
      <main id="main" className="main">
        <Hero />
        <StatementSection />
        <AboutSection />
        <CapabilitiesSection />
        <WorkSection />
        <ContactSection />
      </main>
    </>
  );
}
