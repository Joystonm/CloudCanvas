// All API calls run directly from the browser.
// /api/generate is proxied through Vite's dev server (vite.config.ts) to avoid
// CORS restrictions on the Cloudinary Image Generation endpoint. The proxy also
// injects the Authorization header so credentials never appear in the bundle.

const CLOUD_NAME    = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default'

// ── Cloudinary Image Generation ───────────────────────────────────────────────
// Calls /api/generate which Vite proxies to:
//   POST https://api.cloudinary.com/v1_1/{cloud}/image/generate
// The generated image is automatically stored as a managed Cloudinary asset —
// no separate upload step needed.
// Docs: https://cloudinary.com/documentation/image_generation_addon

export async function generateImage(
  prompt: string,
  aspectRatio = '1:1'
): Promise<{ url: string; publicId: string }> {
  const body: Record<string, unknown> = {
    prompt,
    target: { target_type: 'managed_asset', folder: 'cloudcanvas' },
  }
  if (aspectRatio && aspectRatio !== '1:1') {
    body.aspect_ratio = aspectRatio
  }

  const res = await fetch('/api/generate', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify(body),
  })

  const data = await res.json()
  if (!res.ok) {
    const msg =
      data?.error?.message ||
      (typeof data?.error === 'string' ? data.error : null) ||
      data?.message ||
      `Image generation failed (HTTP ${res.status})`
    throw new Error(msg)
  }

  // Response shape: { data: { assets: [{ storage: { secure_url, public_id }, ... }] } }
  const asset = data?.data?.assets?.[0]
  const url: string = asset?.storage?.secure_url ?? null
  const publicId: string = asset?.storage?.public_id ?? null
  if (!url) throw new Error('No image URL in response — check that the Cloudinary Image Generation add-on is enabled on your account')

  return { url, publicId }
}

// ── Cloudinary unsigned upload ───────────────────────────────────────────────
// Requires an unsigned upload preset in your Cloudinary settings.
// Dashboard → Settings → Upload → Upload presets → Add unsigned preset
// Set VITE_CLOUDINARY_UPLOAD_PRESET to its name (default: ml_default)

export async function uploadToCloudinary(
  source: string | File
): Promise<{ secure_url: string; public_id: string }> {
  if (!CLOUD_NAME) throw new Error('VITE_CLOUDINARY_CLOUD_NAME is not set')

  const form = new FormData()
  form.append('upload_preset', UPLOAD_PRESET)
  form.append('folder', 'cloudcanvas')
  form.append('file', source)

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  )

  const data = await res.json()
  if (!data.secure_url) throw new Error(data.error?.message || 'Cloudinary upload failed')
  return { secure_url: data.secure_url, public_id: data.public_id }
}
