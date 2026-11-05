import * as THREE from "three";

// --- Depth palette: scroll progress (0 = surface, 1 = seabed) -> colors
const DEPTH_STOPS = {
  0.0: { bg: "#7bc9da" },
  0.4: { bg: "#1f7fa8" },
  0.75: { bg: "#093356" },
  1.0: { bg: "#020c18" },
};

// Numeric keys are not iterated in numeric order, so sort explicitly.
const stops = Object.entries(DEPTH_STOPS)
  .map(([k, v]) => [Number(k), v])
  .sort((a, b) => a[0] - b[0]);

const DARK_FG = new THREE.Color("#041a24");
const LIGHT_FG = new THREE.Color("#f4fcff");
const DEEP_FG = new THREE.Color("#bfe9f5");
const lerpColor = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);

// Keep copy readable as the water goes from light surface to dark seabed:
// use dark ink while the background is light, pale ink once it is deep.
function textColorFor(bg, p) {
  const luminance = 0.2126 * bg.r + 0.7152 * bg.g + 0.0722 * bg.b;
  if (luminance > 0.19) return DARK_FG.clone();
  return LIGHT_FG.clone().lerp(DEEP_FG, THREE.MathUtils.smoothstep(p, 0.72, 1));
}

export function colorsAt(p) {
  for (let i = 1; i < stops.length; i++) {
    const [p1, c1] = stops[i];
    if (p <= p1) {
      const [p0, c0] = stops[i - 1];
      const t = (p - p0) / (p1 - p0);
      const bg = lerpColor(c0.bg, c1.bg, t);
      return { bg, fg: textColorFor(bg, p) };
    }
  }
  const bg = new THREE.Color(stops.at(-1)[1].bg);
  return { bg, fg: textColorFor(bg, p) };
}
