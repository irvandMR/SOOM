import { useEffect, useState } from 'react'
import { InputText } from 'primereact/inputtext'
import { Dropdown } from 'primereact/dropdown'
import { InputNumber } from 'primereact/inputnumber'
import { TrendingUp, TrendingDown, Wallet, FileSpreadsheet, FileText, Plus } from 'lucide-react'
import api from '../services/api'
import type { CashFlow, CashFlowSummary, MonthlyReport, ManualCashFlowRequest } from '../types/cashflow.types'
import { formatRupiah, formatDate } from '../utils/format'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import Modal from '../components/common/ui/Modal'
import FormField from '../components/common/ui/FormField'
import StatusBadge from '../components/common/ui/StatusBadge'
import FilterBar from '../components/common/ui/FilterBar'
import Button from '../components/common/ui/Button'
import { toast } from '../store/useToastStore'

const categoryOptions = [
  { label: 'Penjualan', value: 'Penjualan' },
  { label: 'Pembelian Bahan', value: 'Pembelian Bahan' },
  { label: 'Operasional', value: 'Operasional' },
  { label: 'Gaji', value: 'Gaji' },
  { label: 'Lainnya', value: 'Lainnya' },
]

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

export default function CashFlowPage() {
  const [cashFlows, setCashFlows] = useState<CashFlow[]>([])
  const [summary, setSummary] = useState<CashFlowSummary | null>(null)
  const [monthly, setMonthly] = useState<MonthlyReport[]>([])
  const [loading, setLoading] = useState(true)
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [showModal, setShowModal] = useState(false)
  const [activeTab, setActiveTab] = useState<'list' | 'monthly'>('list')

  // Filter
  const [search, setSearch] = useState('')
  const [filterType, setFilterType] = useState('')
  const [filterDateRange, setFilterDateRange] = useState<[Date | null, Date | null]>([null, null])

  const defaultForm: ManualCashFlowRequest = {
    type: 'IN',
    category: '',
    amount: 0,
    description: '',
    transactionDate: new Date().toISOString().split('T')[0],
  }
  const [form, setForm] = useState<ManualCashFlowRequest>(defaultForm)

  const fetchAll = async () => {
    try {
      const [cfRes, sumRes, monRes] = await Promise.all([
        api.get('/cash-flows'),
        api.get('/cash-flows/summary'),
        api.get(`/cash-flows/monthly?year=${new Date().getFullYear()}`),
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

  useEffect(() => { fetchAll() }, [])

  const handleSubmit = async () => {
    setError('')
    setSubmitting(true)
    try {
      await api.post('/cash-flows', form)
      await fetchAll()
      setShowModal(false)
      setForm(defaultForm)
    } catch (err: any) {
      setError(err.response?.data?.message ?? 'Gagal menyimpan transaksi')
    } finally {
      setSubmitting(false)
    }
  }

  const hasActiveFilter = !!(search || filterType || filterDateRange[0])

  const filteredCashFlows = cashFlows.filter(cf => {
    const matchSearch = cf.description.toLowerCase().includes(search.toLowerCase()) ||
      cf.category.toLowerCase().includes(search.toLowerCase())
    const matchType = !filterType || cf.type === filterType
    const matchDate = (() => {
      if (!filterDateRange[0]) return true
      const date = new Date(cf.transactionDate)
      const start = filterDateRange[0]!
      const end = filterDateRange[1] ?? filterDateRange[0]!
      return date >= start && date <= end
    })()
    return matchSearch && matchType && matchDate
  })

  const columns = [
    { header: 'Tgl', body: (row: CashFlow) => (
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(row.transactionDate)}</span>
    )},
    { header: 'Tipe', body: (row: CashFlow) => <StatusBadge status={row.type} /> },
    { header: 'Kategori', body: (row: CashFlow) => (
      <span style={{ fontSize: 12 }}>{row.category}</span>
    )},
    { header: 'Deskripsi', field: 'description' },
    { header: 'Jumlah', body: (row: CashFlow) => (
      <span style={{
        fontWeight: 600,
        color: row.type === 'IN' ? '#2E7D32' : '#C62828',
      }}>
        {row.type === 'IN' ? '+' : '-'}{formatRupiah(row.amount)}
      </span>
    )},
    { header: 'Sumber', body: (row: CashFlow) => (
      <span style={{ fontSize: 11, color: 'var(--muted)' }}>
        {row.referenceType ? `${row.referenceType}` : 'Manual'}
      </span>
    )},
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
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 12, marginBottom: 20 }}>
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
            <div style={{ width: 36, height: 36, background: bg, borderRadius: 8, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
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
              dateRange: { value: filterDateRange, onChange: setFilterDateRange, placeholder: 'Filter tanggal' },
              dropdowns: [{
                value: filterType,
                onChange: setFilterType,
                options: [
                  { label: 'Semua Tipe', value: '' },
                  { label: 'Pemasukan', value: 'IN' },
                  { label: 'Pengeluaran', value: 'OUT' },
                ],
                placeholder: 'Tipe',
              }],
            }}
            onReset={() => { setSearch(''); setFilterType(''); setFilterDateRange([null, null]) }}
            hasActiveFilter={hasActiveFilter}
          />
          <Table
            data={filteredCashFlows}
            columns={columns}
            loading={loading}
            emptyMessage="Belum ada transaksi"
          />
        </>
      ) : (
        /* Rekap Bulanan */
        <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 10, overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: 'var(--sidebar-bg)', borderBottom: '1px solid var(--border)' }}>
                {['Bulan', 'Pemasukan', 'Pengeluaran', 'Saldo'].map(h => (
                  <th key={h} style={{ padding: '10px 14px', textAlign: 'left', fontSize: 11, fontWeight: 600, color: 'var(--muted)' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {monthly.map((m, i) => (
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
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Modal */}
      <Modal
        visible={showModal}
        onHide={() => { setShowModal(false); setError(''); setForm(defaultForm) }}
        title="Input Transaksi Manual"
        onConfirm={handleSubmit}
        confirmLabel="Simpan"
        loading={submitting}
        width="440px"
      >
        <FormField label="Tipe" required>
          <Dropdown
            value={form.type}
            onChange={(e) => setForm({ ...form, type: e.value })}
            options={[{ label: 'Pemasukan', value: 'IN' }, { label: 'Pengeluaran', value: 'OUT' }]}
            className="w-full"
          />
        </FormField>

        <FormField label="Kategori" required>
          <Dropdown
            value={form.category}
            onChange={(e) => setForm({ ...form, category: e.value })}
            options={categoryOptions}
            placeholder="Pilih kategori"
            className="w-full"
          />
        </FormField>

        <FormField label="Jumlah" required>
          <InputNumber
            value={form.amount}
            onValueChange={(e) => setForm({ ...form, amount: e.value ?? 0 })}
            prefix="Rp "
            className="w-full"
          />
        </FormField>

        <FormField label="Deskripsi" required>
          <InputText
            value={form.description}
            onChange={(e) => setForm({ ...form, description: e.target.value })}
            placeholder="Keterangan transaksi..."
            className="w-full"
          />
        </FormField>

        <FormField label="Tanggal" required>
          <InputText
            type="date"
            value={form.transactionDate}
            onChange={(e) => setForm({ ...form, transactionDate: e.target.value })}
            className="w-full"
          />
        </FormField>

        {error && (
          <div style={{ background: '#FFEBEE', color: '#C62828', fontSize: 12, padding: '8px 10px', borderRadius: 6 }}>
            {error}
          </div>
        )}
      </Modal>
    </div>
  )
}