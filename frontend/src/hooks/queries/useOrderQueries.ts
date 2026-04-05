import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'

export const ORDER_KEYS = {
  all: ['orders'] as const,
  lists: () => [...ORDER_KEYS.all, 'list'] as const,
  detail: (id: string) => [...ORDER_KEYS.all, 'detail', id] as const,
}

export function useOrders(params: { page?: number; size?: number; search?: string; sort?: string; status?: string; paymentStatus?: string }) {
  return useQuery({
    queryKey: [...ORDER_KEYS.lists(), params],
    queryFn: async () => {
      const res = await api.get('/orders', { params })
      return res.data.data
    },
  })
}

export function useOrderDetail(id: string | null) {
  return useQuery({
    queryKey: ORDER_KEYS.detail(id!),
    queryFn: async () => {
      const res = await api.get(`/orders/${id}`)
      return res.data.data
    },
    enabled: !!id,
  })
}

export function useCreateOrder() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/orders', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() })
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal membuat order')
    },
  })
}

export function useUpdateOrderStatus() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.put(`/orders/${id}/status`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(variables.id) })
      toast.success('Berhasil', 'Status order berhasil diubah')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal update status')
    },
  })
}

export function useAddPayment() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: any }) =>
      api.post(`/orders/${id}/payments`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.lists() })
      queryClient.invalidateQueries({ queryKey: ORDER_KEYS.detail(variables.id) })
      toast.success('Berhasil', 'Pembayaran berhasil ditambahkan')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal menambah pembayaran')
    },
  })
}
