import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query'
import api from '../../services/api'
import { toast } from '../../store/useToastStore'

export const CASHFLOW_KEYS = {
  all: ['cashflows'] as const,
  lists: () => [...CASHFLOW_KEYS.all, 'list'] as const,
  summary: () => [...CASHFLOW_KEYS.all, 'summary'] as const,
  monthly: (year: number) => [...CASHFLOW_KEYS.all, 'monthly', year] as const,
  profitLoss: (year: number, month: number) => [...CASHFLOW_KEYS.all, 'profit-loss', year, month] as const,
}

export function useProfitLoss(year: number, month: number) {
  return useQuery({
    queryKey: CASHFLOW_KEYS.profitLoss(year, month),
    queryFn: async () => {
      const res = await api.get(`/reports/profit-loss?year=${year}&month=${month}`)
      return res.data
    },
  })
}

export function useCashFlows(params: { page?: number; size?: number; search?: string; sort?: string }) {
  return useQuery({
    queryKey: [...CASHFLOW_KEYS.lists(), params],
    queryFn: async () => {
      const res = await api.get('/cash-flows', { params })
      return res.data.data
    },
  })
}

export function useCashFlowSummary() {
  return useQuery({
    queryKey: CASHFLOW_KEYS.summary(),
    queryFn: async () => {
      const res = await api.get('/cash-flows/summary')
      return res.data.data
    },
  })
}

export function useMonthlyCashFlow(year: number) {
  return useQuery({
    queryKey: CASHFLOW_KEYS.monthly(year),
    queryFn: async () => {
      const res = await api.get(`/cash-flows/monthly?year=${year}`)
      return res.data.data
    },
  })
}

export function useCreateManualCashFlow() {
  const queryClient = useQueryClient()
  return useMutation({
    mutationFn: (data: any) => api.post('/cash-flows', data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: CASHFLOW_KEYS.all })
      toast.success('Berhasil', 'Transaksi berhasil dicatat')
    },
    onError: (err: any) => {
      toast.error('Gagal', err.response?.data?.message ?? 'Gagal mencatat transaksi')
    },
  })
}

export function useDownloadMonthlyReport() {
  return useMutation({
    mutationFn: async ({ year, month }: { year: number; month: number }) => {
      const res = await api.get(`/reports/monthly-excel?year=${year}&month=${month}`, {
        responseType: 'blob',
      })
      return { data: res.data, year, month }
    },
    onSuccess: ({ data, year, month }) => {
      const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']
      const url = window.URL.createObjectURL(new Blob([data]))
      const link = document.createElement('a')
      link.href = url
      link.setAttribute('download', `Laporan_Bulanan_${monthNames[month - 1]}_${year}.xlsx`)
      document.body.appendChild(link)
      link.click()
      link.remove()
      window.URL.revokeObjectURL(url)
      toast.success('Berhasil', 'File Excel berhasil didownload')
    },
    onError: () => {
      toast.error('Gagal', 'Gagal mendownload laporan Excel')
    },
  })
}
