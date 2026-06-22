import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
import { Loader2, Save } from 'lucide-react'
import MethodSelector from './MethodSelector'
import UrlBar from './UrlBar'
import TabsPanel from './TabsPanel'
import ResponsePanel from '../response/ResponsePanel'
import client from '../../api/client'
import { useRequestStore } from '../../store/requestStore'

export default function RequestPanel({ request, prefillResponse }) {
  const {
    method, url, headers, params, bodyType, bodyContent,
    setMethod, setUrl, setHeaders, setParams, setBodyType, setBodyContent, loadRequest,
  } = useRequestStore()

  const [authType, setAuthType] = useState(request?.auth_type || 'none')
  const [authData, setAuthData] = useState(request?.auth_data || {})
  const [response, setResponse] = useState(prefillResponse || null)
  const [loading, setLoading] = useState(false)
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    loadRequest(request)
    setAuthType(request?.auth_type || 'none')
    setAuthData(request?.auth_data || {})
    setResponse(prefillResponse || null)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [request?.id])

  const buildEffectiveHeaders = () => {
    const list = [...headers]
    if (authType === 'bearer' && authData.token) {
      list.push({ key: 'Authorization', value: `Bearer ${authData.token}`, enabled: true })
    } else if (authType === 'basic' && authData.username) {
      const encoded = btoa(`${authData.username}:${authData.password || ''}`)
      list.push({ key: 'Authorization', value: `Basic ${encoded}`, enabled: true })
    }
    return list
  }

  const sendRequest = async () => {
    if (!url) return
    setLoading(true)
    try {
      const { data } = await client.post('/proxy/send', {
        request_id: request?.id,
        method,
        url,
        headers: buildEffectiveHeaders(),
        params,
        body: bodyContent,
        body_type: bodyType,
      })
      if (data.error) {
        toast.error(data.error)
      } else {
        setResponse(data)
      }
    } catch {
      toast.error('Request failed')
    }
    setLoading(false)
  }

  const saveRequest = async () => {
    if (!request?.id) return
    setSaving(true)
    try {
      await client.put(`/requests/${request.id}`, {
        method, url, headers, params,
        body_type: bodyType, body_content: bodyContent,
        auth_type: authType, auth_data: authData,
      })
      toast.success('Request saved')
    } catch {
      toast.error('Failed to save request')
    }
    setSaving(false)
  }

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="flex items-center gap-2 p-3 border-b border-gray-700">
        <MethodSelector method={method} onChange={setMethod} />
        <UrlBar url={url} onChange={setUrl} onSend={sendRequest} loading={loading} />
        <button
          onClick={saveRequest}
          disabled={saving || !request?.id}
          title="Save request"
          className="flex items-center gap-2 px-4 py-2 rounded-lg bg-gray-700 hover:bg-gray-600 text-gray-200 font-semibold text-sm disabled:opacity-50 shrink-0"
        >
          {saving ? <Loader2 size={15} className="animate-spin" /> : <Save size={15} />}
          Save
        </button>
      </div>
      <TabsPanel
        params={params} setParams={setParams}
        headers={headers} setHeaders={setHeaders}
        bodyType={bodyType} setBodyType={setBodyType} bodyContent={bodyContent} setBodyContent={setBodyContent}
        authType={authType} setAuthType={setAuthType} authData={authData} setAuthData={setAuthData}
      />
      <ResponsePanel response={response} loading={loading} />
    </div>
  )
}
