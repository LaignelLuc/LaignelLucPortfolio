/**
 * Compétences — le sonar : cinq contacts, chacun ouvre son inventaire.
 *
 * L'anneau est en SVG (net à toute taille), les contacts sont de vrais boutons
 * HTML posés en pourcentage par-dessus : focus clavier, cible tactile et
 * survol sans avoir à gérer des hit-tests dans le SVG.
 */
import { SKILL_FAMILIES, SKILL_COUNT } from "./skills.js";

const NS = "http://www.w3.org/2000/svg";
const VIEW = 640;
const CENTER = VIEW / 2;
const RADIUS = 300;
const BEACON_RADIUS = RADIUS * 0.715;
const SAT_RADIUS = 42;
const SAT_RADIUS_ACTIVE = 47;
const TICK_COUNT = 72;

const wide = matchMedia("(min-width: 64em)");
const hoverPointer = matchMedia("(hover: hover)");

/** Cap en degrés (0 = nord, horaire) vers un point du disque. */
function polar(radius, cap) {
  const a = ((cap - 90) * Math.PI) / 180;
  return [CENTER + radius * Math.cos(a), CENTER + radius * Math.sin(a)];
}

function svg(name, attrs = {}) {
  const node = document.createElementNS(NS, name);
  for (const [key, value] of Object.entries(attrs)) node.setAttribute(key, value);
  return node;
}

function logoUrl(name) {
  return `image/logos/${name}.svg`;
}

const tools = (family) => family.items.filter((item) => item.logo);
const notions = (family) => family.items.filter((item) => !item.logo);

/* ------------------------------------------------------------------ dial */

function buildDial() {
  const root = svg("svg", {
    class: "dial",
    viewBox: `0 0 ${VIEW} ${VIEW}`,
    width: String(VIEW),
    height: String(VIEW),
    "aria-hidden": "true",
    focusable: "false",
  });

  const rings = svg("g", { class: "dial__rings" });
  for (const r of [RADIUS * 0.52, RADIUS]) {
    rings.append(svg("circle", { cx: CENTER, cy: CENTER, r }));
  }
  root.append(rings);

  const ticks = svg("g", { class: "dial__ticks" });
  for (let i = 0; i < TICK_COUNT; i += 1) {
    const cap = (i * 360) / TICK_COUNT;
    const long = i % 6 === 0;
    const [x1, y1] = polar(RADIUS, cap);
    const [x2, y2] = polar(RADIUS + (long ? 10 : 5), cap);
    ticks.append(svg("line", { x1, y1, x2, y2, class: long ? "is-long" : "" }));
  }
  root.append(ticks);

  // noyau : le point d'où partent les balayages
  const core = svg("g", { class: "dial__core" });
  core.append(svg("circle", { cx: CENTER, cy: CENTER, r: 2.2 }));
  root.append(core);

  const cardinals = svg("g", { class: "dial__cardinals" });
  for (const [cap, label] of [
    [0, "000"],
    [90, "090"],
    [180, "180"],
    [270, "270"],
  ]) {
    const [x, y] = polar(RADIUS + 30, cap);
    const node = svg("text", { x, y, "text-anchor": "middle", "dominant-baseline": "middle" });
    node.textContent = label;
    cardinals.append(node);
  }
  root.append(cardinals);

  const clusters = svg("g", { class: "dial__clusters" });
  for (const family of SKILL_FAMILIES) {
    const [bx, by] = polar(BEACON_RADIUS, family.angle);
    const group = svg("g", { class: "dial__cluster", "data-family": family.id });

    group.append(
      svg("circle", {
        cx: bx,
        cy: by,
        r: SAT_RADIUS,
        class: "dial__halo",
      }),
    );

    family.items.forEach((item, index) => {
      const cap = (index * 360) / family.items.length + 18;
      const a = ((cap - 90) * Math.PI) / 180;
      const sx = bx + SAT_RADIUS * Math.cos(a);
      const sy = by + SAT_RADIUS * Math.sin(a);
      group.append(
        svg("line", { x1: bx, y1: by, x2: sx, y2: sy, class: "dial__spoke" }),
      );
      group.append(svg("circle", { cx: sx, cy: sy, r: 3.4, class: "dial__satellite" }));
    });

    // le contact lui-même
    group.append(svg("circle", { cx: bx, cy: by, r: 9, class: "dial__pulse" }));
    group.append(svg("circle", { cx: bx, cy: by, r: 5, class: "dial__beacon" }));

    // étiquette, posée vers l'extérieur du disque
    const [lx, ly] = polar(BEACON_RADIUS + 54, family.angle);
    const sin = Math.sin(((family.angle - 90) * Math.PI) / 180);
    const anchor = Math.abs(sin) > 0.5 ? (sin > 0 ? "start" : "end") : "middle";
    const label = svg("text", {
      x: lx,
      y: anchor === "middle" ? ly - 10 : ly,
      "text-anchor": anchor,
      "dominant-baseline": "middle",
      class: "dial__label",
    });
    label.textContent = family.label.toUpperCase();
    group.append(label);

    clusters.append(group);
  }
  root.append(clusters);

  const beam = svg("line", { class: "dial__beam", x1: 0, y1: 0, x2: 0, y2: 0 });
  root.append(beam);

  return { root, beam };
}

