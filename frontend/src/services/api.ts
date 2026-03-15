import axios from 'axios'
import { useAuthStore } from '../store/useAuthStore'

const api = axios.create({
  baseURL: 'http://localhost:8081/api/v1',
  withCredentials: true,
})

// Request interceptor — tambah token di setiap request
api.interceptors.request.use((config) => {
  const token = useAuthStore.getState().accessToken
  if (token) {
    config.headers.Authorization = `Bearer ${token}`
  }
  return config
})

// Response interceptor — handle 401 otomatis refresh token
api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const original = error.config

    if (error.response?.status === 401 && !original._retry) {
      original._retry = true

      try {
        const res = await axios.post(
          'http://localhost:8081/api/v1/auth/refresh',
          {},
          { withCredentials: true }
        )
        const newToken = res.data.data.accessToken
        useAuthStore.getState().setAuth(
          newToken,
          useAuthStore.getState().user!
        )
        original.headers.Authorization = `Bearer ${newToken}`
        return api(original)
      } catch {
        useAuthStore.getState().clearAuth()
        window.location.href = '/login'
      }
    }
    return Promise.reject(error)
  }
)

export default api