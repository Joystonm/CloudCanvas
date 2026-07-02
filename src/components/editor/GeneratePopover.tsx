import { useState } from 'react'
import { Send, Loader2, Sparkles, X } from 'lucide-react'
import { useStore } from '../../store'
import { enhancePrompt } from '../../lib/cloudinary'
import { generateImage } from '../../lib/api'
import toast from 'react-hot-toast'

const SUGGESTIONS = [
  'luxury perfume advertisement',
  'minimal mountain travel poster',
  'neon cyberpunk cityscape',
  'professional product shot on white',
]

export function GeneratePopover({ onClose }: { onClose: () => void }) {
  const { project, replaceAllLayers, selectedPreset, setActiveTool } = useStore()
  const [prompt, setPrompt] = useState('')
  const [loading, setLoading] = useState(false)

  async function generate(p: string) {
    if (!p.trim() || loading) return
    setLoading(true)
    try {
      const enhanced = enhancePrompt(p, selectedPreset)
      const { url: imageUrl, publicId } = await generateImage(enhanced)

      const nat = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new window.Image()
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
        img.onerror = () => resolve({ w: project.canvasWidth, h: project.canvasHeight })
        img.src = imageUrl
      })
      const scale = Math.min(1, project.canvasWidth / nat.w, project.canvasHeight / nat.h)
      const w = Math.round(nat.w * scale)
      const h = Math.round(nat.h * scale)

      replaceAllLayers({
        name: `Generated: ${p.slice(0, 30)}`, type: 'image',
        visible: true, locked: false, opacity: 1,
        x: Math.round((project.canvasWidth - w) / 2),
        y: Math.round((project.canvasHeight - h) / 2),
        width: w, height: h,
        src: imageUrl, cloudinaryPublicId: publicId, transformations: [],
      })

      toast.success('Image generated!')
      setActiveTool('select')
      onClose()
    } catch (err: any) {
      toast.error(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="absolute left-16 top-1/2 -translate-y-1/2 z-30 w-80">
      <div className="bg-cc-surface border border-cc-border rounded-xl shadow-heavy p-4">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <Sparkles size={14} className="text-cc-accent" />
            <span className="text-cc-text text-sm font-bold">AI Generate</span>
          </div>
          <button onClick={onClose} className="text-cc-muted hover:text-cc-text transition-colors">
            <X size={14} />
          </button>
        </div>

        <div className="flex gap-2 mb-3">
          <input
            autoFocus
            className="input-pill text-xs flex-1"
            placeholder="Describe the image…"
            value={prompt}
            onChange={(e) => setPrompt(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter') generate(prompt); if (e.key === 'Escape') onClose() }}
            disabled={loading}
          />
          <button
            onClick={() => generate(prompt)}
            disabled={loading || !prompt.trim()}
            className="w-8 h-8 rounded-full bg-cc-accent hover:bg-white flex items-center justify-center text-black flex-shrink-0 disabled:opacity-40 transition-all"
          >
            {loading ? <Loader2 size={12} className="animate-spin" /> : <Send size={12} />}
          </button>
        </div>

        <div className="space-y-1">
          {SUGGESTIONS.map((s) => (
            <button
              key={s}
              onClick={() => generate(s)}
              disabled={loading}
              className="w-full text-left px-3 py-2 rounded-lg text-xs text-cc-muted hover:text-cc-text hover:bg-cc-elevated transition-all disabled:opacity-40"
            >
              {s}
            </button>
          ))}
        </div>
      </div>
    </div>
  )
}
