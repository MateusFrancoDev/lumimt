import { Reveal } from "@/components/ui/Reveal";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { methodSteps } from "@/lib/content";

export function AboutSection() {
  return (
    <section id="about" className="section">
      <div className="shell">
        <SectionMarker id="01" label="About" />

        <div className="about-grid">
          <Reveal className="reveal">
            <h2 className="statement">A software house built around what is not obvious yet.</h2>
          </Reveal>

          <Reveal className="reveal" delay={160}>
            <div className="about-copy">
              <p>
                Lumimt designs and engineers digital products for companies that have outgrown
                off-the-shelf software. Web platforms, SaaS, internal systems, integrations and
                applied AI — built as <strong>products</strong>, not as deliverables.
              </p>
              <p>
                We work end to end: understanding the problem, designing the architecture and the
                experience, writing the code, shipping it, and evolving it once it is in real
                hands. One team, accountable from the first conversation to the version running in
                production.
              </p>
              <p>
                The method is borrowed from astronomy. You rarely observe the thing itself. You
                observe what it does to the light around it — and then you build the instrument
                that proves it.
              </p>
            </div>
          </Reveal>
        </div>

        <Reveal>
          <ol className="chain">
            {methodSteps.map((step, index) => (
              <li
                className="chain__step"
                key={step.id}
                style={{ "--i": index } as React.CSSProperties}
              >
                <span className="chain__id mono">{step.id}</span>
                <h3 className="chain__name mono">{step.name}</h3>
                <p className="chain__note">{step.note}</p>
              </li>
            ))}
          </ol>
        </Reveal>
      </div>
    </section>
  );
}
