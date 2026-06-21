import { useState, useCallback } from 'react'
import client from '../api/client'

export function useHistory() {
  const [items, setItems] = useState([])
  const [total, setTotal] = useState(0)
  const [loading, setLoading] = useState(false)

  const fetch = useCallback(async ({ limit = 50, offset = 0, method = '', search = '' } = {}) => {
    setLoading(true)
    const params = { limit, offset }
    if (method) params.method = method
    if (search) params.search = search
    try {
      const { data } = await client.get('/history/', { params })
      setItems(data.items)
      setTotal(data.total)
    } finally {
      setLoading(false)
    }
  }, [])

  const replay = useCallback(async (logId) => {
    const { data } = await client.post(`/history/${logId}/replay`)
    return data
  }, [])

  const remove = useCallback(async (logId) => {
    await client.delete(`/history/${logId}`)
    setItems(prev => prev.filter(i => i.id !== logId))
  }, [])

  const clearAll = useCallback(async () => {
    await client.delete('/history/')
    setItems([])
    setTotal(0)
  }, [])

  return { items, total, loading, fetch, replay, remove, clearAll }
}
