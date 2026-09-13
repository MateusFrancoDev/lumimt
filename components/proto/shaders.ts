/* ------------------------------------------------------------------
   Procedural surfaces.

   No textures anywhere: every planet is computed in the fragment
   shader. That keeps the whole scene at zero bytes of image payload
   and lets a single surface shader be an Earth, a frozen world or a
   Pangaea just by moving its uniforms.
------------------------------------------------------------------ */

export const NOISE = /* glsl */ `
  float hash(vec3 p) {
    p = fract(p * 0.3183099 + vec3(0.71, 0.113, 0.419));
    p *= 17.0;
    return fract(p.x * p.y * p.z * (p.x + p.y + p.z));
  }

  float noise(vec3 p) {
    vec3 i = floor(p);
    vec3 f = fract(p);
    f = f * f * (3.0 - 2.0 * f);
    return mix(
      mix(mix(hash(i), hash(i + vec3(1, 0, 0)), f.x),
          mix(hash(i + vec3(0, 1, 0)), hash(i + vec3(1, 1, 0)), f.x), f.y),
      mix(mix(hash(i + vec3(0, 0, 1)), hash(i + vec3(1, 0, 1)), f.x),
          mix(hash(i + vec3(0, 1, 1)), hash(i + vec3(1, 1, 1)), f.x), f.y),
      f.z);
  }

  float fbm(vec3 p) {
    float total = 0.0;
    float amp = 0.5;
    for (int i = 0; i < 5; i++) {
      total += noise(p) * amp;
      p *= 2.02;
      amp *= 0.5;
    }
    return total;
  }
`;

export const SURFACE_VERTEX = /* glsl */ `
  varying vec3 vNormalW;
  varying vec3 vLocal;
  varying vec3 vView;
  varying vec2 vUv;

  void main() {
    vUv = uv;
    vLocal = position;
    vNormalW = normalize(mat3(modelMatrix) * normal);
    vec4 world = modelMatrix * vec4(position, 1.0);
    vView = normalize(cameraPosition - world.xyz);
    gl_Position = projectionMatrix * viewMatrix * world;
  }
`;

/** Continents, oceans, ice caps, clouds and night-side city lights. */
export const SURFACE_FRAGMENT = /* glsl */ `
  uniform sampler2D uMap;     // NASA colour map
  uniform sampler2D uOcean;   // ocean mask (white = water)
  uniform sampler2D uNight;   // city lights
  uniform vec3 uLight;
  uniform vec3 uLandTint;
  uniform vec3 uSeaTint;
  uniform vec3 uAtmo;
  uniform float uLandMix;     // 0 = real Earth, 1 = fully repainted
  uniform float uSeaMix;
  uniform float uIceLatitude;
  uniform float uIceStrength;
  uniform float uCity;

  varying vec3 vNormalW;
  varying vec3 vLocal;
  varying vec3 vView;
  varying vec2 vUv;

  void main() {
    vec3 unit = normalize(vLocal);
    vec3 normal = normalize(vNormalW);
    vec3 light = normalize(uLight);
    vec3 view = normalize(vView);

    vec3 day = texture2D(uMap, vUv).rgb;
    float water = texture2D(uOcean, vUv).r;
    float land = 1.0 - water;

    // The era repaints the real geography instead of replacing it, so
    // the continents stay the continents at every age of the planet.
    vec3 painted = mix(day, uLandTint * (0.65 + day.r * 0.6), uLandMix);
    vec3 sea = mix(day, uSeaTint, uSeaMix);
    vec3 base = mix(painted, sea, water);

    float latitude = abs(unit.y);
    float ice = smoothstep(uIceLatitude - 0.09, uIceLatitude + 0.09, latitude);
    base = mix(base, vec3(0.92, 0.95, 0.97), clamp(ice * uIceStrength, 0.0, 1.0));

    float lambert = dot(normal, light);
    float dayside = smoothstep(-0.18, 0.3, lambert);
    vec3 colour = base * mix(0.035, 1.12, dayside);

    // sun glinting off open water
    vec3 halfway = normalize(light + view);
    float spec = pow(max(dot(normal, halfway), 0.0), 90.0);
    colour += vec3(0.85, 0.92, 1.0) * spec * water * dayside * 0.9;

    // real city lights, only on the night side
    float night = 1.0 - dayside;
    colour += texture2D(uNight, vUv).rgb * night * uCity;

    // atmosphere: a rim everywhere, brighter at the terminator
    float fresnel = pow(1.0 - clamp(dot(normal, view), 0.0, 1.0), 3.0);
    colour += uAtmo * fresnel * (0.2 + dayside * 0.8);
    colour += uAtmo * pow(1.0 - abs(lambert), 7.0) * 0.3;

    gl_FragColor = vec4(colour, 1.0);
  }
`;

