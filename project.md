# CloudCanvas

A browser-based AI-powered image editor built on React, Konva, and Cloudinary. Users generate, upload, and non-destructively edit images using Cloudinary's full transformation and generative-AI suite — all from a single-page app with no backend database.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | React 19 + TypeScript |
| Build | Vite 8 |
| Canvas | Konva + react-konva |
| State | Zustand (persisted to localStorage) |
| Styling | Tailwind CSS v3 |
| Icons | Lucide React |
| Notifications | react-hot-toast |
| Image loading | use-image |
| Layout | react-resizable-panels |
| Proxy server | Node.js HTTP (no framework, ESM) |
| Cloudinary SDK | @cloudinary/react + @cloudinary/url-gen |
| Animation | anime.js |

---

## Architecture

```
cloudcanvas/
├── src/
│   ├── components/
│   │   ├── editor/
│   │   │   ├── Canvas.tsx           # Konva stage — renders all layers, handles tools
│   │   │   ├── AIEditPanel.tsx      # Right panel: filters, tools, transforms, set-as-bg
│   │   │   ├── MagicEditOverlay.tsx # Floating toolbar: smart expand, magic remove, heal
│   │   │   ├── GeneratePopover.tsx  # Quick AI generate popover from toolbar
│   │   │   └── Toolbar.tsx          # Left sidebar: tool selector
│   │   ├── generator/
│   │   │   └── GeneratorPanel.tsx   # Full AI chat panel with generate + set-as-background
│   │   ├── panels/
│   │   │   ├── LayersPanel.tsx      # Layer list, visibility, lock, opacity, reorder
│   │   │   ├── ExportPanel.tsx      # Export canvas or individual layers
│   │   │   ├── HistoryPanel.tsx     # Undo history timeline
│   │   │   └── TransformationGraph.tsx
│   │   └── ui/
│   │       ├── NewProjectScreen.tsx # Start screen: templates, upload, custom size
│   │       ├── TopBar.tsx           # Project name, undo, zoom controls
│   │       └── FileUpload.tsx
│   ├── store/
│   │   └── index.ts                 # Zustand store — full app state
│   ├── lib/
│   │   ├── cloudinary.ts            # Transformation maps, prompt enhancer, export presets
│   │   └── api.ts                   # generateImage(), uploadToCloudinary()
│   ├── server/
│   │   └── index.mjs                # Node proxy — injects Cloudinary API credentials
│   └── types/
│       └── index.ts                 # Layer, Project, ChatMessage, etc.
```

The proxy server (`src/server/index.mjs`) runs on port 3001 alongside Vite. It injects `CLOUDINARY_API_KEY` and `CLOUDINARY_API_SECRET` server-side so credentials never appear in the browser bundle. Vite proxies `/api/*` requests to it.

---

## Features

### Canvas & Editor

- **Multi-layer canvas** — Konva stage with full layer stack: image, text, shape layers
- **Layer panel** — reorder via drag, toggle visibility, lock/unlock, opacity slider, delete
- **Undo history** — up to 50 snapshots, full layer state rollback
- **Zoom & pan** — Ctrl+scroll to zoom, fit-to-canvas default view
- **Canvas clipping** — Konva content layer clipped to canvas bounds; layers outside are hidden
- **Canvas backgrounds** — transparent (checkerboard), solid color, or image
- **Canvas templates** — HD (1920×1080), Instagram (1080×1080), Story (1080×1920), YouTube (1280×720), A4 Print (2480×3508), Square (1000×1000), or custom size

### Tools (Toolbar)

| Tool | Description |
|---|---|
| Select | Click to select, drag to move, transform handles to resize |
| Move | Pan layers freely |
| Crop | Draw crop rectangle on any Cloudinary layer |
| Lasso | Draw freehand region → gen-remove that area |
| Heal / Erase Object | Paint brush strokes over an object → generative remove |
| Magic Remove | One-click background removal or watermark removal |
| Smart Expand | Generative outpainting to 16:9, 9:16, 1:1, 4:5, 4:3, 21:9 |
| Text | Click to place a text layer |
| Shape | Draw rect, ellipse, triangle, star, or arrow |
| AI Generate | Quick popover to generate an image in-canvas |

### AI Edit Panel (right sidebar)

**One-click Tools**
- Auto Enhance, Auto Color, Auto Contrast
- Red Eye Fix, Blur Faces
- Drop Shadow, Oil Paint, Vectorize, Outline, Negate
- Tint Red / Blue, Rotate 90°/180°, Flip H/V

**Filters (25+)**
- Cinematic, Vintage, Grayscale, Sepia, Vivid, Cool, Warm, Sharp, Soft, High Contrast
- Enhance, Upscale, Matte, Faded, Dramatic, Neon, Bleach, Deep
- Brightness ±, Saturate ±, Gamma+, Vignette
- Restore (generative restore — `e_gen_restore`)

**Artistic Styles (17 Cloudinary art filters)**
- Audrey, Athena, Aurora, Daguerre, Eucalyptus, Frost, Hairspray, Hokusai, Incognito, Linen, Peacock, Primavera, Quartz, Red Rock, Sonnet, Ukulele, Zorro

