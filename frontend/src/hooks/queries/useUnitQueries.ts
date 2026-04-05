import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'

export const UNIT_KEYS = {
  all: ['units'] as const,
  lists: () => [...UNIT_KEYS.all, 'list'] as const,
}

export function useUnits(params?: { page?: number; size?: number; search?: string; sort?: string }) {
  return useQuery({
    queryKey: [...UNIT_KEYS.lists(), params],
    queryFn: async () => {
      const res = await api.get('/units', { params })
      return res.data.data
    },
  })
}

export function useDeleteUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/units/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNIT_KEYS.lists() })
      toast.success('Berhasil', 'Unit berhasil dihapus')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal menghapus unit')
    },
  })
}

export function useCreateUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/units', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNIT_KEYS.lists() })
      toast.success('Berhasil', 'Unit berhasil ditambahkan')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal menambahkan unit')
    },
  })
}

export function useUpdateUnit() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/units/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: UNIT_KEYS.lists() })
      toast.success('Berhasil', 'Unit berhasil diupdate')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal update unit')
    },
  })
}
