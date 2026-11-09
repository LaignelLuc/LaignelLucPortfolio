import * as THREE from "three";
import { colorsAt } from "./src/palette.js";
import { createBubbles } from "./src/bubbles.js";
import { createSunRays } from "./src/sun-rays.js";
import { createSeafloor } from "./src/seafloor.js";
import { createAbyssEels } from "./src/abyss-eels.js";
import { ABYSS_BAND, bandVisibility } from "./src/species.js";
import { createMarineLife } from "./src/marine-life.js";
import { initBackToTop } from "./src/back-to-top.js";
import { createForegroundReef } from "./src/foreground-reef.js";
import { PROJECTS } from "./src/projects.js";
import { createDroneFleet } from "./src/drone-fleet.js";
import { createProjectWindow } from "./src/project-window.js";
import { createSkillsSection } from "./src/skills-dial.js";
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
  marineLife.update(dt, t, progress);
  droneFleet.update(dt, t);

  renderer.render(scene, camera);
});

addEventListener("pagehide", () => droneFleet.destroy(), { once: true });
