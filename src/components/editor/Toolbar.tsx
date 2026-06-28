import { useState, useRef } from 'react'
import {
  MousePointer2, Crop, Move, Lasso,
  ZoomIn, ZoomOut, RotateCcw, Wand2, Eraser, Expand, Type, Sparkles,
  Square, Circle, Triangle, Star, ArrowRight, Pipette,
} from 'lucide-react'
import { useStore } from '../../store'
import type { Tool } from '../../types'
import type { ShapeKind } from '../../types'
import { GeneratePopover } from './GeneratePopover'

const TOOLS: { id: Tool; icon: React.ReactNode; label: string; shortcut: string }[] = [
  { id: 'select',       icon: <MousePointer2 size={16} />, label: 'Select',       shortcut: 'V' },
  { id: 'move',         icon: <Move size={16} />,          label: 'Move',         shortcut: 'M' },
  { id: 'crop',         icon: <Crop size={16} />,          label: 'Crop',         shortcut: 'C' },
  { id: 'lasso',        icon: <Lasso size={16} />,         label: 'Lasso',        shortcut: 'L' },
  { id: 'text',         icon: <Type size={16} />,          label: 'Text',         shortcut: 'T' },
  { id: 'shape',        icon: <Square size={16} />,        label: 'Shape',        shortcut: 'S' },
  { id: 'magic-remove', icon: <Wand2 size={16} />,         label: 'Magic Remove', shortcut: 'W' },
  { id: 'heal',         icon: <Eraser size={16} />,        label: 'Erase Object', shortcut: 'H' },
  { id: 'expand',       icon: <Expand size={16} />,        label: 'Expand',       shortcut: 'E' },
  { id: 'generate',     icon: <Sparkles size={16} />,      label: 'AI Generate',  shortcut: 'G' },
]

const SHAPES: { kind: ShapeKind; icon: React.ReactNode; label: string }[] = [
  { kind: 'rect',     icon: <Square size={13} />,    label: 'Rectangle' },
  { kind: 'ellipse',  icon: <Circle size={13} />,    label: 'Ellipse' },
  { kind: 'triangle', icon: <Triangle size={13} />,  label: 'Triangle' },
  { kind: 'star',     icon: <Star size={13} />,       label: 'Star' },
  { kind: 'arrow',    icon: <ArrowRight size={13} />, label: 'Arrow' },
]

const BG_PRESETS = [
  { label: 'White',       value: '#ffffff' },
  { label: 'Black',       value: '#000000' },
  { label: 'Transparent', value: 'transparent' },
]

