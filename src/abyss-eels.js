import * as THREE from "three";
import { sandHeight } from "./seafloor.js";

const EELS = [
  { x: -9.4, z: -19.5, height: 1.15, phase: 2.9, yaw: 1.2, amplitude: 0.050 },
  { x: -7.2, z: -15.0, height: 1.45, phase: 0.1, yaw: 0.4, amplitude: 0.055 },
  { x: -5.8, z: -17.2, height: 1.20, phase: 5.9, yaw: 0.5, amplitude: 0.060 },
  { x: -4.4, z: -10.5, height: 1.10, phase: 1.7, yaw: -0.6, amplitude: 0.070 },
  { x: -2.0, z: -13.2, height: 1.50, phase: 2.4, yaw: 0.2, amplitude: 0.050 },
  { x: 0.6, z: -17.0, height: 1.35, phase: 0.8, yaw: 0.9, amplitude: 0.050 },
  { x: 3.0, z: -12.0, height: 1.25, phase: 3.1, yaw: -0.9, amplitude: 0.060 },
  { x: 5.6, z: -15.0, height: 1.60, phase: 4.6, yaw: 0.7, amplitude: 0.045 },
  { x: 7.2, z: -19.0, height: 1.40, phase: 1.2, yaw: -0.4, amplitude: 0.050 },
  { x: 8.6, z: -12.2, height: 1.00, phase: 5.3, yaw: -0.3, amplitude: 0.070 },
  { x: 10.8, z: -18.5, height: 1.30, phase: 3.8, yaw: -1.1, amplitude: 0.050 },
];

const BODY_BASE = new THREE.Color("#1b4a49");
const BODY_TIP = new THREE.Color("#72c8bc");

function createGlowTexture() {
  const size = 96;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, "rgba(235, 255, 251, 1)");
  gradient.addColorStop(0.18, "rgba(120, 255, 232, 0.58)");
  gradient.addColorStop(0.55, "rgba(38, 190, 180, 0.12)");
  gradient.addColorStop(1, "rgba(10, 80, 90, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createAbyssEels({ scene }) {
  const root = new THREE.Group();
  root.name = "AbyssEels";
  root.visible = false;
  scene.add(root);

  const bodyMaterial = new THREE.MeshStandardMaterial({
    color: "#ffffff",
    vertexColors: true,
    roughness: 0.8,
    metalness: 0,
    emissive: "#249a91",
    emissiveIntensity: 0.26,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const headMaterial = new THREE.MeshStandardMaterial({
    color: "#98e9dd",
    roughness: 0.52,
    metalness: 0,
    emissive: "#36c5b8",
    emissiveIntensity: 0.3,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const eyeMaterial = new THREE.MeshBasicMaterial({
    color: "#021414",
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });

  const glowMaterial = new THREE.SpriteMaterial({
    map: createGlowTexture(),
    color: "#8effef",
    transparent: true,
    opacity: 0,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
  });

  const headGeometry = new THREE.IcosahedronGeometry(0.088, 1);
  const eyeGeometry = new THREE.IcosahedronGeometry(0.019, 0);
  const eels = [];

  for (const config of EELS) {
    const h = config.height;
    const curve = new THREE.CatmullRomCurve3([
      new THREE.Vector3(0, 0, 0),
      new THREE.Vector3(0.04 * h, 0.24 * h, 0),
      new THREE.Vector3(-0.04 * h, 0.48 * h, 0.02 * h),
      new THREE.Vector3(0.03 * h, 0.70 * h, -0.01 * h),
      new THREE.Vector3(0.14 * h, 0.90 * h, 0.02 * h),
      new THREE.Vector3(0.20 * h, 0.97 * h, 0),
    ]);

    const bodyGeometry = new THREE.TubeGeometry(curve, 12, 0.047, 5, false);
    const sourcePositions = bodyGeometry.attributes.position;
    const bodyColors = new Float32Array(sourcePositions.count * 3);
    for (let i = 0; i < sourcePositions.count; i++) {
      const normalizedHeight = THREE.MathUtils.clamp(
        sourcePositions.getY(i) / h,
        0,
        1
      );
      const color = BODY_BASE.clone().lerp(BODY_TIP, normalizedHeight);
      bodyColors[i * 3] = color.r;
      bodyColors[i * 3 + 1] = color.g;
      bodyColors[i * 3 + 2] = color.b;
    }
    bodyGeometry.setAttribute(
      "color",
      new THREE.BufferAttribute(bodyColors, 3)
    );

    const headPoint = curve.getPoint(1);
    const group = new THREE.Group();
    group.position.set(
      config.x,
      sandHeight(config.x, config.z) + 0.02,
      config.z
    );
    group.rotation.y = config.yaw;

    const body = new THREE.Mesh(bodyGeometry, bodyMaterial);
    const head = new THREE.Mesh(headGeometry, headMaterial);
    head.position.copy(headPoint);
    head.scale.set(1.45, 0.7, 0.92);

    const eyeOffset = new THREE.Vector3(0.052 * h, 0.01, 0.045);
    const eyeLeft = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eyeLeft.position.copy(headPoint).add(eyeOffset);
    const eyeRight = new THREE.Mesh(eyeGeometry, eyeMaterial);
    eyeRight.position.copy(headPoint).add(
      new THREE.Vector3(-eyeOffset.x, eyeOffset.y, eyeOffset.z)
    );

    const glow = new THREE.Sprite(glowMaterial);
    glow.position.copy(headPoint);
    glow.scale.setScalar(0.45 + h * 0.12);
    glow.renderOrder = 2;

    group.add(body, head, eyeLeft, eyeRight, glow);
    root.add(group);
    eels.push({
      group,
      phase: config.phase,
      speed: 0.85 + config.phase * 0.08,
      amplitude: config.amplitude,
    });
  }

  function update(progress, t, reduceMotion) {
    const amount = THREE.MathUtils.smoothstep(progress, 0.8, 0.95);
    root.visible = amount > 0.002;
    bodyMaterial.opacity = amount;
    headMaterial.opacity = amount;
    eyeMaterial.opacity = amount;
    glowMaterial.opacity = amount * 0.12;
    if (!root.visible || reduceMotion) return;

    for (const eel of eels) {
      const sway = Math.sin(t * eel.speed + eel.phase);
      eel.group.rotation.z = sway * eel.amplitude;
      eel.group.rotation.x =
        Math.cos(t * eel.speed * 0.7 + eel.phase) * eel.amplitude * 0.5;
    }
  }

  return { update };
}
