import * as THREE from "three";

const SAND_BASE_Y = -14.2;

export function sandHeight(x, z) {
  return (
    SAND_BASE_Y +
    0.38 * Math.sin(x * 0.18 + z * 0.09) +
    0.22 * Math.sin(x * 0.08 - z * 0.23) +
    0.12 * Math.sin(x * 0.5 + z * 0.36) +
    0.05 * Math.sin(x * 0.9 - z * 0.6)
  );
}

export function createSeafloor() {
  const group = new THREE.Group();
  group.name = "Seafloor";

  const geometry = new THREE.PlaneGeometry(320, 70, 140, 56);
  geometry.rotateX(-Math.PI / 2);
  geometry.translate(0, 0, -20);
  const positions = geometry.attributes.position;
  const colors = new Float32Array(positions.count * 4);
  const sandColor = new THREE.Color("#4d4130");
  const deepColor = new THREE.Color("#08151d");

  for (let i = 0; i < positions.count; i++) {
    const x = positions.getX(i);
    const z = positions.getZ(i);
    positions.setY(i, sandHeight(x, z));

    const near = THREE.MathUtils.smoothstep(z, -52, -8);
    const color = sandColor.clone().lerp(deepColor, 1 - near);
    color.multiplyScalar(0.86 + 0.14 * Math.sin(x * 0.55 + z * 0.37));
    colors[i * 4] = color.r;
    colors[i * 4 + 1] = color.g;
    colors[i * 4 + 2] = color.b;
    colors[i * 4 + 3] = THREE.MathUtils.smoothstep(z, -54, -28);
  }

  geometry.setAttribute("color", new THREE.BufferAttribute(colors, 4));
  geometry.computeVertexNormals();

  const sandMaterial = new THREE.MeshStandardMaterial({
    vertexColors: true,
    roughness: 1,
    metalness: 0,
    flatShading: true,
    transparent: true,
    opacity: 0,
    depthWrite: false,
  });
  const sand = new THREE.Mesh(geometry, sandMaterial);
  sand.renderOrder = -2;
  group.add(sand);

  const rockMaterials = [
    new THREE.MeshStandardMaterial({
      color: "#2e2b27",
      roughness: 1,
      flatShading: true,
      transparent: true,
      opacity: 0,
    }),
    new THREE.MeshStandardMaterial({
      color: "#3f3930",
      roughness: 1,
      flatShading: true,
      transparent: true,
      opacity: 0,
    }),
    new THREE.MeshStandardMaterial({
      color: "#242b30",
      roughness: 1,
      flatShading: true,
      transparent: true,
      opacity: 0,
    }),
  ];
  const rockGeometry = new THREE.DodecahedronGeometry(1, 0);
  const rocks = [
    [-6.8, -12.5, 1.35, 0],
    [4.6, -9.2, 0.9, 1],
    [8.5, -16.5, 1.8, 2],
    [-9.5, -18, 1.4, 0],
    [2.4, -14, 0.6, 1],
    [-3.2, -8.4, 0.55, 2],
    [6.4, -6.8, 0.8, 0],
    [-1.8, -19, 0.9, 2],
    [11.5, -23, 2.1, 1],
    [-13, -25, 1.8, 0],
    [-2.9, -10.2, 0.3, 1],
    [2.7, -11.1, 0.25, 0],
    [1.2, -7.8, 0.32, 2],
  ];

  for (const [x, z, scale, materialIndex] of rocks) {
    const rock = new THREE.Mesh(rockGeometry, rockMaterials[materialIndex]);
    rock.position.set(x, sandHeight(x, z) + scale * 0.35, z);
    rock.rotation.set(0.2 + Math.random() * 0.2, Math.random() * Math.PI, 0.1);
    rock.scale.set(scale * 1.3, scale * 0.7, scale * 1.1);
    group.add(rock);
  }

  group.visible = false;
  const materials = [sandMaterial, ...rockMaterials];

  function setOpacity(amount) {
    group.visible = amount > 0.002;
    for (const material of materials) material.opacity = amount;
  }

  return { group, setOpacity };
}
