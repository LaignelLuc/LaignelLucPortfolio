import * as THREE from "three";
import { bandVisibility } from "./species.js";

function createSnowTexture() {
  const size = 32;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, "rgba(235, 250, 245, 0.9)");
  gradient.addColorStop(0.45, "rgba(190, 225, 215, 0.28)");
  gradient.addColorStop(1, "rgba(120, 180, 175, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMarineSnow({ scene, band, count = 190 }) {
  const positions = new Float32Array(count * 3);
  const speeds = new Float32Array(count);
  const phases = new Float32Array(count);

  for (let i = 0; i < count; i++) {
    positions[i * 3] = THREE.MathUtils.randFloatSpread(28);
    positions[i * 3 + 1] = THREE.MathUtils.randFloat(-19, -3.5);
    positions[i * 3 + 2] = THREE.MathUtils.randFloat(-25, -6);
    speeds[i] = THREE.MathUtils.randFloat(0.04, 0.16);
    phases[i] = Math.random() * Math.PI * 2;
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.BufferAttribute(positions, 3).setUsage(THREE.DynamicDrawUsage)
  );

  const material = new THREE.PointsMaterial({
    map: createSnowTexture(),
    color: "#b7d8d2",
    size: 0.11,
    sizeAttenuation: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    alphaTest: 0.015,
  });

  const points = new THREE.Points(geometry, material);
  points.name = "MarineSnow";
  points.frustumCulled = false;
  points.renderOrder = 1;
  scene.add(points);

  const positionAttribute = geometry.attributes.position;

  function update(dt, t, progress, reduceMotion) {
    const visibility = bandVisibility(band, progress);
    material.opacity = visibility * 0.7;
    points.visible = visibility > 0.002;
    if (!points.visible || reduceMotion) return;

    for (let i = 0; i < count; i++) {
      let y = positions[i * 3 + 1] - speeds[i] * dt;
      if (y < -19) y = -3.5;
      positions[i * 3 + 1] = y;
      positions[i * 3] +=
        Math.sin(t * 0.35 + phases[i]) * 0.012 * dt;
    }
    positionAttribute.needsUpdate = true;
  }

  return { update };
}
