import { useState, useRef } from 'react'
import { Sparkles, Upload, PlusCircle } from 'lucide-react'
import { useStore } from '../../store'
import { uploadToCloudinary } from '../../lib/api'
import toast from 'react-hot-toast'

export function TopBar() {
  const { project, activeView, setActiveView, addLayer } = useStore()
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Please upload an image file'); return }
    setUploading(true)
    const objectUrl = URL.createObjectURL(file)
    try {
      const { secure_url, public_id } = await uploadToCloudinary(file)
      const nat = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new window.Image()
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
        img.onerror = () => resolve({ w: project.canvasWidth, h: project.canvasHeight })
        img.src = secure_url
      })
      const scale = Math.min(1, project.canvasWidth / nat.w, project.canvasHeight / nat.h)
      const w = Math.round(nat.w * scale), h = Math.round(nat.h * scale)
      addLayer({
        name: file.name, type: 'image', visible: true, locked: false, opacity: 1,
        x: Math.round((project.canvasWidth - w) / 2), y: Math.round((project.canvasHeight - h) / 2),
        width: w, height: h, src: secure_url, cloudinaryPublicId: public_id,
        naturalWidth: nat.w, naturalHeight: nat.h,
        transformations: [],
      })
      toast.success('Image uploaded')
    } catch {
      const nat = await new Promise<{ w: number; h: number }>((resolve) => {
        const img = new window.Image()
        img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
        img.onerror = () => resolve({ w: project.canvasWidth, h: project.canvasHeight })
        img.src = objectUrl
      })
      const scale = Math.min(1, project.canvasWidth / nat.w, project.canvasHeight / nat.h)
      const w = Math.round(nat.w * scale), h = Math.round(nat.h * scale)
      addLayer({
        name: file.name, type: 'image', visible: true, locked: false, opacity: 1,
        x: Math.round((project.canvasWidth - w) / 2), y: Math.round((project.canvasHeight - h) / 2),
        width: w, height: h, src: objectUrl,
        naturalWidth: nat.w, naturalHeight: nat.h,
        transformations: [],
      })
      toast('Added locally', { icon: '⚠️' })
    }
    setUploading(false)
  }

  return (
    <div className="h-14 bg-cc-surface border-b border-cc-border flex items-center px-4 gap-4 z-10 flex-shrink-0">
      {/* Logo */}
      <div className="flex items-center gap-2 mr-2 cursor-pointer" onClick={() => setActiveView('start')}>
        <div className="w-7 h-7 bg-cc-accent rounded-full flex items-center justify-center">
          <Sparkles size={14} className="text-black" />
        </div>
        <span className="font-bold text-cc-text text-sm tracking-wide uppercase hidden sm:block">CloudCanvas</span>
      </div>

      {/* New project */}
      {activeView === 'editor' && (
        <button
          onClick={() => setActiveView('start')}
          className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-cc-elevated hover:bg-cc-card text-cc-muted hover:text-cc-text text-xs font-bold uppercase tracking-wide transition-all"
        >
          <PlusCircle size={13} /> New
        </button>
      )}

      {/* Upload */}
      {activeView === 'editor' && (
        <>
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f); e.target.value = '' }} />
          <button
            onClick={() => fileRef.current?.click()}
            disabled={uploading}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-pill bg-cc-elevated hover:bg-cc-card text-cc-muted hover:text-cc-text text-xs font-bold uppercase tracking-wide transition-all disabled:opacity-50"
          >
            <Upload size={13} /> {uploading ? 'Uploading…' : 'Upload'}
          </button>
        </>
      )}

      {/* Project name */}
      <div className="flex-1" />

      {/* Last saved */}
      <span className="text-cc-muted text-xs hidden md:block">
        {new Date(project.updatedAt).toLocaleTimeString()}
      </span>
    </div>
  )
}
