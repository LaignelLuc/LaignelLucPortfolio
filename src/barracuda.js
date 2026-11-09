import * as THREE from "three";
import { bandVisibility } from "./species.js";
import { buildFishGeometry, createFishMaterial } from "./fish-school.js";

const FORWARD = new THREE.Vector3(0, 0, -1);

export function createBarracuda({ scene, camera, band }) {
  const geometry = buildFishGeometry({
    top: "#5b7075",
    belly: "#e7eee4",
    fin: "#a7bbb8",
    stripes: true,
    eyeColor: "#071014",
  });
  const material = createFishMaterial({
    instanced: false,
    swaySpeed: 3.4,
    swayAmount: 0.075,
    metalness: 0.26,
  });
  const mesh = new THREE.Mesh(geometry, material);
  mesh.name = "Barracuda";
  mesh.scale.set(0.82, 0.9, 1.38);
  mesh.frustumCulled = false;
  scene.add(mesh);

  const direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const z = -6.8;
  const centerY = 1.05;

  function update(t, progress, reduceMotion) {
    const visibility = bandVisibility(band, progress);
    material.opacity = visibility;
    mesh.visible = visibility > 0.002;
    if (!mesh.visible) return;

    const time = reduceMotion ? 0 : t;
    const distance = camera.position.z - z;
    const viewHeight =
      2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
    const halfWidth = (viewHeight * camera.aspect) / 2;
    const baseX = halfWidth * 0.64;

    const angle = time * 0.18 + 0.8;
    const x = baseX + Math.cos(angle) * 0.65;
    const y = centerY + Math.sin(angle * 0.9) * 0.2;
    const zz = z + Math.sin(angle) * 0.32;

    direction.set(
      -Math.sin(angle) * 0.65 * 0.18,
      Math.cos(angle * 0.9) * 0.2 * 0.9 * 0.18,
      Math.cos(angle) * 0.32 * 0.18
    );
    if (direction.lengthSq() < 1e-6) direction.set(0, 0, -1);
    direction.normalize();
    quaternion.setFromUnitVectors(FORWARD, direction);

    mesh.position.set(x, y, zz);
    mesh.quaternion.copy(quaternion);
    mesh.scale.set(0.82, 0.9, 1.38);
    const shader = material.userData.shader;
    if (shader) shader.uniforms.uSwayTime.value = time;
  }

  return { update };
}
