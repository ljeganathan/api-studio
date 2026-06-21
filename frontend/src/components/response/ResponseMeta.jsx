const STATUS_COLORS = { 2: 'text-green-400 bg-green-400/10', 3: 'text-yellow-400 bg-yellow-400/10', 4: 'text-orange-400 bg-orange-400/10', 5: 'text-red-400 bg-red-400/10' }

export default function ResponseMeta({ response }) {
  const statusColor = STATUS_COLORS[Math.floor(response.status_code / 100)] || 'text-gray-400 bg-gray-400/10'

  return (
    <div className="flex items-center gap-2 px-4 py-2 bg-gray-800 text-sm">
      <span className={`font-bold px-2 py-0.5 rounded-full text-xs ${statusColor}`}>
        {response.status_code}
      </span>
      <span className="text-gray-400 px-2 py-0.5 rounded-full text-xs bg-gray-700/50">
        {response.time_ms}ms
      </span>
      <span className="text-gray-400 px-2 py-0.5 rounded-full text-xs bg-gray-700/50">
        {(response.size_bytes / 1024).toFixed(2)} KB
      </span>
    </div>
  )
}
