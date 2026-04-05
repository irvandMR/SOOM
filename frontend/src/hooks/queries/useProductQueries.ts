import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'

export const PRODUCT_KEYS = {
  all: ['products'] as const,
  lists: () => [...PRODUCT_KEYS.all, 'list'] as const,
  detail: (id: string) => [...PRODUCT_KEYS.all, 'detail', id] as const,
  recipes: (id: string) => [...PRODUCT_KEYS.all, 'recipes', id] as const,
}

export function useProducts(params: { page?: number; size?: number; search?: string; sort?: string }) {
  return useQuery({
    queryKey: [...PRODUCT_KEYS.lists(), params],
    queryFn: async () => {
      const res = await api.get('/products', { params })
      return res.data.data
    },
  })
}

export function useProductRecipes(productId: string | null) {
  return useQuery({
    queryKey: PRODUCT_KEYS.recipes(productId!),
    queryFn: async () => {
      const res = await api.get(`/products/${productId}/recipes`)
      return res.data.data
    },
    enabled: !!productId,
  })
}

export function useDeleteProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (id: string) => api.delete(`/products/${id}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() })
      toast.success('Berhasil', 'Produk berhasil dihapus')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal menghapus produk')
    },
  })
}

export function useCreateProduct() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/products', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() })
      toast.success('Berhasil', 'Produk berhasil ditambahkan')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal menambahkan produk')
    },
  })
}

export function useSaveRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, data }: { productId: string; data: any }) =>
      api.post(`/products/${productId}/recipes`, data),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.recipes(variables.productId) })
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() })
      toast.success('Berhasil', 'Resep berhasil disimpan')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal menyimpan resep')
    },
  })
}

export function useActivateRecipe() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: ({ productId, recipeId }: { productId: string; recipeId: string }) =>
      api.put(`/products/${productId}/recipes/${recipeId}/activate`),
    onSuccess: (_data, variables) => {
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.recipes(variables.productId) })
      queryClient.invalidateQueries({ queryKey: PRODUCT_KEYS.lists() })
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal mengaktifkan resep')
    },
  })
}
