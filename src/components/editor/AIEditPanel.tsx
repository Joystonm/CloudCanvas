import { useState } from 'react'
import {
  Wand2, Loader2, Sliders, Bold, Italic, Underline,
  AlignLeft, AlignCenter, AlignRight, Sparkles, RefreshCw,
  FlipHorizontal, ChevronDown, ChevronRight, Crop, Palette, ArrowUpCircle,
} from 'lucide-react'
import { useStore } from '../../store'
import type { Layer } from '../../types'
import toast from 'react-hot-toast'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo'

const FILTERS = [
  { label: 'Cinematic',     transformation: 'e_art:audrey' },
  { label: 'Vintage',       transformation: 'e_art:hokusai' },
  { label: 'Grayscale',     transformation: 'e_grayscale' },
  { label: 'Sepia',         transformation: 'e_sepia' },
  { label: 'Vivid',         transformation: 'e_vibrance:60/e_saturation:40' },
  { label: 'Cool',          transformation: 'e_blue:40' },
  { label: 'Warm',          transformation: 'e_red:30/e_brightness:10' },
  { label: 'Sharp',         transformation: 'e_sharpen:200' },
  { label: 'Soft',          transformation: 'e_blur:200' },
  { label: 'High Contrast', transformation: 'e_contrast:60' },
  { label: 'Enhance',       transformation: 'e_improve' },
  { label: 'Upscale',       transformation: 'e_upscale' },
  { label: 'Matte',         transformation: 'e_art:incognito' },
  { label: 'Faded',         transformation: 'e_brightness:15/e_saturation:-40/e_contrast:-20' },
  { label: 'Dramatic',      transformation: 'e_art:athena' },
  { label: 'Neon',          transformation: 'e_art:frost' },
  { label: 'Bleach',        transformation: 'e_art:eucalyptus' },
  { label: 'Deep',          transformation: 'e_art:daguerre' },
  { label: 'Brightness+',   transformation: 'e_brightness:40' },
  { label: 'Brightness-',   transformation: 'e_brightness:-40' },
  { label: 'Saturate+',     transformation: 'e_saturation:60' },
  { label: 'Saturate-',     transformation: 'e_saturation:-60' },
  { label: 'Gamma+',        transformation: 'e_gamma:50' },
  { label: 'Vignette',      transformation: 'e_vignette:40' },
  { label: 'Restore',       transformation: 'e_gen_restore' },
]

const ART_STYLES = [
  { label: 'Audrey',     transformation: 'e_art:audrey' },
  { label: 'Athena',     transformation: 'e_art:athena' },
  { label: 'Aurora',     transformation: 'e_art:aurora' },
  { label: 'Daguerre',   transformation: 'e_art:daguerre' },
  { label: 'Eucalyptus', transformation: 'e_art:eucalyptus' },
  { label: 'Frost',      transformation: 'e_art:frost' },
  { label: 'Hairspray',  transformation: 'e_art:hairspray' },
  { label: 'Hokusai',    transformation: 'e_art:hokusai' },
  { label: 'Incognito',  transformation: 'e_art:incognito' },
  { label: 'Linen',      transformation: 'e_art:linen' },
  { label: 'Peacock',    transformation: 'e_art:peacock' },
  { label: 'Primavera',  transformation: 'e_art:primavera' },
  { label: 'Quartz',     transformation: 'e_art:quartz' },
  { label: 'Red Rock',   transformation: 'e_art:red_rock' },
  { label: 'Sonnet',     transformation: 'e_art:sonnet' },
  { label: 'Ukulele',    transformation: 'e_art:ukulele' },
  { label: 'Zorro',      transformation: 'e_art:zorro' },
]

const SMART_CROP_PRESETS = [
  { label: 'Square',    transformation: 'c_fill,w_1080,h_1080,g_auto' },
  { label: 'Portrait',  transformation: 'c_fill,w_1080,h_1350,g_auto' },
  { label: 'Story',     transformation: 'c_fill,w_1080,h_1920,g_auto' },
  { label: 'Landscape', transformation: 'c_fill,w_1280,h_720,g_auto' },
  { label: 'Face Crop', transformation: 'c_thumb,w_400,h_400,g_face,z_0.75' },
  { label: 'Subject',   transformation: 'c_thumb,w_600,h_600,g_auto:subject' },
]

