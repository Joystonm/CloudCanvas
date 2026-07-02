import { useState } from 'react'
import { Wand2, Eraser, Expand, Loader2, Check, Trash2 } from 'lucide-react'
import { useStore } from '../../store'
import toast from 'react-hot-toast'

/**
 * Build a clean Cloudinary URL for a generative-AI transformation.
 *
 * Cloudinary gen-AI endpoints (e_gen_fill, e_gen_remove, e_background_removal…)
 * require the URL to use the bare public ID — no version prefix (v123456789),
 * no file extension, and no prior transformation chain.  Sending any of those
 * causes a 400 Bad Request.
 *
 * This function:
 *  1. Strips the query string (?t=…, ?p=…)
 *  2. Locates /upload/ in the URL
 *  3. Drops everything after /upload/ that looks like a Cloudinary
 *     transformation segment (pattern: starts with one or more lowercase
 *     letters followed by an underscore, e.g. e_, f_, q_, ar_, g_, w_, c_…)
 *     or a version segment (v followed only by digits).
 *  4. Strips the file extension from the public ID (e.g. .png, .jpg, .webp).
 *  5. Prepends the requested transformation.
 */
function injectTransformation(src: string, transformation: string): string {
  const clean = src.split('?')[0]
  const uploadMarker = '/upload/'
  const idx = clean.indexOf(uploadMarker)
  if (idx === -1) return clean

  const base = clean.slice(0, idx + uploadMarker.length)
  const afterUpload = clean.slice(idx + uploadMarker.length)
  const parts = afterUpload.split('/')

  // Drop transformation segments (e_…, f_…, ar_…, g_…, etc.)
  // and version segments (v1234567890).
  const isTransformOrVersion = (seg: string) =>
    /^[a-z]+_/.test(seg) || /^v\d+$/.test(seg)

  const publicIdParts: string[] = []
  for (const part of parts) {
    if (!isTransformOrVersion(part)) {
      publicIdParts.push(part)
    }
  }

  // Strip file extension from the last segment (e.g. "photo.png" → "photo")
  if (publicIdParts.length > 0) {
    publicIdParts[publicIdParts.length - 1] = publicIdParts[publicIdParts.length - 1].replace(/\.[^/.]+$/, '')
  }

  const publicId = publicIdParts.join('/')
  return `${base}${transformation}/${publicId}`
}

/** Cloudinary gen-AI returns 423/420 while processing. Poll until the image loads. */
function pollUntilReady(url: string, maxAttempts = 12, intervalMs = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0
    function attempt() {
      const img = new window.Image()
      img.onload = () => resolve()
      img.onerror = () => {
        attempts++
        if (attempts >= maxAttempts) {
          reject(new Error('Cloudinary is taking too long — try again in a moment'))
          return
        }
        setTimeout(attempt, intervalMs)
      }
      // Cache-bust each poll so the browser re-fetches from Cloudinary
      img.src = url + `?p=${attempts}`
    }
    attempt()
  })
}

const MAGIC_REMOVE_ACTIONS = [
  { label: 'Remove Background', transformation: 'e_background_removal,f_png' },
  { label: 'Remove Watermark',  transformation: 'e_gen_remove:prompt_watermark,f_png,q_auto' },
]

const EXPAND_ACTIONS = [
  { label: 'Expand 16:9',   transformation: 'c_pad,ar_16:9,b_gen_fill,f_auto,q_auto' },
  { label: 'Expand 9:16',   transformation: 'c_pad,ar_9:16,b_gen_fill,f_auto,q_auto' },
  { label: 'Expand Square', transformation: 'c_pad,ar_1:1,b_gen_fill,f_auto,q_auto' },
  { label: 'Expand 4:5',    transformation: 'c_pad,ar_4:5,b_gen_fill,f_auto,q_auto' },
  { label: 'Expand 4:3',    transformation: 'c_pad,ar_4:3,b_gen_fill,f_auto,q_auto' },
  { label: 'Expand 21:9',   transformation: 'c_pad,ar_21:9,b_gen_fill,f_auto,q_auto' },
]

