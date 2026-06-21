import { useEffect, useState } from 'react'
import { useHistory } from '../../hooks/useHistory'
import HistoryItem from './HistoryItem'
import HistoryFilter from './HistoryFilter'
import { History, Trash2, X } from 'lucide-react'
import toast from 'react-hot-toast'

export default function HistoryPanel({ onReplayResponse, onClose }) {
  const { items, total, loading, fetch, replay, remove, clearAll } = useHistory()
  const [filters, setFilters] = useState({ method: '', search: '' })
  const [replayingId, setReplayingId] = useState(null)

  useEffect(() => { fetch(filters) }, [filters])

  const handleReplay = async (log) => {
    setReplayingId(log.id)
    try {
      const response = await replay(log.id)
      onReplayResponse({ request: log, response })
      toast.success(`Replayed ${log.method} — ${response.status_code}`)
    } catch {
      toast.error('Replay failed')
    }
    setReplayingId(null)
  }

  const handleClear = async () => {
    if (!confirm('Clear all history?')) return
    await clearAll()
    toast.success('History cleared')
  }

  return (
    <div className="flex flex-col h-full bg-gray-850 border-l border-gray-700">
      <div className="flex items-center justify-between px-4 py-3 border-b border-gray-700 bg-gray-800">
        <div className="flex items-center gap-2 text-white font-semibold">
          <History size={18} className="text-orange-400" />
          History
          <span className="text-xs bg-gray-700 text-gray-300 px-2 py-0.5 rounded-full">{total}</span>
        </div>
        <div className="flex gap-2">
          <button onClick={handleClear} title="Clear all" className="text-gray-400 hover:text-red-400 transition-colors">
            <Trash2 size={16} />
          </button>
          <button onClick={onClose} className="text-gray-400 hover:text-white transition-colors">
            <X size={16} />
          </button>
        </div>
      </div>

      <HistoryFilter filters={filters} onChange={setFilters} />

      <div className="flex-1 overflow-y-auto divide-y divide-gray-700/50">
        {loading && <p className="text-center text-gray-500 py-8 text-sm animate-pulse">Loading...</p>}
        {!loading && items.length === 0 && (
          <div className="flex flex-col items-center justify-center h-full text-gray-500 gap-2">
            <History size={32} />
            <p className="text-sm">No history yet</p>
          </div>
        )}
        {items.map(item => (
          <HistoryItem
            key={item.id}
            log={item}
            replaying={replayingId === item.id}
            onReplay={() => handleReplay(item)}
            onDelete={() => remove(item.id)}
          />
        ))}
      </div>
    </div>
  )
}
