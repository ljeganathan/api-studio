import { create } from 'zustand'

export const useCollectionStore = create((set) => ({
  collections: [],
  activeRequestId: null,
  setCollections: (collections) => set({ collections }),
  setActiveRequest: (id) => set({ activeRequestId: id }),
  addCollection: (col) => set(s => ({ collections: [...s.collections, col] })),
  removeCollection: (id) => set(s => ({ collections: s.collections.filter(c => c.id !== id) })),
}))
