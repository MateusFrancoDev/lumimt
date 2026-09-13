"use client";

import { useEffect, useState } from "react";

interface Report {
  webgl: boolean;
  webgl2: boolean;
  renderer: string;
  reducedMotion: boolean;
  optedIn: boolean;
  hardwareAccelerated: boolean;
  verdict: "journey" | "document";
  reason: string;
}

const OPT_IN_KEY = "lumimt:journey";

function inspect(): Report {
  let webgl = false;
  let webgl2 = false;
  let renderer = "—";

  try {
    const canvas = document.createElement("canvas");
    const gl2 = canvas.getContext("webgl2");
    const gl = gl2 ?? canvas.getContext("webgl");
    webgl2 = Boolean(gl2);
    webgl = Boolean(gl);

    if (gl) {
      const info = gl.getExtension("WEBGL_debug_renderer_info");
      renderer = info
        ? String(gl.getParameter(info.UNMASKED_RENDERER_WEBGL))
        : "available (name hidden by the browser)";
    }
  } catch {
    webgl = false;
  }

  const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

  let optedIn = false;
  try {
    optedIn = window.localStorage.getItem(OPT_IN_KEY) === "on";
  } catch {
    optedIn = false;
  }

  // Software renderers mean WebGL works but every frame is drawn on the
  // CPU: the journey will run, slowly. Worth naming rather than hiding.
  const hardwareAccelerated =
    webgl && !/swiftshader|software|llvmpipe|microsoft basic/i.test(renderer);

  let verdict: Report["verdict"] = "journey";
  let reason = "This browser can run the journey and has not asked for less motion.";

  if (!webgl) {
    verdict = "document";
    reason =
      "WebGL is unavailable, so there is nothing to draw the journey with. This is almost always hardware acceleration being switched off in the browser, or a graphics driver the browser has blocklisted.";
  } else if (reducedMotion && !optedIn) {
    verdict = "document";
    reason =
      "The operating system is asking for reduced motion, so the journey does not start on its own. It can still be entered deliberately.";
  } else if (reducedMotion && optedIn) {
    reason =
      "The operating system asks for reduced motion, but the journey was entered deliberately on this browser and that choice was remembered.";
  }

  return { webgl, webgl2, renderer, reducedMotion, optedIn, hardwareAccelerated, verdict, reason };
}

function Row({ label, value, ok }: { label: string; value: string; ok: boolean | null }) {
  return (
    <div className="check__row">
      <span className="check__label mono-sm">{label}</span>
      <span className="check__value">{value}</span>
      <span className="check__dot" data-state={ok === null ? "neutral" : ok ? "ok" : "bad"} />
    </div>
  );
}

/**
 * A page that answers one question: which version of this site does this
 * browser get, and why. It exists because both fallbacks — reduced
 * motion and missing WebGL — are silent by design on the real site, and
 * silence is impossible to debug from another machine.
 */
export function Diagnostics() {
  const [report, setReport] = useState<Report | null>(null);

  useEffect(() => {
    setReport(inspect());
  }, []);

  if (!report) {
    return (
      <p className="mono dim" role="status">
        Reading this browser…
      </p>
    );
  }

  return (
    <>
      <div className="check__verdict">
        <p className="mono journey__marker">
          <span className="journey__marker-id">→</span>
          {report.verdict === "journey" ? "This browser gets the journey" : "This browser gets the document version"}
        </p>
        <p className="journey__lead">{report.reason}</p>
      </div>

      <div className="check__table">
        <Row label="WebGL" value={report.webgl ? "available" : "unavailable"} ok={report.webgl} />
        <Row label="WebGL 2" value={report.webgl2 ? "available" : "unavailable"} ok={report.webgl2} />
        <Row label="Renderer" value={report.renderer} ok={report.webgl ? report.hardwareAccelerated : false} />
        <Row
          label="Hardware acceleration"
          value={report.hardwareAccelerated ? "on" : report.webgl ? "off — drawing on the CPU" : "off"}
          ok={report.hardwareAccelerated}
        />
        <Row
          label="Reduced motion"
          value={report.reducedMotion ? "requested by the system" : "not requested"}
          ok={!report.reducedMotion}
        />
        <Row
          label="Saved choice"
          value={report.optedIn ? "journey, entered deliberately" : "none"}
          ok={null}
        />
      </div>

      {!report.webgl ? (
        <div className="check__fix">
          <p className="mono dim">How to turn it on</p>
          <ol className="check__steps">
            <li>
              Open <code>chrome://settings/system</code> and switch on
              &ldquo;Use graphics acceleration when available&rdquo;, then restart the browser.
            </li>
            <li>
              If it is already on, open <code>chrome://gpu</code> — it names the reason WebGL is
              blocked, usually an out-of-date graphics driver.
            </li>
          </ol>
        </div>
      ) : null}

      <div className="check__actions">
        <a className="link" href="/?journey=1">
          <span className="link__label mono">Force the journey</span>
          <span className="link__track" aria-hidden="true" />
          <span className="link__arrow" aria-hidden="true">
            ↗
          </span>
        </a>
        <a className="link link--sm" href="/?journey=0">
          <span className="link__label mono">Force the document</span>
          <span className="link__track" aria-hidden="true" />
          <span className="link__arrow" aria-hidden="true">
            ↗
          </span>
        </a>
      </div>
    </>
  );
}
