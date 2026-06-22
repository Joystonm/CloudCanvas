import { Eye, EyeOff, Lock, Unlock, Trash2, GripVertical, Type, Image as ImageIcon } from 'lucide-react'
import { useStore } from '../../store'
import type { Layer } from '../../types'

function LayerRow({ layer }: { layer: Layer }) {
  const { selectedLayerId, setSelectedLayer, updateLayer, removeLayer } = useStore()
  const isSelected = selectedLayerId === layer.id

  return (
    <div
      onClick={() => setSelectedLayer(layer.id)}
      className={`flex items-center gap-2 px-3 py-2 cursor-pointer transition-all group ${
        isSelected ? 'bg-cc-elevated border-l-2 border-cc-accent' : 'hover:bg-cc-elevated border-l-2 border-transparent'
      }`}
    >
      <GripVertical size={12} className="text-cc-border flex-shrink-0 cursor-grab" />

      {/* Icon */}
      <div className="w-4 flex-shrink-0">
        {layer.type === 'text' ? (
          <Type size={12} className="text-cc-muted" />
        ) : (
          <ImageIcon size={12} className="text-cc-muted" />
        )}
      </div>

      {/* Thumbnail */}
      {layer.src && (
        <div className="w-8 h-8 rounded bg-cc-card overflow-hidden flex-shrink-0">
          <img src={layer.src} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      {/* Name */}
      <span className="flex-1 text-xs text-cc-text truncate font-medium">{layer.name}</span>

      {/* Actions */}
      <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition-opacity">
        <button
          onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { visible: !layer.visible }) }}
          className="w-5 h-5 flex items-center justify-center text-cc-muted hover:text-cc-text"
        >
          {layer.visible ? <Eye size={11} /> : <EyeOff size={11} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); updateLayer(layer.id, { locked: !layer.locked }) }}
          className="w-5 h-5 flex items-center justify-center text-cc-muted hover:text-cc-text"
        >
          {layer.locked ? <Lock size={11} /> : <Unlock size={11} />}
        </button>
        <button
          onClick={(e) => { e.stopPropagation(); removeLayer(layer.id) }}
          className="w-5 h-5 flex items-center justify-center text-cc-muted hover:text-cc-error"
        >
          <Trash2 size={11} />
        </button>
      </div>

      {/* Opacity */}
      {!layer.visible && <span className="text-xs text-cc-muted flex-shrink-0">Hidden</span>}
    </div>
  )
}

export function LayersPanel() {
  const { project, selectedLayerId, updateLayer, addLayer } = useStore()
  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId)

  return (
    <div className="flex flex-col h-full">
      {/* Layers list */}
      <div className="flex-1 overflow-y-auto scrollbar-dark">
        {project.layers.length === 0 ? (
          <p className="text-cc-muted text-xs text-center py-6 px-3">
            No layers yet. Generate or upload an image.
          </p>
        ) : (
          project.layers.map((layer) => <LayerRow key={layer.id} layer={layer} />)
        )}
      </div>

      {/* Add layer buttons */}
      <div className="p-3 border-t border-cc-border flex gap-2 flex-shrink-0">
        <button
          onClick={() =>
            addLayer({
              name: 'Text Layer',
              type: 'text',
              visible: true,
              locked: false,
              opacity: 1,
              x: 100,
              y: 100,
              width: 200,
              height: 50,
              text: 'Double-click to edit',
              fontSize: 24,
              fill: '#ffffff',
            })
          }
          className="flex-1 flex items-center justify-center gap-1 btn-outline text-xs py-1.5"
        >
          <Type size={11} /> Text
        </button>
      </div>

      {/* Selected layer properties — opacity only */}
      {selectedLayer && (
        <div className="p-3 border-t border-cc-border flex-shrink-0">
          <div className="flex items-center justify-between mb-1">
            <label className="text-cc-muted text-xs uppercase tracking-wider">Opacity</label>
            <span className="text-cc-muted text-xs">{Math.round(selectedLayer.opacity * 100)}%</span>
          </div>
          <input
            type="range" min={0} max={1} step={0.01}
            value={selectedLayer.opacity}
            onChange={(e) => updateLayer(selectedLayer.id, { opacity: parseFloat(e.target.value) })}
            className="w-full accent-cc-accent"
          />
        </div>
      )}
    </div>
  )
}
