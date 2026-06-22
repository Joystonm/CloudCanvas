import { SplitSquareHorizontal, X } from 'lucide-react'
import { useStore } from '../../store'

export function CompareView() {
  const { showCompare, compareUrl, setShowCompare, project } = useStore()
  const mainLayer = project.layers[0]

  if (!showCompare) return null

  return (
    <div className="absolute inset-0 bg-cc-bg z-20 flex flex-col">
      <div className="flex items-center justify-between px-4 py-3 border-b border-cc-border flex-shrink-0">
        <div className="flex items-center gap-2">
          <SplitSquareHorizontal size={16} className="text-cc-accent" />
          <span className="text-cc-text font-bold text-sm">Before / After Compare</span>
        </div>
        <button
          onClick={() => setShowCompare(false)}
          className="w-7 h-7 rounded-full bg-cc-elevated hover:bg-cc-card flex items-center justify-center text-cc-muted hover:text-cc-text"
        >
          <X size={14} />
        </button>
      </div>

      <div className="flex-1 flex overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center border-r border-cc-border p-4">
          <p className="text-cc-muted text-xs uppercase tracking-wider mb-3">Original</p>
          {mainLayer?.src ? (
            <img
              src={compareUrl || mainLayer.src}
              alt="Original"
              className="max-w-full max-h-full object-contain rounded-lg shadow-heavy"
            />
          ) : (
            <p className="text-cc-muted text-sm">No image</p>
          )}
        </div>
        <div className="flex-1 flex flex-col items-center justify-center p-4">
          <p className="text-cc-muted text-xs uppercase tracking-wider mb-3">Edited</p>
          {mainLayer?.src ? (
            <img
              src={mainLayer.src}
              alt="Edited"
              className="max-w-full max-h-full object-contain rounded-lg shadow-heavy"
            />
          ) : (
            <p className="text-cc-muted text-sm">No image</p>
          )}
        </div>
      </div>
    </div>
  )
}
