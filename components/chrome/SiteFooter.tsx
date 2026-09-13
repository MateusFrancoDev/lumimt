import { DetectionLine } from "@/components/ui/Signal";
import { site } from "@/lib/content";

export function SiteFooter() {
  return (
    <footer className="footer">
      <div className="shell">
        <DetectionLine />
        <div className="footer__bar mono-sm">
          <span>
            {site.name} — {site.role}
          </span>
          <span>{site.coordinates}</span>
          <span>{site.tagline}</span>
          <span>© {site.year}</span>
        </div>
      </div>

      {/* The wordmark passes below the horizon: what is under the fold
          is not gone, only out of range. */}
      <span className="footer__mark" aria-hidden="true">
        {site.name}
      </span>
    </footer>
  );
}
