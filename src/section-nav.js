import { createDiverCompanion } from "./diver-companion.js";

const DESKTOP_QUERY = "(min-width: 64em)";
const FINE_POINTER_QUERY = "(hover: hover) and (pointer: fine)";
const REDUCED_MOTION_QUERY = "(prefers-reduced-motion: reduce)";

const clamp = (value, min, max) => Math.min(max, Math.max(min, value));

/**
 * The side dock and its dive companion.
 *
 * The dock is a regular in-page navigation: every link is a real anchor, so it
 * keeps working without JavaScript or with the smooth-scroll preference off.
 * This module only adds the macOS-style magnification, marks the section we are
 * reading, and makes the diver follow the page's scroll depth.
 */
export function initSectionNav() {
  const dock = document.getElementById("dock");
  const diver = document.getElementById("diver");
  const stage = diver?.querySelector("[data-diver-stage]");
  const tagIndex = diver?.querySelector("[data-diver-index]");
  const tagLabel = diver?.querySelector("[data-diver-label]");

  if (!dock || !diver || !stage) {
    return { update() {} };
  }

  const links = [...dock.querySelectorAll("[data-nav]")].map((link, index) => ({
    link,
    item: link.closest(".dock__item"),
    icon: link.querySelector(".dock__icon"),
    id: link.dataset.nav,
    label: link.getAttribute("aria-label") || "",
    index,
  }));

  const sections = [...document.querySelectorAll("[data-nav-section]")]
    .map((element) => ({
      element,
      id: element.dataset.navSection,
    }))
    .filter((section) => section.id);

  const desktop = matchMedia(DESKTOP_QUERY);
  const finePointer = matchMedia(FINE_POINTER_QUERY);
  const reduceMotion = matchMedia(REDUCED_MOTION_QUERY);

  let companion = null;
  let activeId = "";
  let velocity = 0;
  let previousScroll = window.scrollY;
  let maxScroll = 1;
  let pointerInside = false;

  function measure() {
    maxScroll = Math.max(1, document.documentElement.scrollHeight - window.innerHeight);
    pointerInside = false;
    readActiveSection();
    if (desktop.matches) {
      companion?.resize();
      placeDiver();
    }
  }

  function placeDiver() {
    if (!desktop.matches) return;
    const gap = 56;
    const target = Math.max(10, dock.getBoundingClientRect().top - diver.offsetHeight - gap);
    diver.style.transform = `translate3d(0, ${Math.round(target)}px, 0)`;
  }

  function setActive(id) {
    const found = links.find((entry) => entry.id === id);
    if (!found || id === activeId) return;
    activeId = id;

    for (const entry of links) {
      const isActive = entry === found;
      entry.item?.classList.toggle("is-active", isActive);
      if (isActive) {
        entry.link.setAttribute("aria-current", "location");
      } else {
        entry.link.removeAttribute("aria-current");
      }
    }

    if (tagIndex) tagIndex.textContent = String(found.index).padStart(2, "0");
    if (tagLabel) tagLabel.textContent = found.label;
  }

  function readActiveSection() {
    const probe = window.scrollY + window.innerHeight * 0.42;
    let current = sections[0];
    for (const section of sections) {
      const top = section.element.getBoundingClientRect().top + window.scrollY;
      if (top <= probe) current = section;
    }
    if (current) setActive(current.id);
  }

  function onScroll() {
    readActiveSection();
  }

  function magnifyAt(clientY) {
    if (!finePointer.matches || !desktop.matches) return;
    for (const entry of links) {
      const rect = entry.icon?.getBoundingClientRect();
      if (!rect) continue;
      const center = rect.top + rect.height / 2;
      const distance = Math.abs(clientY - center);
      const falloff = Math.exp(-(distance * distance) / (2 * 58 * 58));
      entry.icon.style.setProperty("--magnify", (1 + falloff * 0.34).toFixed(3));
    }
  }

  function resetMagnification() {
    pointerInside = false;
    for (const entry of links) {
      entry.icon?.style.setProperty("--magnify", "1");
    }
  }

  function setupDock() {
    dock.addEventListener("pointerenter", (event) => {
      pointerInside = true;
      magnifyAt(event.clientY);
    });

    dock.addEventListener("pointermove", (event) => {
      if (pointerInside) magnifyAt(event.clientY);
    });

    dock.addEventListener("pointerleave", resetMagnification);

    for (const entry of links) {
      entry.link.addEventListener("focus", () => {
        entry.icon?.style.setProperty("--magnify", "1.16");
      });
      entry.link.addEventListener("blur", () => {
        entry.icon?.style.setProperty("--magnify", "1");
      });

      entry.link.addEventListener("click", (event) => {
        if (
          event.defaultPrevented ||
          event.button !== 0 ||
          event.metaKey ||
          event.ctrlKey ||
          event.shiftKey ||
          event.altKey
        ) {
          return;
        }

        const target = document.getElementById(entry.id);
        if (!target) return;

        event.preventDefault();
        target.scrollIntoView({
          behavior: reduceMotion.matches ? "auto" : "smooth",
          block: "start",
        });
        history.pushState(null, "", `#${entry.id}`);
        setActive(entry.id);
      });
    }
  }

  function setupDiver() {
    if (desktop.matches && !companion) {
      companion = createDiverCompanion(stage);
      if (!companion) {
        diver.classList.add("is-fallback");
      }
    }
    if (desktop.matches) {
      companion?.resize();
      placeDiver();
    }
  }

  setupDock();
  readActiveSection();
  setupDiver();

  const resizeObserver = new ResizeObserver(() => measure());
  resizeObserver.observe(document.body);

  window.addEventListener("resize", measure, { passive: true });
  window.addEventListener("scroll", onScroll, { passive: true });
  document.fonts?.ready.then(measure);

  desktop.addEventListener("change", () => {
    if (desktop.matches) {
      setupDiver();
    } else {
      resetMagnification();
    }
  });

  function update(dt, time) {
    if (!desktop.matches) {
      previousScroll = window.scrollY;
      return;
    }

    const currentScroll = window.scrollY;
    const delta = currentScroll - previousScroll;
    previousScroll = currentScroll;

    // Scroll speed feeds the fins and the body pitch: descending noses down,
    // rising noses up. It decays back to a calm hover when the page is still.
    const instant = clamp(delta / Math.max(dt, 0.001), -2200, 2200);
    velocity += (instant - velocity) * Math.min(1, dt * 4.5);
    const drive = clamp(Math.abs(velocity) / 2400, 0, 1);
    const progress = clamp(window.scrollY / maxScroll, 0, 1);

    companion?.setSwimming(0.12 + drive * 0.5);
    companion?.setTilt(clamp(-velocity / 3600, -0.2, 0.2));
    companion?.setDepth(progress);

    if (!document.documentElement.classList.contains("has-project-window")) {
      companion?.update(dt, time);
    }
  }

  return { update };
}
