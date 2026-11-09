import * as THREE from "three";
import { RoundedBoxGeometry } from "three/addons/geometries/RoundedBoxGeometry.js";

const TAU = Math.PI * 2;
const clamp = THREE.MathUtils.clamp;

function capsule(radius, length, material, segments = 12) {
  return new THREE.Mesh(
    new THREE.CapsuleGeometry(radius, length, 4, segments),
    material
  );
}

function sphere(radius, material, width = 20, height = 14) {
  return new THREE.Mesh(new THREE.SphereGeometry(radius, width, height), material);
}

/** A capsule stretched between two points, used for the diver's limbs. */
function limb(from, to, radius, material) {
  const direction = new THREE.Vector3().subVectors(to, from);
  const length = direction.length();
  const geo = new THREE.CapsuleGeometry(
    radius,
    Math.max(0.001, length - radius * 2),
    4,
    10
  );
  const mesh = new THREE.Mesh(geo, material);
  mesh.position.copy(from).add(to).multiplyScalar(0.5);
  mesh.quaternion.setFromUnitVectors(
    new THREE.Vector3(0, 1, 0),
    direction.normalize()
  );
  return mesh;
}

function bubbleTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = 64;
  const ctx = canvas.getContext("2d");
  const fill = ctx.createRadialGradient(25, 23, 1, 32, 32, 31);
  fill.addColorStop(0, "rgba(255, 255, 255, 0.55)");
  fill.addColorStop(0.35, "rgba(214, 250, 255, 0.12)");
  fill.addColorStop(1, "rgba(190, 245, 255, 0)");
  ctx.fillStyle = fill;
  ctx.fillRect(0, 0, 64, 64);
  ctx.strokeStyle = "rgba(232, 253, 255, 0.85)";
  ctx.lineWidth = 2.4;
  ctx.beginPath();
  ctx.arc(32, 32, 25, 0, TAU);
  ctx.stroke();
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  return tex;
}

function createFin(material) {
  const shape = new THREE.Shape();
  shape.moveTo(0.03, 0.07);
  shape.bezierCurveTo(-0.17, 0.19, -0.42, 0.2, -0.6, 0.12);
  shape.bezierCurveTo(-0.7, 0.09, -0.7, -0.06, -0.57, -0.11);
  shape.bezierCurveTo(-0.36, -0.18, -0.12, -0.11, 0.03, -0.055);
  shape.closePath();

  const geo = new THREE.ExtrudeGeometry(shape, {
    depth: 0.04,
    bevelEnabled: true,
    bevelThickness: 0.012,
    bevelSize: 0.012,
    bevelSegments: 2,
    steps: 1,
  });
  geo.translate(0, 0, -0.02);
  return new THREE.Mesh(geo, material);
}

/**
 * The little dive companion that travels along the left edge of the page.
 * It is a small self-contained Three.js scene so it can sit above the reef
 * without touching the main ocean renderer or its camera.
 */
