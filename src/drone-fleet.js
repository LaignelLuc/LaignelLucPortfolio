import * as THREE from "three";
import { buildDrone } from "./drone-model.js";
import { buildHologram } from "./hologram.js";

const LABEL_Y = 1.58;
const LABEL_WIDTH = 2.4;
const FOCUS_DOCK = { x: 0.5, y: 0.84, depth: 6.0 };
const OPEN_TRAVEL = 0.82;
const CLOSE_TRAVEL = 0.62;

const clamp = THREE.MathUtils.clamp;
const smoothstep = (value) => {
  const t = clamp(value, 0, 1);
  return t * t * (3 - 2 * t);
};

function createGlowTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 128;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(64, 64, 0, 64, 64, 64);
  gradient.addColorStop(0, "rgba(255,255,255,1)");
  gradient.addColorStop(0.22, "rgba(255,255,255,0.55)");
  gradient.addColorStop(0.55, "rgba(255,255,255,0.12)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 128, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * The projects section's 3D residents. Each drone is anchored to a screen-space
 * slot measured inside the section, so it scrolls with its own heading instead
 * of floating over the rest of the page. A native dialog is opened by the
 * project-window controller once the drone has docked at the presentation spot.
 */
export function createDroneFleet({ scene, camera, projects, projectWindow }) {
  const section = document.querySelector("#projects");
  const container = document.querySelector("#drone-hotspots");
  if (!section || !container) {
    console.warn("Drone fleet: #projects or #drone-hotspots is missing.");
    return { update() {}, destroy() {} };
  }

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)");
  const reducedMotion = reduceMotion.matches;
  const glowTexture = createGlowTexture();
  const baseYaw = [-0.3, 0.24, -0.14, 0.18];
  const basePitch = [0.04, -0.02, 0.03, -0.01];

  const drones = projects.map((project, index) => {
    const built = buildDrone({
      accent: project.accent,
      variant: project.drone?.variant ?? index,
      glowTexture,
    });
    built.root.visible = false;
    scene.add(built.root);

    const hologram = buildHologram({ project, camera, reducedMotion });
    built.root.add(hologram.group);

    const button = document.createElement("button");
    button.type = "button";
    button.className = "drone-hotspot";
    button.style.setProperty("--accent", project.accent);
    button.setAttribute("aria-haspopup", "dialog");
    button.setAttribute("aria-controls", "project-window");
    button.setAttribute("aria-expanded", "false");
    button.setAttribute(
      "aria-label",
      `Ouvrir le projet ${project.title} — ${project.category}, ${project.year}`
    );
    button.tabIndex = -1;
    // Start hidden: the buttons are created before the first layout pass, and
    // an unplaced 280x300 hit area would sit at the top-left of the viewport,
    // silently swallowing clicks there (and queueing a project that opens only
    // once the section scrolls into view).
    button.hidden = true;
    container.appendChild(button);

    const drone = {
      ...built,
      hologram,
      project,
      index,
      button,
      phase: index * 2.4,
      baseYaw: baseYaw[index] ?? 0,
      basePitch: basePitch[index] ?? 0,
      hovered: false,
      hover: 0,
      focusT: 0,
      state: "idle",
      opacity: 0,
      dim: 1,
      targetScale: 1,
      currentScale: 1,
      hotspotShown: false,
      hotspotWidth: 0,
      hotspotHeight: 0,
      initialized: false,
      baseSlot: null,
      focusSlot: null,
    };

    button.addEventListener("pointerenter", (event) => {
      if (event.pointerType === "mouse" || event.pointerType === "pen") {
        drone.hovered = true;
      }
    });
    button.addEventListener("pointerleave", () => {
      drone.hovered = false;
    });
    button.addEventListener("focus", () => {
      drone.hovered = true;
    });
    button.addEventListener("blur", () => {
      drone.hovered = false;
    });
    button.addEventListener("click", () => {
      openDrone(drone);
    });

    return drone;
  });

  const forward = new THREE.Vector3();
  const right = new THREE.Vector3();
  const up = new THREE.Vector3();
  const scratch = new THREE.Vector3();
  const scratchB = new THREE.Vector3();
  const projectorWorld = new THREE.Vector3();
  const labelWorld = new THREE.Vector3();
  const originPx = { x: 0, y: 0 };
  const projected = { x: 0, y: 0 };

  let active = null;
  let windowOpened = false;
  let sectionVisible = 0;
  let vw = window.innerWidth;
  let vh = window.innerHeight;
  let tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
  let destroyed = false;

  function updateViewport() {
    vw = window.innerWidth;
    vh = window.innerHeight;
    tangent = Math.tan(THREE.MathUtils.degToRad(camera.fov * 0.5));
  }

  updateViewport();
  window.addEventListener("resize", updateViewport, { passive: true });

  function cameraBasis() {
    camera.getWorldDirection(forward);
    right.setFromMatrixColumn(camera.matrixWorld, 0).normalize();
    up.setFromMatrixColumn(camera.matrixWorld, 1).normalize();
  }

  function screenToWorld(x, y, depth, out) {
    const height = 2 * depth * tangent;
    const width = height * camera.aspect;
    out
      .copy(camera.position)
      .addScaledVector(forward, depth)
      .addScaledVector(right, (x - 0.5) * width)
      .addScaledVector(up, (0.5 - y) * height);
    return out;
  }

  function project(world, out) {
    scratchB.copy(world).project(camera);
    out.x = (scratchB.x * 0.5 + 0.5) * vw;
    out.y = (0.5 - scratchB.y * 0.5) * vh;
    return out;
  }

  function slotLayout() {
    const mobile = vw < 768;
    const desktop = vw > 1100;
    const fraction = mobile ? 0.46 : desktop ? 0.2 : 0.24;
    const slots = mobile
      ? [
          { x: 0.26, y: 0.445, depth: 6.2, size: 0.94 },
          { x: 0.74, y: 0.465, depth: 6.6, size: 0.94 },
          { x: 0.26, y: 0.79, depth: 6.0, size: 0.9 },
          { x: 0.74, y: 0.81, depth: 6.3, size: 0.9 },
        ]
      : desktop
      ? [
          { x: 0.14, y: 0.56, depth: 6.3, size: 1 },
          { x: 0.38, y: 0.54, depth: 7.1, size: 1.04 },
          { x: 0.62, y: 0.56, depth: 6.5, size: 1 },
          { x: 0.86, y: 0.545, depth: 6.8, size: 1.02 },
        ]
      : [
          { x: 0.26, y: 0.45, depth: 6.6, size: 0.95 },
          { x: 0.74, y: 0.47, depth: 6.9, size: 0.95 },
          // 1024–1100 px is a landscape tablet: the dock is still on the side,
          // so the bottom row keeps the lower slots instead of clearing a
          // bottom dock that is not there.
          { x: 0.26, y: vw >= 1024 ? 0.82 : 0.68, depth: 6.3, size: 0.92 },
          { x: 0.74, y: vw >= 1024 ? 0.84 : 0.7, depth: 6.6, size: 0.92 },
        ];
    return { mobile, fraction, slots };
  }

  function layoutFor(drone, layout) {
    const slot = layout.slots[drone.index] ?? layout.slots[layout.slots.length - 1];
    const rect = section.getBoundingClientRect();
    const labelScreenY = rect.top + rect.height * slot.y;
    const labelScreenX = vw * slot.x;
    const labelTarget = screenToWorld(
      labelScreenX / vw,
      labelScreenY / vh,
      slot.depth,
      new THREE.Vector3()
    );
    const height = 2 * slot.depth * tangent;
    const width = height * camera.aspect;
    const scale = (layout.fraction * width * slot.size) / LABEL_WIDTH;
    const rootTarget = labelTarget.clone().addScaledVector(up, -LABEL_Y * scale);
    return { slot, labelTarget, rootTarget, scale };
  }

  function focusTarget() {
    return screenToWorld(FOCUS_DOCK.x, FOCUS_DOCK.y, FOCUS_DOCK.depth, new THREE.Vector3());
  }

  function projectorScreen(drone) {
    drone.projector.getWorldPosition(projectorWorld);
    return project(projectorWorld, originPx);
  }

  function openDrone(drone) {
    // One project at a time. A second tap while a drone is docking is ignored
    // here rather than by disabling the hit areas: that way it can never fall
    // through to the page, where a mobile browser may read it as a double-tap
    // zoom on the content behind. A project can only be opened from a drone
    // that is actually on screen and interactive.
    if (active || destroyed || !drone.hotspotShown) return;
    active = drone;
    drone.state = "opening";
    drone.focusT = 0;
    drone.hovered = false;
    windowOpened = false;
    drone.button.setAttribute("aria-expanded", "true");
  }

  function startClose(drone) {
    if (drone !== active || drone.state === "closing") return;
    drone.state = "closing";
    drone.button.setAttribute("aria-expanded", "false");
    drone.button.tabIndex = 0;
  }

  function updateHologram(drone, time, dt) {
    drone.hologram.opacity = clamp(
      drone.opacity * drone.dim * (1 + drone.hover * 0.18),
      0,
      1
    );
    drone.hologram.engaged = drone.focusT > 0.32;
    drone.hologram.update(time, dt, drone.root);
  }

  function updateHotspot(drone, visible) {
    const { button, root } = drone;
    const shouldShow = visible && drone.opacity > 0.06 && sectionVisible > 0.02;

    if (!shouldShow) {
      if (drone.hotspotShown) {
        button.hidden = true;
        button.tabIndex = -1;
        drone.hotspotShown = false;
      }
      return;
    }

    if (!drone.hotspotShown) {
      button.hidden = false;
      button.tabIndex = active ? -1 : 0;
      drone.hotspotShown = true;
    } else {
      const tabIndex = active ? -1 : 0;
      if (button.tabIndex !== tabIndex) button.tabIndex = tabIndex;
    }

    drone.hologram.label.getWorldPosition(labelWorld);
    project(labelWorld, projected);
    const centerX = projected.x;
    const labelCenterY = projected.y;

    scratch.copy(labelWorld).addScaledVector(right, LABEL_WIDTH * 0.5 * drone.root.scale.x);
    project(scratch, projected);
    const rightX = projected.x;
    scratch.copy(labelWorld).addScaledVector(right, -LABEL_WIDTH * 0.5 * drone.root.scale.x);
    project(scratch, projected);
    const leftX = projected.x;

    scratch.copy(labelWorld).addScaledVector(up, 0.6 * drone.root.scale.x);
    project(scratch, projected);
    const labelTop = projected.y;

    scratch.copy(root.position).addScaledVector(up, -0.42 * drone.root.scale.x);
    project(scratch, projected);
    const droneBottom = projected.y;

    const width = Math.max(96, Math.abs(rightX - leftX) * 1.06);
    const top = Math.min(labelTop, labelCenterY) - 12;
    const bottom = Math.max(droneBottom, labelCenterY) + 12;
    const height = Math.max(110, bottom - top);
    let left = centerX - width / 2;
    const dockClearance = vw >= 1024 ? 100 : 8;
    left = clamp(left, 8, vw - width - dockClearance);
    // Keep the transparent hit area on the 3D label. The slot fractions keep
    // the cards above the bottom dock, so clamping vertically here would only
    // detach the button from the hologram it is meant to cover.

    const roundedW = Math.round(width);
    const roundedH = Math.round(height);
    if (roundedW !== drone.hotspotWidth) {
      button.style.width = `${roundedW}px`;
      drone.hotspotWidth = roundedW;
    }
    if (roundedH !== drone.hotspotHeight) {
      button.style.height = `${roundedH}px`;
      drone.hotspotHeight = roundedH;
    }
    button.style.transform = `translate3d(${Math.round(left)}px, ${Math.round(top)}px, 0)`;
    button.style.opacity = String(clamp(drone.opacity * 1.4, 0, 1));
  }

  function update(dt, elapsed) {
    if (destroyed) return;
    dt = Math.min(dt, 0.05);
    camera.updateMatrixWorld();
    cameraBasis();

    const rect = section.getBoundingClientRect();
    const fadeIn = clamp((vh - rect.top) / (vh * 0.7), 0, 1);
    const fadeOut = clamp(rect.bottom / (vh * 0.7), 0, 1);
    sectionVisible = smoothstep(fadeIn) * smoothstep(fadeOut);

    const layout = slotLayout();
    const time = elapsed;

    for (const drone of drones) {
      const slotInfo = layoutFor(drone, layout);
      drone.baseSlot = slotInfo;
      drone.focusSlot = focusTarget();

      const visTarget = sectionVisible;
      drone.opacity += (visTarget - drone.opacity) * (1 - Math.exp(-dt * 4.5));
      if (drone.opacity < 0.004 && sectionVisible < 0.01) {
        drone.root.visible = false;
        updateHologram(drone, time, dt);
        updateHotspot(drone, false);
        continue;
      }
      drone.root.visible = true;

      const isActive = active === drone;
      const dimTarget = active ? (isActive ? 1 : 0.14) : 1;
      drone.dim += (dimTarget - drone.dim) * (1 - Math.exp(-dt * 5));

      const canHover = !active;
      if (canHover && drone.hovered) {
        drone.hover += (1 - drone.hover) * (1 - Math.exp(-dt * 7));
      } else {
        drone.hover += (0 - drone.hover) * (1 - Math.exp(-dt * 5));
      }

      if (drone.state === "opening" || drone.state === "open") {
        drone.focusT = clamp(drone.focusT + dt / OPEN_TRAVEL, 0, 1);
      } else if (drone.state === "closing") {
        drone.focusT = clamp(drone.focusT - dt / CLOSE_TRAVEL, 0, 1);
        if (drone.focusT <= 0.001) {
          drone.focusT = 0;
          drone.state = "idle";
          if (drone === active) active = null;
        }
      }
      const focus = smoothstep(drone.focusT);
      drone.targetScale = slotInfo.scale;

      const t = time + drone.phase;
      const idleAmount = reducedMotion ? 0 : 1 - focus;
      const bob =
        (Math.sin(t * 0.55) * 0.07 + Math.sin(t * 0.23 + 1.3) * 0.03) * idleAmount;
      const driftX = Math.sin(t * 0.31 + drone.phase * 0.4) * 0.1 * idleAmount;
      const driftZ = Math.cos(t * 0.27) * 0.07 * idleAmount;
      const hoverLift = drone.hover * 0.1;

      const target = scratch
        .copy(slotInfo.rootTarget)
        .lerp(drone.focusSlot, focus)
        .addScaledVector(up, (bob + hoverLift) * slotInfo.scale)
        .addScaledVector(right, driftX * (1 - focus * 0.8) * slotInfo.scale)
        .addScaledVector(forward, driftZ * (1 - focus * 0.8) * slotInfo.scale);

      if (!drone.initialized) {
        drone.root.position.copy(target);
        drone.currentScale = slotInfo.scale;
        drone.root.scale.setScalar(drone.currentScale);
        drone.initialized = true;
      } else {
        drone.root.position.lerp(target, 1 - Math.exp(-dt * (6 + focus * 10)));
        drone.currentScale += (drone.targetScale - drone.currentScale) * (1 - Math.exp(-dt * 5));
        drone.root.scale.setScalar(drone.currentScale);
      }

      const idleYaw = Math.sin(t * 0.21) * 0.05 * idleAmount;
      const idlePitch = Math.sin(t * 0.37) * 0.03 * idleAmount;
      const idleRoll = Math.sin(t * 0.29 + 0.7) * 0.035 * idleAmount;
      const targetYaw = (drone.baseYaw + idleYaw) * (1 - focus) + drone.hover * 0.08;
      const targetPitch = drone.basePitch + idlePitch + drone.hover * 0.025;
      const targetRoll = idleRoll * (1 - focus) + drone.hover * 0.02;
      drone.root.rotation.set(targetPitch, targetYaw, targetRoll, "YXZ");

      const rotorRate = reducedMotion
        ? 0
        : (1 + drone.hover * 0.65 + focus * 0.5) * (1 + drone.opacity * 0.2);
      for (const pod of drone.rotors) {
        pod.rotor.rotation.z += pod.spin * dt * rotorRate;
      }

      for (const { material, baseOpacity } of drone.materials) {
        material.opacity = baseOpacity * drone.opacity * drone.dim;
      }
      for (const glow of drone.glows) {
        const base = glow.userData.baseOpacity ?? glow.material.opacity;
        glow.material.opacity = base * drone.opacity * drone.dim;
      }

      updateHologram(drone, time, dt);
      updateHotspot(drone, true);

      if (drone.state === "opening" && !windowOpened && drone.focusT >= 0.9995) {
        windowOpened = true;
        const px = projectorScreen(drone);
        const origin = { x: clamp(px.x, 0, vw), y: clamp(px.y, 0, vh) };
        drone.state = "open";
        const result = projectWindow?.open?.(drone.project, origin, drone.button);
        Promise.resolve(result).finally(() => startClose(drone));
      }
    }
  }

  function destroy() {
    destroyed = true;
    window.removeEventListener("resize", updateViewport);
    for (const drone of drones) {
      scene.remove(drone.root);
      drone.button.remove();
      drone.root.traverse((object) => {
        if (object.geometry) object.geometry.dispose();
      });
    }
  }

  return { update, destroy, drones };
}
