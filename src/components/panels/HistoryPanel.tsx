import { Clock, RotateCcw, Play } from 'lucide-react'
import { useStore } from '../../store'

export function HistoryPanel() {
  const { project, undo, replay } = useStore()

  return (
    <div className="flex flex-col h-full">
      <div className="flex-1 overflow-y-auto scrollbar-dark">
        {project.history.length === 0 ? (
          <p className="text-cc-muted text-xs text-center py-6 px-3">No history yet</p>
        ) : (
          <div className="space-y-1 p-2">
            {project.history.map((entry, i) => (
              <div
                key={entry.id}
                className={`flex items-center gap-2 px-3 py-2 rounded-lg ${
                  i === 0 ? 'bg-cc-elevated text-cc-text' : 'text-cc-muted hover:bg-cc-elevated transition-all'
                }`}
              >
                <Clock size={11} className="flex-shrink-0" />
                <span className="text-xs flex-1 truncate">{entry.action}</span>
                <span className="text-xs text-cc-border-lt flex-shrink-0">
                  {new Date(entry.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="p-3 border-t border-cc-border flex gap-2 flex-shrink-0">
        <button
          onClick={undo}
          disabled={project.history.length < 2}
          className="flex-1 flex items-center justify-center gap-2 btn-outline text-xs py-2 disabled:opacity-40"
        >
          <RotateCcw size={12} /> Undo
        </button>
        <button
          onClick={replay}
          disabled={project.history.length === 0}
          title="Replay from first recorded state"
          className="flex-1 flex items-center justify-center gap-2 btn-outline text-xs py-2 disabled:opacity-40"
        >
          <Play size={12} /> Replay
        </button>
      </div>
    </div>
  )
}
