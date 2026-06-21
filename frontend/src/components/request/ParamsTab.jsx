import { Plus, X } from 'lucide-react'

export default function ParamsTab({ params, setParams }) {
  const update = (index, field, value) => {
    setParams(params.map((p, i) => (i === index ? { ...p, [field]: value } : p)))
  }

  const addRow = () => setParams([...params, { key: '', value: '', enabled: true }])
  const removeRow = (index) => setParams(params.filter((_, i) => i !== index))

  return (
    <div className="p-3">
      <div className="space-y-2">
        {params.map((p, i) => (
          <div key={i} className="flex items-center gap-2">
            <input
              type="checkbox"
              checked={p.enabled !== false}
              onChange={e => update(i, 'enabled', e.target.checked)}
              className="accent-orange-500"
            />
            <input
              type="text"
              placeholder="Key"
              value={p.key}
              onChange={e => update(i, 'key', e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 focus:border-orange-400 outline-none rounded-md px-2 py-1.5 text-sm text-gray-200"
            />
            <input
              type="text"
              placeholder="Value"
              value={p.value}
              onChange={e => update(i, 'value', e.target.value)}
              className="flex-1 bg-gray-800 border border-gray-700 focus:border-orange-400 outline-none rounded-md px-2 py-1.5 text-sm text-gray-200"
            />
            <button onClick={() => removeRow(i)} className="text-gray-500 hover:text-red-400 shrink-0">
              <X size={15} />
            </button>
          </div>
        ))}
      </div>
      <button
        onClick={addRow}
        className="mt-3 flex items-center gap-1.5 text-xs text-orange-400 hover:text-orange-300 font-medium"
      >
        <Plus size={13} /> Add Param
      </button>
    </div>
  )
}
