import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'

export const CATEGORY_KEYS = {
  all: ['categories'] as const,
  lists: () => [...CATEGORY_KEYS.all, 'list'] as const,
}

export function useCategories(params: { page?: number; size?: number; search?: string; sort?: string }) {
  return useQuery({
    queryKey: [...CATEGORY_KEYS.lists(), params],
    queryFn: async () => {
      const res = await api.get('/categories', { params })
      return res.data.data
    },
  })
}

export function useDeleteCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/categories/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() })
      toast.success('Berhasil', 'Kategori berhasil dihapus')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal menghapus kategori')
    },
  })
}

export function useCreateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/categories', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() })
      toast.success('Berhasil', 'Kategori berhasil ditambahkan')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal menambahkan kategori')
    },
  })
}

export function useUpdateCategory() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/categories/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CATEGORY_KEYS.lists() })
      toast.success('Berhasil', 'Kategori berhasil diupdate')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal update kategori')
    },
  })
}