export function MagicEditOverlay() {
  const { activeTool, selectedLayerId, project, updateLayer, pushHistory, brushStrokes, clearBrushStrokes } = useStore()
  const [loading, setLoading] = useState<string | null>(null)
  const [done, setDone] = useState<string | null>(null)

  if (!['magic-remove', 'heal', 'expand'].includes(activeTool)) return null

  const layer = project.layers.find((l) => l.id === selectedLayerId)

  async function apply(transformation: string, label: string) {
    if (!layer?.src || !layer.cloudinaryPublicId) {
      toast.error('Select a Cloudinary-uploaded layer')
      return
    }
    setLoading(label)
    try {
      const newUrl = injectTransformation(layer.src, transformation)
      await pollUntilReady(newUrl)
      pushHistory(`${label}: ${layer.name}`)
      updateLayer(layer.id, { src: newUrl + `?t=${Date.now()}`, transformations: [...(layer.transformations || []), transformation] })
      setDone(label)
      setTimeout(() => setDone(null), 2000)
      toast.success(`Applied: ${label}`)
    } catch (err: any) {
      toast.error(err.message || `Failed: ${label}`)
    } finally {
      setLoading(null)
    }
  }

  async function removePainted() {
    if (!layer?.src || !layer.cloudinaryPublicId) {
      toast.error('Select a Cloudinary-uploaded layer')
      return
    }
    if (brushStrokes.length === 0) {
      toast.error('Paint over the object you want to remove first')
      return
    }

    const allX: number[] = [], allY: number[] = []
    for (const stroke of brushStrokes) {
      for (let i = 0; i < stroke.length; i += 2) {
        allX.push(stroke[i])
        allY.push(stroke[i + 1])
      }
    }

    // Brush strokes are in canvas coordinates (same space as layer.x/y/width/height).
    // Scale to original image pixel space for Cloudinary.
    const natW = layer.naturalWidth || layer.width
    const natH = layer.naturalHeight || layer.height
    const scaleX = natW / layer.width
    const scaleY = natH / layer.height

    const rawX = Math.min(...allX) - layer.x
    const rawY = Math.min(...allY) - layer.y
    const rawW = Math.max(...allX) - Math.min(...allX)
    const rawH = Math.max(...allY) - Math.min(...allY)

    const lx = Math.max(0, Math.round(rawX * scaleX))
    const ly = Math.max(0, Math.round(rawY * scaleY))
    const lw = Math.max(10, Math.round(rawW * scaleX))
    const lh = Math.max(10, Math.round(rawH * scaleY))

    if (lw < 5 || lh < 5) {
      toast.error('Painted area too small — paint more of the object')
      return
    }

    const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
    const transformation = `e_gen_remove:region_(x_${lx};y_${ly};w_${lw};h_${lh})`

    // Build from current layer.src so prior transformations are preserved.
    // injectTransformation strips version, extension, and prior transforms.
    const baseSrc = layer.src.split('?')[0]
    const hasUpload = baseSrc.includes('/upload/')
    // Strip extension from cloudinaryPublicId in case it was stored with one.
    const barePublicId = layer.cloudinaryPublicId.replace(/\.[^/.]+$/, '')
    const newUrl = hasUpload
      ? injectTransformation(baseSrc, transformation)
      : `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformation}/${barePublicId}`

    setLoading('painted')
    try {
      // Cloudinary generative AI returns 423 (processing) / 420 (pending) until ready.
      // Poll with retries instead of a single load attempt.
      await pollUntilReady(newUrl)
      pushHistory(`Erase Object: ${layer.name}`)
      updateLayer(layer.id, {
        src: newUrl + `?t=${Date.now()}`,
        naturalWidth: natW, naturalHeight: natH,
        transformations: [...(layer.transformations || []), transformation],
      })
      clearBrushStrokes()
      toast.success('Object removed!')
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(null)
    }
  }

  const noLayer = !layer?.cloudinaryPublicId

  return (
    <div className="absolute bottom-16 left-1/2 -translate-x-1/2 z-10 pointer-events-auto">
      <div className="bg-cc-surface border border-cc-border rounded-xl shadow-heavy p-3 flex items-center gap-3 whitespace-nowrap">

        {activeTool === 'heal' && (
          <>
            <div className="flex items-center gap-1.5 pr-3 border-r border-cc-border">
              <Eraser size={14} className="text-cc-accent" />
              <span className="text-cc-text text-xs font-bold uppercase tracking-wider">Erase Object</span>
            </div>
            {noLayer ? (
              <p className="text-cc-muted text-xs">Select a Cloudinary layer first</p>
            ) : (
              <div className="flex items-center gap-2">
                <span className="text-cc-muted text-xs">
                  {brushStrokes.length === 0 ? 'Paint over object to remove' : `${brushStrokes.length} stroke${brushStrokes.length > 1 ? 's' : ''} painted`}
                </span>
                {brushStrokes.length > 0 && (
                  <>
                    <button
                      onClick={removePainted}
                      disabled={!!loading}
                      className="flex items-center gap-1.5 px-3 py-1.5 bg-cc-accent hover:bg-white rounded-pill text-xs text-black font-bold transition-all disabled:opacity-50"
                    >
                      {loading === 'painted' ? <Loader2 size={11} className="animate-spin" /> : done === 'painted' ? <Check size={11} /> : <Wand2 size={11} />}
                      Remove Object
                    </button>
                    <button
                      onClick={clearBrushStrokes}
                      disabled={!!loading}
                      className="flex items-center gap-1.5 px-2.5 py-1.5 bg-cc-elevated hover:bg-cc-card rounded-pill text-xs text-cc-muted hover:text-cc-error transition-all"
                      title="Clear brush strokes"
                    >
                      <Trash2 size={11} />
                    </button>
                  </>
                )}
              </div>
            )}
          </>
        )}

        {activeTool === 'magic-remove' && (
          <>
            <div className="flex items-center gap-1.5 pr-3 border-r border-cc-border">
              <Wand2 size={14} className="text-cc-accent" />
              <span className="text-cc-text text-xs font-bold uppercase tracking-wider">Magic Remove</span>
            </div>
            {noLayer ? (
              <p className="text-cc-muted text-xs">Select a Cloudinary layer first</p>
            ) : (
              <div className="flex gap-2">
                {MAGIC_REMOVE_ACTIONS.map(({ label, transformation }) => (
                  <button key={label} onClick={() => apply(transformation, label)} disabled={!!loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cc-elevated hover:bg-cc-card rounded-pill text-xs text-cc-muted hover:text-cc-text transition-all disabled:opacity-50">
                    {loading === label ? <Loader2 size={11} className="animate-spin text-cc-accent" /> : done === label ? <Check size={11} className="text-cc-accent" /> : null}
                    {label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {activeTool === 'expand' && (
          <>
            <div className="flex items-center gap-1.5 pr-3 border-r border-cc-border">
              <Expand size={14} className="text-cc-accent" />
              <span className="text-cc-text text-xs font-bold uppercase tracking-wider">Smart Expand</span>
            </div>
            {noLayer ? (
              <p className="text-cc-muted text-xs">Select a Cloudinary layer first</p>
            ) : (
              <div className="flex gap-2">
                {EXPAND_ACTIONS.map(({ label, transformation }) => (
                  <button key={label} onClick={() => apply(transformation, label)} disabled={!!loading}
                    className="flex items-center gap-1.5 px-3 py-1.5 bg-cc-elevated hover:bg-cc-card rounded-pill text-xs text-cc-muted hover:text-cc-text transition-all disabled:opacity-50">
                    {loading === label ? <Loader2 size={11} className="animate-spin text-cc-accent" /> : done === label ? <Check size={11} className="text-cc-accent" /> : null}
                    {label}
                  </button>
                ))}
              </div>
            )}
          </>
        )}

      </div>
    </div>
  )
}