**Smart Crop Presets**
- Square, Portrait, Story, Landscape (gravity-auto)
- Face Crop (`g_face`), Subject crop (`g_auto:subject`)

**Set as Background**
- Scales selected image layer to cover the canvas (object-fit: cover math using true pixel dimensions)
- Moves layer to bottom of stack
- Keeps layer selected so user can drag to reframe
- Works for both Cloudinary-uploaded images and locally uploaded images

### AI Generator Panel

- Chat-style interface with conversation history (persisted)
- Generation presets: Photo, Illustration, Product, Poster, Thumbnail, Branding
- Prompt enhancer — injects quality/style modifiers per preset before sending to Cloudinary
- Suggestion prompts for quick start
- **Set as Background** button on each generated image — one click scales it to cover the canvas as the bottom layer

### Magic Edit Overlay (floating toolbar)

Appears when Heal / Magic Remove / Expand tool is active:

**Heal / Erase Object**
- Paint brush strokes over an object on the canvas
- Sends painted bounding box as `e_gen_remove:region_(x;y;w;h)` to Cloudinary
- Polls until Cloudinary's generative processing completes (up to 12 retries × 3s)

**Magic Remove**
- Background Removal — `e_background_removal,f_png`
- Watermark Removal — `e_gen_remove:prompt_watermark`

**Smart Expand (Generative Outpainting)**
- Uses `c_pad,b_gen_fill` (correct syntax, verified via live Cloudinary API)
- Aspect ratios: 16:9, 9:16, 1:1, 4:5, 4:3, 21:9
- Polls until ready, then updates the layer src

### Export Panel

- **Export Full Canvas** — Konva `stage.toDataURL()` composites all visible layers, downloads as PNG at native canvas resolution
- **Export source picker** — when multiple Cloudinary layers exist, dropdown lets user choose which layer the preset exports target (defaults to "Background" layer)
- **Export Presets** — Instagram, IG Story, TikTok, Pinterest, Twitter/X, LinkedIn, YouTube, OG/Meta, Mobile, Desktop — each in PNG / JPG / WEBP
- **Recent exports** history with file size comparison (original vs optimised)

### Project Management

- Project name editing (TopBar)
- Persistent state via Zustand `persist` middleware (localStorage key: `cloudcanvas-v1`)
- Transformation graph visualisation panel

---

## Cloudinary AI Features Used

| Feature | Cloudinary API | Where used |
|---|---|---|
| Text-to-image generation | `POST /v2/generate/{cloud}/text_to_image` (Flux-2 Klein 9B) | Generator Panel, GeneratePopover |
| Background removal | `e_background_removal` | Magic Remove |
| Generative object remove | `e_gen_remove:region_(x;y;w;h)` | Heal tool, Lasso tool |
| Generative watermark remove | `e_gen_remove:prompt_watermark` | Magic Remove |
| Generative outpainting | `c_pad,b_gen_fill,ar_*` | Smart Expand |
| Generative restore | `e_gen_restore` | Filters panel |
| AI upscale | `e_upscale` | One-click tools |
| Smart gravity crop | `c_fill,g_auto` / `c_thumb,g_face` / `g_auto:subject` | Smart Crop presets |
| Art filters | `e_art:*` (17 styles) | Artistic Styles |
| Auto enhance / color / contrast | `e_auto_enhance`, `e_auto_color`, `e_auto_contrast` | One-click tools |
| Image upload | `POST /v1_1/{cloud}/image/upload` | FileUpload, NewProjectScreen |

### URL Construction Safety

All Cloudinary transformation URLs are built via `injectTransformation()` which:
1. Strips query strings (`?t=`, `?p=`)
2. Strips version segments (`v1234567890`)
3. Strips prior transformation chains (no duplicate `f_auto,q_auto` etc.)
4. Strips file extensions from public IDs (`.png`, `.jpg`)

This prevents 400 errors from Cloudinary's generative-AI endpoints which require a bare public ID.

### Generative AI Polling

Cloudinary generative AI operations return 423 (processing) or 420 (pending) while processing. `pollUntilReady()` probes the URL with a cache-busting param (`?p=N`) every 3 seconds, up to 12 attempts, before rejecting with a user-facing timeout message.

---

## Environment Variables

```env
VITE_CLOUDINARY_CLOUD_NAME=your_cloud_name
VITE_CLOUDINARY_API_KEY=your_api_key
VITE_CLOUDINARY_API_SECRET=your_api_secret
VITE_CLOUDINARY_UPLOAD_PRESET=ml_default   # unsigned upload preset
```

The proxy server reads these at startup. `VITE_CLOUDINARY_CLOUD_NAME` is also used client-side (safe — it's public). `API_KEY` and `API_SECRET` never leave the proxy.

---

## Running Locally

```bash
npm install
npm run dev        # starts both Vite (port 5173) and proxy server (port 3001)
```

The `dev` script uses `concurrently` to run both processes. Vite's proxy config forwards `/api/*` to `localhost:3001`.

---

## Tests

```bash
npx vitest run
```

Test file: `src/components/editor/__tests__/MagicEditOverlay.injectTransformation.test.ts`

Covers 13 cases: clean URLs, version segments, file extensions, prior transform chains, query strings, folder-prefixed public IDs, correct `b_gen_fill` vs `e_gen_fill` assertion.
