// All API calls happen directly from the browser — no backend server needed.

const MINIMAX_KEY  = import.meta.env.VITE_MINIMAX_API_KEY
const CLOUD_NAME   = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
const UPLOAD_PRESET = import.meta.env.VITE_CLOUDINARY_UPLOAD_PRESET || 'ml_default'

// ── MiniMax image generation ─────────────────────────────────────────────────

export async function generateImage(prompt: string, aspectRatio = '1:1'): Promise<string> {
  if (!MINIMAX_KEY) throw new Error('VITE_MINIMAX_API_KEY is not set')

  const res = await fetch('https://api.minimax.io/v1/image_generation', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${MINIMAX_KEY}`,
    },
    body: JSON.stringify({ model: 'image-01', prompt, n: 1, aspect_ratio: aspectRatio }),
  })

  const data = await res.json()
  const url =
    data?.data?.image_urls?.[0] ||
    data?.data?.[0]?.url ||
    data?.images?.[0]?.url ||
    data?.output?.image_url ||
    null

  if (!url) throw new Error(data?.error || data?.message || 'No image URL in response')
  return url
}

// ── Cloudinary unsigned upload ───────────────────────────────────────────────
// Requires an unsigned upload preset in your Cloudinary settings.
// Dashboard → Settings → Upload → Upload presets → Add unsigned preset
// Set VITE_CLOUDINARY_UPLOAD_PRESET to its name (default: ml_default)

export async function uploadToCloudinary(
  source: string | File  // URL string or File object
): Promise<{ secure_url: string; public_id: string }> {
  if (!CLOUD_NAME) throw new Error('VITE_CLOUDINARY_CLOUD_NAME is not set')

  const form = new FormData()
  form.append('upload_preset', UPLOAD_PRESET)
  form.append('folder', 'cloudcanvas')

  if (typeof source === 'string') {
    form.append('file', source)
  } else {
    form.append('file', source)
  }

  const res = await fetch(
    `https://api.cloudinary.com/v1_1/${CLOUD_NAME}/image/upload`,
    { method: 'POST', body: form }
  )

  const data = await res.json()
  if (!data.secure_url) throw new Error(data.error?.message || 'Cloudinary upload failed')
  return { secure_url: data.secure_url, public_id: data.public_id }
}
