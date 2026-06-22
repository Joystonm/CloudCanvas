import { useEffect } from 'react'
import { useStore } from '../store'
import type { Tool } from '../types'

const TOOL_KEYS: Record<string, Tool> = {
  v: 'select',
  m: 'move',
  c: 'crop',
  l: 'lasso',
  t: 'text',
  w: 'magic-remove',
  h: 'heal',
  e: 'expand',
}

export function useKeyboardShortcuts() {
  const { setActiveTool, undo, zoom, setZoom, selectedLayerId, removeLayer } = useStore()

  useEffect(() => {
    function onKeyDown(e: KeyboardEvent) {
      const tag = (e.target as HTMLElement).tagName
      if (tag === 'INPUT' || tag === 'TEXTAREA') return

      const key = e.key.toLowerCase()

      // Delete selected layer
      if ((e.key === 'Delete' || e.key === 'Backspace') && selectedLayerId) {
        e.preventDefault()
        removeLayer(selectedLayerId)
        return
      }

      if (TOOL_KEYS[key]) {
        setActiveTool(TOOL_KEYS[key])
        return
      }

      if ((e.ctrlKey || e.metaKey) && key === 'z') {
        e.preventDefault()
        undo()
        return
      }

      if ((e.ctrlKey || e.metaKey) && (key === '=' || key === '+')) {
        e.preventDefault()
        setZoom(zoom * 1.2)
        return
      }

      if ((e.ctrlKey || e.metaKey) && key === '-') {
        e.preventDefault()
        setZoom(zoom / 1.2)
        return
      }

      if ((e.ctrlKey || e.metaKey) && key === '0') {
        e.preventDefault()
        setZoom(1)
      }
    }

    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [setActiveTool, undo, zoom, setZoom, selectedLayerId, removeLayer])
}