export function Toolbar() {
  const {
    activeTool, setActiveTool, zoom, setZoom, undo, project, setCanvasBackground,
    shapeColor, setShapeColor, strokeColor, setStrokeColor, activeShapeKind, setActiveShapeKind,
  } = useStore()
  const bg = project.canvasBackground
  const [showShapePicker, setShowShapePicker] = useState(false)
  const [showColorPicker, setShowColorPicker] = useState(false)
  const shapeButtonRef = useRef<HTMLButtonElement>(null)
  const colorButtonRef = useRef<HTMLButtonElement>(null)

  return (
    <div className="relative flex-shrink-0">
      <div className="w-14 bg-cc-surface border-r border-cc-border flex flex-col items-center py-3 gap-1 h-full overflow-y-auto scrollbar-dark">
        {TOOLS.map((tool) => (
          <button
            key={tool.id}
            ref={tool.id === 'shape' ? shapeButtonRef : undefined}
            onClick={() => {
              if (tool.id === 'shape') {
                setActiveTool('shape')
                setShowShapePicker((v) => !v)
                setShowColorPicker(false)
              } else {
                setShowShapePicker(false)
                setActiveTool(activeTool === tool.id && tool.id === 'generate' ? 'select' : tool.id)
              }
            }}
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

        {/* Color Picker button — always visible */}
        <button
          ref={colorButtonRef}
          onClick={() => { setShowColorPicker((v) => !v); setShowShapePicker(false) }}
          title="Color Picker"
          className={`w-9 h-9 rounded-lg flex items-center justify-center transition-all relative ${showColorPicker ? 'bg-cc-accent text-black' : 'text-cc-muted hover:text-cc-text hover:bg-cc-elevated'}`}
        >
          <Pipette size={16} />
        </button>
        {/* Color swatch preview */}
        <div className="flex gap-1 mt-0.5">
          {/* Fill swatch */}
          <label title="Fill color" className="w-4 h-4 rounded-sm cursor-pointer border border-cc-border overflow-hidden relative">
            <input type="color" value={shapeColor} onChange={(e) => setShapeColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
            <div className="w-full h-full" style={{ background: shapeColor }} />
          </label>
          {/* Stroke swatch */}
          <label title="Stroke color" className="w-4 h-4 rounded-sm cursor-pointer border border-cc-border overflow-hidden relative">
            <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
            <div className="w-full h-full" style={{ background: strokeColor }} />
          </label>
        </div>

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
        <label title="Custom BG color" className={`w-7 h-7 rounded cursor-pointer overflow-hidden border border-cc-border relative ${!['#ffffff','#000000','transparent'].includes(bg) ? 'ring-2 ring-cc-accent' : ''}`}>
          <input type="color" value={bg === 'transparent' ? '#121212' : bg} onChange={(e) => setCanvasBackground(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
          <div className="w-full h-full" style={{ background: bg === 'transparent' ? 'conic-gradient(#f00,#ff0,#0f0,#0ff,#00f,#f0f,#f00)' : bg }} />
        </label>
      </div>

      {/* Shape picker flyout — fixed next to shape button */}
      {showShapePicker && (
        <div
          className="absolute left-[56px] z-50 bg-cc-surface border border-cc-border rounded-xl shadow-heavy p-3 w-48 flex flex-col gap-3"
          style={{ top: shapeButtonRef.current ? shapeButtonRef.current.offsetTop : 0 }}
        >
          <p className="text-cc-muted text-[10px] uppercase tracking-wider font-bold">Shape</p>
          <div className="grid grid-cols-5 gap-1">
            {SHAPES.map((s) => (
              <button
                key={s.kind}
                onClick={() => setActiveShapeKind(s.kind)}
                title={s.label}
                className={`w-8 h-8 rounded-lg flex items-center justify-center transition-all ${
                  activeShapeKind === s.kind ? 'bg-cc-accent text-black' : 'text-cc-muted hover:text-cc-text hover:bg-cc-elevated'
                }`}
              >
                {s.icon}
              </button>
            ))}
          </div>
          <p className="text-cc-muted text-[10px] mt-1">Click &amp; drag on canvas to draw</p>
        </div>
      )}

      {/* Color picker flyout — full picker with fill + stroke */}
      {showColorPicker && (
        <div
          className="absolute left-[56px] z-50 bg-cc-surface border border-cc-border rounded-xl shadow-heavy p-3 w-52 flex flex-col gap-3"
          style={{ top: colorButtonRef.current ? colorButtonRef.current.offsetTop : 0 }}
        >
          <p className="text-cc-muted text-[10px] uppercase tracking-wider font-bold">Colors</p>

          <div>
            <p className="text-cc-muted text-[10px] mb-1.5">Fill (shapes &amp; text)</p>
            <div className="flex flex-col gap-2">
              <input type="color" value={shapeColor} onChange={(e) => setShapeColor(e.target.value)} className="w-full h-9 rounded-lg cursor-pointer border border-cc-border bg-cc-elevated" />
              <input
                type="text"
                value={shapeColor}
                onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setShapeColor(e.target.value) }}
                className="w-full bg-cc-elevated border border-cc-border rounded px-2 py-1.5 text-cc-text text-xs font-mono"
              />
            </div>
          </div>

          <div>
            <p className="text-cc-muted text-[10px] mb-1.5">Stroke (shapes)</p>
            <div className="flex flex-col gap-2">
              <input type="color" value={strokeColor} onChange={(e) => setStrokeColor(e.target.value)} className="w-full h-9 rounded-lg cursor-pointer border border-cc-border bg-cc-elevated" />
              <input
                type="text"
                value={strokeColor}
                onChange={(e) => { if (/^#[0-9a-fA-F]{0,6}$/.test(e.target.value)) setStrokeColor(e.target.value) }}
                className="w-full bg-cc-elevated border border-cc-border rounded px-2 py-1.5 text-cc-text text-xs font-mono"
              />
            </div>
          </div>
        </div>
      )}

      {/* Generate popover */}
      {activeTool === 'generate' && (
        <GeneratePopover onClose={() => setActiveTool('select')} />
      )}
    </div>
  )
}
