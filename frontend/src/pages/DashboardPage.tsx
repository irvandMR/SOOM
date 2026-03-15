import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Chart } from 'primereact/chart'
import api from '../services/api'
import { formatRupiah, formatDate } from '../utils/format'

interface SummaryData {
  totalOrdersToday: number
  incomeToday: number
  outcomeToday: number
  criticalStockCount: number
}

interface RecentOrder {
  id: string
  orderNumber: string
  customerName: string
  orderDate: string
  status: string
  totalAmount: number
  paymentStatus: string
}

interface StockAlert {
  id: string
  name: string
  stockQuantity: number
  minimumStock: number
  unitSymbol: string
}

const statusMap: Record<string, { bg: string; color: string; label: string }> = {
  PENDING:   { bg: '#FFF8E1', color: '#E65100', label: 'Pending' },
  PROCESS:   { bg: '#E3F2FB', color: '#1565A0', label: 'Process' },
  DONE:      { bg: '#E8F5E9', color: '#2E7D32', label: 'Done' },
  DELIVERED: { bg: '#E8F5E9', color: '#2E7D32', label: 'Delivered' },
  CANCELLED: { bg: '#FFEBEE', color: '#C62828', label: 'Cancelled' },
}

const chartData = {
  labels: ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'],
  datasets: [
    {
      label: 'Pemasukan',
      data: [320000, 450000, 280000, 590000, 420000, 680000, 510000],
      backgroundColor: 'rgba(74, 144, 184, 0.15)',
      borderColor: '#4A90B8',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#4A90B8',
      pointRadius: 3,
    },
    {
      label: 'Pengeluaran',
      data: [120000, 200000, 150000, 300000, 180000, 250000, 190000],
      backgroundColor: 'rgba(198, 40, 40, 0.08)',
      borderColor: '#C62828',
      borderWidth: 2,
      fill: true,
      tension: 0.4,
      pointBackgroundColor: '#C62828',
      pointRadius: 3,
    },
  ],
}

