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
- `src/species.js` — fish species and depth-band configuration
- `src/marine-life.js` — GLB loading, fish motion, lanternfish glow
- `src/back-to-top.js` — DSMB back-to-top button behavior
