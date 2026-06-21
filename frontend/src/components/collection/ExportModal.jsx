import { useState } from 'react'
import toast from 'react-hot-toast'
import client from '../../api/client'
import { Download, X, FileJson } from 'lucide-react'

export default function ExportModal({ collection, onClose }) {
  const [loading, setLoading] = useState(false)
  const [preview, setPreview] = useState(null)

  const fetchPreview = async () => {
    const { data } = await client.get(`/collections/${collection.id}/export`)
    setPreview(JSON.stringify(data, null, 2))
  }

  const download = async () => {
    setLoading(true)
    try {
      const { data } = await client.get(`/collections/${collection.id}/export`)
      const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' })
      const url = URL.createObjectURL(blob)
      const a = document.createElement('a')
      a.href = url
      a.download = `${collection.name.replace(/ /g, '_')}.postman_collection.json`
      a.click()
      URL.revokeObjectURL(url)
      toast.success('Collection exported!')
      onClose()
    } catch {
      toast.error('Export failed')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl w-full max-w-2xl shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white"><X size={20} /></button>
        <h2 className="text-xl font-bold text-white mb-1 flex items-center gap-2">
          <FileJson className="text-orange-400" size={22} /> Export as Postman Collection
        </h2>
        <p className="text-gray-400 text-sm mb-4">"{collection.name}" will be exported in Postman v2.1 format</p>

        {!preview ? (
          <button onClick={fetchPreview} className="w-full py-2 bg-gray-700 hover:bg-gray-600 rounded-lg text-sm text-gray-300 mb-4">
            Preview JSON
          </button>
        ) : (
          <pre className="bg-gray-950 text-green-300 text-xs font-mono rounded-xl p-4 max-h-72 overflow-auto mb-4">
            {preview}
          </pre>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm">Cancel</button>
          <button
            onClick={download}
            disabled={loading}
            className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm flex items-center justify-center gap-2 disabled:opacity-40"
          >
            <Download size={16} /> {loading ? 'Exporting...' : 'Download JSON'}
          </button>
        </div>
      </div>
    </div>
  )
}
