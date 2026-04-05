import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'

export const USER_KEYS = {
  all: ['users'] as const,
  lists: () => [...USER_KEYS.all, 'list'] as const,
}

export function useUsers(params?: { page?: number; size?: number; search?: string; sort?: string }) {
  return useQuery({
    queryKey: [...USER_KEYS.lists(), params],
    queryFn: async () => {
      const res = await api.get('/users', { params })
      return res.data.data
    },
  })
}

export function useDeleteUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/users/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() })
      toast.success('Berhasil', 'User berhasil dihapus')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal menghapus user')
    },
  })
}

export function useCreateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/users', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() })
      toast.success('Berhasil', 'User berhasil ditambahkan')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal menambahkan user')
    },
  })
}

export function useUpdateUser() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/users/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: USER_KEYS.lists() })
      toast.success('Berhasil', 'User berhasil diupdate')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal update user')
    },
  })
}
