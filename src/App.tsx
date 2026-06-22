import { Toaster } from 'react-hot-toast'
import { PanelGroup, Panel, PanelResizeHandle } from 'react-resizable-panels'
import { Layers, Clock, Download, GitBranch, SplitSquareHorizontal } from 'lucide-react'

import { useStore } from './store'
import { useKeyboardShortcuts } from './hooks/useKeyboardShortcuts'

import { TopBar } from './components/ui/TopBar'
import { NewProjectScreen } from './components/ui/NewProjectScreen'
import { Toolbar } from './components/editor/Toolbar'
import { Canvas } from './components/editor/Canvas'
import { AIEditPanel } from './components/editor/AIEditPanel'
import { CompareView } from './components/editor/CompareView'
import { MagicEditOverlay } from './components/editor/MagicEditOverlay'
import { LayersPanel } from './components/panels/LayersPanel'
import { HistoryPanel } from './components/panels/HistoryPanel'
import { ExportPanel } from './components/panels/ExportPanel'
import { TransformationGraph } from './components/panels/TransformationGraph'

const SIDEBAR_TABS = [
  { id: 'layers',  icon: <Layers size={15} />,       label: 'Layers' },
  { id: 'history', icon: <Clock size={15} />,        label: 'History' },
  { id: 'export',  icon: <Download size={15} />,     label: 'Export' },
  { id: 'graph',   icon: <GitBranch size={15} />,    label: 'Graph' },
] as const

export default function App() {
  const { activeView, sidebarTab, setSidebarTab, setShowCompare, project } = useStore()
  useKeyboardShortcuts()

  return (
    <div className="h-screen flex flex-col bg-cc-bg overflow-hidden">
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: { background: '#252525', color: '#fff', border: '1px solid #4d4d4d' },
        }}
      />

      <TopBar />

      <div className="flex-1 overflow-hidden">
        {activeView === 'start' ? (
          <NewProjectScreen />
        ) : (
          /* ── Editor view ────────────────────────────────────────── */
          <PanelGroup id="editor-layout" direction="horizontal" className="h-full">
            {/* Left sidebar */}
            <Panel id="edit-sidebar" order={1} defaultSize={22} minSize={16} maxSize={32}>
              <div className="h-full flex flex-col bg-cc-surface border-r border-cc-border">
                {/* Tab bar */}
                <div className="flex border-b border-cc-border flex-shrink-0">
                  {SIDEBAR_TABS.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => setSidebarTab(tab.id)}
                      title={tab.label}
                      className={`flex-1 flex items-center justify-center py-2.5 transition-all ${
                        sidebarTab === tab.id
                          ? 'text-cc-accent border-b-2 border-cc-accent'
                          : 'text-cc-muted hover:text-cc-text border-b-2 border-transparent'
                      }`}
                    >
                      {tab.icon}
                    </button>
                  ))}
                </div>

                {/* Tab content */}
                <div className="flex-1 overflow-hidden">
                  {sidebarTab === 'layers'  && <LayersPanel />}
                  {sidebarTab === 'history' && <HistoryPanel />}
                  {sidebarTab === 'export'  && <ExportPanel />}
                  {sidebarTab === 'graph'   && <TransformationGraph />}
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1" />

            {/* Main canvas area */}
            <Panel id="edit-canvas" order={2} defaultSize={55} minSize={30}>
              <div className="h-full flex relative">
                <Toolbar />
                <div className="flex-1 relative">
                  <Canvas />
                  <CompareView />
                  <MagicEditOverlay />

                  {/* Compare toggle */}
                  {project.layers.length > 0 && (
                    <button
                      onClick={() => setShowCompare(true)}
                      title="Before / After"
                      className="absolute bottom-4 right-4 flex items-center gap-2 px-3 py-2 bg-cc-surface border border-cc-border rounded-pill text-cc-muted hover:text-cc-text hover:border-cc-accent text-xs transition-all"
                    >
                      <SplitSquareHorizontal size={13} /> Compare
                    </button>
                  )}
                </div>
              </div>
            </Panel>

            <PanelResizeHandle className="w-1" />

            {/* Right panel — AI Edit */}
            <Panel id="edit-ai" order={3} defaultSize={23} minSize={16} maxSize={32}>
              <div className="h-full bg-cc-surface border-l border-cc-border overflow-y-auto scrollbar-dark">
                <AIEditPanel />
              </div>
            </Panel>
          </PanelGroup>
        )}
      </div>
    </div>
  )
}
