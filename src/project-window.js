const SCREEN_URLS = {
  retro: "retro-pc.luc-laignel.fr",
  biosphere: "biosphere.luc-laignel.fr",
  algo: "algo.luc-laignel.fr",
  nextcloud: "nextcloud.luc-laignel.fr",
};

const WEB_SCREEN = `
  <div class="mock-app mock-app--web">
    <div class="mock-app__top">
      <span>Journal de plongée</span>
      <span class="mock-app__button">+ Plongée</span>
    </div>
    <div class="mock-stats">
      <div><strong>42</strong><span>plongées</span></div>
      <div><strong>18 m</strong><span>profondeur moy.</span></div>
      <div><strong>7</strong><span>sites</span></div>
    </div>
    <div class="mock-rows">
      <div class="mock-row"><span>Cap Ferret</span><span>18 m</span><span>42 min</span></div>
      <div class="mock-row"><span>Île de Ré</span><span>12 m</span><span>38 min</span></div>
      <div class="mock-row"><span>Villefranche</span><span>24 m</span><span>51 min</span></div>
      <div class="mock-row"><span>Les Embiez</span><span>16 m</span><span>44 min</span></div>
    </div>
  </div>
`;

const NETWORK_SCREEN = `
  <div class="mock-app mock-app--network">
    <div class="mock-app__top">
      <span>Topologie</span>
      <span class="mock-app__button">12 nœuds</span>
    </div>
    <svg class="mock-net" viewBox="0 0 320 150" fill="none" aria-hidden="true">
      <path d="M52 78H126M126 42H224M126 78H224M126 114H224M224 42V114"
        stroke="currentColor" stroke-opacity=".3" stroke-width="1.4" stroke-dasharray="4 5"/>
      <g fill="currentColor">
        <circle cx="52" cy="78" r="7"/>
        <circle cx="126" cy="42" r="5.5"/>
        <circle cx="126" cy="78" r="5.5"/>
        <circle cx="126" cy="114" r="5.5"/>
        <circle cx="224" cy="42" r="7"/>
        <circle cx="224" cy="78" r="7"/>
        <circle cx="224" cy="114" r="7"/>
      </g>
      <circle cx="224" cy="78" r="18" stroke="currentColor" stroke-opacity=".45"/>
      <circle cx="224" cy="78" r="26" stroke="currentColor" stroke-opacity=".22" stroke-dasharray="2 5"/>
    </svg>
    <div class="mock-rows mock-rows--net">
      <div class="mock-row"><span>Supervision</span><span class="mock-ok">OK</span><span>24 h</span></div>
      <div class="mock-row"><span>VLAN 20 — invités</span><span class="mock-ok">OK</span><span>isolé</span></div>
      <div class="mock-row"><span>Passerelle</span><span>MTU</span><span>1500</span></div>
    </div>
  </div>
`;

const DATA_SCREEN = `
  <div class="mock-app mock-app--data">
    <div class="mock-app__top">
      <span>Températures par site</span>
      <span class="mock-app__button">2026</span>
    </div>
    <div class="mock-chart" aria-hidden="true">
      <span style="--v: .34"></span><span style="--v: .52"></span><span style="--v: .44"></span>
      <span style="--v: .68"></span><span style="--v: .58"></span><span style="--v: .78"></span>
      <span style="--v: .64"></span><span style="--v: .86"></span>
    </div>
    <div class="mock-axis" aria-hidden="true">
      <span>Cap Ferret</span><span>Ré</span><span>Embiez</span><span>Villefranche</span>
    </div>
    <div class="mock-query">SELECT site, AVG(temp) FROM plongees GROUP BY site;</div>
  </div>
`;

const ALGO_SCREEN = `
  <div class="mock-app mock-app--figure">
    <div class="mock-app__top">
      <span>Coloration de graphe</span>
      <span class="mock-app__button">Figure</span>
    </div>
    <figure class="mock-figure">
      <img src="image/sae-exploration-algo.png" alt="Graphe colorié de la page de couverture" decoding="async">
      <figcaption>Coloration d'un graphe</figcaption>
    </figure>
  </div>
`;

