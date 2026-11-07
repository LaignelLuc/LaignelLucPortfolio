import * as THREE from "three";

const TAU = Math.PI * 2;

function add(parent, geometry, material, options = {}) {
  const mesh = new THREE.Mesh(geometry, material);
  if (options.position) mesh.position.set(...options.position);
  if (options.rotation) mesh.rotation.set(...options.rotation);
  if (options.scale) mesh.scale.set(...options.scale);
  mesh.name = options.name ?? "";
  parent.add(mesh);
  return mesh;
}

function makeMaterials(accent) {
  return {
    shell: new THREE.MeshPhysicalMaterial({
      color: 0xeef6f5,
      roughness: 0.34,
      metalness: 0.14,
      clearcoat: 0.7,
      clearcoatRoughness: 0.22,
    }),
    shellShade: new THREE.MeshStandardMaterial({
      color: 0xc8d8da,
      roughness: 0.5,
      metalness: 0.2,
    }),
    dark: new THREE.MeshStandardMaterial({
      color: 0x0c1d26,
      roughness: 0.42,
      metalness: 0.68,
    }),
    rubber: new THREE.MeshStandardMaterial({
      color: 0x061117,
      roughness: 0.9,
      metalness: 0.08,
    }),
    glass: new THREE.MeshPhysicalMaterial({
      color: 0x08232d,
      roughness: 0.06,
      metalness: 0.25,
      transparent: true,
      opacity: 0.8,
      clearcoat: 1,
      clearcoatRoughness: 0.04,
      emissive: 0x0b3d48,
      emissiveIntensity: 0.45,
    }),
    blade: new THREE.MeshStandardMaterial({
      color: 0x22343c,
      roughness: 0.4,
      metalness: 0.72,
    }),
    accent: new THREE.MeshStandardMaterial({
      color: accent,
      emissive: accent,
      emissiveIntensity: 2.8,
      roughness: 0.32,
      metalness: 0.1,
      toneMapped: false,
    }),
    accentSoft: new THREE.MeshBasicMaterial({
      color: accent,
      transparent: true,
      opacity: 0.3,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
    glow: new THREE.SpriteMaterial({
      map: null, // filled by the fleet
      color: accent,
      transparent: true,
      opacity: 0.16,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      toneMapped: false,
    }),
  };
}

function makeRotor(materials, { sign, radius, axis = "z" }) {
  const rotor = new THREE.Group();
  const bladeGeometry = new THREE.BoxGeometry(radius * 0.86, 0.038, 0.014);
  for (let i = 0; i < 3; i++) {
    const pivot = new THREE.Group();
    pivot.rotation[axis] = (i / 3) * TAU;
    const blade = new THREE.Mesh(bladeGeometry, materials.blade);
    blade.position.x = radius * 0.46;
    blade.rotation.x = 0.4;
    pivot.add(blade);
    rotor.add(pivot);
  }
  const hub = add(
    rotor,
    new THREE.CylinderGeometry(0.034, 0.042, 0.07, 14),
    materials.dark,
    { rotation: [Math.PI / 2, 0, 0], position: [0, 0, sign * 0.035] }
  );
  hub.name = "RotorHub";
  return rotor;
}

function addPod(group, materials, { sign, x, y, z, radius, spin }) {
  const pod = new THREE.Group();
  pod.position.set(x, y, z);
  pod.name = "ThrusterPod";

  // Strut linking the duct to the hull, tucked behind the fan face.
  const strutLength = Math.max(0.18, Math.abs(x) - 0.28);
  add(
    pod,
    new THREE.CylinderGeometry(0.033, 0.045, strutLength, 12),
    materials.shellShade,
    {
      rotation: [0, 0, Math.PI / 2],
      position: [
        -sign * (0.28 + strutLength / 2),
        0,
        -(radius * 0.28 + 0.015),
      ],
    }
  );

  // The duct itself: a chunky white ring with a dark throat.
  add(
    pod,
    new THREE.TorusGeometry(radius, radius * 0.28, 12, 32),
    materials.shell,
    { name: "Duct" }
  );
  add(
    pod,
    new THREE.TorusGeometry(radius * 0.82, 0.011, 8, 32),
    materials.dark
  );
  add(
    pod,
    new THREE.CylinderGeometry(
      radius * 0.68,
      radius * 0.68,
      0.1,
      28,
      1,
      true
    ),
    new THREE.MeshStandardMaterial({
      color: 0x031017,
      roughness: 0.82,
      metalness: 0.2,
      side: THREE.DoubleSide,
    }),
    { rotation: [Math.PI / 2, 0, 0] }
  );
  add(
    pod,
    new THREE.TorusGeometry(radius * 0.74, 0.009, 6, 28),
    materials.accent,
    { position: [0, 0, 0.02] }
  );
  add(
    pod,
    new THREE.CircleGeometry(radius * 0.66, 28),
    materials.accentSoft,
    { position: [0, 0, -0.015] }
  );

  const rotor = makeRotor(materials, { sign, radius });
  rotor.position.z = 0.03;
  pod.add(rotor);

  group.add(pod);
  return { pod, rotor, spin };
}

function addFin(group, materials, variant) {
  const fin = new THREE.Group();
  fin.position.set(0.02, 0.46, -0.25);
  fin.rotation.set(0.06, 0.3, -0.06);

  if (variant === 1) {
    // Taller, narrower sonar paddle.
    add(
      fin,
      new THREE.CylinderGeometry(0.17, 0.17, 0.034, 32),
      materials.shell,
      { rotation: [Math.PI / 2, 0, 0], name: "FinDisc" }
    );
    add(
      fin,
      new THREE.TorusGeometry(0.17, 0.013, 8, 32),
      materials.shellShade
    );
    add(
      fin,
      new THREE.TorusGeometry(0.105, 0.006, 6, 28),
      materials.dark,
      { position: [0, 0, 0.019] }
    );
    fin.scale.set(1, 1.28, 1);
  } else if (variant === 2) {
    // Twin small discs on a low cross-bar.
    add(
      fin,
      new THREE.CapsuleGeometry(0.028, 0.4, 5, 10),
      materials.shellShade,
      { rotation: [0, 0, Math.PI / 2], position: [0, 0.02, 0] }
    );
    for (const side of [-1, 1]) {
      const disc = new THREE.Group();
      disc.position.set(side * 0.21, 0.06, 0);
      disc.rotation.y = 0.28;
      add(disc, new THREE.CylinderGeometry(0.085, 0.085, 0.03, 24), materials.shell, {
        rotation: [Math.PI / 2, 0, 0],
      });
      add(disc, new THREE.CylinderGeometry(0.03, 0.03, 0.034, 16), materials.accent, {
        rotation: [Math.PI / 2, 0, 0],
      });
      fin.add(disc);
    }
  } else {
    // The round paddle of the reference vehicle.
    add(
      fin,
      new THREE.CylinderGeometry(0.185, 0.185, 0.036, 36),
      materials.shell,
      { rotation: [Math.PI / 2, 0, 0], name: "FinDisc" }
    );
    add(
      fin,
      new THREE.TorusGeometry(0.185, 0.014, 8, 36),
      materials.shellShade
    );
    add(fin, new THREE.CylinderGeometry(0.042, 0.05, 0.042, 16), materials.dark, {
      rotation: [Math.PI / 2, 0, 0],
    });
    add(fin, new THREE.CylinderGeometry(0.016, 0.016, 0.03, 12), materials.accent, {
      rotation: [Math.PI / 2, 0, 0],
      position: [0, 0, 0.014],
    });
  }

  // Stalk down to the hull.
  add(
    fin,
    new THREE.CylinderGeometry(0.032, 0.045, 0.17, 12),
    materials.shellShade,
    { position: [0, -0.14, 0] }
  );
  group.add(fin);
}

function addAntenna(group, materials, x, z, height, lean) {
  const antenna = new THREE.Group();
  antenna.position.set(x, 0.31, z);
  antenna.rotation.z = lean;
  add(
    antenna,
    new THREE.CylinderGeometry(0.006, 0.009, height, 6),
    materials.dark,
    { position: [0, height / 2, 0] }
  );
  add(
    antenna,
    new THREE.SphereGeometry(0.018, 10, 8),
    materials.accent,
    { position: [0, height, 0] }
  );
  group.add(antenna);
}

export function buildDrone({ accent, variant = 0, glowTexture }) {
  const materials = makeMaterials(accent);
  if (glowTexture) materials.glow.map = glowTexture;

  const root = new THREE.Group();
  root.name = "ProjectDrone";

  // --- Hull ---------------------------------------------------------------
  const bodyGeometry = new THREE.CapsuleGeometry(0.34, 0.78, 10, 28);
  bodyGeometry.rotateX(Math.PI / 2);
  add(root, bodyGeometry, materials.shell, { name: "Hull" });

  // A shaded belly plate and two slim keel rails give the capsule a craft-like
  // silhouette instead of a plain pill.
  add(
    root,
    new THREE.CapsuleGeometry(0.17, 0.52, 8, 20),
    materials.shellShade,
    { rotation: [Math.PI / 2, 0, 0], position: [0, -0.29, -0.02], scale: [1, 1, 0.5] }
  );
  for (const side of [-1, 1]) {
    add(
      root,
      new THREE.CapsuleGeometry(0.026, 0.48, 5, 10),
      materials.shellShade,
      {
        rotation: [Math.PI / 2, 0, 0],
        position: [side * 0.17, -0.36, -0.04],
      }
    );
  }

  // Panel seams.
  for (const z of [0.16, -0.2]) {
    add(
      root,
      new THREE.TorusGeometry(0.345, 0.0065, 6, 48),
      materials.dark,
      { position: [0, 0, z] }
    );
  }

  // --- Cockpit ------------------------------------------------------------
  const canopy = add(
    root,
    new THREE.SphereGeometry(0.26, 32, 18, 0, TAU, 0, Math.PI / 2),
    materials.glass,
    {
      position: [0, 0.29, 0.16],
      scale: [1.02, 0.82, 1.28],
      name: "Canopy",
    }
  );
  canopy.renderOrder = 2;

  const rimGeometry = new THREE.TorusGeometry(0.26, 0.018, 8, 36);
  rimGeometry.rotateX(Math.PI / 2);
  rimGeometry.scale(1.02, 1, 1.28);
  add(root, rimGeometry, materials.dark, { position: [0, 0.295, 0.16] });

  // Tiny instrument glow under the canopy.
  add(
    root,
    new THREE.BoxGeometry(0.15, 0.025, 0.2),
    materials.accentSoft,
    { position: [0.02, 0.325, 0.19], rotation: [0.1, -0.25, 0] }
  );

  // --- Nose ring + sensor ------------------------------------------------
  add(
    root,
    new THREE.TorusGeometry(0.248, 0.015, 8, 36),
    materials.shellShade,
    { position: [0, 0, 0.635] }
  );
  add(
    root,
    new THREE.SphereGeometry(0.055, 18, 14),
    materials.dark,
    { position: [0, 0.03, 0.71], scale: [1, 1, 0.75] }
  );
  add(
    root,
    new THREE.SphereGeometry(0.022, 14, 10),
    materials.accent,
    { position: [0, 0.032, 0.752], scale: [1, 1, 0.55] }
  );
  for (const side of [-1, 1]) {
    add(
      root,
      new THREE.SphereGeometry(0.012, 8, 6),
      materials.accent,
      { position: [side * 0.175, -0.09, 0.585] }
    );
    add(
      root,
      new THREE.SphereGeometry(0.055, 12, 8),
      materials.accentSoft,
      { position: [side * 0.19, -0.1, 0.61] }
    );
  }

  // --- Belly camera -------------------------------------------------------
  const gimbal = new THREE.Group();
  gimbal.position.set(0, -0.31, 0.31);
  add(gimbal, new THREE.SphereGeometry(0.085, 18, 14), materials.dark, {
    scale: [1, 0.85, 1],
  });
  add(gimbal, new THREE.TorusGeometry(0.062, 0.011, 6, 22), materials.shellShade, {
    rotation: [Math.PI / 2, 0, 0],
    position: [0, -0.035, 0],
  });
  add(gimbal, new THREE.SphereGeometry(0.032, 12, 10), materials.accent, {
    position: [0, -0.06, 0.03],
    scale: [1, 0.7, 1],
  });
  root.add(gimbal);

  // --- Thruster pods ------------------------------------------------------
  const pods = [];
  if (variant === 1) {
    // Two big side fans, closer to the reference scooter.
    for (const side of [-1, 1]) {
      pods.push(
        addPod(root, materials, {
          sign: side,
          x: side * 0.62,
          y: -0.01,
          z: 0.03,
          radius: 0.235,
          spin: (side > 0 ? 1 : -1) * 10,
        })
      );
    }
  } else if (variant === 2) {
    // Three compact pods per side: a workhorse survey drone.
    for (const side of [-1, 1]) {
      for (const z of [0.38, 0.02, -0.34]) {
        pods.push(
          addPod(root, materials, {
            sign: side,
            x: side * 0.54,
            y: 0,
            z,
            radius: 0.155,
            spin: (side > 0 ? 1 : -1) * 12,
          })
        );
      }
    }
  } else if (variant === 3) {
    // Two large side fans plus two compact rear outriggers: the heavy-lift
    // server drone of the fleet.
    for (const side of [-1, 1]) {
      pods.push(
        addPod(root, materials, {
          sign: side,
          x: side * 0.62,
          y: -0.01,
          z: 0.06,
          radius: 0.215,
          spin: (side > 0 ? 1 : -1) * 10,
        })
      );
      pods.push(
        addPod(root, materials, {
          sign: side,
          x: side * 0.34,
          y: 0,
          z: -0.52,
          radius: 0.115,
          spin: (side > 0 ? 1 : -1) * 14,
        })
      );
    }
  } else {
    for (const side of [-1, 1]) {
      for (const [z, radius] of [
        [0.31, 0.185],
        [-0.28, 0.17],
      ]) {
        pods.push(
          addPod(root, materials, {
            sign: side,
            x: side * 0.57,
            y: 0,
            z,
            radius,
            spin: (side > 0 ? 1 : -1) * 11,
          })
        );
      }
    }
  }

  // --- Tail ring ----------------------------------------------------------
  add(
    root,
    new THREE.TorusGeometry(0.215, 0.037, 10, 32),
    materials.shellShade,
    { position: [0, 0, -0.67] }
  );
  add(
    root,
    new THREE.CircleGeometry(0.16, 28),
    materials.accentSoft,
    { position: [0, 0, -0.7], rotation: [0, Math.PI, 0] }
  );
  add(
    root,
    new THREE.SphereGeometry(0.055, 16, 12),
    materials.accent,
    { position: [0, 0, -0.725], scale: [1, 1, 0.55] }
  );

  // --- Dorsal details -----------------------------------------------------
  addFin(root, materials, variant);

  // Vent plate with three glowing slots.
  add(
    root,
    new THREE.BoxGeometry(0.22, 0.014, 0.13),
    materials.dark,
    { position: [0, 0.337, -0.4], rotation: [0.06, 0, 0] }
  );
  for (let i = 0; i < 3; i++) {
    add(
      root,
      new THREE.BoxGeometry(0.17, 0.004, 0.012),
      materials.accent,
      { position: [0, 0.346, -0.445 + i * 0.04], rotation: [0.06, 0, 0] }
    );
  }

  // Projector lens at the top rear.
  const projector = new THREE.Group();
  projector.position.set(0, 0.345, -0.09);
  add(projector, new THREE.CylinderGeometry(0.062, 0.075, 0.065, 18), materials.dark, {
    position: [0, 0.02, 0],
  });
  add(projector, new THREE.TorusGeometry(0.055, 0.009, 6, 22), materials.shellShade, {
    rotation: [Math.PI / 2, 0, 0],
    position: [0, 0.053, 0],
  });
  add(projector, new THREE.CircleGeometry(0.038, 20), materials.accent, {
    rotation: [-Math.PI / 2, 0, 0],
    position: [0, 0.056, 0],
  });
  root.add(projector);

  const projectorAnchor = new THREE.Object3D();
  projectorAnchor.position.set(0, 0.43, -0.06);
  root.add(projectorAnchor);

  if (variant !== 1) {
    addAntenna(root, materials, -0.16, -0.08, 0.24, 0.16);
  }
  if (variant !== 0) {
    addAntenna(root, materials, 0.17, -0.34, 0.2, -0.2);
  }
  if (variant === 2) {
    addAntenna(root, materials, 0.11, -0.02, 0.3, -0.1);
  }

  // --- Glow dressing ------------------------------------------------------
  const glows = [];
  const addGlow = (size, opacity, position) => {
    if (!glowTexture) return null;
    const material = new THREE.SpriteMaterial({
      map: glowTexture,
      color: accent,
      transparent: true,
      opacity,
      blending: THREE.AdditiveBlending,
      depthWrite: false,
      depthTest: false,
      toneMapped: false,
    });
    const sprite = new THREE.Sprite(material);
    sprite.scale.setScalar(size);
    sprite.position.set(...position);
    sprite.userData.baseOpacity = opacity;
    root.add(sprite);
    glows.push(sprite);
    return sprite;
  };

  addGlow(2.3, 0.12, [0, 0, -0.42]);
  addGlow(0.56, 0.85, [0, 0.47, -0.06]);
  for (const pod of pods) {
    addGlow(
      0.34,
      0.32,
      [pod.pod.position.x + Math.sign(pod.pod.position.x) * 0.09, 0, pod.pod.position.z]
    );
  }
  addGlow(0.45, 0.5, [0, 0, -0.78]);

  // --- Fade bookkeeping ---------------------------------------------------
  const unique = new Set();
  root.traverse((object) => {
    if (!object.material) return;
    const list = Array.isArray(object.material) ? object.material : [object.material];
    for (const material of list) unique.add(material);
  });
  const materialsToFade = [...unique].map((material) => {
    material.transparent = true;
    return { material, baseOpacity: material.opacity };
  });

  return {
    root,
    projector: projectorAnchor,
    rotors: pods,
    materials: materialsToFade,
    glows,
    accent,
  };
}
