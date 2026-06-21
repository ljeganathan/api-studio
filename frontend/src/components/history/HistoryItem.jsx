import { RotateCcw, Trash2 } from 'lucide-react'
import { formatDistanceToNow } from 'date-fns'

const METHOD_COLORS = {
  GET: 'text-green-400', POST: 'text-orange-400', PUT: 'text-blue-400',
  DELETE: 'text-red-400', PATCH: 'text-purple-400'
}
const STATUS_COLORS = { 2: 'text-green-400', 3: 'text-yellow-400', 4: 'text-orange-400', 5: 'text-red-400' }

export default function HistoryItem({ log, replaying, onReplay, onDelete }) {
  const statusColor = STATUS_COLORS[Math.floor((log.status_code || 0) / 100)] || 'text-gray-400'
  const timeAgo = formatDistanceToNow(new Date(log.created_at), { addSuffix: true })

  return (
    <div className="group flex items-start gap-3 px-4 py-3 hover:bg-gray-700/40 transition-colors">
      <div className="flex-1 min-w-0">
        <div className="flex items-center gap-2 mb-0.5">
          <span className={`text-xs font-bold w-14 shrink-0 ${METHOD_COLORS[log.method] || 'text-gray-400'}`}>
            {log.method}
          </span>
          {log.status_code && (
            <span className={`text-xs font-semibold ${statusColor}`}>{log.status_code}</span>
          )}
          {log.response_time_ms && (
            <span className="text-xs text-gray-500">{log.response_time_ms}ms</span>
          )}
        </div>
        <p className="text-gray-300 text-xs truncate" title={log.url}>{log.url}</p>
        <p className="text-gray-600 text-xs mt-0.5">{timeAgo}</p>
      </div>

      <div className="flex gap-1 opacity-0 group-hover:opacity-100 transition-opacity shrink-0 pt-0.5">
        <button
          onClick={onReplay}
          disabled={replaying}
          title="Replay request"
          className="p-1.5 rounded-lg bg-orange-500/20 hover:bg-orange-500/40 text-orange-400 transition-colors disabled:opacity-40"
        >
          <RotateCcw size={13} className={replaying ? 'animate-spin' : ''} />
        </button>
        <button
          onClick={onDelete}
          title="Delete"
          className="p-1.5 rounded-lg bg-red-500/20 hover:bg-red-500/40 text-red-400 transition-colors"
        >
          <Trash2 size={13} />
        </button>
      </div>
    </div>
  )
}
