# Құқықтық мектеп кеңістігі: теориядан тәжірибеге

Kazakh-language 360° educational school. Static website: serve `dist/` over HTTP. No build step or backend. Mouse/touch drag, accessible turn/zoom buttons, nine law branches, six sequential stations, 18 questions with feedback and retries, locally stored progress, participation certificate through the browser’s native print dialog (including Save as PDF where available).

## Validation
`node scripts/check.mjs`

## Source assets
`scripts/scene-source.js` describes the original modeled school and rooms. `scripts/export-scenes.mjs` exports meshes and textures using the runtime's installed @napi-rs/canvas; `scripts/render-panoramas.py` renders equirectangular images in Blender Cycles; `python scripts/cubemaps.py <scene ...>` creates six WebP cube faces per scene. Render intermediates use /tmp/qq-scenes. Export script must be run from repository root. Blender, Python NumPy and Pillow required for asset regeneration only. Browser runtime uses self-hosted Three.js math and a Canvas 2D cubemap renderer, avoiding WebGL requirements.

## Data
Educational content in `dist/data.js`; official Kazakhstan law sources linked in the app. User-provided incorrect citations were corrected. Progress remains in localStorage on the current browser. Certificate name never leaves the browser.

## Licenses
Original school geometry and interface authored for this project. Three.js MIT license in dist/vendor/LICENSE. Manrope SIL Open Font License in dist/fonts/OFL.txt.

## Panorama quality pipeline
Exterior and yard panoramas render at 6144×3072; interiors at 4608×2304. Run `scripts/render-panoramas.py` after exporting geometry. Its output defaults to `/tmp/qq-hq` (override `PANORAMA_OUTPUT`). Denoise finished renders with `scripts/denoise-panoramas.py input.png output.png`, which uses the development-only `oidn==0.2.1` binding. Clean images belong in `/tmp/qq-hq-clean` (override `PANORAMA_SOURCE` for cube conversion). `scripts/process-panoramas.py <scene ...>` coordinates denoising and cube conversion as renders finish.

`scripts/cubemaps.py <scene ...>` samples source images bilinearly and writes 2048px cube faces plus separate 1024px mobile faces. Browser sampling is also bilinear, with a sharper device-pixel-ratio-aware resting view and a lighter drag view. `dist/signs.json`, exported from the original planes, drives perspective-aligned SVG lettering so school names, board labels and door signs stay sharp when zoomed. School content and quest progress format remain unchanged.

## Scenario videos
Six user-provided animated scenarios are hosted locally in `dist/videos/` and mapped by station number in `dist/videos.js`. Each video is approximately 10 seconds, H.264/AAC MP4 at 1280×720 with fast-start metadata. WebP posters are extracted from the supplied videos. Playback starts on request, supports native pause/seek/fullscreen controls and inline playback on phones, and pauses whenever the scenario dialog closes. The same player and playback position persist when answering questions about the same scenario. Only the current scenario requests video metadata; videos never autoplay on entry. The scenario text remains visible alongside the video and a direct file link appears if playback fails. Desktop uses two columns and mobile places the video above the text.
