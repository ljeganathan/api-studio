import { Search } from 'lucide-react'

const METHODS = ['', 'GET', 'POST', 'PUT', 'DELETE', 'PATCH']
const METHOD_COLORS = { GET: '#22c55e', POST: '#f97316', PUT: '#3b82f6', DELETE: '#ef4444', PATCH: '#a855f7' }

export default function HistoryFilter({ filters, onChange }) {
  return (
    <div className="px-3 py-2 border-b border-gray-700 space-y-2">
      <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-1.5">
        <Search size={13} className="text-gray-500" />
        <input
          className="bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none flex-1"
          placeholder="Search URL..."
          value={filters.search}
          onChange={e => onChange(f => ({ ...f, search: e.target.value }))}
        />
      </div>
      <div className="flex gap-1 flex-wrap">
        {METHODS.map(m => (
          <button
            key={m}
            onClick={() => onChange(f => ({ ...f, method: m }))}
            style={filters.method === m && m ? { color: METHOD_COLORS[m], borderColor: METHOD_COLORS[m] } : {}}
            className={`px-2 py-0.5 rounded text-xs border transition-colors
              ${filters.method === m
                ? m ? 'border-current bg-current/10' : 'border-orange-400 text-orange-400 bg-orange-400/10'
                : 'border-gray-700 text-gray-500 hover:border-gray-500'}`}
          >
            {m || 'All'}
          </button>
        ))}
      </div>
    </div>
  )
}
