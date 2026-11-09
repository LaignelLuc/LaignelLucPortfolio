import * as THREE from "three";
import { colorsAt } from "./src/palette.js";
import { createBubbles } from "./src/bubbles.js";
import { createSunRays } from "./src/sun-rays.js";
import { createSeafloor } from "./src/seafloor.js";
import { createAbyssEels } from "./src/abyss-eels.js";
import { createFishSchool } from "./src/fish-school.js";
import { createBarracuda } from "./src/barracuda.js";
import { createJellyfish } from "./src/jellyfish.js";
import { createMarineSnow } from "./src/marine-snow.js";
import {
  ABYSS_BAND,
  bandVisibility,
  DEPTH_BANDS,
} from "./src/species.js";
import { createMarineLife } from "./src/marine-life.js";
import { initBackToTop } from "./src/back-to-top.js";
import { createForegroundReef } from "./src/foreground-reef.js";
import { PROJECTS } from "./src/projects.js";
import { createDroneFleet } from "./src/drone-fleet.js";
import { createProjectWindow } from "./src/project-window.js";
import { createSkillsSection } from "./src/skills-dial.js";
import { initSectionNav } from "./src/section-nav.js";
// --- Scene
const canvas = document.getElementById("ocean");
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
camera.position.z = 8;

// --- Ocean features
const bubbles = createBubbles();
scene.add(bubbles.points);

const sunRays = createSunRays();
scene.add(sunRays.mesh);

scene.add(new THREE.AmbientLight(0xffffff, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(2, 5, 3);
scene.add(sun);

const seafloor = createSeafloor();
scene.add(seafloor.group);

const abyssEels = createAbyssEels({ scene });

const SUNLIT_BAND = DEPTH_BANDS.find((band) => band.id === "sunlit");
const TWILIGHT_BAND = DEPTH_BANDS.find((band) => band.id === "twilight");
const compact = matchMedia("(max-width: 700px)").matches;

const sardineSchool = createFishSchool({
  scene,
  camera,
  name: "SardineBaitBall",
  band: SUNLIT_BAND,
  count: compact ? 28 : 48,
  length: 0.46,
  centerY: 1.15,
  z: -7.6,
  xFactor: 0.4,
  radius: 1.45,
  vertical: 0.9,
  speed: 0.85,
  phase: 0.6,
  colors: { top: "#315764", belly: "#e8efe4", fin: "#b7c9c5" },
  swaySpeed: 4.4,
  swayAmount: 0.055,
});

const barracuda = createBarracuda({
  scene,
  camera,
  band: SUNLIT_BAND,
});

const mackerelSchool = createFishSchool({
  scene,
  camera,
  name: "MackerelSchool",
  band: TWILIGHT_BAND,
  count: compact ? 12 : 16,
  length: 0.62,
  centerY: 0.2,
  z: -12.5,
  xFactor: -0.6,
  radius: 1,
  vertical: 0.65,
  speed: 0.7,
  phase: 2.4,
  colors: { top: "#204855", belly: "#d8e5dc", fin: "#8fadaa" },
  stripes: true,
  swaySpeed: 4.8,
  swayAmount: 0.05,
});

const jellies = createJellyfish({
  scene,
  camera,
  configs: [
    {
      id: "moon-a",
      band: TWILIGHT_BAND,
      xFactor: -0.5,
      y: -2.2,
      z: -13.5,
      size: 0.55,
      phase: 0.4,
      color: "#a7e5ee",
      opacity: 0.3,
      halo: 0.1,
      tentacles: 7,
    },
    {
      id: "moon-b",
      band: TWILIGHT_BAND,
      xFactor: 0.6,
      y: -5.8,
      z: -16.5,
      size: 0.48,
      phase: 2.2,
      color: "#b4ecf1",
      opacity: 0.28,
      halo: 0.08,
      tentacles: 8,
    },
    {
      id: "moon-c",
      band: TWILIGHT_BAND,
      xFactor: 0.34,
      y: -8.6,
      z: -19.5,
      size: 0.4,
      phase: 4.1,
      color: "#8ed7e0",
      opacity: 0.26,
      halo: 0.06,
      tentacles: 6,
    },
    {
      id: "abyss-jelly",
      band: ABYSS_BAND,
      xFactor: -0.28,
      y: -12.2,
      z: -18.5,
      size: 1,
      phase: 1.7,
      color: "#65d4e5",
      opacity: 0.3,
      halo: 0.22,
      tentacles: 9,
    },
  ],
});

const marineSnow = createMarineSnow({ scene, band: ABYSS_BAND, count: 220 });

const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;
const marineLife = createMarineLife({ scene, camera, reduceMotion });
const foregroundReef = createForegroundReef();

const projectWindow = createProjectWindow();
createSkillsSection(document.getElementById("skills"));
const droneFleet = createDroneFleet({
  scene,
  camera,
  projects: PROJECTS,
  projectWindow,
});
// --- Scroll -> depth
let progress = 0;
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress = max > 0 ? scrollY / max : 0;
  const { bg, fg } = colorsAt(progress);
  document.documentElement.style.setProperty("--bg", `#${bg.getHexString()}`);
  document.documentElement.style.setProperty("--fg", `#${fg.getHexString()}`);
  foregroundReef.update(progress);
}
addEventListener("scroll", onScroll, { passive: true });

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  bubbles.resize(renderer, camera);
  sunRays.resize(camera);
}
addEventListener("resize", resize);
resize();
onScroll();
initBackToTop();
const sectionNav = initSectionNav();

// --- Loop
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  // Camera dives with the scroll
  camera.position.y = -progress * 6;
  camera.updateMatrixWorld();
  camera.matrixWorldInverse.copy(camera.matrixWorld).invert();

  bubbles.update(dt, t, camera.position.y, reduceMotion);
  sunRays.update(t, progress, camera.position.y, reduceMotion);

  const abyss = bandVisibility(ABYSS_BAND, progress);
  seafloor.setOpacity(abyss);
  abyssEels.update(progress, t, reduceMotion);
  sardineSchool.update(t, progress, reduceMotion);
  barracuda.update(t, progress, reduceMotion);
  mackerelSchool.update(t, progress, reduceMotion);
  jellies.update(t, progress, reduceMotion);
  marineSnow.update(dt, t, progress, reduceMotion);
  marineLife.update(dt, t, progress);
  droneFleet.update(dt, t);
  sectionNav.update(dt, t);

  renderer.render(scene, camera);
});

addEventListener("pagehide", () => droneFleet.destroy(), { once: true });
