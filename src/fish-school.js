import * as THREE from "three";
import { bandVisibility } from "./species.js";

const FORWARD = new THREE.Vector3(0, 0, -1);

function smoothstep(value, min, max) {
  const t = Math.min(1, Math.max(0, (value - min) / (max - min)));
  return t * t * (3 - 2 * t);
}

/**
 * Unit-length low-poly fish. Nose points to -Z, tail to +Z.
 * Colours are baked per vertex so a whole school shares one material.
 */
export function buildFishGeometry({
  top = "#2f5666",
  belly = "#e8efe5",
  fin = "#b9cac6",
  stripes = false,
  eyeColor = "#071014",
  showEye = true,
} = {}) {
  const positions = [];
  const colors = [];
  const indices = [];
  const topColor = new THREE.Color(top);
  const bellyColor = new THREE.Color(belly);
  const finColor = new THREE.Color(fin);
  const eyeTint = new THREE.Color(eyeColor);

  const addVertex = (x, y, z, color) => {
    positions.push(x, y, z);
    colors.push(color.r, color.g, color.b);
    return positions.length / 3 - 1;
  };

  const profile = [
    { u: 0.03, r: 0.035 },
    { u: 0.10, r: 0.105 },
    { u: 0.23, r: 0.15 },
    { u: 0.42, r: 0.16 },
    { u: 0.62, r: 0.125 },
    { u: 0.80, r: 0.085 },
    { u: 0.95, r: 0.035 },
  ];
  const segments = 6;
  const rings = [];

  for (const { u, r } of profile) {
    const z = -0.5 + u;
    const ring = [];
    for (let j = 0; j < segments; j++) {
      const angle = (j / segments) * Math.PI * 2;
      const v = Math.sin(angle);
      const color = bellyColor.clone().lerp(topColor, smoothstep(v, -0.15, 0.8));
      // Mackerel-like vertical bars, top half only.
      if (stripes && v > -0.1 && Math.sin(u * Math.PI * 10) > 0.45) {
        color.multiplyScalar(0.68);
      }
      ring.push(
        addVertex(Math.cos(angle) * r, v * r * 1.35, z, color)
      );
    }
    rings.push(ring);
  }

  // Body rings.
  for (let i = 0; i < rings.length - 1; i++) {
    const a = rings[i];
    const b = rings[i + 1];
    for (let j = 0; j < segments; j++) {
      const k = (j + 1) % segments;
      indices.push(a[j], a[k], b[j], a[k], b[k], b[j]);
    }
  }

  // Nose and tail caps.
  const nose = addVertex(0, 0, -0.52, topColor);
  const tail = addVertex(0, 0, 0.5, finColor);
  for (let j = 0; j < segments; j++) {
    const k = (j + 1) % segments;
    indices.push(nose, rings[0][k], rings[0][j]);
    indices.push(rings[rings.length - 1][j], rings[rings.length - 1][k], tail);
  }

  // Forked tail fin.
  const rootTop = addVertex(0, 0.025, 0.47, finColor);
  const rootBottom = addVertex(0, -0.025, 0.47, finColor);
  const topTip = addVertex(0, 0.28, 0.68, finColor);
  const notch = addVertex(0, 0.0, 0.56, finColor);
  const bottomTip = addVertex(0, -0.28, 0.68, finColor);
  indices.push(rootTop, topTip, notch);
  indices.push(rootBottom, notch, bottomTip);

  // Dorsal fin.
  const dorsalBaseFront = addVertex(0, 0.13, -0.17, finColor);
  const dorsalBaseBack = addVertex(0, 0.13, 0.14, finColor);
  const dorsalPeak = addVertex(0, 0.34, -0.02, finColor);
  indices.push(dorsalBaseFront, dorsalPeak, dorsalBaseBack);

  // Pectoral fins.
  for (const side of [-1, 1]) {
    const root = addVertex(side * 0.095, -0.02, -0.05, finColor);
    const tip = addVertex(side * 0.245, -0.105, 0.11, finColor);
    const rear = addVertex(side * 0.06, -0.02, 0.12, finColor);
    indices.push(root, tip, rear);
  }

  // Simple flat side eyes.
  if (showEye) {
    for (const side of [-1, 1]) {
      const x = side * 0.156;
      const e0 = addVertex(x, 0.065, -0.35, eyeTint);
      const e1 = addVertex(x, 0.065, -0.295, eyeTint);
      const e2 = addVertex(x, 0.02, -0.295, eyeTint);
      const e3 = addVertex(x, 0.02, -0.35, eyeTint);
      indices.push(e0, e1, e2, e0, e2, e3);
    }
  }

  const geometry = new THREE.BufferGeometry();
  geometry.setAttribute(
    "position",
    new THREE.Float32BufferAttribute(positions, 3)
  );
  geometry.setAttribute("color", new THREE.Float32BufferAttribute(colors, 3));
  geometry.setIndex(indices);
  geometry.computeVertexNormals();
  geometry.computeBoundingSphere();
  return geometry;
}

