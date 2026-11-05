import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// --- Depth palette: scroll progress (0 = surface, 1 = seabed) -> colors
const DEPTH_STOPS = {
  0.0: { bg: "#7bc9da", fg: "#06222e" },
  0.4: { bg: "#1f7fa8", fg: "#eaf9ff" },
  0.75: { bg: "#093356", fg: "#eaf9ff" },
  1.0: { bg: "#020c18", fg: "#bfe9f5" },
};
const stops = Object.entries(DEPTH_STOPS).map(([k, v]) => [Number(k), v]);

const lerpColor = (a, b, t) => new THREE.Color(a).lerp(new THREE.Color(b), t);

function colorsAt(p) {
  for (let i = 1; i < stops.length; i++) {
    const [p1, c1] = stops[i];
    if (p <= p1) {
      const [p0, c0] = stops[i - 1];
      const t = (p - p0) / (p1 - p0);
      return {
        bg: lerpColor(c0.bg, c1.bg, t),
        fg: lerpColor(c0.fg, c1.fg, t),
      };
    }
  }
  return { bg: new THREE.Color(stops.at(-1)[1].bg), fg: new THREE.Color(stops.at(-1)[1].fg) };
}

// --- Scene
const canvas = document.getElementById("ocean");
const renderer = new THREE.WebGLRenderer({ canvas, alpha: true, antialias: true });
renderer.setPixelRatio(Math.min(devicePixelRatio, 2));

const scene = new THREE.Scene();
const camera = new THREE.PerspectiveCamera(60, 1, 0.1, 100);
camera.position.z = 8;

// --- Bubbles (one Points object = 1 draw call)
const BUBBLE_COUNT = 250;
const positions = new Float32Array(BUBBLE_COUNT * 3);
const speeds = new Float32Array(BUBBLE_COUNT);

for (let i = 0; i < BUBBLE_COUNT; i++) {
  positions[i * 3] = (Math.random() - 0.5) * 20;
  positions[i * 3 + 1] = (Math.random() - 0.5) * 14;
  positions[i * 3 + 2] = (Math.random() - 0.5) * 10;
  speeds[i] = 0.2 + Math.random() * 0.6;
}

const bubbleGeometry = new THREE.BufferGeometry();
bubbleGeometry.setAttribute("position", new THREE.BufferAttribute(positions, 3));
const bubbles = new THREE.Points(
  bubbleGeometry,
  new THREE.PointsMaterial({ color: 0xffffff, size: 0.12, transparent: true, opacity: 0.55, depthWrite: false })
);
scene.add(bubbles);

const rayMaterial = new THREE.ShaderMaterial({
  uniforms: {
    uTime: { value: 0 },
    uIntensity: { value: 1 },
  },
  vertexShader: `
    varying vec2 vUv;

    void main() {
      vUv = uv;
      gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0);
    }
  `,
  fragmentShader: `
    uniform float uTime;
    uniform float uIntensity;
    varying vec2 vUv;

    void main() {
      float rays = 0.0;
      float width = 0.02 + (1.0 - vUv.y) * 0.05;

      for (int i = 0; i < 7; i++) {
        float index = float(i);
        float origin = (index + 0.5) / 7.0;
        float drift = sin(uTime * 0.18 + index * 1.7) * 0.018;
        float center = origin + (1.0 - vUv.y) * 0.14 + drift;
        float beam = 1.0 - smoothstep(0.0, width, abs(vUv.x - center));
        rays += beam * (0.55 + 0.45 * sin(index * 2.3 + 1.0));
      }

      float fadeFromSurface = smoothstep(0.0, 0.18, vUv.y);
      float intensity = min(rays * 0.24, 0.4) * fadeFromSurface * uIntensity;
      gl_FragColor = vec4(vec3(0.78, 0.94, 1.0), intensity);
    }
  `,
  transparent: true,
  depthWrite: false,
});
const sunRays = new THREE.Mesh(new THREE.PlaneGeometry(1, 1), rayMaterial);
sunRays.position.z = -13;
sunRays.renderOrder = 1;
scene.add(sunRays);

scene.add(new THREE.AmbientLight(0xffffff, 1.4));
const sun = new THREE.DirectionalLight(0xffffff, 2);
sun.position.set(2, 5, 3);
scene.add(sun);

// GLBs have named surface materials but no embedded texture/color factors.
// Keep any supplied maps and tint only the untextured materials.
const marineLife = [
  {
    file: "Fish1.glb",
    length: 1.2,
    speed: 0.72,
    depthDarkening: 0.9,
    colors: { Top: "#18798a", Bottom: "#e5d7af", Fins: "#e78a65" },
  },
  {
    file: "Fish3.glb",
    length: 1,
    speed: 0.9,
    colors: { Body: "#ef8738", Stripes: "#fff0d6", Outline: "#263d4a" },
  },
  {
    file: "Manta ray.glb",
    length: 1.8,
    speed: 0.58,
    colors: { Top: "#397d8a", Bottom: "#c5e1dc" },
  },
  {
    file: "Shark.glb",
    length: 1.5,
    speed: 0.68,
    colors: { Top: "#477c9d", Bottom: "#d7e8e4" },
  },
  {
    file: "Whale.glb",
    length: 1.9,
    speed: 0.5,
    colors: { Top: "#365d79", Bottom: "#c0e0e4" },
  },
];
const swimmers = [];
const loader = new GLTFLoader();
const reduceMotion = matchMedia("(prefers-reduced-motion: reduce)").matches;

