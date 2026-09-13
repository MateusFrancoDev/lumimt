import { LightCurve } from "@/components/ui/LightCurve";
import { OrbitRing } from "@/components/ui/OrbitRing";
import { Reveal } from "@/components/ui/Reveal";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { projects } from "@/lib/content";

/**
 * An index, not a portfolio grid (item 18). Everything informational
 * — sector, discipline, year, stack — is always visible; hover only
 * decides which row keeps the light and reveals its curve.
 */
export function WorkSection() {
  return (
    <section id="work" className="section">
      <div className="shell">
        <SectionMarker id="03" label="Work" />

        <OrbitRing nodes={projects.map(({ id, name }) => ({ id, name }))} />

        <div className="work">
          {projects.map((project, index) => (
            <Reveal className="work__row reveal" key={project.id} delay={index * 90}>
              <span className="work__id mono">{project.id}</span>

              <div>
                <h3 className="work__name">{project.name}</h3>
                <div className="work__meta mono-sm">
                  <span>{project.sector}</span>
                  <span>{project.kind}</span>
                  <span>{project.year}</span>
                </div>
                <p className="work__desc">{project.description}</p>
                <div className="work__meta mono-sm">
                  {project.stack.map((item) => (
                    <span key={item}>{item}</span>
                  ))}
                </div>
              </div>

              <div className="work__visual">
                <LightCurve
                  shape={project.curve}
                  label={project.name}
                  left="Light curve"
                  right={`${project.name} — ${project.year}`}
                />
              </div>
            </Reveal>
          ))}
        </div>
      </div>
    </section>
  );
}
