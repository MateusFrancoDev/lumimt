import { Reveal } from "@/components/ui/Reveal";
import { Words } from "@/components/ui/Words";

/**
 * The bridge (item 10): the metaphor is handed over to the business
 * in a single sentence, and from here the language turns concrete.
 */
export function StatementSection() {
  return (
    <section className="section">
      <div className="shell">
        <Reveal className="statement-block">
          <Words text="Every product starts as a *signal*." />
          <p className="lead reveal" style={{ transitionDelay: "420ms" }}>
            Long before there is a product there is a disturbance. A process that costs too
            much. A number nobody can explain. An idea with no shape yet. Faint, easy to
            ignore, and the only evidence that something is there.
          </p>
        </Reveal>
      </div>
    </section>
  );
}
