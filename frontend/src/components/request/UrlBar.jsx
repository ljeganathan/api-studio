import { Loader2, Send } from 'lucide-react'

export default function UrlBar({ url, onChange, onSend, loading }) {
  return (
    <div className="flex-1 flex items-center gap-2">
      <input
        type="text"
        value={url}
        onChange={e => onChange(e.target.value)}
        onKeyDown={e => { if (e.key === 'Enter') onSend() }}
        placeholder="https://api.example.com/endpoint"
        className="flex-1 bg-gray-800 border border-gray-700 focus:border-orange-400 outline-none rounded-lg px-3 py-2 text-sm text-gray-200 placeholder-gray-500"
      />
      <button
        onClick={onSend}
        disabled={loading || !url}
        className="flex items-center gap-2 px-4 py-2 rounded-lg bg-orange-500 hover:bg-orange-400 text-white font-semibold text-sm disabled:opacity-50 shrink-0"
      >
        {loading ? <Loader2 size={15} className="animate-spin" /> : <Send size={15} />}
        Send
      </button>
    </div>
  )
}