/* ------------------------------------------------------------------ card */

function cardMarkup(family, index) {
  const withLogo = tools(family);
  const textOnly = notions(family);

  const tiles = withLogo
    .map(
      (item) => `
        <li class="skill-tile">
          <span class="skill-tile__box">
            <span class="skill-logo" style="--logo: url('${logoUrl(item.logo)}')"></span>
          </span>
          <span class="skill-tile__name">${item.name}</span>
        </li>`,
    )
    .join("");

  const also = textOnly.length
    ? `<p class="skill-card__also"><span>Aussi</span> ${textOnly
        .map((item) => item.name)
        .join(" · ")}</p>`
    : "";

  return `
    <p class="skill-card__eyebrow">
      Famille ${String(index + 1).padStart(2, "0")}
      <span aria-hidden="true">—</span> ${family.items.length} compétences
    </p>
    <h3 class="skill-card__title">${family.label}</h3>
    <p class="skill-card__summary">${family.summary}</p>
    ${tiles ? `<ul class="skill-card__tools">${tiles}</ul>` : ""}
    ${also}
    <p class="skill-card__evidence">
      <span>Utilisé dans</span>
      ${family.evidence}
    </p>
`;
}

/* ------------------------------------------------------------------ list */

function listMarkup() {
  return SKILL_FAMILIES.map((family) => {
    const chips = family.items
      .map((item) =>
        item.logo
          ? `<li class="skill-chip">
               <span class="skill-logo" style="--logo: url('${logoUrl(item.logo)}')"></span>
               ${item.name}
             </li>`
          : `<li class="skill-chip skill-chip--text">${item.name}</li>`,
      )
      .join("");

    return `
      <li class="skill-family" data-family="${family.id}">
        <p class="skill-family__label">${family.label}</p>
        <ul class="skill-family__chips">${chips}</ul>
        <p class="skill-family__evidence"><span aria-hidden="true">◇</span> ${family.evidence}</p>
      </li>`;
  }).join("");
}

/* ----------------------------------------------------------------- mount */

