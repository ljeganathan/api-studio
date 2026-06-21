import { ChevronRight, ChevronDown, Folder, FolderOpen } from 'lucide-react'

const METHOD_COLORS = {
  GET: 'text-green-400 border-green-400/30 bg-green-400/10',
  POST: 'text-orange-400 border-orange-400/30 bg-orange-400/10',
  PUT: 'text-blue-400 border-blue-400/30 bg-blue-400/10',
  DELETE: 'text-red-400 border-red-400/30 bg-red-400/10',
  PATCH: 'text-purple-400 border-purple-400/30 bg-purple-400/10',
}

export default function TreeNode({ type, name, method, depth = 0, expanded, hasChildren, selected, onClick, onToggle }) {
  return (
    <div
      onClick={onClick}
      className={`flex items-center gap-1.5 px-2 py-1.5 rounded-md cursor-pointer text-sm select-none
        ${selected ? 'bg-orange-500/20 text-orange-300' : 'text-gray-300 hover:bg-gray-700/50'}`}
      style={{ paddingLeft: `${8 + depth * 16}px` }}
    >
      {hasChildren ? (
        <button
          onClick={(e) => { e.stopPropagation(); onToggle?.() }}
          className="text-gray-500 hover:text-gray-300 shrink-0"
        >
          {expanded ? <ChevronDown size={13} /> : <ChevronRight size={13} />}
        </button>
      ) : (
        <span className="w-[13px] shrink-0" />
      )}

      {type !== 'request' && (
        expanded
          ? <FolderOpen size={14} className="text-gray-500 shrink-0" />
          : <Folder size={14} className="text-gray-500 shrink-0" />
      )}

      {type === 'request' && (
        <span className={`text-[10px] font-bold px-1.5 py-0.5 rounded border w-14 text-center shrink-0 ${METHOD_COLORS[method] || 'text-gray-400 border-gray-600'}`}>
          {method}
        </span>
      )}

      <span className="truncate">{name}</span>
    </div>
  )
}
