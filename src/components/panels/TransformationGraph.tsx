import { GitBranch } from 'lucide-react'
import { useStore } from '../../store'
import { EXPORT_PRESETS } from '../../lib/cloudinary'
import { buildCloudinaryUrl } from '../../lib/cloudinary'
import { useEffect } from 'react'

const CLOUD_NAME = import.meta.env.VITE_CLOUDINARY_CLOUD_NAME || 'demo'

export function TransformationGraph() {
  const { project, setTransformationGraph } = useStore()
  const mainLayer = project.layers[0]

  // Build graph when main layer has a Cloudinary public ID
  useEffect(() => {
    if (!mainLayer?.cloudinaryPublicId) return
    const root = {
      id: 'original',
      label: 'Original',
      transformation: '',
      url: buildCloudinaryUrl(CLOUD_NAME, mainLayer.cloudinaryPublicId, 'f_auto,q_auto'),
      children: EXPORT_PRESETS.map((p) => ({
        id: p.id,
        label: p.label,
        transformation: p.transformation,
        url: buildCloudinaryUrl(CLOUD_NAME, mainLayer.cloudinaryPublicId!, p.transformation),
        children: [],
      })),
    }
    setTransformationGraph(root)
  }, [mainLayer?.cloudinaryPublicId])

  const graph = project.transformationGraph

  if (!graph) {
    return (
      <div className="flex flex-col items-center justify-center h-full p-4 text-center">
        <GitBranch size={24} className="text-cc-muted mb-2" />
        <p className="text-cc-muted text-xs">Upload a Cloudinary image to see the transformation graph</p>
      </div>
    )
  }

  return (
    <div className="p-3 overflow-y-auto scrollbar-dark h-full">
      <p className="text-cc-muted text-xs uppercase tracking-wider mb-3">Transformation Graph</p>

      {/* Root */}
      <div className="flex flex-col items-center">
        <GraphNode node={graph} isRoot />
        {graph.children.length > 0 && (
          <div className="w-px h-4 bg-cc-border" />
        )}

        {/* Children */}
        {graph.children.length > 0 && (
          <div className="flex gap-2 flex-wrap justify-center">
            {graph.children.map((child) => (
              <div key={child.id} className="flex flex-col items-center">
                <div className="w-px h-3 bg-cc-border" />
                <GraphNode node={child} />
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}

function GraphNode({ node, isRoot }: { node: any; isRoot?: boolean }) {
  return (
    <a
      href={node.url}
      target="_blank"
      rel="noreferrer"
      className={`block rounded-lg p-2 text-center border transition-all hover:border-cc-accent ${
        isRoot
          ? 'bg-cc-elevated border-cc-accent text-cc-accent px-4'
          : 'bg-cc-surface border-cc-border text-cc-muted hover:text-cc-text px-3'
      }`}
    >
      <p className="text-xs font-bold">{node.label}</p>
      {!isRoot && (
        <code className="text-xs text-cc-border-lt block mt-0.5 truncate max-w-[120px]">
          {node.transformation.split(',').slice(0, 2).join(',')}…
        </code>
      )}
    </a>
  )
}
