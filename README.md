# PortfolioWeb

Portfolio with a Three.js underwater scene.

## Run locally

Opening `index.html` directly (`file://`) will not work: browsers block local
ES modules and `.glb` requests for security. The page must be served over HTTP.

On macOS, double-click `start.command`. It starts a local server and opens Zen
at <http://127.0.0.1:8000>.

Or run it manually:

```bash
python3 -m http.server 8000
```

Then open <http://localhost:8000> in any browser.

The live preview works because it already serves the folder over HTTP.

## Structure

```text
index.html           page markup and the four sections
style.css            all styles, including the sonar dial
script.js            entry point: renderer, camera, scroll and main loop
start.command        local server + browser launcher (macOS)
src/                 one module per feature
  palette.js         scroll-depth colors and adaptive text contrast
  bubbles.js         bubble field and glass-bubble shader
  sun-rays.js        surface light rays
  seafloor.js        abyssal sand, rocks and the sand-height function
  abyss-eels.js      glowing seafloor eels for the contact depth
  foreground-reef.js 2D foreground reef fade control
  species.js         fish species and depth-band configuration
  marine-life.js     GLB loading, fish motion, lanternfish glow
  back-to-top.js     DSMB back-to-top button behavior
  projects.js        project copy, accents, screens and drone variants
  drone-model.js     procedural underwater drone model
  hologram.js        holographic label canvas and projector beams
  drone-fleet.js     drone placement, motion, hotspots and focus state
  project-window.js  project dialog, mock screens and open/close animation
  skills.js          skill families, their items and evidence lines
  skills-dial.js     sonar dial, hover card and mobile list
image/               project screenshots and the avatar
  logos/             monochrome brand marks used by the skill card
model/               GLB fish loaded by marine-life.js
```

There is no build step: the browser loads these files as they are, and Three.js
comes from a CDN through the import map in `index.html`.

## Project drones

The "Projets" section has one floating drone per project. Each drone projects a
holographic card with the project title, and the card is also a button: clicking
it flies the drone to a docking point in front of the camera and opens a
full-screen project window as if the drone were projecting it. Close with the X,
Escape, or a click outside the panel; the window collapses back into the
projector and the drone returns to its slot.

To add a project, add an entry to `PROJECTS` in `src/projects.js` (`title`,
`category`, `year`, `subtitle`, `description`, `stack`, `accent`, `screen`,
`drone.variant`). `drone.variant` selects one of the four procedural fan layouts
(0–3), and `accent` drives the label, beam, and window styling. `screen` selects
the screen mock (`retro`, `web`, `network`, `data`, `algo`, `biosphere`,
`nextcloud`). The `retro` screen uses the final version screenshot from page 4
of the SAE Web report (`image/retro-pc-final.png`); the `algo` screen uses the
cover graph from the SAÉ report (`image/sae-exploration-algo.png`); the
`biosphere` screen uses the board screenshot from page 5 of the Biosphère7
report (`image/biosphere-board.png`). The `nextcloud` screen is a carousel of
three screenshots from the SAE network report (`image/nextcloud-vm.webp`,
`image/nextcloud-install.webp`, `image/nextcloud-apps.webp`), cycled with the
arrows inside the project window. The layout is built for four projects; a fifth
needs a new slot in `src/drone-fleet.js`.

The drones respect `prefers-reduced-motion`: no idle drift, no rotor spin, and
shorter window transitions.

## Compétences

The section is a sonar dial. Five families sit at fixed bearings, each one
surrounded by satellites (the tools behind it); the distance from the centre
means nothing, there is no ranking. Hovering, clicking or focusing a contact
opens a card with the family's logos and the SAEs where those tools were used.
Below 1024 px the dial stays on screen as a visual and the list underneath
carries the content: tapping a contact scrolls to its family and outlines it.

To change the content, edit `SKILL_FAMILIES` in `src/skills.js`. Each family has
`id`, `label`, `summary`, `angle` (its bearing in degrees, 0 = north, clockwise),
`evidence` (the line at the bottom of the card) and `items`. An item is either
`{ name: "Java", logo: "java" }`, where `java` is a file of `image/logos/`
without its extension, or `{ name: "SQL" }` when no mark exists — those are
rendered as text, never as an empty tile. `SKILL_COUNT` is derived from the
items, so the "24 compétences" line follows the data.

A logo must be a single-colour SVG: it is drawn as a CSS mask over the card's
background, so it is always painted in the theme colour instead of its own.
