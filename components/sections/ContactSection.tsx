import { LumimtLink } from "@/components/ui/LumimtLink";
import { Reveal } from "@/components/ui/Reveal";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { site } from "@/lib/content";

export function ContactSection() {
  return (
    <section id="contact" className="section">
      <div className="shell">
        <SectionMarker id="04" label="Contact" />

        <div className="contact-grid">
          <Reveal className="reveal">
            <h2 className="statement">Tell us what you cannot see yet.</h2>
            <p className="lead" style={{ marginTop: "clamp(1.5rem, 4vw, 2.5rem)", maxWidth: "48ch" }}>
              Send the problem, the constraint, or the half-formed idea. We come back with what it
              could become, how it would be built, and what it would take.
            </p>
          </Reveal>

          <Reveal className="reveal contact__aside" delay={160}>
            <div className="contact__field">
              <span className="mono-sm faint">Direct</span>
              <a className="contact__value" href={`mailto:${site.email}`}>
                {site.email}
              </a>
            </div>
            <div className="contact__field">
              <span className="mono-sm faint">Based in</span>
              <span className="contact__value">
                {site.city} — {site.country}
              </span>
            </div>
            <div className="contact__field">
              <span className="mono-sm faint">Availability</span>
              <span className="contact__value">Taking new projects — {site.year}</span>
            </div>
          </Reveal>
        </div>

        <Reveal className="reveal contact__cta">
          <LumimtLink
            label="Start a project"
            href={`mailto:${site.email}?subject=New%20signal`}
          />
        </Reveal>
      </div>
    </section>
  );
}