/** Shared fish material with a tiny vertex-shader tail beat. */
export function createFishMaterial({
  instanced = true,
  swaySpeed = 4.2,
  swayAmount = 0.05,
  roughness = 0.54,
  metalness = 0.18,
} = {}) {
  const material = new THREE.MeshStandardMaterial({
    vertexColors: true,
    flatShading: true,
    roughness,
    metalness,
    transparent: true,
    opacity: 0,
    depthWrite: false,
    side: THREE.DoubleSide,
  });

  material.onBeforeCompile = (shader) => {
    shader.uniforms.uSwayTime = { value: 0 };
    shader.uniforms.uSwaySpeed = { value: swaySpeed };
    shader.uniforms.uSwayAmount = { value: swayAmount };
    shader.vertexShader =
      (instanced ? "attribute float aPhase;\n" : "") +
      "uniform float uSwayTime;\n" +
      "uniform float uSwaySpeed;\n" +
      "uniform float uSwayAmount;\n" +
      shader.vertexShader;
    shader.vertexShader = shader.vertexShader.replace(
      "#include <begin_vertex>",
      `#include <begin_vertex>
      float tailWeight = smoothstep(0.0, 0.64, position.z);
      float phase = ${instanced ? "aPhase" : "0.0"};
      transformed.x += sin(uSwayTime * uSwaySpeed + phase + position.z * 5.0)
        * uSwayAmount * tailWeight;`
    );
    material.userData.shader = shader;
  };

  return material;
}

function updateSway(material, time) {
  const shader = material.userData.shader;
  if (shader) shader.uniforms.uSwayTime.value = time;
}

/**
 * A loose, swirling school of fish rendered with one InstancedMesh.
 */
export function createFishSchool({
  scene,
  camera,
  name,
  band,
  count = 40,
  length = 0.46,
  centerY = 1.1,
  z = -7.6,
  xFactor = 0.4,
  radius = 1.45,
  vertical = 0.9,
  speed = 0.8,
  phase = 0,
  colors = {},
  stripes = false,
  swaySpeed = 4.2,
  swayAmount = 0.05,
}) {
  const geometry = buildFishGeometry({ ...colors, stripes });
  const material = createFishMaterial({ instanced: true, swaySpeed, swayAmount });
  const mesh = new THREE.InstancedMesh(geometry, material, count);
  mesh.name = name ?? "FishSchool";
  mesh.frustumCulled = false;
  mesh.instanceMatrix.setUsage(THREE.DynamicDrawUsage);

  const seeds = [];
  const phases = new Float32Array(count);
  const dummy = new THREE.Object3D();
  const direction = new THREE.Vector3();
  const quaternion = new THREE.Quaternion();
  const tint = new THREE.Color();

  for (let i = 0; i < count; i++) {
    const seed = {
      angle: (i / count) * Math.PI * 2 + THREE.MathUtils.randFloat(-0.22, 0.22),
      phase: Math.random() * Math.PI * 2,
      radius: radius * THREE.MathUtils.randFloat(0.55, 1.05),
      y: THREE.MathUtils.randFloatSpread(vertical),
      scale: length * THREE.MathUtils.randFloat(0.82, 1.12),
      orbit: THREE.MathUtils.randFloat(0.8, 1.2),
    };
    seeds.push(seed);
    phases[i] = seed.phase;

    const shade = THREE.MathUtils.randFloat(0.9, 1.04);
    tint.setRGB(shade, shade, shade);
    mesh.setColorAt(i, tint);
  }
  geometry.setAttribute(
    "aPhase",
    new THREE.InstancedBufferAttribute(phases, 1)
  );
  if (mesh.instanceColor) mesh.instanceColor.needsUpdate = true;

  scene.add(mesh);

  function update(t, progress, reduceMotion) {
    const visibility = bandVisibility(band, progress);
    material.opacity = visibility;
    mesh.visible = visibility > 0.002;
    if (!mesh.visible) return;

    updateSway(material, reduceMotion ? 0 : t);
    const time = reduceMotion ? 0 : t;
    const distance = camera.position.z - z;
    const viewHeight =
      2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
    const halfWidth = (viewHeight * camera.aspect) / 2;
    const centerX =
      halfWidth * xFactor + Math.sin(time * 0.1 + phase) * 0.28;
    const centerYNow = centerY + Math.sin(time * 0.12 + phase) * 0.12;

    for (let i = 0; i < count; i++) {
      const seed = seeds[i];
      const angle =
        seed.angle +
        time * speed * seed.orbit +
        Math.sin(time * 0.3 + seed.phase) * 0.08;
      const r = seed.radius;
      const x = centerX + Math.cos(angle) * r;
      const y =
        centerYNow +
        seed.y +
        Math.sin(angle * 1.6 + time * 0.6 + seed.phase) * r * 0.4;
      const zz =
        z + Math.sin(angle) * r * 0.5 + Math.sin(time * 0.2 + seed.phase) * 0.04;

      direction.set(
        -Math.sin(angle) * r,
        Math.cos(angle * 1.6 + time * 0.6 + seed.phase) * r * 0.4 * 0.35,
        Math.cos(angle) * r * 0.5
      );
      if (direction.lengthSq() < 1e-6) direction.set(0, 0, -1);
      direction.normalize();
      quaternion.setFromUnitVectors(FORWARD, direction);

      dummy.position.set(x, y, zz);
      dummy.quaternion.copy(quaternion);
      dummy.scale.setScalar(seed.scale);
      dummy.updateMatrix();
      mesh.setMatrixAt(i, dummy.matrix);
    }
    mesh.instanceMatrix.needsUpdate = true;
  }

  return { mesh, material, update };
}