const RETRO_SCREEN = `
  <div class="mock-app mock-app--figure">
    <div class="mock-app__top">
      <span>Version finale</span>
      <span class="mock-app__button">SAE Web</span>
    </div>
    <figure class="mock-figure">
      <img src="image/retro-pc-final.png" alt="Page d'accueil finale du site Retro-PC dépannage" decoding="async">
      <figcaption>Retro-PC dépannage — version finale</figcaption>
    </figure>
  </div>
`;

const BIOSPHERE_SCREEN = `
  <div class="mock-app mock-app--figure">
    <div class="mock-app__top">
      <span>Plateau de jeu</span>
      <span class="mock-app__button">Phase 2</span>
    </div>
    <figure class="mock-figure">
      <img src="image/biosphere-board.png" alt="Plateau de jeu Biosphère7 avec les plantes et la liste des espèces" decoding="async">
      <figcaption>Biosphère7 — plateau de jeu (phase 2)</figcaption>
    </figure>
  </div>
`;

const NEXTCLOUD_SCREEN = `
  <div class="mock-app mock-app--carousel">
    <div class="mock-app__top">
      <span>Wiki du projet</span>
      <span class="mock-app__button">SAE Réseau</span>
    </div>
    <div class="mock-carousel" data-carousel>
      <div class="mock-carousel__stage">
        <img class="mock-carousel__image is-active" src="image/nextcloud-vm.webp"
          alt="Poste client virtuel avec la fenêtre de connexion Nextcloud"
          data-caption="Machines virtuelles — poste client" decoding="async">
        <img class="mock-carousel__image" src="image/nextcloud-install.webp"
          alt="Terminal Debian pendant l'installation de snapd"
          data-caption="Installation du serveur — snap" decoding="async">
        <img class="mock-carousel__image" src="image/nextcloud-apps.webp"
          alt="Applications et sécurité du serveur Nextcloud"
          data-caption="Nextcloud — applications et sécurité" decoding="async">
        <button class="mock-carousel__arrow mock-carousel__arrow--prev" type="button"
          data-carousel-prev aria-label="Image précédente">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M15 6l-6 6 6 6"/></svg>
        </button>
        <button class="mock-carousel__arrow mock-carousel__arrow--next" type="button"
          data-carousel-next aria-label="Image suivante">
          <svg viewBox="0 0 24 24" aria-hidden="true"><path d="M9 6l6 6-6 6"/></svg>
        </button>
        <span class="mock-carousel__count" aria-live="polite">1 / 3</span>
      </div>
      <p class="mock-carousel__caption">Machines virtuelles — poste client</p>
    </div>
  </div>
`;

const SCREENS = {
  web: WEB_SCREEN,
  network: NETWORK_SCREEN,
  data: DATA_SCREEN,
  algo: ALGO_SCREEN,
  biosphere: BIOSPHERE_SCREEN,
  retro: RETRO_SCREEN,
  nextcloud: NEXTCLOUD_SCREEN,
};

function screenMarkup(kind, url) {
  return `
    <div class="mock-window">
      <div class="mock-window__chrome" aria-hidden="true">
        <span class="mock-window__dots"><i></i><i></i><i></i></span>
        <span class="mock-window__url">${url}</span>
        <span class="mock-window__badge">APERÇU</span>
      </div>
      <div class="mock-window__viewport">${SCREENS[kind] ?? WEB_SCREEN}</div>
    </div>
  `;
}

/**
 * The project window. It is a native modal dialog for focus management and
 * Escape handling; the opening growth is driven from the drone's projector
 * point so the drone appears to be emitting the interface.
 */
