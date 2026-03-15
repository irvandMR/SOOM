import { useEffect, useState } from 'react'
import api from '../services/api'

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
  paidAmount: number
  paymentStatus: string
}

interface StockAlert {
  id: string
  name: string
  stockQuantity: number
  minimumStock: number
  unitSymbol: string
}

const formatRupiah = (amount: number) =>
  new Intl.NumberFormat('id-ID', { style: 'currency', currency: 'IDR', minimumFractionDigits: 0 }).format(amount)

const statusColor: Record<string, { bg: string; color: string }> = {
  PENDING:   { bg: '#FFF8E1', color: '#E65100' },
  PROCESS:   { bg: '#E3F2FB', color: '#1565A0' },
  DONE:      { bg: '#E8F5E9', color: '#2E7D32' },
  DELIVERED: { bg: '#E8F5E9', color: '#2E7D32' },
  CANCELLED: { bg: '#FFEBEE', color: '#C62828' },
}

export default function DashboardPage() {
  const [summary, setSummary] = useState<SummaryData | null>(null)
  const [recentOrders, setRecentOrders] = useState<RecentOrder[]>([])
  const [stockAlerts, setStockAlerts] = useState<StockAlert[]>([])
  const [loading, setLoading] = useState(true)

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

  if (loading) return (
    <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 200, color: 'var(--muted)' }}>
      Memuat data...
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

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 12, marginBottom: 20 }}>
        
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ width: 28, height: 28, background: '#E3F2FB', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M2 4h12M2 8h9M2 12h6" stroke="#1565A0" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Order Hari Ini</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{summary?.totalOrdersToday ?? 0}</div>
          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#E3F2FB', color: '#1565A0' }}>order masuk</span>
        </div>

        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ width: 28, height: 28, background: '#E8F5E9', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 2v12M4 6l4-4 4 4" stroke="#2E7D32" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Pemasukan</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{formatRupiah(summary?.incomeToday ?? 0)}</div>
          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#E8F5E9', color: '#2E7D32' }}>hari ini</span>
        </div>

        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ width: 28, height: 28, background: '#FFEBEE', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><path d="M8 14V2M4 10l4 4 4-4" stroke="#C62828" strokeWidth="1.5" strokeLinecap="round"/></svg>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Pengeluaran</div>
          <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{formatRupiah(summary?.outcomeToday ?? 0)}</div>
          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#FFEBEE', color: '#C62828' }}>hari ini</span>
        </div>

        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: '14px 16px' }}>
          <div style={{ width: 28, height: 28, background: '#FFF8E1', borderRadius: 7, display: 'flex', alignItems: 'center', justifyContent: 'center', marginBottom: 8 }}>
            <svg width="14" height="14" viewBox="0 0 16 16" fill="none"><circle cx="8" cy="8" r="6" stroke="#E65100" strokeWidth="1.4"/><path d="M8 5v3" stroke="#E65100" strokeWidth="1.5" strokeLinecap="round"/><circle cx="8" cy="11" r="0.8" fill="#E65100"/></svg>
          </div>
          <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 4 }}>Stok Kritis</div>
          <div style={{ fontSize: 22, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>{summary?.criticalStockCount ?? 0}</div>
          <span style={{ fontSize: 10, padding: '2px 6px', borderRadius: 4, background: '#FFF8E1', color: '#E65100' }}>perlu restock</span>
        </div>
      </div>

      {/* Bottom Row */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>

        {/* Recent Orders */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Order Terbaru</span>
            <span style={{ fontSize: 11, color: 'var(--accent)', cursor: 'pointer' }}>Lihat semua →</span>
          </div>
          {recentOrders.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>Belum ada order</div>
          ) : (
            recentOrders.map((order) => (
              <div key={order.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{order.customerName}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>{order.orderDate} · {order.orderNumber}</div>
                </div>
                <span style={{
                  fontSize: 10, padding: '2px 7px', borderRadius: 4, fontWeight: 500,
                  background: statusColor[order.status]?.bg ?? '#f5f5f5',
                  color: statusColor[order.status]?.color ?? '#666',
                }}>
                  {order.status}
                </span>
              </div>
            ))
          )}
        </div>

        {/* Stock Alerts */}
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, padding: '16px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 12 }}>
            <span style={{ fontSize: 13, fontWeight: 600, color: 'var(--text)' }}>Stok Kritis</span>
            <span style={{ fontSize: 11, color: 'var(--accent)', cursor: 'pointer' }}>Tambah stok →</span>
          </div>
          {stockAlerts.length === 0 ? (
            <div style={{ fontSize: 12, color: 'var(--muted)', textAlign: 'center', padding: '20px 0' }}>Semua stok aman ✅</div>
          ) : (
            stockAlerts.map((alert) => (
              <div key={alert.id} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid var(--border)' }}>
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text)' }}>{alert.name}</div>
                  <div style={{ fontSize: 11, color: 'var(--muted)' }}>Min. {alert.minimumStock} {alert.unitSymbol}</div>
                </div>
                <span style={{ fontSize: 11, fontWeight: 600, color: '#C62828' }}>
                  {alert.stockQuantity} {alert.unitSymbol}
                </span>
              </div>
            ))
          )}
        </div>
      </div>
    </div>
  )
}