export function createDiverCompanion(stage) {
  if (!stage) return null;

  const canvas = document.createElement("canvas");
  canvas.className = "diver__canvas";
  stage.appendChild(canvas);

  let renderer;
  try {
    renderer = new THREE.WebGLRenderer({
      canvas,
      alpha: true,
      antialias: true,
      powerPreference: "low-power",
    });
  } catch (error) {
    canvas.remove();
    return null;
  }

  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  renderer.toneMappingExposure = 1.15;

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, 0.8, 0.1, 60);
  camera.position.set(0.9, 0.9, 7.4);
  camera.lookAt(0, -0.02, 0);

  scene.add(new THREE.HemisphereLight(0xc4f2ff, 0x08222e, 1.85));

  const key = new THREE.DirectionalLight(0xfff0d6, 2.5);
  key.position.set(4, 5.5, 6);
  scene.add(key);

  const rim = new THREE.DirectionalLight(0x8ff0ff, 3.4);
  rim.position.set(-5, 2, -4);
  scene.add(rim);

  const bounce = new THREE.DirectionalLight(0x9ed7e5, 0.85);
  bounce.position.set(-1, -4, 4);
  scene.add(bounce);

  const suit = new THREE.MeshStandardMaterial({
    color: 0x1d5364,
    roughness: 0.58,
    metalness: 0.08,
  });
  const suitDeep = new THREE.MeshStandardMaterial({
    color: 0x0a2a36,
    roughness: 0.7,
    metalness: 0.06,
  });
  const accent = new THREE.MeshStandardMaterial({
    color: 0xff7048,
    roughness: 0.46,
    metalness: 0.05,
    emissive: 0x3a0d05,
    emissiveIntensity: 0.5,
  });
  const metal = new THREE.MeshStandardMaterial({
    color: 0xd6e5e8,
    roughness: 0.28,
    metalness: 0.86,
  });
  const metalDark = new THREE.MeshStandardMaterial({
    color: 0x38525a,
    roughness: 0.4,
    metalness: 0.62,
  });
  const glove = new THREE.MeshStandardMaterial({
    color: 0x0c2b36,
    roughness: 0.64,
  });
  const glass = new THREE.MeshPhysicalMaterial({
    color: 0x7fe9ff,
    roughness: 0.06,
    metalness: 0,
    transparent: true,
    opacity: 0.62,
    clearcoat: 1,
    clearcoatRoughness: 0.08,
    emissive: 0x1f95ad,
    emissiveIntensity: 1.1,
    side: THREE.DoubleSide,
  });

  const diver = new THREE.Group();
  diver.rotation.y = -0.3;
  diver.rotation.z = 0.24;
  scene.add(diver);

  const rig = new THREE.Group();
  rig.rotation.z = 0.055;
  diver.add(rig);

  // Torso and buoyancy vest.
  const torso = capsule(0.33, 0.78, suit);
  torso.rotation.z = Math.PI / 2;
  torso.position.x = 0.04;
  rig.add(torso);

  const backPlate = new THREE.Mesh(
    new RoundedBoxGeometry(0.54, 0.58, 0.16, 4, 0.06),
    suitDeep
  );
  backPlate.position.set(-0.01, 0.05, -0.29);
  rig.add(backPlate);

  const harnessA = new THREE.Mesh(
    new THREE.TorusGeometry(0.337, 0.02, 8, 30),
    suitDeep
  );
  harnessA.rotation.y = Math.PI / 2;
  harnessA.position.x = 0.31;
  rig.add(harnessA);

  const harnessB = harnessA.clone();
  harnessB.position.x = -0.08;
  rig.add(harnessB);

  const consoleBox = new THREE.Mesh(
    new RoundedBoxGeometry(0.14, 0.17, 0.08, 3, 0.026),
    metalDark
  );
  consoleBox.position.set(0.3, -0.1, 0.31);
  rig.add(consoleBox);

  const consoleLight = sphere(0.019, accent, 10, 8);
  consoleLight.position.set(0.3, -0.06, 0.355);
  rig.add(consoleLight);

  const buckle = new THREE.Mesh(
    new RoundedBoxGeometry(0.055, 0.09, 0.035, 2, 0.014),
    accent
  );
  buckle.position.set(0.31, 0.0, 0.345);
  rig.add(buckle);

  // Head, hood and mask.
  const head = sphere(0.32, suit, 24, 18);
  head.position.set(0.87, 0.1, 0);
  head.scale.set(1.04, 1, 1);
  rig.add(head);

  const hoodSeam = new THREE.Mesh(
    new THREE.TorusGeometry(0.32, 0.022, 8, 28),
    accent
  );
  hoodSeam.rotation.y = Math.PI / 2;
  hoodSeam.position.set(0.79, 0.1, 0);
  hoodSeam.scale.set(1, 1.02, 1.02);
  rig.add(hoodSeam);

  const maskFrame = new THREE.Mesh(
    new THREE.TorusGeometry(0.185, 0.036, 8, 30),
    suitDeep
  );
  maskFrame.rotation.y = Math.PI / 2;
  maskFrame.position.set(1.06, 0.12, 0.15);
  maskFrame.scale.set(1, 1.12, 0.95);
  rig.add(maskFrame);

  const lens = sphere(0.19, glass, 22, 16);
  lens.position.set(1.085, 0.12, 0.15);
  lens.scale.set(0.42, 0.92, 0.82);
  rig.add(lens);

  const glint = sphere(0.045, new THREE.MeshBasicMaterial({
    color: 0xffffff,
    transparent: true,
    opacity: 0.6,
  }), 10, 8);
  glint.position.set(1.17, 0.21, 0.255);
  glint.scale.set(0.35, 0.8, 0.5);
  rig.add(glint);

  const strap = new THREE.Mesh(
    new THREE.TorusGeometry(0.335, 0.022, 8, 28),
    suitDeep
  );
  strap.rotation.y = Math.PI / 2;
  strap.position.set(0.94, 0.1, 0);
  rig.add(strap);

  const regulator = new THREE.Mesh(
    new THREE.CylinderGeometry(0.075, 0.075, 0.14, 14),
    metalDark
  );
  regulator.rotation.z = Math.PI / 2;
  regulator.position.set(1.12, -0.13, 0.14);
  rig.add(regulator);

  const regulatorRing = new THREE.Mesh(
    new THREE.TorusGeometry(0.056, 0.017, 8, 18),
    accent
  );
  regulatorRing.rotation.y = Math.PI / 2;
  regulatorRing.position.set(1.2, -0.13, 0.14);
  rig.add(regulatorRing);

  const hoseCurve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(1.05, -0.07, 0.18),
    new THREE.Vector3(0.88, 0.2, 0.3),
    new THREE.Vector3(0.5, 0.4, 0.22),
    new THREE.Vector3(0.2, 0.44, 0.06),
    new THREE.Vector3(0.16, 0.31, -0.01),
  ]);
  const hose = new THREE.Mesh(
    new THREE.TubeGeometry(hoseCurve, 30, 0.032, 6, false),
    suitDeep
  );
  rig.add(hose);

  // Tank and valve.
  const tank = capsule(0.17, 0.52, metal);
  tank.rotation.z = Math.PI / 2;
  tank.position.set(-0.1, 0.36, -0.02);
  rig.add(tank);

  const tankBandA = new THREE.Mesh(
    new THREE.TorusGeometry(0.176, 0.02, 8, 22),
    suitDeep
  );
  tankBandA.rotation.y = Math.PI / 2;
  tankBandA.position.set(-0.34, 0.36, -0.02);
  rig.add(tankBandA);

  const tankBandB = tankBandA.clone();
  tankBandB.position.x = 0.06;
  rig.add(tankBandB);

  const valve = new THREE.Mesh(
    new THREE.CylinderGeometry(0.055, 0.055, 0.12, 12),
    metalDark
  );
  valve.rotation.z = Math.PI / 2;
  valve.position.set(0.36, 0.38, -0.02);
  rig.add(valve);

  const wheel = new THREE.Mesh(
    new THREE.TorusGeometry(0.058, 0.016, 8, 18),
    metalDark
  );
  wheel.rotation.y = Math.PI / 2;
  wheel.position.set(0.425, 0.38, -0.02);
  rig.add(wheel);

  // Arms, hands and cuffs.
  const nearShoulder = new THREE.Vector3(0.44, 0.0, 0.25);
  const nearElbow = new THREE.Vector3(0.16, -0.22, 0.36);
  const nearHand = new THREE.Vector3(-0.22, -0.3, 0.38);
  rig.add(limb(nearShoulder, nearElbow, 0.075, suit));
  rig.add(limb(nearElbow, nearHand, 0.068, suit));
  const nearCuff = sphere(0.082, glove, 14, 10);
  nearCuff.position.copy(nearElbow).lerp(nearHand, 0.8);
  rig.add(nearCuff);
  const nearGlove = sphere(0.085, accent, 14, 10);
  nearGlove.position.copy(nearHand);
  rig.add(nearGlove);

  const farShoulder = new THREE.Vector3(0.44, -0.02, -0.2);
  const farElbow = new THREE.Vector3(0.12, -0.18, -0.32);
  const farHand = new THREE.Vector3(-0.24, -0.28, -0.34);
  rig.add(limb(farShoulder, farElbow, 0.07, suit));
  rig.add(limb(farElbow, farHand, 0.062, suit));
  const farCuff = sphere(0.075, glove, 14, 10);
  farCuff.position.copy(farElbow).lerp(farHand, 0.82);
  rig.add(farCuff);
  const farGlove = sphere(0.078, accent, 14, 10);
  farGlove.position.copy(farHand);
  rig.add(farGlove);

  // Legs.
  const nearHip = new THREE.Vector3(-0.45, -0.02, 0.15);
  const nearKnee = new THREE.Vector3(-0.74, 0.04, 0.16);
  const nearAnkle = new THREE.Vector3(-0.98, -0.04, 0.18);
  rig.add(limb(nearHip, nearKnee, 0.1, suit));
  rig.add(limb(nearKnee, nearAnkle, 0.09, suit));

  const farHip = new THREE.Vector3(-0.45, -0.02, -0.14);
  const farKnee = new THREE.Vector3(-0.72, -0.09, -0.17);
  const farAnkle = new THREE.Vector3(-0.95, -0.17, -0.2);
  rig.add(limb(farHip, farKnee, 0.095, suit));
  rig.add(limb(farKnee, farAnkle, 0.085, suit));

  const nearBoot = sphere(0.1, suitDeep, 14, 10);
  nearBoot.position.copy(nearAnkle);
  rig.add(nearBoot);

  const farBoot = sphere(0.095, suitDeep, 14, 10);
  farBoot.position.copy(farAnkle);
  rig.add(farBoot);

  const nearFin = createFin(accent);
  nearFin.position.copy(nearAnkle);
  nearFin.rotation.x = 0.22;
  nearFin.rotation.y = -0.06;
  rig.add(nearFin);

  const farFin = createFin(accent);
  farFin.position.copy(farAnkle);
  farFin.rotation.x = -0.26;
  farFin.rotation.y = 0.05;
  rig.add(farFin);

  // Regulator bubbles: sprites keep a clean circular rim at any size.
  const bubbleMap = bubbleTexture();
  const bubbles = Array.from({ length: 9 }, (_, index) => {
    const material = new THREE.SpriteMaterial({
      map: bubbleMap,
      transparent: true,
      depthWrite: false,
      opacity: 0.5,
    });
    const sprite = new THREE.Sprite(material);
    scene.add(sprite);
    return {
      sprite,
      phase: index / 9 + (index % 3) * 0.045,
      drift: 0.04 + (index % 4) * 0.02,
      sway: 0.5 + (index % 5) * 0.18,
    };
  });

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  let swim = 0;
  let targetSwim = 0;
  let tilt = 0;
  let targetTilt = 0;
  let needsRender = true;

  function resize() {
    const width = stage.clientWidth || 120;
    const height = stage.clientHeight || 160;
    renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2));
    renderer.setSize(width, height, false);
    camera.aspect = width / height;
    camera.updateProjectionMatrix();
    needsRender = true;
  }

  function setSwimming(value) {
    targetSwim = clamp(value, 0, 1);
  }

  function setTilt(value) {
    targetTilt = clamp(value, -0.28, 0.28);
  }

  function update(dt, time) {
    const step = Math.min(dt, 0.05);

    if (reduceMotion.matches) {
      swim = 0;
      tilt = 0;
      rig.position.y = 0;
      rig.rotation.z = 0.055;
      nearFin.rotation.z = -0.04;
      farFin.rotation.z = -0.04;
      if (!needsRender) return;
      renderer.render(scene, camera);
      needsRender = false;
      return;
    }

    swim += (targetSwim - swim) * Math.min(1, step * 6);
    tilt += (targetTilt - tilt) * Math.min(1, step * 5);
    const idle = 1 - swim;

    rig.position.y = Math.sin(time * 1.45) * (0.032 + swim * 0.02);
    rig.rotation.z = 0.055 + tilt + Math.sin(time * 1.05) * 0.018 * idle;
    rig.rotation.x = Math.sin(time * 0.85) * 0.02 * idle;

    const kickSpeed = 2.8 + swim * 7.2;
    const kickAmp = 0.12 + swim * 0.26;
    nearFin.rotation.z = -0.04 + Math.sin(time * kickSpeed) * kickAmp;
    farFin.rotation.z = -0.04 + Math.sin(time * kickSpeed + Math.PI) * kickAmp;
    nearFin.rotation.x = 0.22 + Math.sin(time * 1.2) * 0.02;
    farFin.rotation.x = -0.26 - Math.sin(time * 1.2 + 1) * 0.02;

    for (const bubble of bubbles) {
      const travel = (time * (0.055 + swim * 0.1) + bubble.phase) % 1;
      const rise = travel * 2.05;
      bubble.sprite.position.set(
        1.1 + travel * 0.16 + Math.sin(time * bubble.sway + bubble.phase * 9) * bubble.drift,
        -0.08 + rise,
        0.3 + Math.sin(bubble.phase * 21) * 0.08
      );
      const scale = 0.045 + travel * 0.11;
      bubble.sprite.scale.set(scale, scale, 1);
      bubble.sprite.material.opacity = Math.sin(travel * Math.PI) * 0.55;
    }

    renderer.render(scene, camera);
  }

  function destroy() {
    bubbleMap.dispose();
    renderer.dispose();
  }

  resize();
  return { resize, setSwimming, setTilt, update, destroy };
}