const ONE_CLICK_TOOLS = [
  { label: 'Auto Enhance',   transformation: 'e_auto_enhance' },
  { label: 'Auto Color',     transformation: 'e_auto_color' },
  { label: 'Auto Contrast',  transformation: 'e_auto_contrast' },
  { label: 'Red Eye Fix',    transformation: 'e_redeye' },
  { label: 'Blur Faces',     transformation: 'e_pixelate_faces:15' },
  { label: 'Drop Shadow',    transformation: 'e_dropshadow:20,co_black' },
  { label: 'Oil Paint',      transformation: 'e_oil_paint:40' },
  { label: 'Vectorize',      transformation: 'e_vectorize:colors:6' },
  { label: 'Outline',        transformation: 'e_outline:outer:3:100,co_black' },
  { label: 'Negate',         transformation: 'e_negate' },
  { label: 'Tint Red',       transformation: 'e_tint:60:red' },
  { label: 'Tint Blue',      transformation: 'e_tint:60:blue' },
  { label: 'Rotate 90°',     transformation: 'a_90' },
  { label: 'Rotate 180°',    transformation: 'a_180' },
  { label: 'Flip H',         transformation: 'a_hflip' },
  { label: 'Flip V',         transformation: 'a_vflip' },
]

const FONTS = ['Arial', 'Georgia', 'Times New Roman', 'Courier New', 'Verdana', 'Trebuchet MS', 'Impact', 'Comic Sans MS', 'Palatino', 'Garamond']
const FONT_SIZES = [12, 16, 20, 24, 32, 40, 48, 64, 80, 96]

function pollUntilReady(url: string, maxAttempts = 12, intervalMs = 3000): Promise<void> {
  return new Promise((resolve, reject) => {
    let attempts = 0
    function attempt() {
      const img = new window.Image()
      img.onload = () => resolve()
      img.onerror = () => {
        if (++attempts >= maxAttempts) { reject(new Error('Cloudinary is taking too long — try again')); return }
        setTimeout(attempt, intervalMs)
      }
      img.src = url + `?p=${attempts}`
    }
    attempt()
  })
}

function buildUrl(publicId: string, transformation: string) {
  return `https://res.cloudinary.com/${CLOUD_NAME}/image/upload/${transformation}/f_auto,q_auto/${publicId}`
}

// ── Accordion ─────────────────────────────────────────────────────────────────
function Section({ title, icon, open, onToggle, children }: {
  title: string; icon: React.ReactNode; open: boolean; onToggle: () => void; children: React.ReactNode
}) {
  return (
    <div className="border-b border-cc-border flex-shrink-0">
      <button onClick={onToggle}
        className="w-full flex items-center gap-2 px-3 py-2.5 hover:bg-cc-elevated transition-all text-left">
        <span className="text-cc-accent">{icon}</span>
        <span className="text-cc-text text-xs font-bold flex-1">{title}</span>
        {open ? <ChevronDown size={12} className="text-cc-muted" /> : <ChevronRight size={12} className="text-cc-muted" />}
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  )
}

