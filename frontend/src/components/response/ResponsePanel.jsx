import { useState } from 'react'
import { Inbox } from 'lucide-react'
import ResponseMeta from './ResponseMeta'
import ResponseBody from './ResponseBody'

export default function ResponsePanel({ response, loading }) {
  const [activeTab, setActiveTab] = useState('body')

  if (loading) {
    return (
      <div className="flex-1 flex items-center justify-center text-gray-400 animate-pulse">
        Sending request...
      </div>
    )
  }

  if (!response) {
    return (
      <div className="flex-1 flex flex-col items-center justify-center text-gray-500 gap-3">
        <Inbox size={40} />
        <p className="text-lg">Send a request to see the response</p>
      </div>
    )
  }

  return (
    <div className="flex-1 flex flex-col border-t border-gray-700 min-h-0">
      <div className="flex items-center justify-between bg-gray-800">
        <ResponseMeta response={response} />
        <div className="flex gap-2 px-4">
          {['body', 'headers'].map(t => (
            <button
              key={t}
              onClick={() => setActiveTab(t)}
              className={`px-3 py-1 rounded text-xs ${activeTab === t ? 'bg-orange-500 text-white' : 'text-gray-400 hover:text-white'}`}
            >
              {t.charAt(0).toUpperCase() + t.slice(1)}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-auto bg-gray-950 min-h-0">
        {activeTab === 'body' ? (
          <ResponseBody body={response.body} />
        ) : (
          <table className="text-xs w-full p-4">
            <tbody>
              {Object.entries(response.headers || {}).map(([k, v]) => (
                <tr key={k} className="border-b border-gray-800">
                  <td className="py-1 pr-4 px-4 text-orange-300 font-semibold">{k}</td>
                  <td className="py-1 text-gray-300 break-all">{v}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
