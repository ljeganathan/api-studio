const METHODS = ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD', 'OPTIONS']

const METHOD_COLORS = {
  GET: 'text-green-400',
  POST: 'text-orange-400',
  PUT: 'text-blue-400',
  DELETE: 'text-red-400',
  PATCH: 'text-purple-400',
  HEAD: 'text-cyan-400',
  OPTIONS: 'text-gray-400',
}

export default function MethodSelector({ method, onChange }) {
  return (
    <select
      value={method}
      onChange={e => onChange(e.target.value)}
      className={`bg-gray-800 border border-gray-700 rounded-lg px-3 py-2 text-sm font-bold outline-none cursor-pointer ${METHOD_COLORS[method] || 'text-gray-300'}`}
    >
      {METHODS.map(m => (
        <option key={m} value={m} className={`bg-gray-800 ${METHOD_COLORS[m]}`}>
          {m}
        </option>
      ))}
    </select>
  )
}