// ── Text Properties ───────────────────────────────────────────────────────────
function TextPropertiesPanel({ layer, onChange }: { layer: Layer; onChange: (p: Partial<Layer>) => void }) {
  const bold = layer.fontStyle?.includes('bold')
  const italic = layer.fontStyle?.includes('italic')
  return (
    <div className="space-y-3 pt-1">
      <textarea className="input-pill text-xs w-full resize-none" rows={2}
        value={layer.text || ''} onChange={(e) => onChange({ text: e.target.value })} placeholder="Enter text…" />
      <select value={layer.fontFamily || 'Arial'} onChange={(e) => onChange({ fontFamily: e.target.value })} className="input-pill text-xs w-full">
        {FONTS.map((f) => <option key={f} value={f}>{f}</option>)}
      </select>
      <div className="flex gap-2">
        <select value={layer.fontSize || 24} onChange={(e) => onChange({ fontSize: Number(e.target.value) })} className="input-pill text-xs flex-1">
          {FONT_SIZES.map((s) => <option key={s} value={s}>{s}px</option>)}
        </select>
        <label className="relative w-9 h-9 rounded-lg overflow-hidden border border-cc-border cursor-pointer flex-shrink-0">
          <input type="color" value={layer.fill || '#ffffff'} onChange={(e) => onChange({ fill: e.target.value })} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
          <div className="w-full h-full rounded-lg" style={{ background: layer.fill || '#ffffff' }} />
        </label>
      </div>
      <div className="flex gap-1">
        {[
          { icon: <Bold size={13} />, active: !!bold, onClick: () => onChange({ fontStyle: !bold && italic ? 'bold italic' : !bold ? 'bold' : italic ? 'italic' : 'normal' }) },
          { icon: <Italic size={13} />, active: !!italic, onClick: () => onChange({ fontStyle: bold && !italic ? 'bold italic' : !italic ? 'italic' : bold ? 'bold' : 'normal' }) },
          { icon: <Underline size={13} />, active: layer.textDecoration === 'underline', onClick: () => onChange({ textDecoration: layer.textDecoration === 'underline' ? '' : 'underline' }) },
        ].map((btn, i) => (
          <button key={i} onClick={btn.onClick}
            className={`w-8 h-8 rounded flex items-center justify-center transition-all ${btn.active ? 'bg-cc-accent text-black' : 'bg-cc-elevated text-cc-muted hover:text-cc-text'}`}>
            {btn.icon}
          </button>
        ))}
        <div className="flex-1" />
        {(['left', 'center', 'right'] as const).map((a) => (
          <button key={a} onClick={() => onChange({ align: a })}
            className={`w-8 h-8 rounded flex items-center justify-center transition-all ${layer.align === a ? 'bg-cc-accent text-black' : 'bg-cc-elevated text-cc-muted hover:text-cc-text'}`}>
            {a === 'left' ? <AlignLeft size={13} /> : a === 'center' ? <AlignCenter size={13} /> : <AlignRight size={13} />}
          </button>
        ))}
      </div>
    </div>
  )
}

