import { useRef, useEffect, useCallback, useState } from 'react'
import { Stage, Layer, Image as KonvaImage, Transformer, Text, Rect, Line, Ellipse, RegularPolygon, Star, Arrow } from 'react-konva'
import useImage from 'use-image'
import { Loader2 } from 'lucide-react'
import type Konva from 'konva'
import { useStore } from '../../store'
import type { Layer as LayerType } from '../../types'
import { buildCloudinaryUrl } from '../../lib/cloudinary'
import toast from 'react-hot-toast'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo'

function ImageLayer({
  layer, isSelected, isDraggable, onSelect, onChange,
}: {
  layer: LayerType
  isSelected: boolean
  isDraggable: boolean
  onSelect: () => void
  onChange: (patch: Partial<LayerType>) => void
}) {
  const [image, status] = useImage(layer.src || '', 'anonymous')
  const prevImageRef = useRef<HTMLImageElement | undefined>(undefined)
  const imageRef = useRef<Konva.Image>(null)
  const trRef = useRef<Konva.Transformer>(null)

  // Keep showing the last successfully loaded image while next one is loading
  if (status === 'loaded' && image) prevImageRef.current = image
  const displayImage = status === 'loaded' ? image : prevImageRef.current

  useEffect(() => {
    if (isSelected && trRef.current && imageRef.current) {
      trRef.current.nodes([imageRef.current])
      trRef.current.getLayer()?.batchDraw()
    } else if (!isSelected && trRef.current) {
      trRef.current.nodes([])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  return (
    <>
      <KonvaImage
        ref={imageRef}
        image={displayImage}
        x={layer.x} y={layer.y}
        width={layer.width} height={layer.height}
        opacity={status === 'loading' ? 0.5 : layer.opacity}
        visible={layer.visible}
        draggable={isDraggable && !layer.locked}
        onClick={onSelect} onTap={onSelect}
        onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={(e) => {
          const node = e.target
          const sx = node.scaleX(), sy = node.scaleY()
          node.scaleX(1); node.scaleY(1)
          onChange({ x: node.x(), y: node.y(), width: Math.max(10, node.width() * sx), height: Math.max(10, node.height() * sy) })
        }}
      />
      {isSelected && (
        <Transformer ref={trRef} boundBoxFunc={(_, b) => ({ ...b, width: Math.max(10, b.width), height: Math.max(10, b.height) })} />
      )}
    </>
  )
}

function TextLayer({
  layer, isSelected, isDraggable, onSelect, onChange,
}: {
  layer: LayerType
  isSelected: boolean
  isDraggable: boolean
  onSelect: () => void
  onChange: (patch: Partial<LayerType>) => void
}) {
  const textRef = useRef<Konva.Text>(null)
  const trRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    if (isSelected && trRef.current && textRef.current) {
      trRef.current.nodes([textRef.current])
      trRef.current.getLayer()?.batchDraw()
    } else if (!isSelected && trRef.current) {
      trRef.current.nodes([])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  return (
    <>
      <Text
        ref={textRef}
        text={layer.text || 'Text'}
        x={layer.x} y={layer.y}
        fontSize={layer.fontSize || 24}
        fill={layer.fill || '#ffffff'}
        fontFamily={layer.fontFamily || 'Arial'}
        fontStyle={layer.fontStyle || 'normal'}
        textDecoration={layer.textDecoration || ''}
        align={layer.align || 'left'}
        opacity={layer.opacity} visible={layer.visible}
        draggable={isDraggable && !layer.locked}
        onClick={onSelect} onTap={onSelect}
        onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
      />
      {isSelected && <Transformer ref={trRef} />}
    </>
  )
}

function ShapeLayer({
  layer, isSelected, isDraggable, onSelect, onChange,
}: {
  layer: LayerType
  isSelected: boolean
  isDraggable: boolean
  onSelect: () => void
  onChange: (patch: Partial<LayerType>) => void
}) {
  const shapeRef = useRef<Konva.Shape>(null)
  const trRef = useRef<Konva.Transformer>(null)

  useEffect(() => {
    if (isSelected && trRef.current && shapeRef.current) {
      trRef.current.nodes([shapeRef.current])
      trRef.current.getLayer()?.batchDraw()
    } else if (!isSelected && trRef.current) {
      trRef.current.nodes([])
      trRef.current.getLayer()?.batchDraw()
    }
  }, [isSelected])

  const common = {
    ref: shapeRef as any,
    x: layer.x + layer.width / 2,
    y: layer.y + layer.height / 2,
    fill: layer.fill || '#1ed760',
    stroke: layer.strokeColor || undefined,
    strokeWidth: layer.strokeWidth || 0,
    opacity: layer.opacity,
    visible: layer.visible,
    draggable: isDraggable && !layer.locked,
    onClick: onSelect, onTap: onSelect,
    onDragEnd: (e: Konva.KonvaEventObject<DragEvent>) => {
      const node = e.target
      onChange({ x: node.x() - layer.width / 2, y: node.y() - layer.height / 2 })
    },
    onTransformEnd: (e: Konva.KonvaEventObject<Event>) => {
      const node = e.target
      const sx = node.scaleX(), sy = node.scaleY()
      node.scaleX(1); node.scaleY(1)
      const newW = Math.max(10, layer.width * sx)
      const newH = Math.max(10, layer.height * sy)
      onChange({ x: node.x() - newW / 2, y: node.y() - newH / 2, width: newW, height: newH })
    },
  }

  const kind = layer.shapeKind || 'rect'

  return (
    <>
      {kind === 'rect' && <Rect {...common} x={layer.x} y={layer.y} width={layer.width} height={layer.height}
        onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() })}
        onTransformEnd={(e) => {
          const node = e.target; const sx = node.scaleX(), sy = node.scaleY()
          node.scaleX(1); node.scaleY(1)
          onChange({ x: node.x(), y: node.y(), width: Math.max(10, layer.width * sx), height: Math.max(10, layer.height * sy) })
        }}
      />}
      {kind === 'ellipse' && <Ellipse {...common} radiusX={layer.width / 2} radiusY={layer.height / 2} />}
      {kind === 'triangle' && <RegularPolygon {...common} sides={3} radius={Math.min(layer.width, layer.height) / 2} />}
      {kind === 'star' && <Star {...common} numPoints={5} innerRadius={Math.min(layer.width, layer.height) / 4} outerRadius={Math.min(layer.width, layer.height) / 2} />}
      {kind === 'arrow' && <Arrow {...common} x={layer.x} y={layer.y + layer.height / 2}
        points={[0, 0, layer.width, 0]}
        pointerLength={12} pointerWidth={10}
        onDragEnd={(e) => onChange({ x: e.target.x(), y: e.target.y() - layer.height / 2 })}
      />}
      {isSelected && <Transformer ref={trRef} boundBoxFunc={(_, b) => ({ ...b, width: Math.max(10, b.width), height: Math.max(10, b.height) })} />}
    </>
  )
}

// Checkerboard pattern for transparent background
function CheckerRect({ x, y, w, h }: { x: number; y: number; w: number; h: number }) {
  const size = 12
  const cols = Math.ceil(w / size)
  const rows = Math.ceil(h / size)
  const rects: React.ReactElement[] = []
  for (let r = 0; r < rows; r++) {
    for (let c = 0; c < cols; c++) {
      if ((r + c) % 2 === 0) {
        rects.push(
          <Rect
            key={`${r}-${c}`}
            x={x + c * size} y={y + r * size}
            width={Math.min(size, w - c * size)}
            height={Math.min(size, h - r * size)}
            fill="#cccccc"
          />
        )
      }
    }
  }
  return <>{rects}</>
}

// Module-level ref so ExportPanel can call stageRef.toDataURL()
let _stageInstance: Konva.Stage | null = null
let _stageExportParams = { offsetX: 0, offsetY: 0, effectiveZoom: 1, canvasWidth: 0, canvasHeight: 0 }
export function getStage() { return _stageInstance }
export function getStageExportParams() { return _stageExportParams }

export function Canvas() {
  const { project, activeTool, selectedLayerId, zoom, setSelectedLayer, setActiveTool, updateLayer, setZoom, pushHistory, addLayer, setBrushStrokes, brushStrokes, shapeColor, strokeColor, strokeWidth, activeShapeKind } = useStore()
  const containerRef = useRef<HTMLDivElement>(null)
  const stageRef = useRef<Konva.Stage>(null)
  const [size, setSize] = useState({ width: 800, height: 600 })

  // Crop state
  const [cropRect, setCropRect] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const cropStart = useRef<{ x: number; y: number } | null>(null)

  // Lasso state
  const [lassoPoints, setLassoPoints] = useState<number[]>([])
  const isDrawingLasso = useRef(false)

  // Brush/erase painting state
  const isDrawingBrush = useRef(false)
  const currentStroke = useRef<number[]>([])

  // Shape drawing state
  const [draftShape, setDraftShape] = useState<{ x: number; y: number; w: number; h: number } | null>(null)
  const shapeStart = useRef<{ x: number; y: number } | null>(null)

  useEffect(() => {
    const el = containerRef.current
    if (!el) return
    const ro = new ResizeObserver(() => setSize({ width: el.offsetWidth, height: el.offsetHeight }))
    ro.observe(el)
    setSize({ width: el.offsetWidth, height: el.offsetHeight })
    return () => ro.disconnect()
  }, [])

  // Expose stage for export
  useEffect(() => {
    _stageInstance = stageRef.current
    _stageExportParams = { offsetX, offsetY, effectiveZoom, canvasWidth: project.canvasWidth, canvasHeight: project.canvasHeight }
    return () => { _stageInstance = null }
  })

  const padding = 48
  const fitScale = Math.min(
    (size.width - padding * 2) / project.canvasWidth,
    (size.height - padding * 2) / project.canvasHeight,
  )
  const effectiveZoom = zoom === 1 ? fitScale : zoom
  const offsetX = (size.width - project.canvasWidth * effectiveZoom) / 2
  const offsetY = (size.height - project.canvasHeight * effectiveZoom) / 2

  const isDraggable = activeTool === 'select' || activeTool === 'move'

  // Convert stage pointer position to canvas coordinates
  const toCanvas = useCallback((stage: Konva.Stage) => {
    const pos = stage.getPointerPosition()
    if (!pos) return null
    return {
      x: (pos.x - offsetX) / effectiveZoom,
      y: (pos.y - offsetY) / effectiveZoom,
    }
  }, [offsetX, offsetY, effectiveZoom])

  const handleWheel = useCallback((e: Konva.KonvaEventObject<WheelEvent>) => {
    e.evt.preventDefault()
    if (!e.evt.ctrlKey && !e.evt.metaKey) return
    const factor = e.evt.deltaY < 0 ? 1.1 : 0.9
    setZoom(effectiveZoom * factor)
  }, [effectiveZoom, setZoom])

  // ── Crop handlers ──────────────────────────────────────────────
  const onCropMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage()
    if (!stage) return
    const pos = toCanvas(stage)
    if (!pos) return
    cropStart.current = pos
    setCropRect({ x: pos.x, y: pos.y, w: 0, h: 0 })
  }, [toCanvas])

  const onCropMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!cropStart.current) return
    const stage = e.target.getStage()
    if (!stage) return
    const pos = toCanvas(stage)
    if (!pos) return
    setCropRect({
      x: Math.min(cropStart.current.x, pos.x),
      y: Math.min(cropStart.current.y, pos.y),
      w: Math.abs(pos.x - cropStart.current.x),
      h: Math.abs(pos.y - cropStart.current.y),
    })
  }, [toCanvas])

  const onCropMouseUp = useCallback(() => {
    if (!cropRect || cropRect.w < 5 || cropRect.h < 5) {
      setCropRect(null)
      cropStart.current = null
      return
    }
    const layer = project.layers.find((l) => l.id === selectedLayerId)
    if (!layer?.cloudinaryPublicId) {
      toast.error('Select a Cloudinary layer to crop')
      setCropRect(null)
      cropStart.current = null
      return
    }
    // Convert canvas coords to layer-relative coords
    const rx = Math.round(cropRect.x - layer.x)
    const ry = Math.round(cropRect.y - layer.y)
    const rw = Math.round(cropRect.w)
    const rh = Math.round(cropRect.h)
    const transformation = `c_crop,x_${rx},y_${ry},w_${rw},h_${rh},f_auto,q_auto`
    const newUrl = buildCloudinaryUrl(CLOUD_NAME, layer.cloudinaryPublicId, transformation)
    pushHistory(`Crop: ${layer.name}`)
    updateLayer(layer.id, {
      src: newUrl,
      width: rw, height: rh,
      x: layer.x + rx, y: layer.y + ry,
      transformations: [...(layer.transformations || []), transformation],
    })
    toast.success('Crop applied')
    setCropRect(null)
    cropStart.current = null
  }, [cropRect, selectedLayerId, project.layers, updateLayer, pushHistory])

  // ── Lasso handlers ─────────────────────────────────────────────
  const onLassoMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage()
    if (!stage) return
    const pos = toCanvas(stage)
    if (!pos) return
    isDrawingLasso.current = true
    setLassoPoints([pos.x, pos.y])
  }, [toCanvas])

  const onLassoMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!isDrawingLasso.current) return
    const stage = e.target.getStage()
    if (!stage) return
    const pos = toCanvas(stage)
    if (!pos) return
    setLassoPoints((pts) => [...pts, pos.x, pos.y])
  }, [toCanvas])

  const onLassoMouseUp = useCallback(() => {
    if (!isDrawingLasso.current || lassoPoints.length < 6) {
      setLassoPoints([])
      isDrawingLasso.current = false
      return
    }
    isDrawingLasso.current = false
    const layer = project.layers.find((l) => l.id === selectedLayerId)
    if (!layer?.cloudinaryPublicId) {
      toast.error('Select a Cloudinary layer to apply lasso removal')
      setLassoPoints([])
      return
    }
    // Bounding box of lasso → gen_remove region
    const xs = lassoPoints.filter((_, i) => i % 2 === 0)
    const ys = lassoPoints.filter((_, i) => i % 2 !== 0)
    const x = Math.round(Math.min(...xs) - layer.x)
    const y = Math.round(Math.min(...ys) - layer.y)
    const w = Math.round(Math.max(...xs) - Math.min(...xs))
    const h = Math.round(Math.max(...ys) - Math.min(...ys))
    const transformation = `e_gen_remove:region_(x_${x};y_${y};w_${w};h_${h}),f_auto,q_auto`
    const newUrl = buildCloudinaryUrl(CLOUD_NAME, layer.cloudinaryPublicId, transformation)
    pushHistory(`Lasso Remove: ${layer.name}`)
    updateLayer(layer.id, {
      src: newUrl,
      transformations: [...(layer.transformations || []), transformation],
    })
    toast.success('Lasso removal applied')
    setLassoPoints([])
  }, [lassoPoints, selectedLayerId, project.layers, updateLayer, pushHistory])

  // ── Shape drawing handlers ─────────────────────────────────────
  const onShapeMouseDown = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    const stage = e.target.getStage(); if (!stage) return
    const pos = toCanvas(stage); if (!pos) return
    shapeStart.current = pos
    setDraftShape({ x: pos.x, y: pos.y, w: 0, h: 0 })
  }, [toCanvas])

  const onShapeMouseMove = useCallback((e: Konva.KonvaEventObject<MouseEvent>) => {
    if (!shapeStart.current) return
    const stage = e.target.getStage(); if (!stage) return
    const pos = toCanvas(stage); if (!pos) return
    setDraftShape({
      x: Math.min(shapeStart.current.x, pos.x),
      y: Math.min(shapeStart.current.y, pos.y),
      w: Math.abs(pos.x - shapeStart.current.x),
      h: Math.abs(pos.y - shapeStart.current.y),
    })
  }, [toCanvas])

  const onShapeMouseUp = useCallback(() => {
    if (!draftShape || draftShape.w < 5 || draftShape.h < 5) {
      setDraftShape(null); shapeStart.current = null; return
    }
    const kindLabels: Record<string, string> = { rect: 'Rectangle', ellipse: 'Ellipse', triangle: 'Triangle', star: 'Star', arrow: 'Arrow' }
    addLayer({
      name: kindLabels[activeShapeKind] || 'Shape',
      type: 'shape',
      shapeKind: activeShapeKind,
      fill: shapeColor,
      strokeColor,
      strokeWidth,
      visible: true, locked: false, opacity: 1,
      x: draftShape.x, y: draftShape.y,
      width: draftShape.w, height: draftShape.h,
    })
    pushHistory(`Add ${kindLabels[activeShapeKind]}`)
    setDraftShape(null); shapeStart.current = null
  }, [draftShape, activeShapeKind, shapeColor, strokeColor, strokeWidth, addLayer, pushHistory])

  // ── Stage event routing ────────────────────────────────────────
  const stageProps: Partial<Konva.StageConfig> = {}
  if (activeTool === 'crop') {
    Object.assign(stageProps, { onMouseDown: onCropMouseDown, onMouseMove: onCropMouseMove, onMouseUp: onCropMouseUp })
  } else if (activeTool === 'lasso') {
    Object.assign(stageProps, { onMouseDown: onLassoMouseDown, onMouseMove: onLassoMouseMove, onMouseUp: onLassoMouseUp })
  } else if (activeTool === 'shape') {
    Object.assign(stageProps, { onMouseDown: onShapeMouseDown, onMouseMove: onShapeMouseMove, onMouseUp: onShapeMouseUp })
  } else if (activeTool === 'heal') {
    Object.assign(stageProps, {
      onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => {
        const stage = e.target.getStage(); if (!stage) return
        const pos = toCanvas(stage); if (!pos) return
        isDrawingBrush.current = true
        currentStroke.current = [pos.x, pos.y]
        // Start a new stroke in the store immediately so it renders
        setBrushStrokes([...brushStrokes, currentStroke.current])
      },
      onMouseMove: (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (!isDrawingBrush.current) return
        const stage = e.target.getStage(); if (!stage) return
        const pos = toCanvas(stage); if (!pos) return
        currentStroke.current = [...currentStroke.current, pos.x, pos.y]
        // Replace the last stroke (currently being drawn) with updated points
        const prev = useStore.getState().brushStrokes
        setBrushStrokes([...prev.slice(0, -1), currentStroke.current])
      },
      onMouseUp: () => {
        isDrawingBrush.current = false
        currentStroke.current = []
      },
    })
  } else {
    Object.assign(stageProps, {
      onMouseDown: (e: Konva.KonvaEventObject<MouseEvent>) => {
        if (activeTool === 'text') {
          const stage = e.target.getStage()
          if (!stage) return
          const pos = toCanvas(stage)
          if (!pos) return
          addLayer({
            name: 'Text', type: 'text',
            visible: true, locked: false, opacity: 1,
            x: pos.x, y: pos.y, width: 200, height: 50,
            text: 'Double-click to edit', fontSize: 24, fill: '#000000',
          })
          setActiveTool('select')
        } else if (e.target === e.target.getStage()) {
          setSelectedLayer(null)
        }
      }
    })
  }

  const visibleLayers = [...project.layers].reverse().filter((l) => l.visible)
  const bg = project.canvasBackground
  const cw = project.canvasWidth * effectiveZoom
  const ch = project.canvasHeight * effectiveZoom

  return (
    <div
      ref={containerRef}
      className="flex-1 bg-cc-bg overflow-hidden relative"
      style={{ cursor: activeTool === 'crop' || activeTool === 'lasso' || activeTool === 'shape' ? 'crosshair' : activeTool === 'heal' ? 'cell' : activeTool === 'move' ? 'grab' : activeTool === 'text' ? 'text' : 'default' }}
    >
      <Stage
        ref={stageRef}
        width={size.width}
        height={size.height}
        onWheel={handleWheel}
        {...(stageProps as any)}
      >
        {/* Background layer */}
        <Layer>
          {/* Drop shadow */}
          <Rect x={offsetX + 6} y={offsetY + 6} width={cw} height={ch} fill="#000000" opacity={0.35} />
          {/* Canvas fill */}
          {bg === 'transparent' ? (
            <>
              <Rect x={offsetX} y={offsetY} width={cw} height={ch} fill="#ffffff" />
              <CheckerRect x={offsetX} y={offsetY} w={cw} h={ch} />
            </>
          ) : (
            <Rect x={offsetX} y={offsetY} width={cw} height={ch} fill={bg} />
          )}
          <Rect x={offsetX} y={offsetY} width={cw} height={ch} stroke="#4d4d4d" strokeWidth={1} />
        </Layer>

        {/* Content layer */}
        <Layer x={offsetX} y={offsetY} scaleX={effectiveZoom} scaleY={effectiveZoom}>
          {visibleLayers.map((layer) => {
            const isSelected = selectedLayerId === layer.id
            const onChange = (patch: Partial<LayerType>) => updateLayer(layer.id, patch)
            const onSelect = () => setSelectedLayer(layer.id)
            if (layer.type === 'image') return <ImageLayer key={layer.id} layer={layer} isSelected={isSelected} isDraggable={isDraggable} onSelect={onSelect} onChange={onChange} />
            if (layer.type === 'text') return <TextLayer key={layer.id} layer={layer} isSelected={isSelected} isDraggable={isDraggable} onSelect={onSelect} onChange={onChange} />
            if (layer.type === 'shape') return <ShapeLayer key={layer.id} layer={layer} isSelected={isSelected} isDraggable={isDraggable} onSelect={onSelect} onChange={onChange} />
            return null
          })}
        </Layer>

        {/* Selection overlay layer */}
        <Layer x={offsetX} y={offsetY} scaleX={effectiveZoom} scaleY={effectiveZoom}>
          {/* Draft shape preview */}
          {activeTool === 'shape' && draftShape && draftShape.w > 2 && draftShape.h > 2 && (
            <Rect x={draftShape.x} y={draftShape.y} width={draftShape.w} height={draftShape.h} fill={shapeColor + '88'} stroke={shapeColor} strokeWidth={1 / effectiveZoom} dash={[4 / effectiveZoom, 4 / effectiveZoom]} />
          )}
          {/* Crop rect */}
          {activeTool === 'crop' && cropRect && (
            <>
              <Rect x={cropRect.x} y={cropRect.y} width={cropRect.w} height={cropRect.h} fill="rgba(30,215,96,0.1)" stroke="#1ed760" strokeWidth={1 / effectiveZoom} dash={[4 / effectiveZoom, 4 / effectiveZoom]} />
            </>
          )}
          {/* Lasso path */}
          {activeTool === 'lasso' && lassoPoints.length > 2 && (
            <Line points={lassoPoints} stroke="#1ed760" strokeWidth={1.5 / effectiveZoom} closed={false} dash={[4 / effectiveZoom, 4 / effectiveZoom]} />
          )}
          {/* Brush strokes for erase */}
          {activeTool === 'heal' && brushStrokes.map((pts, i) => (
            <Line key={i} points={pts} stroke="rgba(255,80,80,0.7)" strokeWidth={16 / effectiveZoom} lineCap="round" lineJoin="round" tension={0.4} globalCompositeOperation="source-over" />
          ))}
        </Layer>
      </Stage>

      {project.layers.length === 0 && (
        <div className="absolute inset-0 flex flex-col items-center justify-center pointer-events-none">
          <p className="text-cc-muted text-sm">Canvas is empty</p>
          <p className="text-cc-muted text-xs mt-1">Generate an image or upload a file</p>
        </div>
      )}
      <LayerLoadingOverlay layers={project.layers} />
    </div>
  )
}

/** Watches all image layer srcs — shows a spinner while any is loading */
function LayerLoadingOverlay({ layers }: { layers: LayerType[] }) {
  const imageLayers = layers.filter((l) => l.type === 'image' && l.src)
  return (
    <>
      {imageLayers.map((l) => <LayerLoadWatcher key={l.id} src={l.src!} />)}
    </>
  )
}

function LayerLoadWatcher({ src }: { src: string }) {
  const [, status] = useImage(src, 'anonymous')
  if (status !== 'loading') return null
  return (
    <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
      <div className="flex items-center gap-2 px-4 py-2.5 bg-cc-surface border border-cc-border rounded-xl shadow-heavy">
        <Loader2 size={14} className="animate-spin text-cc-accent" />
        <span className="text-cc-text text-xs font-bold">Applying…</span>
      </div>
    </div>
  )
}