function spawnSwimmer(swimmer) {
  const depth = Math.random();
  swimmer.z = THREE.MathUtils.lerp(-11, -5, depth);
  swimmer.direction = Math.random() < 0.5 ? -1 : 1;
  const distance = camera.position.z - swimmer.z;
  const viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
  const viewWidth = viewHeight * camera.aspect;
  const margin = Math.max(0.75, swimmer.length * 0.65);
  const verticalRange = Math.max(0, viewHeight / 2 - margin);

  swimmer.y = (Math.random() * 2 - 1) * verticalRange;
  swimmer.x = reduceMotion
    ? 0
    : swimmer.direction * -(viewWidth / 2 + margin);
  swimmer.root.rotation.y = swimmer.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
}

for (const creature of marineLife) {
  loader.load(
    `model/${encodeURIComponent(creature.file)}`,
    (gltf) => {
      const model = gltf.scene;
      const root = new THREE.Group();
      root.add(model);
      const bounds = new THREE.Box3().setFromObject(model);
      const size = bounds.getSize(new THREE.Vector3());
      const center = bounds.getCenter(new THREE.Vector3());
      const scale = creature.length / Math.max(size.x, size.y, size.z);
      model.scale.setScalar(scale);
      model.position.set(-center.x * scale, -center.y * scale, -center.z * scale);

      const materials = [];
      model.traverse((object) => {
        if (!object.isMesh) return;
        const meshMaterials = Array.isArray(object.material) ? object.material : [object.material];
        for (const material of meshMaterials) {
          const color = creature.colors[material.name];
          if (color && !material.map && material.color) material.color.set(color);
          material.transparent = true;
          material.depthWrite = false;
          materials.push({
            material,
            baseColor: material.color?.clone() ?? null,
          });
        }
      });

      const mixer = new THREE.AnimationMixer(model);
      for (const clip of gltf.animations) mixer.clipAction(clip).play();
      scene.add(root);
      const swimmer = { root, mixer, materials, ...creature };
      spawnSwimmer(swimmer);
      swimmers.push(swimmer);
    },
    undefined,
    (error) => console.error(`Unable to load model/${creature.file}`, error)
  );
}

// --- Scroll -> depth
let progress = 0;
function onScroll() {
  const max = document.documentElement.scrollHeight - innerHeight;
  progress = max > 0 ? scrollY / max : 0;
  const { bg, fg } = colorsAt(progress);
  document.documentElement.style.setProperty("--bg", `#${bg.getHexString()}`);
  document.documentElement.style.setProperty("--fg", `#${fg.getHexString()}`);
}
addEventListener("scroll", onScroll, { passive: true });

function resize() {
  renderer.setSize(innerWidth, innerHeight, false);
  camera.aspect = innerWidth / innerHeight;
  camera.updateProjectionMatrix();
  const rayDistance = camera.position.z - sunRays.position.z;
  const rayHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * rayDistance;
  sunRays.scale.set(rayHeight * camera.aspect, rayHeight, 1);
}
addEventListener("resize", resize);
resize();
onScroll();

// --- Loop
const clock = new THREE.Clock();

renderer.setAnimationLoop(() => {
  const dt = clock.getDelta();
  const t = clock.elapsedTime;

  if (!reduceMotion) {
    for (let i = 0; i < BUBBLE_COUNT; i++) {
      positions[i * 3 + 1] += speeds[i] * dt;
      positions[i * 3] += Math.sin(t + i) * 0.002;
      if (positions[i * 3 + 1] > 7) positions[i * 3 + 1] = -7;
    }
    bubbleGeometry.attributes.position.needsUpdate = true;
  }

  // Camera dives with the scroll
  camera.position.y = -progress * 6;
  bubbles.position.y = camera.position.y;
  sunRays.position.y = camera.position.y;
  rayMaterial.uniforms.uTime.value = reduceMotion ? 0 : t;
  rayMaterial.uniforms.uIntensity.value = 1 - THREE.MathUtils.smoothstep(progress, 0, 0.42);

  for (const swimmer of swimmers) {
    if (!reduceMotion) swimmer.x += swimmer.direction * swimmer.speed * dt;

    let distance = camera.position.z - swimmer.z;
    let viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
    let viewWidth = viewHeight * camera.aspect;
    let margin = Math.max(0.75, swimmer.length * 0.65);
    let pathEnd = viewWidth / 2 + margin;
    const alongPath = swimmer.x * swimmer.direction;
    if (!reduceMotion && alongPath > pathEnd) {
      spawnSwimmer(swimmer);
      distance = camera.position.z - swimmer.z;
      viewHeight = 2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
      viewWidth = viewHeight * camera.aspect;
      margin = Math.max(0.75, swimmer.length * 0.65);
      pathEnd = viewWidth / 2 + margin;
    }

    const position = swimmer.x * swimmer.direction;
    const fadeDistance = margin * 1.5;
    const fadeIn = reduceMotion
      ? 1
      : THREE.MathUtils.smoothstep(position + viewWidth / 2 + margin, 0, fadeDistance);
    const fadeOut = reduceMotion
      ? 1
      : THREE.MathUtils.smoothstep(pathEnd - position, 0, fadeDistance);
    const visibility = Math.min(fadeIn, fadeOut);
    const depth = THREE.MathUtils.clamp((swimmer.z + 11) / 6, 0, 1);

    swimmer.root.position.set(swimmer.x, camera.position.y + swimmer.y, swimmer.z);
    const brightness = 1.15 - depth * (swimmer.depthDarkening ?? 0.68);
    for (const { material, baseColor } of swimmer.materials) {
      material.opacity = visibility;
      if (baseColor && material.color) {
        material.color.copy(baseColor).multiplyScalar(brightness);
      }
    }

    if (!reduceMotion) swimmer.mixer.update(dt);
  }

  renderer.render(scene, camera);
});