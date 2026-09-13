"use client";

import { useState } from "react";

import { Reveal } from "@/components/ui/Reveal";
import { SectionMarker } from "@/components/ui/SectionMarker";
import { capabilities } from "@/lib/content";

/**
 * An index that opens, not five cards (item 19). Opening is a click,
 * never a hover, so the information is reachable by touch and by
 * keyboard; hover only changes which row holds the light.
 */
export function CapabilitiesSection() {
  const [openId, setOpenId] = useState<string | null>(capabilities[0].id);

  return (
    <section id="capabilities" className="section">
      <div className="shell">
        <SectionMarker id="02" label="Capabilities" />

        <Reveal className="caps">
          {capabilities.map((capability) => {
            const open = openId === capability.id;
            const headId = `capability-${capability.id}`;
            const panelId = `capability-panel-${capability.id}`;

            return (
              <div className="cap" key={capability.id} data-open={open}>
                <h3>
                  <button
                    type="button"
                    id={headId}
                    className="cap__head"
                    aria-expanded={open}
                    aria-controls={panelId}
                    onClick={() => setOpenId(open ? null : capability.id)}
                  >
                    <span className="cap__id mono">{capability.id}</span>
                    <span className="cap__title">{capability.title}</span>
                    <span className="cap__mark" aria-hidden="true" />
                  </button>
                </h3>

                <div className="cap__body" id={panelId} role="region" aria-labelledby={headId}>
                  <div>
                    <div className="cap__inner">
                      <p className="cap__desc">{capability.description}</p>
                      <ul className="cap__tags mono-sm">
                        {capability.tags.map((tag) => (
                          <li key={tag}>{tag}</li>
                        ))}
                      </ul>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </Reveal>
      </div>
    </section>
  );
}
