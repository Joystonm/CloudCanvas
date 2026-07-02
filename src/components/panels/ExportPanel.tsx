import { useState } from 'react'
import { Download, Loader2, Image as ImageIcon, ChevronDown } from 'lucide-react'
import { useStore } from '../../store'
import { EXPORT_PRESETS } from '../../lib/cloudinary'
import { getStage, getStageExportParams } from '../editor/Canvas'
import { v4 as uuid } from 'uuid'
import toast from 'react-hot-toast'

const FORMATS = ['png', 'jpg', 'webp'] as const

async function downloadUrl(url: string, filename: string) {
  const res = await fetch(url)
  const blob = await res.blob()
  const a = document.createElement('a')
  a.href = URL.createObjectURL(blob)
  a.download = filename
  a.click()
  URL.revokeObjectURL(a.href)
}

function downloadDataUrl(dataUrl: string, filename: string) {
  const a = document.createElement('a')
  a.href = dataUrl
  a.download = filename
  a.click()
}

export function ExportPanel() {
  const { project, addExport, clearExports } = useStore()
  const [loading, setLoading] = useState<string | null>(null)
  const [showLayerPicker, setShowLayerPicker] = useState(false)

  // All image layers that have a Cloudinary public ID (can be exported via presets)
  const cloudinaryLayers = project.layers.filter(
    (l) => l.type === 'image' && l.cloudinaryPublicId && l.src
  )

  // Default export target: prefer 'Background' layer, else first image layer
  const defaultLayer =
    cloudinaryLayers.find((l) => l.name === 'Background') ?? cloudinaryLayers[0]

  const [selectedLayerId, setSelectedLayerId] = useState<string | null>(null)

  const exportLayer =
    cloudinaryLayers.find((l) => l.id === selectedLayerId) ?? defaultLayer

  async function exportCurrentCanvas() {
    const stage = getStage()
    if (!stage) { toast.error('Canvas not ready'); return }
    setLoading('canvas')
    try {
      const { offsetX, offsetY, effectiveZoom, canvasWidth, canvasHeight } = getStageExportParams()
      const dataUrl = stage.toDataURL({
        mimeType: 'image/png',
        x: offsetX, y: offsetY,
        width: canvasWidth * effectiveZoom,
        height: canvasHeight * effectiveZoom,
        pixelRatio: 1 / effectiveZoom,
      })
      downloadDataUrl(dataUrl, `${project.name}.png`)
      toast.success('Canvas exported')
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`)
    } finally {
      setLoading(null)
    }
  }

  async function doExport(presetId: string, format: typeof FORMATS[number]) {
    if (!exportLayer?.cloudinaryPublicId || !exportLayer?.src) {
      toast.error('No Cloudinary image found. Upload or generate an image first.')
      return
    }

    const preset = EXPORT_PRESETS.find((p) => p.id === presetId)!
    const key = `${presetId}-${format}`
    setLoading(key)

    try {
      const currentSrc = exportLayer.src
      const uploadIdx = currentSrc.indexOf('/upload/') + '/upload/'.length
      const resize = `c_fill,w_${preset.width},h_${preset.height},g_auto,f_${format},q_auto`
      const url = currentSrc.slice(0, uploadIdx) + resize + '/' + currentSrc.slice(uploadIdx)
      const filename = `cloudcanvas-${preset.id}.${format}`

      let originalSize: number | undefined
      let finalSize: number | undefined
      try {
        const [r1, r2] = await Promise.all([
          fetch(currentSrc, { method: 'HEAD' }),
          fetch(url, { method: 'HEAD' }),
        ])
        originalSize = parseInt(r1.headers.get('content-length') || '0') || undefined
        finalSize = parseInt(r2.headers.get('content-length') || '0') || undefined
      } catch { /* sizes optional */ }

      addExport({ id: uuid(), label: `${preset.label} (${format.toUpperCase()})`, format, width: preset.width, height: preset.height, url, originalSize, finalSize })
      await downloadUrl(url, filename)
      toast.success(`Downloaded: ${preset.label}`)
    } catch (err: any) {
      toast.error(`Export failed: ${err.message}`)
    } finally {
      setLoading(null)
    }
  }

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-dark p-3 space-y-4">

        {cloudinaryLayers.length === 0 && (
          <p className="text-cc-warn text-xs bg-cc-elevated rounded-lg p-3">
            Upload or generate an image to enable exports.
          </p>
        )}

        {/* Export full canvas (always available) */}
        <button
          onClick={exportCurrentCanvas}
          disabled={loading === 'canvas' || project.layers.length === 0}
          className="w-full flex items-center justify-center gap-2 bg-cc-accent hover:bg-white text-black text-xs font-bold uppercase tracking-wider py-2.5 rounded-pill transition-all disabled:opacity-40"
        >
          {loading === 'canvas' ? <Loader2 size={12} className="animate-spin" /> : <Download size={12} />}
          Export Full Canvas
        </button>

        {/* Layer picker — shown when multiple Cloudinary layers exist */}
        {cloudinaryLayers.length > 1 && (
          <div>
            <p className="text-cc-muted text-xs uppercase tracking-wider mb-1.5">Export source</p>
            <div className="relative">
              <button
                onClick={() => setShowLayerPicker((v) => !v)}
                className="w-full flex items-center justify-between px-3 py-2 bg-cc-elevated hover:bg-cc-card rounded-lg text-xs text-cc-text border border-cc-border transition-all"
              >
                <span className="flex items-center gap-2">
                  <ImageIcon size={11} className="text-cc-accent" />
                  {exportLayer?.name ?? 'Select layer'}
                </span>
                <ChevronDown size={11} className={`text-cc-muted transition-transform ${showLayerPicker ? 'rotate-180' : ''}`} />
              </button>
              {showLayerPicker && (
                <div className="absolute z-20 top-full left-0 right-0 mt-1 bg-cc-surface border border-cc-border rounded-lg shadow-heavy overflow-hidden">
                  {cloudinaryLayers.map((l) => (
                    <button
                      key={l.id}
                      onClick={() => { setSelectedLayerId(l.id); setShowLayerPicker(false) }}
                      className={`w-full flex items-center gap-2 px-3 py-2 text-xs text-left transition-all hover:bg-cc-elevated ${
                        (exportLayer?.id === l.id) ? 'text-cc-accent font-bold' : 'text-cc-text'
                      }`}
                    >
                      {l.src && (
                        <img src={l.src} alt="" className="w-7 h-7 rounded object-cover flex-shrink-0 bg-cc-card" />
                      )}
                      <span className="truncate">{l.name}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Preset exports */}
        {cloudinaryLayers.length > 0 && (
          <div>
            <p className="text-cc-muted text-xs uppercase tracking-wider mb-2">Export Presets</p>
            <div className="space-y-2">
              {EXPORT_PRESETS.map((preset) => (
                <div key={preset.id} className="bg-cc-elevated rounded-lg p-3">
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-cc-text text-sm font-bold">{preset.label}</span>
                    <span className="text-cc-muted text-xs">{preset.width}×{preset.height}</span>
                  </div>
                  <div className="flex gap-1">
                    {FORMATS.map((fmt) => {
                      const key = `${preset.id}-${fmt}`
                      return (
                        <button
                          key={fmt}
                          onClick={() => doExport(preset.id, fmt)}
                          disabled={!!loading || !exportLayer?.cloudinaryPublicId}
                          className="flex-1 flex items-center justify-center gap-1 px-2 py-1.5 bg-cc-card hover:bg-cc-surface rounded text-xs text-cc-muted hover:text-cc-text uppercase font-bold transition-all disabled:opacity-40 disabled:cursor-not-allowed"
                        >
                          {loading === key ? <Loader2 size={10} className="animate-spin" /> : fmt}
                        </button>
                      )
                    })}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Recent exports */}
        {project.exports.length > 0 && (
          <div>
            <div className="flex items-center justify-between mb-2">
              <p className="text-cc-muted text-xs uppercase tracking-wider">Recent Exports</p>
              <button onClick={clearExports} className="text-cc-muted text-xs hover:text-cc-error transition-colors">Clear</button>
            </div>
            <div className="space-y-2">
              {project.exports.map((exp) => (
                <div key={exp.id} className="flex items-center gap-2 bg-cc-elevated rounded-lg p-2">
                  <ImageIcon size={14} className="text-cc-accent flex-shrink-0" />
                  <div className="flex-1 min-w-0">
                    <p className="text-cc-text text-xs font-bold truncate">{exp.label}</p>
                    <p className="text-cc-muted text-xs">{exp.width}×{exp.height}</p>
                    {exp.originalSize && exp.finalSize && (
                      <p className="text-cc-accent text-xs">
                        {(exp.originalSize / 1024).toFixed(0)}KB → {(exp.finalSize / 1024).toFixed(0)}KB
                        <span className="text-cc-muted ml-1">(saved {Math.round((1 - exp.finalSize / exp.originalSize) * 100)}%)</span>
                      </p>
                    )}
                  </div>
                  <button
                    onClick={() => downloadUrl(exp.url, `cloudcanvas.${exp.format}`)}
                    className="w-7 h-7 rounded-full bg-cc-accent hover:bg-white flex items-center justify-center text-black flex-shrink-0 transition-all"
                  >
                    <Download size={12} />
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
