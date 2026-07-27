# Landing page video assets

Drop your footage here. The landing page components reference these exact
filenames, so the section lights up automatically the moment the files exist.

Recommended specs (silent cinematic product demo, Apple/Wise vibe):

| File | Role | Spec |
| --- | --- | --- |
| `brand.webm` + `brand.mp4` | Main "See it in motion" walkthrough | 16:9, 1920x1080, ~60s, muted, loopable, no audio |
| `vignette-1.webm` + `vignette-1.mp4` | "A budget that knows your month" | 9:16, 1080x1920, ~15s, muted |
| `vignette-2.webm` + `vignette-2.mp4` | "Hide it in a heartbeat" | 9:16, 1080x1920, ~15s, muted |
| `vignette-3.webm` + `vignette-3.mp4` | "Never miss a renewal" | 9:16, 1080x1920, ~15s, muted |

Notes:
- Provide both `.webm` (smaller, modern) and `.mp4` (Safari fallback). The
  `<video>` element lists `.webm` first; the browser picks the first it supports.
- Keep them silent. Autoplay is `muted` + `playsInline` + `loop` — no controls.
- Compress with `ffmpeg -i in.mov -c:v libwebp ...` (webm) and `libx264 -crf 23`
  (mp4). Aim < 3MB per vignette, < 8MB for the brand video.
- Posters are rendered as a tasteful tint + play glyph from the component itself
  (no separate poster image needed), so the page never looks broken before the
  files land. Once a `<video>` can play, it fades in over the poster layer.
- Under `prefers-reduced-motion: reduce` the videos do not autoplay; the poster
  stays (the surrounding text carries the message). This is intentional.