import { useQuery } from '@tanstack/react-query'
import api from '../../services/api'

export const DASHBOARD_KEYS = {
  all: ['dashboard'] as const,
  summary: () => [...DASHBOARD_KEYS.all, 'summary'] as const,
  recentOrders: () => [...DASHBOARD_KEYS.all, 'recent-orders'] as const,
  stockAlerts: () => [...DASHBOARD_KEYS.all, 'stock-alerts'] as const,
  chartData: () => [...DASHBOARD_KEYS.all, 'chart-data'] as const,
}

export function useDashboardSummary() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.summary(),
    queryFn: async () => {
      const res = await api.get('/dashboard/summary')
      return res.data.data
    },
    staleTime: 2 * 60 * 1000, // 2 menit - dashboard summary tidak perlu terlalu fresh
  })
}

export function useRecentOrders() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.recentOrders(),
    queryFn: async () => {
      const res = await api.get('/dashboard/recent-orders')
      return res.data.data
    },
    staleTime: 2 * 60 * 1000,
  })
}

export function useStockAlerts() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.stockAlerts(),
    queryFn: async () => {
      const res = await api.get('/dashboard/stock-alerts')
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}

export function useChartData() {
  return useQuery({
    queryKey: DASHBOARD_KEYS.chartData(),
    queryFn: async () => {
      const res = await api.get('/dashboard/chart-data')
      return res.data.data
    },
    staleTime: 5 * 60 * 1000,
  })
}
