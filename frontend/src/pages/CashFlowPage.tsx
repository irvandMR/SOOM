import { useState } from 'react'
import { TrendingUp, TrendingDown, Wallet, FileSpreadsheet, Plus, Calendar } from 'lucide-react'
import type { CashFlow } from '../types/cashflow.types'
import { formatRupiah, formatDate } from '../utils/format'
import Table from '../components/common/ui/Table'
import StatusBadge from '../components/common/ui/StatusBadge'
import FilterBar from '../components/common/ui/FilterBar'
import Button from '../components/common/ui/Button'
import CreateManualCashFlow from '../components/cashflow/createManualCashFlow'
import {
  useCashFlows,
  useCashFlowSummary,
  useMonthlyCashFlow,
  useDownloadMonthlyReport,
  useProfitLoss,
  CASHFLOW_KEYS,
} from '../hooks/queries/useCashFlowQueries'
import { useQueryClient } from '@tanstack/react-query'

const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agu', 'Sep', 'Okt', 'Nov', 'Des']

const yearOptions = Array.from(
  { length: 5 },
  (_, i) => new Date().getFullYear() - i
)

export default function CashFlowPage() {
  const queryClient = useQueryClient()

  // ── UI State ──────────────────────────────────────────────────────────────
  const [lazyParams, setLazyParams] = useState({
    first: 0,
    rows: 10,
    page: 0,
    sortField: 'transactionDate',
    sortOrder: -1 as 1 | -1 | 0 | null,
    search: '',
    filterType: 'ALL',
    filterDateRange: [null, null] as [Date | null, Date | null]
  })

  const [activeTab, setActiveTab] = useState<'list' | 'monthly' | 'profit-loss'>('list')
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear())
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1)
  
  const [showModal, setShowModal] = useState(false)
  const [showExportDialog, setShowExportDialog] = useState(false)
  const [exportYear, setExportYear] = useState(new Date().getFullYear())
  const [exportMonth, setExportMonth] = useState(new Date().getMonth() + 1)

  // ── React Query ───────────────────────────────────────────────────────────
  const { data: pageData, isLoading } = useCashFlows({
    page: lazyParams.page,
    size: lazyParams.rows,
    search: lazyParams.search || undefined,
    sort: `${lazyParams.sortField},${lazyParams.sortOrder === 1 ? 'asc' : 'desc'}`
  })
  
  const { data: summary } = useCashFlowSummary()
  const { data: monthly = [] } = useMonthlyCashFlow(selectedYear)
  const { data: plData, isLoading: plLoading } = useProfitLoss(selectedYear, selectedMonth)
  const downloadReport = useDownloadMonthlyReport()

  const cashFlows = pageData?.content || []
  const totalRecords = pageData?.totalElements || 0

  const refresh = () => queryClient.invalidateQueries({ queryKey: CASHFLOW_KEYS.all })

  const handleExportExcel = () => {
    downloadReport.mutate({ year: exportYear, month: exportMonth })
    setShowExportDialog(false)
  }

  // ── Handlers ──────────────────────────────────────────────────────────────
  const onPage = (event: any) => {
    setLazyParams(prev => ({ ...prev, first: event.first, rows: event.rows, page: event.page }))
  }

  const onSort = (event: any) => {
    setLazyParams(prev => ({ ...prev, sortField: event.sortField, sortOrder: event.sortOrder }))
  }

  // Hitung total saldo rekap bulanan
  const totalMonthlyIn = (monthly as any[]).reduce((sum, m) => sum + (m.totalIn ?? 0), 0)
  const totalMonthlyOut = (monthly as any[]).reduce((sum, m) => sum + (m.totalOut ?? 0), 0)
  const totalMonthlyBalance = totalMonthlyIn - totalMonthlyOut

  const columns = [
    {
      header: 'Tgl', field: 'transactionDate', sortable: true, body: (row: CashFlow) => (
        <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(row.transactionDate)}</span>
      )
    },
    { header: 'Tipe', field: 'type', sortable: true, body: (row: CashFlow) => <StatusBadge status={row.type} /> },
    {
      header: 'Kategori', field: 'category', sortable: true, body: (row: CashFlow) => (
        <span style={{ fontSize: 12 }}>{row.category}</span>
      )
    },
    { header: 'Deskripsi', field: 'description', sortable: true },
    {
      header: 'Jumlah', field: 'amount', sortable: true, body: (row: CashFlow) => (
        <span style={{ fontWeight: 600, color: row.type === 'IN' ? '#2E7D32' : '#C62828' }}>
          {row.type === 'IN' ? '+' : '-'}{formatRupiah(row.amount)}
        </span>
      )
    },
    {
      header: 'Sumber', field: 'referenceType', sortable: true, body: (row: CashFlow) => (
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
            onClick={() => setShowExportDialog(true)}
          />
          <Button
            label="Input Manual"
            icon={<Plus size={13} />}
            onClick={() => setShowModal(true)}
          />
        </div>
      </div>

      {/* Export Excel Dialog */}
      {showExportDialog && (
        <div style={{
          position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.4)',
          display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 1000,
        }}>
          <div style={{
            background: 'var(--white)', borderRadius: 12, padding: 24, width: 320,
            boxShadow: '0 8px 32px rgba(0,0,0,0.15)',
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <Calendar size={18} color="var(--accent)" />
              <div style={{ fontSize: 15, fontWeight: 600, color: 'var(--text)' }}>Export Laporan Bulanan</div>
            </div>
            <div style={{ marginBottom: 12 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Tahun</label>
              <select
                value={exportYear}
                onChange={(e) => setExportYear(Number(e.target.value))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--white)',
                  fontSize: 13, color: 'var(--text)', cursor: 'pointer', outline: 'none',
                }}
              >
                {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
              </select>
            </div>
            <div style={{ marginBottom: 20 }}>
              <label style={{ fontSize: 12, color: 'var(--muted)', display: 'block', marginBottom: 4 }}>Bulan</label>
              <select
                value={exportMonth}
                onChange={(e) => setExportMonth(Number(e.target.value))}
                style={{
                  width: '100%', padding: '8px 12px', borderRadius: 8,
                  border: '1px solid var(--border)', background: 'var(--white)',
                  fontSize: 13, color: 'var(--text)', cursor: 'pointer', outline: 'none',
                }}
              >
                {monthNames.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
              </select>
            </div>
            <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end' }}>
              <Button label="Batal" variant="secondary" onClick={() => setShowExportDialog(false)} />
              <Button
                label={downloadReport.isPending ? 'Downloading...' : 'Download'}
                icon={<FileSpreadsheet size={13} />}
                onClick={handleExportExcel}
              />
            </div>
          </div>
        </div>
      )}

      {/* Summary Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: 12, marginBottom: 20 }}>
        {[
          {
            label: 'Total Pemasukan',
            value: formatRupiah((summary as any)?.totalIn ?? 0),
            icon: <TrendingUp size={16} color="#2E7D32" />,
            bg: '#E8F5E9', color: '#2E7D32',
          },
          {
            label: 'Total Pengeluaran',
            value: formatRupiah((summary as any)?.totalOut ?? 0),
            icon: <TrendingDown size={16} color="#C62828" />,
            bg: '#FFEBEE', color: '#C62828',
          },
          {
            label: 'Saldo',
            value: formatRupiah((summary as any)?.balance ?? 0),
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
          { key: 'profit-loss', label: 'Laba Rugi' },
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
              search: { 
                value: lazyParams.search, 
                onChange: (v) => setLazyParams(p => ({ ...p, search: v, page: 0, first: 0 })), 
                placeholder: 'Cari deskripsi atau kategori...' 
              },
              dateRange: {
                value: lazyParams.filterDateRange,
                onChange: (val) => setLazyParams(p => ({ ...p, filterDateRange: val ?? [null, null], page: 0, first: 0 })),
                placeholder: 'Filter tanggal'
              },
              dropdowns: [{
                value: lazyParams.filterType,
                onChange: (v) => setLazyParams(p => ({ ...p, filterType: v, page: 0, first: 0 })),
                options: [
                  { label: 'Semua Tipe', value: 'ALL' },
                  { label: 'Pemasukan', value: 'IN' },
                  { label: 'Pengeluaran', value: 'OUT' },
                ],
                placeholder: 'Tipe',
              }],
            }}
            onReset={() => setLazyParams(p => ({ ...p, search: '', filterType: 'ALL', filterDateRange: [null, null], page: 0, first: 0 }))}
            hasActiveFilter={!!(lazyParams.search || lazyParams.filterType !== 'ALL' || lazyParams.filterDateRange?.[0])}
            onRefresh={refresh}
          />
          <Table
            data={cashFlows}
            columns={columns}
            loading={isLoading}
            emptyMessage="Belum ada transaksi"
            lazy
            totalRecords={totalRecords}
            first={lazyParams.first}
            rows={lazyParams.rows}
            onPage={onPage}
            onSort={onSort}
            sortField={lazyParams.sortField}
            sortOrder={lazyParams.sortOrder}
          />
        </>
      ) : activeTab === 'monthly' ? (
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
                {(monthly as any[]).length === 0 ? (
                  <tr>
                    <td colSpan={4} style={{ padding: '20px 14px', textAlign: 'center', fontSize: 13, color: 'var(--muted)' }}>
                      Tidak ada data untuk tahun {selectedYear}
                    </td>
                  </tr>
                ) : (
                  (monthly as any[]).map((m, i) => (
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
              {(monthly as any[]).length > 0 && (
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
      ) : (
        /* Laba Rugi */
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: 8, marginBottom: 16 }}>
            <select
              value={selectedMonth}
              onChange={(e) => setSelectedMonth(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--white)', fontSize: 13 }}
            >
              {monthNames.map((m, i) => <option key={i + 1} value={i + 1}>{m}</option>)}
            </select>
            <select
              value={selectedYear}
              onChange={(e) => setSelectedYear(Number(e.target.value))}
              style={{ padding: '6px 12px', borderRadius: 8, border: '1px solid var(--border)', background: 'var(--white)', fontSize: 13 }}
            >
              {yearOptions.map(y => <option key={y} value={y}>{y}</option>)}
            </select>
          </div>

          <div style={{ background: 'var(--white)', border: '1px solid var(--border)', borderRadius: 12, padding: 24 }}>
            <div style={{ textAlign: 'center', marginBottom: 30 }}>
              <div style={{ fontSize: 18, fontWeight: 700, color: 'var(--text)' }}>Laporan Laba Rugi</div>
              <div style={{ fontSize: 13, color: 'var(--muted)' }}>Periode {monthNames[selectedMonth - 1]} {selectedYear}</div>
            </div>

            {plLoading ? (
              <div style={{ textAlign: 'center', padding: '40px 0', color: 'var(--muted)' }}>Memuat data...</div>
            ) : (
              <div style={{ maxWidth: 600, margin: '0 auto' }}>
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 8, background: '#F8F9FA' }}>
                    <span style={{ fontWeight: 500 }}>Pendapatan (Revenue)</span>
                    <span style={{ fontWeight: 600 }}>{formatRupiah(plData?.revenue ?? 0)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', color: '#C62828' }}>
                    <span style={{ fontWeight: 500 }}>Harga Pokok Penjualan (HPP)</span>
                    <span style={{ fontWeight: 600 }}>({formatRupiah(plData?.cogs ?? 0)})</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderRadius: 8, background: '#E3F2FD', color: '#1565C0', marginTop: 4 }}>
                    <div>
                      <span style={{ fontWeight: 700 }}>Laba Kotor (Gross Profit)</span>
                      <div style={{ fontSize: 11, fontWeight: 500 }}>Margin Kotor: {plData?.grossMargin ?? 0}%</div>
                    </div>
                    <span style={{ fontWeight: 700 }}>{formatRupiah(plData?.grossProfit ?? 0)}</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '12px 16px', borderBottom: '1px solid var(--border)', color: '#C62828', marginTop: 12 }}>
                    <span style={{ fontWeight: 500 }}>Biaya Operasional</span>
                    <span style={{ fontWeight: 600 }}>({formatRupiah(plData?.operationalExpenses ?? 0)})</span>
                  </div>

                  <div style={{ display: 'flex', justifyContent: 'space-between', padding: '16px', borderRadius: 8, background: (plData?.netProfit ?? 0) >= 0 ? '#E8F5E9' : '#FFEBEE', color: (plData?.netProfit ?? 0) >= 0 ? '#2E7D32' : '#C62828', marginTop: 8 }}>
                    <div>
                      <span style={{ fontSize: 16, fontWeight: 800 }}>Laba Bersih (Net Profit)</span>
                      <div style={{ fontSize: 11, fontWeight: 600 }}>Margin Bersih: {plData?.netMargin ?? 0}%</div>
                    </div>
                    <span style={{ fontSize: 18, fontWeight: 800 }}>{formatRupiah(plData?.netProfit ?? 0)}</span>
                  </div>
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      <CreateManualCashFlow
        visible={showModal}
        onHide={() => setShowModal(false)}
        onSuccess={() => { refresh(); setShowModal(false) }}
      />
    </div>
  )
}