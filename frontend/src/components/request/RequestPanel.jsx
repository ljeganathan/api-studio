import { useEffect, useState } from 'react'
import toast from 'react-hot-toast'
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

  return (
    <div className="flex flex-col h-full bg-gray-900 text-white">
      <div className="flex items-center gap-2 p-3 border-b border-gray-700">
        <MethodSelector method={method} onChange={setMethod} />
        <UrlBar url={url} onChange={setUrl} onSend={sendRequest} loading={loading} />
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
