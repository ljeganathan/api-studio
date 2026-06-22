import { useEffect } from 'react'
import { Plus, X } from 'lucide-react'

const MODES = ['none', 'raw', 'form-data', 'x-www-form-urlencoded']

const RAW_CONTENT_TYPES = [
  { label: 'JSON', value: 'application/json' },
  { label: 'Text', value: 'text/plain' },
  { label: 'JavaScript', value: 'application/javascript' },
  { label: 'HTML', value: 'text/html' },
  { label: 'XML', value: 'application/xml' },
]

function parsePairs(content) {
  if (!content) return []
  return content.split('&').filter(Boolean).map(pair => {
    const [key, value = ''] = pair.split('=')
    return { key: decodeURIComponent(key || ''), value: decodeURIComponent(value) }
  })
}

function serializePairs(pairs) {
  return pairs.map(p => `${encodeURIComponent(p.key)}=${encodeURIComponent(p.value)}`).join('&')
}

function findContentTypeHeader(headers) {
  return headers.findIndex(h => h.key?.toLowerCase() === 'content-type')
}

export default function BodyTab({ bodyType, setBodyType, bodyContent, setBodyContent, headers, setHeaders }) {
  const isFormMode = bodyType === 'form-data' || bodyType === 'x-www-form-urlencoded'
  const pairs = isFormMode ? parsePairs(bodyContent) : []

  const setContentTypeHeader = (value) => {
    const idx = findContentTypeHeader(headers)
    if (idx === -1) {
      setHeaders([...headers, { key: 'Content-Type', value, enabled: true }])
    } else {
      setHeaders(headers.map((h, i) => (i === idx ? { ...h, value, enabled: true } : h)))
    }
  }

  // Raw bodies need an explicit Content-Type or the target API often can't parse them
  // (and replies with an error body, commonly served as application/problem+json).
  useEffect(() => {
    if (bodyType === 'raw' && findContentTypeHeader(headers) === -1) {
      setContentTypeHeader('application/json')
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [bodyType])

  const rawContentType = headers[findContentTypeHeader(headers)]?.value || 'application/json'

  const updatePair = (index, field, value) => {
    const next = pairs.map((p, i) => (i === index ? { ...p, [field]: value } : p))
    setBodyContent(serializePairs(next))
  }
  const addPair = () => setBodyContent(serializePairs([...pairs, { key: '', value: '' }]))
  const removePair = (index) => setBodyContent(serializePairs(pairs.filter((_, i) => i !== index)))

  return (
    <div className="p-3">
      <div className="flex items-center justify-between mb-3">
        <div className="flex gap-1">
          {MODES.map(mode => (
            <button
              key={mode}
              onClick={() => setBodyType(mode)}
              className={`px-3 py-1 rounded-md text-xs font-medium transition-colors
                ${bodyType === mode ? 'bg-orange-500 text-white' : 'bg-gray-800 text-gray-400 hover:text-gray-200'}`}
            >
              {mode}
            </button>
          ))}
        </div>
        {bodyType === 'raw' && (
          <select
            value={rawContentType}
            onChange={e => setContentTypeHeader(e.target.value)}
            className="bg-gray-800 border border-gray-700 focus:border-orange-400 outline-none rounded-md px-2 py-1 text-xs text-gray-300"
          >
            {RAW_CONTENT_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
          </select>
        )}
      </div>

      {bodyType === 'none' && (
        <p className="text-gray-500 text-sm py-6 text-center">This request has no body</p>
      )}

      {bodyType === 'raw' && (
        <textarea
          value={bodyContent}
          onChange={e => setBodyContent(e.target.value)}
          placeholder={'{\n  "key": "value"\n}'}
          className="w-full h-48 bg-gray-950 border border-gray-700 focus:border-orange-400 outline-none rounded-lg p-3 font-mono text-sm text-green-300 resize-none"
        />
      )}

      {isFormMode && (
        <div>
          <div className="space-y-2">
            {pairs.map((p, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  type="text"
                  placeholder="Key"
                  value={p.key}
                  onChange={e => updatePair(i, 'key', e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 focus:border-orange-400 outline-none rounded-md px-2 py-1.5 text-sm text-gray-200"
                />
                <input
                  type="text"
                  placeholder="Value"
                  value={p.value}
                  onChange={e => updatePair(i, 'value', e.target.value)}
                  className="flex-1 bg-gray-800 border border-gray-700 focus:border-orange-400 outline-none rounded-md px-2 py-1.5 text-sm text-gray-200"
                />
                <button onClick={() => removePair(i)} className="text-gray-500 hover:text-red-400 shrink-0">
                  <X size={15} />
                </button>
              </div>
            ))}
          </div>
          <button
            onClick={addPair}
            className="mt-3 flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium"
          >
            <Plus size={13} /> Add Field
          </button>
        </div>
      )}
    </div>
  )
}
