import { useEffect, useRef, useState } from 'react'
import { Send, Sparkles, Trash2, Zap, ImageDown, Loader2 } from 'lucide-react'
import { useStore } from '../../store'
import { enhancePrompt } from '../../lib/cloudinary'
import { generateImage } from '../../lib/api'
import type { GenerationPreset } from '../../types'
import toast from 'react-hot-toast'

const PRESETS: { id: GenerationPreset; label: string }[] = [
  { id: 'photo',        label: 'Photo' },
  { id: 'illustration', label: 'Illustration' },
  { id: 'product',      label: 'Product' },
  { id: 'poster',       label: 'Poster' },
  { id: 'thumbnail',    label: 'Thumbnail' },
  { id: 'branding',     label: 'Branding' },
]

const SUGGESTIONS = [
  'luxury perfume advertisement',
  'minimal travel poster with mountains',
  'neon cyberpunk cityscape',
  'professional headshot on dark background',
  'floating island with waterfalls',
]

export function GeneratorPanel() {
  const {
    chatMessages, isGenerating, selectedPreset,
    addMessage, setGenerating, setPreset, clearChat,
    replaceAllLayers, setActiveView, project,
    updateLayer, reorderLayers, pushHistory,
  } = useStore()

  const [input, setInput] = useState('')
  const [settingBg, setSettingBg] = useState<string | null>(null) // message id being applied
  const messagesEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [chatMessages])

  async function generate(prompt: string) {
    if (!prompt.trim() || isGenerating) return
    const enhanced = enhancePrompt(prompt, selectedPreset)

    addMessage({ role: 'user', content: prompt })
    setGenerating(true)
    setInput('')

    try {
      const { url: imageUrl, publicId } = await generateImage(enhanced)
      addMessage({ role: 'assistant', content: 'Image generated! Opening in editor...', imageUrl, imagePublicId: publicId ?? undefined })

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
        name: `Generated: ${prompt.slice(0, 30)}`,
        type: 'image',
        visible: true, locked: false, opacity: 1,
        x: Math.round((project.canvasWidth - w) / 2),
        y: Math.round((project.canvasHeight - h) / 2),
        width: w, height: h,
        src: imageUrl,
        cloudinaryPublicId: publicId ?? undefined,
        transformations: [],
      })
      setActiveView('editor')
    } catch (err: any) {
      addMessage({ role: 'assistant', content: `Error: ${err.message}` })
    } finally {
      setGenerating(false)
    }
  }

  async function setAsBackground(msgId: string, src: string, publicId?: string) {
    setSettingBg(msgId)
    try {
      const { canvasWidth: cw, canvasHeight: ch } = project

      // Find the layer for this image
      const layer = useStore.getState().project.layers.find(
        (l) => l.src?.split('?')[0] === src.split('?')[0]
      )
      if (!layer) {
        toast.error('Image not on canvas — it will be added automatically after generation')
        return
      }

      // Load the image to get true pixel dimensions
      const { natW, natH } = await new Promise<{ natW: number; natH: number }>((resolve) => {
        const img = new window.Image()
        img.onload = () => resolve({ natW: img.naturalWidth, natH: img.naturalHeight })
        img.onerror = () => resolve({ natW: layer.width, natH: layer.height })
        img.src = src.split('?')[0]
      })

      // Cover canvas preserving aspect ratio
      const scale = Math.max(cw / natW, ch / natH)
      const w = Math.round(natW * scale)
      const h = Math.round(natH * scale)
      const x = Math.round((cw - w) / 2)
      const y = Math.round((ch - h) / 2)

      pushHistory('Set as Background')

      updateLayer(layer.id, { name: 'Background', x, y, width: w, height: h, naturalWidth: natW, naturalHeight: natH, locked: false })

      const layers = useStore.getState().project.layers
      const others = layers.filter((l) => l.id !== layer.id)
      reorderLayers([...others.map((l) => l.id), layer.id])

      // Select it so user can immediately drag to reframe
      useStore.getState().setSelectedLayer(layer.id)

      toast.success('Background set — drag to reframe, then lock when done!')
      setActiveView('editor')
    } catch (err: any) {
      toast.error(err.message || 'Failed to set background')
    } finally {
      setSettingBg(null)
    }
  }

  return (
    <div className="flex flex-col h-full bg-cc-bg">
      {/* Header */}
      <div className="p-6 border-b border-cc-border flex-shrink-0">
        <div className="flex items-center gap-3 mb-1">
          <Sparkles size={20} className="text-cc-accent" />
          <h2 className="text-cc-text font-bold text-lg">AI Image Generator</h2>
        </div>
        <p className="text-cc-muted text-sm">Describe your vision. AI brings it to life.</p>

        {/* Preset pills */}
        <div className="flex flex-wrap gap-2 mt-4">
          {PRESETS.map((p) => (
            <button
              key={p.id}
              onClick={() => setPreset(p.id)}
              className={`px-3 py-1 rounded-pill text-xs font-bold uppercase tracking-wider transition-all ${
                selectedPreset === p.id
                  ? 'bg-cc-accent text-black'
                  : 'bg-cc-elevated text-cc-muted hover:text-cc-text'
              }`}
            >
              {p.label}
            </button>
          ))}
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 scrollbar-dark">
        {chatMessages.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-center py-12">
            <div className="w-16 h-16 bg-cc-elevated rounded-full flex items-center justify-center mb-4">
              <Zap size={28} className="text-cc-accent" />
            </div>
            <p className="text-cc-text font-bold mb-2">Create. Edit. Transform.</p>
            <p className="text-cc-muted text-sm mb-6 max-w-xs">
              Type a description below or try one of these ideas:
            </p>
            <div className="flex flex-col gap-2 w-full max-w-sm">
              {SUGGESTIONS.map((s) => (
                <button
                  key={s}
                  onClick={() => generate(s)}
                  className="text-left px-4 py-3 bg-cc-surface rounded-lg text-cc-muted text-sm hover:bg-cc-elevated hover:text-cc-text transition-all border border-cc-border"
                >
                  {s}
                </button>
              ))}
            </div>
          </div>
        )}

        {chatMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-xs lg:max-w-md rounded-2xl px-4 py-3 ${
                msg.role === 'user'
                  ? 'bg-cc-accent text-black font-semibold ml-8'
                  : 'bg-cc-surface text-cc-text mr-8'
              }`}
            >
              <p className="text-sm">{msg.content}</p>
              {msg.imageUrl && (
                <div className="mt-3">
                  <div className="rounded-lg overflow-hidden">
                    <img
                      src={msg.imageUrl}
                      alt="Generated"
                      className="w-full rounded-lg object-cover"
                      onError={(e) => { (e.target as HTMLImageElement).style.display = 'none' }}
                    />
                  </div>
                  {/* Set as Background */}
                  <button
                    onClick={() => setAsBackground(msg.id, msg.imageUrl!, msg.imagePublicId)}
                    disabled={settingBg === msg.id}
                    className="mt-2 w-full flex items-center justify-center gap-1.5 py-1.5 rounded-lg text-xs font-medium bg-cc-elevated hover:bg-cc-card text-cc-muted hover:text-cc-text border border-cc-border transition-all disabled:opacity-50"
                  >
                    {settingBg === msg.id
                      ? <><Loader2 size={11} className="animate-spin" /> Applying…</>
                      : <><ImageDown size={11} /> Set as Background</>
                    }
                  </button>
                </div>
              )}
            </div>
          </div>
        ))}

        {isGenerating && (
          <div className="flex justify-start">
            <div className="bg-cc-surface rounded-2xl px-4 py-3 mr-8">
              <div className="flex items-center gap-2 text-cc-muted text-sm">
                <div className="flex gap-1">
                  {[0, 1, 2].map((i) => (
                    <div
                      key={i}
                      className="w-2 h-2 bg-cc-accent rounded-full animate-bounce"
                      style={{ animationDelay: `${i * 0.15}s` }}
                    />
                  ))}
                </div>
                Generating...
              </div>
            </div>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Input */}
      <div className="p-4 border-t border-cc-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <input
            className="input-pill flex-1 text-sm"
            placeholder="Describe the image you want to create..."
            value={input}
            onChange={(e) => setInput(e.target.value)}
            onKeyDown={(e) => { if (e.key === 'Enter' && !e.shiftKey) generate(input) }}
            disabled={isGenerating}
          />
          <button
            onClick={() => generate(input)}
            disabled={isGenerating || !input.trim()}
            className="w-10 h-10 rounded-full bg-cc-accent hover:bg-white flex items-center justify-center text-black transition-all flex-shrink-0 disabled:opacity-40 disabled:cursor-not-allowed"
          >
            <Send size={16} />
          </button>
          {chatMessages.length > 0 && (
            <button
              onClick={clearChat}
              className="w-10 h-10 rounded-full bg-cc-elevated hover:bg-cc-card flex items-center justify-center text-cc-muted hover:text-cc-error transition-all flex-shrink-0"
              title="Clear chat"
            >
              <Trash2 size={14} />
            </button>
          )}
        </div>
        <p className="text-cc-muted text-xs mt-2 text-center">
          Preset: <span className="text-cc-accent font-bold capitalize">{selectedPreset}</span> · Enhanced prompt auto-applied
        </p>
      </div>
    </div>
  )
}
