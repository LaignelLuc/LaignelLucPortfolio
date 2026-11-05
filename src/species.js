// GLBs have named surface materials but no embedded texture/color factors.
// Keep any supplied maps and tint only the untextured materials.
export const SPECIES = {
  salmon: {
    file: "Fish1.glb",
    length: 1.2,
    speed: 0.72,
    colors: { Top: "#18798a", Bottom: "#e5d7af", Fins: "#e78a65" },
  },
  clownfish: {
    file: "Fish3.glb",
    length: 1,
    speed: 0.9,
    colors: { Body: "#ef8738", Stripes: "#fff0d6", Outline: "#263d4a" },
  },
  ray: {
    file: "Manta ray.glb",
    length: 1.8,
    speed: 0.58,
    colors: { Top: "#397d8a", Bottom: "#c5e1dc" },
  },
  shark: {
    file: "Shark.glb",
    length: 1.5,
    speed: 0.68,
    colors: { Top: "#477c9d", Bottom: "#d7e8e4" },
  },
  whale: {
    file: "Whale.glb",
    length: 1.9,
    speed: 0.5,
    colors: { Top: "#365d79", Bottom: "#c0e0e4" },
  },
  lanternfish: {
    file: "Lanternfish.glb",
    length: 1.7,
    speed: 0.26,
    hover: true,
    glow: {
      color: "#8efaff",
      coreSize: 2.8,
      haloSize: 8,
      light: 18,
      distance: 8,
    },
    colors: {
      Body: "#1d3d4a",
      Fins: "#3a7180",
      Teeth: "#dce8df",
      Eye: "#050b10",
      Mouth: "#1b0709",
      Lure: "#8efaff",
      Photophores: "#7df2ff",
      Catchlight: "#c5fcff",
    },
  },
};

// Each band owns its species and the slice of the scroll where it lives.
// Every creature gets its own lane (height + distance) so species do not pile
// up. Fish stay at fixed world heights: the camera dives past them while the
// bands crossfade.
export const DEPTH_BANDS = [
  {
    id: "sunlit",
    brightness: 1.15,
    fadeOut: [0.26, 0.42],
    creatures: [
      { species: "clownfish", y: [2, 2.5], z: [-5.2, -4.6] },
      { species: "salmon", y: [3, 3.5], z: [-6.6, -5.9] },
      { species: "ray", y: [3.9, 4.4], z: [-7.6, -6.9] },
    ],
  },
  {
    id: "twilight",
    brightness: 0.85,
    fadeIn: [0.26, 0.42],
    fadeOut: [0.66, 0.78],
    creatures: [
      { species: "shark", y: [-9.6, -9], z: [-9.6, -8.8] },
      { species: "whale", y: [-11.8, -11.2], z: [-12, -11.2] },
      { species: "ray", y: [-8.2, -7.6], z: [-8.4, -7.6] },
    ],
  },
  {
    id: "abyss",
    brightness: 1.05,
    fadeIn: [0.76, 0.9],
    creatures: [
      { species: "lanternfish", y: [-10.8, -10.2], z: [-10.4, -9.4] },
    ],
  },
];

export const ABYSS_BAND = DEPTH_BANDS.find((band) => band.id === "abyss");

function smoothstep(x, min, max) {
  if (min === max) return x < min ? 0 : 1;
  const t = Math.min(1, Math.max(0, (x - min) / (max - min)));
  return t * t * (3 - 2 * t);
}

export function bandVisibility(band, p) {
  const fadeIn = band.fadeIn
    ? smoothstep(p, band.fadeIn[0], band.fadeIn[1])
    : 1;
  const fadeOut = band.fadeOut
    ? 1 - smoothstep(p, band.fadeOut[0], band.fadeOut[1])
    : 1;
  return Math.min(fadeIn, fadeOut);
}
