import { create } from 'zustand'

interface LoadingStore {
  isLoading: boolean
  show: () => void
  hide: () => void
}

export const useLoadingStore = create<LoadingStore>((set) => ({
  isLoading: false,
  show: () => set({ isLoading: true }),
  hide: () => set({ isLoading: false }),
}))