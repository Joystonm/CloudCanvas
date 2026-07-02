# Build CloudCanvas — Browser-Based Professional Media Editor + AI Creation Studio

Before writing any code:

Run:

```bash
npx getdesign@latest add spotify
```

Import and study the generated design system.

Do not redesign immediately.

Understand:

* spacing
* component hierarchy
* interaction model
* navigation
* panels
* transitions
* visual language

Use this as the UI foundation.

---

# Challenge Requirements (Mandatory)

This project is built specifically for the Cloudinary Mini Hack.

Before implementation:

Read:

Skills Pack:
https://github.com/cloudinary-devs/skills

Documentation:
https://cloudinary.com/documentation/cloudinary_llm_mcp#cloudinary_skills

The project MUST use Cloudinary Skills as a core capability.

Required Skills:

## cloudinary-docs

Use for:

* correct SDK usage
* implementation guidance
* transformation validation
* avoiding hallucinated APIs

---

## cloudinary-transformations

Primary editing engine.

Convert natural language into valid Cloudinary transformation URLs.

Examples:

Input:

```text
make cinematic
```

↓

```text
e_sepia,q_auto
```

Input:

```text
compress for web
```

↓

```text
f_auto,q_auto
```

---

## cloudinary-react

Use latest React integration patterns.

Required for:

* uploads
* rendering
* transformed previews
* media pipelines

---

# Product

Name:
CloudCanvas

Tagline:
Create. Edit. Transform.

Professional browser-based media editing and AI generation.

Cloudinary powers editing.

Cloudinary Image Generation powers generation.

---

# Core Idea

Users should be able to:

```text
Generate
↓

Edit

↓

Transform

↓

Export
```

without leaving browser.

---

# Stack

Frontend:

```text
React
Vite
TypeScript
Tailwind
Spotify Design
```

Canvas:

```text
Konva
```

State:

```text
Zustand
```

Animation:

```text
Anime.js
```

Cloud:

```text
Cloudinary Skills
Cloudinary React SDK
```

AI:

```text
Cloudinary Image Generation
```

---

# FEATURE 1 — AI Image Generator (Hero Feature)

Build a generative AI chatbot.

Users type:

```text
create a luxury perfume ad
```

or

```text
minimal travel poster
```

System:

User Prompt

↓

Prompt Optimizer

↓

Cloudinary Image Generation

↓

Generated Image

↓

Open directly in CloudCanvas

Generated images must immediately become editable.

---

# Cloudinary Image Generation Integration

API:

```json
{
"purpose":"AI image generation",
"endpoint":"https://api.cloudinary.com/v1_1/{cloud_name}/image/generate",
"auth":"HTTP Basic (API Key + API Secret)",
"models":["flux","recraft","gpt-image","nano-banana","ideogram"]
}
```

Generate via backend proxy.

Never expose API credentials.

Generated images are automatically saved as managed Cloudinary assets —
no separate upload step required.

---

# Prompt Refinement Engine (IMPORTANT)

Do NOT send raw prompts.

Build internal prompt enhancement.

Convert:

```text
dog
```

into:

```text
high-end editorial photograph of a golden retriever, balanced composition, realistic lighting, premium color grading, ultra detailed textures, clean background, cinematic atmosphere, natural shadows, professional photography
```

Generate production-quality outputs.

Prompt Enhancer Rules:

Enhance:

Composition:

* centered
* rule of thirds
* focal depth

Lighting:

* cinematic
* soft
* natural

Details:

* ultra detailed
* clean edges
* realistic textures

Quality:

* professional
* premium
* polished

Prevent:

* low quality
* blurry
* extra limbs
* distorted text
* oversaturated
* noisy output
* bad anatomy
* clutter

Build presets:

Photo

Illustration

Product

Poster

Thumbnail

Branding

---

# FEATURE 2 — CloudCanvas Editor

After generation:

Open image inside editor.

---

Canvas:

Zoom

Pan

Snap

Guides

---

Tools:

Select

Lasso

Crop

Move

Magic Select

---

Editing:

Crop

Resize

Rotate

Blur

Sharpen

Brightness

Contrast

Saturation

Background Removal

All editing must generate Cloudinary transformations.

No destructive edits.

---

# FEATURE 3 — AI Editing

Prompt box:

```text
make cinematic

remove background

make thumbnail

compress for web
```

Pipeline:

Prompt