export function createSkillsSection(section) {
  const scope = section.querySelector("[data-skills-scope]");
  const list = section.querySelector("[data-skills-list]");
  const count = section.querySelector("[data-skills-count]");
  if (!scope || !list) return;

  if (count) count.textContent = String(SKILL_COUNT);

  const { root: dial, beam } = buildDial();
  scope.append(dial);

  // Le cadran est carré : si le CSS `aspect-ratio` ne donne pas la hauteur
  // (vieux Firefox, élément hors flux), on la cale sur la largeur mesurée.
  function squareScope() {
    const w = scope.clientWidth;
    if (!w) return;
    if (Math.abs(scope.clientHeight - w) > 1) scope.style.height = `${w}px`;
  }
  squareScope();
  addEventListener("resize", squareScope, { passive: true });
  if ("ResizeObserver" in window) new ResizeObserver(squareScope).observe(scope);

  const beacons = new Map();
  for (const family of SKILL_FAMILIES) {
    const [bx, by] = polar(BEACON_RADIUS, family.angle);
    const button = document.createElement("button");
    button.type = "button";
    button.className = "dial-beacon";
    button.dataset.family = family.id;
    button.setAttribute(
      "aria-label",
      `${family.label}, ${family.items.length} compétences`,
    );
    button.setAttribute("aria-expanded", "false");
    button.style.left = `${(bx / VIEW) * 100}%`;
    button.style.top = `${(by / VIEW) * 100}%`;
    button.append(document.createElement("span"));
    scope.append(button);
    beacons.set(family.id, { button, x: bx, y: by });
  }

  const card = document.createElement("div");
  card.className = "skill-card";
  card.hidden = true;
  card.setAttribute("role", "group");
  scope.append(card);

  list.innerHTML = listMarkup();

  let openId = null;
  let pinnedId = null;
  let timer = 0;
  let hideTimer = 0;
  let flashTimer = 0;

  const cluster = (id) => dial.querySelector(`.dial__cluster[data-family="${id}"]`);
  const listItem = (id) => list.querySelector(`.skill-family[data-family="${id}"]`);

  function paintActive(id) {
    for (const family of SKILL_FAMILIES) {
      const on = family.id === id;
      cluster(family.id)?.classList.toggle("is-active", on);
      beacons.get(family.id)?.button.classList.toggle("is-active", on);
      beacons.get(family.id)?.button.setAttribute("aria-expanded", String(on));
      listItem(family.id)?.classList.toggle("is-active", on);
    }
    dial.classList.toggle("is-focused", Boolean(id));
  }

  function place(family) {
    const w = scope.clientWidth;
    const h = scope.clientHeight;
    if (!w || !h) return;

    const frame = scope.getBoundingClientRect();
    const vw = document.documentElement.clientWidth;
    const vh = window.innerHeight;

    const beacon = beacons.get(family.id);
    const bx = (beacon.x / VIEW) * w;
    const by = (beacon.y / VIEW) * h;

    const cw = card.offsetWidth;
    const ch = card.offsetHeight;
    const pad = 16;
    const slot = 24;

    // la carte se pose sur le cadran, décalée à l'opposé du contact
    // pour ne jamais le masquer
    const dx = bx - w / 2;
    const dy = by - h / 2;
    const len = Math.hypot(dx, dy) || 1;

    let left = w / 2 - cw / 2 - (dx / len) * cw * 0.5;
    let top = h / 2 - ch / 2 - (dy / len) * ch * 0.5;

    left = Math.min(Math.max(left, pad), Math.max(pad, w - cw - pad));
    top = Math.min(Math.max(top, pad), Math.max(pad, h - ch - pad));

    card.style.left = `${Math.round(left)}px`;
    card.style.top = `${Math.round(top)}px`;
    card.style.transformOrigin = `${Math.round(bx - left)}px ${Math.round(by - top)}px`;

    // faisceau : du contact vers le bord de carte le plus proche
    const nearX = Math.min(Math.max(bx, left), left + cw);
    const nearY = Math.min(Math.max(by, top), top + ch);
    beam.setAttribute("x1", String(beacon.x));
    beam.setAttribute("y1", String(beacon.y));
    beam.setAttribute("x2", String((nearX / w) * VIEW));
    beam.setAttribute("y2", String((nearY / h) * VIEW));
  }

  function open(id, { pin = false } = {}) {
    const family = SKILL_FAMILIES.find((entry) => entry.id === id);
    if (!family) return;

    if (pin) pinnedId = id;
    if (openId === id && !pin) return;
    openId = id;

    // une carte en train de s'effacer reprend sa place sans clignoter
    clearTimeout(hideTimer);
    card.classList.remove("is-leaving");

    card.innerHTML = cardMarkup(family, SKILL_FAMILIES.indexOf(family));
    card.hidden = false;
    place(family);
    paintActive(id);
  }

  function close() {
    clearTimeout(timer);
    clearTimeout(hideTimer);
    if (!openId) return;

    openId = null;
    pinnedId = null;
    beam.setAttribute("x2", beam.getAttribute("x1"));
    beam.setAttribute("y2", beam.getAttribute("y1"));
    paintActive(null);

    card.classList.add("is-leaving");
    hideTimer = window.setTimeout(() => {
      card.hidden = true;
      card.classList.remove("is-leaving");
    }, 180);
  }

  function scheduleOpen(id, delay = 90) {
    clearTimeout(timer);
    timer = window.setTimeout(() => open(id), delay);
  }

  // Le palier large décide de l'interactivité, pas la détection de survol :
  // certains navigateurs (Zen/Firefox sur portable) annoncent `pointer: fine`
  // alors qu'ils envoient bien des événements de survol, et l'inverse existe
  // aussi. Sous 64em la carte est masquée en CSS de toute façon.
  function revealInList(id) {
    const item = listItem(id);
    if (!item) return;
    item.scrollIntoView({ behavior: "smooth", block: "center" });
    paintActive(id);
    item.classList.add("is-target");
    clearTimeout(flashTimer);
    flashTimer = window.setTimeout(() => {
      item.classList.remove("is-target");
      if (!openId) paintActive(null);
    }, 1500);
  }

  function canOpen() {
    return wide.matches;
  }

  for (const family of SKILL_FAMILIES) {
    const { button } = beacons.get(family.id);

    button.addEventListener("pointerenter", () => {
      if (!canOpen()) return;
      if (pinnedId) return;
      scheduleOpen(family.id);
    });

    button.addEventListener("click", () => {
      // sur mobile il n'y a pas de carte : on amène à la famille dans la liste
      if (!wide.matches) {
        revealInList(family.id);
        return;
      }
      if (pinnedId === family.id) {
        close();
      } else {
        open(family.id, { pin: true });
      }
    });

    button.addEventListener("focus", () => {
      if (canOpen()) open(family.id);
    });
  }

  scope.addEventListener("pointerleave", () => {
    if (pinnedId) return;
    clearTimeout(timer);
    timer = window.setTimeout(() => {
      if (!scope.contains(document.activeElement)) close();
    }, 160);
  });

  scope.addEventListener("pointerenter", () => clearTimeout(timer));

  scope.addEventListener("focusout", (event) => {
    if (pinnedId) return;
    if (scope.contains(event.relatedTarget)) return;
    close();
  });

  // la liste (mobile) pilote aussi le disque : on relie les deux vues
  list.addEventListener("pointerover", (event) => {
    if (!hoverPointer.matches) return;
    const item = event.target.closest(".skill-family");
    if (item) paintActive(item.dataset.family);
  });

  list.addEventListener("pointerleave", () => {
    if (!openId) paintActive(null);
  });

  document.addEventListener("keydown", (event) => {
    if (event.key === "Escape" && openId) {
      close();
    }
  });

  document.addEventListener("pointerdown", (event) => {
    if (!pinnedId) return;
    if (scope.contains(event.target)) return;
    close();
  });

  addEventListener("resize", () => {
    if (!openId) return;
    const family = SKILL_FAMILIES.find((entry) => entry.id === openId);
    if (family) place(family);
  });

  // un repaint avant la première mesure, sinon la carte mesure 0
  requestAnimationFrame(() => {
    if (openId) {
      const family = SKILL_FAMILIES.find((entry) => entry.id === openId);
      if (family) place(family);
    }

    // Filet de sécurité : si le cadran n'a pas de boîte (navigateur qui ne
    // calcule pas `aspect-ratio`), on retombe sur la liste — le contenu reste
    // lisible au lieu de laisser un trou.
    const box = dial.getBoundingClientRect();
    if (box.width < 40 || box.height < 40) {
      section.classList.add("is-dialless");
    }
  });

  return {
    open: (id) => open(id),
    close,
  };
}
