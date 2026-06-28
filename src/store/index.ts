import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { v4 as uuid } from 'uuid'
import type { Project, Layer, Tool, ChatMessage, TransformationNode, ExportEntry, GenerationPreset } from '../types'
import type { ShapeKind } from '../types'

interface AppState {
  // Active project
  project: Project
  // UI state
  activeTool: Tool
  selectedLayerId: string | null
  zoom: number
  activeView: 'start' | 'editor'
  sidebarTab: 'layers' | 'history' | 'export' | 'graph'
  showCompare: boolean
  compareUrl: string | null
  // Erase brush strokes (shared between Canvas and MagicEditOverlay)
  brushStrokes: number[][]  // array of [x,y,...] point arrays
  setBrushStrokes: (strokes: number[][]) => void
  clearBrushStrokes: () => void
  // Shape tool state
  shapeColor: string
  strokeColor: string
  strokeWidth: number
  activeShapeKind: ShapeKind
  setShapeColor: (c: string) => void
  setStrokeColor: (c: string) => void
  setStrokeWidth: (w: number) => void
  setActiveShapeKind: (k: ShapeKind) => void
  // Chat
  chatMessages: ChatMessage[]
  isGenerating: boolean
  selectedPreset: GenerationPreset
  // Actions
  setActiveTool: (tool: Tool) => void
  setSelectedLayer: (id: string | null) => void
  setZoom: (zoom: number) => void
  setActiveView: (v: 'start' | 'editor') => void
  setSidebarTab: (t: 'layers' | 'history' | 'export' | 'graph') => void
  setShowCompare: (v: boolean, url?: string) => void
  // Layer management
  addLayer: (layer: Omit<Layer, 'id'>) => void
  updateLayer: (id: string, patch: Partial<Layer>) => void
  removeLayer: (id: string) => void
  reorderLayers: (ids: string[]) => void
  replaceAllLayers: (layer: Omit<Layer, 'id'>) => void
  // History
  pushHistory: (action: string) => void
  undo: () => void
  replay: () => void
  // Chat
  addMessage: (msg: Omit<ChatMessage, 'id' | 'timestamp'>) => void
  setGenerating: (v: boolean) => void
  setPreset: (p: GenerationPreset) => void
  clearChat: () => void
  // Transformation graph
  setTransformationGraph: (node: TransformationNode | null) => void
  // Exports
  addExport: (entry: ExportEntry) => void
  clearExports: () => void
  // Project
  updateProjectName: (name: string) => void
  setCanvasBackground: (bg: string) => void
  setCanvasSize: (w: number, h: number) => void
}

function newProject(): Project {
  return {
    id: uuid(),
    name: 'Untitled Project',
    createdAt: Date.now(),
    updatedAt: Date.now(),
    layers: [],
    history: [],
    canvasWidth: 1024,
    canvasHeight: 768,
    canvasBackground: 'transparent',
    transformationGraph: null,
    exports: [],
  }
}