// ── Main ──────────────────────────────────────────────────────────────────────
export function AIEditPanel() {
  const { project, selectedLayerId, updateLayer, pushHistory } = useStore()
  const [openSection, setOpenSection] = useState<string>('filters')
  const [busyLabel, setBusyLabel] = useState<string | null>(null)
  // Gen AI state
  const [replaceFrom, setReplaceFrom] = useState('')
  const [replaceTo, setReplaceTo] = useState('')
  const [recolorObj, setRecolorObj] = useState('')
  const [recolorTo, setRecolorTo] = useState('#ff0000')
  const [bgPrompt, setBgPrompt] = useState('')

  const selectedLayer = project.layers.find((l) => l.id === selectedLayerId)
  const canApply = !!(selectedLayer?.cloudinaryPublicId && selectedLayer?.src)
  const isText = selectedLayer?.type === 'text'

  function toggle(id: string) { setOpenSection((s) => s === id ? '' : id) }

  async function apply(transformation: string, label: string, generative = false) {
    if (!canApply) { toast.error('Select a Cloudinary-uploaded layer'); return }
    const newUrl = buildUrl(selectedLayer!.cloudinaryPublicId!, transformation)
    if (generative) {
      const tid = toast.loading(`${label}: processing…`)
      try { await pollUntilReady(newUrl) } catch (e: any) { toast.dismiss(tid); toast.error(e.message); return }
      toast.dismiss(tid)
    }
    pushHistory(`${label}: ${selectedLayer!.name}`)
    updateLayer(selectedLayer!.id, { src: newUrl + `?t=${Date.now()}`, transformations: [...(selectedLayer!.transformations || []), transformation] })
    toast.success(`Applied: ${label}`)
  }

  async function runBusy(label: string, t: string, generative = true) {
    setBusyLabel(label); await apply(t, label, generative); setBusyLabel(null)
  }

  return (
    <div className="flex flex-col h-full">
      {/* Header */}
      <div className="p-3 border-b border-cc-border flex-shrink-0">
        <div className="flex items-center gap-2 mb-0.5">
          <Wand2 size={14} className="text-cc-accent" />
          <span className="text-cc-text text-sm font-bold">AI Edit</span>
        </div>
        <p className="text-cc-muted text-xs truncate">
          {selectedLayer ? <><span className="text-cc-accent">{selectedLayer.name}</span></> : 'Select a layer to edit'}
        </p>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-dark">

        {/* Text properties */}
        {isText && (
          <Section title="Text Properties" icon={<Bold size={12} />} open={openSection === 'text'} onToggle={() => toggle('text')}>
            <TextPropertiesPanel layer={selectedLayer!} onChange={(p) => updateLayer(selectedLayer!.id, p)} />
          </Section>
        )}

        {!isText && (<>

          {/* Generative AI */}
          <Section title="Generative AI" icon={<Sparkles size={12} />} open={openSection === 'genai'} onToggle={() => toggle('genai')}>
            <div className="space-y-4 pt-1">
              {/* Replace */}
              <div>
                <p className="text-cc-muted text-[10px] uppercase tracking-wider mb-1.5">Replace Object</p>
                <div className="flex gap-1.5 mb-1.5">
                  <input className="input-pill text-xs flex-1" placeholder="From (e.g. cat)" value={replaceFrom} onChange={(e) => setReplaceFrom(e.target.value)} />
                  <input className="input-pill text-xs flex-1" placeholder="To (e.g. dog)" value={replaceTo} onChange={(e) => setReplaceTo(e.target.value)} />
                </div>
                <button onClick={() => runBusy('Replace', `e_gen_replace:from_${encodeURIComponent(replaceFrom)};to_${encodeURIComponent(replaceTo)}`)}
                  disabled={!canApply || !replaceFrom.trim() || !replaceTo.trim() || busyLabel === 'Replace'}
                  className="w-full py-1.5 bg-cc-elevated hover:bg-cc-card rounded-pill text-xs text-cc-muted hover:text-cc-text transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
                  {busyLabel === 'Replace' ? <Loader2 size={11} className="animate-spin" /> : <RefreshCw size={11} />} Replace
                </button>
              </div>
              {/* Recolor */}
              <div>
                <p className="text-cc-muted text-[10px] uppercase tracking-wider mb-1.5">Recolor Object</p>
                <div className="flex gap-1.5 mb-1.5">
                  <input className="input-pill text-xs flex-1" placeholder="Object (e.g. shirt)" value={recolorObj} onChange={(e) => setRecolorObj(e.target.value)} />
                  <label className="relative w-9 h-9 rounded-lg overflow-hidden border border-cc-border cursor-pointer flex-shrink-0">
                    <input type="color" value={recolorTo} onChange={(e) => setRecolorTo(e.target.value)} className="absolute inset-0 opacity-0 w-full h-full cursor-pointer" />
                    <div className="w-full h-full rounded-lg" style={{ background: recolorTo }} />
                  </label>
                </div>
                <button onClick={() => runBusy('Recolor', `e_gen_recolor:prompt_${encodeURIComponent(recolorObj)};to-color_${recolorTo.replace('#', '')}`)}
                  disabled={!canApply || !recolorObj.trim() || busyLabel === 'Recolor'}
                  className="w-full py-1.5 bg-cc-elevated hover:bg-cc-card rounded-pill text-xs text-cc-muted hover:text-cc-text transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
                  {busyLabel === 'Recolor' ? <Loader2 size={11} className="animate-spin" /> : <FlipHorizontal size={11} />} Recolor
                </button>
              </div>
              {/* BG Replace */}
              <div>
                <p className="text-cc-muted text-[10px] uppercase tracking-wider mb-1.5">Replace Background</p>
                <div className="flex gap-1.5">
                  <input className="input-pill text-xs flex-1" placeholder="Describe new background…" value={bgPrompt} onChange={(e) => setBgPrompt(e.target.value)} />
                  <button onClick={() => runBusy('BgReplace', bgPrompt.trim() ? `e_gen_background_replace:prompt_${encodeURIComponent(bgPrompt)}` : 'e_gen_background_replace')}
                    disabled={!canApply || busyLabel === 'BgReplace'}
                    className="w-8 h-8 rounded-full bg-cc-accent hover:bg-white flex items-center justify-center text-black flex-shrink-0 disabled:opacity-40 transition-all">
                    {busyLabel === 'BgReplace' ? <Loader2 size={11} className="animate-spin" /> : <Sparkles size={11} />}
                  </button>
                </div>
              </div>
            </div>
          </Section>

          {/* Tools */}
          <Section title="Tools" icon={<Wand2 size={12} />} open={openSection === 'tools'} onToggle={() => toggle('tools')}>
            <div className="grid grid-cols-3 gap-1 pt-1">
              {ONE_CLICK_TOOLS.map((t) => (
                <button key={t.label} onClick={() => runBusy(t.label, t.transformation, false)}
                  disabled={!canApply || busyLabel === t.label}
                  className="py-1.5 bg-cc-elevated rounded text-xs text-cc-muted hover:text-cc-text hover:bg-cc-card transition-all disabled:opacity-40 text-center truncate px-1">
                  {busyLabel === t.label ? <Loader2 size={10} className="animate-spin inline" /> : t.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Filters */}
          <Section title="Filters" icon={<Sliders size={12} />} open={openSection === 'filters'} onToggle={() => toggle('filters')}>
            <div className="grid grid-cols-3 gap-1 pt-1">
              {FILTERS.map((f) => (
                <button key={f.label} onClick={() => runBusy(f.label, f.transformation, false)}
                  disabled={!canApply || busyLabel === f.label}
                  className="py-1.5 bg-cc-elevated rounded text-xs text-cc-muted hover:text-cc-text hover:bg-cc-card transition-all disabled:opacity-40 text-center truncate px-1">
                  {busyLabel === f.label ? <Loader2 size={10} className="animate-spin inline" /> : f.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Artistic Styles */}
          <Section title="Artistic Styles" icon={<Palette size={12} />} open={openSection === 'styles'} onToggle={() => toggle('styles')}>
            <div className="grid grid-cols-3 gap-1 pt-1">
              {ART_STYLES.map((s) => (
                <button key={s.label} onClick={() => runBusy(s.label, s.transformation, false)}
                  disabled={!canApply || busyLabel === s.label}
                  className="py-1.5 bg-cc-elevated rounded text-xs text-cc-muted hover:text-cc-text hover:bg-cc-card transition-all disabled:opacity-40 text-center truncate px-1">
                  {busyLabel === s.label ? <Loader2 size={10} className="animate-spin inline" /> : s.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Smart Crop */}
          <Section title="Smart Crop" icon={<Crop size={12} />} open={openSection === 'crop'} onToggle={() => toggle('crop')}>
            <div className="grid grid-cols-3 gap-1 pt-1">
              {SMART_CROP_PRESETS.map((c) => (
                <button key={c.label} onClick={() => runBusy(c.label, c.transformation, false)}
                  disabled={!canApply || busyLabel === c.label}
                  className="py-1.5 bg-cc-elevated rounded text-xs text-cc-muted hover:text-cc-text hover:bg-cc-card transition-all disabled:opacity-40 text-center truncate px-1">
                  {busyLabel === c.label ? <Loader2 size={10} className="animate-spin inline" /> : c.label}
                </button>
              ))}
            </div>
          </Section>

          {/* Generative Enhance */}
          <Section title="Gen Enhance" icon={<ArrowUpCircle size={12} />} open={openSection === 'genenhance'} onToggle={() => toggle('genenhance')}>
            <div className="grid grid-cols-2 gap-1.5 pt-1">
              {[
                { label: 'Gen Upscale',  t: 'e_gen_upscale',          gen: true  },
                { label: 'Gen Restore',  t: 'e_gen_restore',          gen: true  },
                { label: 'Gen Sharpen',  t: 'e_sharpen:400,e_improve', gen: false },
                { label: 'Denoise',      t: 'e_noise:-30,e_improve',   gen: false },
              ].map(({ label, t, gen }) => (
                <button key={label} onClick={() => runBusy(label, t, gen)}
                  disabled={!canApply || busyLabel === label}
                  className="py-2 bg-cc-elevated hover:bg-cc-card rounded text-xs text-cc-muted hover:text-cc-text transition-all disabled:opacity-40 flex items-center justify-center gap-1.5">
                  {busyLabel === label ? <Loader2 size={10} className="animate-spin" /> : <ArrowUpCircle size={10} />}
                  {label}
                </button>
              ))}
            </div>
          </Section>

        </>)}

        {/* Transformation chain */}
        {selectedLayer?.transformations && selectedLayer.transformations.length > 0 && (
          <Section title={`History (${selectedLayer.transformations.length})`} icon={<ChevronDown size={12} />} open={openSection === 'history'} onToggle={() => toggle('history')}>
            <div className="space-y-1 pt-1">
              {selectedLayer.transformations.map((t, i) => (
                <div key={i} className="text-xs bg-cc-elevated rounded px-2 py-1.5">
                  <span className="text-cc-border-lt mr-1">{i + 1}.</span>
                  <code className="text-cc-accent break-all">{t}</code>
                </div>
              ))}
            </div>
          </Section>
        )}

      </div>
    </div>
  )
}
