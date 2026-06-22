import { useState, useRef } from 'react'
import { Sparkles, Upload, Monitor, Instagram, Youtube, Smartphone, Image, FileImage } from 'lucide-react'
import { useStore } from '../../store'
import { uploadToCloudinary } from '../../lib/api'
import toast from 'react-hot-toast'

const TEMPLATES = [
  { label: 'HD',         w: 1920, h: 1080, icon: <Monitor size={18} /> },
  { label: 'Instagram',  w: 1080, h: 1080, icon: <Instagram size={18} /> },
  { label: 'Story',      w: 1080, h: 1920, icon: <Smartphone size={18} /> },
  { label: 'YouTube',    w: 1280, h: 720,  icon: <Youtube size={18} /> },
  { label: 'A4 Print',   w: 2480, h: 3508, icon: <FileImage size={18} /> },
  { label: 'Square',     w: 1000, h: 1000, icon: <Image size={18} /> },
]

export function NewProjectScreen() {
  const { setCanvasSize, setActiveView, addLayer, replaceAllLayers, project } = useStore()
  const [customW, setCustomW] = useState('1024')
  const [customH, setCustomH] = useState('768')
  const [uploading, setUploading] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  function openWithSize(w: number, h: number) {
    setCanvasSize(w, h)
    setActiveView('editor')
  }

  async function handleFile(file: File) {
    if (!file.type.startsWith('image/')) { toast.error('Please select an image'); return }
    setUploading(true)
    const objectUrl = URL.createObjectURL(file)

    // Detect image natural size to set canvas
    const nat = await new Promise<{ w: number; h: number }>((resolve) => {
      const img = new window.Image()
      img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
      img.onerror = () => resolve({ w: 1024, h: 768 })
      img.src = objectUrl
    })

    setCanvasSize(nat.w, nat.h)

    try {
      const { secure_url, public_id } = await uploadToCloudinary(file)
      replaceAllLayers({
        name: file.name, type: 'image',
        visible: true, locked: false, opacity: 1,
        x: 0, y: 0, width: nat.w, height: nat.h,
        src: secure_url, cloudinaryPublicId: public_id,
        naturalWidth: nat.w, naturalHeight: nat.h,
        transformations: [],
      })
      toast.success('Image uploaded')
    } catch {
      replaceAllLayers({
        name: file.name, type: 'image',
        visible: true, locked: false, opacity: 1,
        x: 0, y: 0, width: nat.w, height: nat.h,
        src: objectUrl,
        naturalWidth: nat.w, naturalHeight: nat.h,
        transformations: [],
      })
      toast('Added locally — Cloudinary not configured', { icon: '⚠️' })
    }

    setUploading(false)
    setActiveView('editor')
  }

  return (
    <div className="h-full bg-cc-bg flex items-center justify-center p-8">
      <div className="w-full max-w-2xl">
        {/* Logo */}
        <div className="flex items-center gap-3 mb-8">
          <div className="w-10 h-10 bg-cc-accent rounded-full flex items-center justify-center">
            <Sparkles size={18} className="text-black" />
          </div>
          <div>
            <h1 className="text-cc-text font-bold text-xl">CloudCanvas</h1>
            <p className="text-cc-muted text-xs">Create. Edit. Transform.</p>
          </div>
        </div>

        {/* Upload */}
        <div
          onClick={() => fileRef.current?.click()}
          onDrop={(e) => { e.preventDefault(); const f = e.dataTransfer.files[0]; if (f) handleFile(f) }}
          onDragOver={(e) => e.preventDefault()}
          className="border-2 border-dashed border-cc-border rounded-xl p-8 text-center cursor-pointer hover:border-cc-accent hover:bg-cc-elevated transition-all mb-6 group"
        >
          <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFile(f) }} />
          <Upload size={28} className="mx-auto text-cc-muted group-hover:text-cc-accent transition-colors mb-3" />
          <p className="text-cc-text font-bold">{uploading ? 'Uploading…' : 'Upload from computer'}</p>
          <p className="text-cc-muted text-xs mt-1">Drag & drop or click — PNG, JPG, WEBP</p>
        </div>

        {/* Templates */}
        <p className="text-cc-muted text-xs uppercase tracking-wider mb-3">Or start with a template</p>
        <div className="grid grid-cols-3 gap-3 mb-6">
          {TEMPLATES.map((t) => (
            <button
              key={t.label}
              onClick={() => openWithSize(t.w, t.h)}
              className="flex flex-col items-center gap-2 p-4 bg-cc-surface hover:bg-cc-elevated rounded-xl border border-cc-border hover:border-cc-accent transition-all group"
            >
              <span className="text-cc-muted group-hover:text-cc-accent transition-colors">{t.icon}</span>
              <span className="text-cc-text text-sm font-bold">{t.label}</span>
              <span className="text-cc-muted text-xs">{t.w} × {t.h}</span>
            </button>
          ))}
        </div>

        {/* Custom size */}
        <div className="flex items-center gap-3 bg-cc-surface rounded-xl p-4 border border-cc-border">
          <span className="text-cc-muted text-xs uppercase tracking-wider flex-shrink-0">Custom</span>
          <input
            type="number" value={customW} onChange={(e) => setCustomW(e.target.value)}
            className="input-pill text-xs w-24 text-center" placeholder="Width"
          />
          <span className="text-cc-muted text-xs">×</span>
          <input
            type="number" value={customH} onChange={(e) => setCustomH(e.target.value)}
            className="input-pill text-xs w-24 text-center" placeholder="Height"
          />
          <span className="text-cc-muted text-xs">px</span>
          <button
            onClick={() => openWithSize(parseInt(customW) || 1024, parseInt(customH) || 768)}
            className="ml-auto btn-primary text-xs py-2 px-5"
          >
            Create
          </button>
        </div>
      </div>
    </div>
  )
}
