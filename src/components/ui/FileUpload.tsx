import { useCallback } from 'react'
import { Upload } from 'lucide-react'
import { useStore } from '../../store'
import { uploadToCloudinary } from '../../lib/api'
import toast from 'react-hot-toast'

// Returns {w, h} fitted inside maxW×maxH preserving aspect ratio
function fitDimensions(natW: number, natH: number, maxW: number, maxH: number) {
  const scale = Math.min(1, maxW / natW, maxH / natH)
  return { w: Math.round(natW * scale), h: Math.round(natH * scale) }
}

function loadImageSize(src: string): Promise<{ w: number; h: number }> {
  return new Promise((resolve) => {
    const img = new window.Image()
    img.onload = () => resolve({ w: img.naturalWidth, h: img.naturalHeight })
    img.onerror = () => resolve({ w: 512, h: 512 })
    img.src = src
  })
}

export function FileUpload() {
  const { project, addLayer, setActiveView } = useStore()

  const handleFiles = useCallback(
    async (files: FileList | null) => {
      if (!files?.length) return
      const file = files[0]
      if (!file.type.startsWith('image/')) {
        toast.error('Please upload an image file')
        return
      }

      const objectUrl = URL.createObjectURL(file)

      try {
        const { secure_url, public_id } = await uploadToCloudinary(file)
        const nat = await loadImageSize(secure_url)
        const { w, h } = fitDimensions(nat.w, nat.h, project.canvasWidth, project.canvasHeight)
        addLayer({
          name: file.name,
          type: 'image',
          visible: true, locked: false, opacity: 1,
          x: Math.round((project.canvasWidth - w) / 2),
          y: Math.round((project.canvasHeight - h) / 2),
          width: w, height: h,
          src: secure_url,
          cloudinaryPublicId: public_id,
          transformations: [],
        })
        toast.success('Image uploaded to Cloudinary')
      } catch {
        const nat = await loadImageSize(objectUrl)
        const { w, h } = fitDimensions(nat.w, nat.h, project.canvasWidth, project.canvasHeight)
        addLayer({
          name: file.name,
          type: 'image',
          visible: true, locked: false, opacity: 1,
          x: Math.round((project.canvasWidth - w) / 2),
          y: Math.round((project.canvasHeight - h) / 2),
          width: w, height: h,
          src: objectUrl,
          transformations: [],
        })
        toast('Image added locally (Cloudinary not configured)', { icon: '⚠️' })
      }

      setActiveView('editor')
    },
    [project.canvasWidth, project.canvasHeight, addLayer, setActiveView]
  )

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault()
      handleFiles(e.dataTransfer.files)
    },
    [handleFiles]
  )

  return (
    <label
      onDrop={handleDrop}
      onDragOver={(e) => e.preventDefault()}
      className="flex flex-col items-center justify-center gap-3 border-2 border-dashed border-cc-border rounded-xl p-6 cursor-pointer hover:border-cc-accent hover:bg-cc-elevated transition-all group"
    >
      <input
        type="file"
        accept="image/*"
        className="hidden"
        onChange={(e) => handleFiles(e.target.files)}
      />
      <div className="w-10 h-10 rounded-full bg-cc-elevated group-hover:bg-cc-card flex items-center justify-center transition-all">
        <Upload size={18} className="text-cc-muted group-hover:text-cc-accent transition-colors" />
      </div>
      <div className="text-center">
        <p className="text-cc-text text-sm font-bold">Upload Image</p>
        <p className="text-cc-muted text-xs mt-1">Drag & drop or click to browse</p>
      </div>
    </label>
  )
}
