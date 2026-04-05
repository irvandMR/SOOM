import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'
import { useLoadingStore } from '../store/useLoadingStore'

const api = axios.create({
  baseURL: (import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1'),
  withCredentials: true,
})

// ── Refresh Token Race Condition Fix ──────────────────────────────────────
// Jika multiple requests barengan dapat 401, hanya 1 yang refresh token.
// Yang lain diqueue dan di-retry setelah refresh selesai.
let isRefreshing = false
let failedQueue: Array<{ resolve: (token: string) => void; reject: (err: any) => void }> = []

const processQueue = (error: any, token: string | null = null) => {
  failedQueue.forEach(({ resolve, reject }) => {
    if (error) {
      reject(error)
    } else {
      resolve(token!)
    }
  })
  failedQueue = []
}

// Request interceptor
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  useLoadingStore.getState().show()
  return config
})

// Response interceptor
api.interceptors.response.use(
  (response) => {
    useLoadingStore.getState().hide()
    return response
  },
  async (error) => {
    useLoadingStore.getState().hide()
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      // Jika sudah dalam proses refresh, tambah ke queue
      if (isRefreshing) {
        return new Promise((resolve, reject) => {
          failedQueue.push({ resolve, reject })
        }).then((token) => {
          original.headers.Authorization = `Bearer ${token}`
          return api(original)
        }).catch(err => Promise.reject(err))
      }

      original._retry = true
      isRefreshing = true

      try {
        const res = await axios.post(
          `${import.meta.env.VITE_API_URL || 'http://localhost:8081/api/v1'}/auth/refresh`,
          {},
          { withCredentials: true }
        )
        const newToken = res.data.data.accessToken
        useAuthStore.getState().setAuth(
          newToken,
          useAuthStore.getState().user!
        )
        original.headers.Authorization = `Bearer ${newToken}`
        processQueue(null, newToken)
        return api(original)
      } catch (refreshError) {
        processQueue(refreshError, null)
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
        return Promise.reject(refreshError)
      } finally {
        isRefreshing = false
      }
    }
    return Promise.reject(error)
  }
)

export default api