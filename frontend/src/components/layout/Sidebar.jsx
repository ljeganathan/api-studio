import { useState } from 'react'
import { Search } from 'lucide-react'
import CollectionTree from '../sidebar/CollectionTree'

export default function Sidebar({ collections, onCollectionsChange, onSelectRequest, onImport, onExport }) {
  const [search, setSearch] = useState('')

  return (
    <aside className="w-[280px] shrink-0 h-full flex flex-col bg-gray-850 border-r border-gray-700 min-h-0">
      <div className="p-3 border-b border-gray-700">
        <div className="flex items-center gap-2 bg-gray-900 rounded-lg px-3 py-1.5">
          <Search size={13} className="text-gray-500" />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            placeholder="Search collections..."
            className="bg-transparent text-sm text-gray-300 placeholder-gray-600 outline-none flex-1"
          />
        </div>
      </div>
      <div className="flex-1 overflow-y-auto min-h-0">
        <CollectionTree
          collections={collections}
          onCollectionsChange={onCollectionsChange}
          onSelectRequest={onSelectRequest}
          onImport={onImport}
          onExport={onExport}
          searchTerm={search}
        />
      </div>
    </aside>
  )
}