const chartOptions = {
  responsive: true,
  maintainAspectRatio: false,
  plugins: {
    legend: {
      position: 'top' as const,
      labels: {
        fontSize: 11,
        usePointStyle: true,
        pointStyleWidth: 8,
      },
    },
    tooltip: {
      callbacks: {
        label: (ctx: any) => ` ${formatRupiah(ctx.raw)}`,
      },
    },
  },
  scales: {
    x: {
      grid: { display: false },
      ticks: { font: { size: 11 } },
    },
    y: {
      grid: { color: 'rgba(0,0,0,0.04)' },
      ticks: {
        font: { size: 10 },
        callback: (val: any) => `${(val / 1000).toFixed(0)}k`,
      },
    },
  },
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)
  const navigate = useNavigate()

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [summaryRes, ordersRes, alertsRes] = await Promise.all([
          api.get('/dashboard/summary'),
          api.get('/dashboard/recent-orders'),
          api.get('/dashboard/stock-alerts'),
        ])
        setSummary(summaryRes.data.data)
        setRecentOrders(ordersRes.data.data)
        setStockAlerts(alertsRes.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])

  const summaryCards = [
    {
      label: 'Order Hari Ini',
      value: summary?.totalOrdersToday ?? 0,
      tag: 'order masuk',
      tagStyle: { bg: '#E3F2FB', color: '#1565A0' },
      iconBg: '#E3F2FB',
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h9M2 12h6" stroke="#1565A0" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    },
    {
      label: 'Pemasukan',
      value: formatRupiah(summary?.incomeToday ?? 0),
      tag: 'hari ini',
      tagStyle: { bg: '#E8F5E9', color: '#2E7D32' },
      iconBg: '#E8F5E9',
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M4 6l4-4 4 4" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    },
    {
      label: 'Pengeluaran',
      value: formatRupiah(summary?.outcomeToday ?? 0),
      tag: 'hari ini',
      tagStyle: { bg: '#FFEBEE', color: '#C62828' },
      iconBg: '#FFEBEE',
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 14V2M4 10l4 4 4-4" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round"/></svg>,
    },
    {
      label: 'Stok Kritis',
      value: summary?.criticalStockCount ?? 0,
      tag: 'perlu restock',
      tagStyle: { bg: '#FFF8E1', color: '#E65100' },
      iconBg: '#FFF8E1',
      icon: <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#E65100" strokeWidth="1.4"/><path d="M8 5v3" stroke="#E65100" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.8" fill="#E65100"/></svg>,
    },
  ]

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200 }}>
      <i className="pi pi-spin pi-spinner" style={{ fontSize: 24, color: 'var(--accent)' }} />
    </div>
  )

  return (
    <div>
      {/* Page Title */}
      <div style={{ marginBottom: 20 }}>
        <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>
          Selamat datang, Admin SOOM 👋
        </div>
        <div style={{ fontSize: 12, color: 'var(--muted)' }}>
          Pantau order, stok, dan keuangan usahamu hari ini.
        </div>
      </div>

      {/* Main Layout */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: '1fr 280px',
        gap: 16,
      }}>

        {/* Kiri — Summary Cards + Chart + Order */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>

          {/* Summary Cards 2x2 */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
            {summaryCards.map((card, i) => (
              <div key={i} style={{
                background: 'var(--white)',
                border: '1px solid var(--border)',
                borderRadius: 10,
                padding: '14px 16px',
              }}>
                <div style={{
                  width: 28, height: 28,
                  background: card.iconBg,
                  borderRadius: 7,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  marginBottom: 8,
                }}>
                  {card.icon}
                </div>
                <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>{card.label}</div>
                <div style={{
                  fontSize: typeof card.value === 'string' ? 14 : 22,
                  fontWeight: 600, color: 'var(--text)', marginBottom: 3,
                }}>
                  {card.value}
                </div>
                <span style={{
                  fontSize: 10, padding: '2px 6px', borderRadius: 4,
                  background: card.tagStyle.bg, color: card.tagStyle.color,
                }}>
                  {card.tag}
                </span>
              </div>
            ))}
          </div>

          {/* Chart */}
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Grafik 7 Hari Terakhir</span>
              <span style={{ fontSize: 11, color: 'var(--muted)' }}>Pemasukan vs Pengeluaran</span>
            </div>
            <div style={{ height: 200 }}>
              <Chart type="line" data={chartData} options={chartOptions} style={{ height: '100%' }} />
            </div>
          </div>

          {/* Order Terbaru */}
          <div style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: 16,
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
              <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Order Terbaru</span>
              <span onClick={() => navigate('/orders')} style={{ fontSize: 11, color: 'var(--accent)', cursor: 'pointer' }}>
                Lihat semua →
              </span>
            </div>
            {recentOrders.length === 0 ? (
              <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
                Belum ada order
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
                {recentOrders.map((order) => (
                  <div
                    key={order.id}
                    onClick={() => navigate(`/orders/${order.id}`)}
                    style={{
                      background: 'var(--sidebar-bg)',
                      border: '1px solid var(--border)',
                      borderRadius: 8,
                      padding: '10px 12px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      cursor: 'pointer',
                    }}
                  >
                    <div>
                      <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
                        {order.customerName}
                      </div>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {formatDate(order.orderDate)} · {order.orderNumber}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right' }}>
                      <span style={{
                        fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 500,
                        background: statusMap[order.status]?.bg ?? '#f5f5f5',
                        color: statusMap[order.status]?.color ?? '#666',
                        display: 'block', marginBottom: 3,
                      }}>
                        {statusMap[order.status]?.label ?? order.status}
                      </span>
                      <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                        {formatRupiah(order.totalAmount)}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Kanan — Stock Kritis */}
        <div style={{
          background: 'var(--white)',
          border: '1px solid var(--border)',
          borderRadius: 10,
          padding: 16,
          alignSelf: 'start',
          position: 'sticky',
          top: 16,
        }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Stok Kritis</span>
            <span onClick={() => navigate('/ingredients')} style={{ fontSize: 11, color: 'var(--accent)', cursor: 'pointer' }}>
              Lihat →
            </span>
          </div>
          {stockAlerts.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>
              Semua stok aman ✅
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {stockAlerts.map((alert) => (
                <div key={alert.id} style={{
                  background: '#FFF8F8',
                  border: '1px solid #FFE0E0',
                  borderRadius: 8,
                  padding: '10px 12px',
                  display: 'flex',
                  justifyContent: 'space-between',
                  alignItems: 'center',
                }}>
                  <div>
                    <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)', marginBottom: 2 }}>
                      {alert.name}
                    </div>
                    <div style={{ fontSize: 11, color: 'var(--muted)' }}>
                      Min. {alert.minimumStock} {alert.unitSymbol}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right' }}>
                    <div style={{ fontSize: 13, fontWeight: 600, color: '#C62828' }}>{alert.stockQuantity}</div>
                    <div style={{ fontSize: 10, color: 'var(--muted)' }}>{alert.unitSymbol}</div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

      </div>
    </div>
  )
}