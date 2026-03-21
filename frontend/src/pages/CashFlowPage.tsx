import { useEffect, useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, FileSpreadsheet, FileText, Plus } from 'lucide-react'
import api from '../services/api'
import type { CashFlow, CashFlowSummary, MonthlyReport } from '../types/cashflow.types'
import { formatRupiah, formatDate } from '../utils/format'
import Table from '../components/common/ui/Table'
import StatusBadge from '../components/common/ui/StatusBadge'
import FilterBar from '../components/common/ui/FilterBar'
import Button from '../components/common/ui/Button'
import { toast } from '../store/useToastStore'
import CreateManualCashFlow from '../components/cashflow/createManualCashFlow'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const yearOptions = Array.from(
  { length: 5 },
  (_, i) => new Date().getFullYear() - i
)

export default function CashFlowPage() {
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([])
  const [summary, setSummary] = useState<CashFlowSummary | null>(null)
  const [monthly, setMonthly] = useState<MonthlyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'monthly'>('list')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [first, setFirst] = useState(0)

  // Filter
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('ALL')
  const [filterDateRange, setFilterDateRange] = useState<[Date | null, Date | null]>([null, null])

  const fetchAll = async () => {
    try {
      const [cfRes, sumRes, monRes] = await Promise.all([
        api.get('/cash-flows'),
        api.get('/cash-flows/summary'),
        api.get(`/cash-flows/monthly?year=${selectedYear}`),
      ])
      setCashFlows(cfRes.data.data)
      setSummary(sumRes.data.data)
      setMonthly(monRes.data.data)
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const fetchMonthly = async () => {
    try {
      const res = await api.get(`/cash-flows/monthly?year=${selectedYear}`)
      setMonthly(res.data.data)
    } catch (err) {
      console.error(err)
    }
  }

  useEffect(() => { fetchAll() }, [])

  // Refetch monthly saat tahun berubah
  useEffect(() => { fetchMonthly() }, [selectedYear])

  // Reset pagination saat filter berubah
  useEffect(() => { setFirst(0) }, [search, filterType, filterDateRange])

  const handleSubmitSucces = async () => {
    await fetchAll()
    setShowModal(false)
  }

  const filteredCashFlows = cashFlows.filter(cf => {
    const matchSearch =
      cf.description.toLowerCase().includes(search.toLowerCase()) ||
      cf.category.toLowerCase().includes(search.toLowerCase())
    const matchType = filterType === 'ALL' || cf.type === filterType
    const matchDate = (() => {
      if (!filterDateRange?.[0]) return true
      const date = new Date(cf.transactionDate)
      date.setHours(0, 0, 0, 0)
      const start = new Date(filterDateRange[0]!)
      start.setHours(0, 0, 0, 0)
      const end = new Date(filterDateRange[1] ?? filterDateRange[0]!)
      end.setHours(23, 59, 59, 999)
      return date >= start && date <= end
    })()
    return matchSearch && matchType && matchDate
  })

  // Hitung total saldo rekap bulanan
  const totalMonthlyIn = monthly.reduce((sum, m) => sum + (m.totalIn ?? 0), 0)
  const totalMonthlyOut = monthly.reduce((sum, m) => sum + (m.totalOut ?? 0), 0)
  const totalMonthlyBalance = totalMonthlyIn - totalMonthlyOut

  const columns = [
    {
      header: 'Tgl', body: (row: CashFlow) => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(row.transactionDate)}</span>
      )
    },
    { header: 'Tipe', body: (row: CashFlow) => <StatusBadge status={row.type} /> },
    {
      header: 'Kategori', body: (row: CashFlow) => (
        <span style={{ fontSize: 12 }}>{row.category}</span>
      )
    },
    { header: 'Deskripsi', field: 'description' },
    {
      header: 'Jumlah', body: (row: CashFlow) => (
        <span style={{ fontWeight: 600, color: row.type === 'IN' ? '#2E7D32' : '#C62828' }}>
          {row.type === 'IN' ? '+' : '-'}{formatRupiah(row.amount)}
        </span>
      )
    },
    {
      header: 'Sumber', body: (row: CashFlow) => (
        <span style={{ fontSize: 11, color: 'var(--muted)' }}>
          {row.referenceType ?? 'Manual'}
        </span>
      )
    },
  ]

  return (
    <div>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 20 }}>
        <div>
          <div style={{ fontSize: 17, fontWeight: 600, color: 'var(--text)', marginBottom: 3 }}>Keuangan</div>
          <div style={{ fontSize: 12, color: 'var(--muted)' }}>Rekap pemasukan dan pengeluaran</div>
        </div>
        <div style={{ display: 'flex', gap: 8 }}>
          <Button
            label="Export Excel"
            icon={<FileSpreadsheet size={13} />}
            variant="secondary"
            onClick={() => toast.info('Segera Hadir', 'Fitur export Excel sedang dikembangkan')}
          />
          <Button
            label="Export PDF"
            icon={<FileText size={13} />}
            variant="secondary"
            onClick={() => toast.info('Segera Hadir', 'Fitur export PDF sedang dikembangkan')}
          />
          <Button
            label="Input Manual"
            icon={<Plus size={13} />}
            onClick={() => setShowModal(true)}
          />
        </div>
      </div>

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          {
            label: 'Total Pemasukan',
            value: formatRupiah(summary?.totalIn ?? 0),
            icon: <TrendingUp size={16} color="#2E7D32" />,
            bg: '#E8F5E9', color: '#2E7D32',
          },
          {
            label: 'Total Pengeluaran',
            value: formatRupiah(summary?.totalOut ?? 0),
            icon: <TrendingDown size={16} color="#C62828" />,
            bg: '#FFEBEE', color: '#C62828',
          },
          {
            label: 'Saldo',
            value: formatRupiah(summary?.balance ?? 0),
            icon: <Wallet size={16} color="#1565A0" />,
            bg: '#E3F2FB', color: '#1565A0',
          },
        ].map(({ label, value, icon, bg, color }) => (
          <div key={label} style={{
            background: 'var(--white)',
            border: '1px solid var(--border)',
            borderRadius: 10,
            padding: '14px 16px',
            display: 'flex',
            alignItems: 'center',
            gap: 12,
          }}>
            <div style={{
              width: 36, height: 36, background: bg, borderRadius: 8,
              display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
            }}>
              {icon}
            </div>
            <div>
              <div style={{ fontSize: 11, color: 'var(--muted)', marginBottom: 3 }}>{label}</div>
              <div style={{ fontSize: 15, fontWeight: 600, color }}>{value}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 16 }}>
        {[
          { key: 'list', label: 'Transaksi' },
          { key: 'monthly', label: 'Rekap Bulanan' },
        ].map(tab => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key as any)}
            style={{
              padding: '6px 16px',
              borderRadius: 7,
              border: '1px solid var(--border)',
              background: activeTab === tab.key ? 'var(--accent)' : 'var(--white)',
              color: activeTab === tab.key ? 'white' : 'var(--text)',
              fontSize: 12,
              fontWeight: 500,
              cursor: 'pointer',
            }}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {activeTab === 'list' ? (
        <>
          <FilterBar
            config={{
              search: { value: search, onChange: setSearch, placeholder: 'Cari deskripsi atau kategori...' },
              dateRange: {
                value: filterDateRange,
                onChange: (val) => setFilterDateRange(val ?? [null, null]),
                placeholder: 'Filter tanggal'
              },
              dropdowns: [{
                value: filterType,
                onChange: setFilterType,
                options: [
                  { label: 'Semua Tipe', value: 'ALL' },
                  { label: 'Pemasukan', value: 'IN' },
                  { label: 'Pengeluaran', value: 'OUT' },
                ],
                placeholder: 'Tipe',
              }],
            }}
            onReset={() => { setSearch(''); setFilterType('ALL'); setFilterDateRange([null, null]) }}
            hasActiveFilter={!!(search || filterType !== 'ALL' || filterDateRange[0])}
            onRefresh={fetchAll}
          />
          <Table
            data={filteredCashFlows}
            columns={columns}
            loading={loading}
            emptyMessage="Belum ada transaksi"
            first={first}
            onFirstChange={setFirst}
          />
        </>
      ) : (
        /* Rekap Bulanan */
        <div>
          {/* Year selector */}
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: 12 }}>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{
                padding: '6px 12px',
                borderRadius: 8,
                border: '1px solid var(--border)',
                background: 'var(--white)',
                fontSize: 13,
                color: 'var(--text)',
                cursor: 'pointer',
                outline: 'none',
              }}
            >
              {yearOptions.map(y => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse' }}>
              <thead>
                <tr style={{ background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--border)' }}>
                  {['Bulan', 'Pemasukan', 'Pengeluaran', 'Saldo'].map(h => (
                    <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {monthly.length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px 14px', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
                      Tidak ada data untuk tahun {selectedYear}
                    </td>
                  </tr>
                ) : (
                  monthly.map((m, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border)' }}>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: 'var(--text)' }}>
                        {m.month ? monthNames[m.month - 1] : ''} {m.year}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#2E7D32' }}>
                        {formatRupiah(m.totalIn)}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 500, color: '#C62828' }}>
                        {formatRupiah(m.totalOut)}
                      </td>
                      <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 600, color: m.balance >= 0 ? '#2E7D32' : '#C62828' }}>
                        {formatRupiah(m.balance)}
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
              {/* Total row */}
              {monthly.length > 0 && (
                <tfoot>
                  <tr style={{ background: 'var(--sidebar-bg)', borderTop: '2px solid var(--border)' }}>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: 'var(--text)' }}>
                      Total {selectedYear}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#2E7D32' }}>
                      {formatRupiah(totalMonthlyIn)}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: '#C62828' }}>
                      {formatRupiah(totalMonthlyOut)}
                    </td>
                    <td style={{ padding: '10px 14px', fontSize: 13, fontWeight: 700, color: totalMonthlyBalance >= 0 ? '#2E7D32' : '#C62828' }}>
                      {formatRupiah(totalMonthlyBalance)}
                    </td>
                  </tr>
                </tfoot>
              )}
            </table>
          </div>
        </div>
      )}

      <CreateManualCashFlow
        visible={showModal}
        onHide={() => setShowModal(false)}
        onSuccess={handleSubmitSucces}
      />
    </div>
  )
}