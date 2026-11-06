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

- `script.js` — entry point, renderer, camera, resize and main loop
- `src/palette.js` — scroll-depth colors and adaptive text contrast
- `src/bubbles.js` — bubble field and glass-bubble shader
- `src/sun-rays.js` — surface light rays
- `src/seafloor.js` — abyssal sand, rocks and the sand-height function
- `src/foreground-reef.js` — 2D foreground reef fade control
- `src/species.js` — fish species and depth-band configuration
- `src/marine-life.js` — GLB loading, fish motion, lanternfish glow
- `src/back-to-top.js` — DSMB back-to-top button behavior
- `src/projects.js` — project copy, accents, and drone variants
- `src/drone-model.js` — procedural underwater drone model
- `src/hologram.js` — holographic label canvas and projector beams
- `src/drone-fleet.js` — drone placement, motion, hotspots, and focus state
- `src/project-window.js` — project dialog, mock screens, and open/close animation

## Project drones

The "Projets" section has one floating drone per project. Each drone projects a
holographic card with the project title, and the card is also a button: clicking
it flies the drone to a docking point in front of the camera and opens a
full-screen project window as if the drone were projecting it. Close with the X,
Escape, or a click outside the panel; the window collapses back into the
projector and the drone returns to its slot.

To add a project, add an entry to `PROJECTS` in `src/projects.js` (`title`,
`category`, `year`, `subtitle`, `description`, `stack`, `accent`, `screen`,
`drone.variant`). `drone.variant` selects one of the three procedural fan layouts
(0–2), and `accent` drives the label, beam, and window styling. `screen` selects
the screen mock (`retro`, `web`, `network`, `data`, `algo`, `biosphere`). The
`retro` screen uses the final version screenshot from page 4 of the SAE Web
report (`image/retro-pc-final.png`); the `algo` screen uses the cover graph from
the SAÉ report (`image/sae-exploration-algo.png`); the `biosphere` screen uses
the board screenshot from page 5 of the Biosphère7 report
(`image/biosphere-board.png`). The layout is built for three projects; a fourth
needs a new slot in `src/drone-fleet.js`.

The drones respect `prefers-reduced-motion`: no idle drift, no rotor spin, and
shorter window transitions.
