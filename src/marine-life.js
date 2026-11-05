import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";
import { bandVisibility, DEPTH_BANDS, SPECIES } from "./species.js";
import { sandHeight } from "./seafloor.js";

// Radial falloff for the bioluminescent halo around the lanternfish lure.
function createGlowTexture() {
  const size = 256;
  const canvas = document.createElement("canvas");
  canvas.width = canvas.height = size;
  const context = canvas.getContext("2d");
  const gradient = context.createRadialGradient(
    size / 2, size / 2, 0,
    size / 2, size / 2, size / 2
  );
  gradient.addColorStop(0, "rgba(240, 255, 255, 1)");
  gradient.addColorStop(0.08, "rgba(170, 252, 255, 0.95)");
  gradient.addColorStop(0.24, "rgba(90, 226, 255, 0.5)");
  gradient.addColorStop(0.55, "rgba(30, 150, 210, 0.14)");
  gradient.addColorStop(1, "rgba(0, 60, 100, 0)");
  context.fillStyle = gradient;
  context.fillRect(0, 0, size, size);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

export function createMarineLife({ scene, camera, reduceMotion }) {
  const swimmers = [];
  const loader = new GLTFLoader();
  const glowTexture = createGlowTexture();
  const lurePosition = new THREE.Vector3();

  function spawnSwimmer(swimmer, startFraction = null) {
    const { y, z } = swimmer.lane;
    swimmer.z = THREE.MathUtils.lerp(z[0], z[1], Math.random());
    // When first placed inside the view, swim toward the middle instead of
    // straight off the nearest edge.
    swimmer.direction =
      startFraction === null
        ? (Math.random() < 0.5 ? -1 : 1)
        : startFraction > 0.5 ? -1 : 1;
    const distance = camera.position.z - swimmer.z;
    const viewHeight =
      2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
    const viewWidth = viewHeight * camera.aspect;
    const margin = Math.max(0.75, swimmer.length * 0.65);
    const halfPath = viewWidth / 2 + margin;

    swimmer.y = THREE.MathUtils.lerp(y[0], y[1], Math.random());
    const startHalf = Math.max(0, viewWidth / 2 - swimmer.length * 0.6);
    swimmer.x = reduceMotion
      ? THREE.MathUtils.lerp(-startHalf, startHalf, startFraction ?? 0.5)
      : startFraction === null
        ? swimmer.direction * -halfPath
        : THREE.MathUtils.lerp(-startHalf, startHalf, startFraction);
    swimmer.root.rotation.y =
      swimmer.direction > 0 ? Math.PI / 2 : -Math.PI / 2;
  }

  for (const band of DEPTH_BANDS) {
    for (const [index, lane] of band.creatures.entries()) {
      const creature = SPECIES[lane.species];
      const startFraction = THREE.MathUtils.clamp(
        (index + 1) / (band.creatures.length + 1) +
          THREE.MathUtils.randFloat(-0.06, 0.06),
        0.18,
        0.82
      );
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
          model.position.set(
            -center.x * scale,
            -center.y * scale,
            -center.z * scale
          );

          const materials = [];
          model.traverse((object) => {
            if (!object.isMesh) return;
            const meshMaterials = Array.isArray(object.material)
              ? object.material
              : [object.material];
            for (const material of meshMaterials) {
              const color = creature.colors[material.name];
              if (color && !material.map && material.color) {
                material.color.set(color);
              }
              if (creature.glow && material.emissive) {
                if (material.name === "Lure") {
                  material.emissive.set(creature.glow.color);
                  material.emissiveIntensity = 4;
                } else if (material.name === "Photophores") {
                  material.emissive.set(creature.glow.color);
                  material.emissiveIntensity = 2.5;
                } else if (material.name === "Catchlight") {
                  material.emissive.set(creature.glow.color);
                  material.emissiveIntensity = 2;
                }
              }
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

          // The lanternfish carries its own little light source. Sprites fake
          // the soft bloom; the point light lights the fish around the lure.
          let lure = null;
          let glowCore = null;
          let glowHalo = null;
          let glowPool = null;
          let lureLight = null;
          if (creature.glow) {
            lure = model.getObjectByName("LureLight");
            if (lure) {
              const addHalo = (size, opacity, renderOrder) => {
                const sprite = new THREE.Sprite(
                  new THREE.SpriteMaterial({
                    map: glowTexture,
                    color: creature.glow.color,
                    transparent: true,
                    opacity,
                    blending: THREE.AdditiveBlending,
                    depthWrite: false,
                  })
                );
                sprite.scale.setScalar(size);
                sprite.renderOrder = renderOrder;
                sprite.userData.baseOpacity = opacity;
                sprite.userData.baseSize = size;
                scene.add(sprite);
                return sprite;
              };
              glowHalo = addHalo(creature.glow.haloSize, 0.22, 2);
              glowCore = addHalo(creature.glow.coreSize, 0.8, 3);
              lureLight = new THREE.PointLight(
                creature.glow.color,
                creature.glow.light,
                creature.glow.distance,
                2
              );
              scene.add(lureLight);

              // A flat additive disc on the sand acts as the lure's light pool.
              glowPool = new THREE.Mesh(
                new THREE.PlaneGeometry(1, 1),
                new THREE.MeshBasicMaterial({
                  map: glowTexture,
                  color: creature.glow.color,
                  transparent: true,
                  opacity: 0,
                  blending: THREE.AdditiveBlending,
                  depthWrite: false,
                })
              );
              glowPool.rotation.x = -Math.PI / 2;
              glowPool.scale.set(7.5, 7.5, 1);
              glowPool.renderOrder = 2;
              scene.add(glowPool);
            }
          }

          scene.add(root);
          const swimmer = {
            root,
            mixer,
            materials,
            ...creature,
            band,
            lane,
            speed: creature.speed * THREE.MathUtils.randFloat(0.85, 1.15),
            phase: Math.random() * Math.PI * 2,
            lure,
            glowCore,
            glowHalo,
            glowPool,
            lureLight,
          };
          spawnSwimmer(swimmer, startFraction);
          swimmers.push(swimmer);
        },
        undefined,
        (error) => console.error(`Unable to load model/${creature.file}`, error)
      );
    }
  }

  function update(dt, t, progress) {
    for (const swimmer of swimmers) {
      if (!reduceMotion) {
        if (swimmer.hover) {
          swimmer.x = Math.sin(t * 0.22 + swimmer.phase) * 1.6;
        } else {
          swimmer.x += swimmer.direction * swimmer.speed * dt;
        }
      }

      let distance = camera.position.z - swimmer.z;
      let viewHeight =
        2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
      let viewWidth = viewHeight * camera.aspect;
      let margin = Math.max(0.75, swimmer.length * 0.65);
      let pathEnd = viewWidth / 2 + margin;
      const alongPath = swimmer.x * swimmer.direction;
      if (!swimmer.hover && !reduceMotion && alongPath > pathEnd) {
        spawnSwimmer(swimmer);
        distance = camera.position.z - swimmer.z;
        viewHeight =
          2 * Math.tan(THREE.MathUtils.degToRad(camera.fov / 2)) * distance;
        viewWidth = viewHeight * camera.aspect;
        margin = Math.max(0.75, swimmer.length * 0.65);
        pathEnd = viewWidth / 2 + margin;
      }

      const position = swimmer.x * swimmer.direction;
      const fadeDistance = margin * 1.5;
      const fadeIn = reduceMotion
        ? 1
        : THREE.MathUtils.smoothstep(
            position + viewWidth / 2 + margin,
            0,
            fadeDistance
          );
      const fadeOut = reduceMotion
        ? 1
        : THREE.MathUtils.smoothstep(pathEnd - position, 0, fadeDistance);
      const inBand = bandVisibility(swimmer.band, progress);
      const visibility =
        (swimmer.hover ? 1 : Math.min(fadeIn, fadeOut)) * inBand;

      // A hovering fish holds its spot and bobs; the rest swim across.
      const bob =
        swimmer.hover && !reduceMotion
          ? Math.sin(t * 0.55 + swimmer.phase) * 0.12
          : 0;

      // Fish keep a fixed world height, so the diving camera drifts past them.
      swimmer.root.position.set(swimmer.x, swimmer.y + bob, swimmer.z);
      swimmer.root.visible = visibility > 0.002;
      const brightness = swimmer.band.brightness;
      for (const { material, baseColor } of swimmer.materials) {
        material.opacity = visibility;
        if (baseColor && material.color) {
          material.color.copy(baseColor).multiplyScalar(brightness);
        }
      }

      if (!reduceMotion) swimmer.mixer.update(dt);

      if (swimmer.lure) {
        const pulse = reduceMotion
          ? 0.5
          : 0.5 + 0.5 * Math.sin(t * 1.6 + swimmer.phase);
        swimmer.lure.getWorldPosition(lurePosition);

        for (const glow of [swimmer.glowHalo, swimmer.glowCore]) {
          glow.position.copy(lurePosition);
          glow.material.opacity =
            glow.userData.baseOpacity *
            (0.72 + 0.28 * pulse) *
            Math.min(1, inBand * 1.2);
          glow.scale.setScalar(
            glow.userData.baseSize * (0.92 + 0.08 * pulse)
          );
          glow.visible = inBand > 0.002;
        }

        if (swimmer.glowPool) {
          swimmer.glowPool.position.set(
            swimmer.x,
            sandHeight(swimmer.x, swimmer.z) + 0.5,
            swimmer.z
          );
          swimmer.glowPool.material.opacity =
            0.5 * (0.7 + 0.3 * pulse) * inBand;
          swimmer.glowPool.visible = inBand > 0.002;
        }

        swimmer.lureLight.position.copy(lurePosition);
        swimmer.lureLight.intensity =
          swimmer.glow.light * (0.7 + 0.3 * pulse) * inBand;
        swimmer.lureLight.visible = inBand > 0.002;
      }
    }
  }

  return { update };
}