export const useStore = create<AppState>()(
  persist(
    (set, get) => ({
      project: newProject(),
      activeTool: 'select',
      selectedLayerId: null,
      zoom: 1,
      activeView: 'start',
      sidebarTab: 'layers',
      showCompare: false,
      compareUrl: null,
      brushStrokes: [],
      setBrushStrokes: (strokes) => set({ brushStrokes: strokes }),
      clearBrushStrokes: () => set({ brushStrokes: [] }),
      shapeColor: '#1ed760',
      strokeColor: '#ffffff',
      strokeWidth: 0,
      activeShapeKind: 'rect' as ShapeKind,
      setShapeColor: (c) => set({ shapeColor: c }),
      setStrokeColor: (c) => set({ strokeColor: c }),
      setStrokeWidth: (w) => set({ strokeWidth: w }),
      setActiveShapeKind: (k) => set({ activeShapeKind: k }),
      chatMessages: [],
      isGenerating: false,
      selectedPreset: 'photo',

      setActiveTool: (tool) => {
        // Clear brush strokes when switching away from heal
        if (tool !== 'heal') set({ brushStrokes: [] })
        set({ activeTool: tool })
      },
      setSelectedLayer: (id) => set({ selectedLayerId: id }),
      setZoom: (zoom) => set({ zoom: Math.max(0.1, Math.min(zoom, 5)) }),
      setActiveView: (v) => set({ activeView: v }),
      setSidebarTab: (t) => set({ sidebarTab: t }),
      setShowCompare: (v, url) => set({ showCompare: v, compareUrl: url ?? get().compareUrl }),

      addLayer: (layer) => {
        const newLayer = { ...layer, id: uuid() }
        set((s) => ({
          project: {
            ...s.project,
            layers: [newLayer, ...s.project.layers],
            updatedAt: Date.now(),
          },
        }))
      },

      replaceAllLayers: (layer) => {
        const newLayer = { ...layer, id: uuid() }
        set((s) => ({
          project: { ...s.project, layers: [newLayer], updatedAt: Date.now() },
          selectedLayerId: newLayer.id,
        }))
      },

      updateLayer: (id, patch) => {
        set((s) => ({
          project: {
            ...s.project,
            layers: s.project.layers.map((l) => (l.id === id ? { ...l, ...patch } : l)),
            updatedAt: Date.now(),
          },
        }))
      },

      removeLayer: (id) => {
        set((s) => ({
          project: {
            ...s.project,
            layers: s.project.layers.filter((l) => l.id !== id),
            updatedAt: Date.now(),
          },
          selectedLayerId: s.selectedLayerId === id ? null : s.selectedLayerId,
        }))
      },

      reorderLayers: (ids) => {
        set((s) => {
          const map = Object.fromEntries(s.project.layers.map((l) => [l.id, l]))
          return {
            project: {
              ...s.project,
              layers: ids.map((id) => map[id]).filter(Boolean),
              updatedAt: Date.now(),
            },
          }
        })
      },

      pushHistory: (action) => {
        set((s) => {
          const entry = {
            id: uuid(),
            action,
            timestamp: Date.now(),
            snapshot: JSON.parse(JSON.stringify(s.project.layers)),
          }
          return {
            project: {
              ...s.project,
              history: [entry, ...s.project.history].slice(0, 50),
              updatedAt: Date.now(),
            },
          }
        })
      },

      undo: () => {
        const { project } = get()
        if (project.history.length === 0) return
        const [latest] = project.history
        set((s) => ({
          project: {
            ...s.project,
            layers: JSON.parse(JSON.stringify(latest.snapshot)),
            history: s.project.history.slice(1),
            updatedAt: Date.now(),
          },
        }))
      },

      // Replay: re-apply all history entries from oldest to newest onto current state
      replay: () => {
        const { project } = get()
        if (project.history.length === 0) return
        const oldest = project.history[project.history.length - 1]
        set((s) => ({
          project: {
            ...s.project,
            layers: JSON.parse(JSON.stringify(oldest.snapshot)),
            updatedAt: Date.now(),
          },
        }))
      },

      addMessage: (msg) => {
        set((s) => ({
          chatMessages: [
            ...s.chatMessages,
            { ...msg, id: uuid(), timestamp: Date.now() },
          ],
        }))
      },

      setGenerating: (v) => set({ isGenerating: v }),
      setPreset: (p) => set({ selectedPreset: p }),
      clearChat: () => set({ chatMessages: [] }),

      setTransformationGraph: (node) => {
        set((s) => ({
          project: { ...s.project, transformationGraph: node, updatedAt: Date.now() },
        }))
      },

      addExport: (entry) => {
        set((s) => ({
          project: {
            ...s.project,
            exports: [entry, ...s.project.exports],
            updatedAt: Date.now(),
          },
        }))
      },

      clearExports: () => {
        set((s) => ({ project: { ...s.project, exports: [] } }))
      },

      updateProjectName: (name) => {
        set((s) => ({ project: { ...s.project, name, updatedAt: Date.now() } }))
      },
      setCanvasBackground: (bg) => {
        set((s) => ({ project: { ...s.project, canvasBackground: bg, updatedAt: Date.now() } }))
      },
      setCanvasSize: (w, h) => {
        set((s) => ({ project: { ...s.project, canvasWidth: w, canvasHeight: h, updatedAt: Date.now() } }))
      },
    }),
    {
      name: 'cloudcanvas-v1',
      partialize: (s) => ({ project: s.project, chatMessages: s.chatMessages }),
    }
  )
)