/** Banded, turbulent, slowly shearing — a gas giant. */
export const GAS_FRAGMENT = /* glsl */ `
  uniform vec3 uBandA;
  uniform vec3 uBandB;
  uniform vec3 uBandC;
  uniform vec3 uAtmo;
  uniform vec3 uLight;
  uniform float uTime;

  varying vec3 vNormalW;
  varying vec3 vLocal;
  varying vec3 vView;

  ${NOISE}

  void main() {
    vec3 unit = normalize(vLocal);

    // latitude bands, warped by turbulence so they are never straight
    float warp = fbm(unit * 1.5 + vec3(uTime * 0.02, 0.0, 0.0));
    float curl = fbm(unit * 4.5 + vec3(warp * 1.5, uTime * 0.03, 0.0));
    float bands = sin((unit.y * 9.0 + warp * 2.4 + curl * 0.9) * 3.14159);
    bands = bands * 0.5 + 0.5;
    bands = mix(bands, bands * bands, 0.45);

    vec3 colour = mix(uBandA, uBandB, bands);

    // storms riding on top of the bands
    float storm = fbm(unit * 3.4 + vec3(uTime * 0.05, warp, 0.0));
    colour = mix(colour, uBandC, smoothstep(0.62, 0.86, storm));

    float lambert = dot(normalize(vNormalW), normalize(uLight));
    float day = smoothstep(-0.55, 0.5, lambert);
    colour *= mix(0.16, 1.05, day);

    float fresnel = pow(1.0 - clamp(dot(normalize(vNormalW), normalize(vView)), 0.0, 1.0), 2.6);
    colour += uAtmo * fresnel * (0.25 + day * 0.75);

    gl_FragColor = vec4(colour, 1.0);
  }
`;

/** The accretion disk: gold, beamed, shearing faster on the inside. */
export const DISK_FRAGMENT = /* glsl */ `
  uniform float uTime;
  uniform float uInner;
  uniform float uOuter;

  varying vec3 vLocal;

  ${NOISE}

  void main() {
    float r = length(vLocal.xy);
    float angle = atan(vLocal.y, vLocal.x);
    float t = clamp((r - uInner) / (uOuter - uInner), 0.0, 1.0);

    float radial = smoothstep(0.0, 0.1, t) * smoothstep(1.0, 0.4, t);

    // differential rotation: the inner edge outruns the outer
    float shear = uTime * (1.4 / max(r * 0.08, 0.4));
    float filaments = noise(vec3(angle * 3.0 + shear, r * 0.5, 0.0));
    filaments = mix(0.6, 1.35, filaments);
    filaments *= mix(0.8, 1.2, noise(vec3(angle * 9.0 + shear * 1.6, r * 1.4, 3.0)));

    // one side is approaching, and is brighter for it
    float beaming = 0.5 + 0.5 * smoothstep(-1.0, 1.0, sin(angle));

    vec3 hot = vec3(1.0, 0.95, 0.78);
    vec3 gold = vec3(1.0, 0.72, 0.26);
    vec3 deep = vec3(0.72, 0.34, 0.06);
    vec3 colour = mix(hot, gold, smoothstep(0.0, 0.45, t));
    colour = mix(colour, deep, smoothstep(0.5, 1.0, t));

    float intensity = radial * filaments * beaming;
    gl_FragColor = vec4(colour * intensity * 0.85, intensity * 0.8);
  }
`;

/** A soft radial falloff, for glows that must not look like discs. */
export const GLOW_VERTEX = /* glsl */ `
  varying vec2 vUv;
  void main() {
    vUv = uv;
    gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
  }
`;

export const GLOW_FRAGMENT = /* glsl */ `
  uniform vec3 uColour;
  uniform float uIntensity;
  uniform float uPower;
  varying vec2 vUv;

  void main() {
    float d = length(vUv - 0.5) * 2.0;
    float falloff = pow(clamp(1.0 - d, 0.0, 1.0), uPower);
    gl_FragColor = vec4(uColour, falloff * uIntensity);
  }
`;

/** Ring debris. Clamped in size, because a fragment passing close to
 *  the lens otherwise becomes a square the size of a fist. */
export const DEBRIS_VERTEX = /* glsl */ `
  uniform float uScale;
  varying float vNear;

  void main() {
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    float dist = max(-view.z, 0.5);
    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp(uScale * (60.0 / dist), 1.0, 7.0);
    vNear = smoothstep(1.5, 8.0, dist);
  }
`;

export const DEBRIS_FRAGMENT = /* glsl */ `
  uniform vec3 uColour;
  varying float vNear;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float core = smoothstep(0.5, 0.06, length(uv));
    gl_FragColor = vec4(uColour, core * 0.85 * vNear);
  }
`;

/* ------------------------------------------------------------------
   M87*.

   Modelled on the released EHT image rather than on the film idea of
   a black hole: M87* is seen nearly face-on, so there is no edge-on
   disk and no ring "painted around a ball". What the telescope
   recorded is a thick, blurred ring of emission with a dark shadow
   punched through the middle, one side several times brighter than
   the other because the gas on that side is coming toward us.

   The colour ramp is afmhot — matplotlib's, and the one the EHT
   collaboration used for the published image.
------------------------------------------------------------------ */

