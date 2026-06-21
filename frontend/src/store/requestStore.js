import { create } from 'zustand'

export const useRequestStore = create((set) => ({
  method: 'GET',
  url: '',
  headers: [],
  params: [],
  bodyType: 'none',
  bodyContent: '',

  setMethod: (method) => set({ method }),
  setUrl: (url) => set({ url }),
  setHeaders: (headers) => set({ headers }),
  setParams: (params) => set({ params }),
  setBodyType: (bodyType) => set({ bodyType }),
  setBodyContent: (bodyContent) => set({ bodyContent }),

  loadRequest: (req) => set({
    method: req?.method || 'GET',
    url: req?.url || '',
    headers: req?.headers || [],
    params: req?.params || [],
    bodyType: req?.body_type || 'none',
    bodyContent: req?.body_content || '',
  }),

  reset: () => set({
    method: 'GET', url: '', headers: [], params: [], bodyType: 'none', bodyContent: '',
  }),
}))
