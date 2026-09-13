import { HeroStage } from "@/components/signal/HeroStage";
import { LensField } from "@/components/signal/LensField";
import { StarField } from "@/components/signal/StarField";
import { LumimtLink } from "@/components/ui/LumimtLink";
import { site } from "@/lib/content";

export function Hero() {
  return (
    <HeroStage>
      {/* The approach: light bent around something that cannot be seen. */}
      <LensField />

      {/* The far side. */}
      <div className="hero__glow" aria-hidden="true" />
      <StarField />

      {/* The star, its halo, and the body that only becomes visible
          by crossing in front of it. */}
      <div className="system" aria-hidden="true">
        <div className="star__halo" />
        <div className="star" />
        <div className="transit" />
      </div>

      <div className="hero__scrim" aria-hidden="true" />

      <div className="shell hero__frame">
        <div className="hero__center">
          <p className="hero__signal mono layer layer--signal">
            <span className="signal" aria-hidden="true" />
            Signal detected
          </p>
          <h1 className="hero__headline">
            Beyond
            <br />
            the known.
          </h1>
        </div>

        <div className="hero__foot">
          <div className="hero__meta mono layer layer--meta">
            <span>{site.role}</span>
            <span>
              {site.city} — {site.country}
            </span>
            <span>Est. {site.year}</span>
          </div>

          <p className="hero__desc layer layer--reveal">
            We design and build digital products for what comes next.
          </p>

          <div className="hero__cta-row">
            <span className="layer layer--reveal">
              <LumimtLink label="Start a project" href="#contact" />
            </span>
            <span className="cue mono-sm layer layer--cue">
              <span className="cue__track" aria-hidden="true" />
              Scroll
            </span>
          </div>
        </div>
      </div>
    </HeroStage>
  );
}
