import * as THREE from "three";
import { bandVisibility } from "./species.js";

function createGlowTexture() {
  const size = 128;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, "rgba(225, 255, 255, 0.9)");
  gradient.addColorStop(0.3, "rgba(110, 230, 245, 0.32)");
  gradient.addColorStop(1, "rgba(40, 130, 160, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createTentacleGeometry(count, length) {
  const positions = [];
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const points = [];
    for (let k = 0; k <= 5; k++) {
      const t = k / 5;
      const radius = 0.52 * (1 - t * 0.45);
      points.push(
        new THREE.Vector3(
          Math.cos(angle + Math.sin(t * 3 + i) * 0.08) * radius,
          -t * length,
          Math.sin(angle + Math.sin(t * 3 + i) * 0.08) * radius
        )
      );
    }
    for (let k = 0; k < points.length - 1; k++) {
      positions.push(
        points[k].x, points[k].y, points[k].z,
        points[k + 1].x, points[k + 1].y, points[k + 1].z
      );
    }
  }
  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  return geometry;
}

/**
 * A few slow moon jellies in the twilight band and one distant abyssal jelly.
 * Each jelly is three draw calls at most (bell/rim share one material).
 */
export function createJellyfish({ scene, camera, configs }) {
  const glowTexture = createGlowTexture();
  const jellies = [];

  for (const config of configs) {
    const group = new THREE.Group();
    group.name = `Jellyfish-${config.id}`;
    group.visible = false;

    const material = new THREE.MeshStandardMaterial({
      color: config.color,
      emissive: config.color,
      emissiveIntensity: config.glow ?? 0.25,
      roughness: 0.32,
      metalness: 0,
      transparent: true,
      opacity: 0,
      depthWrite: false,
      side: THREE.DoubleSide,
    });

    const dome = new THREE.Mesh(
      new THREE.SphereGeometry(1, 12, 6, 0, Math.PI * 2, 0, Math.PI / 2),
      material
    );
    dome.scale.set(1, 0.56, 1);

    const rim = new THREE.Mesh(
      new THREE.TorusGeometry(1, 0.055, 4, 16),
      material
    );
    rim.rotation.x = Math.PI / 2;

    const tentacleMaterial = new THREE.LineBasicMaterial({
      color: config.color,
      transparent: true,
      opacity: 0,
      depthWrite: false,
    });
    const tentacles = new THREE.LineSegments(
      createTentacleGeometry(config.tentacles ?? 8, 1.65),
      tentacleMaterial
    );

    const glow = new THREE.Sprite(
      new THREE.SpriteMaterial({
        map: glowTexture,
        color: config.color,
        transparent: true,
        opacity: 0,
        blending: THREE.AdditiveBlending,
        depthWrite: false,
      })
    );
    glow.position.y = 0.12;
    glow.scale.setScalar(2.2);

    group.add(dome, rim, tentacles, glow);
    group.scale.setScalar(config.size);
    scene.add(group);
    jellies.push({
      group,
      material,
      tentacleMaterial,
      glow,
      config,
      baseOpacity: config.opacity ?? 0.3,
      phase: config.phase ?? 0,
    });
  }

  function update(t, progress, reduceMotion) {
    const time = reduceMotion ? 0 : t;
    for (const jelly of jellies) {
      const { config } = jelly;
      const visibility = bandVisibility(config.band, progress);
      jelly.group.visible = visibility > 0.002;
      jelly.material.opacity = visibility * jelly.baseOpacity;
      jelly.tentacleMaterial.opacity = visibility * 0.3;
      jelly.glow.material.opacity = visibility * (config.halo ?? 0.12);
      if (!jelly.group.visible) continue;

      const distance = camera.position.z - config.z;
      const viewHeight =
        2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
      const halfWidth = (viewHeight * camera.aspect) / 2;
      const x =
        halfWidth * config.xFactor +
        Math.sin(time * 0.12 + jelly.phase) * 0.18;
      const y =
        config.y + Math.sin(time * 0.32 + jelly.phase) * 0.12;
      jelly.group.position.set(x, y, config.z);
      jelly.group.rotation.z =
        Math.sin(time * 0.2 + jelly.phase) * 0.08;

      const pulse = 1 + Math.sin(time * 1.35 + jelly.phase) * 0.055;
      jelly.group.scale.set(
        config.size * pulse,
        config.size * (1 - Math.sin(time * 1.35 + jelly.phase) * 0.05),
        config.size * pulse
      );
    }
  }

  return { update };
}
