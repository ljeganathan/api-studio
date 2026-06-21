import { useState, useRef } from 'react'
import toast from 'react-hot-toast'
import client from '../../api/client'
import { Upload, FileJson, X, CheckCircle } from 'lucide-react'

export default function ImportModal({ onClose, onImported }) {
  const [tab, setTab] = useState('file')
  const [dragging, setDragging] = useState(false)
  const [jsonText, setJsonText] = useState('')
  const [preview, setPreview] = useState(null)
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState(null)
  const fileRef = useRef()

  const parsePreview = (json) => {
    try {
      const parsed = JSON.parse(json)
      if (!parsed.info || !parsed.item) throw new Error()
      setPreview({
        name: parsed.info.name,
        requests: parsed.item.reduce((acc, i) => acc + (i.item ? i.item.length : 1), 0),
        folders: parsed.item.filter(i => i.item).length,
        raw: parsed
      })
    } catch {
      toast.error('Not a valid Postman v2.1 JSON')
      setPreview(null)
    }
  }

  const handleFile = async (file) => {
    const text = await file.text()
    setJsonText(text)
    parsePreview(text)
  }

  const handleDrop = (e) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFile(file)
  }

  const doImport = async () => {
    if (!preview) return
    setLoading(true)
    try {
      const { data } = await client.post('/collections/import/json', preview.raw)
      setResult(data)
      onImported()
      toast.success(`Imported "${data.collection_name}" with ${data.requests_created} requests`)
    } catch {
      toast.error('Import failed')
    }
    setLoading(false)
  }

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-2xl w-full max-w-lg shadow-2xl p-6 relative">
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white">
          <X size={20} />
        </button>
        <h2 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
          <FileJson className="text-orange-400" size={22} /> Import Postman Collection
        </h2>

        <div className="flex gap-2 mb-4">
          {['file', 'paste'].map(t => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors
                ${tab === t ? 'bg-orange-500 text-white' : 'bg-gray-700 text-gray-300 hover:bg-gray-600'}`}
            >
              {t === 'file' ? 'Upload File' : 'Paste JSON'}
            </button>
          ))}
        </div>

        {tab === 'file' ? (
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={handleDrop}
            onClick={() => fileRef.current.click()}
            className={`border-2 border-dashed rounded-xl p-10 flex flex-col items-center gap-3 cursor-pointer transition-colors
              ${dragging ? 'border-orange-400 bg-orange-400/10' : 'border-gray-600 hover:border-gray-400'}`}
          >
            <Upload size={36} className="text-gray-400" />
            <p className="text-gray-300 text-sm">Drop your <span className="text-orange-400 font-semibold">.json</span> file here or click to browse</p>
            <p className="text-gray-500 text-xs">Postman Collection v2.1 format</p>
            <input
              ref={fileRef}
              type="file"
              accept=".json"
              className="hidden"
              onChange={e => e.target.files[0] && handleFile(e.target.files[0])}
            />
          </div>
        ) : (
          <textarea
            className="w-full h-40 bg-gray-900 text-green-300 font-mono text-xs rounded-xl p-3 border border-gray-600 focus:border-orange-400 outline-none resize-none"
            placeholder="Paste Postman v2.1 JSON here..."
            value={jsonText}
            onChange={e => { setJsonText(e.target.value); if (e.target.value.trim()) parsePreview(e.target.value) }}
          />
        )}

        {preview && !result && (
          <div className="mt-4 bg-gray-700 rounded-xl p-4 text-sm">
            <p className="text-white font-semibold text-base mb-1">{preview.name}</p>
            <div className="flex gap-6 text-gray-300">
              <span>{preview.folders} folders</span>
              <span>{preview.requests} requests</span>
            </div>
          </div>
        )}

        {result && (
          <div className="mt-4 bg-green-900/40 border border-green-500 rounded-xl p-4 flex items-center gap-3">
            <CheckCircle className="text-green-400" size={20} />
            <div>
              <p className="text-green-300 font-semibold">Import successful!</p>
              <p className="text-green-400 text-xs">{result.requests_created} requests in "{result.collection_name}"</p>
            </div>
          </div>
        )}

        <div className="flex gap-3 mt-5">
          <button onClick={onClose} className="flex-1 py-2 rounded-lg bg-gray-700 text-gray-300 hover:bg-gray-600 text-sm">Cancel</button>
          {!result && (
            <button
              onClick={doImport}
              disabled={!preview || loading}
              className="flex-1 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm disabled:opacity-40"
            >
              {loading ? 'Importing...' : 'Import Collection'}
            </button>
          )}
        </div>
      </div>
    </div>
  )
}
