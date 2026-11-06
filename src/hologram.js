import * as THREE from "three";

const WIDTH = 1024;
const HEIGHT = 512;
const LABEL_WIDTH = 2.4;
const LABEL_HEIGHT = LABEL_WIDTH / 2;
const LABEL_Y = 1.58;
const FONT = '"Bricolage Grotesque", "Helvetica Neue", system-ui, sans-serif';

function roundedRect(ctx, x, y, width, height, radius) {
  const r = Math.min(radius, width / 2, height / 2);
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + width, y, x + width, y + height, r);
  ctx.arcTo(x + width, y + height, x, y + height, r);
  ctx.arcTo(x, y + height, x, y, r);
  ctx.arcTo(x, y, x + width, y, r);
  ctx.closePath();
}

function measureTracked(ctx, text, tracking) {
  let width = 0;
  for (const character of text) {
    width += ctx.measureText(character).width + tracking;
  }
  return Math.max(0, width - tracking);
}

function drawTracked(ctx, text, x, y, tracking) {
  let cursor = x;
  for (const character of text) {
    ctx.fillText(character, cursor, y);
    cursor += ctx.measureText(character).width + tracking;
  }
}

function fitFont(ctx, text, maxWidth, startSize, weight = 700, minSize = 30) {
  let size = startSize;
  while (size > minSize) {
    ctx.font = `${weight} ${size}px ${FONT}`;
    if (ctx.measureText(text).width <= maxWidth) break;
    size -= 2;
  }
  return size;
}

