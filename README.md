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
  fish-school.js     instanced low-poly sardine and mackerel schools
  barracuda.js       single barracuda at the sunlit edge
  jellyfish.js       twilight moon jellies and the abyssal jelly
  marine-snow.js     abyssal drifting particle layer
  back-to-top.js     DSMB back-to-top button behavior
  projects.js        project copy, accents, screens and drone variants
  drone-model.js     procedural underwater drone model
  hologram.js        holographic label canvas and projector beams
  drone-fleet.js     drone placement, motion, hotspots and focus state
  project-window.js  project dialog, mock screens and open/close animation
  skills.js          skill families, their items and evidence lines
  skills-dial.js     sonar dial, hover card and mobile list
  section-nav.js     dock navigation, active section and companion wiring
  diver-companion.js procedural Three.js diver beside the dock
image/               project screenshots and the avatar
  logos/             monochrome brand marks used by the skill card
model/               GLB fish loaded by marine-life.js
```

There is no build step: the browser loads these files as they are, and Three.js
comes from a CDN through the import map in `index.html`.

## Navigation

A macOS-style dock sits in the right gutter on wide screens. Each item is a real
anchor (`#top`, `#projects`, `#skills`, `#contact`) marked with `data-nav`; the
matching sections carry `data-nav-section`. The dock marks the section currently
being read with a ring, a rail bar and `aria-current="location"`, and its icons
magnify around the pointer. The four tiles reuse the pale monochrome glyph-on-dark
treatment of the skill-card tool marks: a house for Accueil, a document for
Projets, a sonar for Compétences and an envelope for Contact. Their labels rise
in a bubble just above the icon on hover and keyboard focus. Without JavaScript
the links still jump to their sections.

On large desktops (at least 90rem wide and 48rem tall) the dock keeps its
compact size and sits a little higher, so the diver can ride beside it without
covering the fourth project card. The little scuba diver rides in the same right
gutter, just left of the dock, and centres itself on the icon of the section
being read; it glides to the next icon when the active section changes, so the
travel between sections is visible. The diver is procedural Three.js
(`src/diver-companion.js`), not a GLB. Its tag tracks the current section; it
kicks more gently while the page moves and tilts with the scroll direction. Its
suit, tank and accents are dimmed by scroll depth to match the fish bands. It
renders a static pose under `prefers-reduced-motion: reduce`.

Between 1024 px and 90rem the dock stays compact in the right gutter and the
diver is hidden. Below 1024 px the dock moves to the bottom centre, the diver
and the back-to-top button are hidden, and the dock's Accueil item returns to
the top. The dock and diver are hidden while a project window is open. To add a
section, add its id to the dock with `data-nav` and put `data-nav-section` on
the section.

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

## Marine life

Each depth band has a small set of species. The sardines and mackerel are
schools, but they are not clones of a skinned GLB: each school is one
`InstancedMesh` with a procedural low-poly fish, one shared material and a
small vertex-shader tail beat. That keeps each school to one draw call and
lets the counts drop from 48 to 28 sardines and from 16 to 12 mackerel on
narrow screens. The barracuda, moon jellies, abyssal jelly and marine snow
are single lightweight meshes or point layers. All of them fade with the same
scroll bands as the GLB fish.

- Sunlit (0–50 m): the sardine bait ball and one barracuda at its edge, with
  the existing surface fish.
- Twilight (50–200 m): the mackerel school and three moon jellies, with the
  existing mid-water animals.
- Abyss (500 m+): the lanternfish, the stylized seafloor eels, one abyssal
  jelly and drifting marine snow.

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
