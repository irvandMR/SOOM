import { useEffect, useState } from 'react'
import api from '../services/api'
import type { Production } from '../types/production.types'
import { formatDate } from '../utils/format'
import PageHeader from '../components/common/ui/PageHeader'
import Table from '../components/common/ui/Table'
import StatusBadge from '../components/common/ui/StatusBadge'
import FilterBar from '../components/common/ui/FilterBar'
import AddProductionModal from '../components/production/AddProductionModal'

interface Product { id: string; name: string }

export default function ProductionPage() {
  const [productions, setProductions] = useState<Production[]>([])
  const [products, setProducts] = useState<Product[]>([])
  const [loading, setLoading] = useState(true)
  const [showModal, setShowModal] = useState(false)

  // Filter
  const [search, setSearch] = useState('')
  const [filterStatus, setFilterStatus] = useState('')
  const [filterDateRange, setFilterDateRange] = useState<[Date | null, Date | null]>([null, null])


  const fetchProductions = async () => {
    const res = await api.get('/productions')
    setProductions(res.data.data)
  }

  useEffect(() => {
    const fetchAll = async () => {
      try {
        const [prodRes, productRes] = await Promise.all([
          api.get('/productions'),
          api.get('/products'),
        ])
        setProductions(prodRes.data.data)
        setProducts(productRes.data.data)
      } catch (err) {
        console.error(err)
      } finally {
        setLoading(false)
      }
    }
    fetchAll()
  }, [])


  const hasActiveFilter = !!(search || filterStatus || filterDateRange[0])

  const filteredProductions = productions.filter(p => {
    const matchSearch = p.productName.toLowerCase().includes(search.toLowerCase())
    const matchStatus = !filterStatus || p.status === filterStatus
    const matchDate = (() => {
      if (!filterDateRange[0]) return true
      const date = new Date(p.productionDate)
      const start = filterDateRange[0]!
      const end = filterDateRange[1] ?? filterDateRange[0]!
      return date >= start && date <= end
    })()
    return matchSearch && matchStatus && matchDate
  })

  const columns = [
    { header: 'Produk', field: 'productName' },
    { header: 'Versi Resep', body: (row: Production) => (
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>Versi {row.recipeVersion}</span>
    )},
    { header: 'Qty Produksi', body: (row: Production) => (
      <span style={{ fontWeight: 500 }}>{row.quantityProduced}</span>
    )},
    { header: 'Tgl Produksi', body: (row: Production) => (
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{formatDate(row.productionDate)}</span>
    )},
    { header: 'Status', body: (row: Production) => <StatusBadge status={row.status} /> },
    { header: 'Catatan', body: (row: Production) => (
      <span style={{ fontSize: 12, color: 'var(--muted)' }}>{row.notes || '-'}</span>
    )},
  ]

  return (
    <div>
      <PageHeader
        title="Produksi"
        subtitle={`${productions.length} produksi tercatat`}
        actionLabel="Catat Produksi"
        onAction={() => setShowModal(true)}
      />

      <FilterBar
        config={{
          search: { value: search, onChange: setSearch, placeholder: 'Cari nama produk...' },
          dateRange: { value: filterDateRange, onChange: setFilterDateRange, placeholder: 'Filter tanggal' },
          dropdowns: [{
            value: filterStatus,
            onChange: setFilterStatus,
            options: [
              { label: 'Semua Status', value: '' },
              { label: 'Sukses', value: 'SUCCESS' },
              { label: 'Gagal', value: 'FAILED' },
            ],
            placeholder: 'Status',
          }],
        }}
        onReset={() => { setSearch(''); setFilterStatus(''); setFilterDateRange([null, null]) }}
        hasActiveFilter={hasActiveFilter}
      />

      <Table
        data={filteredProductions}
        columns={columns}
        loading={loading}
        emptyMessage="Belum ada data produksi"
      />

      <AddProductionModal
        visible={showModal}
        onHide={() => setShowModal(false)}
        onSuccess={fetchProductions}
        products={products}
      />
    </div>
  )
}