/**
 * The shadow, as a hole punched in whatever is behind it.
 *
 * There used to be a black sphere here. It read as a separate object
 * dropped into the picture — a ball with a ring near it — because a
 * sphere has a silhouette and the real shadow does not: its edge is a
 * gradient. This is the same plane as the ring, drawn first, painting
 * black with a soft falloff, so the shadow and the light are one
 * image instead of two things that never quite met.
 */
export const SHADOW_FRAGMENT = /* glsl */ `
  uniform float uRing;
  uniform float uFade;
  varying vec2 vUv;

  void main() {
    float r = length((vUv - 0.5) * 2.0);
    float dark = 1.0 - smoothstep(uRing * 0.3, uRing * 1.02, r);
    gl_FragColor = vec4(0.0, 0.0, 0.0, dark * uFade);
  }
`;

export const M87_FRAGMENT = /* glsl */ `
  uniform float uRing;   // radius of peak brightness, 1.0 = half the plane
  uniform float uWidth;  // gaussian sigma of the emission ring
  uniform float uBeam;   // bearing of the brightest side, in radians
  uniform float uFade;   // 1 outside, 0 once the camera is on the horizon
  uniform float uTime;
  varying vec2 vUv;

  float gauss(float x, float s) {
    return exp(-0.5 * (x * x) / (s * s));
  }

  /** matplotlib afmhot: black, deep red, orange, yellow, white. */
  vec3 afmhot(float t) {
    return clamp(vec3(2.0 * t, 2.0 * t - 1.0, 4.0 * t - 3.0), 0.0, 1.0);
  }

  void main() {
    vec2 p = (vUv - 0.5) * 2.0;
    float r = length(p);
    float a = atan(p.y, p.x);

    // The ring is thick and soft everywhere: the published image is a
    // beam-convolved reconstruction, so it has no sharp edge at all.
    float ring = gauss(r - uRing, uWidth);
    float skirt = gauss(r - uRing, uWidth * 3.2) * 0.3;

    // Relativistic beaming. The approaching side is the bright one,
    // by a factor of about four — enough to be unmistakable, never so
    // much that the faint half of the ring disappears. In the real
    // image the ring closes all the way round; only the brightness
    // changes.
    float beam = 0.34 + 0.66 * pow(0.5 + 0.5 * cos(a - uBeam), 1.15);

    // The reconstruction is lumpy, and slowly changes. Three slow
    // harmonics carry that without turning it into a fire effect.
    float lump =
      0.86 +
      0.14 * sin(a * 2.0 + uTime * 0.05) +
      0.09 * sin(a * 5.0 - uTime * 0.031) +
      0.05 * sin(a * 9.0 + 1.7);

    float i = (ring + skirt) * beam * lump;

    // The shadow. Its radius is very nearly the radius of the
    // brightness peak — that near-coincidence is exactly what makes
    // the image read as a shadow rather than as a donut.
    i *= smoothstep(uRing * 0.42, uRing * 0.93, r);

    // and nothing at all out at the edge of the plane
    i *= smoothstep(1.0, 0.55, r);

    // Gain set so only a small core of the bright side reaches white:
    // most of the ring has to land in the oranges, which is where the
    // published image lives.
    float e = clamp(i * 0.76, 0.0, 1.0) * uFade;
    gl_FragColor = vec4(afmhot(e), e);
  }
`;

/* ------------------------------------------------------------------
   Stars with real colour temperature and a galactic band.
------------------------------------------------------------------ */

export const STARS_VERTEX = /* glsl */ `
  uniform float uScale;
  attribute float aSize;
  attribute float aTemp;
  varying float vTemp;
  varying float vMag;

  void main() {
    vTemp = aTemp;
    vMag = aSize;
    vec4 view = modelViewMatrix * vec4(position, 1.0);
    gl_Position = projectionMatrix * view;
    gl_PointSize = clamp(uScale * aSize * (140.0 / max(-view.z, 1.0)), 0.6, 5.0);
  }
`;

export const STARS_FRAGMENT = /* glsl */ `
  varying float vTemp;
  varying float vMag;

  void main() {
    vec2 uv = gl_PointCoord - 0.5;
    float d = length(uv);
    float core = smoothstep(0.5, 0.0, d);
    core *= core;

    // O/B blue-white through G white to K/M orange
    vec3 blue = vec3(0.72, 0.81, 1.0);
    vec3 white = vec3(1.0, 0.98, 0.95);
    vec3 warm = vec3(1.0, 0.82, 0.64);
    vec3 colour = vTemp < 0.5
      ? mix(blue, white, vTemp * 2.0)
      : mix(white, warm, (vTemp - 0.5) * 2.0);

    gl_FragColor = vec4(colour, core * (0.25 + vMag * 0.6));
  }
`;
