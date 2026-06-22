import {
  MousePointer2, Crop, Move, Lasso,
  ZoomIn, ZoomOut, RotateCcw, Wand2, Eraser, Expand, Type, Sparkles,
} from 'lucide-react'
import { useStore } from '../../store'
import type { Tool } from '../../types'
import { GeneratePopover } from './GeneratePopover'

const TOOLS: { id: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { id: 'select',       icon: <MousePointer2 size={16} />, label: 'Select',       shortcut: 'V' },
  { id: 'move',         icon: <Move size={16} />,          label: 'Move',         shortcut: 'M' },
  { id: 'crop',         icon: <Crop size={16} />,          label: 'Crop',         shortcut: 'C' },
  { id: 'lasso',        icon: <Lasso size={16} />,         label: 'Lasso',        shortcut: 'L' },
  { id: 'text',         icon: <Type size={16} />,          label: 'Text',         shortcut: 'T' },
  { id: 'magic-remove', icon: <Wand2 size={16} />,         label: 'Magic Remove', shortcut: 'W' },
  { id: 'heal',         icon: <Eraser size={16} />,        label: 'Erase Object', shortcut: 'H' },
  { id: 'expand',       icon: <Expand size={16} />,        label: 'Expand',       shortcut: 'E' },
  { id: 'generate',     icon: <Sparkles size={16} />,      label: 'AI Generate',  shortcut: 'G' },
]

const BG_PRESETS = [
  { label: 'White',       value: '#ffffff' },
  { label: 'Black',       value: '#000000' },
  { label: 'Transparent', value: 'transparent' },
]

export function Toolbar() {
  const { activeTool, setActiveTool, zoom, setZoom, undo, project, setCanvasBackground } = useStore()
  const bg = project.canvasBackground

  return (
    <div className="relative">
      <div className="w-14 bg-cc-surface border-r border-cc-border flex flex-col items-center py-3 gap-1 flex-shrink-0 h-full overflow-y-auto scrollbar-dark">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            onClick={() => setActiveTool(activeTool === tool.id && tool.id === 'generate' ? 'select' : tool.id)}
            title={`${tool.label} (${tool.shortcut})`}
            className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all ${
              activeTool === tool.id
                ? 'bg-cc-accent text-black'
                : 'text-cc-muted hover:text-cc-text hover:bg-cc-elevated'
            }`}
          >
            {tool.icon}
          </button>
        ))}

        <div className="w-full border-t border-cc-border my-2" />

        <button onClick={() => setZoom(zoom * 1.2)} className="w-9 h-9 rounded-lg flex items-center justify-center text-cc-muted hover:text-cc-text hover:bg-cc-elevated transition-all" title="Zoom In"><ZoomIn size={16} /></button>
        <button onClick={() => setZoom(zoom / 1.2)} className="w-9 h-9 rounded-lg flex items-center justify-center text-cc-muted hover:text-cc-text hover:bg-cc-elevated transition-all" title="Zoom Out"><ZoomOut size={16} /></button>
        <button onClick={() => setZoom(1)} className="w-9 h-7 rounded-lg text-cc-muted hover:text-cc-text hover:bg-cc-elevated text-xs transition-all" title="Reset Zoom">{Math.round(zoom * 100)}%</button>

        <div className="w-full border-t border-cc-border my-2" />

        <button onClick={undo} className="w-9 h-9 rounded-lg flex items-center justify-center text-cc-muted hover:text-cc-text hover:bg-cc-elevated transition-all" title="Undo (Ctrl+Z)"><RotateCcw size={16} /></button>

        <div className="w-full border-t border-cc-border my-2" />

        <p className="text-cc-muted text-[9px] uppercase tracking-wider">BG</p>
        {BG_PRESETS.map((p) => (
          <button
            key={p.value}
            onClick={() => setCanvasBackground(p.value)}
            title={`Background: ${p.label}`}
            className={`w-7 h-7 rounded transition-all border ${bg === p.value ? 'ring-2 ring-cc-accent border-cc-accent' : 'border-cc-border hover:ring-1 ring-cc-border-lt'} ${
              p.value === 'transparent'
                ? 'bg-[linear-gradient(45deg,#aaa_25%,transparent_25%),linear-gradient(-45deg,#aaa_25%,transparent_25%),linear-gradient(45deg,transparent_75%,#aaa_75%),linear-gradient(-45deg,transparent_75%,#aaa_75%)] bg-[length:6px_6px] bg-[position:0_0,0_3px,3px_-3px,-3px_0px]'
                : ''
            }`}
            style={p.value !== 'transparent' ? { background: p.value } : {}}
          />
        ))}
        <label title="Custom color" className={`w-7 h-7 rounded cursor-pointer overflow-hidden border border-cc-border relative ${!['#ffffff','#000000','transparent'].includes(bg) ? 'ring-2 ring-cc-accent' : ''}`}>
          <input type="color" value={bg === 'transparent' ? '#121212' : bg} onChange={(e) => setCanvasBackground(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
          <div className="w-full h-full" style={{ background: bg === 'transparent' ? 'conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' : bg }} />
        </label>
      </div>

      {/* Generate popover */}
      {activeTool === 'generate' && (
        <GeneratePopover onClose={() => setActiveTool('select')} />
      )}
    </div>
  )
}