export function createProjectWindow() {
  const dialog = document.querySelector("#project-window");
  if (!dialog) {
    return { open: () => Promise.resolve(), close: () => {}, isOpen: () => false };
  }

  const panel = dialog.querySelector(".project-window__panel");
  const veil = dialog.querySelector(".project-window__veil");
  const beam = dialog.querySelector(".project-window__beam");
  const closeButton = dialog.querySelector(".project-window__close");
  const title = dialog.querySelector("#project-window-title");
  const subtitle = dialog.querySelector("#project-window-subtitle");
  const description = dialog.querySelector("#project-window-description");
  const number = dialog.querySelector("#project-window-number");
  const category = dialog.querySelector("#project-window-category");
  const year = dialog.querySelector("#project-window-year");
  const link = dialog.querySelector("#project-window-link");
  const stack = dialog.querySelector("#project-window-stack");
  const screen = dialog.querySelector("#project-window-screen");
  const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)");

  let resolveClose = null;
  let trigger = null;
  let origin = { x: 0, y: 0 };
  let closing = false;

  // The project screen is re-populated on every open, so one delegated click
  // listener is enough for every carousel arrow the screen may contain.
  screen.addEventListener("click", (event) => {
    const control = event.target.closest?.("[data-carousel-prev], [data-carousel-next]");
    if (!control) return;
    const carousel = control.closest("[data-carousel]");
    if (!carousel) return;
    const images = Array.from(carousel.querySelectorAll(".mock-carousel__image"));
    if (!images.length) return;
    const current = Math.max(
      0,
      images.findIndex((image) => image.classList.contains("is-active"))
    );
    const next =
      (current + (control.hasAttribute("data-carousel-next") ? 1 : -1) + images.length) %
      images.length;
    images.forEach((image, index) => {
      image.classList.toggle("is-active", index === next);
    });
    const count = carousel.querySelector(".mock-carousel__count");
    const caption = carousel.querySelector(".mock-carousel__caption");
    if (count) count.textContent = `${next + 1} / ${images.length}`;
    if (caption) caption.textContent = images[next].dataset.caption || "";
  });

  function populate(project) {
    dialog.style.setProperty("--accent", project.accent);
    title.textContent = project.title;
    subtitle.textContent = project.subtitle;
    description.textContent = project.description;
    number.textContent = project.number;
    category.textContent = project.category;
    year.textContent = project.year;
    link.textContent = `Liaison drone ${project.number}`;
    stack.replaceChildren(
      ...project.stack.map((item) => {
        const chip = document.createElement("li");
        chip.textContent = item;
        return chip;
      })
    );
    screen.innerHTML = screenMarkup(
      project.screen,
      SCREEN_URLS[project.id] ?? "apercu.luc-laignel.fr"
    );
    screen.dataset.kind = project.screen;
  }

  function placeBeam() {
    if (!beam) return;
    const rect = panel.getBoundingClientRect();
    const compact = window.innerWidth < 768;
    const height = Math.max(0, origin.y - rect.bottom - 18);
    beam.style.left = `${origin.x}px`;
    beam.style.top = `${rect.bottom}px`;
    beam.style.width = `${Math.min(rect.width * 0.28, 240)}px`;
    beam.style.height = `${height}px`;
    beam.style.display = compact || height < 24 ? "none" : "block";
  }

  function panelKeyframes(opening) {
    const rect = panel.getBoundingClientRect();
    const dx = origin.x - (rect.left + rect.width / 2);
    const dy = origin.y - rect.bottom;
    const compact = window.innerWidth < 768 || prefersReducedMotion.matches;
    if (compact) {
      return opening
        ? [
            { opacity: 0, transform: "translate(-50%, 0) scale(.97)" },
            { opacity: 1, transform: "translate(-50%, 0) scale(1)" },
          ]
        : [
            { opacity: 1, transform: "translate(-50%, 0) scale(1)" },
            { opacity: 0, transform: "translate(-50%, 0) scale(.98)" },
          ];
    }
    if (opening) {
      return [
        {
          opacity: 0.25,
          transform: `translate(calc(-50% + ${dx}px), ${dy}px) scale(.06)`,
        },
        { opacity: 1, transform: "translate(-50%, 0) scale(1)" },
      ];
    }
    return [
      { opacity: 1, transform: "translate(-50%, 0) scale(1)" },
      {
        opacity: 0.25,
        transform: `translate(calc(-50% + ${dx}px), ${dy}px) scale(.06)`,
      },
    ];
  }

  function finishClose() {
    if (!dialog.open) return;
    panel.getAnimations().forEach((animation) => animation.cancel());
    veil?.getAnimations().forEach((animation) => animation.cancel());
    beam?.getAnimations().forEach((animation) => animation.cancel());
    dialog.close();
    dialog.classList.remove("is-open");
    document.documentElement.classList.remove("has-project-window");
    closing = false;
    if (beam) {
      beam.style.display = "none";
      beam.style.height = "0px";
    }
    if (trigger?.isConnected) {
      trigger.focus({ preventScroll: true });
    }
    trigger = null;
    const resolve = resolveClose;
    resolveClose = null;
    resolve?.();
  }

  function requestClose() {
    if (!dialog.open || closing) return;
    closing = true;
    const compact =
      window.innerWidth < 768 || prefersReducedMotion.matches;
    dialog.classList.remove("is-open");

    panel.getAnimations().forEach((animation) => animation.cancel());
    veil?.getAnimations().forEach((animation) => animation.cancel());
    beam?.getAnimations().forEach((animation) => animation.cancel());
    const panelAnimation = panel.animate(panelKeyframes(false), {
      duration: compact ? 170 : 340,
      easing: "cubic-bezier(.4, 0, .7, .2)",
      fill: "both",
    });
    if (veil) {
      veil.animate([{ opacity: 1 }, { opacity: 0 }], {
        duration: compact ? 170 : 300,
        easing: "ease-out",
        fill: "both",
      });
    }
    if (beam) {
      beam.animate([{ opacity: 0.16 }, { opacity: 0 }], {
        duration: compact ? 130 : 220,
        easing: "ease-out",
        fill: "both",
      });
    }

    const finish = () => finishClose();
    if (panelAnimation.finished?.then) {
      panelAnimation.finished.then(finish).catch(finish);
    } else {
      window.setTimeout(finish, 360);
    }
  }

  function open(project, originPoint, triggerElement) {
    if (dialog.open) return Promise.resolve();
    trigger = triggerElement ?? null;
    origin = {
      x: Number.isFinite(originPoint?.x) ? originPoint.x : window.innerWidth / 2,
      y: Number.isFinite(originPoint?.y) ? originPoint.y : window.innerHeight * 0.8,
    };
    populate(project);
    closing = false;
    document.documentElement.classList.add("has-project-window");
    try {
      dialog.showModal();
    } catch {
      document.documentElement.classList.remove("has-project-window");
      trigger = null;
      return Promise.resolve();
    }

    dialog.classList.add("is-open");
    placeBeam();
    panel.focus({ preventScroll: true });

    const compact =
      window.innerWidth < 768 || prefersReducedMotion.matches;
    if (veil) {
      veil.animate([{ opacity: 0 }, { opacity: 1 }], {
        duration: compact ? 180 : 300,
        easing: "ease-out",
        fill: "both",
      });
    }
    panel.getAnimations().forEach((animation) => animation.cancel());
    panel.animate(panelKeyframes(true), {
      duration: compact ? 220 : 560,
      easing: "cubic-bezier(.16, .84, .24, 1)",
      fill: "both",
    });
    if (beam) {
      beam.animate(
        [
          { opacity: 0, transform: "translateX(-50%) scaleY(.15)" },
          { opacity: 0.16, transform: "translateX(-50%) scaleY(1)" },
        ],
        {
          duration: compact ? 180 : 460,
          easing: "cubic-bezier(.16, .84, .24, 1)",
          fill: "both",
        }
      );
    }

    return new Promise((resolve) => {
      resolveClose = resolve;
    });
  }

  closeButton?.addEventListener("click", requestClose);
  dialog.addEventListener("click", (event) => {
    if (event.target === dialog || event.target.closest("[data-close]")) {
      requestClose();
    }
  });
  dialog.addEventListener("cancel", (event) => {
    event.preventDefault();
    requestClose();
  });
  dialog.addEventListener("close", () => {
    document.documentElement.classList.remove("has-project-window");
    if (resolveClose) {
      const resolve = resolveClose;
      resolveClose = null;
      resolve();
    }
  });
  window.addEventListener("resize", () => {
    if (dialog.open) placeBeam();
  });

  return {
    open,
    close: requestClose,
    isOpen: () => dialog.open,
  };
}
