import { create } from 'zustand'

interface ToastMessage {
  severity: 'success' | 'error' | 'warn' | 'info'
  summary: string
  detail?: string
}

interface ToastStore {
  message: ToastMessage | null
  show: (msg: ToastMessage) => void
  clear: () => void
}

export const useToastStore = create<ToastStore>((set) => ({
  message: null,
  show: (msg) => set({ message: msg }),
  clear: () => set({ message: null }),
}))

// Helper functions
export const toast = {
  success: (summary: string, detail?: string) =>
    useToastStore.getState().show({ severity: 'success', summary, detail }),
  error: (summary: string, detail?: string) =>
    useToastStore.getState().show({ severity: 'error', summary, detail }),
  warn: (summary: string, detail?: string) =>
    useToastStore.getState().show({ severity: 'warn', summary, detail }),
  info: (summary: string, detail?: string) =>
    useToastStore.getState().show({ severity: 'info', summary, detail }),
}