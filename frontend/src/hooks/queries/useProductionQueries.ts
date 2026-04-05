import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'

export const PRODUCTION_KEYS = {
  all: ['productions'] as const,
  lists: () => [...PRODUCTION_KEYS.all, 'list'] as const,
  detail: (id: string) => [...PRODUCTION_KEYS.all, 'detail', id] as const,
  available: (productId: string) => [...PRODUCTION_KEYS.all, 'available', productId] as const,
}

export function useProductions(params: { page?: number; size?: number; search?: string; sort?: string }, enabled: boolean = true) {
  return useQuery({
    queryKey: [...PRODUCTION_KEYS.lists(), params],
    queryFn: async () => {
      const res = await api.get('/productions', { params })
      return res.data.data
    },
    enabled: enabled,
  })
}

export function useProductionDetail(id: string | null) {
  return useQuery({
    queryKey: PRODUCTION_KEYS.detail(id!),
    queryFn: async () => {
      const res = await api.get(`/productions/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useAvailableProductions(productId: string | null) {
  return useQuery({
    queryKey: PRODUCTION_KEYS.available(productId!),
    queryFn: async () => {
      const res = await api.get(`/productions/available?productId=${productId}`)
      return res.data.data
    },
    enabled: !!productId,
  })
}

export function useCreateProduction() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/productions', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCTION_KEYS.lists() })
      toast.success('Berhasil', 'Produksi berhasil dicatat')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal mencatat produksi')
    },
  })
}
