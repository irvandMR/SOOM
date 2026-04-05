import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'

export const INGREDIENT_KEYS = {
  all: ['ingredients'] as const,
  lists: () => [...INGREDIENT_KEYS.all, 'list'] as const,
  detail: (id: string) => [...INGREDIENT_KEYS.all, 'detail', id] as const,
  history: (id: string) => [...INGREDIENT_KEYS.all, 'history', id] as const,
}

// ── QUERIES ──────────────────────────────────────────────────────────────────

export function useIngredients(params: { page?: number; size?: number; search?: string; sort?: string }) {
  return useQuery({
    queryKey: [...INGREDIENT_KEYS.lists(), params],
    queryFn: async () => {
      const res = await api.get('/ingredients', { params })
      return res.data.data
    },
  })
}

export function useIngredientHistory(id: string | null) {
  return useQuery({
    queryKey: INGREDIENT_KEYS.history(id!),
    queryFn: async () => {
      const res = await api.get(`/ingredients/${id}/history`)
      return res.data.data
    },
    enabled: !!id,
  })
}

// ── MUTATIONS ────────────────────────────────────────────────────────────────

export function useDeleteIngredient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/ingredients/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGREDIENT_KEYS.lists() })
      toast.success('Berhasil', 'Bahan baku berhasil dihapus')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal menghapus')
    },
  })
}

export function useStockIn() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.post(`/ingredients/${id}/stock-in`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGREDIENT_KEYS.lists() })
      toast.success('Berhasil', 'Stok berhasil ditambahkan')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal menambah stok')
    },
  })
}

export function useCreateIngredient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/ingredients', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGREDIENT_KEYS.lists() })
      toast.success('Berhasil', 'Bahan baku berhasil ditambahkan')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal menambahkan')
    },
  })
}

export function useUpdateIngredient() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/ingredients/${id}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: INGREDIENT_KEYS.lists() })
      toast.success('Berhasil', 'Bahan baku berhasil diupdate')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal update')
    },
  })
}
