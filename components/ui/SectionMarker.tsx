import { Reveal } from "@/components/ui/Reveal";

interface SectionMarkerProps {
  id: string;
  label: string;
}

/**
 * 01 / ABOUT — the technical register of the brand, used sparingly so
 * it stays a signature instead of turning into cockpit dressing.
 *
 * The light at the head of the rule is the destination itself: it
 * resolves as you arrive, the same way the star does in the hero.
 */
export function SectionMarker({ id, label }: SectionMarkerProps) {
  return (
    <Reveal className="marker mono">
      <span className="marker__body" aria-hidden="true" />
      <span className="marker__id">{id}</span>
      <span className="marker__label">{label}</span>
      <span className="marker__rule" aria-hidden="true" />
    </Reveal>
  );
}