↓

cloudinary-transformations

↓

Transformation URL

↓

Preview

---

# FEATURE 4 — Layers

Support:

Add

Delete

Lock

Opacity

Groups

Text

Image overlays

---

# FEATURE 5 — Transformation Graph

Visualize:

```text
Original

├ Instagram

├ YouTube

├ Portfolio

└ Website
```

Every branch stores transformation chain.

---

# FEATURE 6 — Replay

Record:

```text
Generate

↓

Edit

↓

Transform

↓

Export
```

Replay edits.

---

# FEATURE 7 — Compare

Show:

Original

vs

Edited

Metrics:

* size
* quality
* optimization

---

# FEATURE 8 — Export

Generate:

Instagram

LinkedIn

YouTube

Mobile

Desktop

Formats:

PNG

JPG

WEBP

Auto optimization.

Display:

```text
Original:
8MB

Final:
700KB

Saved:
91%
```

---

# Storage

Store:

```json
{
"projects":[],
"history":[],
"layers":[],
"exports":[]
}
```

---

# UX

Shortcuts:

```text
V Move

L Lasso

C Crop

B Brush

Ctrl+Z
```

Add:

Command Palette

Dark Mode

Smooth transitions

Resizable panels

---

# Demo Flow

Generate image

↓

Open in CloudCanvas

↓

Select

↓

Apply AI edits

↓

Create variants

↓

Replay

↓

Export

Ship working features before expanding.

# FEATURE 9 — Content Aware + Magic Edit Engine (Hero Editing Feature)

Build professional-grade object removal and reconstruction.

Goal:

When users remove objects, the system should intelligently rebuild surrounding regions instead of leaving obvious artifacts, blur patches, stretched pixels, or empty areas.

Users should feel like editing is happening semantically rather than deleting pixels.

---

Supported Actions:

### Magic Remove

Select object.

Remove.

System reconstructs scene.

Examples:

```text
remove person
remove wire
remove watermark
remove background object
remove pole
```

Expected behavior:

* preserve textures
* preserve shadows
* preserve perspective
* maintain lighting consistency

---

### Content Aware Fill

User selects region.

System generates replacement based on surrounding context.

Examples:

```text
extend sky
continue grass
remove table
fill missing wall
```

Pipeline:

Selection

↓

Analyze surrounding pixels

↓

Generate reconstruction

↓

Blend

↓

Preview

Never leave hard edges.

---

### Smart Healing Brush

User brushes over region.

System:

* detect neighboring textures
* reconstruct naturally
* preserve details

Examples:

```text
remove acne
clean dust
remove scratches
erase cables
```

---

### Generative Replace

User selects object.

Prompt:

```text
replace chair with sofa
replace road with grass
replace day with sunset
replace old car with modern car
```

Pipeline:

Mask

↓

Context Extraction

↓

Prompt Refinement

↓

Generation

↓

Merge

↓

CloudCanvas Layer

---

### Smart Expand (Outpainting)

Extend image boundaries.

Examples:

```text
expand left
make landscape
extend background
add empty space
```

Requirements:

* preserve perspective
* continue textures
* maintain composition
* avoid repeated patterns

---

### Context Preservation Rules

Removal engine should prioritize:

1. Geometry consistency
2. Texture continuity
3. Shadow consistency
4. Color matching
5. Perspective preservation
6. Edge blending
7. Subject isolation

Avoid:

* blurry reconstruction
* duplicated objects
* warped faces
* stretched textures
* inconsistent lighting
* noisy regions
* visible seams

---

### Reconstruction Quality Pass

Before showing result:

Run validation.

Check:

```text
Artifact Score

Texture Score

Edge Score

Composition Score
```

If below threshold:

Retry reconstruction.

Keep best result.

---

### Editing Workflow

```text
Upload

↓

Select

↓

Magic Remove

↓

Content Reconstruction

↓

Blend

↓

Preview

↓

Commit
```

---

### UX

Toolbar:

```text
Magic Remove

Content Fill

Healing Brush

Expand

Replace
```

Shortcuts:

```text
M Magic

H Heal

G Generate

Shift+Delete Remove
```

---

### Compare View

Display:

```text
Original

↓

Selection

↓

Reconstruction

↓

Final
```

Show confidence score.

---

This feature must feel like professional editing software while remaining non-destructive.

Every operation should remain reversible and represented in transformation history.