function drawLabel(canvas, project) {
  const ctx = canvas.getContext("2d");
  const accent = project.accent;
  ctx.clearRect(0, 0, WIDTH, HEIGHT);

  // Floating glass slab: dark enough to read against bright water.
  const panel = { x: 10, y: 10, width: WIDTH - 20, height: HEIGHT - 20, r: 28 };
  const fill = ctx.createLinearGradient(0, 0, 0, HEIGHT);
  fill.addColorStop(0, "rgba(2, 14, 20, 0.9)");
  fill.addColorStop(0.55, "rgba(3, 21, 28, 0.78)");
  fill.addColorStop(1, "rgba(5, 31, 39, 0.64)");
  roundedRect(ctx, panel.x, panel.y, panel.width, panel.height, panel.r);
  ctx.fillStyle = fill;
  ctx.fill();

  // Fine holographic grid, clipped to the slab.
  ctx.save();
  roundedRect(ctx, panel.x, panel.y, panel.width, panel.height, panel.r);
  ctx.clip();
  ctx.strokeStyle = "rgba(180, 250, 255, 0.045)";
  ctx.lineWidth = 1;
  for (let y = 20; y < HEIGHT; y += 4) {
    ctx.beginPath();
    ctx.moveTo(0, y + 0.5);
    ctx.lineTo(WIDTH, y + 0.5);
    ctx.stroke();
  }
  ctx.strokeStyle = "rgba(180, 250, 255, 0.03)";
  for (let x = 28; x < WIDTH; x += 28) {
    ctx.beginPath();
    ctx.moveTo(x + 0.5, 0);
    ctx.lineTo(x + 0.5, HEIGHT);
    ctx.stroke();
  }
  // Vertical accent wash on the left edge.
  const wash = ctx.createLinearGradient(0, 0, 40, 0);
  wash.addColorStop(0, `${accent}2e`);
  wash.addColorStop(1, `${accent}00`);
  ctx.fillStyle = wash;
  ctx.fillRect(0, 0, 42, HEIGHT);
  ctx.restore();

  roundedRect(ctx, panel.x + 0.5, panel.y + 0.5, panel.width, panel.height, panel.r);
  ctx.strokeStyle = `${accent}99`;
  ctx.lineWidth = 1.5;
  ctx.stroke();

  // Corner brackets.
  ctx.strokeStyle = `${accent}cc`;
  ctx.lineWidth = 2.5;
  const corners = [
    [34, 34, 1, 1],
    [WIDTH - 34, 34, -1, 1],
    [34, HEIGHT - 34, 1, -1],
    [WIDTH - 34, HEIGHT - 34, -1, -1],
  ];
  for (const [x, y, sx, sy] of corners) {
    ctx.beginPath();
    ctx.moveTo(x + 30 * sx, y);
    ctx.lineTo(x, y);
    ctx.lineTo(x, y + 30 * sy);
    ctx.stroke();
  }

  // Top rail: signal dot, project number, discipline, year.
  ctx.shadowColor = accent;
  ctx.shadowBlur = 14;
  ctx.fillStyle = accent;
  ctx.beginPath();
  ctx.arc(56, 66, 5, 0, Math.PI * 2);
  ctx.fill();
  ctx.shadowBlur = 0;

  ctx.font = `700 21px ${FONT}`;
  ctx.fillStyle = accent;
  ctx.textAlign = "left";
  drawTracked(ctx, `PROJET ${project.number}`, 76, 73, 4);

  ctx.font = `700 18px ${FONT}`;
  ctx.fillStyle = "rgba(209, 246, 250, 0.68)";
  const meta = `${project.year}  /  ${project.category.toUpperCase()}`;
  const metaWidth = measureTracked(ctx, meta, 2.4);
  drawTracked(ctx, meta, WIDTH - 54 - metaWidth, 73, 2.4);

  // Ghost number, right aligned.
  ctx.font = `700 176px ${FONT}`;
  ctx.fillStyle = `${accent}2b`;
  ctx.textAlign = "right";
  ctx.fillText(project.number, WIDTH - 58, 306);

  // Title. Long project names wrap onto two lines instead of shrinking until
  // they disappear on the small mobile holograms.
  const titleWords = project.title.split(" ");
  let titleLines = [project.title];
  let titleSize = 76;
  let titleStep = 0;
  ctx.font = `700 ${titleSize}px ${FONT}`;
  if (ctx.measureText(project.title).width > 680 && titleWords.length > 1) {
    const split = Math.ceil(titleWords.length / 2);
    const first = titleWords.slice(0, split).join(" ");
    const second = titleWords.slice(split).join(" ");
    ctx.font = `700 ${titleSize}px ${FONT}`;
    if (ctx.measureText(first).width <= 680 && ctx.measureText(second).width <= 680) {
      titleLines = [first, second];
      titleStep = 76;
    }
  }
  if (!titleStep) {
    titleSize = fitFont(ctx, project.title, 680, 76, 700, 40);
  }
  const titleTop = titleStep ? 200 : 252;
  ctx.font = `700 ${titleSize}px ${FONT}`;
  ctx.textAlign = "left";
  ctx.fillStyle = "#ffffff";
  ctx.shadowColor = accent;
  ctx.shadowBlur = 26;
  titleLines.forEach((line, index) => {
    ctx.fillText(line, 56, titleTop + index * titleStep);
  });
  ctx.shadowBlur = 0;

  // Subtitle.
  const subtitleY = titleStep ? 330 : 303;
  const subtitleSize = fitFont(ctx, project.subtitle, 640, 24, 300, 18);
  ctx.font = `300 ${subtitleSize}px ${FONT}`;
  ctx.fillStyle = "rgba(228, 252, 255, 0.92)";
  ctx.fillText(project.subtitle, 58, subtitleY);

  // Divider.
  const dividerY = titleStep ? 360 : 350;
  const divider = ctx.createLinearGradient(56, 0, 968, 0);
  divider.addColorStop(0, `${accent}a8`);
  divider.addColorStop(0.55, `${accent}40`);
  divider.addColorStop(1, `${accent}00`);
  ctx.strokeStyle = divider;
  ctx.lineWidth = 1;
  ctx.beginPath();
  ctx.moveTo(56, dividerY + 0.5);
  ctx.lineTo(968, dividerY + 0.5);
  ctx.stroke();

  // Call to action, set in a small holographic pill so the interaction reads.
  roundedRect(ctx, 48, 388, 248, 50, 14);
  ctx.fillStyle = `${accent}26`;
  ctx.fill();
  ctx.strokeStyle = `${accent}aa`;
  ctx.lineWidth = 1.5;
  ctx.stroke();
  ctx.font = `700 19px ${FONT}`;
  ctx.fillStyle = accent;
  const cta = "OUVRIR LE PROJET";
  drawTracked(ctx, cta, 68, 420, 2.6);
  const ctaWidth = measureTracked(ctx, cta, 2.6);
  ctx.strokeStyle = accent;
  ctx.lineWidth = 2;
  ctx.beginPath();
  ctx.moveTo(80 + ctaWidth, 413);
  ctx.lineTo(94 + ctaWidth, 413);
  ctx.lineTo(85 + ctaWidth, 405);
  ctx.moveTo(94 + ctaWidth, 413);
  ctx.lineTo(85 + ctaWidth, 421);
  ctx.stroke();

  // Stack, right aligned on the action row.
  ctx.font = `300 18px ${FONT}`;
  ctx.fillStyle = "rgba(222, 250, 253, 0.82)";
  ctx.textAlign = "right";
  ctx.fillText(project.stack.join("  ·  "), WIDTH - 56, 414);
  ctx.textAlign = "left";

  // Little telemetry ticks so the slab feels alive.
  for (let i = 0; i < 6; i++) {
    ctx.fillStyle = `${accent}${i === 0 ? "e6" : "4d"}`;
    ctx.fillRect(56 + i * 30, 456, i === 0 ? 18 : 8, 3);
  }
  ctx.fillStyle = `${accent}33`;
  ctx.fillRect(56, 470, 912, 1.5);
  ctx.fillStyle = `${accent}b3`;
  ctx.fillRect(56, 470, 120 + (Number(project.number) || 1) * 52, 1.5);

  ctx.font = `700 15px ${FONT}`;
  ctx.fillStyle = "rgba(210, 248, 252, 0.68)";
  ctx.textAlign = "right";
  drawTracked(ctx, "LIAISON STABLE", WIDTH - 56 - measureTracked(ctx, "LIAISON STABLE", 2), 476, 2);
}

function createScanTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 8;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createLinearGradient(0, 0, 0, 128);
  gradient.addColorStop(0, "rgba(255,255,255,0)");
  gradient.addColorStop(0.46, "rgba(255,255,255,0.05)");
  gradient.addColorStop(0.5, "rgba(255,255,255,0.9)");
  gradient.addColorStop(0.54, "rgba(255,255,255,0.05)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 8, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

function createHaloTexture() {
  const canvas = document.createElement("canvas");
  canvas.width = 256;
  canvas.height = 128;
  const ctx = canvas.getContext("2d");
  const gradient = ctx.createRadialGradient(128, 64, 0, 128, 64, 128);
  gradient.addColorStop(0, "rgba(255,255,255,0.5)");
  gradient.addColorStop(0.45, "rgba(255,255,255,0.16)");
  gradient.addColorStop(1, "rgba(255,255,255,0)");
  ctx.fillStyle = gradient;
  ctx.fillRect(0, 0, 256, 128);
  const texture = new THREE.CanvasTexture(canvas);
  texture.colorSpace = THREE.SRGBColorSpace;
  return texture;
}

/**
 * Holographic project plate: a camera-facing label fed by a light cone from the
 * drone's dorsal projector, plus a scan line and a soft ambient halo.
 */
export function buildHologram({ project, camera, reducedMotion = false }) {
  const group = new THREE.Group();
  group.name = "ProjectHologram";

  const canvas = document.createElement("canvas");
  canvas.width = WIDTH;
  canvas.height = HEIGHT;
  drawLabel(canvas, project);
  const textTexture = new THREE.CanvasTexture(canvas);
  textTexture.colorSpace = THREE.SRGBColorSpace;
  textTexture.anisotropy = 4;
  textTexture.minFilter = THREE.LinearMipmapLinearFilter;

  const redraw = () => {
    drawLabel(canvas, project);
    textTexture.needsUpdate = true;
  };

  // The display font may arrive after this module runs; repaint once it does.
  if (document.fonts?.load) {
    document.fonts
      .load('700 76px "Bricolage Grotesque"')
      .then(redraw)
      .catch(() => {});
  }

  const labelPivot = new THREE.Group();
  labelPivot.position.set(0, LABEL_Y, 0);
  group.add(labelPivot);

  const haloMaterial = new THREE.MeshBasicMaterial({
    map: createHaloTexture(),
    color: project.accent,
    transparent: true,
    opacity: 0.2,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
  });
  const halo = new THREE.Mesh(
    new THREE.PlaneGeometry(LABEL_WIDTH * 1.45, LABEL_HEIGHT * 1.6),
    haloMaterial
  );
  halo.position.z = -0.02;
  halo.renderOrder = 3;
  labelPivot.add(halo);

  const labelMaterial = new THREE.MeshBasicMaterial({
    map: textTexture,
    transparent: true,
    opacity: 1,
    depthWrite: false,
    depthTest: true,
    toneMapped: false,
    side: THREE.DoubleSide,
    alphaTest: 0.001,
  });
  const label = new THREE.Mesh(new THREE.PlaneGeometry(LABEL_WIDTH, LABEL_HEIGHT), labelMaterial);
  label.renderOrder = 4;
  labelPivot.add(label);

  const scanMaterial = new THREE.MeshBasicMaterial({
    map: createScanTexture(),
    color: project.accent,
    transparent: true,
    opacity: 0.42,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    toneMapped: false,
  });
  const scan = new THREE.Mesh(new THREE.PlaneGeometry(LABEL_WIDTH * 0.92, 0.13), scanMaterial);
  scan.position.z = 0.012;
  scan.renderOrder = 5;
  labelPivot.add(scan);

  // Projection cone from the dorsal lens to the plate.
  const beamMaterial = new THREE.MeshBasicMaterial({
    color: project.accent,
    transparent: true,
    opacity: 0.12,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const beamHeight = LABEL_Y - LABEL_HEIGHT / 2 - 0.43;
  const beam = new THREE.Mesh(
    new THREE.CylinderGeometry(0.62, 0.035, beamHeight, 24, 1, true),
    beamMaterial
  );
  beam.position.set(0, 0.43 + beamHeight / 2, -0.04);
  beam.renderOrder = 2;
  group.add(beam);

  const hazeMaterial = new THREE.MeshBasicMaterial({
    color: project.accent,
    transparent: true,
    opacity: 0.035,
    blending: THREE.AdditiveBlending,
    depthWrite: false,
    side: THREE.DoubleSide,
    toneMapped: false,
  });
  const haze = new THREE.Mesh(
    new THREE.CylinderGeometry(1.0, 0.08, beamHeight + 0.08, 24, 1, true),
    hazeMaterial
  );
  haze.position.copy(beam.position);
  haze.renderOrder = 2;
  group.add(haze);

  const rootWorldQuaternion = new THREE.Quaternion();
  let opacity = 1;
  let engaged = false;
  let engageMix = 0;

  return {
    group,
    label,
    project,
    get opacity() {
      return opacity;
    },
    set opacity(value) {
      opacity = THREE.MathUtils.clamp(value, 0, 1);
    },
    get engaged() {
      return engaged;
    },
    set engaged(value) {
      engaged = Boolean(value);
    },
    update(time, dt, root) {
      // Face the camera while staying attached to the drone's local origin.
      root.getWorldQuaternion(rootWorldQuaternion).invert();
      labelPivot.quaternion.copy(rootWorldQuaternion).multiply(camera.quaternion);

      const target = engaged ? 1 : 0;
      engageMix += (target - engageMix) * (1 - Math.exp(-dt * 6));
      const visible = opacity * (1 - engageMix);
      const flicker = 0.955 + 0.045 * Math.sin(time * 7.3 + 1.2);
      labelMaterial.opacity = visible * flicker;
      haloMaterial.opacity = 0.12 * visible;
      scanMaterial.opacity = 0.4 * visible;

      if (!reducedMotion) {
        const cycle = (time * 0.24) % 1;
        scan.position.y = (0.5 - cycle) * 1.04;
        scanMaterial.opacity *= Math.sin(cycle * Math.PI);
      } else {
        scan.position.y = 0;
      }

      beamMaterial.opacity = (0.09 + engageMix * 0.08) * opacity * (0.9 + 0.1 * Math.sin(time * 2.1));
      hazeMaterial.opacity = (0.03 + engageMix * 0.02) * opacity;
      beam.visible = opacity > 0.01;
      haze.visible = opacity > 0.01;
      labelPivot.visible = opacity > 0.005;
      group.visible = opacity > 0.005;
    },
  };
}
